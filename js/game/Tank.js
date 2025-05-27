/**
 * 坦克類別 - 三組件設計
 * 包含底座、砲座、砲管三個分離組件
 */
class Tank {
    constructor(webglCore, shaderManager) {
        this.webglCore = webglCore;
        this.gl = webglCore.getContext();
        this.shaderManager = shaderManager;
        
        // 坦克位置和方向
        this.position = [0, 0, 0];    // 坦克核心位置
        this.rotation = 0;            // Y軸旋轉角度（弧度）
        
        // 移動參數
        this.moveSpeed = 30;          // 移動速度
        this.rotateSpeed = MatrixLib.degToRad(120); // 旋轉速度
        
        // 場景邊界
        this.boundarySize = 800;
        
        // 坦克組件幾何體
        this.baseGeometry = null;     // 底座
        this.turretGeometry = null;   // 砲座
        this.barrelGeometry = null;   // 砲管
        
        // 組件變換矩陣
        this.baseMatrix = MatrixLib.identity();
        this.turretMatrix = MatrixLib.identity();
        this.barrelMatrix = MatrixLib.identity();
        
        // 材質屬性 - 修正為適合紋理的材質
        this.materials = {
            base: {
                ambient: [0.2, 0.2, 0.2],
                diffuse: [0.8, 0.8, 0.8],
                specular: [0.3, 0.3, 0.3],
                shininess: 32.0
            },
            turret: {
                ambient: [0.2, 0.2, 0.2],
                diffuse: [0.8, 0.8, 0.8],
                specular: [0.4, 0.4, 0.4],
                shininess: 64.0
            },
            barrel: {
                ambient: [0.2, 0.2, 0.2],
                diffuse: [0.8, 0.8, 0.8],
                specular: [0.8, 0.8, 0.8],
                shininess: 128.0
            }
        };
        
        // 創建幾何體
        this.createGeometry();
        this.updateMatrices();
    }
    
    // 創建坦克幾何體
    createGeometry() {
        this.createBaseGeometry();
        this.createTurretGeometry();
        this.createBarrelGeometry();
    }
    
    // 創建底座幾何體（長方體）- 修復紋理貼圖
    createBaseGeometry() {
        const width = 12;
        const height = 4;
        const depth = 16;
        
        const halfWidth = width / 2;
        const halfHeight = height / 2;
        const halfDepth = depth / 2;
        
        // 底座位置：Y軸偏移，使底部貼地
        const offsetY = halfHeight;
        
        const vertices = [
            // 前面 (Z+) - 確保每個面都有完整的0-1紋理座標
            -halfWidth, -halfHeight + offsetY,  halfDepth,  0,  0,  1,  0, 0,
             halfWidth, -halfHeight + offsetY,  halfDepth,  0,  0,  1,  1, 0,
             halfWidth,  halfHeight + offsetY,  halfDepth,  0,  0,  1,  1, 1,
            -halfWidth,  halfHeight + offsetY,  halfDepth,  0,  0,  1,  0, 1,
            
            // 後面 (Z-) - 完整紋理座標
             halfWidth, -halfHeight + offsetY, -halfDepth,  0,  0, -1,  0, 0,
            -halfWidth, -halfHeight + offsetY, -halfDepth,  0,  0, -1,  1, 0,
            -halfWidth,  halfHeight + offsetY, -halfDepth,  0,  0, -1,  1, 1,
             halfWidth,  halfHeight + offsetY, -halfDepth,  0,  0, -1,  0, 1,
            
            // 上面 (Y+) - 完整紋理座標
            -halfWidth,  halfHeight + offsetY,  halfDepth,  0,  1,  0,  0, 0,
             halfWidth,  halfHeight + offsetY,  halfDepth,  0,  1,  0,  1, 0,
             halfWidth,  halfHeight + offsetY, -halfDepth,  0,  1,  0,  1, 1,
            -halfWidth,  halfHeight + offsetY, -halfDepth,  0,  1,  0,  0, 1,
            
            // 下面 (Y-) - 完整紋理座標
            -halfWidth, -halfHeight + offsetY, -halfDepth,  0, -1,  0,  0, 0,
             halfWidth, -halfHeight + offsetY, -halfDepth,  0, -1,  0,  1, 0,
             halfWidth, -halfHeight + offsetY,  halfDepth,  0, -1,  0,  1, 1,
            -halfWidth, -halfHeight + offsetY,  halfDepth,  0, -1,  0,  0, 1,
            
            // 右面 (X+) - 完整紋理座標
             halfWidth, -halfHeight + offsetY,  halfDepth,  1,  0,  0,  0, 0,
             halfWidth, -halfHeight + offsetY, -halfDepth,  1,  0,  0,  1, 0,
             halfWidth,  halfHeight + offsetY, -halfDepth,  1,  0,  0,  1, 1,
             halfWidth,  halfHeight + offsetY,  halfDepth,  1,  0,  0,  0, 1,
            
            // 左面 (X-) - 完整紋理座標
            -halfWidth, -halfHeight + offsetY, -halfDepth, -1,  0,  0,  0, 0,
            -halfWidth, -halfHeight + offsetY,  halfDepth, -1,  0,  0,  1, 0,
            -halfWidth,  halfHeight + offsetY,  halfDepth, -1,  0,  0,  1, 1,
            -halfWidth,  halfHeight + offsetY, -halfDepth, -1,  0,  0,  0, 1
        ];
        
        const indices = [
            0,  1,  2,    0,  2,  3,    // 前面
            4,  5,  6,    4,  6,  7,    // 後面
            8,  9,  10,   8,  10, 11,   // 上面
            12, 13, 14,   12, 14, 15,   // 下面
            16, 17, 18,   16, 18, 19,   // 右面
            20, 21, 22,   20, 22, 23    // 左面
        ];
        
        this.baseGeometry = {
            vertices: new Float32Array(vertices),
            indices: new Uint16Array(indices),
            vertexBuffer: this.webglCore.createVertexBuffer(vertices),
            indexBuffer: this.webglCore.createIndexBuffer(indices),
            indexCount: indices.length
        };
    }
    
