/**
 * 鏡面球類別 - 固定在場景中央上方
 */
class MirrorBall {
    constructor(webglCore, shaderManager) {
        this.webglCore = webglCore;
        this.gl = webglCore.getContext();
        this.shaderManager = shaderManager;
        
        this.radius = 15;
        this.active = true;
        
        // 固定位置：場景中央上方 (不跟隨坦克)
        this.fixedPosition = [0, 80, 0]; // X=0, Y=80, Z=0 (場景中央上方80單位)
        this.position = [0, 80, 0];
        
        // 移除坦克引用（不再需要）
        this.tankReference = null;
        
        // 動畫參數
        this.rotationSpeed = 1.0;
        this.rotationY = 0;
        this.rotationX = 0;
        this.bobSpeed = 2.0;
        this.bobAmplitude = 3.0; // 稍微增加浮動幅度
        this.bobOffset = 0;
        
        this.geometry = null;
        this.modelMatrix = MatrixLib.identity();
        
        this.material = {
            ambient: [0.1, 0.1, 0.1],
            diffuse: [0.3, 0.3, 0.3],
            specular: [1.0, 1.0, 1.0],
            shininess: 256.0
        };
        
        this.createGeometry();
        this.updateMatrix();
    }
    
    createGeometry() {
        const radius = this.radius;
        const segments = 32;
        const rings = 24;
        
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
    
    setTankReference(tank) {
        // 不再需要坦克引用，MirrorBall固定在場景中央
        console.log('MirrorBall positioned at scene center (0, 80, 0)');
    }
    
    update(deltaTime) {
        if (!this.active) return;
        
        // 更新旋轉動畫
        this.rotationY += this.rotationSpeed * deltaTime;
        this.rotationX += this.rotationSpeed * 0.7 * deltaTime;
        
        if (this.rotationY > Math.PI * 2) this.rotationY -= Math.PI * 2;
        if (this.rotationX > Math.PI * 2) this.rotationX -= Math.PI * 2;
        
        // 更新浮動動畫
        this.bobOffset += this.bobSpeed * deltaTime;
        const bobY = Math.sin(this.bobOffset) * this.bobAmplitude;
        
        // 位置 = 固定基礎位置 + 垂直浮動
        this.position = [
            this.fixedPosition[0],                    // X固定為0
            this.fixedPosition[1] + bobY,             // Y = 80 + 浮動
            this.fixedPosition[2]                     // Z固定為0
        ];
        
        this.updateMatrix();
    }
    
    updateMatrix() {
        const translation = MatrixLib.translate(
            this.position[0],
            this.position[1],
            this.position[2]
        );
        
        const rotationY = MatrixLib.rotateY(this.rotationY);
        const rotationX = MatrixLib.rotateX(this.rotationX);
        
        this.modelMatrix = MatrixLib.multiply(translation, MatrixLib.multiply(rotationY, rotationX));
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
        
        // 啟用環境反射 - 使用skybox作為環境貼圖
        if (textureManager && textureManager.getCubeMap('skybox')) {
            // 綁定skybox cube map到紋理單元1
            textureManager.bindCubeMap('skybox', 1);
            this.webglCore.setUniform(program, 'uEnvironmentMap', 1, 'samplerCube');
            this.webglCore.setUniform(program, 'uUseEnvironmentReflection', true, 'bool');
            this.webglCore.setUniform(program, 'uReflectivity', 0.8, 'float'); // 80%反射
        } else {
            this.webglCore.setUniform(program, 'uUseEnvironmentReflection', false, 'bool');
        }
        
        // 金屬紋理（如果有的話）
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
    
    getPosition() {
        return [...this.position];
    }
    
    getRadius() {
        return this.radius;
    }
    
    getModelMatrix() {
        return this.modelMatrix;
    }
    
    setActive(active) {
        this.active = active;
    }
    
    reset() {
        this.rotationY = 0;
        this.rotationX = 0;
        this.bobOffset = 0;
        
        // 重置到固定位置
        this.position = [...this.fixedPosition];
        this.updateMatrix();
        
        console.log('MirrorBall reset to center position:', this.position);
    }
    
    // 獲取固定位置（用於調試）
    getFixedPosition() {
        return [...this.fixedPosition];
    }
    
    // 設定新的固定位置（如果需要調整）
    setFixedPosition(x, y, z) {
        this.fixedPosition = [x, y, z];
        console.log('MirrorBall fixed position updated to:', this.fixedPosition);
    }
}
