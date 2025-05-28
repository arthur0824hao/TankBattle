precision mediump float;

void main() {
    // 深度值會自動寫入深度緩衝區
    // 片段著色器不需要輸出任何顏色
    gl_FragColor = vec4(gl_FragCoord.z, gl_FragCoord.z, gl_FragCoord.z, 1.0);
}
