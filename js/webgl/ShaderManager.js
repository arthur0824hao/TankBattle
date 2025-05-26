/**
 * 著色器管理器
 * 載入、編譯和管理所有著色器程式
 */
class ShaderManager {
    constructor(webglCore) {
        this.webglCore = webglCore;
        this.gl = webglCore.getContext();
        this.programs = new Map();
        this.shaderSources = new Map();
        this.currentProgram = null;
    }
    
    // 初始化所有著色器
    async initAllShaders() {
        try {
            // 載入Phong光照著色器
            await this.loadShaderProgram('phong', 'shaders/phong.vert', 'shaders/phong.frag');
            
            console.log('All shaders loaded successfully');
            return true;
        } catch (error) {
            console.error('Failed to load shaders:', error);
            return false;
        }
    }
    
    // 載入著色器程式
    async loadShaderProgram(name, vertexShaderPath, fragmentShaderPath) {
        try {
            // 載入著色器源碼
            const vertexSource = await this.loadShaderSource(vertexShaderPath);
            const fragmentSource = await this.loadShaderSource(fragmentShaderPath);
            
            // 編譯著色器
            const vertexShader = this.compileShader(vertexSource, this.gl.VERTEX_SHADER);
            const fragmentShader = this.compileShader(fragmentSource, this.gl.FRAGMENT_SHADER);
            
            // 鏈接程式
            const program = this.linkProgram(vertexShader, fragmentShader);
            
            // 儲存程式
            this.programs.set(name, program);
            
            console.log(`Shader program '${name}' loaded successfully`);
            return program;
        } catch (error) {
            console.error(`Failed to load shader program '${name}':`, error);
            throw error;
        }
    }
    
    // 載入著色器源碼
    async loadShaderSource(path) {
        if (this.shaderSources.has(path)) {
            return this.shaderSources.get(path);
        }
        
        try {
            const response = await fetch(path);
            if (!response.ok) {
                // 如果載入失敗，使用內建著色器
                return this.getBuiltinShaderSource(path);
            }
            const source = await response.text();
            this.shaderSources.set(path, source);
            return source;
        } catch (error) {
            console.warn(`Failed to load shader from ${path}, using builtin shader`);
            return this.getBuiltinShaderSource(path);
        }
    }
    
    // 獲取內建著色器源碼
    getBuiltinShaderSource(path) {
        if (path.includes('phong.vert')) {
            return `
attribute vec3 aPosition;
attribute vec3 aNormal;
attribute vec2 aTexCoord;

uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat3 uNormalMatrix;

varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
varying vec2 vTexCoord;

void main() {
    vec4 worldPosition = uModelMatrix * vec4(aPosition, 1.0);
    vWorldPosition = worldPosition.xyz;
    vWorldNormal = normalize(uNormalMatrix * aNormal);
    vTexCoord = aTexCoord;
    gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;
}
            `;
        } else if (path.includes('phong.frag')) {
            return `
precision mediump float;

varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
varying vec2 vTexCoord;

uniform vec3 uLightPosition;
uniform vec3 uLightColor;
uniform vec3 uCameraPosition;
uniform vec3 uAmbientColor;
uniform vec3 uDiffuseColor;
uniform vec3 uSpecularColor;
uniform float uShininess;
uniform bool uUseTexture;
uniform sampler2D uTexture;
uniform vec3 uLightAttenuation;

void main() {
    vec3 normal = normalize(vWorldNormal);
    vec3 lightDirection = uLightPosition - vWorldPosition;
    float lightDistance = length(lightDirection);
    lightDirection = normalize(lightDirection);
    vec3 viewDirection = normalize(uCameraPosition - vWorldPosition);
    vec3 reflectDirection = reflect(-lightDirection, normal);
    
    float attenuation = 1.0 / (uLightAttenuation.x + 
                              uLightAttenuation.y * lightDistance + 
                              uLightAttenuation.z * lightDistance * lightDistance);
    
    vec3 ambient = uAmbientColor;
    float diffuseFactor = max(dot(normal, lightDirection), 0.0);
    vec3 diffuse = uDiffuseColor * diffuseFactor;
    float specularFactor = pow(max(dot(viewDirection, reflectDirection), 0.0), uShininess);
    vec3 specular = uSpecularColor * specularFactor;
    
    vec3 finalDiffuse = diffuse;
    if (uUseTexture) {
        vec3 textureColor = texture2D(uTexture, vTexCoord).rgb;
        finalDiffuse = finalDiffuse * textureColor;
    }
    
    vec3 finalColor = ambient + (finalDiffuse + specular) * uLightColor * attenuation;
    gl_FragColor = vec4(finalColor, 1.0);
}
            `;
        }
        
        throw new Error(`Unknown builtin shader: ${path}`);
    }
    
    // 編譯著色器
    compileShader(source, type) {
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
    
    // 鏈接程式
    linkProgram(vertexShader, fragmentShader) {
        const program = this.gl.createProgram();
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);
        
        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            const error = this.gl.getProgramInfoLog(program);
            this.gl.deleteProgram(program);
            throw new Error(`Program linking error: ${error}`);
        }
        
        // 清理著色器
        this.gl.deleteShader(vertexShader);
        this.gl.deleteShader(fragmentShader);
        
        return program;
    }
    
    // 使用著色器程式
    useProgram(name) {
        const program = this.programs.get(name);
        if (!program) {
            console.error(`Shader program '${name}' not found`);
            return null;
        }
        
        if (this.currentProgram !== program) {
            this.gl.useProgram(program);
            this.currentProgram = program;
        }
        
        return program;
    }
    
    // 獲取當前程式
    getCurrentProgram() {
        return this.currentProgram;
    }
    
    // 獲取程式
    getProgram(name) {
        return this.programs.get(name);
    }
    
    // 檢查程式是否存在
    hasProgram(name) {
        return this.programs.has(name);
    }
    
    // 清理資源
    cleanup() {
        this.programs.forEach(program => {
            this.gl.deleteProgram(program);
        });
        this.programs.clear();
        this.shaderSources.clear();
        this.currentProgram = null;
    }
}