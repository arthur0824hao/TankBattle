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
    
    // 初始化所有著色器（修改為非同步）
    async initAllShaders() {
        console.log('Initializing all shaders...');
        
        const shaders = [
            { name: 'phong', vertex: 'phong.vert', fragment: 'phong.frag' },
            { name: 'skybox', vertex: 'skybox.vert', fragment: 'skybox.frag' },
            { name: 'bump', vertex: 'bump.vert', fragment: 'bump.frag' },
            { name: 'shadow', vertex: 'shadow.vert', fragment: 'shadow.frag' }  // 新增陰影著色器
        ];
        
        let successCount = 0;
        
        // 使用 Promise.all 確保所有著色器都載入完成
        const results = await Promise.allSettled(
            shaders.map(shader => this.loadShaderProgram(shader.name, shader.vertex, shader.fragment))
        );
        
        results.forEach((result, index) => {
            const shader = shaders[index];
            if (result.status === 'fulfilled') {
                successCount++;
                console.log(`✓ Shader '${shader.name}' loaded successfully`);
            } else {
                console.error(`✗ Failed to load shader '${shader.name}':`, result.reason);
            }
        });
        
        console.log(`Shader initialization complete: ${successCount}/${shaders.length} loaded`);
        
        return this.programs.has('phong');
    }
    
    // 載入著色器程式
    async loadShaderProgram(name, vertexShaderPath, fragmentShaderPath) {
        try {
            const vertexSource = await this.loadShaderSource('shaders/' + vertexShaderPath);
            const fragmentSource = await this.loadShaderSource('shaders/' + fragmentShaderPath);
            
            const vertexShader = this.compileShader(vertexSource, this.gl.VERTEX_SHADER);
            const fragmentShader = this.compileShader(fragmentSource, this.gl.FRAGMENT_SHADER);
            
            const program = this.linkProgram(vertexShader, fragmentShader);
            
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
uniform mat4 uLightSpaceMatrix;

varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
varying vec2 vTexCoord;
varying vec4 vLightSpacePos;

void main() {
    vec4 worldPosition = uModelMatrix * vec4(aPosition, 1.0);
    vWorldPosition = worldPosition.xyz;
    vWorldNormal = normalize(uNormalMatrix * aNormal);
    vTexCoord = aTexCoord;
    vLightSpacePos = uLightSpaceMatrix * worldPosition;
    gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;
}
            `;
        } else if (path.includes('phong.frag')) {
            return `
precision mediump float;

varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
varying vec2 vTexCoord;
varying vec4 vLightSpacePos;

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

// 陰影相關 uniform
uniform sampler2D uShadowMap;
uniform bool uShadowEnabled;
uniform float uShadowBias;

float calculateShadow(vec4 lightSpacePos) {
    if (!uShadowEnabled) return 0.0;
    
    // 轉換到 NDC 座標
    vec3 projCoords = lightSpacePos.xyz / lightSpacePos.w;
    projCoords = projCoords * 0.5 + 0.5;
    
    // 超出陰影貼圖範圍時不在陰影中
    if (projCoords.z > 1.0) return 0.0;
    if (projCoords.x < 0.0 || projCoords.x > 1.0 || projCoords.y < 0.0 || projCoords.y > 1.0) return 0.0;
    
    // 從陰影貼圖讀取最近深度值
    float closestDepth = texture2D(uShadowMap, projCoords.xy).r;
    float currentDepth = projCoords.z;
    
    // 較小的偏移，讓陰影更明顯
    float bias = 0.001;
    
    // PCF - 軟陰影邊緣
    float shadow = 0.0;
    vec2 texelSize = 1.0 / vec2(2048.0, 2048.0);
    for(int x = -1; x <= 1; ++x) {
        for(int y = -1; y <= 1; ++y) {
            float pcfDepth = texture2D(uShadowMap, projCoords.xy + vec2(x, y) * texelSize).r;
            shadow += currentDepth - bias > pcfDepth ? 1.0 : 0.0;
        }
    }
    shadow /= 9.0;
    
    return shadow;
}

void main() {
    // 正規化法向量
    vec3 normal = normalize(vWorldNormal);
    
    // 計算光線方向（從表面點指向光源）
    vec3 lightDirection = normalize(uLightPosition - vWorldPosition);
    
    // 計算視線方向（從表面點指向攝影機）
    vec3 viewDirection = normalize(uCameraPosition - vWorldPosition);
    
    // 計算反射方向（用於鏡面反射）
    vec3 reflectDirection = reflect(-lightDirection, normal);
    
    // 計算光源距離（用於衰減）
    float lightDistance = length(uLightPosition - vWorldPosition);
    
    // 光衰減計算
    float attenuation = 1.0 / (uLightAttenuation.x + 
                              uLightAttenuation.y * lightDistance + 
                              uLightAttenuation.z * lightDistance * lightDistance);
    
    // === Phong 光照模型 ===
    
    // 1. 環境光（不受角度影響）
    vec3 ambient = uAmbientColor;
    
    // 2. 漫反射（Lambert's Law）- 修正：使用 dot product 計算角度
    float dotNL = dot(normal, lightDirection);
    float diffuseFactor = max(dotNL, 0.0);  // 角度 > 90度時為0（背面不被照亮）
    vec3 diffuse = uDiffuseColor * diffuseFactor;
    
    // 3. 鏡面反射（Phong 模型）- 修正：使用 dot product 計算角度
    float dotVR = dot(viewDirection, reflectDirection);
    float specularFactor = pow(max(dotVR, 0.0), uShininess);
    vec3 specular = uSpecularColor * specularFactor;
    
    // 計算陰影（更強烈的陰影效果）
    float shadow = calculateShadow(vLightSpacePos);
    shadow = min(shadow * 1.5, 1.0); // 增強陰影強度
    
    // 應用紋理到漫反射
    vec3 finalDiffuse = diffuse;
    if (uUseTexture) {
        vec3 textureColor = texture2D(uTexture, vTexCoord).rgb;
        finalDiffuse = finalDiffuse * textureColor;
    }
    
    // 最終顏色計算：環境光 + (1 - 陰影) * (漫反射 + 鏡面反射) * 光顏色 * 衰減
    vec3 lightContribution = (finalDiffuse + specular) * uLightColor * attenuation;
    vec3 finalColor = ambient + (1.0 - shadow) * lightContribution;
    
    // 增加對比度讓陰影更明顯
    finalColor = finalColor * (1.0 + shadow * 0.3);
    
    gl_FragColor = vec4(finalColor, 1.0);
}
            `;
        } else if (path.includes('shadow.vert')) {
            return `
attribute vec3 aPosition;

uniform mat4 uModelMatrix;
uniform mat4 uLightSpaceMatrix;

void main() {
    gl_Position = uLightSpaceMatrix * uModelMatrix * vec4(aPosition, 1.0);
}
            `;
        } else if (path.includes('shadow.frag')) {
            return `
precision mediump float;

void main() {
    gl_FragColor = vec4(gl_FragCoord.z, gl_FragCoord.z, gl_FragCoord.z, 1.0);
}
            `;
        }
        
        // 其他著色器保持原樣...
        else if (path.includes('skybox.vert')) {
            return `
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
        } else if (path.includes('skybox.frag')) {
            return `
precision mediump float;

varying vec3 vTexCoord;
uniform samplerCube uSkybox;

void main() {
    gl_FragColor = textureCube(uSkybox, vTexCoord);
}
            `;
        } else if (path.includes('bump.vert')) {
            return `
attribute vec3 aPosition;
attribute vec3 aNormal;
attribute vec2 aTexCoord;

uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat3 uNormalMatrix;
uniform mat4 uLightSpaceMatrix;

varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
varying vec2 vTexCoord;
varying vec3 vTangent;
varying vec3 vBitangent;
varying vec4 vLightSpacePos;

void main() {
    vec4 worldPosition = uModelMatrix * vec4(aPosition, 1.0);
    vWorldPosition = worldPosition.xyz;
    vWorldNormal = normalize(uNormalMatrix * aNormal);
    vTexCoord = aTexCoord;
    vLightSpacePos = uLightSpaceMatrix * worldPosition;
    
    vec3 normal = vWorldNormal;
    vec3 tangent = vec3(1.0, 0.0, 0.0);
    if (abs(dot(normal, tangent)) > 0.9) {
        tangent = vec3(0.0, 1.0, 0.0);
    }
    
    tangent = normalize(tangent - dot(tangent, normal) * normal);
    vec3 bitangent = cross(normal, tangent);
    
    vTangent = normalize(uNormalMatrix * tangent);
    vBitangent = normalize(uNormalMatrix * bitangent);
    
    gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;
}
            `;
        } else if (path.includes('bump.frag')) {
            return `
precision mediump float;

varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
varying vec2 vTexCoord;
varying vec3 vTangent;
varying vec3 vBitangent;
varying vec4 vLightSpacePos;

uniform vec3 uLightPosition;
uniform vec3 uLightColor;
uniform vec3 uCameraPosition;
uniform vec3 uAmbientColor;
uniform vec3 uDiffuseColor;
uniform vec3 uSpecularColor;
uniform float uShininess;
uniform vec3 uLightAttenuation;

uniform sampler2D uTexture;
uniform sampler2D uNormalMap;
uniform bool uUseTexture;
uniform bool uUseNormalMap;
uniform float uBumpStrength;

uniform sampler2D uShadowMap;
uniform bool uShadowEnabled;
uniform float uShadowBias;

float calculateShadow(vec4 lightSpacePos) {
    if (!uShadowEnabled) return 0.0;
    
    vec3 projCoords = lightSpacePos.xyz / lightSpacePos.w;
    projCoords = projCoords * 0.5 + 0.5;
    
    if (projCoords.z > 1.0) return 0.0;
    if (projCoords.x < 0.0 || projCoords.x > 1.0 || projCoords.y < 0.0 || projCoords.y > 1.0) return 0.0;
    
    float closestDepth = texture2D(uShadowMap, projCoords.xy).r;
    float currentDepth = projCoords.z;
    
    return currentDepth - uShadowBias > closestDepth ? 1.0 : 0.0;
}

void main() {
    vec3 normal = normalize(vWorldNormal);
    
    if (uUseNormalMap) {
        vec3 normalMapSample = texture2D(uNormalMap, vTexCoord).rgb;
        normalMapSample = normalMapSample * 2.0 - 1.0;
        normalMapSample.xy *= uBumpStrength;
        normalMapSample = normalize(normalMapSample);
        
        vec3 T = normalize(vTangent);
        vec3 B = normalize(vBitangent);
        vec3 N = normalize(vWorldNormal);
        mat3 TBN = mat3(T, B, N);
        
        normal = normalize(TBN * normalMapSample);
    }
    
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
    
    float shadow = calculateShadow(vLightSpacePos);
    
    vec3 finalDiffuse = diffuse;
    if (uUseTexture) {
        vec3 textureColor = texture2D(uTexture, vTexCoord).rgb;
        finalDiffuse = finalDiffuse * textureColor;
    }
    
    vec3 finalColor = ambient + (1.0 - shadow) * (finalDiffuse + specular) * uLightColor * attenuation;
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