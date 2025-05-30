/**
 * 場景管理器
 * 管理場景幾何體、邊界、環境渲染和天空盒
 */
class Scene {
    constructor(webglCore, shaderManager, textureManager = null) {
        this.webglCore = webglCore;
        this.gl = webglCore.getContext();
        this.shaderManager = shaderManager;
        this.textureManager = textureManager;
        
        // 場景參數
        this.boundarySize = 800;
        this.floorLevel = 0;
        this.ceilingHeight = 800;
        
        // 幾何體
        this.floorGeometry = null;
        this.wallGeometry = null;
        this.ceilingGeometry = null;
        this.skyboxGeometry = null;
        
        // 材質
        this.floorMaterial = {
            ambient: [0.1, 0.1, 0.1],
            diffuse: [0.3, 0.3, 0.3],
            specular: [0.5, 0.5, 0.5],
            shininess: 16.0
        };
        
        this.wallMaterial = {
            ambient: [0.1, 0.1, 0.15],
            diffuse: [0.2, 0.2, 0.3],
            specular: [0.3, 0.3, 0.4],
            shininess: 8.0
        };
        
        this.createGeometry();
    }
    
    // 創建場景幾何體
    createGeometry() {
        this.createGroundGeometry();
        this.createWalls();
        this.createCeiling();
        this.createSkybox();
    }
    
    // 創建天空盒幾何體
    createSkybox() {
        // 創建一個大立方體，內表面朝向攝影機
        const size = 1.0; // 使用標準化大小，不需要太大
        
        const vertices = [
            // 位置（只需要位置，不需要法向量和紋理座標）
            // 前面 (Z+)
            -size, -size,  size,
             size, -size,  size,
             size,  size,  size,
            -size,  size,  size,
            
            // 後面 (Z-)
             size, -size, -size,
            -size, -size, -size,
            -size,  size, -size,
             size,  size, -size,
            
            // 上面 (Y+)
            -size,  size,  size,
             size,  size,  size,
             size,  size, -size,
            -size,  size, -size,
            
            // 下面 (Y-)
            -size, -size, -size,
             size, -size, -size,
             size, -size,  size,
            -size, -size,  size,
            
            // 右面 (X+)
             size, -size,  size,
             size, -size, -size,
             size,  size, -size,
             size,  size,  size,
            
            // 左面 (X-)
            -size, -size, -size,
            -size, -size,  size,
            -size,  size,  size,
            -size,  size, -size
        ];
        
        // 索引（注意順序，要讓內表面朝向攝影機）
        const indices = [
            0,  2,  1,    0,  3,  2,    // 前面
            4,  6,  5,    4,  7,  6,    // 後面
            8,  10, 9,    8,  11, 10,   // 上面
            12, 14, 13,   12, 15, 14,   // 下面
            16, 18, 17,   16, 19, 18,   // 右面
            20, 22, 21,   20, 23, 22    // 左面
        ];
        
        this.skyboxGeometry = {
            vertices: new Float32Array(vertices),
            indices: new Uint16Array(indices),
            vertexBuffer: this.webglCore.createVertexBuffer(vertices),
            indexBuffer: this.webglCore.createIndexBuffer(indices),
            indexCount: indices.length
        };
        
        console.log('Skybox geometry created');
    }
    
    // 創建地面幾何體 - 擴大到 300x300
    createGroundGeometry() {
        const size = 300;  // 擴大地面大小到 300x300
        const halfSize = size / 2;
        
        // 地面位置：Y=0，以原點為中心
        const vertices = [
            // 地面四個角（Y=0平面）
            -halfSize, 0,  halfSize,  0, 1, 0,  0, 0,  // 左前角
             halfSize, 0,  halfSize,  0, 1, 0,  8, 0,  // 右前角 (紋理重複8次)
             halfSize, 0, -halfSize,  0, 1, 0,  8, 8,  // 右後角 (紋理重複8次)
            -halfSize, 0, -halfSize,  0, 1, 0,  0, 8   // 左後角 (紋理重複8次)
        ];
        
        const indices = [
            0, 1, 2,  // 第一個三角形
            0, 2, 3   // 第二個三角形
        ];
        
        this.groundGeometry = {
            vertices: new Float32Array(vertices),
            indices: new Uint16Array(indices),
            vertexBuffer: this.webglCore.createVertexBuffer(vertices),
            indexBuffer: this.webglCore.createIndexBuffer(indices),
            indexCount: indices.length,
            size: size  // 記錄地面大小
        };
        
        console.log(`Ground geometry created: ${size}x${size} units, centered at origin`);
    }
    
