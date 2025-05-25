/**
 * 目標球類別
 * 管理不同類型的目標球（白球、藍球、紅球）
 */
class Target {
    constructor(webglCore, shaderManager, type) {
        this.webglCore = webglCore;
        this.gl = webglCore.getContext();
        this.shaderManager = shaderManager;
        
        // 目標類型和屬性
        this.type = type; // 'white', 'blue', 'red'
        this.setupTargetProperties();
        
        // 位置和狀態
        this.position = [0, 0, 0];
        this.active = true;
        this.respawnTime = 10.0; // 10秒後重生
        this.respawnTimer = 0;
        
        // 動畫屬性
        this.rotationY = 0;
        this.rotationSpeed = MatrixLib.degToRad(30); // 30度/秒
        this.bobOffset = Math.random() * Math.PI * 2; // 隨機浮動偏移
        this.bobSpeed = 2.0; // 浮動速度
        this.bobHeight = 1.0; // 浮動高度
        this.baseHeight = 0;
        
        // 幾何體和材質
        this.geometry = null;
        this.modelMatrix = MatrixLib.identity();
        
        this.createGeometry();
        this.randomizePosition();
    }
    
    // 設定目標屬性
    setupTargetProperties() {
        const baseRadius = 20;
        
        switch (this.type) {
            case 'white':
                this.radius = baseRadius * 3; // 60單位
                this.score = 1;
                this.material = {
                    ambient: [0.3, 0.3, 0.3],
                    diffuse: [0.9, 0.9, 0.9],
                    specular: [1.0, 1.0, 1.0],
                    shininess: 64.0
                };
                break;
            case 'blue':
                this.radius = baseRadius * 2; // 40單位
                this.score = 5;
                this.material = {
                    ambient: [0.1, 0.1, 0.3],
                    diffuse: [0.2, 0.4, 0.8],
                    specular: [0.8, 0.8, 1.0],
                    shininess: 32.0
                };
                break;
            case 'red':
                this.radius = baseRadius; // 20單位
                this.score = 10;
                this.material = {
                    ambient: [0.3, 0.1, 0.1],
                    diffuse: [0.8, 0.2, 0.2],
                    specular: [1.0, 0.5, 0.5],
                    shininess: 16.0
                };
                break;
        }
    }
    
