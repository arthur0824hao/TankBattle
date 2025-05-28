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
    
    // 2. 漫反射（Lambert's Law）- 正確使用 dot product
    float dotNL = dot(normal, lightDirection);
    float diffuseFactor = max(dotNL, 0.0);  // 角度 > 90度時為0
    vec3 diffuse = uDiffuseColor * diffuseFactor;
    
    // 3. 鏡面反射（Phong 模型）- 正確使用 dot product
    float dotVR = dot(viewDirection, reflectDirection);
    float specularFactor = pow(max(dotVR, 0.0), uShininess);
    vec3 specular = uSpecularColor * specularFactor;
    
    // 應用紋理到漫反射
    vec3 finalDiffuse = diffuse;
    if (uUseTexture) {
        vec3 textureColor = texture2D(uTexture, vTexCoord).rgb;
        finalDiffuse = finalDiffuse * textureColor;
    }
    
    // 最終顏色：環境光 + (漫反射 + 鏡面反射) * 光顏色 * 衰減
    vec3 finalColor = ambient + (finalDiffuse + specular) * uLightColor * attenuation;
    
    gl_FragColor = vec4(finalColor, 1.0);
}
