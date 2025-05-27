/**
 * 目標球類別
 * 包含三種類型：白球(1分)、藍球(5分)、紅球(10分)
 */
class Target {
    constructor(webglCore, shaderManager, type, position) {
        this.webglCore = webglCore;
        this.gl = webglCore.getContext();
        this.shaderManager = shaderManager;
        
        // 目標類型和屬性
        this.type = type; // 'white', 'blue', 'red'
        this.position = [...position];
        this.active = true;
        
        // 統一球體半徑為20單位
        this.radius = 20;
        
        // 運動屬性 - 速度減半
        this.rotationSpeed = MatrixLib.degToRad(30); // 從60度/秒減為30度/秒
        this.bobSpeed = 0.5; // 上下浮動速度減半
        this.bobAmplitude = 2; // 浮動幅度減半
        
        // 動畫狀態
        this.time = Math.random() * Math.PI * 2; // 隨機起始時間
        this.baseY = position[1];
        this.rotationY = 0;
        
        // 重生機制
        this.respawnTime = 10.0; // 10秒重生
        this.timeUntilRespawn = 0;
        
        // 幾何體
        this.geometry = null;
        this.modelMatrix = MatrixLib.identity();
        
        // 根據類型設定材質屬性
        this.setupMaterial();
        this.createGeometry();
        this.updateMatrix();
    }
    
    // 根據類型設定材質
    setupMaterial() {
        switch (this.type) {
            case 'white':
                this.material = {
                    ambient: [0.3, 0.3, 0.3],
                    diffuse: [0.9, 0.9, 0.9],
                    specular: [1.0, 1.0, 1.0],
                    shininess: 128.0
                };
                this.score = 1;
                this.ammoReward = 1;
                break;
                
            case 'blue':
                this.material = {
                    ambient: [0.1, 0.1, 0.3],
                    diffuse: [0.2, 0.2, 0.8],
                    specular: [0.7, 0.7, 1.0],
                    shininess: 64.0
                };
                this.score = 5;
                this.ammoReward = 2;
                break;
                
            case 'red':
                this.material = {
                    ambient: [0.3, 0.1, 0.1],
                    diffuse: [0.8, 0.2, 0.2],
                    specular: [1.0, 0.5, 0.5],
                    shininess: 32.0
                };
                this.score = 10;
                this.ammoReward = 3;
                break;
                
            default:
                this.material = {
                    ambient: [0.2, 0.2, 0.2],
                    diffuse: [0.5, 0.5, 0.5],
                    specular: [0.3, 0.3, 0.3],
                    shininess: 16.0
                };
                this.score = 0;
                this.ammoReward = 0;
        }
    }
    
    // 創建球形幾何體
    createGeometry() {
        const radius = this.radius;
        const segments = 24; // 增加細節
        const rings = 18;
        
        const vertices = [];
        const indices = [];
        
        // 生成球體頂點
        for (let ring = 0; ring <= rings; ring++) {
            const phi = (ring / rings) * Math.PI;
            const y = Math.cos(phi) * radius;
            const ringRadius = Math.sin(phi) * radius;
            
            for (let segment = 0; segment <= segments; segment++) {
                const theta = (segment / segments) * Math.PI * 2;
                const x = Math.cos(theta) * ringRadius;
                const z = Math.sin(theta) * ringRadius;
                
                // 位置
                vertices.push(x, y, z);
                
                // 法向量（正規化的位置向量）
                const length = Math.sqrt(x * x + y * y + z * z);
                vertices.push(x / length, y / length, z / length);
                
                // 紋理座標
                vertices.push(segment / segments, ring / rings);
            }
        }
        
        // 生成索引
        for (let ring = 0; ring < rings; ring++) {
            for (let segment = 0; segment < segments; segment++) {
                const curr = ring * (segments + 1) + segment;
                const next = curr + segments + 1;
                
                // 第一個三角形
                indices.push(curr, next, curr + 1);
                // 第二個三角形
                indices.push(curr + 1, next, next + 1);
            }
        }
        
        this.geometry = {
            vertices: new Float32Array(vertices),
            indices: new Uint16Array(indices),
            vertexBuffer: this.webglCore.createVertexBuffer(vertices),
            indexBuffer: this.webglCore.createIndexBuffer(indices),
            indexCount: indices.length
        };
    }
    
