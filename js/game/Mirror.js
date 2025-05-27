/**
 * 鏡面球 - 帶動態反射功能
 * 直接移植範例的動態反射實現
 */
class Mirror {
    constructor(webglCore, shaderManager, frameBuffer = null) {
        this.webglCore = webglCore;
        this.gl = webglCore.getContext();
        this.shaderManager = shaderManager;
        this.frameBuffer = frameBuffer;
        
        // 球體屬性
        this.radius = 8;
        this.position = [0, 25, 0]; // 坦克上方25單位
        this.offset = [0, 25, 0];   // 相對坦克的偏移25單位
        
        // 跟隨目標
        this.followTarget = null;
        
        // 球體幾何體
        this.geometry = null;
        this.modelMatrix = MatrixLib.identity();
        
        // 動態反射設定 (直接使用範例的設定)
        this.offScreenWidth = 256;
        this.offScreenHeight = 256;
        this.fbo = null;
        
        // 範例中的 Cube Map 方向設定
        this.ENV_CUBE_LOOK_DIR = [
            [1.0, 0.0, 0.0],   // +X
            [-1.0, 0.0, 0.0],  // -X
            [0.0, 1.0, 0.0],   // +Y
            [0.0, -1.0, 0.0],  // -Y
            [0.0, 0.0, 1.0],   // +Z
            [0.0, 0.0, -1.0]   // -Z
        ];
        
        this.ENV_CUBE_LOOK_UP = [
            [0.0, -1.0, 0.0],  // +X
            [0.0, -1.0, 0.0],  // -X
            [0.0, 0.0, 1.0],   // +Y
            [0.0, 0.0, -1.0],  // -Y
            [0.0, -1.0, 0.0],  // +Z
            [0.0, -1.0, 0.0]   // -Z
        ];
        
        this.createGeometry();
        this.initFrameBufferForCubemapRendering();
    }
    
    // 初始化 Cube Map 幀緩衝 (直接移植範例)
    initFrameBufferForCubemapRendering() {
        const texture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, texture);

        // 6 2D textures
        this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        for (let i = 0; i < 6; i++) {
            this.gl.texImage2D(this.gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, 
                              this.gl.RGBA, this.offScreenWidth, this.offScreenHeight, 0, this.gl.RGBA, 
                              this.gl.UNSIGNED_BYTE, null);
        }

