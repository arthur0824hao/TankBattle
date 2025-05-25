/**
 * 砲彈類別
 * 管理砲彈的物理、碰撞檢測和渲染
 */
class Bullet {
    constructor(webglCore, shaderManager, position, direction) {
        this.webglCore = webglCore;
        this.gl = webglCore.getContext();
        this.shaderManager = shaderManager;
        
        // 物理屬性
        this.position = [...position];
        this.velocity = MatrixLib.multiply3(direction, 30); // 30 單位/秒
        this.gravity = [0, -9.8, 0]; // 重力加速度
        
        // 生命週期
        this.lifetime = 10.0; // 最多飛行10秒
        this.age = 0;
        this.active = true;
        
        // 碰撞屬性
        this.radius = 0.5;
        this.boundarySize = 800;
        
        // 軌跡記錄
        this.trail = [];
        this.maxTrailLength = 20;
        
        // 幾何體
        this.geometry = null;
        this.modelMatrix = MatrixLib.identity();
        
        // 材質屬性
        this.material = {
            ambient: [0.1, 0.1, 0.1],
            diffuse: [0.8, 0.3, 0.1],
            specular: [1.0, 1.0, 1.0],
            shininess: 64.0
        };
        
        this.createGeometry();
        this.updateMatrix();
    }
    
    // 創建球體幾何體
    createGeometry() {
        const radius = this.radius;
        const latSegments = 8;
        const lonSegments = 12;
        
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
    
    // 更新砲彈狀態
    update(deltaTime) {
        if (!this.active) return false;
        
        // 記錄軌跡
        this.trail.push([...this.position]);
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }
        
        // 更新物理
        this.velocity[0] += this.gravity[0] * deltaTime;
        this.velocity[1] += this.gravity[1] * deltaTime;
        this.velocity[2] += this.gravity[2] * deltaTime;
        
        this.position[0] += this.velocity[0] * deltaTime;
        this.position[1] += this.velocity[1] * deltaTime;
        this.position[2] += this.velocity[2] * deltaTime;
        
        // 更新年齡
        this.age += deltaTime;
        
        // 檢查生命週期
        if (this.age >= this.lifetime) {
            this.active = false;
            return false;
        }
        
        // 檢查邊界碰撞
        if (this.checkBoundaryCollision()) {
            this.active = false;
            return false;
        }
        
        // 檢查地面碰撞
        if (this.position[1] <= 0) {
            this.active = false;
            return false;
        }
        
        this.updateMatrix();
        return true;
    }
    
    // 檢查邊界碰撞
    checkBoundaryCollision() {
        return Math.abs(this.position[0]) > this.boundarySize ||
               Math.abs(this.position[2]) > this.boundarySize ||
               this.position[1] > this.boundarySize;
    }
    
    // 檢查與球體的碰撞
    checkSphereCollision(spherePos, sphereRadius) {
        if (!this.active) return false;
        
        const distance = MatrixLib.distance(this.position, spherePos);
        return distance <= (this.radius + sphereRadius);
    }
    
    // 更新模型矩陣
    updateMatrix() {
        this.modelMatrix = MatrixLib.translate(
            this.position[0], 
            this.position[1], 
            this.position[2]
        );
    }
    
    // 渲染砲彈
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
    
    // 渲染軌跡
    renderTrail(camera) {
        if (!this.active || this.trail.length < 2) return;
        
        const program = this.shaderManager.useProgram('particle');
        if (!program) return;
        
        // 設定 uniform
        this.webglCore.setUniform(program, 'uViewMatrix', camera.getViewMatrix(), 'mat4');
        this.webglCore.setUniform(program, 'uProjectionMatrix', camera.getProjectionMatrix(), 'mat4');
        
        // 準備軌跡點資料
        const trailData = [];
        for (let i = 0; i < this.trail.length; i++) {
            const point = this.trail[i];
            const alpha = i / this.trail.length;
            const size = 2.0 * alpha;
            
            trailData.push(
                point[0], point[1], point[2],  // 位置
                size,                          // 大小
                1.0, 0.5 * alpha, 0.0         // 顏色（橙色漸變）
            );
        }
        
        if (trailData.length === 0) return;
        
        // 創建軌跡緩衝區
        const trailBuffer = this.webglCore.createVertexBuffer(trailData);
        
        // 綁定屬性
        this.webglCore.bindVertexAttribute(program, 'aPosition', trailBuffer, 3, this.gl.FLOAT, false, 7 * 4, 0);
        this.webglCore.bindVertexAttribute(program, 'aSize', trailBuffer, 1, this.gl.FLOAT, false, 7 * 4, 3 * 4);
        this.webglCore.bindVertexAttribute(program, 'aColor', trailBuffer, 3, this.gl.FLOAT, false, 7 * 4, 4 * 4);
        
        // 啟用混合
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
        
        // 繪製點
        this.webglCore.drawArrays(this.gl.POINTS, 0, this.trail.length);
        
        // 恢復狀態
        this.gl.disable(this.gl.BLEND);
        
        // 清理緩衝區
        this.gl.deleteBuffer(trailBuffer);
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
    
    // 銷毀砲彈
    destroy() {
        this.active = false;
        this.trail = [];
    }
    
    // 獲取剩餘生命時間
    getRemainingLifetime() {
        return Math.max(0, this.lifetime - this.age);
    }
    
    // 獲取速度
    getVelocity() {
        return [...this.velocity];
    }
    
    // 獲取軌跡長度
    getTrailLength() {
        return this.trail.length;
    }
}

/**
 * 砲彈管理器
 * 管理多個砲彈的生命週期
 */
class BulletManager {
    constructor(webglCore, shaderManager) {
        this.webglCore = webglCore;
        this.shaderManager = shaderManager;
        this.bullets = [];
        this.maxBullets = 5; // 最多同時存在5顆砲彈
    }
    
    // 發射砲彈
    fire(position, direction) {
        // 移除超過限制的舊砲彈
        while (this.bullets.length >= this.maxBullets) {
            this.bullets.shift();
        }
        
        const bullet = new Bullet(this.webglCore, this.shaderManager, position, direction);
        this.bullets.push(bullet);
        
        console.log(`Bullet fired from [${position.map(v => v.toFixed(1)).join(', ')}]`);
        return bullet;
    }
    
    // 更新所有砲彈
    update(deltaTime) {
        this.bullets = this.bullets.filter(bullet => bullet.update(deltaTime));
    }
    
    // 渲染所有砲彈
    render(camera, lighting) {
        this.bullets.forEach(bullet => {
            bullet.render(camera, lighting);
            bullet.renderTrail(camera);
        });
    }
    
    // 檢查與目標的碰撞
    checkCollisions(targets) {
        const hits = [];
        
        this.bullets.forEach((bullet, bulletIndex) => {
            if (!bullet.isActive()) return;
            
            targets.forEach((target, targetIndex) => {
                if (!target.isActive()) return;
                
                if (bullet.checkSphereCollision(target.getPosition(), target.getRadius())) {
                    hits.push({
                        bullet: bullet,
                        bulletIndex: bulletIndex,
                        target: target,
                        targetIndex: targetIndex
                    });
                    
                    bullet.destroy();
                }
            });
        });
        
        return hits;
    }
    
    // 獲取活躍砲彈數量
    getActiveBulletCount() {
        return this.bullets.filter(bullet => bullet.isActive()).length;
    }
    
    // 清除所有砲彈
    clear() {
        this.bullets = [];
    }
    
    // 獲取所有砲彈
    getBullets() {
        return this.bullets;
    }
}