    // 創建砲座幾何體（較小的長方體）- 修復紋理貼圖
    createTurretGeometry() {
        const width = 8;
        const height = 3;
        const depth = 8;
        
        const halfWidth = width / 2;
        const halfHeight = height / 2;
        const halfDepth = depth / 2;
        
        // 砲座位置：在底座上方
        const offsetY = 4 + halfHeight; // 底座高度4 + 砲座一半高度
        
        const vertices = [
            // 前面 (Z+) - 完整紋理座標 0-1
            -halfWidth, -halfHeight + offsetY,  halfDepth,  0,  0,  1,  0, 0,
             halfWidth, -halfHeight + offsetY,  halfDepth,  0,  0,  1,  1, 0,
             halfWidth,  halfHeight + offsetY,  halfDepth,  0,  0,  1,  1, 1,
            -halfWidth,  halfHeight + offsetY,  halfDepth,  0,  0,  1,  0, 1,
            
            // 後面 (Z-) - 完整紋理座標 0-1
             halfWidth, -halfHeight + offsetY, -halfDepth,  0,  0, -1,  0, 0,
            -halfWidth, -halfHeight + offsetY, -halfDepth,  0,  0, -1,  1, 0,
            -halfWidth,  halfHeight + offsetY, -halfDepth,  0,  0, -1,  1, 1,
             halfWidth,  halfHeight + offsetY, -halfDepth,  0,  0, -1,  0, 1,
            
            // 上面 (Y+) - 完整紋理座標 0-1
            -halfWidth,  halfHeight + offsetY,  halfDepth,  0,  1,  0,  0, 0,
             halfWidth,  halfHeight + offsetY,  halfDepth,  0,  1,  0,  1, 0,
             halfWidth,  halfHeight + offsetY, -halfDepth,  0,  1,  0,  1, 1,
            -halfWidth,  halfHeight + offsetY, -halfDepth,  0,  1,  0,  0, 1,
            
            // 下面 (Y-) - 完整紋理座標 0-1
            -halfWidth, -halfHeight + offsetY, -halfDepth,  0, -1,  0,  0, 0,
             halfWidth, -halfHeight + offsetY, -halfDepth,  0, -1,  0,  1, 0,
             halfWidth, -halfHeight + offsetY,  halfDepth,  0, -1,  0,  1, 1,
            -halfWidth, -halfHeight + offsetY,  halfDepth,  0, -1,  0,  0, 1,
            
            // 右面 (X+) - 完整紋理座標 0-1
             halfWidth, -halfHeight + offsetY,  halfDepth,  1,  0,  0,  0, 0,
             halfWidth, -halfHeight + offsetY, -halfDepth,  1,  0,  0,  1, 0,
             halfWidth,  halfHeight + offsetY, -halfDepth,  1,  0,  0,  1, 1,
             halfWidth,  halfHeight + offsetY,  halfDepth,  1,  0,  0,  0, 1,
            
            // 左面 (X-) - 完整紋理座標 0-1
            -halfWidth, -halfHeight + offsetY, -halfDepth, -1,  0,  0,  0, 0,
            -halfWidth, -halfHeight + offsetY,  halfDepth, -1,  0,  0,  1, 0,
            -halfWidth,  halfHeight + offsetY,  halfDepth, -1,  0,  0,  1, 1,
            -halfWidth,  halfHeight + offsetY, -halfDepth, -1,  0,  0,  0, 1
        ];
        
        const indices = [
            0,  1,  2,    0,  2,  3,    // 前面
            4,  5,  6,    4,  6,  7,    // 後面
            8,  9,  10,   8,  10, 11,   // 上面
            12, 13, 14,   12, 14, 15,   // 下面
            16, 17, 18,   16, 18, 19,   // 右面
            20, 21, 22,   20, 22, 23    // 左面
        ];
        
        this.turretGeometry = {
            vertices: new Float32Array(vertices),
            indices: new Uint16Array(indices),
            vertexBuffer: this.webglCore.createVertexBuffer(vertices),
            indexBuffer: this.webglCore.createIndexBuffer(indices),
            indexCount: indices.length
        };
    }
    