    // 創建牆壁
    createWalls() {
        const size = this.boundarySize;
        const height = this.ceilingHeight;
        const segments = 10;
        
        const vertices = [];
        const indices = [];
        let indexOffset = 0;
        
        // 四面牆壁
        const walls = [
            { // 前牆 (Z+)
                corners: [
                    [-size, 0, size], [size, 0, size],
                    [size, height, size], [-size, height, size]
                ],
                normal: [0, 0, -1]
            },
            { // 後牆 (Z-)
                corners: [
                    [size, 0, -size], [-size, 0, -size],
                    [-size, height, -size], [size, height, -size]
                ],
                normal: [0, 0, 1]
            },
            { // 右牆 (X+)
                corners: [
                    [size, 0, size], [size, 0, -size],
                    [size, height, -size], [size, height, size]
                ],
                normal: [-1, 0, 0]
            },
            { // 左牆 (X-)
                corners: [
                    [-size, 0, -size], [-size, 0, size],
                    [-size, height, size], [-size, height, -size]
                ],
                normal: [1, 0, 0]
            }
        ];
        
        walls.forEach(wall => {
            const [p1, p2, p3, p4] = wall.corners;
            const normal = wall.normal;
            
            // 四個頂點
            vertices.push(
                ...p1, ...normal, 0, 0,
                ...p2, ...normal, 1, 0,
                ...p3, ...normal, 1, 1,
                ...p4, ...normal, 0, 1
            );
            
            // 兩個三角形
            indices.push(
                indexOffset, indexOffset + 1, indexOffset + 2,
                indexOffset, indexOffset + 2, indexOffset + 3
            );
            
            indexOffset += 4;
        });
        
        this.wallGeometry = {
            vertices: new Float32Array(vertices),
            indices: new Uint16Array(indices),
            vertexBuffer: this.webglCore.createVertexBuffer(vertices),
            indexBuffer: this.webglCore.createIndexBuffer(indices),
            indexCount: indices.length
        };
    }
    
    // 創建天花板
    createCeiling() {
        const size = this.boundarySize;
        const y = this.ceilingHeight;
        
        const vertices = [
            // 位置               法向量      紋理座標
            -size, y, -size,      0, -1, 0,   0, 0,
             size, y, -size,      0, -1, 0,   1, 0,
             size, y,  size,      0, -1, 0,   1, 1,
            -size, y,  size,      0, -1, 0,   0, 1
        ];
        
        const indices = [
            0, 1, 2,
            0, 2, 3
        ];
        
        this.ceilingGeometry = {
            vertices: new Float32Array(vertices),
            indices: new Uint16Array(indices),
            vertexBuffer: this.webglCore.createVertexBuffer(vertices),
            indexBuffer: this.webglCore.createIndexBuffer(indices),
            indexCount: indices.length
        };
    }
    
