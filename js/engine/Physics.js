/**
 * 物理系統
 * 處理重力、碰撞檢測和物理響應
 */
class Physics {
    constructor() {
        this.gravity = [0, -9.8, 0]; // 重力加速度
        this.worldBounds = {
            min: [-800, 0, -800],
            max: [800, 800, 800]
        };
        
        // 碰撞體列表
        this.rigidBodies = [];
        this.staticBodies = [];
        
        // 物理參數
        this.damping = 0.98;
        this.restitution = 0.3; // 彈性係數
        this.friction = 0.1;
    }
    
    // 創建剛體
    createRigidBody(options = {}) {
        const rigidBody = {
            id: Math.random().toString(36).substr(2, 9),
            position: options.position || [0, 0, 0],
            velocity: options.velocity || [0, 0, 0],
            acceleration: options.acceleration || [0, 0, 0],
            mass: options.mass || 1.0,
            radius: options.radius || 1.0,
            shape: options.shape || 'sphere', // 'sphere', 'box', 'capsule'
            dimensions: options.dimensions || [1, 1, 1], // 用於box形狀
            isStatic: options.isStatic || false,
            useGravity: options.useGravity !== false,
            restitution: options.restitution || this.restitution,
            friction: options.friction || this.friction,
            active: true,
            
            // 碰撞回調
            onCollision: options.onCollision || null,
            
            // 更新位置
            updatePosition: function(deltaTime) {
                if (this.isStatic || !this.active) return;
                
                // 更新速度
                this.velocity[0] += this.acceleration[0] * deltaTime;
                this.velocity[1] += this.acceleration[1] * deltaTime;
                this.velocity[2] += this.acceleration[2] * deltaTime;
                
                // 更新位置
                this.position[0] += this.velocity[0] * deltaTime;
                this.position[1] += this.velocity[1] * deltaTime;
                this.position[2] += this.velocity[2] * deltaTime;
                
                // 重置加速度
                this.acceleration = [0, 0, 0];
            }
        };
        
        if (rigidBody.isStatic) {
            this.staticBodies.push(rigidBody);
        } else {
            this.rigidBodies.push(rigidBody);
        }
        
        return rigidBody;
    }
    
    // 移除剛體
    removeRigidBody(rigidBody) {
        const dynamicIndex = this.rigidBodies.indexOf(rigidBody);
        if (dynamicIndex > -1) {
            this.rigidBodies.splice(dynamicIndex, 1);
            return true;
        }
        
        const staticIndex = this.staticBodies.indexOf(rigidBody);
        if (staticIndex > -1) {
            this.staticBodies.splice(staticIndex, 1);
            return true;
        }
        
        return false;
    }
    
    // 施加力
    applyForce(rigidBody, force) {
        if (rigidBody.isStatic || !rigidBody.active) return;
        
        const acceleration = [
            force[0] / rigidBody.mass,
            force[1] / rigidBody.mass,
            force[2] / rigidBody.mass
        ];
        
        rigidBody.acceleration[0] += acceleration[0];
        rigidBody.acceleration[1] += acceleration[1];
        rigidBody.acceleration[2] += acceleration[2];
    }
    
    // 施加衝量
    applyImpulse(rigidBody, impulse) {
        if (rigidBody.isStatic || !rigidBody.active) return;
        
        rigidBody.velocity[0] += impulse[0] / rigidBody.mass;
        rigidBody.velocity[1] += impulse[1] / rigidBody.mass;
        rigidBody.velocity[2] += impulse[2] / rigidBody.mass;
    }
    
    // 更新物理世界
    update(deltaTime) {
        // 施加重力
        this.applyGravity();
        
        // 更新剛體位置
        this.rigidBodies.forEach(body => {
            if (body.active) {
                body.updatePosition(deltaTime);
                this.applyDamping(body);
                this.checkWorldBounds(body);
            }
        });
        
        // 檢測碰撞
        this.detectCollisions();
    }
    
