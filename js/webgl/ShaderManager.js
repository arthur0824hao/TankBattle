/**
 * 著色器管理器
 * 負責載入、編譯、鏈接和管理所有著色器程式
 */
class ShaderManager {
    constructor(webglCore) {
        this.gl = webglCore.getContext();
        this.webglCore = webglCore;
        this.programs = new Map();
        this.shaders = new Map();
    }
    
    // 創建著色器
    createShader(source, type) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            const error = this.gl.getShaderInfoLog(shader);
            this.gl.deleteShader(shader);
            throw new Error(`Shader compilation error: ${error}`);
        }
        
        return shader;
    }
    
    // 創建著色器程式
    createProgram(vertexShader, fragmentShader) {
        const program = this.gl.createProgram();
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);
        
        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            const error = this.gl.getProgramInfoLog(program);
            this.gl.deleteProgram(program);
            throw new Error(`Program linking error: ${error}`);
        }
        
        return program;
    }
    
    // 從 DOM 元素載入著色器
    loadShaderFromDOM(elementId, type) {
        const element = document.getElementById(elementId);
        if (!element) {
            throw new Error(`Shader element ${elementId} not found`);
        }
        
        return this.createShader(element.textContent, type);
    }
    
    // 從字串載入著色器
    loadShaderFromString(source, type) {
        return this.createShader(source, type);
    }
    
    // 初始化 Phong 光照著色器
    initPhongShader() {
        const vertexShader = this.loadShaderFromDOM('phong-vertex-shader', this.gl.VERTEX_SHADER);
        const fragmentShader = this.loadShaderFromDOM('phong-fragment-shader', this.gl.FRAGMENT_SHADER);
        
        const program = this.createProgram(vertexShader, fragmentShader);
        this.programs.set('phong', program);
        
        console.log('Phong shader program created successfully');
        return program;
    }
    
    // 初始化陰影著色器
    initShadowShader() {
        const vertexSource = `
            attribute vec3 aPosition;
            uniform mat4 uModelMatrix;
            uniform mat4 uLightSpaceMatrix;
            
            void main() {
                gl_Position = uLightSpaceMatrix * uModelMatrix * vec4(aPosition, 1.0);
            }
        `;
        
        const fragmentSource = `
            precision mediump float;
            
            void main() {
                gl_FragColor = vec4(gl_FragCoord.z, gl_FragCoord.z, gl_FragCoord.z, 1.0);
            }
        `;
        
        const vertexShader = this.loadShaderFromString(vertexSource, this.gl.VERTEX_SHADER);
        const fragmentShader = this.loadShaderFromString(fragmentSource, this.gl.FRAGMENT_SHADER);
        
        const program = this.createProgram(vertexShader, fragmentShader);
        this.programs.set('shadow', program);
        
        console.log('Shadow shader program created successfully');
        return program;
    }
    
    // 初始化天空盒著色器
    initSkyboxShader() {
        const vertexSource = `
            attribute vec3 aPosition;
            uniform mat4 uViewMatrix;
            uniform mat4 uProjectionMatrix;
            varying vec3 vTexCoord;
            
            void main() {
                vTexCoord = aPosition;
                vec4 pos = uProjectionMatrix * uViewMatrix * vec4(aPosition, 1.0);
                gl_Position = pos.xyww;
            }
        `;
        
        const fragmentSource = `
            precision mediump float;
            varying vec3 vTexCoord;
            uniform samplerCube uSkybox;
            
            void main() {
                gl_FragColor = textureCube(uSkybox, vTexCoord);
            }
        `;
        
        const vertexShader = this.loadShaderFromString(vertexSource, this.gl.VERTEX_SHADER);
        const fragmentShader = this.loadShaderFromString(fragmentSource, this.gl.FRAGMENT_SHADER);
        
        const program = this.createProgram(vertexShader, fragmentShader);
        this.programs.set('skybox', program);
        
        console.log('Skybox shader program created successfully');
        return program;
    }
    
    // 初始化反射著色器
    initReflectionShader() {
        const vertexSource = `
            precision mediump float;
            attribute vec3 aPosition;
            attribute vec3 aNormal;
            
            uniform mat4 uModelMatrix;
            uniform mat4 uViewMatrix;
            uniform mat4 uProjectionMatrix;
            uniform mat4 uNormalMatrix;
            uniform mediump vec3 uCameraPosition;
            
            varying vec3 vReflectDir;
            varying vec3 vWorldPosition;
            varying vec3 vNormal;
            
            void main() {
                vec4 worldPosition = uModelMatrix * vec4(aPosition, 1.0);
                vWorldPosition = worldPosition.xyz;
                vNormal = normalize((uNormalMatrix * vec4(aNormal, 0.0)).xyz);
                
                vec3 worldNormal = normalize(mat3(uModelMatrix) * aNormal);
                vec3 worldPos = (uModelMatrix * vec4(aPosition, 1.0)).xyz;
                vec3 incident = normalize(worldPos - uCameraPosition);
                vReflectDir = reflect(incident, worldNormal);
                
                gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;
            }
        `;
        
        const fragmentSource = `
            precision mediump float;
            varying vec3 vReflectDir;
            varying vec3 vWorldPosition;
            varying vec3 vNormal;
            
            uniform samplerCube uCubeMap;
            uniform vec3 uLightPosition;
            uniform vec3 uLightColor;
            uniform mediump vec3 uCameraPosition;
            uniform float uReflectivity;
            
            void main() {
                vec3 normal = normalize(vNormal);
                vec3 lightDir = normalize(uLightPosition - vWorldPosition);
                vec3 viewDir = normalize(uCameraPosition - vWorldPosition);
                
                // 基本光照
                vec3 ambient = vec3(0.1);
                float diff = max(dot(normal, lightDir), 0.0);
                vec3 diffuse = diff * uLightColor;
                
                vec3 reflectDir = reflect(-lightDir, normal);
                float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
                vec3 specular = spec * uLightColor;
                
                vec3 baseColor = ambient + diffuse + specular;
                
                // 環境反射
                vec3 reflectionColor = textureCube(uCubeMap, vReflectDir).rgb;
                
                vec3 finalColor = mix(baseColor, reflectionColor, uReflectivity);
                gl_FragColor = vec4(finalColor, 1.0);
            }
        `;
        
        const vertexShader = this.loadShaderFromString(vertexSource, this.gl.VERTEX_SHADER);
        const fragmentShader = this.loadShaderFromString(fragmentSource, this.gl.FRAGMENT_SHADER);
        
        const program = this.createProgram(vertexShader, fragmentShader);
        this.programs.set('reflection', program);
        
        console.log('Reflection shader program created successfully');
        return program;
    }
    
    // 初始化粒子著色器（砲彈軌跡用）
    initParticleShader() {
        const vertexSource = `
            attribute vec3 aPosition;
            attribute float aSize;
            attribute vec3 aColor;
            
            uniform mat4 uViewMatrix;
            uniform mat4 uProjectionMatrix;
            
            varying vec3 vColor;
            
            void main() {
                vColor = aColor;
                gl_Position = uProjectionMatrix * uViewMatrix * vec4(aPosition, 1.0);
                gl_PointSize = aSize;
            }
        `;
        
        const fragmentSource = `
            precision mediump float;
            varying vec3 vColor;
            
            void main() {
                float dist = distance(gl_PointCoord, vec2(0.5));
                if (dist > 0.5) discard;
                
                float alpha = 1.0 - (dist * 2.0);
                gl_FragColor = vec4(vColor, alpha);
            }
        `;
        
        const vertexShader = this.loadShaderFromString(vertexSource, this.gl.VERTEX_SHADER);
        const fragmentShader = this.loadShaderFromString(fragmentSource, this.gl.FRAGMENT_SHADER);
        
        const program = this.createProgram(vertexShader, fragmentShader);
        this.programs.set('particle', program);
        
        console.log('Particle shader program created successfully');
        return program;
    }
    
    // 初始化所有著色器
    initAllShaders() {
        try {
            this.initPhongShader();
            this.initShadowShader();
            this.initSkyboxShader();
            this.initReflectionShader();
            this.initParticleShader();
            
            console.log('All shaders initialized successfully');
            return true;
        } catch (error) {
            console.error('Failed to initialize shaders:', error);
            return false;
        }
    }
    
    // 獲取著色器程式
    getProgram(name) {
        const program = this.programs.get(name);
        if (!program) {
            console.error(`Shader program ${name} not found`);
        }
        return program;
    }
    
    // 使用著色器程式
    useProgram(name) {
        const program = this.getProgram(name);
        if (program) {
            this.webglCore.useProgram(program);
            return program;
        }
        return null;
    }
    
    // 獲取 uniform 位置並緩存
    getUniformLocation(program, name) {
        if (!program._uniformLocations) {
            program._uniformLocations = new Map();
        }
        
        if (!program._uniformLocations.has(name)) {
            const location = this.gl.getUniformLocation(program, name);
            program._uniformLocations.set(name, location);
        }
        
        return program._uniformLocations.get(name);
    }
    
    // 獲取屬性位置並緩存
    getAttributeLocation(program, name) {
        if (!program._attributeLocations) {
            program._attributeLocations = new Map();
        }
        
        if (!program._attributeLocations.has(name)) {
            const location = this.gl.getAttribLocation(program, name);
            program._attributeLocations.set(name, location);
        }
        
        return program._attributeLocations.get(name);
    }
    
    // 設定 uniform 值（便利函數）
    setUniform(program, name, value, type = 'mat4') {
        const location = this.getUniformLocation(program, name);
        if (location !== null) {
            this.webglCore.setUniform(program, name, value, type);
        }
    }
    
    // 清理所有著色器
    cleanup() {
        this.programs.forEach((program) => {
            this.gl.deleteProgram(program);
        });
        this.programs.clear();
        
        this.shaders.forEach((shader) => {
            this.gl.deleteShader(shader);
        });
        this.shaders.clear();
        
        console.log('All shaders cleaned up');
    }
}