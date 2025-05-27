/**
 * 砲彈類別
 * 處理砲彈的移動、碰撞檢測和生命週期
 */
class Bullet {
    constructor(webglCore, shaderManager, startPosition, direction, speed = 100) {
        this.webglCore = webglCore;
        this.gl = webglCore.getContext();
        this.shaderManager = shaderManager;
        
        // 砲彈屬性
        this.position = [...startPosition];
        this.direction = [...direction];
        this.speed = speed;
        this.radius = 1.0; // 放大至兩倍（從0.5改為1.0）
        this.active = true;
        
        // 生命週期
        this.maxLifeTime = 5.0; // 最大飛行時間（秒）
        this.lifeTime = 0;
        
        // 場景邊界
        this.worldBounds = {
            min: [-800, 0, -800],
            max: [800, 800, 800]
        };
        
        // 幾何體
        this.geometry = null;
        this.modelMatrix = MatrixLib.identity();
        
        // 材質屬性 - 修正為適合金屬紋理的材質
        this.material = {
            ambient: [0.2, 0.2, 0.2],
            diffuse: [0.8, 0.8, 0.8],
            specular: [1.0, 1.0, 1.0],
            shininess: 128.0
        };
        
        this.createGeometry();
        this.updateMatrix();
    }
    
    // 創建球形幾何體
    createGeometry() {
        const radius = this.radius;
        const segments = 16;
        const rings = 12;
        
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
    
    // 更新砲彈
    update(deltaTime) {
        if (!this.active) return;
        
        // 更新生命週期
        this.lifeTime += deltaTime;
        if (this.lifeTime >= this.maxLifeTime) {
            this.active = false;
            return;
        }
        
        // 直線等速運動
        const distance = this.speed * deltaTime;
        this.position[0] += this.direction[0] * distance;
        this.position[1] += this.direction[1] * distance;
        this.position[2] += this.direction[2] * distance;
        
        // 檢查世界邊界碰撞
        if (this.checkWorldBounds()) {
            this.active = false;
            return;
        }
        
        // 更新變換矩陣
        this.updateMatrix();
    }
    
    // 檢查世界邊界碰撞
    checkWorldBounds() {
        return (
            this.position[0] < this.worldBounds.min[0] || this.position[0] > this.worldBounds.max[0] ||
            this.position[1] < this.worldBounds.min[1] || this.position[1] > this.worldBounds.max[1] ||
            this.position[2] < this.worldBounds.min[2] || this.position[2] > this.worldBounds.max[2]
        );
    }
    
    // 檢查與球體的碰撞
    checkSphereCollision(otherPosition, otherRadius) {
        const dx = this.position[0] - otherPosition[0];
        const dy = this.position[1] - otherPosition[1];
        const dz = this.position[2] - otherPosition[2];
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        return distance < (this.radius + otherRadius);
    }
    
    // 檢查與盒子的碰撞
    checkBoxCollision(boxPosition, boxDimensions) {
        // 簡化的AABB碰撞檢測
        const halfDims = [
            boxDimensions[0] / 2,
            boxDimensions[1] / 2,
            boxDimensions[2] / 2
        ];
        
        // 找到盒子上最近的點
        const closest = [
            Math.max(boxPosition[0] - halfDims[0], 
                    Math.min(this.position[0], boxPosition[0] + halfDims[0])),
            Math.max(boxPosition[1] - halfDims[1], 
                    Math.min(this.position[1], boxPosition[1] + halfDims[1])),
            Math.max(boxPosition[2] - halfDims[2], 
                    Math.min(this.position[2], boxPosition[2] + halfDims[2]))
        ];
        
        // 計算距離
        const dx = this.position[0] - closest[0];
        const dy = this.position[1] - closest[1];
        const dz = this.position[2] - closest[2];
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        return distance < this.radius;
    }
    
    // 更新變換矩陣
    updateMatrix() {
        this.modelMatrix = MatrixLib.translate(
            this.position[0], 
            this.position[1], 
            this.position[2]
        );
    }
    
    // 渲染砲彈（修改為支持紋理）
    render(camera, lighting, textureManager = null) {
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
        
        // 使用metal.jpg紋理
        if (textureManager) {
            textureManager.bindTexture('metal', 0);
            this.webglCore.setUniform(program, 'uTexture', 0, 'sampler2D');
            this.webglCore.setUniform(program, 'uUseTexture', true, 'bool');
        } else {
            this.webglCore.setUniform(program, 'uUseTexture', false, 'bool');
        }
        
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
    
    // 銷毀砲彈
    destroy() {
        this.active = false;
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
    
    // 獲取模型矩陣（用於陰影渲染）
    getModelMatrix() {
        return this.modelMatrix;
    }
    
    // 設定世界邊界
    setWorldBounds(min, max) {
        this.worldBounds.min = [...min];
        this.worldBounds.max = [...max];
    }
    
    // 射線投射檢測（簡化版）
    static raycast(origin, direction, targets, maxDistance = Infinity) {
        const hits = [];
        
        targets.forEach(target => {
            const hit = Bullet.rayIntersectSphere(
                origin, 
                direction, 
                target.getPosition(), 
                target.getRadius()
            );
            
            if (hit && hit.distance <= maxDistance) {
                hits.push({
                    target: target,
                    point: hit.point,
                    distance: hit.distance,
                    normal: hit.normal
                });
            }
        });
        
        // 按距離排序
        hits.sort((a, b) => a.distance - b.distance);
        return hits;
    }
    
    // 射線與球體相交檢測
    static rayIntersectSphere(rayOrigin, rayDirection, sphereCenter, sphereRadius) {
        const oc = [
            rayOrigin[0] - sphereCenter[0],
            rayOrigin[1] - sphereCenter[1],
            rayOrigin[2] - sphereCenter[2]
        ];
        
        const a = rayDirection[0] * rayDirection[0] + 
                  rayDirection[1] * rayDirection[1] + 
                  rayDirection[2] * rayDirection[2];
        const b = 2.0 * (oc[0] * rayDirection[0] + 
                        oc[1] * rayDirection[1] + 
                        oc[2] * rayDirection[2]);
        const c = oc[0] * oc[0] + oc[1] * oc[1] + oc[2] * oc[2] - 
                  sphereRadius * sphereRadius;
        
        const discriminant = b * b - 4 * a * c;
        
        if (discriminant < 0) return null;
        
        const t = (-b - Math.sqrt(discriminant)) / (2 * a);
        if (t < 0) return null;
        
        const point = [
            rayOrigin[0] + t * rayDirection[0],
            rayOrigin[1] + t * rayDirection[1],
            rayOrigin[2] + t * rayDirection[2]
        ];
        
        const normal = [
            (point[0] - sphereCenter[0]) / sphereRadius,
            (point[1] - sphereCenter[1]) / sphereRadius,
            (point[2] - sphereCenter[2]) / sphereRadius
        ];
        
        return {
            point: point,
            normal: normal,
            distance: t
        };
    }
}

/**
 * 砲彈管理器
 * 管理多個砲彈的生命週期和渲染
 */
class BulletManager {
    constructor(webglCore, shaderManager) {
        this.webglCore = webglCore;
        this.shaderManager = shaderManager;
        
        this.bullets = [];
        this.maxBullets = 5; // 最多同時存在5顆砲彈
    }
    
    // 發射砲彈
    fire(position, direction, speed = 100) {
        // 如果已達到最大數量，移除最舊的砲彈
        if (this.bullets.length >= this.maxBullets) {
            this.bullets.shift();
        }
        
        const bullet = new Bullet(this.webglCore, this.shaderManager, position, direction, speed);
        this.bullets.push(bullet);
        
        console.log(`Bullet fired from [${position.join(', ')}] in direction [${direction.join(', ')}]`);
    }
    
    // 更新所有砲彈
    update(deltaTime) {
        // 更新砲彈
        this.bullets.forEach(bullet => {
            bullet.update(deltaTime);
        });
        
        // 移除非活躍的砲彈
        this.bullets = this.bullets.filter(bullet => bullet.isActive());
    }
    
    // 渲染所有砲彈（修改為支持紋理）
    render(camera, lighting, textureManager = null) {
        this.bullets.forEach(bullet => {
            bullet.render(camera, lighting, textureManager);
        });
    }
    
    // 獲取所有活躍砲彈
    getBullets() {
        return this.bullets.filter(bullet => bullet.isActive());
    }
    
    // 獲取活躍砲彈數量
    getActiveBulletCount() {
        return this.bullets.filter(bullet => bullet.isActive()).length;
    }
    
    // 清除所有砲彈
    clear() {
        this.bullets.length = 0;
    }
    
    // 檢查砲彈與目標的碰撞
    checkCollisions(targets) {
        const hits = [];
        
        this.bullets.forEach(bullet => {
            if (!bullet.isActive()) return;
            
            targets.forEach(target => {
                if (!target.isActive()) return;
                
                if (bullet.checkSphereCollision(target.getPosition(), target.getRadius())) {
                    hits.push({
                        bullet: bullet,
                        target: target,
                        position: bullet.getPosition()
                    });
                    
                    // 銷毀砲彈
                    bullet.destroy();
                }
            });
        });
        
        return hits;
    }
    
    // 設定最大砲彈數量
    setMaxBullets(count) {
        this.maxBullets = Math.max(1, count);
    }
    
    // 獲取統計資訊
    getStats() {
        return {
            totalBullets: this.bullets.length,
            activeBullets: this.getActiveBulletCount(),
            maxBullets: this.maxBullets
        };
    }
}