    // 創建砲管幾何體（圓柱體）- 修復紋理貼圖
    createBarrelGeometry() {
        const radius = 0.8;
        const length = 12;
        const segments = 12;
        
        const vertices = [];
        const indices = [];
        
        // 砲管位置：從砲座中心向前延伸
        const offsetY = 4 + 1.5; // 底座高度4 + 砲座一半高度1.5
        const startZ = 0;
        const endZ = length;
        
        // 生成圓柱體頂點 - 確保紋理座標覆蓋整個表面
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            
            // 圓柱體前端
            vertices.push(
                x, y + offsetY, startZ,    // 位置
                x / radius, y / radius, 0, // 法向量
                i / segments, 0            // 紋理座標 (0到1)
            );
            
            // 圓柱體後端
            vertices.push(
                x, y + offsetY, endZ,      // 位置
                x / radius, y / radius, 0, // 法向量
                i / segments, 1            // 紋理座標 (0到1)
            );
        }
        
        // 生成圓柱體側面索引
        for (let i = 0; i < segments; i++) {
            const curr = i * 2;
            const next = ((i + 1) % (segments + 1)) * 2;
            
            // 第一個三角形
            indices.push(curr, next, curr + 1);
            // 第二個三角形
            indices.push(curr + 1, next, next + 1);
        }
        
        // 添加圓柱體端面
        const centerStartIndex = vertices.length / 8;
        const centerEndIndex = centerStartIndex + 1;
        
        // 前端面中心點
        vertices.push(0, offsetY, startZ, 0, 0, -1, 0.5, 0.5);
        // 後端面中心點
        vertices.push(0, offsetY, endZ, 0, 0, 1, 0.5, 0.5);
        
        // 前端面三角形
        for (let i = 0; i < segments; i++) {
            const curr = i * 2;
            const next = ((i + 1) % (segments + 1)) * 2;
            indices.push(centerStartIndex, next, curr);
        }
        
        // 後端面三角形
        for (let i = 0; i < segments; i++) {
            const curr = i * 2 + 1;
            const next = ((i + 1) % (segments + 1)) * 2 + 1;
            indices.push(centerEndIndex, curr, next);
        }
        
