/**
 * 目標球類別 - 添加ID系統
 */
class Target {
    constructor(webglCore, shaderManager, targetType = 'white', position = [0, 20, 0], id = null) {
        this.webglCore = webglCore;
        this.gl = webglCore.getContext();
        this.shaderManager = shaderManager;
        
        this.id = id || `${targetType}_${Date.now()}`; // 唯一ID
        this.targetType = targetType;
        this.position = [...position];
        this.radius = 20;
        this.active = true;
        
        this.rotationSpeed = 0.5;
        this.rotationY = 0;
        
        this.respawnTimer = 0;
        this.respawnDelay = 10.0;
        this.isRespawning = false;
        
        this.geometry = null;
        this.modelMatrix = MatrixLib.identity();
        
        this.setupMaterial();
        this.createGeometry();
        this.updateMatrix();
    }
    
    setupMaterial() {
        switch (this.targetType) {
            case 'white':
                this.material = {
                    ambient: [0.3, 0.3, 0.3],
                    diffuse: [0.9, 0.9, 0.9],
                    specular: [0.8, 0.8, 0.8],
                    shininess: 64.0
                };
                break;
            case 'blue':
                this.material = {
                    ambient: [0.1, 0.1, 0.3],
                    diffuse: [0.2, 0.4, 0.9],
                    specular: [0.6, 0.7, 1.0],
                    shininess: 128.0
                };
                break;
            case 'red':
                this.material = {
                    ambient: [0.3, 0.1, 0.1],
                    diffuse: [0.9, 0.2, 0.2],
                    specular: [1.0, 0.5, 0.5],
                    shininess: 128.0
                };
                break;
        }
    }
    
