/**
 * 幀緩衝區管理器
 * 管理 FBO (Frame Buffer Objects) 用於陰影映射和反射
 */
class FrameBuffer {
    constructor(webglCore, textureManager) {
        this.webglCore = webglCore;
        this.gl = webglCore.getContext();
        this.textureManager = textureManager;
        
        // 儲存所有 FBO
        this.frameBuffers = new Map();
        this.currentFrameBuffer = null;
        
        // 檢查 FBO 支援
        this.checkSupport();
        
        console.log('FrameBuffer manager initialized');
    }
    
    // 檢查 FBO 支援
    checkSupport() {
        // 檢查深度紋理擴展
        if (!this.gl.getExtension('WEBGL_depth_texture')) {
            console.warn('WEBGL_depth_texture extension not supported, shadows may not work');
        }
        
        // 檢查浮點紋理支援
        if (!this.gl.getExtension('OES_texture_float')) {
            console.warn('OES_texture_float extension not supported');
        }
        
        console.log('FrameBuffer support checked');
    }
    
    // 創建陰影貼圖 FBO
    createShadowMapFBO(name, size = 2048) {
        const framebuffer = this.gl.createFramebuffer();
        
        // 創建深度紋理
        const depthTexture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, depthTexture);
        this.gl.texImage2D(
            this.gl.TEXTURE_2D, 
            0, 
            this.gl.DEPTH_COMPONENT, 
            size, 
            size, 
            0, 
            this.gl.DEPTH_COMPONENT, 
            this.gl.UNSIGNED_SHORT, 
            null
        );
        
