/**
 * 紋理管理器
 * 負責載入、管理和應用 2D 紋理和 Cube Map
 */
class TextureManager {
    constructor(webglCore) {
        this.webglCore = webglCore;
        this.gl = webglCore.getContext();
        
        // 紋理緩存
        this.textures = new Map();
        this.cubeMaps = new Map();
        
        // 載入狀態
        this.loadingTextures = new Set();
        this.loadedTextures = new Set();
        
        // 預設紋理
        this.defaultTexture = null;
        this.defaultCubeMap = null;
        
        // 紋理單元管理
        this.maxTextureUnits = this.gl.getParameter(this.gl.MAX_TEXTURE_IMAGE_UNITS);
        this.activeTextureUnit = 0;
        
        this.initDefaultTextures();
    }
    
    // 初始化預設紋理
    initDefaultTextures() {
        // 創建 1x1 白色預設紋理
        this.defaultTexture = this.createSolidColorTexture([255, 255, 255, 255]);
        this.textures.set('default', this.defaultTexture);
        
        // 創建預設 cube map
        this.defaultCubeMap = this.createSolidColorCubeMap([128, 180, 255, 255]); // 天空藍
        this.cubeMaps.set('default', this.defaultCubeMap);
        
        console.log('Default textures created');
    }
    
