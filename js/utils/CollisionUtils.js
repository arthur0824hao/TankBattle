/**
 * 碰撞檢測工具類
 * 提供各種幾何體間的碰撞檢測方法
 */
class CollisionUtils {
    
    // 球體與球體的碰撞檢測
    static sphereToSphere(pos1, radius1, pos2, radius2) {
        const dx = pos2[0] - pos1[0];
        const dy = pos2[1] - pos1[1];
        const dz = pos2[2] - pos1[2];
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const radiiSum = radius1 + radius2;
        
        if (distance < radiiSum && distance > 0) {
            return {
                collided: true,
                distance: distance,
                penetration: radiiSum - distance,
                normal: [dx / distance, dy / distance, dz / distance],
                contactPoint: [
                    pos1[0] + (dx / distance) * radius1,
                    pos1[1] + (dy / distance) * radius1,
                    pos1[2] + (dz / distance) * radius1
                ]
            };
        }
        
        return { collided: false };
    }
    
    // 球體與AABB盒子的碰撞檢測
    static sphereToBox(spherePos, sphereRadius, boxPos, boxDimensions) {
        const halfDims = [
            boxDimensions[0] / 2,
            boxDimensions[1] / 2,
            boxDimensions[2] / 2
        ];
        
        // 找到盒子上最近的點
        const closest = [
            Math.max(boxPos[0] - halfDims[0], 
                    Math.min(spherePos[0], boxPos[0] + halfDims[0])),
            Math.max(boxPos[1] - halfDims[1], 
                    Math.min(spherePos[1], boxPos[1] + halfDims[1])),
            Math.max(boxPos[2] - halfDims[2], 
                    Math.min(spherePos[2], boxPos[2] + halfDims[2]))
        ];
        
        const dx = spherePos[0] - closest[0];
        const dy = spherePos[1] - closest[1];
        const dz = spherePos[2] - closest[2];
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        if (distance < sphereRadius && distance > 0) {
            return {
                collided: true,
                distance: distance,
                penetration: sphereRadius - distance,
                normal: [dx / distance, dy / distance, dz / distance],
                contactPoint: closest
            };
        }
        
        return { collided: false };
    }
    
    // 點是否在AABB盒子內
    static pointInBox(point, boxPos, boxDimensions) {
        const halfDims = [
            boxDimensions[0] / 2,
            boxDimensions[1] / 2,
            boxDimensions[2] / 2
        ];
        
        return (
            point[0] >= boxPos[0] - halfDims[0] && point[0] <= boxPos[0] + halfDims[0] &&
            point[1] >= boxPos[1] - halfDims[1] && point[1] <= boxPos[1] + halfDims[1] &&
            point[2] >= boxPos[2] - halfDims[2] && point[2] <= boxPos[2] + halfDims[2]
        );
    }
    
    // 點是否在球體內
    static pointInSphere(point, spherePos, sphereRadius) {
        const dx = point[0] - spherePos[0];
        const dy = point[1] - spherePos[1];
        const dz = point[2] - spherePos[2];
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        return distance <= sphereRadius;
    }
    
