/**
 * 幀緩衝管理器
 * 管理 Frame Buffer Objects (FBO) 用於陰影映射和動態反射
 */
class FrameBuffer {
    constructor(webglCore, textureManager) {
        this.webglCore = webglCore;
        this.gl = webglCore.getContext();
        this.textureManager = textureManager;
        
        // FBO 緩存
        this.framebuffers = new Map();
        
        // 支援檢查
        this.checkSupport();
    }
    
    // 檢查 FBO 支援
    checkSupport() {
        // 檢查深度紋理支援
        const depthTextureExt = this.gl.getExtension('WEBGL_depth_texture');
        if (!depthTextureExt) {
            console.warn('WEBGL_depth_texture extension not supported - shadows may not work properly');
        }
        
        // 檢查浮點紋理支援（用於HDR）
        const floatTextureExt = this.gl.getExtension('OES_texture_float');
        if (!floatTextureExt) {
            console.warn('OES_texture_float extension not supported - HDR effects may be limited');
        }
        
        console.log('FrameBuffer support checked');
    }
    
    // 創建基本 FBO
    createFrameBuffer(name, width, height, options = {}) {
        if (this.framebuffers.has(name)) {
            console.warn(`FrameBuffer ${name} already exists`);
            return this.framebuffers.get(name);
        }
        
        const fbo = {
            name: name,
            width: width,
            height: height,
            framebuffer: this.gl.createFramebuffer(),
            colorTexture: null,
            depthTexture: null,
            depthBuffer: null,
            options: options
        };
        
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, fbo.framebuffer);
        
        // 創建顏色紋理
        if (options.colorTexture !== false) {
            fbo.colorTexture = this.createColorTexture(width, height, options);
            this.gl.framebufferTexture2D(
                this.gl.FRAMEBUFFER,
                this.gl.COLOR_ATTACHMENT0,
                this.gl.TEXTURE_2D,
                fbo.colorTexture,
                0
            );
        }
        
        // 創建深度附件
        if (options.depthTexture) {
            fbo.depthTexture = this.createDepthTexture(width, height);
            this.gl.framebufferTexture2D(
                this.gl.FRAMEBUFFER,
                this.gl.DEPTH_ATTACHMENT,
                this.gl.TEXTURE_2D,
                fbo.depthTexture,
                0
            );
        } else if (options.depthBuffer !== false) {
            fbo.depthBuffer = this.createDepthBuffer(width, height);
            this.gl.framebufferRenderbuffer(
                this.gl.FRAMEBUFFER,
                this.gl.DEPTH_ATTACHMENT,
                this.gl.RENDERBUFFER,
                fbo.depthBuffer
            );
        }
        
        // 檢查 FBO 完整性
        if (!this.checkFramebufferStatus()) {
            console.error(`Failed to create framebuffer: ${name}`);
            this.cleanup(fbo);
            return null;
        }
        
        // 恢復預設 FBO
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
        
        this.framebuffers.set(name, fbo);
        console.log(`FrameBuffer created: ${name} (${width}x${height})`);
        
