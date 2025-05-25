/**
 * 場景管理器
 * 管理場景幾何體、邊界和環境渲染
 */
class Scene {
    constructor(webglCore, shaderManager) {
        this.webglCore = webglCore;
        this.gl = webglCore.getContext();
        this.shaderManager = shaderManager;
        
        // 場景參數
        this.boundarySize = 800;
        this.floorLevel = 0;
        this.ceilingHeight = 800;
        
        // 幾何體
        this.floorGeometry = null;
        this.wallGeometry = null;
        this.ceilingGeometry = null;
        
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
        this.createFloor();
        this.createWalls();
        this.createCeiling();
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
    
    // 渲染場景
    render(camera, lighting) {
        const program = this.shaderManager.useProgram('phong');
        if (!program) return;
        
        // 設定共用 uniform
        this.webglCore.setUniform(program, 'uViewMatrix', camera.getViewMatrix(), 'mat4');
        this.webglCore.setUniform(program, 'uProjectionMatrix', camera.getProjectionMatrix(), 'mat4');
        this.webglCore.setUniform(program, 'uCameraPosition', camera.getPosition(), 'vec3');
        this.webglCore.setUniform(program, 'uLightPosition', lighting.position, 'vec3');
        this.webglCore.setUniform(program, 'uLightColor', lighting.color, 'vec3');
        this.webglCore.setUniform(program, 'uUseTexture', false, 'bool');
        
        // 渲染地板
        this.renderFloor(program);
        
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