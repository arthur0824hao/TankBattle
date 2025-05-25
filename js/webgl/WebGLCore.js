/**
 * WebGL 核心功能類別
 * 負責初始化 WebGL context 和基本渲染功能
 */
class WebGLCore {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.gl = null;
        this.currentProgram = null;
        this.buffers = new Map();
        this.textures = new Map();
        this.framebuffers = new Map();
        
        this.init();
    }
    
    init() {
        // 初始化 WebGL context
        this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
        
        if (!this.gl) {
            throw new Error('WebGL not supported');
        }
        
        // 設定基本 WebGL 狀態
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.enable(this.gl.CULL_FACE);
        this.gl.cullFace(this.gl.BACK);
        this.gl.frontFace(this.gl.CCW);
        
        // 設定 viewport
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        
        // 設定清除顏色
        this.gl.clearColor(0.1, 0.1, 0.2, 1.0);
        
        console.log('WebGL initialized successfully');
        console.log('WebGL Version:', this.gl.getParameter(this.gl.VERSION));
        console.log('GLSL Version:', this.gl.getParameter(this.gl.SHADING_LANGUAGE_VERSION));
    }
    
    // 清除畫面
    clear() {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    }
    
    // 設定 viewport
    setViewport(x, y, width, height) {
        this.gl.viewport(x, y, width, height);
    }
    
    // 創建緩衝區
    createBuffer(target = this.gl.ARRAY_BUFFER) {
        return this.gl.createBuffer();
    }
    
    // 綁定緩衝區並設定資料
    setBufferData(buffer, data, target = this.gl.ARRAY_BUFFER, usage = this.gl.STATIC_DRAW) {
        this.gl.bindBuffer(target, buffer);
        this.gl.bufferData(target, data, usage);
    }
    
    // 創建並設定頂點緩衝區
    createVertexBuffer(data, name = null) {
        const buffer = this.createBuffer();
        this.setBufferData(buffer, new Float32Array(data));
        
        if (name) {
            this.buffers.set(name, buffer);
        }
        
        return buffer;
    }
    
    // 創建並設定索引緩衝區
    createIndexBuffer(data, name = null) {
        const buffer = this.createBuffer(this.gl.ELEMENT_ARRAY_BUFFER);
        this.setBufferData(buffer, new Uint16Array(data), this.gl.ELEMENT_ARRAY_BUFFER);
        
        if (name) {
            this.buffers.set(name + '_index', buffer);
        }
        
        return buffer;
    }
    
    // 綁定頂點屬性
    bindVertexAttribute(program, attributeName, buffer, size = 3, type = this.gl.FLOAT, normalized = false, stride = 0, offset = 0) {
        const location = this.gl.getAttribLocation(program, attributeName);
        
        if (location === -1) {
            console.warn(`Attribute ${attributeName} not found in shader`);
            return false;
        }
        
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
        this.gl.enableVertexAttribArray(location);
        this.gl.vertexAttribPointer(location, size, type, normalized, stride, offset);
        return true;
    }
    
    // 設定 uniform 變數
    setUniform(program, name, value, type = 'mat4') {
        const location = this.gl.getUniformLocation(program, name);
        
        if (!location) {
            console.warn(`Uniform ${name} not found in shader`);
            return;
        }
        
        // 確保值存在
        if (value === undefined || value === null) {
            console.warn(`Uniform ${name} has undefined/null value`);
            return;
        }
        
        switch (type) {
            case 'mat4':
                this.gl.uniformMatrix4fv(location, false, value);
                break;
            case 'mat3':
                this.gl.uniformMatrix3fv(location, false, value);
                break;
            case 'vec3':
                // 確保是數組格式
                if (Array.isArray(value)) {
                    this.gl.uniform3fv(location, new Float32Array(value));
                } else {
                    console.warn(`Uniform ${name} expected array for vec3, got:`, value);
                    this.gl.uniform3fv(location, new Float32Array([0, 0, 0]));
                }
                break;
            case 'vec2':
                if (Array.isArray(value)) {
                    this.gl.uniform2fv(location, new Float32Array(value));
                } else {
                    console.warn(`Uniform ${name} expected array for vec2, got:`, value);
                    this.gl.uniform2fv(location, new Float32Array([0, 0]));
                }
                break;
            case 'float':
                this.gl.uniform1f(location, value);
                break;
            case 'int':
            case 'sampler2D':
                this.gl.uniform1i(location, value);
                break;
            case 'bool':
                this.gl.uniform1i(location, value ? 1 : 0);
                break;
            default:
                console.warn(`Unknown uniform type: ${type}`);
        }
    }
    
    // 使用著色器程式
    useProgram(program) {
        if (this.currentProgram !== program) {
            this.gl.useProgram(program);
            this.currentProgram = program;
        }
    }
    
    // 繪製元素
    drawElements(mode = this.gl.TRIANGLES, count, type = this.gl.UNSIGNED_SHORT, offset = 0) {
        this.gl.drawElements(mode, count, type, offset);
    }
    
    // 繪製陣列
    drawArrays(mode = this.gl.TRIANGLES, first = 0, count) {
        this.gl.drawArrays(mode, first, count);
    }
    
    // 創建紋理
    createTexture() {
        return this.gl.createTexture();
    }
    
    // 綁定紋理
    bindTexture(texture, target = this.gl.TEXTURE_2D, unit = 0) {
        this.gl.activeTexture(this.gl.TEXTURE0 + unit);
        this.gl.bindTexture(target, texture);
    }
    
    // 設定紋理參數
    setTextureParameters(target = this.gl.TEXTURE_2D, params = {}) {
        const defaultParams = {
            minFilter: this.gl.LINEAR,
            magFilter: this.gl.LINEAR,
            wrapS: this.gl.CLAMP_TO_EDGE,
            wrapT: this.gl.CLAMP_TO_EDGE
        };
        
        const finalParams = { ...defaultParams, ...params };
        
        this.gl.texParameteri(target, this.gl.TEXTURE_MIN_FILTER, finalParams.minFilter);
        this.gl.texParameteri(target, this.gl.TEXTURE_MAG_FILTER, finalParams.magFilter);
        this.gl.texParameteri(target, this.gl.TEXTURE_WRAP_S, finalParams.wrapS);
        this.gl.texParameteri(target, this.gl.TEXTURE_WRAP_T, finalParams.wrapT);
    }
    
    // 創建 Frame Buffer Object
    createFramebuffer() {
        return this.gl.createFramebuffer();
    }
    
    // 綁定 framebuffer
    bindFramebuffer(framebuffer, target = this.gl.FRAMEBUFFER) {
        this.gl.bindFramebuffer(target, framebuffer);
    }
    
    // 檢查 framebuffer 狀態
    checkFramebufferStatus() {
        const status = this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER);
        if (status !== this.gl.FRAMEBUFFER_COMPLETE) {
            console.error('Framebuffer not complete:', status);
            return false;
        }
        return true;
    }
    
    // 獲取 WebGL 擴展
    getExtension(name) {
        return this.gl.getExtension(name);
    }
    
    // 檢查 WebGL 錯誤
    checkError(operation = '') {
        const error = this.gl.getError();
        if (error !== this.gl.NO_ERROR) {
            let errorString = 'Unknown error';
            switch (error) {
                case this.gl.INVALID_ENUM:
                    errorString = 'INVALID_ENUM';
                    break;
                case this.gl.INVALID_VALUE:
                    errorString = 'INVALID_VALUE';
                    break;
                case this.gl.INVALID_OPERATION:
                    errorString = 'INVALID_OPERATION';
                    break;
                case this.gl.INVALID_FRAMEBUFFER_OPERATION:
                    errorString = 'INVALID_FRAMEBUFFER_OPERATION';
                    break;
                case this.gl.OUT_OF_MEMORY:
                    errorString = 'OUT_OF_MEMORY';
                    break;
                case this.gl.CONTEXT_LOST_WEBGL:
                    errorString = 'CONTEXT_LOST_WEBGL';
                    break;
            }
            console.error(`WebGL Error ${operation}: ${error} (${errorString})`);
            return error;
        }
        return false;
    }
    
    // 獲取 WebGL context
    getContext() {
        return this.gl;
    }
    
    // 獲取 canvas
    getCanvas() {
        return this.canvas;
    }
    
    // 調整 canvas 大小
    resizeCanvas(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.gl.viewport(0, 0, width, height);
    }
    
    // 清理資源
    cleanup() {
        // 刪除緩衝區
        this.buffers.forEach(buffer => {
            this.gl.deleteBuffer(buffer);
        });
        this.buffers.clear();
        
        // 刪除紋理
        this.textures.forEach(texture => {
            this.gl.deleteTexture(texture);
        });
        this.textures.clear();
        
        // 刪除 framebuffer
        this.framebuffers.forEach(framebuffer => {
            this.gl.deleteFramebuffer(framebuffer);
        });
        this.framebuffers.clear();
    }
}