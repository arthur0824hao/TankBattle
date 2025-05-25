/**
 * 陰影渲染器
 * 實現陰影映射技術
 */
class ShadowRenderer {
    constructor(webglCore, shaderManager, frameBuffer, lighting) {
        this.webglCore = webglCore;
        this.gl = webglCore.getContext();
        this.shaderManager = shaderManager;
        this.frameBuffer = frameBuffer;
        this.lighting = lighting;
        
        // 陰影設定
        this.shadowMapSize = 2048;
        this.shadowFBO = null;
        this.shadowMapTexture = null;
        
        // 渲染狀態
        this.enabled = true;
        this.bias = 0.005;
        this.softShadows = true;
        this.shadowQuality = 'high'; // 'low', 'medium', 'high'
        
        // 光源視圖參數
        this.lightViewMatrix = MatrixLib.identity();
        this.lightProjectionMatrix = MatrixLib.identity();
        this.lightSpaceMatrix = MatrixLib.identity();
        
        // 可渲染物件列表
        this.shadowCasters = [];
        
        this.init();
    }
    
    // 初始化陰影系統
    init() {
        // 創建陰影貼圖 FBO
        this.shadowFBO = this.frameBuffer.createShadowMapFBO('shadowMap', this.shadowMapSize);
        
        if (!this.shadowFBO) {
            console.error('Failed to create shadow map FBO');
            this.enabled = false;
            return;
        }
        
        this.shadowMapTexture = this.shadowFBO.depthTexture;
        
        // 更新光源矩陣
        this.updateLightMatrices();
        
        console.log('Shadow renderer initialized');
    }
    
    // 更新光源矩陣
    updateLightMatrices() {
        const lightPos = this.lighting.getMainLight().position;
        const lightTarget = [0, 0, 0]; // 看向場景中心
        const lightUp = [0, 0, 1];
        
        // 光源視圖矩陣
        this.lightViewMatrix = MatrixLib.lookAt(lightPos, lightTarget, lightUp);
        
        // 光源投影矩陣（正交投影）
        const shadowDistance = 1200;
        const shadowSize = 1000;
        this.lightProjectionMatrix = MatrixLib.orthographic(
            -shadowSize, shadowSize, 
            -shadowSize, shadowSize, 
            1, shadowDistance
        );
        
        // 光空間矩陣
        this.lightSpaceMatrix = MatrixLib.multiply(
            this.lightProjectionMatrix, 
            this.lightViewMatrix
        );
    }
    
    // 添加陰影投射物件
    addShadowCaster(object) {
        if (!this.shadowCasters.includes(object)) {
            this.shadowCasters.push(object);
        }
    }
    
    // 移除陰影投射物件
    removeShadowCaster(object) {
        const index = this.shadowCasters.indexOf(object);
        if (index > -1) {
            this.shadowCasters.splice(index, 1);
        }
    }
    
    // 渲染陰影貼圖
    renderShadowMap() {
        if (!this.enabled || !this.shadowFBO) return;
        
        // 更新光源矩陣
        this.updateLightMatrices();
        
        // 綁定陰影 FBO
        this.frameBuffer.bind('shadowMap');
        
        // 清除陰影貼圖
        this.gl.clear(this.gl.DEPTH_BUFFER_BIT);
        
        // 設定渲染狀態
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.enable(this.gl.CULL_FACE);
        this.gl.cullFace(this.gl.FRONT); // 渲染背面以減少 shadow acne
        
        // 使用陰影著色器
        const shadowProgram = this.shaderManager.useProgram('shadow');
        if (!shadowProgram) {
            this.frameBuffer.unbind();
            return;
        }
        
        // 設定光空間矩陣
        this.webglCore.setUniform(shadowProgram, 'uLightSpaceMatrix', this.lightSpaceMatrix, 'mat4');
        
        // 渲染所有陰影投射物件
        this.shadowCasters.forEach(caster => {
            if (caster && typeof caster.renderShadow === 'function') {
                caster.renderShadow(shadowProgram);
            } else if (caster && typeof caster.render === 'function') {
                // 如果物件沒有專門的陰影渲染函數，使用一般渲染
                this.renderObjectForShadow(caster, shadowProgram);
            }
        });
        
        // 恢復渲染狀態
        this.gl.cullFace(this.gl.BACK);
        
        // 解綁 FBO
        this.frameBuffer.unbind();
    }
    
