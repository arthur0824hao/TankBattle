precision mediump float;

varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
varying vec2 vTexCoord;

uniform vec3 uLightPosition;
uniform vec3 uLightColor;
uniform vec3 uCameraPosition;
uniform vec3 uAmbientColor;
uniform vec3 uDiffuseColor;
uniform vec3 uSpecularColor;
uniform float uShininess;
uniform bool uUseTexture;
uniform sampler2D uTexture;
uniform vec3 uLightAttenuation;

void main() {
    vec3 normal = normalize(vWorldNormal);
    vec3 lightDirection = uLightPosition - vWorldPosition;
    float lightDistance = length(lightDirection);
    lightDirection = normalize(lightDirection);
    vec3 viewDirection = normalize(uCameraPosition - vWorldPosition);
    vec3 reflectDirection = reflect(-lightDirection, normal);
    
    float attenuation = 1.0 / (uLightAttenuation.x + 
                              uLightAttenuation.y * lightDistance + 
                              uLightAttenuation.z * lightDistance * lightDistance);
    
    vec3 ambient = uAmbientColor;
    float diffuseFactor = max(dot(normal, lightDirection), 0.0);
    vec3 diffuse = uDiffuseColor * diffuseFactor;
    float specularFactor = pow(max(dot(viewDirection, reflectDirection), 0.0), uShininess);
    vec3 specular = uSpecularColor * specularFactor;
    
    vec3 finalDiffuse = diffuse;
    if (uUseTexture) {
        vec3 textureColor = texture2D(uTexture, vTexCoord).rgb;
        finalDiffuse = finalDiffuse * textureColor;
    }
    
    vec3 finalColor = ambient + (finalDiffuse + specular) * uLightColor * attenuation;
    gl_FragColor = vec4(finalColor, 1.0);
}