    // 更新目標球
    update(deltaTime) {
        if (!this.active) {
            // 處理重生計時
            this.timeUntilRespawn -= deltaTime;
            if (this.timeUntilRespawn <= 0) {
                this.respawn();
            }
            return;
        }
        
        // 更新動畫時間
        this.time += deltaTime;
        
        // 旋轉動畫 - 速度減半
        this.rotationY += this.rotationSpeed * deltaTime;
        this.rotationY %= (Math.PI * 2);
        
        // 上下浮動動畫 - 速度和幅度都減半
        this.position[1] = this.baseY + Math.sin(this.time * this.bobSpeed) * this.bobAmplitude;
        
        // 更新變換矩陣
        this.updateMatrix();
    }
    
    // 更新變換矩陣
    updateMatrix() {
        const translation = MatrixLib.translate(this.position[0], this.position[1], this.position[2]);
        const rotation = MatrixLib.rotateY(this.rotationY);
        
        this.modelMatrix = MatrixLib.multiply(translation, rotation);
    }
    
    // 檢查與砲彈的碰撞 - 使用距離檢測
    checkCollisionWithBullet(bulletPosition, bulletRadius) {
        if (!this.active) return false;
        
        // 計算中心點之間的距離
        const dx = this.position[0] - bulletPosition[0];
        const dy = this.position[1] - bulletPosition[1];
        const dz = this.position[2] - bulletPosition[2];
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        // 檢查距離是否小於兩個半徑之和
        const collisionDistance = this.radius + bulletRadius;
        
        if (distance < collisionDistance) {
            console.log(`Target hit! Type: ${this.type}, Distance: ${distance.toFixed(2)}, Required: ${collisionDistance.toFixed(2)}`);
            return true;
        }
        
        return false;
    }
    
    // 被命中時調用
    onHit() {
        if (!this.active) return null;
        
        console.log(`${this.type} ball hit! Score: ${this.score}, Ammo reward: ${this.ammoReward}`);
        
        const hitData = {
            type: this.type,
            score: this.score,
            ammoReward: this.ammoReward,
            position: [...this.position]
        };
        
        // 銷毀目標球
        this.active = false;
        this.timeUntilRespawn = this.respawnTime;
        
        return hitData;
    }
    
    // 重生目標球
    respawn() {
        console.log(`${this.type} ball respawning...`);
        
        // 隨機生成新位置（避免邊界）
        this.position = this.generateRandomPosition();
        this.baseY = this.position[1];
        
        // 重置動畫狀態
        this.time = Math.random() * Math.PI * 2;
        this.rotationY = 0;
        
        // 重新激活
        this.active = true;
        this.timeUntilRespawn = 0;
        
        this.updateMatrix();
    }
    
    // 生成隨機位置 - 調整到坦克炮管高度
    generateRandomPosition() {
        const boundary = 700; // 場景邊界內
        const tankBarrelHeight = 5.5; // 坦克炮管高度：底座4 + 砲座1.5
        
        return [
            (Math.random() - 0.5) * boundary * 2,
            tankBarrelHeight, // 設置為與坦克炮管相同高度
            (Math.random() - 0.5) * boundary * 2
        ];
    }
    