    createGeometry() {
        const radius = this.radius;
        const segments = 24;
        const rings = 16;
        
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
    
    update(deltaTime) {
        if (this.isRespawning) {
            this.respawnTimer += deltaTime;
            if (this.respawnTimer >= this.respawnDelay) {
                this.respawn();
            }
            return;
        }
        
        if (!this.active) return;
        
        this.rotationY += this.rotationSpeed * deltaTime;
        if (this.rotationY > Math.PI * 2) {
            this.rotationY -= Math.PI * 2;
        }
        
        this.updateMatrix();
    }
    
    updateMatrix() {
        const translation = MatrixLib.translate(
            this.position[0], 
            this.position[1], 
            this.position[2]
        );
        const rotation = MatrixLib.rotateY(this.rotationY);
        this.modelMatrix = MatrixLib.multiply(translation, rotation);
    }
    
    render(camera, lighting, textureManager = null) {
        if (!this.active || this.isRespawning || !this.geometry) return;
        
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
        
        if (textureManager && textureManager.isTextureLoaded('target_texture')) {
            textureManager.bindTexture('target_texture', 0);
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
    
    hit() {
        if (!this.active || this.isRespawning) return false;
        
        this.active = false;
        this.isRespawning = true;
        this.respawnTimer = 0;
        
        return true;
    }
    
    respawn() {
        this.active = true;
        this.isRespawning = false;
        this.respawnTimer = 0;
        
        let position;
        let distance;
        let attempts = 0;
        const maxAttempts = 50;
        
        do {
            position = [
                (Math.random() - 0.5) * 200,
                20,
                (Math.random() - 0.5) * 200
            ];
            
            distance = Math.sqrt(position[0] * position[0] + position[2] * position[2]);
            attempts++;
            
        } while (distance < 100 && attempts < maxAttempts);
        
        if (distance < 100) {
            const angle = Math.random() * Math.PI * 2;
            position[0] = Math.cos(angle) * 120;
            position[2] = Math.sin(angle) * 120;
        }
        
        this.position = position;
        this.rotationY = 0;
    }
    
    isActive() {
        return this.active && !this.isRespawning;
    }
    
    getPosition() {
        // 保留原方法
        return [...this.position];
    }

    // 獲取世界座標位置（統一介面）
    getWorldPosition() {
        return CoordinateUtils.extractWorldPosition(this.modelMatrix);
    }
    
    getRadius() {
        return this.radius;
    }
    
    getType() {
        return this.targetType;
    }
    
    getModelMatrix() {
        return this.modelMatrix;
    }
    
    setPosition(x, y, z) {
        this.position = [x, y, z];
        this.updateMatrix();
    }
    
    getId() {
        return this.id;
    }
}

/**
 * 目標管理器 - 修復隨機距離生成
 */
class TargetManager {
    constructor(webglCore, shaderManager) {
        this.webglCore = webglCore;
        this.shaderManager = shaderManager;
        
        this.targets = [];
        this.generateTargets();
    }
    
    generateTargets() {
        this.targets = [];
        
        // 白球 10個 - 添加ID
        for (let i = 0; i < 10; i++) {
            const id = `white_${i + 1}`;
            const position = this.getRandomPositionAwayFromTargets();
            this.targets.push(new Target(this.webglCore, this.shaderManager, 'white', position, id));
        }
        
        // 藍球 5個 - 添加ID
        for (let i = 0; i < 5; i++) {
            const id = `blue_${i + 1}`;
            const position = this.getRandomPositionAwayFromTargets();
            this.targets.push(new Target(this.webglCore, this.shaderManager, 'blue', position, id));
        }
        
        // 紅球 1個 - 添加ID
        const id = 'red_1';
        const position = this.getRandomPositionAwayFromTargets();
        this.targets.push(new Target(this.webglCore, this.shaderManager, 'red', position, id));
    }
    
    // 修復：生成隨機距離位置（最小距離限制）
    generateRandomPosition() {
        // 設定距離範圍：最小70單位，最大140單位（避免太遠）
        const minDistance = 70;  // 最小距離（避免與坦克重疊）
        const maxDistance = 140; // 最大距離（保持在合理範圍內）
        
        // 隨機角度（0-360度）
        const angle = Math.random() * Math.PI * 2;
        
        // 隨機距離（在最小最大距離之間）
        const distance = minDistance + Math.random() * (maxDistance - minDistance);
        
        // 計算位置
        const x = Math.cos(angle) * distance;
        const z = Math.sin(angle) * distance;
        const y = 20; // 固定高度
        
        return [x, y, z];
    }
    
    // 新增：檢查位置是否與現有target衝突
    getRandomPositionAwayFromTargets() {
        let position;
        let attempts = 0;
        const maxAttempts = 100;
        
        do {
            position = this.generateRandomPosition();
            attempts++;
        } while (this.isPositionTooClose(position) && attempts < maxAttempts);
        
        // 如果嘗試太多次都失敗，強制生成一個遠離的位置
        if (attempts >= maxAttempts) {
            console.warn('Target placement: max attempts reached, using fallback position');
            position = this.generateFallbackPosition();
        }
        
        return position;
    }
    
    // 生成後備位置（確保不重疊）
    generateFallbackPosition() {
        const usedAngles = new Set();
        
        // 收集已使用的角度
        this.targets.forEach(target => {
            const pos = target.getPosition();
            const angle = Math.atan2(pos[2], pos[0]);
            usedAngles.add(Math.round(angle * 10) / 10); // 精度到0.1弧度
        });
        
        // 找一個未使用的角度
        let angle = 0;
        for (let i = 0; i < 64; i++) { // 64個方向
            angle = (i / 64) * Math.PI * 2;
            const roundedAngle = Math.round(angle * 10) / 10;
            if (!usedAngles.has(roundedAngle)) {
                break;
            }
        }
        
        const distance = 80 + Math.random() * 40; // 80-120距離
        return [
            Math.cos(angle) * distance,
            20,
            Math.sin(angle) * distance
        ];
    }
    
    isPositionTooClose(newPosition) {
        const minDistance = 50; // target間最少50單位間距
        const minTankDistance = 60; // 與坦克最少60單位距離
        
        // 檢查與坦克的距離
        const tankDistance = CoordinateUtils.calculateDistance2D(newPosition, [0, 0, 0]);
        if (tankDistance < minTankDistance) {
            return true;
        }
        
        // 檢查與其他target的距離
        return this.targets.some(target => {
            const distance = CoordinateUtils.calculateDistance(newPosition, target.getPosition());
            return distance < minDistance;
        });
    }
    
    calculateDistance(pos1, pos2) {
        // 使用統一的距離計算工具
        return CoordinateUtils.calculateDistance(pos1, pos2);
    }
    
    update(deltaTime) {
        this.targets.forEach(target => {
            target.update(deltaTime);
        });
    }
    
    render(camera, lighting, textureManager = null) {
        this.targets.forEach(target => {
            target.render(camera, lighting, textureManager);
        });
    }
    
    getActiveTargets() {
        return this.targets.filter(target => target.isActive());
    }
    
    getActiveTargetCount() {
        return this.targets.filter(target => target.isActive()).length;
    }
    
    reset() {
        this.generateTargets();
    }
    
    getTargets() {
        return [...this.targets];
    }
    
    // 根據ID獲取target
    getTargetById(id) {
        return this.targets.find(target => target.getId() === id);
    }
}