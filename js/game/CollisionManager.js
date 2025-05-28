/**
 * 碰撞管理器 - 專注於非即時碰撞（重疊檢測等）
 * 砲彈命中已移至BulletManager中即時處理
 */
class CollisionManager {
    constructor() {
        this.totalHits = 0;
    }
    
    // 檢查target間重疊（防重疊機制）
    checkTargetOverlap(targetManager) {
        const targets = targetManager.getTargets();
        const overlaps = [];
        
        for (let i = 0; i < targets.length; i++) {
            for (let j = i + 1; j < targets.length; j++) {
                if (targets[i].isActive() && targets[j].isActive()) {
                    if (this.sphereCollision(targets[i], targets[j])) {
                        overlaps.push({
                            target1: targets[i],
                            target2: targets[j],
                            distance: this.calculateDistance(targets[i].getPosition(), targets[j].getPosition())
                        });
                    }
                }
            }
        }
        
        return overlaps;
    }
    
    // 球體碰撞檢測 - 使用世界座標
    sphereCollision(obj1, obj2) {
        const pos1 = obj1.getWorldPosition ? obj1.getWorldPosition() : obj1.getPosition();
        const pos2 = obj2.getWorldPosition ? obj2.getWorldPosition() : obj2.getPosition();
        
        const sphere1 = { position: pos1, radius: obj1.getRadius() };
        const sphere2 = { position: pos2, radius: obj2.getRadius() };
        
        const result = CollisionUtils.sphereToSphere(sphere1, sphere2);
        return result.hit;
    }
    
    calculateDistance(pos1, pos2) {
        // 使用統一的距離計算工具
        return CoordinateUtils.calculateDistance(pos1, pos2);
    }
    
    // 重置
    reset() {
        this.totalHits = 0;
    }
    
    // 清除當前frame記錄
    clearFrame() {
        // 現在主要用於target重疊檢測的清理
    }
}