    // 渲染目標球
    render(camera, lighting) {
        if (!this.active || !this.geometry) return;
        
        const program = this.shaderManager.useProgram('phong');
        if (!program) return;
        
        // 設定變換矩陣
        this.webglCore.setUniform(program, 'uModelMatrix', this.modelMatrix, 'mat4');
        this.webglCore.setUniform(program, 'uViewMatrix', camera.getViewMatrix(), 'mat4');
        this.webglCore.setUniform(program, 'uProjectionMatrix', camera.getProjectionMatrix(), 'mat4');
        this.webglCore.setUniform(program, 'uNormalMatrix', MatrixLib.normalMatrix(this.modelMatrix), 'mat3');
        this.webglCore.setUniform(program, 'uCameraPosition', camera.getPosition(), 'vec3');
        
        // 應用光照系統
        if (lighting.applyToShader) {
            lighting.applyToShader(this.webglCore, program, camera.getPosition());
        } else {
            // 後備光照設定
            this.webglCore.setUniform(program, 'uLightPosition', lighting.position || [0, 100, 0], 'vec3');
            this.webglCore.setUniform(program, 'uLightColor', lighting.color || [1.0, 1.0, 1.0], 'vec3');
            this.webglCore.setUniform(program, 'uLightAttenuation', [1.0, 0.001, 0.000001], 'vec3');
        }
        
        // 材質設定
        this.webglCore.setUniform(program, 'uAmbientColor', this.material.ambient, 'vec3');
        this.webglCore.setUniform(program, 'uDiffuseColor', this.material.diffuse, 'vec3');
        this.webglCore.setUniform(program, 'uSpecularColor', this.material.specular, 'vec3');
        this.webglCore.setUniform(program, 'uShininess', this.material.shininess, 'float');
        this.webglCore.setUniform(program, 'uUseTexture', false, 'bool');
        
        // 綁定頂點屬性
        const positionBound = this.webglCore.bindVertexAttribute(
            program, 'aPosition', this.geometry.vertexBuffer, 3, this.gl.FLOAT, false, 8 * 4, 0
        );
        const normalBound = this.webglCore.bindVertexAttribute(
            program, 'aNormal', this.geometry.vertexBuffer, 3, this.gl.FLOAT, false, 8 * 4, 3 * 4
        );
        const texCoordBound = this.webglCore.bindVertexAttribute(
            program, 'aTexCoord', this.geometry.vertexBuffer, 2, this.gl.FLOAT, false, 8 * 4, 6 * 4
        );
        
        // 繪製
        if (positionBound) {
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.geometry.indexBuffer);
            this.webglCore.drawElements(this.gl.TRIANGLES, this.geometry.indexCount);
        }
    }
    
    // 獲取位置
    getPosition() {
        return [...this.position];
    }
    
    // 獲取半徑
    getRadius() {
        return this.radius;
    }
    
    // 檢查是否活躍
    isActive() {
        return this.active;
    }
    
    // 獲取類型
    getType() {
        return this.type;
    }
    
    // 獲取分數
    getScore() {
        return this.score;
    }
    
    // 獲取彈藥獎勵
    getAmmoReward() {
        return this.ammoReward;
    }
    
    // 獲取模型矩陣（用於陰影渲染）
    getModelMatrix() {
        return this.modelMatrix;
    }
    
    // 設定位置
    setPosition(x, y, z) {
        this.position = [x, y, z];
        this.baseY = y;
        this.updateMatrix();
    }
    
    // 獲取重生剩餘時間
    getRespawnTimeRemaining() {
        return this.timeUntilRespawn;
    }
}

/**
 * 目標管理器
 * 管理場景中所有目標球的生成、更新和碰撞檢測
 */
class TargetManager {
    constructor(webglCore, shaderManager) {
        this.webglCore = webglCore;
        this.shaderManager = shaderManager;
        
        this.targets = [];
        this.createInitialTargets();
        
        console.log('TargetManager initialized with', this.targets.length, 'targets');
    }
    
    // 創建初始目標球
    createInitialTargets() {
        // 白球 (10個) - 1分，+1彈藥
        for (let i = 0; i < 10; i++) {
            const position = this.generateRandomPosition();
            const target = new Target(this.webglCore, this.shaderManager, 'white', position);
            this.targets.push(target);
        }
        
        // 藍球 (5個) - 5分，+2彈藥
        for (let i = 0; i < 5; i++) {
            const position = this.generateRandomPosition();
            const target = new Target(this.webglCore, this.shaderManager, 'blue', position);
            this.targets.push(target);
        }
        
        // 紅球 (1個) - 10分，+3彈藥
        const redPosition = this.generateRandomPosition();
        const redTarget = new Target(this.webglCore, this.shaderManager, 'red', redPosition);
        this.targets.push(redTarget);
        
        console.log('Created targets:', {
            white: 10,
            blue: 5,
            red: 1,
            total: this.targets.length
        });
    }
    
