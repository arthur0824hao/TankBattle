/**
 * 光照系統
 * 管理場景中央頂部的點光源和完整Phong光照
 */
class Lighting {
    constructor() {
        // 主點光源 - 位於場景中央頂部
        this.mainLight = {
            position: [0, 400, 0],          // 調低高度到400
            color: [1.0, 1.0, 0.95],        // 暖白光
            intensity: 2.0,                 // 增加強度
            attenuation: {
                constant: 1.0,
                linear: 0.0005,             // 減少線性衰減
                quadratic: 0.000001         // 減少二次衰減
            }
        };
        
        // 全域環境光
        this.ambientLight = {
            color: [0.2, 0.2, 0.25],        // 稍微增加環境光
            intensity: 0.3                  // 增加環境光強度
        };
        
        // 光照動畫（可選）
        this.animation = {
            enabled: false,
            time: 0,
            flickerAmplitude: 0.1,
            flickerFrequency: 2.0
        };
        
        console.log('Point light initialized at scene center top:', this.mainLight.position);
    }
    
    // 更新光照系統
    update(deltaTime) {
        if (this.animation.enabled) {
            this.animation.time += deltaTime;
            this.updateLightAnimation();
        }
    }
    
    // 更新光照動畫效果
    updateLightAnimation() {
        // 光源強度閃爍效果
        const baseIntensity = 1.2;
        const flicker = Math.sin(this.animation.time * this.animation.flickerFrequency) * this.animation.flickerAmplitude;
        this.mainLight.intensity = Math.max(0.3, baseIntensity + flicker);
        
        // 可選：輕微的位置搖擺
        const basePosY = 600;
        const sway = Math.sin(this.animation.time * 0.5) * 5;
        this.mainLight.position[1] = basePosY + sway;
    }
    
    // 應用光照參數到著色器
    applyToShader(webglCore, program, cameraPosition) {
        // 點光源位置
        webglCore.setUniform(program, 'uLightPosition', this.mainLight.position, 'vec3');
        
        // 點光源顏色（考慮強度）
        const lightColor = [
            this.mainLight.color[0] * this.mainLight.intensity,
            this.mainLight.color[1] * this.mainLight.intensity,
            this.mainLight.color[2] * this.mainLight.intensity
        ];
        webglCore.setUniform(program, 'uLightColor', lightColor, 'vec3');
        
        // 攝影機位置（用於鏡面反射計算）
        webglCore.setUniform(program, 'uCameraPosition', cameraPosition, 'vec3');
        
        // 光衰減參數
        const attenuation = [
            this.mainLight.attenuation.constant,
            this.mainLight.attenuation.linear,
            this.mainLight.attenuation.quadratic
        ];
        webglCore.setUniform(program, 'uLightAttenuation', attenuation, 'vec3');
        
        // 環境光顏色（考慮強度）
        const ambientColor = [
            this.ambientLight.color[0] * this.ambientLight.intensity,
            this.ambientLight.color[1] * this.ambientLight.intensity,
            this.ambientLight.color[2] * this.ambientLight.intensity
        ];
        webglCore.setUniform(program, 'uAmbientColor', ambientColor, 'vec3');
    }
    
    // 設定光源位置
    setLightPosition(x, y, z) {
        this.mainLight.position = [x, y, z];
        console.log('Light position updated to:', this.mainLight.position);
    }
    
    // 設定光源顏色
    setLightColor(r, g, b) {
        this.mainLight.color = [r, g, b];
    }
    
    // 設定光源強度
    setLightIntensity(intensity) {
        this.mainLight.intensity = Math.max(0, intensity);
    }
    
    // 設定環境光
    setAmbientLight(r, g, b, intensity = 1.0) {
        this.ambientLight.color = [r, g, b];
        this.ambientLight.intensity = Math.max(0, intensity);
    }
    
    // 設定光衰減參數
    setAttenuation(constant, linear, quadratic) {
        this.mainLight.attenuation = {
            constant: constant,
            linear: linear,
            quadratic: quadratic
        };
    }
    
    // 啟用/禁用光照動畫
    setAnimationEnabled(enabled) {
        this.animation.enabled = enabled;
        if (!enabled) {
            // 重置到預設值
            this.mainLight.intensity = 1.2;
            this.mainLight.position[1] = 600;
        }
    }
    
    // 設定動畫參數
    setAnimationParams(amplitude, frequency) {
        this.animation.flickerAmplitude = amplitude;
        this.animation.flickerFrequency = frequency;
    }
    
    // 獲取主光源資訊
    getMainLight() {
        return {
            position: [...this.mainLight.position],
            color: [...this.mainLight.color],
            intensity: this.mainLight.intensity,
            attenuation: { ...this.mainLight.attenuation }
        };
    }
    
    // 獲取環境光資訊
    getAmbientLight() {
        return {
            color: [...this.ambientLight.color],
            intensity: this.ambientLight.intensity
        };
    }
    
    // 計算指定位置的光照強度
    calculateIntensityAtPosition(position) {
        const lightPos = this.mainLight.position;
        const dx = position[0] - lightPos[0];
        const dy = position[1] - lightPos[1];
        const dz = position[2] - lightPos[2];
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        const attenuation = this.mainLight.attenuation.constant +
                           this.mainLight.attenuation.linear * distance +
                           this.mainLight.attenuation.quadratic * distance * distance;
        
        return this.mainLight.intensity / Math.max(1.0, attenuation);
    }
    
    // 計算從位置到光源的方向向量
    getLightDirectionFromPosition(position) {
        const dx = this.mainLight.position[0] - position[0];
        const dy = this.mainLight.position[1] - position[1];
        const dz = this.mainLight.position[2] - position[2];
        const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        if (length === 0) return [0, 1, 0];
        
        return [dx / length, dy / length, dz / length];
    }
    
    // 檢查位置是否被有效光照
    isPositionLit(position, threshold = 0.1) {
        return this.calculateIntensityAtPosition(position) > threshold;
    }
    
    // 重置光照到預設值
    reset() {
        this.mainLight = {
            position: [0, 400, 0],
            color: [1.0, 1.0, 0.95],
            intensity: 2.0,
            attenuation: {
                constant: 1.0,
                linear: 0.0005,
                quadratic: 0.000001
            }
        };
        
        this.ambientLight = {
            color: [0.2, 0.2, 0.25],
            intensity: 0.3
        };
        
        this.animation = {
            enabled: false,
            time: 0,
            flickerAmplitude: 0.1,
            flickerFrequency: 2.0
        };
        
        console.log('Lighting system reset to defaults');
    }
    
    // 獲取光照除錯資訊
    getDebugInfo() {
        return {
            mainLight: this.getMainLight(),
            ambientLight: this.getAmbientLight(),
            animation: { ...this.animation },
            intensityAtOrigin: this.calculateIntensityAtPosition([0, 0, 0]),
            intensityAtTank: this.calculateIntensityAtPosition([0, 2, 0])
        };
    }
    
    // 渲染光源視覺化（除錯用）
    renderLightDebug(webglCore, shaderManager, camera) {
        // 這裡可以渲染一個小球體來視覺化光源位置
        // 目前只輸出到控制台
        if (window.DEBUG) {
            console.log('Light source at:', this.mainLight.position);
        }
    }
}