    // 射線與球體相交檢測
    static rayToSphere(rayOrigin, rayDirection, spherePos, sphereRadius) {
        const oc = [
            rayOrigin[0] - spherePos[0],
            rayOrigin[1] - spherePos[1],
            rayOrigin[2] - spherePos[2]
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
        
        const t1 = (-b - Math.sqrt(discriminant)) / (2 * a);
        const t2 = (-b + Math.sqrt(discriminant)) / (2 * a);
        
        const t = t1 >= 0 ? t1 : (t2 >= 0 ? t2 : null);
        if (t === null) return null;
        
        const point = [
            rayOrigin[0] + t * rayDirection[0],
            rayOrigin[1] + t * rayDirection[1],
            rayOrigin[2] + t * rayDirection[2]
        ];
        
        const normal = [
            (point[0] - spherePos[0]) / sphereRadius,
            (point[1] - spherePos[1]) / sphereRadius,
            (point[2] - spherePos[2]) / sphereRadius
        ];
        
        return {
            hit: true,
            point: point,
            normal: normal,
            distance: t
        };
    }
    
    // 射線與AABB盒子相交檢測
    static rayToBox(rayOrigin, rayDirection, boxPos, boxDimensions) {
        const halfDims = [
            boxDimensions[0] / 2,
            boxDimensions[1] / 2,
            boxDimensions[2] / 2
        ];
        
        const boxMin = [
            boxPos[0] - halfDims[0],
            boxPos[1] - halfDims[1],
            boxPos[2] - halfDims[2]
        ];
        
        const boxMax = [
            boxPos[0] + halfDims[0],
            boxPos[1] + halfDims[1],
            boxPos[2] + halfDims[2]
        ];
        
        let tMin = 0;
        let tMax = Infinity;
        
        for (let i = 0; i < 3; i++) {
            if (Math.abs(rayDirection[i]) < 1e-6) {
                // 射線平行於該軸
                if (rayOrigin[i] < boxMin[i] || rayOrigin[i] > boxMax[i]) {
                    return null; // 沒有相交
                }
            } else {
                const t1 = (boxMin[i] - rayOrigin[i]) / rayDirection[i];
                const t2 = (boxMax[i] - rayOrigin[i]) / rayDirection[i];
                
                const tNear = Math.min(t1, t2);
                const tFar = Math.max(t1, t2);
                
                tMin = Math.max(tMin, tNear);
                tMax = Math.min(tMax, tFar);
                
                if (tMin > tMax) {
                    return null; // 沒有相交
                }
            }
        }
        
        const t = tMin >= 0 ? tMin : (tMax >= 0 ? tMax : null);
        if (t === null) return null;
        
        const point = [
            rayOrigin[0] + t * rayDirection[0],
            rayOrigin[1] + t * rayDirection[1],
            rayOrigin[2] + t * rayDirection[2]
        ];
        
        // 計算法向量（簡化版）
        let normal = [0, 0, 0];
        const epsilon = 1e-4;
        
        if (Math.abs(point[0] - boxMin[0]) < epsilon) normal = [-1, 0, 0];
        else if (Math.abs(point[0] - boxMax[0]) < epsilon) normal = [1, 0, 0];
        else if (Math.abs(point[1] - boxMin[1]) < epsilon) normal = [0, -1, 0];
        else if (Math.abs(point[1] - boxMax[1]) < epsilon) normal = [0, 1, 0];
        else if (Math.abs(point[2] - boxMin[2]) < epsilon) normal = [0, 0, -1];
        else if (Math.abs(point[2] - boxMax[2]) < epsilon) normal = [0, 0, 1];
        
        return {
            hit: true,
            point: point,
            normal: normal,
            distance: t
        };
    }
    
    // 計算兩點間距離
    static distance(pos1, pos2) {
        const dx = pos2[0] - pos1[0];
        const dy = pos2[1] - pos1[1];
        const dz = pos2[2] - pos1[2];
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    
    // 計算兩點間距離的平方（避免開方運算）
    static distanceSquared(pos1, pos2) {
        const dx = pos2[0] - pos1[0];
        const dy = pos2[1] - pos1[1];
        const dz = pos2[2] - pos1[2];
        return dx * dx + dy * dy + dz * dz;
    }
    
    // 正規化向量
    static normalize(vector) {
        const length = Math.sqrt(
            vector[0] * vector[0] + 
            vector[1] * vector[1] + 
            vector[2] * vector[2]
        );
        
        if (length === 0) return [0, 0, 0];
        
        return [
            vector[0] / length,
            vector[1] / length,
            vector[2] / length
        ];
    }
    
    // 向量點積
    static dot(v1, v2) {
        return v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2];
    }
    
    // 向量叉積
    static cross(v1, v2) {
        return [
            v1[1] * v2[2] - v1[2] * v2[1],
            v1[2] * v2[0] - v1[0] * v2[2],
            v1[0] * v2[1] - v1[1] * v2[0]
        ];
    }
    
    // 檢查邊界碰撞
    static checkBounds(position, radius, bounds) {
        const collisions = [];
        
        // X 軸邊界
        if (position[0] - radius < bounds.min[0]) {
            collisions.push({
                axis: 'x',
                side: 'min',
                penetration: (bounds.min[0] - (position[0] - radius)),
                normal: [1, 0, 0]
            });
        } else if (position[0] + radius > bounds.max[0]) {
            collisions.push({
                axis: 'x',
                side: 'max',
                penetration: ((position[0] + radius) - bounds.max[0]),
                normal: [-1, 0, 0]
            });
        }
        
        // Y 軸邊界
        if (position[1] - radius < bounds.min[1]) {
            collisions.push({
                axis: 'y',
                side: 'min',
                penetration: (bounds.min[1] - (position[1] - radius)),
                normal: [0, 1, 0]
            });
        } else if (position[1] + radius > bounds.max[1]) {
            collisions.push({
                axis: 'y',
                side: 'max',
                penetration: ((position[1] + radius) - bounds.max[1]),
                normal: [0, -1, 0]
            });
        }
        
        // Z 軸邊界
        if (position[2] - radius < bounds.min[2]) {
            collisions.push({
                axis: 'z',
                side: 'min',
                penetration: (bounds.min[2] - (position[2] - radius)),
                normal: [0, 0, 1]
            });
        } else if (position[2] + radius > bounds.max[2]) {
            collisions.push({
                axis: 'z',
                side: 'max',
                penetration: ((position[2] + radius) - bounds.max[2]),
                normal: [0, 0, -1]
            });
        }
        
        return collisions;
    }
}
