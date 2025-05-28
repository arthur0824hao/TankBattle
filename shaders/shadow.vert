attribute vec3 aPosition;

uniform mat4 uModelMatrix;
uniform mat4 uLightSpaceMatrix;

void main() {
    gl_Position = uLightSpaceMatrix * uModelMatrix * vec4(aPosition, 1.0);
}