    // 創建純色紋理
    createSolidColorTexture(color, width = 1, height = 1) {
        const texture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        
        // 創建像素資料
        const pixels = new Uint8Array(width * height * 4);
        for (let i = 0; i < pixels.length; i += 4) {
            pixels[i] = color[0];     // R
            pixels[i + 1] = color[1]; // G
            pixels[i + 2] = color[2]; // B
            pixels[i + 3] = color[3]; // A
        }
        
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, width, height, 0, 
                          this.gl.RGBA, this.gl.UNSIGNED_BYTE, pixels);
        
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        
        return texture;
    }
    
    // 創建純色 cube map
    createSolidColorCubeMap(color, size = 1) {
        const texture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, texture);
        
        const pixels = new Uint8Array(size * size * 4);
        for (let i = 0; i < pixels.length; i += 4) {
            pixels[i] = color[0];
            pixels[i + 1] = color[1];
            pixels[i + 2] = color[2];
            pixels[i + 3] = color[3];
        }
        
        // 為六個面設定相同的資料
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
                              this.gl.RGBA, this.gl.UNSIGNED_BYTE, pixels);
        });
        
        this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_WRAP_R, this.gl.CLAMP_TO_EDGE);
        
        return texture;
    }

    // 創建動態 Cube Map（用於即時反射）
    createDynamicCubeMap(size = 512) {
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
        
        // 為每個面創建空紋理
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
    
    // 更新動態 Cube Map 的某一面
    updateCubeMapFace(cubeMapTexture, face, imageData, size) {
        this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, cubeMapTexture);
        this.gl.texSubImage2D(face, 0, 0, 0, size, size, this.gl.RGBA, this.gl.UNSIGNED_BYTE, imageData);
    }

    // 載入 2D 紋理
    async loadTexture(name, url, options = {}) {
        if (this.textures.has(name)) {
            return this.textures.get(name);
        }
        
        if (this.loadingTextures.has(name)) {
            // 等待已在載入的紋理
            return new Promise((resolve) => {
                const checkLoaded = () => {
                    if (this.textures.has(name)) {
                        resolve(this.textures.get(name));
                    } else {
                        setTimeout(checkLoaded, 50);
                    }
                };
                checkLoaded();
            });
        }
        
        this.loadingTextures.add(name);
        
        try {
            const image = await this.loadImage(url);
            const texture = this.createTextureFromImage(image, options);
            
            this.textures.set(name, texture);
            this.loadedTextures.add(name);
            this.loadingTextures.delete(name);
            
            console.log(`Texture loaded: ${name}`);
            return texture;
            
        } catch (error) {
            console.error(`Failed to load texture ${name}:`, error);
            this.loadingTextures.delete(name);
            return this.defaultTexture;
        }
    }
    
    // 載入 Cube Map
    async loadCubeMap(name, urls, options = {}) {
        if (this.cubeMaps.has(name)) {
            return this.cubeMaps.get(name);
        }
        
        if (this.loadingTextures.has(name)) {
            return new Promise((resolve) => {
                const checkLoaded = () => {
                    if (this.cubeMaps.has(name)) {
                        resolve(this.cubeMaps.get(name));
                    } else {
                        setTimeout(checkLoaded, 50);
                    }
                };
                checkLoaded();
            });
        }
        
        this.loadingTextures.add(name);
        
        try {
            // 載入六個面的圖片
            const faces = ['px', 'nx', 'py', 'ny', 'pz', 'nz']; // +X, -X, +Y, -Y, +Z, -Z
            const images = await Promise.all(
                faces.map(face => this.loadImage(urls[face]))
            );
            
            const cubeMap = this.createCubeMapFromImages(images, options);
            
            this.cubeMaps.set(name, cubeMap);
            this.loadedTextures.add(name);
            this.loadingTextures.delete(name);
            
            console.log(`Cube map loaded: ${name}`);
            return cubeMap;
            
        } catch (error) {
            console.error(`Failed to load cube map ${name}:`, error);
            this.loadingTextures.delete(name);
            return this.defaultCubeMap;
        }
    }
    
    // 載入圖片
    loadImage(url) {
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.crossOrigin = 'anonymous';
            image.onload = () => resolve(image);
            image.onerror = () => reject(new Error(`Failed to load image: ${url}`));
            image.src = url;
        });
    }
    
    // 從圖片創建紋理
    createTextureFromImage(image, options = {}) {
        const texture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        
        // 上傳圖片資料
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, 
                          this.gl.UNSIGNED_BYTE, image);
        
        // 設定紋理參數
        const params = {
            minFilter: this.gl.LINEAR_MIPMAP_LINEAR,
            magFilter: this.gl.LINEAR,
            wrapS: this.gl.REPEAT,
            wrapT: this.gl.REPEAT,
            generateMipmap: true,
            ...options
        };
        
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, params.minFilter);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, params.magFilter);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, params.wrapS);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, params.wrapT);
        
        if (params.generateMipmap && this.isPowerOfTwo(image.width) && this.isPowerOfTwo(image.height)) {
            this.gl.generateMipmap(this.gl.TEXTURE_2D);
        }
        
        return texture;
    }
    
    // 從圖片陣列創建 Cube Map
    createCubeMapFromImages(images, options = {}) {
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
        
        // 上傳每個面的圖片資料
        faces.forEach((face, index) => {
            this.gl.texImage2D(face, 0, this.gl.RGBA, this.gl.RGBA, 
                              this.gl.UNSIGNED_BYTE, images[index]);
        });
        
        // 設定紋理參數
        const params = {
            minFilter: this.gl.LINEAR,
            magFilter: this.gl.LINEAR,
            wrapS: this.gl.CLAMP_TO_EDGE,
            wrapT: this.gl.CLAMP_TO_EDGE,
            wrapR: this.gl.CLAMP_TO_EDGE,
            ...options
        };
        
        this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_MIN_FILTER, params.minFilter);
        this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_MAG_FILTER, params.magFilter);
        this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_WRAP_S, params.wrapS);
        this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_WRAP_T, params.wrapT);
        this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_WRAP_R, params.wrapR);
        
        return texture;
    }
    
    // 綁定 2D 紋理
    bindTexture(name, unit = 0) {
        const texture = this.textures.get(name) || this.defaultTexture;
        
        this.gl.activeTexture(this.gl.TEXTURE0 + unit);
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        
        return unit;
    }
    
    // 綁定 Cube Map
    bindCubeMap(name, unit = 0) {
        const cubeMap = this.cubeMaps.get(name) || this.defaultCubeMap;
        
        this.gl.activeTexture(this.gl.TEXTURE0 + unit);
        this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, cubeMap);
        
        return unit;
    }

    // 綁定Cube Map到指定紋理單元
    bindCubeMap(name, textureUnit = 0) {
        const cubeMap = this.cubeMaps.get(name);
        if (cubeMap) {
            this.gl.activeTexture(this.gl.TEXTURE0 + textureUnit);
            this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, cubeMap);
            return true;
        } else {
            console.warn(`Cube map '${name}' not found`);
            return false;
        }
    }

    // 獲取Cube Map
    getCubeMap(name) {
        return this.cubeMaps.get(name);
    }
    
    // 創建空的 2D 紋理（用於 FBO）
    createEmptyTexture(width, height, format = null, type = null) {
        const texture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        
        const internalFormat = format || this.gl.RGBA;
        const dataFormat = format || this.gl.RGBA;
        const dataType = type || this.gl.UNSIGNED_BYTE;
        
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, internalFormat, width, height, 0,
                          dataFormat, dataType, null);
        
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        
        return texture;
    }
    
    // 創建深度紋理（用於陰影貼圖）
    createDepthTexture(width, height) {
        const texture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.DEPTH_COMPONENT, width, height, 0,
                          this.gl.DEPTH_COMPONENT, this.gl.UNSIGNED_SHORT, null);
        
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        
        return texture;
    }
    
    // 檢查是否為2的幂
    isPowerOfTwo(value) {
        return (value & (value - 1)) === 0;
    }
    
    // 獲取紋理
    getTexture(name) {
        return this.textures.get(name) || this.defaultTexture;
    }
    
    // 獲取 Cube Map
    getCubeMap(name) {
        return this.cubeMaps.get(name) || this.defaultCubeMap;
    }
    
    // 檢查紋理是否已載入
    isTextureLoaded(name) {
        return this.loadedTextures.has(name);
    }
    
    // 檢查紋理是否正在載入
    isTextureLoading(name) {
        return this.loadingTextures.has(name);
    }
    
    // 移除紋理
    removeTexture(name) {
        if (this.textures.has(name)) {
            const texture = this.textures.get(name);
            this.gl.deleteTexture(texture);
            this.textures.delete(name);
            this.loadedTextures.delete(name);
            return true;
        }
        return false;
    }
    
    // 移除 Cube Map
    removeCubeMap(name) {
        if (this.cubeMaps.has(name)) {
            const cubeMap = this.cubeMaps.get(name);
            this.gl.deleteTexture(cubeMap);
            this.cubeMaps.delete(name);
            this.loadedTextures.delete(name);
            return true;
        }
        return false;
    }
    
    // 獲取載入進度
    getLoadingProgress() {
        const total = this.loadingTextures.size + this.loadedTextures.size;
        const loaded = this.loadedTextures.size;
        return total > 0 ? loaded / total : 1.0;
    }
    
    // 獲取統計資訊
    getStats() {
        return {
            textures: this.textures.size,
            cubeMaps: this.cubeMaps.size,
            loading: this.loadingTextures.size,
            loaded: this.loadedTextures.size,
            maxTextureUnits: this.maxTextureUnits
        };
    }
    
    // 清除所有紋理
    cleanup() {
        // 刪除所有 2D 紋理
        this.textures.forEach((texture, name) => {
            if (name !== 'default') {
                this.gl.deleteTexture(texture);
            }
        });
        
        // 刪除所有 Cube Map
        this.cubeMaps.forEach((cubeMap, name) => {
            if (name !== 'default') {
                this.gl.deleteTexture(cubeMap);
            }
        });
        
        // 只保留預設紋理
        const defaultTexture = this.textures.get('default');
        const defaultCubeMap = this.cubeMaps.get('default');
        
        this.textures.clear();
        this.cubeMaps.clear();
        this.loadingTextures.clear();
        this.loadedTextures.clear();
        
        if (defaultTexture) {
            this.textures.set('default', defaultTexture);
        }
        if (defaultCubeMap) {
            this.cubeMaps.set('default', defaultCubeMap);
        }
        
        console.log('Texture manager cleaned up');
    }
}