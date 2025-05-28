/**
 * 砲彈類別 - 優化命中判定為第一優先級
 */
class Bullet {
    constructor(webglCore, shaderManager, startPosition, direction, speed = 100, id = 1) {
        this.webglCore = webglCore;
        this.gl = webglCore.getContext();
        this.shaderManager = shaderManager;
        
        this.id = id;
        this.position = [...startPosition];
        this.direction = [...direction];
        this.speed = speed;
        this.radius = 3.0;
        this.active = true;
        
        this.maxLifeTime = 5.0;
        this.lifeTime = 0;
        
        this.hitTarget = null;
        this.destroyReason = null;
        
        // 添加碰撞檢查回調
        this.collisionCheckCallback = null;
        
        this.worldBounds = {
            min: [-150, 0, -150],
            max: [150, 100, 150]
        };
        
        this.geometry = null;
        this.modelMatrix = MatrixLib.identity();
        
        this.material = {
            ambient: [0.2, 0.2, 0.2],
            diffuse: [0.8, 0.8, 0.8],
            specular: [1.0, 1.0, 1.0],
            shininess: 128.0
        };
        
        this.createGeometry();
        this.updateMatrix();
    }
    
    createGeometry() {
        const radius = this.radius;
        const segments = 16;
        const rings = 12;
        
        const vertices = [];
        const indices = [];
        
        for (let ring = 0; ring <= rings; ring++) {
            const phi = (ring / rings) * Math.PI;
            const y = Math.cos(phi) * radius;
            const ringRadius = Math.sin(phi) * radius;
            
            for (let segment = 0; segment <= segments; segment++) {
                const theta = (segment / segments) * Math.PI * 2;
                const x = Math.cos(theta) * ringRadius;
                const z = Math.sin(theta) * ringRadius;
                
                vertices.push(x, y, z);
                
                const length = Math.sqrt(x * x + y * y + z * z);
                vertices.push(x / length, y / length, z / length);
                
                vertices.push(segment / segments, ring / rings);
            }
        }
        
        for (let ring = 0; ring < rings; ring++) {
            for (let segment = 0; segment < segments; segment++) {
                const curr = ring * (segments + 1) + segment;
                const next = curr + segments + 1;
                
                indices.push(curr, next, curr + 1);
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
    
    // 設定碰撞檢查回調
    setCollisionCheckCallback(callback) {
        this.collisionCheckCallback = callback;
    }
    
    update(deltaTime) {
        if (!this.active) return;
        
        // 1. 移動砲彈
        const distance = this.speed * deltaTime;
        this.position[0] += this.direction[0] * distance;
        this.position[1] += this.direction[1] * distance;
        this.position[2] += this.direction[2] * distance;
        
        this.updateMatrix();
        
        // 2. 【第一優先級】立即檢查命中判定
        if (this.collisionCheckCallback) {
            const hitResult = this.collisionCheckCallback(this);
            if (hitResult.hit) {
                // 立即處理命中
                this.processImmediateHit(hitResult);
                return; // 命中後立即返回，不執行後續檢查
            }
        }
        
        // 3. 只有沒命中才檢查其他條件
        
        // 邊界檢查
        if (this.checkWorldBounds()) {
            this.destroyReason = 'boundary_hit';
            this.active = false;
            return;
        }
        
        // 生命週期檢查
        this.lifeTime += deltaTime;
        if (this.lifeTime >= this.maxLifeTime) {
            this.destroyReason = 'expired';
            this.active = false;
            return;
        }
    }
    
    // 立即處理命中
    processImmediateHit(hitResult) {
        this.hitTarget = hitResult.target;
        this.destroyReason = 'target_hit';
        this.active = false;
        
        // 立即觸發目標命中
        if (hitResult.target && hitResult.target.hit) {
            hitResult.target.hit();
        }
        
        // 觸發命中事件回調
        if (hitResult.onHitCallback) {
            hitResult.onHitCallback({
                bulletId: this.id,
                targetId: hitResult.target.getId(),
                targetType: hitResult.target.getType(),
                bullet: this,
                target: hitResult.target,
                hitTime: performance.now()
            });
        }
        
        console.log(`🎯 IMMEDIATE HIT: Bullet ${this.id} hit ${hitResult.target.getType()}_${hitResult.target.getId()}`);
    }
    
    checkWorldBounds() {
        return (
            this.position[0] < this.worldBounds.min[0] || this.position[0] > this.worldBounds.max[0] ||
            this.position[1] < this.worldBounds.min[1] || this.position[1] > this.worldBounds.max[1] ||
            this.position[2] < this.worldBounds.min[2] || this.position[2] > this.worldBounds.max[2]
        );
    }
    
    updateMatrix() {
        this.modelMatrix = MatrixLib.translate(
            this.position[0], 
            this.position[1], 
            this.position[2]
        );
    }
    
    // 獲取世界座標位置（統一介面）
    getWorldPosition() {
        return CoordinateUtils.extractWorldPosition(this.modelMatrix);
    }
    
    getPosition() {
        // 保留原方法，但現在可以選擇使用哪種座標
        return [...this.position];
    }
    
    render(camera, lighting, textureManager = null) {
        if (!this.active || !this.geometry) return;
        
        const program = this.shaderManager.useProgram('phong');
        if (!program) return;
        
        this.webglCore.setUniform(program, 'uModelMatrix', this.modelMatrix, 'mat4');
        this.webglCore.setUniform(program, 'uViewMatrix', camera.getViewMatrix(), 'mat4');
        this.webglCore.setUniform(program, 'uProjectionMatrix', camera.getProjectionMatrix(), 'mat4');
        this.webglCore.setUniform(program, 'uNormalMatrix', MatrixLib.normalMatrix(this.modelMatrix), 'mat3');
        this.webglCore.setUniform(program, 'uCameraPosition', camera.getPosition(), 'vec3');
        
        if (lighting.applyToShader) {
            lighting.applyToShader(this.webglCore, program, camera.getPosition());
        }
        
        this.webglCore.setUniform(program, 'uAmbientColor', this.material.ambient, 'vec3');
        this.webglCore.setUniform(program, 'uDiffuseColor', this.material.diffuse, 'vec3');
        this.webglCore.setUniform(program, 'uSpecularColor', this.material.specular, 'vec3');
        this.webglCore.setUniform(program, 'uShininess', this.material.shininess, 'float');
        
        if (textureManager && textureManager.isTextureLoaded('metal')) {
            textureManager.bindTexture('metal', 0);
            this.webglCore.setUniform(program, 'uTexture', 0, 'sampler2D');
            this.webglCore.setUniform(program, 'uUseTexture', true, 'bool');
        } else {
            this.webglCore.setUniform(program, 'uUseTexture', false, 'bool');
        }
        
        this.webglCore.bindVertexAttribute(program, 'aPosition', this.geometry.vertexBuffer, 3, this.gl.FLOAT, false, 8 * 4, 0);
        this.webglCore.bindVertexAttribute(program, 'aNormal', this.geometry.vertexBuffer, 3, this.gl.FLOAT, false, 8 * 4, 3 * 4);
        this.webglCore.bindVertexAttribute(program, 'aTexCoord', this.geometry.vertexBuffer, 2, this.gl.FLOAT, false, 8 * 4, 6 * 4);
        
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.geometry.indexBuffer);
        this.webglCore.drawElements(this.gl.TRIANGLES, this.geometry.indexCount);
    }
    
    destroy() {
        this.destroyReason = this.destroyReason || 'manual';
        this.active = false;
    }
    
    markHit(target) {
        this.hitTarget = target;
        this.destroyReason = 'target_hit';
    }
    
    getPosition() {
        return [...this.position];
    }
    
    getRadius() {
        return this.radius;
    }
    
    isActive() {
        return this.active;
    }
    
    getModelMatrix() {
        return this.modelMatrix;
    }
}

/**
 * 砲彈管理器 - 優化命中處理
 */
class BulletManager {
    constructor(webglCore, shaderManager) {
        this.webglCore = webglCore;
        this.shaderManager = shaderManager;
        
        this.bullets = [];
        this.maxBullets = 5;
        this.nextId = 1;
        
        // 命中處理回調
        this.targetManager = null;
        this.onHitCallback = null;
    }
    
    // 設定目標管理器（用於碰撞檢測）
    setTargetManager(targetManager) {
        this.targetManager = targetManager;
    }
    
    // 設定命中事件回調
    setOnHitCallback(callback) {
        this.onHitCallback = callback;
    }
    
    fire(position, direction, speed = 100) {
        if (this.bullets.length >= this.maxBullets) {
            this.bullets.shift();
        }
        
        const bulletId = this.nextId;
        this.nextId = (this.nextId % 5) + 1;
        
        const bullet = new Bullet(this.webglCore, this.shaderManager, position, direction, speed, bulletId);
        
        // 設定砲彈的碰撞檢查回調
        bullet.setCollisionCheckCallback((bullet) => {
            return this.checkBulletCollision(bullet);
        });
        
        this.bullets.push(bullet);
        
        return bullet;
    }
    
    // 砲彈碰撞檢測（即時處理）- 使用世界座標
    checkBulletCollision(bullet) {
        if (!this.targetManager) {
            return { hit: false };
        }
        
        const activeTargets = this.targetManager.getActiveTargets();
        
        for (const target of activeTargets) {
            if (!target.isActive()) continue;
            
            // 使用世界座標進行碰撞檢測
            const bulletWorldPos = bullet.getWorldPosition();
            const targetWorldPos = target.getWorldPosition();
            
            const distance = CoordinateUtils.calculateDistance(bulletWorldPos, targetWorldPos);
            const combinedRadius = bullet.getRadius() + target.getRadius();
            
            // 調試輸出
            if (window.DEBUG) {
                console.log(`Collision check: Bullet world pos: ${bulletWorldPos}, Target world pos: ${targetWorldPos}, Distance: ${distance.toFixed(2)}, Combined radius: ${combinedRadius}`);
            }
            
            if (distance <= combinedRadius) {
                return {
                    hit: true,
                    target: target,
                    distance: distance,
                    onHitCallback: this.onHitCallback
                };
            }
        }
        
        return { hit: false };
    }
    
    calculateDistance(pos1, pos2) {
        const dx = pos1[0] - pos2[0];
        const dy = pos1[1] - pos2[1];
        const dz = pos1[2] - pos2[2];
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    
    update(deltaTime) {
        // 更新所有砲彈（內部會處理即時命中）
        this.bullets.forEach(bullet => {
            bullet.update(deltaTime);
        });
        
        // 清理非活躍砲彈
        this.bullets = this.bullets.filter(bullet => bullet.isActive());
    }
    
    render(camera, lighting, textureManager = null) {
        this.bullets.forEach(bullet => {
            bullet.render(camera, lighting, textureManager);
        });
    }
    
    getBullets() {
        return this.bullets.filter(bullet => bullet.isActive());
    }
    
    getActiveBulletCount() {
        return this.bullets.filter(bullet => bullet.isActive()).length;
    }
    
    clear() {
        this.bullets.forEach(bullet => {
            bullet.destroyReason = 'cleared';
            bullet.destroy();
        });
        this.bullets.length = 0;
        this.nextId = 1;
    }
}