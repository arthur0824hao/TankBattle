/**
 * 攝影機控制系統
 * 支援第一人稱和第三人稱視角切換
 */
class Camera {
    constructor() {
        // 攝影機基本屬性
        this.position = [0, 10, 20];
        this.target = [0, 0, 0];
        this.up = [0, 1, 0];
        
        // 投影矩陣參數
        this.fov = MatrixLib.degToRad(60);
        this.aspect = 1.0;
        this.near = 0.1;
        this.far = 1000.0;
        
        // 視角切換flag
        this.isInFirstPerson = false;  // false = 第三人稱, true = 第一人稱
        
        // 跟隨目標（坦克）
        this.followTarget = null;
        
        // 兩個視角偏移量（相對於坦克中心）
        this.thirdPersonOffset = [0, 20, -35];     // 第三人稱位置（後方俯視）
        this.firstPersonOffset = [0, 5.5, 12];    // 第一人稱位置（砲管末端）
        
        // 矩陣
        this.viewMatrix = MatrixLib.identity();
        this.projectionMatrix = MatrixLib.identity();
        
        this.updateProjectionMatrix();
    }
    
    // 設定跟隨目標
    setFollowTarget(target) {
        this.followTarget = target;
    }
    
    // 更新投影矩陣
    updateProjectionMatrix() {
        this.projectionMatrix = MatrixLib.perspective(
            this.fov, 
            this.aspect, 
            this.near, 
            this.far
        );
    }
    
    // 設定視窗比例
    setAspectRatio(aspect) {
        this.aspect = aspect;
        this.updateProjectionMatrix();
    }
    
    // 切換視角模式 - 第三人稱 ↔ 第一人稱
    toggleViewMode() {
        console.log('=== CAMERA toggleViewMode CALLED ===');
        console.log('Current isInFirstPerson:', this.isInFirstPerson);
        
        this.isInFirstPerson = !this.isInFirstPerson;
        
        console.log('New isInFirstPerson:', this.isInFirstPerson);
        
        // 立即重新載入相機位置
        this.reloadCameraPosition();
        
        const mode = this.isInFirstPerson ? 'first' : 'third';
        console.log(`Camera toggled to: ${mode} person mode`);
        return mode;
    }
    
    // 重新載入相機位置
    reloadCameraPosition() {
        console.log('=== CAMERA reloadCameraPosition CALLED ===');
        
        if (!this.followTarget) {
            console.log('No follow target, aborting reload');
            return;
        }
        
        const tankPosition = this.followTarget.getPosition();
        const tankRotation = this.followTarget.getRotationY();
        
        console.log('Tank position:', tankPosition);
        console.log('Tank rotation:', tankRotation);
        
        if (this.isInFirstPerson) {
            // 第一人稱：從砲管末端看出去
            this.setupFirstPersonView(tankPosition, tankRotation);
        } else {
            // 第三人稱：後方俯視
            this.setupThirdPersonView(tankPosition, tankRotation);
        }
        
        console.log('Camera reloaded successfully');
    }
    
    // 設定第一人稱視角（從砲管末端看出去）
    setupFirstPersonView(tankPosition, tankRotation) {
        console.log('Setting up first person view from barrel end');
        
        // 砲管末端位置（相對於坦克中心）
        const barrelEndOffset = this.firstPersonOffset;
        
        // 轉換到世界座標
        const worldOffset = this.transformLocalToWorld(barrelEndOffset, tankRotation);
        
        // 相機位置：砲管末端
        this.position = [
            tankPosition[0] + worldOffset[0],
            tankPosition[1] + worldOffset[1],
            tankPosition[2] + worldOffset[2]
        ];
        
        // 目標：砲管射擊方向的遠點
        const forwardDir = this.transformLocalToWorld([0, 0, 100], tankRotation);
        this.target = [
            this.position[0] + forwardDir[0],
            this.position[1] + forwardDir[1],
            this.position[2] + forwardDir[2]
        ];
        
        console.log('First person camera position:', this.position);
        console.log('First person camera target:', this.target);
        
        // 更新視圖矩陣
        this.viewMatrix = MatrixLib.lookAt(this.position, this.target, this.up);
    }
    
    // 設定第三人稱視角（後方俯視）
    setupThirdPersonView(tankPosition, tankRotation) {
        console.log('Setting up third person view');
        
        // 第三人稱偏移量
        const offset = this.thirdPersonOffset;
        
        // 轉換到世界座標
        const worldOffset = this.transformLocalToWorld(offset, tankRotation);
        
        // 相機位置：坦克後方
        this.position = [
            tankPosition[0] + worldOffset[0],
            tankPosition[1] + worldOffset[1],
            tankPosition[2] + worldOffset[2]
        ];
        
        // 目標：坦克中心
        this.target = [
            tankPosition[0],
            tankPosition[1] + 4,
            tankPosition[2]
        ];
        
        console.log('Third person camera position:', this.position);
        console.log('Third person camera target:', this.target);
        
        // 更新視圖矩陣
        this.viewMatrix = MatrixLib.lookAt(this.position, this.target, this.up);
    }
    
