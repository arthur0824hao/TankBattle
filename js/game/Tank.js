/**
 * 簡化坦克類別
 * 只支援前後移動和原地旋轉
 */
class Tank {
    constructor(webglCore, shaderManager) {
        this.webglCore = webglCore;
        this.gl = webglCore.getContext();
        this.shaderManager = shaderManager;
        
        // 坦克位置和方向
        this.position = [0, 2, 0];    // 坦克位置
        this.rotation = 0;            // Y軸旋轉角度（弧度）
        
        // 移動參數
        this.moveSpeed = 30;          // 移動速度
        this.rotateSpeed = MatrixLib.degToRad(120); // 旋轉速度
        
        // 場景邊界
        this.boundarySize = 800;
        
        // 坦克模型矩陣
        this.modelMatrix = MatrixLib.identity();
        
        // 材質屬性
        this.material = {
            ambient: [0.2, 0.2, 0.2],
            diffuse: [0.3, 0.6, 0.3],
            specular: [0.5, 0.5, 0.5],
            shininess: 32.0
        };
        
        // 創建幾何體
        this.createGeometry();
        this.updateMatrix();
    }
    
    // 創建坦克幾何體（簡單的長方體）
    createGeometry() {
        // 坦克是一個簡單的長方體
        const width = 8;
        const height = 4;
        const depth = 12;
        
        const halfWidth = width / 2;
        const halfHeight = height / 2;
        const halfDepth = depth / 2;
        
        // 頂點資料：位置(3) + 法向量(3) + 紋理座標(2)
        const vertices = [
            // 前面 (Z+)
            -halfWidth, -halfHeight,  halfDepth,  0,  0,  1,  0, 0,
             halfWidth, -halfHeight,  halfDepth,  0,  0,  1,  1, 0,
             halfWidth,  halfHeight,  halfDepth,  0,  0,  1,  1, 1,
            -halfWidth,  halfHeight,  halfDepth,  0,  0,  1,  0, 1,
            
            // 後面 (Z-)
             halfWidth, -halfHeight, -halfDepth,  0,  0, -1,  0, 0,
            -halfWidth, -halfHeight, -halfDepth,  0,  0, -1,  1, 0,
            -halfWidth,  halfHeight, -halfDepth,  0,  0, -1,  1, 1,
             halfWidth,  halfHeight, -halfDepth,  0,  0, -1,  0, 1,
            
            // 上面 (Y+)
            -halfWidth,  halfHeight,  halfDepth,  0,  1,  0,  0, 0,
             halfWidth,  halfHeight,  halfDepth,  0,  1,  0,  1, 0,
             halfWidth,  halfHeight, -halfDepth,  0,  1,  0,  1, 1,
            -halfWidth,  halfHeight, -halfDepth,  0,  1,  0,  0, 1,
            
            // 下面 (Y-)
            -halfWidth, -halfHeight, -halfDepth,  0, -1,  0,  0, 0,
             halfWidth, -halfHeight, -halfDepth,  0, -1,  0,  1, 0,
             halfWidth, -halfHeight,  halfDepth,  0, -1,  0,  1, 1,
            -halfWidth, -halfHeight,  halfDepth,  0, -1,  0,  0, 1,
            
            // 右面 (X+)
             halfWidth, -halfHeight,  halfDepth,  1,  0,  0,  0, 0,
             halfWidth, -halfHeight, -halfDepth,  1,  0,  0,  1, 0,
             halfWidth,  halfHeight, -halfDepth,  1,  0,  0,  1, 1,
             halfWidth,  halfHeight,  halfDepth,  1,  0,  0,  0, 1,
            
            // 左面 (X-)
            -halfWidth, -halfHeight, -halfDepth, -1,  0,  0,  0, 0,
            -halfWidth, -halfHeight,  halfDepth, -1,  0,  0,  1, 0,
            -halfWidth,  halfHeight,  halfDepth, -1,  0,  0,  1, 1,
            -halfWidth,  halfHeight, -halfDepth, -1,  0,  0,  0, 1
        ];
        
        // 索引
        const indices = [
            0,  1,  2,    0,  2,  3,    // 前面
            4,  5,  6,    4,  6,  7,    // 後面
            8,  9,  10,   8,  10, 11,   // 上面
            12, 13, 14,   12, 14, 15,   // 下面
            16, 17, 18,   16, 18, 19,   // 右面
            20, 21, 22,   20, 22, 23    // 左面
        ];
        
        // 創建緩衝區
        this.geometry = {
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
        
        // 前進
        if (inputHandler.isKeyPressed('w') || inputHandler.isKeyPressed('W')) {
            this.moveForward(deltaTime);
            moved = true;
        }
        
        // 後退
        if (inputHandler.isKeyPressed('s') || inputHandler.isKeyPressed('S')) {
            this.moveBackward(deltaTime);
            moved = true;
        }
        
        // 左轉
        if (inputHandler.isKeyPressed('a') || inputHandler.isKeyPressed('A')) {
            this.rotateLeft(deltaTime);
            moved = true;
        }
        
        // 右轉
        if (inputHandler.isKeyPressed('d') || inputHandler.isKeyPressed('D')) {
            this.rotateRight(deltaTime);
            moved = true;
        }
        
        // 更新變換矩陣
        if (moved) {
            this.updateMatrix();
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
    
    // 左轉
    rotateLeft(deltaTime) {
        this.rotation += this.rotateSpeed * deltaTime;
    }
    
    // 右轉
    rotateRight(deltaTime) {
        this.rotation -= this.rotateSpeed * deltaTime;
    }
    
    // 檢查位置是否有效
    isPositionValid(x, z) {
        return Math.abs(x) <= this.boundarySize && Math.abs(z) <= this.boundarySize;
    }
    
    // 更新變換矩陣
    updateMatrix() {
        this.modelMatrix = MatrixLib.multiply(
            MatrixLib.translate(this.position[0], this.position[1], this.position[2]),
            MatrixLib.rotateY(this.rotation)
        );
    }
    
    // 獲取砲彈發射位置（坦克前方）
    getFirePosition() {
        const fireDistance = 8; // 從坦克前方發射
        return [
            this.position[0] + Math.sin(this.rotation) * fireDistance,
            this.position[1] + 2, // 稍微提高高度
            this.position[2] + Math.cos(this.rotation) * fireDistance
        ];
    }
    
    // 獲取砲彈發射方向
    getFireDirection() {
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
    
    // 渲染坦克
    render(camera, lighting) {
        const program = this.shaderManager.useProgram('phong');
        if (!program) return;
        
        // 設定 uniform 變數
        this.webglCore.setUniform(program, 'uModelMatrix', this.modelMatrix, 'mat4');
        this.webglCore.setUniform(program, 'uViewMatrix', camera.getViewMatrix(), 'mat4');
        this.webglCore.setUniform(program, 'uProjectionMatrix', camera.getProjectionMatrix(), 'mat4');
        this.webglCore.setUniform(program, 'uNormalMatrix', MatrixLib.normalMatrix(this.modelMatrix), 'mat3');
        this.webglCore.setUniform(program, 'uCameraPosition', camera.getPosition(), 'vec3');
        
        // 光照設定
        this.webglCore.setUniform(program, 'uLightPosition', lighting.position, 'vec3');
        this.webglCore.setUniform(program, 'uLightColor', lighting.color, 'vec3');
        
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
    
    // 重置坦克
    reset() {
        this.position = [0, 2, 0];
        this.rotation = 0;
        this.updateMatrix();
    }
    
    // 設定位置
    setPosition(x, y, z) {
        this.position = [x, y, z];
        this.updateMatrix();
    }
    
    // 設定旋轉
    setRotation(rotation) {
        this.rotation = rotation;
        this.updateMatrix();
    }
}



