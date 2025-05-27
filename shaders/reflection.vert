attribute vec4 aPosition;
attribute vec4 aNormal;

uniform mat4 uMvpMatrix;
uniform mat4 uModelMatrix;
uniform mat4 uNormalMatrix;

varying vec3 vNormal;
varying vec3 vPositionInWorld;

void main(){
    gl_Position = uMvpMatrix * aPosition;
    vPositionInWorld = (uModelMatrix * aPosition).xyz; 
    vNormal = normalize(vec3(uNormalMatrix * aNormal));
}
