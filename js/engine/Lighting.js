/**
 * 光照系統
 * 管理點光源和 Phong 光照模型
 */
class Lighting {
    constructor() {
        // 主光源（點光源）
        this.mainLight = {
            position: [0, 400, 0],      // 場景中央上方
            color: [1.0, 1.0, 0.9],     // 暖白光
            intensity: 1.0,
            attenuation: {
                constant: 1.0,
                linear: 0.0014,         // 適合800單位場景的衰減
                quadratic: 0.000007
            }
        };
        
        // 環境光
        this.ambientLight = {
            color: [0.2, 0.2, 0.25],    // 微藍色環境光
            intensity: 0.3
        };
        
        // 光照動畫
        this.animation = {
            enabled: false,
            time: 0,
            amplitude: 0.2,
            frequency: 0.5
        };
        
        // 陰影參數
        this.shadowSettings = {
            enabled: true,
            mapSize: 2048,              // 陰影貼圖大小
            bias: 0.005,                // 陰影偏移
            shadowDistance: 1000,       // 陰影距離
            lightViewSize: 1000         // 光源視圖大小
        };
        
        // 光照矩陣
        this.lightViewMatrix = MatrixLib.identity();
        this.lightProjectionMatrix = MatrixLib.identity();
        this.lightSpaceMatrix = MatrixLib.identity();
        
        this.updateLightMatrices();
    }
    
    // 更新光照系統
    update(deltaTime) {
        if (this.animation.enabled) {
            this.animation.time += deltaTime;
            this.updateLightAnimation();
        }
        
        this.updateLightMatrices();
    }
    
    // 更新光照動畫
    updateLightAnimation() {
        const baseIntensity = 1.0;
        const variation = Math.sin(this.animation.time * this.animation.frequency) * this.animation.amplitude;
        this.mainLight.intensity = Math.max(0.1, baseIntensity + variation);
        
        // 光源位置的微小搖擺
        const baseY = 400;
        const sway = Math.sin(this.animation.time * 0.3) * 10;
        this.mainLight.position[1] = baseY + sway;
    }
    
    // 更新光照矩陣（用於陰影）
    updateLightMatrices() {
        const lightPos = this.mainLight.position;
        const lightTarget = [0, 0, 0]; // 看向場景中心
        const lightUp = [0, 0, 1];     // 光源的上方向
        
        // 光源視圖矩陣
        this.lightViewMatrix = MatrixLib.lookAt(lightPos, lightTarget, lightUp);
        
        // 光源投影矩陣（正交投影用於方向光陰影）
        const size = this.shadowSettings.lightViewSize;
        this.lightProjectionMatrix = MatrixLib.orthographic(
            -size, size, -size, size, 1, this.shadowSettings.shadowDistance
        );
        
        // 光空間矩陣
        this.lightSpaceMatrix = MatrixLib.multiply(
            this.lightProjectionMatrix, 
            this.lightViewMatrix
        );
    }
    
    // 應用光照到著色器
    applyToShader(shaderManager, program, cameraPosition) {
        const gl = shaderManager.gl;
        
        // 主光源參數
        shaderManager.setUniform(program, 'uLightPosition', this.mainLight.position, 'vec3');
        
        const lightColor = [
            this.mainLight.color[0] * this.mainLight.intensity,
            this.mainLight.color[1] * this.mainLight.intensity,
            this.mainLight.color[2] * this.mainLight.intensity
        ];
        shaderManager.setUniform(program, 'uLightColor', lightColor, 'vec3');
        
        // 環境光
        const ambientColor = [
            this.ambientLight.color[0] * this.ambientLight.intensity,
            this.ambientLight.color[1] * this.ambientLight.intensity,
            this.ambientLight.color[2] * this.ambientLight.intensity
        ];
        shaderManager.setUniform(program, 'uAmbientColor', ambientColor, 'vec3');
        
        // 攝影機位置
        shaderManager.setUniform(program, 'uCameraPosition', cameraPosition, 'vec3');
        
        // 光衰減參數
        shaderManager.setUniform(program, 'uLightAttenuation', [
            this.mainLight.attenuation.constant,
            this.mainLight.attenuation.linear,
            this.mainLight.attenuation.quadratic
        ], 'vec3');
        
        // 陰影相關參數
        if (this.shadowSettings.enabled) {
            shaderManager.setUniform(program, 'uLightSpaceMatrix', this.lightSpaceMatrix, 'mat4');
            shaderManager.setUniform(program, 'uShadowBias', this.shadowSettings.bias, 'float');
        }
    }
    
    // 設定主光源位置
    setMainLightPosition(x, y, z) {
        this.mainLight.position = [x, y, z];
        this.updateLightMatrices();
    }
    
