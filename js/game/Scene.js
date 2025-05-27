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
        this.tankMarkerSphere = null; // 坦克上方的球體
        this.tankFloorGeometry = null; // 坦克底部的地板
        
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
        
        // 坦克上方球體材質
        this.markerSphereMaterial = {
            ambient: [0.1, 0.1, 0.1],
            diffuse: [0.5, 0.5, 0.5],
            specular: [0.2, 0.2, 0.2],
            shininess: 8.0
        };
        
        this.createGeometry();
    }
    
    // 創建場景幾何體
    createGeometry() {
        this.createGroundPlane(); // 新增地面平面
        this.createFloor();
        this.createWalls();
        this.createCeiling();
        this.createSkybox();
        this.createTankMarkerSphere();
        this.createTankFloor();
    }
    
    // 創建地面平面（使用 ground.jpg 紋理）
    createGroundPlane() {
        const size = this.boundarySize * 1.5; // 比場景邊界稍大
        const segments = 32; // 增加分段數以獲得更好的紋理品質
        const stepSize = size * 2 / segments;
        
        const vertices = [];
        const indices = [];
        
        // 生成地面網格頂點
        for (let i = 0; i <= segments; i++) {
            for (let j = 0; j <= segments; j++) {
                const x = -size + i * stepSize;
                const z = -size + j * stepSize;
                const y = this.floorLevel; // Y=0 地面
                
                const u = i / segments;
                const v = j / segments;
                
                vertices.push(
                    x, y, z,        // 位置
                    0, 1, 0,        // 法向量（向上）
                    u * 8, v * 8    // 紋理座標（重複8次製造地磚效果）
                );
            }
        }
        
        // 生成索引
        for (let i = 0; i < segments; i++) {
            for (let j = 0; j < segments; j++) {
                const topLeft = i * (segments + 1) + j;
                const topRight = topLeft + 1;
                const bottomLeft = (i + 1) * (segments + 1) + j;
                const bottomRight = bottomLeft + 1;
                
                // 第一個三角形
                indices.push(topLeft, bottomLeft, topRight);
                // 第二個三角形
                indices.push(topRight, bottomLeft, bottomRight);
            }
        }
        
        this.groundGeometry = {
            vertices: new Float32Array(vertices),
            indices: new Uint16Array(indices),
            vertexBuffer: this.webglCore.createVertexBuffer(vertices),
            indexBuffer: this.webglCore.createIndexBuffer(indices),
            indexCount: indices.length
        };
        
        console.log('Ground plane created with ground.jpg texture mapping');
    }
    
    // 創建坦克上方的球體標記
    createTankMarkerSphere() {
        const radius = 3;
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
        
        this.tankMarkerSphere = {
            vertices: new Float32Array(vertices),
            indices: new Uint16Array(indices),
            vertexBuffer: this.webglCore.createVertexBuffer(vertices),
            indexBuffer: this.webglCore.createIndexBuffer(indices),
            indexCount: indices.length
        };
    }
    
    // 創建坦克底部地板
    createTankFloor() {
        const size = 100; // 地板大小
        const segments = 10; // 分段數，用於產生網格效果
        const stepSize = size / segments;
        
        const vertices = [];
        const indices = [];
        
        // 生成網格頂點，地板在Y=0平面
        for (let i = 0; i <= segments; i++) {
            for (let j = 0; j <= segments; j++) {
                const x = -size/2 + i * stepSize;
                const z = -size/2 + j * stepSize;
                const y = 0; // 地板高度
                
                const u = i / segments;
                const v = j / segments;
                
                vertices.push(
                    x, y, z,        // 位置
                    0, 1, 0,        // 法向量（向上）
                    u * 5, v * 5    // 紋理座標（重複5次）
                );
            }
        }
        
        // 生成索引
        for (let i = 0; i < segments; i++) {
            for (let j = 0; j < segments; j++) {
                const topLeft = i * (segments + 1) + j;
                const topRight = topLeft + 1;
                const bottomLeft = (i + 1) * (segments + 1) + j;
                const bottomRight = bottomLeft + 1;
                
                // 第一個三角形
                indices.push(topLeft, bottomLeft, topRight);
                // 第二個三角形
                indices.push(topRight, bottomLeft, bottomRight);
            }
        }
        
        this.tankFloorGeometry = {
            vertices: new Float32Array(vertices),
            indices: new Uint16Array(indices),
            vertexBuffer: this.webglCore.createVertexBuffer(vertices),
            indexBuffer: this.webglCore.createIndexBuffer(indices),
            indexCount: indices.length
        };
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
    
    // 創建地板
    createFloor() {
        const size = this.boundarySize;
        const segments = 20; // 分段數，用於產生網格效果
        const stepSize = size * 2 / segments;
        
        const vertices = [];
        const indices = [];
        
        // 生成網格頂點
        for (let i = 0; i <= segments; i++) {
            for (let j = 0; j <= segments; j++) {
                const x = -size + i * stepSize;
                const z = -size + j * stepSize;
                const y = this.floorLevel;
                
                const u = i / segments;
                const v = j / segments;
                
                vertices.push(
                    x, y, z,        // 位置
                    0, 1, 0,        // 法向量（向上）
                    u * 10, v * 10  // 紋理座標（重複10次）
                );
            }
        }
        
        // 生成索引
        for (let i = 0; i < segments; i++) {
            for (let j = 0; j < segments; j++) {
                const topLeft = i * (segments + 1) + j;
                const topRight = topLeft + 1;
                const bottomLeft = (i + 1) * (segments + 1) + j;
                const bottomRight = bottomLeft + 1;
                
                // 第一個三角形
                indices.push(topLeft, bottomLeft, topRight);
                // 第二個三角形
                indices.push(topRight, bottomLeft, bottomRight);
            }
        }
        
        this.floorGeometry = {
            vertices: new Float32Array(vertices),
            indices: new Uint16Array(indices),
            vertexBuffer: this.webglCore.createVertexBuffer(vertices),
            indexBuffer: this.webglCore.createIndexBuffer(indices),
            indexCount: indices.length
        };
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
    
    // 渲染坦克上方的球體標記
    renderTankMarkerSphere(camera, lighting, tankPosition) {
        if (!this.tankMarkerSphere) return;
        
        const program = this.shaderManager.useProgram('phong');
        if (!program) return;
        
        // 計算球體位置：坦克正上方25單位高度（降低高度）
        const spherePosition = [tankPosition[0], 25, tankPosition[2]];
        const modelMatrix = MatrixLib.translate(spherePosition[0], spherePosition[1], spherePosition[2]);
        
        console.log('Mirror sphere position:', spherePosition);
        
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
        
        // 設定材質 - 明亮紅色讓它更明顯
        this.webglCore.setUniform(program, 'uAmbientColor', [0.3, 0.1, 0.1], 'vec3');
        this.webglCore.setUniform(program, 'uDiffuseColor', [0.8, 0.2, 0.2], 'vec3');
        this.webglCore.setUniform(program, 'uSpecularColor', [1.0, 0.5, 0.5], 'vec3');
        this.webglCore.setUniform(program, 'uShininess', 64.0, 'float');
        this.webglCore.setUniform(program, 'uUseTexture', false, 'bool');
        
        this.renderGeometry(program, this.tankMarkerSphere);
    }
    
    // 渲染坦克底部地板
    renderTankFloor(camera, lighting, tankPosition) {
        if (!this.tankFloorGeometry) return;
        
        const program = this.shaderManager.useProgram('phong');
        if (!program) return;
        
        // 地板位置：坦克底部
        const floorPosition = [tankPosition[0], 0, tankPosition[2]];
        const modelMatrix = MatrixLib.translate(floorPosition[0], floorPosition[1], floorPosition[2]);
        
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
        
        // 設定材質並使用 ground.jpg 紋理
        this.webglCore.setUniform(program, 'uAmbientColor', this.floorMaterial.ambient, 'vec3');
        this.webglCore.setUniform(program, 'uDiffuseColor', this.floorMaterial.diffuse, 'vec3');
        this.webglCore.setUniform(program, 'uSpecularColor', this.floorMaterial.specular, 'vec3');
        this.webglCore.setUniform(program, 'uShininess', this.floorMaterial.shininess, 'float');
        
        // 綁定 ground.jpg 紋理
        if (this.textureManager) {
            this.textureManager.bindTexture('ground', 0);
            this.webglCore.setUniform(program, 'uTexture', 0, 'sampler2D');
            this.webglCore.setUniform(program, 'uUseTexture', true, 'bool');
        } else {
            this.webglCore.setUniform(program, 'uUseTexture', false, 'bool');
        }
        
        this.renderGeometry(program, this.tankFloorGeometry);
    }
    
    // 渲染場景
    render(camera, lighting, tankPosition = null) {
        // 首先渲染天空盒
        this.renderSkybox(camera);
        
        const program = this.shaderManager.useProgram('phong');
        if (!program) return;
        
        // 設定共用 uniform
        this.webglCore.setUniform(program, 'uViewMatrix', camera.getViewMatrix(), 'mat4');
        this.webglCore.setUniform(program, 'uProjectionMatrix', camera.getProjectionMatrix(), 'mat4');
        this.webglCore.setUniform(program, 'uCameraPosition', camera.getPosition(), 'vec3');
        
        // 應用光照系統
        if (lighting.applyToShader) {
            lighting.applyToShader(this.webglCore, program, camera.getPosition());
        } else {
            // 後備光照設定
            this.webglCore.setUniform(program, 'uLightPosition', lighting.position || [0, 500, 0], 'vec3');
            this.webglCore.setUniform(program, 'uLightColor', lighting.color || [1.0, 1.0, 1.0], 'vec3');
            this.webglCore.setUniform(program, 'uLightAttenuation', [1.0, 0.001, 0.000001], 'vec3');
        }
        
        // 渲染地面平面（使用 ground.jpg 紋理）
        this.renderGroundPlane(program);
        
        // 不使用紋理的其他物體
        this.webglCore.setUniform(program, 'uUseTexture', false, 'bool');
        
        // 渲染地板
        this.renderFloor(program);
        
        // 渲染牆壁
        this.renderWalls(program);
        
        // 渲染天花板（半透明）
        this.renderCeiling(program);
        
        // 如果有坦克位置，渲染坦克相關物體
        if (tankPosition) {
            // 渲染坦克上方的球體標記
            this.renderTankMarkerSphere(camera, lighting, tankPosition);
            
            // 渲染坦克底部的地板
            this.renderTankFloor(camera, lighting, tankPosition);
        }
    }
    
    // 渲染地面平面（完全重寫以確保正確顯示）
    renderGroundPlane(program) {
        if (!this.groundGeometry) {
            console.error('Ground geometry not created!');
            return;
        }
        
        console.log('=== RENDERING GROUND PLANE ===');
        
        const modelMatrix = MatrixLib.identity();
        
        this.webglCore.setUniform(program, 'uModelMatrix', modelMatrix, 'mat4');
        this.webglCore.setUniform(program, 'uNormalMatrix', MatrixLib.normalMatrix(modelMatrix), 'mat3');
        
        // 使用明亮的材質確保地面可見
        this.webglCore.setUniform(program, 'uAmbientColor', [0.3, 0.3, 0.3], 'vec3');
        this.webglCore.setUniform(program, 'uDiffuseColor', [0.8, 0.8, 0.8], 'vec3');
        this.webglCore.setUniform(program, 'uSpecularColor', [0.2, 0.2, 0.2], 'vec3');
        this.webglCore.setUniform(program, 'uShininess', 32.0, 'float');
        
        // 嘗試使用 ground.jpg 紋理
        if (this.textureManager && this.textureManager.isTextureLoaded('ground')) {
            this.textureManager.bindTexture('ground', 0);
            this.webglCore.setUniform(program, 'uTexture', 0, 'sampler2D');
            this.webglCore.setUniform(program, 'uUseTexture', true, 'bool');
            console.log('Using ground.jpg texture');
        } else {
            this.webglCore.setUniform(program, 'uUseTexture', false, 'bool');
            console.log('No ground texture, using material color');
        }
        
        // 確保深度測試正確
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LESS);
        this.gl.depthMask(true);
        
        // 暫時禁用面剔除確保兩面都可見
        this.gl.disable(this.gl.CULL_FACE);
        
        // 綁定頂點屬性
        const stride = 8 * 4; // 8 個 float (position 3 + normal 3 + texCoord 2)
        
        // 位置屬性
        if (this.webglCore.bindVertexAttribute(program, 'aPosition', this.groundGeometry.vertexBuffer, 3, this.gl.FLOAT, false, stride, 0)) {
            console.log('Position attribute bound');
        }
        
        // 法向量屬性
        if (this.webglCore.bindVertexAttribute(program, 'aNormal', this.groundGeometry.vertexBuffer, 3, this.gl.FLOAT, false, stride, 3 * 4)) {
            console.log('Normal attribute bound');
        }
        
        // 紋理座標屬性
        if (this.webglCore.bindVertexAttribute(program, 'aTexCoord', this.groundGeometry.vertexBuffer, 2, this.gl.FLOAT, false, stride, 6 * 4)) {
            console.log('TexCoord attribute bound');
        }
        
        // 繪製
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.groundGeometry.indexBuffer);
        this.webglCore.drawElements(this.gl.TRIANGLES, this.groundGeometry.indexCount);
        
        console.log(`Ground plane rendered with ${this.groundGeometry.indexCount} indices`);
        
        // 重新啟用面剔除
        this.gl.enable(this.gl.CULL_FACE);
        
        console.log('=== END GROUND PLANE RENDER ===');
    }
    
    // 渲染地面平面（恢復 ground.jpg 紋理）
    renderGroundPlane(program) {
        if (!this.groundGeometry) {
            console.error('Ground geometry not created!');
            return;
        }
        
        const modelMatrix = MatrixLib.identity();
        
        this.webglCore.setUniform(program, 'uModelMatrix', modelMatrix, 'mat4');
        this.webglCore.setUniform(program, 'uNormalMatrix', MatrixLib.normalMatrix(modelMatrix), 'mat3');
        
        // 恢復正常的地面材質設定
        this.webglCore.setUniform(program, 'uAmbientColor', this.floorMaterial.ambient, 'vec3');
        this.webglCore.setUniform(program, 'uDiffuseColor', this.floorMaterial.diffuse, 'vec3');
        this.webglCore.setUniform(program, 'uSpecularColor', this.floorMaterial.specular, 'vec3');
        this.webglCore.setUniform(program, 'uShininess', this.floorMaterial.shininess, 'float');
        
        // 使用 ground.jpg 紋理
        if (this.textureManager) {
            this.textureManager.bindTexture('ground', 0);
            this.webglCore.setUniform(program, 'uTexture', 0, 'sampler2D');
            this.webglCore.setUniform(program, 'uUseTexture', true, 'bool');
            console.log('Ground rendered with ground.jpg texture');
        } else {
            // 後備：使用淺灰色
            this.webglCore.setUniform(program, 'uDiffuseColor', [0.6, 0.6, 0.6], 'vec3');
            this.webglCore.setUniform(program, 'uUseTexture', false, 'bool');
            console.warn('TextureManager not available, using fallback color');
        }
        
        // 確保深度設定正確
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LEQUAL);
        this.gl.depthMask(true);
        
        // 綁定頂點屬性並渲染
        const positionBound = this.webglCore.bindVertexAttribute(
            program, 'aPosition', this.groundGeometry.vertexBuffer, 3, this.gl.FLOAT, false, 8 * 4, 0
        );
        const normalBound = this.webglCore.bindVertexAttribute(
            program, 'aNormal', this.groundGeometry.vertexBuffer, 3, this.gl.FLOAT, false, 8 * 4, 3 * 4
        );
        const texCoordBound = this.webglCore.bindVertexAttribute(
            program, 'aTexCoord', this.groundGeometry.vertexBuffer, 2, this.gl.FLOAT, false, 8 * 4, 6 * 4
        );
        
        if (positionBound) {
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.groundGeometry.indexBuffer);
            this.webglCore.drawElements(this.gl.TRIANGLES, this.groundGeometry.indexCount);
        }
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