    // 施加重力
    applyGravity() {
        this.rigidBodies.forEach(body => {
            if (body.useGravity && body.active) {
                this.applyForce(body, [
                    this.gravity[0] * body.mass,
                    this.gravity[1] * body.mass,
                    this.gravity[2] * body.mass
                ]);
            }
        });
    }
    
    // 施加阻尼
    applyDamping(rigidBody) {
        rigidBody.velocity[0] *= this.damping;
        rigidBody.velocity[1] *= this.damping;
        rigidBody.velocity[2] *= this.damping;
    }
    
    // 檢查世界邊界
    checkWorldBounds(rigidBody) {
        let collided = false;
        
        // X 軸邊界
        if (rigidBody.position[0] - rigidBody.radius < this.worldBounds.min[0]) {
            rigidBody.position[0] = this.worldBounds.min[0] + rigidBody.radius;
            rigidBody.velocity[0] = -rigidBody.velocity[0] * rigidBody.restitution;
            collided = true;
        } else if (rigidBody.position[0] + rigidBody.radius > this.worldBounds.max[0]) {
            rigidBody.position[0] = this.worldBounds.max[0] - rigidBody.radius;
            rigidBody.velocity[0] = -rigidBody.velocity[0] * rigidBody.restitution;
            collided = true;
        }
        
        // Y 軸邊界
        if (rigidBody.position[1] - rigidBody.radius < this.worldBounds.min[1]) {
            rigidBody.position[1] = this.worldBounds.min[1] + rigidBody.radius;
            rigidBody.velocity[1] = -rigidBody.velocity[1] * rigidBody.restitution;
            collided = true;
        } else if (rigidBody.position[1] + rigidBody.radius > this.worldBounds.max[1]) {
            rigidBody.position[1] = this.worldBounds.max[1] - rigidBody.radius;
            rigidBody.velocity[1] = -rigidBody.velocity[1] * rigidBody.restitution;
            collided = true;
        }
        
        // Z 軸邊界
        if (rigidBody.position[2] - rigidBody.radius < this.worldBounds.min[2]) {
            rigidBody.position[2] = this.worldBounds.min[2] + rigidBody.radius;
            rigidBody.velocity[2] = -rigidBody.velocity[2] * rigidBody.restitution;
            collided = true;
        } else if (rigidBody.position[2] + rigidBody.radius > this.worldBounds.max[2]) {
            rigidBody.position[2] = this.worldBounds.max[2] - rigidBody.radius;
            rigidBody.velocity[2] = -rigidBody.velocity[2] * rigidBody.restitution;
            collided = true;
        }
        
        if (collided && rigidBody.onCollision) {
            rigidBody.onCollision('boundary', null);
        }
    }
    
    // 碰撞檢測
    detectCollisions() {
        // 動態物體之間的碰撞
        for (let i = 0; i < this.rigidBodies.length; i++) {
            for (let j = i + 1; j < this.rigidBodies.length; j++) {
                const bodyA = this.rigidBodies[i];
                const bodyB = this.rigidBodies[j];
                
                if (bodyA.active && bodyB.active) {
                    this.checkCollision(bodyA, bodyB);
                }
            }
        }
        
        // 動態物體與靜態物體的碰撞
        this.rigidBodies.forEach(dynamicBody => {
            if (!dynamicBody.active) return;
            
            this.staticBodies.forEach(staticBody => {
                if (staticBody.active) {
                    this.checkCollision(dynamicBody, staticBody);
                }
            });
        });
    }
    
    // 檢查兩個物體的碰撞
    checkCollision(bodyA, bodyB) {
        let collision = null;
        
        if (bodyA.shape === 'sphere' && bodyB.shape === 'sphere') {
            collision = this.sphereSphereCollision(bodyA, bodyB);
        } else if (bodyA.shape === 'sphere' && bodyB.shape === 'box') {
            collision = this.sphereBoxCollision(bodyA, bodyB);
        } else if (bodyA.shape === 'box' && bodyB.shape === 'sphere') {
            collision = this.sphereBoxCollision(bodyB, bodyA);
            if (collision) {
                // 交換碰撞體順序
                [collision.bodyA, collision.bodyB] = [collision.bodyB, collision.bodyA];
                collision.normal = [-collision.normal[0], -collision.normal[1], -collision.normal[2]];
            }
        }
        
        if (collision) {
            this.resolveCollision(collision);
        }
    }
    
