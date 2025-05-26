precision mediump float;

varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
varying vec2 vTexCoord;

// 光照參數
uniform vec3 uLightPosition;
uniform vec3 uLightColor;
uniform vec3 uCameraPosition;

// 材質參數
uniform vec3 uAmbientColor;
uniform vec3 uDiffuseColor;
uniform vec3 uSpecularColor;
uniform float uShininess;

// 紋理
uniform bool uUseTexture;
uniform sampler2D uTexture;

// 光衰減參數
uniform vec3 uLightAttenuation; // (constant, linear, quadratic)

void main() {
    // 正規化法向量
    vec3 normal = normalize(vWorldNormal);
    
    // 計算光照向量
    vec3 lightDirection = uLightPosition - vWorldPosition;
    float lightDistance = length(lightDirection);
    lightDirection = normalize(lightDirection);
    
    // 計算視線向量
    vec3 viewDirection = normalize(uCameraPosition - vWorldPosition);
    
    // 計算反射向量
    vec3 reflectDirection = reflect(-lightDirection, normal);
    
    // 計算光衰減
    float attenuation = 1.0 / (uLightAttenuation.x + 
                              uLightAttenuation.y * lightDistance + 
                              uLightAttenuation.z * lightDistance * lightDistance);
    
    // 環境光分量 - 獨立計算，不受光源影響
    vec3 ambient = uAmbientColor;
    
    // 漫反射分量 - 受光源顏色和衰減影響
    float diffuseFactor = max(dot(normal, lightDirection), 0.0);
    vec3 diffuse = uDiffuseColor * diffuseFactor * uLightColor * attenuation;
    
    // 鏡面反射分量 - 只在有漫反射時計算
    vec3 specular = vec3(0.0);
    if (diffuseFactor > 0.0) {
        float specularFactor = pow(max(dot(viewDirection, reflectDirection), 0.0), uShininess);
        specular = uSpecularColor * specularFactor * uLightColor * attenuation;
    }
    
    // 如果使用紋理，將其與漫反射顏色混合
    vec3 finalDiffuse = diffuse;
    if (uUseTexture) {
        vec3 textureColor = texture2D(uTexture, vTexCoord).rgb;
        finalDiffuse = finalDiffuse * textureColor;
    }
    
    // 組合所有光照分量：環境光 + 漫反射 + 鏡面反射
    vec3 finalColor = ambient + finalDiffuse + specular;
    
    // 確保顏色值在合理範圍內
    finalColor = clamp(finalColor, 0.0, 1.0);
    
    gl_FragColor = vec4(finalColor, 1.0);
}
