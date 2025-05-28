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
varying vec3 vTangent;
varying vec3 vBitangent;

void main() {
    vec4 worldPosition = uModelMatrix * vec4(aPosition, 1.0);
    vWorldPosition = worldPosition.xyz;
    vWorldNormal = normalize(uNormalMatrix * aNormal);
    vTexCoord = aTexCoord;
    
    // 計算切線空間的切線和副切線向量
    // 簡化版本：基於紋理座標自動計算切線
    vec3 normal = vWorldNormal;
    
    // 創建任意切線向量（確保與法線垂直）
    vec3 tangent = vec3(1.0, 0.0, 0.0);
    if (abs(dot(normal, tangent)) > 0.9) {
        tangent = vec3(0.0, 1.0, 0.0);
    }
    
    // 使用 Gram-Schmidt 過程正交化
    tangent = normalize(tangent - dot(tangent, normal) * normal);
    vec3 bitangent = cross(normal, tangent);
    
    // 變換到世界空間
    vTangent = normalize(uNormalMatrix * tangent);
    vBitangent = normalize(uNormalMatrix * bitangent);
    
    gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;
}