    // 球體-球體碰撞檢測
    sphereSphereCollision(bodyA, bodyB) {
        const dx = bodyB.position[0] - bodyA.position[0];
        const dy = bodyB.position[1] - bodyA.position[1];
        const dz = bodyB.position[2] - bodyA.position[2];
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const radiiSum = bodyA.radius + bodyB.radius;
        
        if (distance < radiiSum && distance > 0) {
            const normal = [dx / distance, dy / distance, dz / distance];
            const penetration = radiiSum - distance;
            
            return {
                bodyA: bodyA,
                bodyB: bodyB,
                normal: normal,
                penetration: penetration,
                contactPoint: [
                    bodyA.position[0] + normal[0] * bodyA.radius,
                    bodyA.position[1] + normal[1] * bodyA.radius,
                    bodyA.position[2] + normal[2] * bodyA.radius
                ]
            };
        }
        
        return null;
    }
    
    // 球體-盒子碰撞檢測
    sphereBoxCollision(sphere, box) {
        // 簡化的球體-盒子碰撞檢測
        const closest = [
            Math.max(box.position[0] - box.dimensions[0]/2, 
                    Math.min(sphere.position[0], box.position[0] + box.dimensions[0]/2)),
            Math.max(box.position[1] - box.dimensions[1]/2, 
                    Math.min(sphere.position[1], box.position[1] + box.dimensions[1]/2)),
            Math.max(box.position[2] - box.dimensions[2]/2, 
                    Math.min(sphere.position[2], box.position[2] + box.dimensions[2]/2))
        ];
        
        const dx = sphere.position[0] - closest[0];
        const dy = sphere.position[1] - closest[1];
        const dz = sphere.position[2] - closest[2];
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        if (distance < sphere.radius && distance > 0) {
            const normal = [dx / distance, dy / distance, dz / distance];
            const penetration = sphere.radius - distance;
            
            return {
                bodyA: sphere,
                bodyB: box,
                normal: normal,
                penetration: penetration,
                contactPoint: closest
            };
        }
        
        return null;
    }
    
    // 解決碰撞
    resolveCollision(collision) {
        const { bodyA, bodyB, normal, penetration, contactPoint } = collision;
        
        // 分離物體
        this.separateBodies(bodyA, bodyB, normal, penetration);
        
        // 計算相對速度
        const relativeVelocity = [
            bodyA.velocity[0] - bodyB.velocity[0],
            bodyA.velocity[1] - bodyB.velocity[1],
            bodyA.velocity[2] - bodyB.velocity[2]
        ];
        
        const velocityAlongNormal = 
            relativeVelocity[0] * normal[0] + 
            relativeVelocity[1] * normal[1] + 
            relativeVelocity[2] * normal[2];
        
        // 如果物體正在分離，不需要解決碰撞
        if (velocityAlongNormal > 0) return;
        
        // 計算碰撞衝量
        const restitution = Math.min(bodyA.restitution, bodyB.restitution);
        let impulseScalar = -(1 + restitution) * velocityAlongNormal;
        
        const massA = bodyA.isStatic ? Infinity : bodyA.mass;
        const massB = bodyB.isStatic ? Infinity : bodyB.mass;
        impulseScalar /= 1/massA + 1/massB;
        
        const impulse = [
            impulseScalar * normal[0],
            impulseScalar * normal[1],
            impulseScalar * normal[2]
        ];
        
        // 應用衝量
        if (!bodyA.isStatic) {
            bodyA.velocity[0] += impulse[0] / massA;
            bodyA.velocity[1] += impulse[1] / massA;
            bodyA.velocity[2] += impulse[2] / massA;
        }
        
        if (!bodyB.isStatic) {
            bodyB.velocity[0] -= impulse[0] / massB;
            bodyB.velocity[1] -= impulse[1] / massB;
            bodyB.velocity[2] -= impulse[2] / massB;
        }
        
        // 調用碰撞回調
        if (bodyA.onCollision) {
            bodyA.onCollision('body', bodyB);
        }
        if (bodyB.onCollision) {
            bodyB.onCollision('body', bodyA);
        }
    }
    
