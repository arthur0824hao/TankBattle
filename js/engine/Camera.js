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
        
        // 視角模式
        this.viewMode = 'third';
        
        // 相機位置：前(0)、右側(1)、後(2)、左側(3)
        this.cameraPositions = ['front', 'right', 'back', 'left'];
        this.currentCameraIndex = 2; // 初始在後方
        this.cameraDistance = 80;
        this.cameraHeight = 30;
        
        // 跟隨目標（坦克核心）
        this.followTarget = null;
        
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
    
    // 切換視角模式
    toggleViewMode() {
        this.viewMode = this.viewMode === 'first' ? 'third' : 'first';
        console.log(`Camera switched to ${this.viewMode} person view`);
        
        // 立即更新攝影機位置
        this.update();
        return this.viewMode;
    }
    
    // 設定視角模式
    setViewMode(mode) {
        if (mode === 'first' || mode === 'third') {
            this.viewMode = mode;
        }
    }
    
    // Q鍵 - 向左切換相機位（後→左→前→右→後）
    rotateThirdPersonLeft() {
        this.currentCameraIndex = (this.currentCameraIndex + 1) % 4; // 向左
        console.log(`Camera position: ${this.cameraPositions[this.currentCameraIndex]}`);
    }
    
    // E鍵 - 向右切換相機位（後→右→前→左→後）
    rotateThirdPersonRight() {
        this.currentCameraIndex = (this.currentCameraIndex + 3) % 4; // 向右
        console.log(`Camera position: ${this.cameraPositions[this.currentCameraIndex]}`);
    }
    
    // 更新第三人稱攝影機（相對於坦克方向）
    updateThirdPerson() {
        if (!this.followTarget) return;
        
        const coreWorldPos = this.followTarget.getPosition();
        const tankRotation = this.followTarget.getRotationY();
        
        // 四個相對方向的偏移量（相對於坦克朝向）
        const relativeOffsets = [
            [0, 0, this.cameraDistance],   // 前 - 相機在坦克前方，回頭看坦克
            [this.cameraDistance, 0, 0],  // 右側 - 相機在坦克右側，看向坦克
            [0, 0, -this.cameraDistance], // 後 - 相機在坦克後方，看向坦克
            [-this.cameraDistance, 0, 0]  // 左側 - 相機在坦克左側，看向坦克
        ];
        
        const relativeOffset = relativeOffsets[this.currentCameraIndex];
        
        // 將相對偏移量轉換為世界坐標偏移量
        const worldOffset = [
            relativeOffset[0] * Math.cos(tankRotation) - relativeOffset[2] * Math.sin(tankRotation),
            relativeOffset[1],
            relativeOffset[0] * Math.sin(tankRotation) + relativeOffset[2] * Math.cos(tankRotation)
        ];
        
        // 相機世界座標位置
        this.position = [
            coreWorldPos[0] + worldOffset[0],
            coreWorldPos[1] + this.cameraHeight,
            coreWorldPos[2] + worldOffset[2]
        ];
        
        // 始終看向坦克核心
        this.target = [
            coreWorldPos[0],
            coreWorldPos[1],
            coreWorldPos[2]
        ];
    }
    
    // 更新第一人稱攝影機
    updateFirstPerson() {
        if (!this.followTarget) return;
        
        const tankWorldPos = this.followTarget.getPosition();
        const tankRotation = this.followTarget.getRotationY();
        
        // 攝影機在坦克內部的世界坐標位置
        const cameraHeight = 8;
        const cameraOffset = 2;
        
        this.position = [
            tankWorldPos[0] + Math.sin(tankRotation) * cameraOffset,
            tankWorldPos[1] + cameraHeight,
            tankWorldPos[2] + Math.cos(tankRotation) * cameraOffset
        ];
        
        // 攝影機目標點的世界坐標
        const lookDistance = 30;
        this.target = [
            tankWorldPos[0] + Math.sin(tankRotation) * lookDistance,
            tankWorldPos[1] + cameraHeight,
            tankWorldPos[2] + Math.cos(tankRotation) * lookDistance
        ];
    }
    
    // 更新攝影機
    update() {
        if (!this.followTarget) return;
        
        switch (this.viewMode) {
            case 'first':
                this.updateFirstPerson();
                break;
            case 'third':
                this.updateThirdPerson();
                break;
        }
        
        // 更新視圖矩陣
        this.viewMatrix = MatrixLib.lookAt(this.position, this.target, this.up);
    }
    
    // 手動設定攝影機位置（除錯用）
    setPosition(x, y, z) {
        this.position = [x, y, z];
    }
    
    // 手動設定攝影機目標（除錯用）
    setTarget(x, y, z) {
        this.target = [x, y, z];
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
    
    // 獲取當前視角模式
    getViewMode() {
        return this.viewMode;
    }
    
    // 重置攝影機
    reset() {
        this.position = [0, 10, 20];
        this.target = [0, 0, 0];
        this.viewMode = 'third';
        this.currentCameraIndex = 2; // 重置為後方
        this.update();
    }
    
    // 設定第三人稱參數
    setThirdPersonParams(distance, height) {
        this.thirdPersonDistance = distance;
        this.thirdPersonHeight = height;
    }
    
    // 平滑攝影機移動（未來可用於轉換動畫）
    smoothTransition(targetPos, targetTarget, duration = 1.0) {
        // 這裡可以實現平滑過渡動畫
        // 目前直接設定位置
        this.position = [...targetPos];
        this.target = [...targetTarget];
    }
}