    // 渲染天空盒
    renderSkybox(camera) {
        if (!this.skyboxGeometry || !this.textureManager) return;
        
        const program = this.shaderManager.useProgram('skybox');
        if (!program) return;
        
        // 保存當前狀態
        const depthMask = this.gl.getParameter(this.gl.DEPTH_WRITEMASK);
        const depthFunc = this.gl.getParameter(this.gl.DEPTH_FUNC);
        
        // 設定天空盒渲染狀態
        this.gl.depthMask(false); // 禁用深度寫入
        this.gl.depthFunc(this.gl.LEQUAL); // 改變深度測試函數
        
        // 創建移除平移的視圖矩陣（只保留旋轉）
        const viewMatrix = camera.getViewMatrix();
        const skyboxViewMatrix = new Float32Array(16);
        
        // 複製旋轉部分，清除平移部分
        for (let i = 0; i < 16; i++) {
            skyboxViewMatrix[i] = viewMatrix[i];
        }
        skyboxViewMatrix[12] = 0; // 清除 X 平移
        skyboxViewMatrix[13] = 0; // 清除 Y 平移
        skyboxViewMatrix[14] = 0; // 清除 Z 平移
        
        // 設定 uniform
        this.webglCore.setUniform(program, 'uViewMatrix', skyboxViewMatrix, 'mat4');
        this.webglCore.setUniform(program, 'uProjectionMatrix', camera.getProjectionMatrix(), 'mat4');
        
        // 綁定天空盒 cube map
        this.textureManager.bindCubeMap('skybox', 0);
        this.webglCore.setUniform(program, 'uSkybox', 0, 'sampler2D');
        
        // 綁定頂點屬性（只有位置）
        this.webglCore.bindVertexAttribute(
            program, 'aPosition', this.skyboxGeometry.vertexBuffer, 3, this.gl.FLOAT, false, 0, 0
        );
        
        // 繪製天空盒
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.skyboxGeometry.indexBuffer);
        this.webglCore.drawElements(this.gl.TRIANGLES, this.skyboxGeometry.indexCount);
        
