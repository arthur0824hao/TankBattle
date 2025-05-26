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
    // 計算世界空間位置
    vec4 worldPosition = uModelMatrix * vec4(aPosition, 1.0);
    vWorldPosition = worldPosition.xyz;
    
    // 計算世界空間法向量
    vWorldNormal = normalize(uNormalMatrix * aNormal);
    
    // 傳遞紋理座標
    vTexCoord = aTexCoord;
    
    // 計算最終位置
    gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;
}