    // 設定主光源顏色
    setMainLightColor(r, g, b) {
        this.mainLight.color = [r, g, b];
    }
    
    // 設定主光源強度
    setMainLightIntensity(intensity) {
        this.mainLight.intensity = Math.max(0, intensity);
    }
    
    // 設定環境光
    setAmbientLight(r, g, b, intensity = 1.0) {
        this.ambientLight.color = [r, g, b];
        this.ambientLight.intensity = Math.max(0, intensity);
    }
    
    // 啟用/禁用光照動畫
    setAnimationEnabled(enabled) {
        this.animation.enabled = enabled;
        if (!enabled) {
            this.mainLight.intensity = 1.0;
            this.mainLight.position[1] = 400;
        }
    }
    
    // 設定動畫參數
    setAnimationParams(amplitude, frequency) {
        this.animation.amplitude = amplitude;
        this.animation.frequency = frequency;
    }
    
    // 啟用/禁用陰影
    setShadowEnabled(enabled) {
        this.shadowSettings.enabled = enabled;
    }
    
    // 設定陰影貼圖大小
    setShadowMapSize(size) {
        this.shadowSettings.mapSize = size;
    }
    
    // 設定陰影偏移
    setShadowBias(bias) {
        this.shadowSettings.bias = bias;
    }
    
    // 獲取光源視圖矩陣
    getLightViewMatrix() {
        return this.lightViewMatrix;
    }
    
    // 獲取光源投影矩陣
    getLightProjectionMatrix() {
        return this.lightProjectionMatrix;
    }
    
    // 獲取光空間矩陣
    getLightSpaceMatrix() {
        return this.lightSpaceMatrix;
    }
    
    // 獲取主光源資訊
    getMainLight() {
        return {
            position: [...this.mainLight.position],
            color: [...this.mainLight.color],
            intensity: this.mainLight.intensity
        };
    }
    
    // 獲取環境光資訊
    getAmbientLight() {
        return {
            color: [...this.ambientLight.color],
            intensity: this.ambientLight.intensity
        };
    }
    
    // 獲取陰影設定
    getShadowSettings() {
        return { ...this.shadowSettings };
    }
    
    // 計算光照強度（在指定位置）
    calculateIntensityAtPosition(position) {
        const lightPos = this.mainLight.position;
        const distance = MatrixLib.distance(position, lightPos);
        
        const attenuation = this.mainLight.attenuation.constant +
                           this.mainLight.attenuation.linear * distance +
                           this.mainLight.attenuation.quadratic * distance * distance;
        
        return this.mainLight.intensity / Math.max(1.0, attenuation);
    }
    
    // 計算光照方向（從位置指向光源）
    getLightDirectionFromPosition(position) {
        const direction = MatrixLib.subtract(this.mainLight.position, position);
        return MatrixLib.normalize(direction);
    }
    
    // 檢查位置是否被光照
    isPositionLit(position, threshold = 0.1) {
        return this.calculateIntensityAtPosition(position) > threshold;
    }
    
    // 創建光源調試資訊
    getDebugInfo() {
        return {
            mainLight: this.getMainLight(),
            ambientLight: this.getAmbientLight(),
            animation: {
                enabled: this.animation.enabled,
                time: this.animation.time,
                amplitude: this.animation.amplitude,
                frequency: this.animation.frequency
            },
            shadowSettings: this.getShadowSettings()
        };
    }
    
    // 重置到預設值
    reset() {
        this.mainLight = {
            position: [0, 400, 0],
            color: [1.0, 1.0, 0.9],
            intensity: 1.0,
            attenuation: {
                constant: 1.0,
                linear: 0.0014,
                quadratic: 0.000007
            }
        };
        
        this.ambientLight = {
            color: [0.2, 0.2, 0.25],
            intensity: 0.3
        };
        
        this.animation = {
            enabled: false,
            time: 0,
            amplitude: 0.2,
            frequency: 0.5
        };
        
        this.updateLightMatrices();
    }
    
    // 從設定載入光照參數
    loadSettings(settings) {
        if (settings.mainLight) {
            Object.assign(this.mainLight, settings.mainLight);
        }
        if (settings.ambientLight) {
            Object.assign(this.ambientLight, settings.ambientLight);
        }
        if (settings.animation) {
            Object.assign(this.animation, settings.animation);
        }
        if (settings.shadowSettings) {
            Object.assign(this.shadowSettings, settings.shadowSettings);
        }
        
        this.updateLightMatrices();
    }
    
    // 匯出設定
    exportSettings() {
        return {
            mainLight: this.getMainLight(),
            ambientLight: this.getAmbientLight(),
            animation: { ...this.animation },
            shadowSettings: this.getShadowSettings()
        };
    }
}