    // 為陰影渲染物件
    renderObjectForShadow(object, program) {
        if (!object.geometry || !object.getModelMatrix) return;
        
        const modelMatrix = object.getModelMatrix();
        this.webglCore.setUniform(program, 'uModelMatrix', modelMatrix, 'mat4');
        
        const geometry = object.geometry;
        
        // 綁定頂點屬性
        this.webglCore.bindVertexAttribute(program, 'aPosition', geometry.vertexBuffer, 3, this.gl.FLOAT, false, 8 * 4, 0);
        
        // 繪製
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, geometry.indexBuffer);
        this.webglCore.drawElements(this.gl.TRIANGLES, geometry.indexCount);
    }
    
    // 綁定陰影貼圖紋理
    bindShadowMap(unit = 1) {
        if (!this.enabled || !this.shadowMapTexture) return false;
        
        this.gl.activeTexture(this.gl.TEXTURE0 + unit);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.shadowMapTexture);
        
        return true;
    }
    
    // 應用陰影到著色器
    applyToShader(program, textureUnit = 1) {
        if (!this.enabled) {
            this.webglCore.setUniform(program, 'uShadowEnabled', false, 'bool');
            return;
        }
        
        // 綁定陰影貼圖
        if (this.bindShadowMap(textureUnit)) {
            this.webglCore.setUniform(program, 'uShadowMap', textureUnit, 'sampler2D');
            this.webglCore.setUniform(program, 'uLightSpaceMatrix', this.lightSpaceMatrix, 'mat4');
            this.webglCore.setUniform(program, 'uShadowBias', this.bias, 'float');
            this.webglCore.setUniform(program, 'uShadowEnabled', true, 'bool');
            this.webglCore.setUniform(program, 'uSoftShadows', this.softShadows, 'bool');
        } else {
            this.webglCore.setUniform(program, 'uShadowEnabled', false, 'bool');
        }
    }
    
    // 檢查位置是否在陰影中
    isPositionInShadow(position) {
        if (!this.enabled) return false;
        
        // 將位置轉換到光空間
        const lightSpacePos = MatrixLib.transformPoint(this.lightSpaceMatrix, position);
        
        // 轉換到 NDC 空間
        const shadowCoords = [
            lightSpacePos[0] * 0.5 + 0.5,
            lightSpacePos[1] * 0.5 + 0.5,
            lightSpacePos[2] * 0.5 + 0.5
        ];
        
        // 檢查是否在陰影貼圖範圍內
        if (shadowCoords[0] < 0 || shadowCoords[0] > 1 ||
            shadowCoords[1] < 0 || shadowCoords[1] > 1 ||
            shadowCoords[2] > 1) {
            return false;
        }
        
        // 這裡應該讀取陰影貼圖的深度值進行比較
        // 由於無法直接讀取紋理，這裡返回近似值
        return shadowCoords[2] > 0.5;
    }
    
    // 計算陰影強度
    calculateShadowIntensity(position) {
        if (!this.isPositionInShadow(position)) {
            return 0.0; // 無陰影
        }
        
        // 根據距離計算陰影強度
        const lightPos = this.lighting.getMainLight().position;
        const distance = MatrixLib.distance(position, lightPos);
        const maxDistance = 1000;
        
        return Math.min(1.0, distance / maxDistance);
    }
    
    // 設定陰影品質
    setShadowQuality(quality) {
        const qualitySettings = {
            'low': { size: 1024, softShadows: false },
            'medium': { size: 2048, softShadows: true },
            'high': { size: 4096, softShadows: true }
        };
        
        const settings = qualitySettings[quality];
        if (settings) {
            this.shadowQuality = quality;
            this.setShadowMapSize(settings.size);
            this.softShadows = settings.softShadows;
            
            console.log(`Shadow quality set to: ${quality}`);
        }
    }
    
    // 設定陰影貼圖大小
    setShadowMapSize(size) {
        if (size !== this.shadowMapSize) {
            this.shadowMapSize = size;
            
            // 重新創建陰影 FBO
            if (this.shadowFBO) {
                this.frameBuffer.delete('shadowMap');
                this.shadowFBO = this.frameBuffer.createShadowMapFBO('shadowMap', this.shadowMapSize);
                this.shadowMapTexture = this.shadowFBO ? this.shadowFBO.depthTexture : null;
            }
            
            console.log(`Shadow map size set to: ${size}x${size}`);
        }
    }
    
    // 設定陰影偏移
    setShadowBias(bias) {
        this.bias = bias;
    }
    
    // 啟用/禁用軟陰影
    setSoftShadows(enabled) {
        this.softShadows = enabled;
    }
    
    // 啟用/禁用陰影
    setEnabled(enabled) {
        this.enabled = enabled;
        
        if (!enabled) {
            this.shadowCasters.length = 0;
        }
        
        console.log(`Shadows ${enabled ? 'enabled' : 'disabled'}`);
    }
    
    // 獲取光空間矩陣
    getLightSpaceMatrix() {
        return this.lightSpaceMatrix;
    }
    
    // 獲取陰影設定
    getSettings() {
        return {
            enabled: this.enabled,
            shadowMapSize: this.shadowMapSize,
            bias: this.bias,
            softShadows: this.softShadows,
            quality: this.shadowQuality,
            shadowCasters: this.shadowCasters.length
        };
    }
    
    // 除錯：渲染陰影貼圖到畫面
    debugRenderShadowMap(x = 0, y = 0, width = 256, height = 256) {
        if (!this.shadowMapTexture) return;
        
        // 這裡需要一個簡單的全屏四邊形渲染器
        // 為了簡化，這個功能留待後續實現
        console.log('Debug shadow map rendering not implemented yet');
    }
    
    // 清理資源
    cleanup() {
        if (this.shadowFBO) {
            this.frameBuffer.delete('shadowMap');
            this.shadowFBO = null;
            this.shadowMapTexture = null;
        }
        
        this.shadowCasters.length = 0;
        
        console.log('Shadow renderer cleaned up');
    }
    
    // 獲取統計資訊
    getStats() {
        return {
            enabled: this.enabled,
            shadowMapSize: this.shadowMapSize,
            shadowCasters: this.shadowCasters.length,
            quality: this.shadowQuality,
            memoryUsage: this.shadowMapSize * this.shadowMapSize * 2 // 估算記憶體使用量（bytes）
        };
    }
    
    // 重置到預設設定
    reset() {
        this.shadowMapSize = 2048;
        this.enabled = true;
        this.bias = 0.005;
        this.softShadows = true;
        this.shadowQuality = 'high';
        this.shadowCasters.length = 0;
        
        // 重新初始化
        this.cleanup();
        this.init();
        
        console.log('Shadow renderer reset');
    }
}