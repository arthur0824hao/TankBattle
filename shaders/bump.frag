precision mediump float;

varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
varying vec2 vTexCoord;
varying vec3 vTangent;
varying vec3 vBitangent;

uniform vec3 uLightPosition;
uniform vec3 uLightColor;
uniform vec3 uCameraPosition;
uniform vec3 uAmbientColor;
uniform vec3 uDiffuseColor;
uniform vec3 uSpecularColor;
uniform float uShininess;
uniform vec3 uLightAttenuation;

uniform sampler2D uTexture;        // 基礎紋理
uniform sampler2D uNormalMap;      // 法線貼圖
uniform bool uUseTexture;
uniform bool uUseNormalMap;
uniform float uBumpStrength;       // 凹凸強度控制

void main() {
    // 獲取法線
    vec3 normal = normalize(vWorldNormal);
    
    if (uUseNormalMap) {
        // 從法線貼圖採樣
        vec3 normalMapSample = texture2D(uNormalMap, vTexCoord).rgb;
        
        // 將法線從 [0,1] 範圍轉換到 [-1,1] 範圍
        normalMapSample = normalMapSample * 2.0 - 1.0;
        
        // 調整凹凸強度
        normalMapSample.xy *= uBumpStrength;
        normalMapSample = normalize(normalMapSample);
        
        // 構建 TBN 矩陣（切線空間到世界空間）
        vec3 T = normalize(vTangent);
        vec3 B = normalize(vBitangent);
        vec3 N = normalize(vWorldNormal);
        mat3 TBN = mat3(T, B, N);
        
        // 將法線從切線空間轉換到世界空間
        normal = normalize(TBN * normalMapSample);
    }
    
    // 光照計算
    vec3 lightDirection = uLightPosition - vWorldPosition;
    float lightDistance = length(lightDirection);
    lightDirection = normalize(lightDirection);
    vec3 viewDirection = normalize(uCameraPosition - vWorldPosition);
    vec3 reflectDirection = reflect(-lightDirection, normal);
    
    // 光照衰減
    float attenuation = 1.0 / (uLightAttenuation.x + 
                              uLightAttenuation.y * lightDistance + 
                              uLightAttenuation.z * lightDistance * lightDistance);
    
    // Phong 光照模型
    vec3 ambient = uAmbientColor;
    
    float diffuseFactor = max(dot(normal, lightDirection), 0.0);
    vec3 diffuse = uDiffuseColor * diffuseFactor;
    
    float specularFactor = pow(max(dot(viewDirection, reflectDirection), 0.0), uShininess);
    vec3 specular = uSpecularColor * specularFactor;
    
    // 最終顏色計算
    vec3 finalDiffuse = diffuse;
    if (uUseTexture) {
        vec3 textureColor = texture2D(uTexture, vTexCoord).rgb;
        finalDiffuse = finalDiffuse * textureColor;
    }
    
    vec3 finalColor = ambient + (finalDiffuse + specular) * uLightColor * attenuation;
    gl_FragColor = vec4(finalColor, 1.0);
}