    // 分離物體
    separateBodies(bodyA, bodyB, normal, penetration) {
        const massA = bodyA.isStatic ? Infinity : bodyA.mass;
        const massB = bodyB.isStatic ? Infinity : bodyB.mass;
        const totalMass = 1/massA + 1/massB;
        
        const separationA = penetration / totalMass / massA;
        const separationB = penetration / totalMass / massB;
        
        if (!bodyA.isStatic) {
            bodyA.position[0] -= normal[0] * separationA;
            bodyA.position[1] -= normal[1] * separationA;
            bodyA.position[2] -= normal[2] * separationA;
        }
        
        if (!bodyB.isStatic) {
            bodyB.position[0] += normal[0] * separationB;
            bodyB.position[1] += normal[1] * separationB;
            bodyB.position[2] += normal[2] * separationB;
        }
    }
    
    // 射線投射
    raycast(origin, direction, maxDistance = Infinity) {
        const results = [];
        
        // 檢查所有剛體
        [...this.rigidBodies, ...this.staticBodies].forEach(body => {
            if (!body.active) return;
            
            const intersection = this.rayIntersectSphere(origin, direction, body.position, body.radius);
            if (intersection && intersection.distance <= maxDistance) {
                results.push({
                    body: body,
                    point: intersection.point,
                    distance: intersection.distance,
                    normal: intersection.normal
                });
            }
        });
        
        // 按距離排序
        results.sort((a, b) => a.distance - b.distance);
        
        return results;
    }
    
    // 射線與球體的交點
    rayIntersectSphere(rayOrigin, rayDirection, sphereCenter, sphereRadius) {
        const oc = [
            rayOrigin[0] - sphereCenter[0],
            rayOrigin[1] - sphereCenter[1],
            rayOrigin[2] - sphereCenter[2]
        ];
        
        const a = rayDirection[0] * rayDirection[0] + 
                  rayDirection[1] * rayDirection[1] + 
                  rayDirection[2] * rayDirection[2];
        const b = 2.0 * (oc[0] * rayDirection[0] + 
                        oc[1] * rayDirection[1] + 
                        oc[2] * rayDirection[2]);
        const c = oc[0] * oc[0] + oc[1] * oc[1] + oc[2] * oc[2] - 
                  sphereRadius * sphereRadius;
        
        const discriminant = b * b - 4 * a * c;
        
        if (discriminant < 0) return null;
        
        const t = (-b - Math.sqrt(discriminant)) / (2 * a);
        if (t < 0) return null;
        
        const point = [
            rayOrigin[0] + t * rayDirection[0],
            rayOrigin[1] + t * rayDirection[1],
            rayOrigin[2] + t * rayDirection[2]
        ];
        
        const normal = [
            (point[0] - sphereCenter[0]) / sphereRadius,
            (point[1] - sphereCenter[1]) / sphereRadius,
            (point[2] - sphereCenter[2]) / sphereRadius
        ];
        
        return {
            point: point,
            normal: normal,
            distance: t
        };
    }
    
    // 設定世界邊界
    setWorldBounds(min, max) {
        this.worldBounds.min = [...min];
        this.worldBounds.max = [...max];
    }
    
    // 設定重力
    setGravity(gravity) {
        this.gravity = [...gravity];
    }
    
    // 清除所有剛體
    clear() {
        this.rigidBodies.length = 0;
        this.staticBodies.length = 0;
    }
    
    // 獲取統計資訊
    getStats() {
        return {
            rigidBodies: this.rigidBodies.length,
            staticBodies: this.staticBodies.length,
            totalBodies: this.rigidBodies.length + this.staticBodies.length
        };
    }
}