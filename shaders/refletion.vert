// 反射頂點著色器
// reflection.vert
attribute vec3 aPosition;
attribute vec3 aNormal;

uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat3 uNormalMatrix;

varying vec3 vWorldPosition;
varying vec3 vNormal;

void main() {
    vec4 worldPosition = uModelMatrix * vec4(aPosition, 1.0);
    vWorldPosition = worldPosition.xyz;
    vNormal = normalize(uNormalMatrix * aNormal);
    
    gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;
}

// 反射片段著色器
// reflection.frag
precision mediump float;

varying vec3 vWorldPosition;
varying vec3 vNormal;

uniform vec3 uCameraPosition;
uniform samplerCube uEnvironmentMap;
uniform float uReflectivity;

void main() {
    // 計算視線方向
    vec3 viewDir = normalize(vWorldPosition - uCameraPosition);
    
    // 計算反射向量
    vec3 reflectDir = reflect(viewDir, normalize(vNormal));
    
    // 從環境cube map採樣反射顏色
    vec4 reflectionColor = textureCube(uEnvironmentMap, reflectDir);
    
    // 添加輕微的金屬質感
    vec3 baseColor = vec3(0.9, 0.9, 0.95); // 稍微偏藍的金屬色
    
    // 混合基礎顏色和反射
    vec3 finalColor = mix(baseColor * 0.1, reflectionColor.rgb, uReflectivity);
    
    gl_FragColor = vec4(finalColor, 1.0);
}