        // create and setup a render buffer as the depth buffer
        const depthBuffer = this.gl.createRenderbuffer();
        this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, depthBuffer);
        this.gl.renderbufferStorage(this.gl.RENDERBUFFER, this.gl.DEPTH_COMPONENT16, 
                                   this.offScreenWidth, this.offScreenHeight);

        // create and setup framebuffer: link the depth buffer to it (no color buffer here)
        const frameBuffer = this.gl.createFramebuffer();
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, frameBuffer);
        this.gl.framebufferRenderbuffer(this.gl.FRAMEBUFFER, this.gl.DEPTH_ATTACHMENT, 
                                       this.gl.RENDERBUFFER, depthBuffer);

        frameBuffer.texture = texture;
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
        
        this.fbo = frameBuffer;
    }
    
    // 渲染 Cube Map (直接移植範例)
    renderCubeMap(renderSceneCallback) {
        if (!this.fbo) return;
        
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.fbo);
        this.gl.viewport(0, 0, this.offScreenWidth, this.offScreenHeight);
        this.gl.clearColor(0.4, 0.4, 0.4, 1);
        
        for (let side = 0; side < 6; side++) {
            this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, 
                                        this.gl.TEXTURE_CUBE_MAP_POSITIVE_X + side, this.fbo.texture, 0);
            this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

            // 創建視圖投影矩陣 (使用範例的方法)
            let vpMatrix = new Matrix4();
            vpMatrix.setPerspective(90, 1, 1, 100);
            vpMatrix.lookAt(this.position[0], this.position[1], this.position[2],   
                           this.position[0] + this.ENV_CUBE_LOOK_DIR[side][0], 
                           this.position[1] + this.ENV_CUBE_LOOK_DIR[side][1],
                           this.position[2] + this.ENV_CUBE_LOOK_DIR[side][2], 
                           this.ENV_CUBE_LOOK_UP[side][0],
                           this.ENV_CUBE_LOOK_UP[side][1],
                           this.ENV_CUBE_LOOK_UP[side][2]);

            // 創建臨時攝影機物件
            const cubeCamera = {
                getViewMatrix: () => vpMatrix.elements,
                getProjectionMatrix: () => MatrixLib.identity().elements, // 投影已包含在 vpMatrix 中
                getPosition: () => this.position
            };

            // 渲染場景
            if (renderSceneCallback) {
                renderSceneCallback(cubeCamera, vpMatrix);
            }
        }
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    }

    // 創建球體幾何體
    createGeometry() {
        const segments = 24;
        const rings = 16;
        
        const vertices = [];
        const indices = [];
        
        // 生成球體頂點
        for (let ring = 0; ring <= rings; ring++) {
            const phi = (ring / rings) * Math.PI;
            const y = Math.cos(phi) * this.radius;
            const ringRadius = Math.sin(phi) * this.radius;
            
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
        
        // 生成索引
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
    
    // 設定跟隨目標
    setFollowTarget(target) {
        this.followTarget = target;
    }
    
    // 更新位置
    update(deltaTime) {
        if (this.followTarget) {
            const tankPos = this.followTarget.getPosition();
            
            this.position = [
                tankPos[0] + this.offset[0],
                tankPos[1] + this.offset[1],
                tankPos[2] + this.offset[2]
            ];
            
            this.updateModelMatrix();
        }
    }
    
    // 更新模型矩陣
    updateModelMatrix() {
        this.modelMatrix = MatrixLib.translate(
            this.position[0], 
            this.position[1], 
            this.position[2]
        );
    }
    
    // 渲染鏡面球 (使用範例的方法)
    render(camera, lighting, textureManager = null, renderSceneCallback = null) {
        // 第一步：渲染 Cube Map
        if (renderSceneCallback && this.fbo) {
            this.renderCubeMap(renderSceneCallback);
        }
        
        // 恢復主視口
        const canvas = this.webglCore.getCanvas();
        this.gl.viewport(0, 0, canvas.width, canvas.height);
        this.gl.enable(this.gl.DEPTH_TEST);
        
        // 第二步：渲染鏡面球本身
        let program = this.shaderManager.useProgram('reflection');
        let useReflection = !!program;
        
        if (!program) {
            program = this.shaderManager.useProgram('phong');
            useReflection = false;
        }
        
        if (!program || !this.geometry) return;
        
        // 設定變換矩陣
        let mvpMatrix = new Matrix4();
        let normalMatrix = new Matrix4();
        
        // 獲取攝影機矩陣
        const viewMatrix = camera.getViewMatrix();
        const projMatrix = camera.getProjectionMatrix();
        
        // 組合 MVP 矩陣
        mvpMatrix.set(projMatrix);
        mvpMatrix.multiply(viewMatrix);
        mvpMatrix.multiply(this.modelMatrix.elements);
        
        // 計算法線矩陣
        normalMatrix.setInverseOf(this.modelMatrix);
        normalMatrix.transpose();

        if (useReflection && this.fbo) {
            // 使用動態反射著色器
            this.webglCore.setUniform(program, 'uMvpMatrix', mvpMatrix.elements, 'mat4');
            this.webglCore.setUniform(program, 'uModelMatrix', this.modelMatrix.elements, 'mat4');
            this.webglCore.setUniform(program, 'uNormalMatrix', normalMatrix.elements, 'mat4');
            this.webglCore.setUniform(program, 'uViewPosition', camera.getPosition(), 'vec3');
            this.webglCore.setUniform(program, 'uColor', [0.95, 0.85, 0.4], 'vec3');

            // 綁定動態 Cube Map
            this.gl.activeTexture(this.gl.TEXTURE0);
            this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, this.fbo.texture);
            this.webglCore.setUniform(program, 'uEnvironmentMap', 0, 'samplerCube');
            
        } else {
            // 使用 Phong 著色器
            this.webglCore.setUniform(program, 'uModelMatrix', this.modelMatrix.elements, 'mat4');
            this.webglCore.setUniform(program, 'uViewMatrix', viewMatrix, 'mat4');
            this.webglCore.setUniform(program, 'uProjectionMatrix', projMatrix, 'mat4');
            this.webglCore.setUniform(program, 'uNormalMatrix', MatrixLib.normalMatrix(this.modelMatrix), 'mat3');
            
            if (lighting.applyToShader) {
                lighting.applyToShader(this.webglCore, program, camera.getPosition());
            }
            
            // 金屬質感材質
            this.webglCore.setUniform(program, 'uAmbientColor', [0.1, 0.1, 0.15], 'vec3');
            this.webglCore.setUniform(program, 'uDiffuseColor', [0.3, 0.3, 0.4], 'vec3');
            this.webglCore.setUniform(program, 'uSpecularColor', [0.9, 0.9, 1.0], 'vec3');
            this.webglCore.setUniform(program, 'uShininess', 256.0, 'float');
            this.webglCore.setUniform(program, 'uUseTexture', false, 'bool');
        }
        
        // 綁定頂點屬性
        this.webglCore.bindVertexAttribute(
            program, 'aPosition', this.geometry.vertexBuffer, 3, this.gl.FLOAT, false, 8 * 4, 0
        );
        this.webglCore.bindVertexAttribute(
            program, 'aNormal', this.geometry.vertexBuffer, 3, this.gl.FLOAT, false, 8 * 4, 3 * 4
        );
        
        // 渲染
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.geometry.indexBuffer);
        this.webglCore.drawElements(this.gl.TRIANGLES, this.geometry.indexCount);
    }
    
    getPosition() {
        return [...this.position];
    }
    
    getModelMatrix() {
        return this.modelMatrix;
    }
    
    reset() {
        this.position = [0, 25, 0];
        this.updateModelMatrix();
    }
    
    // 清理資源
    cleanup() {
        if (this.fbo) {
            this.gl.deleteFramebuffer(this.fbo);
            this.gl.deleteTexture(this.fbo.texture);
        }
    }
}