        // 設定深度紋理參數
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        
        // 綁定 FBO
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebuffer);
        
        // 附加深度紋理到 FBO
        this.gl.framebufferTexture2D(
            this.gl.FRAMEBUFFER, 
            this.gl.DEPTH_ATTACHMENT, 
            this.gl.TEXTURE_2D, 
            depthTexture, 
            0
        );
        
        // 告訴 WebGL 不繪製顏色
        this.gl.drawBuffers ? this.gl.drawBuffers([this.gl.NONE]) : null;
        this.gl.readBuffer ? this.gl.readBuffer(this.gl.NONE) : null;
        
        // 檢查 FBO 完整性
        if (this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER) !== this.gl.FRAMEBUFFER_COMPLETE) {
            console.error('Shadow map framebuffer is not complete');
            this.gl.deleteFramebuffer(framebuffer);
            this.gl.deleteTexture(depthTexture);
            return null;
        }
        
        // 解綁 FBO
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
        
        const fboData = {
            framebuffer: framebuffer,
            depthTexture: depthTexture,
            width: size,
            height: size,
            type: 'shadow'
        };
        
        this.frameBuffers.set(name, fboData);
        
        console.log(`Shadow map FBO '${name}' created: ${size}x${size}`);
        return fboData;
    }
    
    // 創建顏色紋理 FBO（用於其他效果）
    createColorFBO(name, width, height, format = this.gl.RGBA) {
        const framebuffer = this.gl.createFramebuffer();
        
        // 創建顏色紋理
        const colorTexture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, colorTexture);
        this.gl.texImage2D(
            this.gl.TEXTURE_2D, 
            0, 
            format, 
            width, 
            height, 
            0, 
            format, 
            this.gl.UNSIGNED_BYTE, 
            null
        );
        
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        
        // 創建深度緩衝區
        const depthBuffer = this.gl.createRenderbuffer();
        this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, depthBuffer);
        this.gl.renderbufferStorage(this.gl.RENDERBUFFER, this.gl.DEPTH_COMPONENT16, width, height);
        
        // 綁定 FBO
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebuffer);
        
        // 附加紋理和深度緩衝區
        this.gl.framebufferTexture2D(
            this.gl.FRAMEBUFFER, 
            this.gl.COLOR_ATTACHMENT0, 
            this.gl.TEXTURE_2D, 
            colorTexture, 
            0
        );
        this.gl.framebufferRenderbuffer(
            this.gl.FRAMEBUFFER, 
            this.gl.DEPTH_ATTACHMENT, 
            this.gl.RENDERBUFFER, 
            depthBuffer
        );
        
        // 檢查 FBO 完整性
        if (this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER) !== this.gl.FRAMEBUFFER_COMPLETE) {
            console.error('Color framebuffer is not complete');
            this.gl.deleteFramebuffer(framebuffer);
            this.gl.deleteTexture(colorTexture);
            this.gl.deleteRenderbuffer(depthBuffer);
            return null;
        }
        
        // 解綁 FBO
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
        this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, null);
        
        const fboData = {
            framebuffer: framebuffer,
            colorTexture: colorTexture,
            depthBuffer: depthBuffer,
            width: width,
            height: height,
            type: 'color'
        };
        
        this.frameBuffers.set(name, fboData);
        
        console.log(`Color FBO '${name}' created: ${width}x${height}`);
        return fboData;
    }
    
    // 綁定 FBO
    bind(name) {
        const fboData = this.frameBuffers.get(name);
        if (!fboData) {
            console.error(`FrameBuffer '${name}' not found`);
            return false;
        }
        
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, fboData.framebuffer);
        this.gl.viewport(0, 0, fboData.width, fboData.height);
        
        this.currentFrameBuffer = fboData;
        return true;
    }
    
    // 解綁 FBO（回到主畫面）
    unbind() {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
        
        // 恢復主畫面視窗
        const canvas = this.webglCore.getCanvas();
        this.gl.viewport(0, 0, canvas.width, canvas.height);
        
        this.currentFrameBuffer = null;
    }
    
    // 獲取 FBO 資料
    getFBO(name) {
        return this.frameBuffers.get(name);
    }
    
    // 檢查 FBO 是否存在
    hasFBO(name) {
        return this.frameBuffers.has(name);
    }
    
    // 綁定 FBO 的紋理到指定紋理單元
    bindFBOTexture(name, unit = 0, textureType = 'depth') {
        const fboData = this.frameBuffers.get(name);
        if (!fboData) {
            console.error(`FrameBuffer '${name}' not found`);
            return false;
        }
        
        this.gl.activeTexture(this.gl.TEXTURE0 + unit);
        
        if (textureType === 'depth' && fboData.depthTexture) {
            this.gl.bindTexture(this.gl.TEXTURE_2D, fboData.depthTexture);
        } else if (textureType === 'color' && fboData.colorTexture) {
            this.gl.bindTexture(this.gl.TEXTURE_2D, fboData.colorTexture);
        } else {
            console.error(`Texture type '${textureType}' not available for FBO '${name}'`);
            return false;
        }
        
        return true;
    }
    
    // 調整 FBO 大小
    resize(name, width, height) {
        const fboData = this.frameBuffers.get(name);
        if (!fboData) {
            console.error(`FrameBuffer '${name}' not found`);
            return false;
        }
        
        // 刪除舊的 FBO
        this.delete(name);
        
        // 創建新的 FBO
        if (fboData.type === 'shadow') {
            this.createShadowMapFBO(name, Math.max(width, height));
        } else if (fboData.type === 'color') {
            this.createColorFBO(name, width, height);
        }
        
        console.log(`FrameBuffer '${name}' resized to ${width}x${height}`);
        return true;
    }
    
    // 刪除 FBO
    delete(name) {
        const fboData = this.frameBuffers.get(name);
        if (!fboData) {
            return false;
        }
        
        // 清理 WebGL 資源
        this.gl.deleteFramebuffer(fboData.framebuffer);
        
        if (fboData.depthTexture) {
            this.gl.deleteTexture(fboData.depthTexture);
        }
        
        if (fboData.colorTexture) {
            this.gl.deleteTexture(fboData.colorTexture);
        }
        
        if (fboData.depthBuffer) {
            this.gl.deleteRenderbuffer(fboData.depthBuffer);
        }
        
        this.frameBuffers.delete(name);
        
        console.log(`FrameBuffer '${name}' deleted`);
        return true;
    }
    
    // 清理所有 FBO
    cleanup() {
        for (const name of this.frameBuffers.keys()) {
            this.delete(name);
        }
        
        this.currentFrameBuffer = null;
        console.log('All FrameBuffers cleaned up');
    }
    
    // 獲取當前綁定的 FBO
    getCurrentFBO() {
        return this.currentFrameBuffer;
    }
    
    // 檢查 FBO 錯誤
    checkFramebufferError(name = 'current') {
        const status = this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER);
        
        if (status !== this.gl.FRAMEBUFFER_COMPLETE) {
            let errorMessage = `FrameBuffer '${name}' error: `;
            
            switch (status) {
                case this.gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT:
                    errorMessage += 'INCOMPLETE_ATTACHMENT';
                    break;
                case this.gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT:
                    errorMessage += 'MISSING_ATTACHMENT';
                    break;
                case this.gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS:
                    errorMessage += 'INCOMPLETE_DIMENSIONS';
                    break;
                case this.gl.FRAMEBUFFER_UNSUPPORTED:
                    errorMessage += 'UNSUPPORTED';
                    break;
                default:
                    errorMessage += 'UNKNOWN';
            }
            
            console.error(errorMessage);
            return false;
        }
        
        return true;
    }
    
    // 獲取 FBO 統計資訊
    getStats() {
        const stats = {
            totalFBOs: this.frameBuffers.size,
            shadowMaps: 0,
            colorBuffers: 0,
            totalMemory: 0 // 估算記憶體使用量（bytes）
        };
        
        for (const fboData of this.frameBuffers.values()) {
            if (fboData.type === 'shadow') {
                stats.shadowMaps++;
                stats.totalMemory += fboData.width * fboData.height * 2; // 深度紋理 16-bit
            } else if (fboData.type === 'color') {
                stats.colorBuffers++;
                stats.totalMemory += fboData.width * fboData.height * 4; // RGBA 32-bit
            }
        }
        
        return stats;
    }
    
    // 除錯：列出所有 FBO
    listFBOs() {
        console.log('=== FrameBuffer List ===');
        for (const [name, fboData] of this.frameBuffers.entries()) {
            console.log(`${name}: ${fboData.type} ${fboData.width}x${fboData.height}`);
        }
        console.log(`Total: ${this.frameBuffers.size} FBOs`);
    }
}