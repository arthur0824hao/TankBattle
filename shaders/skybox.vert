attribute vec3 aPosition;

uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;

varying vec3 vTexCoord;

void main() {
    // 使用位置作為紋理座標方向向量
    vTexCoord = aPosition;
    
    // 計算位置，確保天空盒總是在遠處
    vec4 pos = uProjectionMatrix * uViewMatrix * vec4(aPosition, 1.0);
    
    // 設定 z = w，讓深度值總是 1.0（最遠）
    gl_Position = pos.xyww;
}