        // 恢復狀態
        this.gl.depthMask(depthMask);
        this.gl.depthFunc(depthFunc);
    }
    
    // 渲染地面 - 強化陰影接收
    renderGround(camera, lighting) {
        const program = this.shaderManager.useProgram('phong');
        if (!program || !this.groundGeometry) return;
        
        // 地面的模型矩陣：固定在原點，不移動
        const modelMatrix = MatrixLib.identity();
        
        // 設定變換矩陣
        this.webglCore.setUniform(program, 'uModelMatrix', modelMatrix, 'mat4');
        this.webglCore.setUniform(program, 'uViewMatrix', camera.getViewMatrix(), 'mat4');
        this.webglCore.setUniform(program, 'uProjectionMatrix', camera.getProjectionMatrix(), 'mat4');
        this.webglCore.setUniform(program, 'uNormalMatrix', MatrixLib.normalMatrix(modelMatrix), 'mat3');
        this.webglCore.setUniform(program, 'uCameraPosition', camera.getPosition(), 'vec3');
        
        // 應用光照
        if (lighting.applyToShader) {
            lighting.applyToShader(this.webglCore, program, camera.getPosition());
        }
        
        // 地面材質設定 - 調整為更好接收陰影
        this.webglCore.setUniform(program, 'uAmbientColor', [0.4, 0.35, 0.3], 'vec3');  // 暖色調環境光
        this.webglCore.setUniform(program, 'uDiffuseColor', [0.9, 0.9, 0.9], 'vec3');   // 高漫反射，讓陰影更明顯
        this.webglCore.setUniform(program, 'uSpecularColor', [0.1, 0.1, 0.1], 'vec3');  // 低鏡面反射
        this.webglCore.setUniform(program, 'uShininess', 4.0, 'float');                 // 低光澤度
        
        // 綁定地面紋理
        if (this.textureManager && this.textureManager.isTextureLoaded('ground')) {
            this.textureManager.bindTexture('ground', 0);
            this.webglCore.setUniform(program, 'uTexture', 0, 'sampler2D');
            this.webglCore.setUniform(program, 'uUseTexture', true, 'bool');
        } else {
            this.webglCore.setUniform(program, 'uUseTexture', false, 'bool');
        }
        
        // 綁定頂點屬性
        this.webglCore.bindVertexAttribute(program, 'aPosition', this.groundGeometry.vertexBuffer, 3, this.gl.FLOAT, false, 8 * 4, 0);
        this.webglCore.bindVertexAttribute(program, 'aNormal', this.groundGeometry.vertexBuffer, 3, this.gl.FLOAT, false, 8 * 4, 3 * 4);
        this.webglCore.bindVertexAttribute(program, 'aTexCoord', this.groundGeometry.vertexBuffer, 2, this.gl.FLOAT, false, 8 * 4, 6 * 4);
        
        // 渲染地面（主要陰影接收表面）
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.groundGeometry.indexBuffer);
        this.webglCore.drawElements(this.gl.TRIANGLES, this.groundGeometry.indexCount);
        
        console.log('Ground rendered as shadow receiver');
    }

    // 獲取地面大小
    getGroundSize() {
        return this.groundGeometry ? this.groundGeometry.size : 300;
    }
    
    // 檢查位置是否在地面範圍內
    isPositionOnGround(x, z) {
        const halfSize = this.getGroundSize() / 2;
        return Math.abs(x) <= halfSize && Math.abs(z) <= halfSize;
    }
    
    // 渲染場景 - 修正 program 未定義錯誤
    render(camera, lighting) {
        // 渲染天空盒（背景）
        this.renderSkybox(camera);
        
        // 渲染地面（固定位置）
        this.renderGround(camera, lighting);
        
        // 渲染場景邊界牆壁（如果需要）
        this.renderBoundaryWalls(camera, lighting);
    }
    
    // 渲染場景邊界牆壁（可選）
    renderBoundaryWalls(camera, lighting) {
        // 如果需要顯示邊界牆壁，可以在這裡實現
        // 目前先跳過，保持場景簡潔
        if (!this.wallGeometry) return;
        
        const program = this.shaderManager.useProgram('phong');
        if (!program) return;
        
        // 設定變換矩陣
        const modelMatrix = MatrixLib.identity();
        this.webglCore.setUniform(program, 'uModelMatrix', modelMatrix, 'mat4');
        this.webglCore.setUniform(program, 'uViewMatrix', camera.getViewMatrix(), 'mat4');
        this.webglCore.setUniform(program, 'uProjectionMatrix', camera.getProjectionMatrix(), 'mat4');
        this.webglCore.setUniform(program, 'uNormalMatrix', MatrixLib.normalMatrix(modelMatrix), 'mat3');
        this.webglCore.setUniform(program, 'uCameraPosition', camera.getPosition(), 'vec3');
        
        // 應用光照
        if (lighting.applyToShader) {
            lighting.applyToShader(this.webglCore, program, camera.getPosition());
        }
        
        // 渲染牆壁
        this.renderWalls(program);
        
        // 渲染天花板（半透明）
        this.renderCeiling(program);
    }
    
    // 渲染地板
    renderFloor(program) {
        const modelMatrix = MatrixLib.identity();
        
        this.webglCore.setUniform(program, 'uModelMatrix', modelMatrix, 'mat4');
        this.webglCore.setUniform(program, 'uNormalMatrix', MatrixLib.normalMatrix(modelMatrix), 'mat3');
        
        // 設定材質
        this.webglCore.setUniform(program, 'uAmbientColor', this.floorMaterial.ambient, 'vec3');
        this.webglCore.setUniform(program, 'uDiffuseColor', this.floorMaterial.diffuse, 'vec3');
        this.webglCore.setUniform(program, 'uSpecularColor', this.floorMaterial.specular, 'vec3');
        this.webglCore.setUniform(program, 'uShininess', this.floorMaterial.shininess, 'float');
        
        this.renderGeometry(program, this.floorGeometry);
    }
    
    // 渲染牆壁
    renderWalls(program) {
        const modelMatrix = MatrixLib.identity();
        
        this.webglCore.setUniform(program, 'uModelMatrix', modelMatrix, 'mat4');
        this.webglCore.setUniform(program, 'uNormalMatrix', MatrixLib.normalMatrix(modelMatrix), 'mat3');
        
        // 設定材質
        this.webglCore.setUniform(program, 'uAmbientColor', this.wallMaterial.ambient, 'vec3');
        this.webglCore.setUniform(program, 'uDiffuseColor', this.wallMaterial.diffuse, 'vec3');
        this.webglCore.setUniform(program, 'uSpecularColor', this.wallMaterial.specular, 'vec3');
        this.webglCore.setUniform(program, 'uShininess', this.wallMaterial.shininess, 'float');
        
        this.renderGeometry(program, this.wallGeometry);
    }
    
    // 渲染天花板
    renderCeiling(program) {
        // 啟用混合以產生半透明效果
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
        
        const modelMatrix = MatrixLib.identity();
        
        this.webglCore.setUniform(program, 'uModelMatrix', modelMatrix, 'mat4');
        this.webglCore.setUniform(program, 'uNormalMatrix', MatrixLib.normalMatrix(modelMatrix), 'mat3');
        
        // 設定材質（較暗的天花板）
        this.webglCore.setUniform(program, 'uAmbientColor', [0.05, 0.05, 0.1], 'vec3');
        this.webglCore.setUniform(program, 'uDiffuseColor', [0.1, 0.1, 0.2], 'vec3');
        this.webglCore.setUniform(program, 'uSpecularColor', [0.2, 0.2, 0.3], 'vec3');
        this.webglCore.setUniform(program, 'uShininess', 4.0, 'float');
        
        this.renderGeometry(program, this.ceilingGeometry);
        
        // 禁用混合
        this.gl.disable(this.gl.BLEND);
    }
    
    // 渲染幾何體
    renderGeometry(program, geometry) {
        // 綁定頂點屬性
        this.webglCore.bindVertexAttribute(program, 'aPosition', geometry.vertexBuffer, 3, this.gl.FLOAT, false, 8 * 4, 0);
        this.webglCore.bindVertexAttribute(program, 'aNormal', geometry.vertexBuffer, 3, this.gl.FLOAT, false, 8 * 4, 3 * 4);
        this.webglCore.bindVertexAttribute(program, 'aTexCoord', geometry.vertexBuffer, 2, this.gl.FLOAT, false, 8 * 4, 6 * 4);
        
        // 繪製
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, geometry.indexBuffer);
        this.webglCore.drawElements(this.gl.TRIANGLES, geometry.indexCount);
    }
    
    // 檢查點是否在場景邊界內
    isPointInBounds(point) {
        const [x, y, z] = point;
        return Math.abs(x) <= this.boundarySize &&
               Math.abs(z) <= this.boundarySize &&
               y >= this.floorLevel &&
               y <= this.ceilingHeight;
    }
    
    // 獲取場景邊界
    getBounds() {
        return {
            minX: -this.boundarySize,
            maxX: this.boundarySize,
            minY: this.floorLevel,
            maxY: this.ceilingHeight,
            minZ: -this.boundarySize,
            maxZ: this.boundarySize
        };
    }
    
    // 獲取地板高度
    getFloorHeight() {
        return this.floorLevel;
    }
    
    // 獲取邊界大小
    getBoundarySize() {
        return this.boundarySize;
    }
    
    // 射線與地板的交點
    raycastFloor(ray) {
        const { origin, direction } = ray;
        
        // 射線與 Y=0 平面的交點
        if (Math.abs(direction[1]) < 0.0001) return null; // 射線平行於地板
        
        const t = (this.floorLevel - origin[1]) / direction[1];
        if (t < 0) return null; // 交點在射線後方
        
        const intersectPoint = [
            origin[0] + direction[0] * t,
            this.floorLevel,
            origin[2] + direction[2] * t
        ];
        
        // 檢查交點是否在場景邊界內
        if (Math.abs(intersectPoint[0]) <= this.boundarySize &&
            Math.abs(intersectPoint[2]) <= this.boundarySize) {
            return intersectPoint;
        }
        
        return null;
    }
}