    // 更新攝影機
    update() {
        if (!this.followTarget) return;
        
        const tankPosition = this.followTarget.getPosition();
        const tankRotation = this.followTarget.getRotationY();
        
        if (this.isInFirstPerson) {
            // 第一人稱：從砲管末端看出去
            this.setupFirstPersonView(tankPosition, tankRotation);
        } else {
            // 第三人稱：後方俯視
            this.setupThirdPersonView(tankPosition, tankRotation);
        }
    }
    
    // 將local space坐標轉換為world space坐標
    transformLocalToWorld(localOffset, tankRotation) {
        // 使用正確的旋轉矩陣
        const cos = Math.cos(tankRotation);
        const sin = Math.sin(tankRotation);
        
        // 繞Y軸旋轉變換
        return [
            localOffset[0] * cos + localOffset[2] * sin,  // X
            localOffset[1],                               // Y (不旋轉)
            -localOffset[0] * sin + localOffset[2] * cos  // Z
        ];
    }
    
    // 獲取視圖矩陣
    getViewMatrix() {
        return this.viewMatrix;
    }
    
    // 獲取投影矩陣
    getProjectionMatrix() {
        return this.projectionMatrix;
    }
    
    // 獲取攝影機位置
    getPosition() {
        return [...this.position];
    }
    
    // 獲取攝影機目標
    getTarget() {
        return [...this.target];
    }
    
    // 獲取當前視角模式
    getViewMode() {
        return this.isInFirstPerson ? 'first' : 'third';
    }
    
    // 設定視角模式
    setViewMode(mode) {
        if (mode === 'first') {
            this.isInFirstPerson = true;
        } else if (mode === 'third') {
            this.isInFirstPerson = false;
        }
        this.reloadCameraPosition();
    }
    
    // 重置攝影機
    reset() {
        this.isInFirstPerson = false;  // 重置為第三人稱模式
        this.position = [0, 10, 20];
        this.target = [0, 0, 0];
    }
    
    // 設定第一人稱偏移
    setFirstPersonOffset(x, y, z) {
        this.firstPersonOffset = [x, y, z];
    }
    
    // 設定第三人稱偏移
    setThirdPersonOffset(x, y, z) {
        this.thirdPersonOffset = [x, y, z];
    }
    
    // 獲取攝影機方向向量
    getForwardVector() {
        const direction = MatrixLib.subtract(this.target, this.position);
        return MatrixLib.normalize(direction);
    }
    
    // 獲取攝影機右向量
    getRightVector() {
        const forward = this.getForwardVector();
        return MatrixLib.normalize(MatrixLib.cross(forward, this.up));
    }
    
    // 獲取攝影機上向量
    getUpVector() {
        const forward = this.getForwardVector();
        const right = this.getRightVector();
        return MatrixLib.normalize(MatrixLib.cross(right, forward));
    }
    
    // 世界座標轉螢幕座標
    worldToScreen(worldPos, canvasWidth, canvasHeight) {
        const viewProjection = MatrixLib.multiply(this.projectionMatrix, this.viewMatrix);
        const clipPos = MatrixLib.transformPoint(viewProjection, worldPos);
        
        // NDC 轉螢幕座標
        const screenX = (clipPos[0] * 0.5 + 0.5) * canvasWidth;
        const screenY = (1.0 - (clipPos[1] * 0.5 + 0.5)) * canvasHeight;
        
        return [screenX, screenY, clipPos[2]];
    }
    
    // 螢幕座標轉世界射線
    screenToWorldRay(screenX, screenY, canvasWidth, canvasHeight) {
        // 螢幕座標轉 NDC
        const x = (2.0 * screenX) / canvasWidth - 1.0;
        const y = 1.0 - (2.0 * screenY) / canvasHeight;
        
        // NDC 轉視圖空間
        const viewProjectionInv = MatrixLib.inverse(
            MatrixLib.multiply(this.projectionMatrix, this.viewMatrix)
        );
        
        const nearPoint = MatrixLib.transformPoint(viewProjectionInv, [x, y, -1]);
        const farPoint = MatrixLib.transformPoint(viewProjectionInv, [x, y, 1]);
        
        const direction = MatrixLib.normalize(MatrixLib.subtract(farPoint, nearPoint));
        
        return {
            origin: nearPoint,
            direction: direction
        };
    }
    
    // 檢查點是否在視錐內
    isPointInFrustum(point) {
        const viewProjection = MatrixLib.multiply(this.projectionMatrix, this.viewMatrix);
        const clipPos = MatrixLib.transformPoint(viewProjection, point);
        
        return clipPos[0] >= -1 && clipPos[0] <= 1 &&
               clipPos[1] >= -1 && clipPos[1] <= 1 &&
               clipPos[2] >= -1 && clipPos[2] <= 1;
    }
    
    // 平滑攝影機移動（未來可用於轉換動畫）
    smoothTransition(targetPos, targetTarget, duration = 1.0) {
        // 這裡可以實現平滑過渡動畫
        // 目前直接設定位置
        this.position = [...targetPos];
        this.target = [...targetTarget];
    }
}