    // 生成隨機位置 - 添加距離檢查確保目標距離坦克至少30單位
    generateRandomPosition() {
        const boundary = 700; // 場景邊界內
        const tankBarrelHeight = 5.5; // 與坦克炮管相同高度
        const minDistanceFromTank = 30; // 最小距離30單位
        
        let position;
        let attempts = 0;
        const maxAttempts = 50;
        
        do {
            position = [
                (Math.random() - 0.5) * boundary * 2,
                tankBarrelHeight,
                (Math.random() - 0.5) * boundary * 2
            ];
            
            // 計算與坦克的距離（假設坦克在原點）
            const distanceFromTank = Math.sqrt(
                position[0] * position[0] + position[2] * position[2]
            );
            
            if (distanceFromTank >= minDistanceFromTank) {
                break;
            }
            
            attempts++;
        } while (attempts < maxAttempts);
        
        console.log(`Target positioned at distance ${Math.sqrt(position[0] * position[0] + position[2] * position[2]).toFixed(1)} from tank`);
        return position;
    }
    
    // 更新所有目標
    update(deltaTime) {
        this.targets.forEach(target => {
            target.update(deltaTime);
        });
    }
    
    // 渲染所有目標
    render(camera, lighting) {
        this.targets.forEach(target => {
            target.render(camera, lighting);
        });
    }
    
    // 簡化的碰撞檢測（移除計分和獎勵）
    checkCollisions(bullets) {
        const hits = [];
        
        bullets.forEach((bullet, bulletIndex) => {
            if (!bullet.active) return;
            
            this.targets.forEach((target, targetIndex) => {
                if (!target.active) return;
                
                // 使用簡單的球體碰撞檢測：兩中心距離 < 兩半徑之和
                const distance = MatrixLib.distance(bullet.position, target.position);
                const collisionDistance = bullet.radius + target.radius;
                
                if (distance < collisionDistance) {
                    console.log(`Target collision detected: distance=${distance.toFixed(2)}, threshold=${collisionDistance.toFixed(2)}`);
                    
                    // 記錄碰撞
                    hits.push({
                        target: target,
                        bullet: bullet,
                        targetIndex: targetIndex,
                        bulletIndex: bulletIndex,
                        targetType: target.type,
                        position: [...target.position]
                    });
                    
                    // 標記目標和砲彈為非活躍狀態
                    target.active = false;
                    bullet.active = false;
                    
                    // 設定目標重生
                    target.respawnTime = this.respawnDelay;
                    
                    console.log(`${target.type} target hit and destroyed`);
                }
            });
        });
        
        return hits;
    }
    
    // 獲取所有目標
    getTargets() {
        return this.targets;
    }
    
    // 獲取活躍目標數量
    getActiveTargetCount() {
        return this.targets.filter(target => target.isActive()).length;
    }
    
    // 獲取各類型目標統計
    getTargetStats() {
        const stats = {
            white: { active: 0, respawning: 0 },
            blue: { active: 0, respawning: 0 },
            red: { active: 0, respawning: 0 }
        };
        
        this.targets.forEach(target => {
            const type = target.getType();
            if (target.isActive()) {
                stats[type].active++;
            } else {
                stats[type].respawning++;
            }
        });
        
        return stats;
    }
    
    // 重置所有目標
    reset() {
        console.log('Resetting all targets...');
        
        this.targets.forEach(target => {
            // 重新定位並重新激活
            const newPosition = this.generateRandomPosition();
            target.setPosition(newPosition[0], newPosition[1], newPosition[2]);
            target.active = true;
            target.timeUntilRespawn = 0;
            target.time = Math.random() * Math.PI * 2;
            target.rotationY = 0;
        });
        
        console.log('All targets reset');
    }
    
    // 添加新目標（擴展功能）
    addTarget(type, position) {
        const target = new Target(this.webglCore, this.shaderManager, type, position);
        this.targets.push(target);
        return target;
    }
    
    // 移除目標（擴展功能）
    removeTarget(target) {
        const index = this.targets.indexOf(target);
        if (index > -1) {
            this.targets.splice(index, 1);
        }
    }
    
    // 獲取最近的目標（用於AI瞄準等）
    getClosestTarget(position, activeOnly = true) {
        let closest = null;
        let closestDistance = Infinity;
        
        this.targets.forEach(target => {
            if (activeOnly && !target.isActive()) return;
            
            const targetPos = target.getPosition();
            const distance = Math.sqrt(
                Math.pow(targetPos[0] - position[0], 2) +
                Math.pow(targetPos[1] - position[1], 2) +
                Math.pow(targetPos[2] - position[2], 2)
            );
            
            if (distance < closestDistance) {
                closestDistance = distance;
                closest = target;
            }
        });
        
        return closest ? { target: closest, distance: closestDistance } : null;
    }
}