    // 創建球體幾何體
    createGeometry() {
        const radius = this.radius;
        const latSegments = 16;
        const lonSegments = 24;
        
        const vertices = [];
        const indices = [];
        
        // 頂點
        for (let lat = 0; lat <= latSegments; lat++) {
            const theta = lat * Math.PI / latSegments;
            const sinTheta = Math.sin(theta);
            const cosTheta = Math.cos(theta);
            
            for (let lon = 0; lon <= lonSegments; lon++) {
                const phi = lon * 2 * Math.PI / lonSegments;
                const sinPhi = Math.sin(phi);
                const cosPhi = Math.cos(phi);
                
                const x = cosPhi * sinTheta;
                const y = cosTheta;
                const z = sinPhi * sinTheta;
                
                const u = 1 - (lon / lonSegments);
                const v = 1 - (lat / latSegments);
                
                vertices.push(
                    radius * x, radius * y, radius * z,  // 位置
                    x, y, z,                              // 法向量
                    u, v                                  // 紋理座標
                );
            }
        }
        
        // 索引
        for (let lat = 0; lat < latSegments; lat++) {
            for (let lon = 0; lon < lonSegments; lon++) {
                const first = (lat * (lonSegments + 1)) + lon;
                const second = first + lonSegments + 1;
                
                indices.push(first, second, first + 1);
                indices.push(second, second + 1, first + 1);
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
    
    // 隨機化位置
    randomizePosition() {
        const boundarySize = 700; // 比場景邊界小一點
        const minHeight = this.radius + 10;
        const maxHeight = 200;
        
        this.position[0] = (Math.random() - 0.5) * 2 * boundarySize;
        this.position[2] = (Math.random() - 0.5) * 2 * boundarySize;
        this.baseHeight = Math.random() * (maxHeight - minHeight) + minHeight;
        this.position[1] = this.baseHeight;
    }
    
    // 更新目標狀態
    update(deltaTime) {
        if (!this.active) {
            // 處理重生倒計時
            this.respawnTimer += deltaTime;
            if (this.respawnTimer >= this.respawnTime) {
                this.respawn();
            }
            return;
        }
        
        // 旋轉動畫
        this.rotationY += this.rotationSpeed * deltaTime;
        
        // 浮動動畫
        const bobTime = Date.now() * 0.001 * this.bobSpeed + this.bobOffset;
        this.position[1] = this.baseHeight + Math.sin(bobTime) * this.bobHeight;
        
        this.updateMatrix();
    }
    
    // 重生
    respawn() {
        this.active = true;
        this.respawnTimer = 0;
        this.randomizePosition();
        console.log(`${this.type} target respawned at [${this.position.map(v => v.toFixed(1)).join(', ')}]`);
    }
    
    // 被擊中
    hit() {
        if (!this.active) return 0;
        
        this.active = false;
        this.respawnTimer = 0;
        
        console.log(`${this.type} target hit! Score: ${this.score}`);
        return this.score;
    }
    
    // 更新模型矩陣
    updateMatrix() {
        this.modelMatrix = MatrixLib.multiply(
            MatrixLib.translate(this.position[0], this.position[1], this.position[2]),
            MatrixLib.rotateY(this.rotationY)
        );
    }
    
    // 渲染目標
    render(camera, lighting) {
        if (!this.active) return;
        
        const program = this.shaderManager.useProgram('phong');
        if (!program) return;
        
        // 設定 uniform
        this.webglCore.setUniform(program, 'uModelMatrix', this.modelMatrix, 'mat4');
        this.webglCore.setUniform(program, 'uViewMatrix', camera.getViewMatrix(), 'mat4');
        this.webglCore.setUniform(program, 'uProjectionMatrix', camera.getProjectionMatrix(), 'mat4');
        this.webglCore.setUniform(program, 'uNormalMatrix', MatrixLib.normalMatrix(this.modelMatrix), 'mat3');
        this.webglCore.setUniform(program, 'uCameraPosition', camera.getPosition(), 'vec3');
        
        // 設定光照
        this.webglCore.setUniform(program, 'uLightPosition', lighting.position, 'vec3');
        this.webglCore.setUniform(program, 'uLightColor', lighting.color, 'vec3');
        
        // 設定材質
        this.webglCore.setUniform(program, 'uAmbientColor', this.material.ambient, 'vec3');
        this.webglCore.setUniform(program, 'uDiffuseColor', this.material.diffuse, 'vec3');
        this.webglCore.setUniform(program, 'uSpecularColor', this.material.specular, 'vec3');
        this.webglCore.setUniform(program, 'uShininess', this.material.shininess, 'float');
        this.webglCore.setUniform(program, 'uUseTexture', false, 'bool');
        
        // 綁定頂點屬性
        this.webglCore.bindVertexAttribute(program, 'aPosition', this.geometry.vertexBuffer, 3, this.gl.FLOAT, false, 8 * 4, 0);
        this.webglCore.bindVertexAttribute(program, 'aNormal', this.geometry.vertexBuffer, 3, this.gl.FLOAT, false, 8 * 4, 3 * 4);
        this.webglCore.bindVertexAttribute(program, 'aTexCoord', this.geometry.vertexBuffer, 2, this.gl.FLOAT, false, 8 * 4, 6 * 4);
        
        // 繪製
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.geometry.indexBuffer);
        this.webglCore.drawElements(this.gl.TRIANGLES, this.geometry.indexCount);
    }
    
    // 獲取位置
    getPosition() {
        return [...this.position];
    }
    
    // 獲取半徑
    getRadius() {
        return this.radius;
    }
    
    // 獲取分數
    getScore() {
        return this.score;
    }
    
    // 獲取類型
    getType() {
        return this.type;
    }
    
    // 檢查是否活躍
    isActive() {
        return this.active;
    }
    
    // 獲取重生剩餘時間
    getRespawnTimeRemaining() {
        return Math.max(0, this.respawnTime - this.respawnTimer);
    }
}

/**
 * 目標管理器
 * 管理所有目標球的生成和更新
 */
class TargetManager {
    constructor(webglCore, shaderManager) {
        this.webglCore = webglCore;
        this.shaderManager = shaderManager;
        this.targets = [];
        
        this.createTargets();
    }
    
    // 創建所有目標
    createTargets() {
        // 10個白球
        for (let i = 0; i < 10; i++) {
            this.targets.push(new Target(this.webglCore, this.shaderManager, 'white'));
        }
        
        // 5個藍球
        for (let i = 0; i < 5; i++) {
            this.targets.push(new Target(this.webglCore, this.shaderManager, 'blue'));
        }
        
        // 1個紅球
        this.targets.push(new Target(this.webglCore, this.shaderManager, 'red'));
        
        console.log(`Created ${this.targets.length} targets`);
    }
    
    // 更新所有目標
    update(deltaTime) {
        this.targets.forEach(target => target.update(deltaTime));
    }
    
    // 渲染所有目標
    render(camera, lighting) {
        this.targets.forEach(target => target.render(camera, lighting));
    }
    
    // 檢查碰撞並處理擊中
    checkCollisions(bullets) {
        const hits = [];
        
        bullets.forEach(bullet => {
            if (!bullet.isActive()) return;
            
            this.targets.forEach(target => {
                if (!target.isActive()) return;
                
                if (bullet.checkSphereCollision(target.getPosition(), target.getRadius())) {
                    const score = target.hit();
                    hits.push({
                        target: target,
                        score: score,
                        type: target.getType(),
                        position: target.getPosition()
                    });
                }
            });
        });
        
        return hits;
    }
    
    // 重置所有目標
    reset() {
        this.targets.forEach(target => {
            target.active = true;
            target.respawnTimer = 0;
            target.randomizePosition();
        });
    }
    
    // 獲取活躍目標數量
    getActiveTargetCount() {
        return this.targets.filter(target => target.isActive()).length;
    }
    
    // 獲取目標統計
    getTargetStats() {
        const stats = {
            white: { active: 0, total: 0 },
            blue: { active: 0, total: 0 },
            red: { active: 0, total: 0 }
        };
        
        this.targets.forEach(target => {
            stats[target.getType()].total++;
            if (target.isActive()) {
                stats[target.getType()].active++;
            }
        });
        
        return stats;
    }
    
    // 獲取所有目標
    getTargets() {
        return this.targets;
    }
    
    // 獲取活躍目標
    getActiveTargets() {
        return this.targets.filter(target => target.isActive());
    }
}