        return fbo;
    }
    
    // 創建陰影貼圖 FBO
    createShadowMapFBO(name, size = 2048) {
        return this.createFrameBuffer(name, size, size, {
            colorTexture: false,
            depthTexture: true,
            depthBuffer: false
        });
    }
    
    // 創建反射 FBO
    createReflectionFBO(name, width = 512, height = 512) {
        return this.createFrameBuffer(name, width, height, {
            colorTexture: true,
            depthTexture: false,
            depthBuffer: true
        });
    }
    
    // 創建 Cube Map FBO（用於環境反射）
    createCubeMapFBO(name, size = 256) {
        const fbo = {
            name: name,
            size: size,
            framebuffer: this.gl.createFramebuffer(),
            cubeTexture: this.createCubeTexture(size),
            depthBuffer: this.createDepthBuffer(size, size)
        };
        
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, fbo.framebuffer);
        
        // 附加深度緩衝區
        this.gl.framebufferRenderbuffer(
            this.gl.FRAMEBUFFER,
            this.gl.DEPTH_ATTACHMENT,
            this.gl.RENDERBUFFER,
            fbo.depthBuffer
        );
        
        // 檢查完整性
        if (!this.checkFramebufferStatus()) {
            console.error(`Failed to create cube map framebuffer: ${name}`);
            this.cleanup(fbo);
            return null;
        }
        
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
        this.framebuffers.set(name, fbo);
        
        console.log(`Cube Map FBO created: ${name} (${size}x${size})`);
        return fbo;
    }
    
    // 創建顏色紋理
    createColorTexture(width, height, options = {}) {
        const texture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        
        const format = options.format || this.gl.RGBA;
        const type = options.type || this.gl.UNSIGNED_BYTE;
        
        this.gl.texImage2D(
            this.gl.TEXTURE_2D, 0, format, width, height, 0,
            format, type, null
        );
        
        // 設定過濾參數
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, 
                             options.minFilter || this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, 
                             options.magFilter || this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, 
                             options.wrapS || this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, 
                             options.wrapT || this.gl.CLAMP_TO_EDGE);
        
        return texture;
    }
    
    // 創建深度紋理
    createDepthTexture(width, height) {
        const texture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        
        this.gl.texImage2D(
            this.gl.TEXTURE_2D, 0, this.gl.DEPTH_COMPONENT, width, height, 0,
            this.gl.DEPTH_COMPONENT, this.gl.UNSIGNED_SHORT, null
        );
        
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        
        return texture;
    }
    
    // 創建深度緩衝區
    createDepthBuffer(width, height) {
        const depthBuffer = this.gl.createRenderbuffer();
        this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, depthBuffer);
        this.gl.renderbufferStorage(this.gl.RENDERBUFFER, this.gl.DEPTH_COMPONENT16, width, height);
        return depthBuffer;
    }
    
    // 創建 Cube 紋理
    createCubeTexture(size) {
        const texture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, texture);
        
        const faces = [
            this.gl.TEXTURE_CUBE_MAP_POSITIVE_X,
            this.gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
            this.gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
            this.gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
            this.gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
            this.gl.TEXTURE_CUBE_MAP_NEGATIVE_Z
        ];
        
        faces.forEach(face => {
            this.gl.texImage2D(face, 0, this.gl.RGBA, size, size, 0,
                              this.gl.RGBA, this.gl.UNSIGNED_BYTE, null);
        });
        
        this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_WRAP_R, this.gl.CLAMP_TO_EDGE);
        
        return texture;
    }
    
    // 綁定 FBO
    bind(name) {
        const fbo = this.framebuffers.get(name);
        if (!fbo) {
            console.error(`FrameBuffer not found: ${name}`);
            return false;
        }
        
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, fbo.framebuffer);
        this.gl.viewport(0, 0, fbo.width, fbo.height);
        
        return true;
    }
    
    // 綁定 Cube Map FBO 的特定面
    bindCubeMapFace(name, face) {
        const fbo = this.framebuffers.get(name);
        if (!fbo || !fbo.cubeTexture) {
            console.error(`Cube Map FBO not found: ${name}`);
            return false;
        }
        
        const faces = [
            this.gl.TEXTURE_CUBE_MAP_POSITIVE_X,
            this.gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
            this.gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
            this.gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
            this.gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
            this.gl.TEXTURE_CUBE_MAP_NEGATIVE_Z
        ];
        
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, fbo.framebuffer);
        this.gl.framebufferTexture2D(
            this.gl.FRAMEBUFFER,
            this.gl.COLOR_ATTACHMENT0,
            faces[face],
            fbo.cubeTexture,
            0
        );
        this.gl.viewport(0, 0, fbo.size, fbo.size);
        
        return true;
    }
    
    // 解綁 FBO（恢復預設）
    unbind() {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
        
        // 恢復畫布視窗
        const canvas = this.webglCore.getCanvas();
        this.gl.viewport(0, 0, canvas.width, canvas.height);
    }
    
    // 綁定紋理用於讀取
    bindTexture(name, unit = 0, target = 'color') {
        const fbo = this.framebuffers.get(name);
        if (!fbo) {
            console.error(`FrameBuffer not found: ${name}`);
            return false;
        }
        
        this.gl.activeTexture(this.gl.TEXTURE0 + unit);
        
        switch (target) {
            case 'color':
                if (fbo.colorTexture) {
                    this.gl.bindTexture(this.gl.TEXTURE_2D, fbo.colorTexture);
                    return true;
                }
                break;
            case 'depth':
                if (fbo.depthTexture) {
                    this.gl.bindTexture(this.gl.TEXTURE_2D, fbo.depthTexture);
                    return true;
                }
                break;
            case 'cube':
                if (fbo.cubeTexture) {
                    this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, fbo.cubeTexture);
                    return true;
                }
                break;
        }
        
        console.error(`Texture target not available: ${target} in ${name}`);
        return false;
    }
    
    // 檢查 FBO 狀態
    checkFramebufferStatus() {
        const status = this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER);
        
        switch (status) {
            case this.gl.FRAMEBUFFER_COMPLETE:
                return true;
            case this.gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT:
                console.error('Framebuffer incomplete: Attachment');
                break;
            case this.gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT:
                console.error('Framebuffer incomplete: Missing attachment');
                break;
            case this.gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS:
                console.error('Framebuffer incomplete: Dimensions');
                break;
            case this.gl.FRAMEBUFFER_UNSUPPORTED:
                console.error('Framebuffer incomplete: Unsupported');
                break;
            default:
                console.error('Framebuffer incomplete: Unknown error');
        }
        
        return false;
    }
    
    // 調整 FBO 大小
    resize(name, width, height) {
        const fbo = this.framebuffers.get(name);
        if (!fbo) {
            console.error(`FrameBuffer not found: ${name}`);
            return false;
        }
        
        fbo.width = width;
        fbo.height = height;
        
        // 調整顏色紋理
        if (fbo.colorTexture) {
            this.gl.bindTexture(this.gl.TEXTURE_2D, fbo.colorTexture);
            this.gl.texImage2D(
                this.gl.TEXTURE_2D, 0, this.gl.RGBA, width, height, 0,
                this.gl.RGBA, this.gl.UNSIGNED_BYTE, null
            );
        }
        
        // 調整深度紋理
        if (fbo.depthTexture) {
            this.gl.bindTexture(this.gl.TEXTURE_2D, fbo.depthTexture);
            this.gl.texImage2D(
                this.gl.TEXTURE_2D, 0, this.gl.DEPTH_COMPONENT, width, height, 0,
                this.gl.DEPTH_COMPONENT, this.gl.UNSIGNED_SHORT, null
            );
        }
        
        // 調整深度緩衝區
        if (fbo.depthBuffer) {
            this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, fbo.depthBuffer);
            this.gl.renderbufferStorage(this.gl.RENDERBUFFER, this.gl.DEPTH_COMPONENT16, width, height);
        }
        
        console.log(`FrameBuffer resized: ${name} (${width}x${height})`);
        return true;
    }
    
    // 清除 FBO 內容
    clear(name, clearColor = [0, 0, 0, 1], clearDepth = 1.0) {
        if (this.bind(name)) {
            this.gl.clearColor(clearColor[0], clearColor[1], clearColor[2], clearColor[3]);
            this.gl.clearDepth(clearDepth);
            this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
            this.unbind();
        }
    }
    
    // 獲取 FBO
    get(name) {
        return this.framebuffers.get(name);
    }
    
    // 刪除 FBO
    delete(name) {
        const fbo = this.framebuffers.get(name);
        if (fbo) {
            this.cleanup(fbo);
            this.framebuffers.delete(name);
            console.log(`FrameBuffer deleted: ${name}`);
            return true;
        }
        return false;
    }
    
    // 清理 FBO 資源
    cleanup(fbo) {
        if (fbo.framebuffer) {
            this.gl.deleteFramebuffer(fbo.framebuffer);
        }
        if (fbo.colorTexture) {
            this.gl.deleteTexture(fbo.colorTexture);
        }
        if (fbo.depthTexture) {
            this.gl.deleteTexture(fbo.depthTexture);
        }
        if (fbo.cubeTexture) {
            this.gl.deleteTexture(fbo.cubeTexture);
        }
        if (fbo.depthBuffer) {
            this.gl.deleteRenderbuffer(fbo.depthBuffer);
        }
    }
    
    // 清理所有 FBO
    cleanupAll() {
        this.framebuffers.forEach((fbo, name) => {
            this.cleanup(fbo);
        });
        this.framebuffers.clear();
        console.log('All FrameBuffers cleaned up');
    }
    
    // 獲取統計資訊
    getStats() {
        return {
            framebuffers: this.framebuffers.size,
            names: Array.from(this.framebuffers.keys())
        };
    }
}