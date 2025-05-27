precision mediump float;

uniform vec3 uViewPosition;
uniform vec3 uColor;
uniform samplerCube uEnvironmentMap;

varying vec3 vNormal;
varying vec3 vPositionInWorld;

void main() {
    vec3 V = normalize(uViewPosition - vPositionInWorld); 
    vec3 normal = normalize(vNormal);
    vec3 R = reflect(-V, normal);
    gl_FragColor = vec4(0.78 * textureCube(uEnvironmentMap, R).rgb + 0.3 * uColor, 1.0);
}