        this.barrelGeometry = {
            vertices: new Float32Array(vertices),
            indices: new Uint16Array(indices),
            vertexBuffer: this.webglCore.createVertexBuffer(vertices),
            indexBuffer: this.webglCore.createIndexBuffer(indices),
            indexCount: indices.length
        };
    }
    
    // 更新坦克
    update(deltaTime, inputHandler) {
        let moved = false;
        
        // 左轉 (A鍵) - 逆時針旋轉
        if (inputHandler.isKeyPressed('a') || inputHandler.isKeyPressed('A')) {
            this.rotateLeft(deltaTime);
            moved = true;
            console.log(`Tank rotating left: ${(this.rotation * 180 / Math.PI).toFixed(1)}°`);
        }
        
        // 右轉 (D鍵) - 順時針旋轉
        if (inputHandler.isKeyPressed('d') || inputHandler.isKeyPressed('D')) {
            this.rotateRight(deltaTime);
            moved = true;
            console.log(`Tank rotating right: ${(this.rotation * 180 / Math.PI).toFixed(1)}°`);
        }
        
        // 更新變換矩陣
        if (moved) {
            this.updateMatrices();
        }
        
        return moved;
    }
    
    // 向前移動
    moveForward(deltaTime) {
        const distance = this.moveSpeed * deltaTime;
        const newX = this.position[0] + Math.sin(this.rotation) * distance;
        const newZ = this.position[2] + Math.cos(this.rotation) * distance;
        
        if (this.isPositionValid(newX, newZ)) {
            this.position[0] = newX;
            this.position[2] = newZ;
        }
    }
    
    // 向後移動
    moveBackward(deltaTime) {
        const distance = this.moveSpeed * deltaTime;
        const newX = this.position[0] - Math.sin(this.rotation) * distance;
        const newZ = this.position[2] - Math.cos(this.rotation) * distance;
        
        if (this.isPositionValid(newX, newZ)) {
            this.position[0] = newX;
            this.position[2] = newZ;
        }
    }
    
    // 左轉 - 逆時針旋轉（增加角度）
    rotateLeft(deltaTime) {
        this.rotation += this.rotateSpeed * deltaTime;
        // 正規化角度到 -π 到 π 範圍
        while (this.rotation > Math.PI) {
            this.rotation -= Math.PI * 2;
        }
    }
    
    // 右轉 - 順時針旋轉（減少角度）
    rotateRight(deltaTime) {
        this.rotation -= this.rotateSpeed * deltaTime;
        // 正規化角度到 -π 到 π 範圍
        while (this.rotation < -Math.PI) {
            this.rotation += Math.PI * 2;
        }
    }
    
    // 檢查位置是否有效
    isPositionValid(x, z) {
        return Math.abs(x) <= this.boundarySize && Math.abs(z) <= this.boundarySize;
    }
    
    // 更新變換矩陣
    updateMatrices() {
        // 先平移到位置，再繞Y軸旋轉
        const translation = MatrixLib.translate(this.position[0], this.position[1], this.position[2]);
        const rotation = MatrixLib.rotateY(this.rotation);
        
        // 正確的變換順序：先旋轉再平移（T * R）
        const worldMatrix = MatrixLib.multiply(translation, rotation);
        
        // 所有組件共用相同的世界變換
        this.baseMatrix = worldMatrix;
        this.turretMatrix = worldMatrix;
        this.barrelMatrix = worldMatrix;
        
        console.log(`Tank matrices updated, position: [${this.position.map(v => v.toFixed(1)).join(', ')}], rotation: ${(this.rotation * 180 / Math.PI).toFixed(1)}°`);
    }
    
    // 獲取砲彈發射位置（砲管前端）
    getFirePosition() {
        const barrelLength = 12;
        const barrelHeight = 5.5; // 底座4 + 砲座1.5
        
        // 使用坦克的旋轉角度計算砲管前端位置
        return [
            this.position[0] + Math.sin(this.rotation) * barrelLength,
            this.position[1] + barrelHeight,
            this.position[2] + Math.cos(this.rotation) * barrelLength
        ];
    }
    
    // 獲取砲彈發射方向
    getFireDirection() {
        // 坦克前方向量（考慮旋轉）
        return [
            Math.sin(this.rotation),
            0,
            Math.cos(this.rotation)
        ];
    }
    
    // 獲取坦克位置
    getPosition() {
        return [...this.position];
    }
    
    // 獲取坦克旋轉角度
    getRotationY() {
        return this.rotation;
    }
    
    // 獲取前方向量
    getForwardVector() {
        return [Math.sin(this.rotation), 0, Math.cos(this.rotation)];
    }
    
    // 獲取右方向量
    getRightVector() {
        return [Math.cos(this.rotation), 0, -Math.sin(this.rotation)];
    }
    
    // 獲取模型矩陣（用於陰影渲染）
    getModelMatrix() {
        return this.baseMatrix;
    }
    
    // 渲染坦克組件（添加紋理支持）
    renderComponent(geometry, material, matrix, camera, lighting, textureManager, textureName) {
        const program = this.shaderManager.useProgram('phong');
        if (!program) return;
        
        // 設定變換矩陣
        this.webglCore.setUniform(program, 'uModelMatrix', matrix, 'mat4');
        this.webglCore.setUniform(program, 'uViewMatrix', camera.getViewMatrix(), 'mat4');
        this.webglCore.setUniform(program, 'uProjectionMatrix', camera.getProjectionMatrix(), 'mat4');
        this.webglCore.setUniform(program, 'uNormalMatrix', MatrixLib.normalMatrix(matrix), 'mat3');
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
        this.webglCore.setUniform(program, 'uAmbientColor', material.ambient, 'vec3');
        this.webglCore.setUniform(program, 'uDiffuseColor', material.diffuse, 'vec3');
        this.webglCore.setUniform(program, 'uSpecularColor', material.specular, 'vec3');
        this.webglCore.setUniform(program, 'uShininess', material.shininess, 'float');
        
        // 應用紋理
        if (textureManager && textureName) {
            textureManager.bindTexture(textureName, 0);
            this.webglCore.setUniform(program, 'uTexture', 0, 'sampler2D');
            this.webglCore.setUniform(program, 'uUseTexture', true, 'bool');
        } else {
            this.webglCore.setUniform(program, 'uUseTexture', false, 'bool');
        }
        
        // 綁定頂點屬性
        const positionBound = this.webglCore.bindVertexAttribute(
            program, 'aPosition', geometry.vertexBuffer, 3, this.gl.FLOAT, false, 8 * 4, 0
        );
        const normalBound = this.webglCore.bindVertexAttribute(
            program, 'aNormal', geometry.vertexBuffer, 3, this.gl.FLOAT, false, 8 * 4, 3 * 4
        );
        const texCoordBound = this.webglCore.bindVertexAttribute(
            program, 'aTexCoord', geometry.vertexBuffer, 2, this.gl.FLOAT, false, 8 * 4, 6 * 4
        );
        
        // 繪製
        if (positionBound) {
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, geometry.indexBuffer);
            this.webglCore.drawElements(this.gl.TRIANGLES, geometry.indexCount);
        }
    }
    
    // 渲染坦克（修改為支持分別的紋理）
    render(camera, lighting, textureManager = null) {
        // 渲染底座 - 使用 tank_base.jpg 紋理
        this.renderComponent(this.baseGeometry, this.materials.base, this.baseMatrix, camera, lighting, textureManager, 'tankBase');
        
        // 渲染砲座 - 使用 tank_turret.jpg 紋理  
        this.renderComponent(this.turretGeometry, this.materials.turret, this.turretMatrix, camera, lighting, textureManager, 'tankTurret');
        
        // 渲染砲管 - 使用 tank_barrel.jpg 紋理
        this.renderComponent(this.barrelGeometry, this.materials.barrel, this.barrelMatrix, camera, lighting, textureManager, 'tankBarrel');
    }
    
    // 渲染陰影
    renderShadow(program) {
        // 渲染所有組件的陰影
        const geometries = [this.baseGeometry, this.turretGeometry, this.barrelGeometry];
        const matrices = [this.baseMatrix, this.turretMatrix, this.barrelMatrix];
        
        geometries.forEach((geometry, index) => {
            if (!geometry) return;
            
            this.webglCore.setUniform(program, 'uModelMatrix', matrices[index], 'mat4');
            
            this.webglCore.bindVertexAttribute(
                program, 'aPosition', geometry.vertexBuffer, 3, this.gl.FLOAT, false, 8 * 4, 0
            );
            
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, geometry.indexBuffer);
            this.webglCore.drawElements(this.gl.TRIANGLES, geometry.indexCount);
        });
    }
    
    // 重置坦克
    reset() {
        this.position = [0, 0, 0];
        this.rotation = 0;
        this.updateMatrices();
        console.log('Tank reset to origin');
    }
    
    // 設定位置
    setPosition(x, y, z) {
        this.position = [x, y, z];
        this.updateMatrices();
    }
    
    // 設定旋轉
    setRotation(rotation) {
        this.rotation = rotation;
        this.updateMatrices();
    }
}