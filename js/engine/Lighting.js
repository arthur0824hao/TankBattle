/**
 * 光照系統
 * 管理跟隨坦克上方的點光源和完整Phong光照
 */
class Lighting {
    constructor() {
        // 夕陽主光源 - 側面角度照射
        this.mainLight = {
            position: [100, 80, 100],        // 調整光源位置，確保能照亮物體
            color: [1.0, 0.95, 0.8],        // 稍微調整顏色，更自然
            intensity: 2.5,                 // 調整強度，避免過亮
            attenuation: {
                constant: 1.0,
                linear: 0.002,              // 稍微增加衰減
                quadratic: 0.000005         // 適度的二次衰減
            },
            followHeight: 80,               // 🎯 這裡！光源跟隨高度
            followOffset: [100, 0, 100],    // 🎯 這裡！側面偏移(Y=0是高度)
            smoothFollow: true
        };
        
        // 環境光設定 - 確保有基本照明
        this.ambientLight = {
            color: [0.4, 0.35, 0.3],        // 增強環境光，確保暗面可見
            intensity: 0.6                  // 適度的環境光強度
        };
        
        // 光照動畫（可選）
        this.animation = {
            enabled: false,
            time: 0,
            flickerAmplitude: 0.1,
            flickerFrequency: 2.0
        };
        
        // 跟隨參數
        this.followTarget = null;
        this.currentTargetPosition = [0, 0, 0];
        this.smoothingFactor = 0.1;
        
        console.log('Corrected Phong lighting initialized');
    }
    
    // 更新光照系統（新增坦克位置參數）
    update(deltaTime, tankPosition = null) {
        // 更新光源跟隨坦克
        if (tankPosition) {
            this.updateLightFollow(tankPosition, deltaTime);
        }
        
        if (this.animation.enabled) {
            this.animation.time += deltaTime;
            this.updateLightAnimation();
        }
    }
    
    // 更新光源跟隨坦克 - 修正為夕陽跟隨
    updateLightFollow(tankPosition, deltaTime) {
        // 夕陽光源目標位置：坦克側面上方
        const targetPosition = [
            tankPosition[0] + this.mainLight.followOffset[0],
            tankPosition[1] + this.mainLight.followHeight+480,
            tankPosition[2] + this.mainLight.followOffset[2]
        ];
        
        if (this.mainLight.smoothFollow) {
            // 平滑跟隨
            this.mainLight.position[0] = this.lerp(
                this.mainLight.position[0], 
                targetPosition[0], 
                this.smoothingFactor
            );
            this.mainLight.position[1] = this.lerp(
                this.mainLight.position[1], 
                targetPosition[1], 
                this.smoothingFactor
            );
            this.mainLight.position[2] = this.lerp(
                this.mainLight.position[2], 
                targetPosition[2], 
                this.smoothingFactor
            );
        } else {
            // 直接跟隨
            this.mainLight.position = [...targetPosition];
        }
        
        console.log('Sunset light following tank at offset position:', this.mainLight.position);
    }
    
    // 線性插值輔助函數
    lerp(start, end, factor) {
        return start + (end - start) * factor;
    }
    
    // 更新光照動畫效果
    updateLightAnimation() {
        // 光源強度閃爍效果
        const baseIntensity = 3.0;
        const flicker = Math.sin(this.animation.time * this.animation.flickerFrequency) * this.animation.flickerAmplitude;
        this.mainLight.intensity = Math.max(0.5, baseIntensity + flicker);
        
        // 可選：輕微的位置搖擺
        const currentHeight = this.mainLight.followHeight;
        const sway = Math.sin(this.animation.time * 0.5) * 3;
        this.mainLight.followHeight = currentHeight + sway;
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
    
    // 設定平滑跟隨
    setSmoothFollow(enabled, factor = 0.1) {
        this.mainLight.smoothFollow = enabled;
        this.smoothingFactor = Math.max(0.01, Math.min(1.0, factor));
    }
    
    // 啟用/禁用光照動畫
    setAnimationEnabled(enabled) {
        this.animation.enabled = enabled;
        if (!enabled) {
            // 重置到預設值
            this.mainLight.intensity = 3.0;
            this.mainLight.followHeight = 50;
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
            attenuation: { ...this.mainLight.attenuation },
            followHeight: this.mainLight.followHeight
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
            position: [0, 50, 0],
            color: [1.0, 1.0, 0.95],
            intensity: 3.0,
            attenuation: {
                constant: 1.0,
                linear: 0.001,
                quadratic: 0.000005
            },
            followHeight: 50,
            smoothFollow: true
        };
        
        this.ambientLight = {
            color: [0.15, 0.15, 0.2],
            intensity: 0.25
        };
        
        this.animation = {
            enabled: false,
            time: 0,
            flickerAmplitude: 0.1,
            flickerFrequency: 2.0
        };
        
        console.log('Lighting system reset to follow tank defaults');
    }
    
    // 獲取光照除錯資訊
    getDebugInfo() {
        return {
            mainLight: this.getMainLight(),
            ambientLight: this.getAmbientLight(),
            animation: { ...this.animation },
            intensityAtOrigin: this.calculateIntensityAtPosition([0, 0, 0]),
            intensityAtTank: this.calculateIntensityAtPosition([0, 2, 0]),
            followMode: 'tank-above'
        };
    }
    
    // 渲染光源視覺化（除錯用）
    renderLightDebug(webglCore, shaderManager, camera) {
        // 這裡可以渲染一個小球體來視覺化光源位置
        // 目前只輸出到控制台
        if (window.DEBUG) {
            console.log('Light source following tank at:', this.mainLight.position);
        }
    }
}