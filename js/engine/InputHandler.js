/**
 * 輸入處理器
 * 管理鍵盤和滑鼠輸入事件
 */
class InputHandler {
    constructor() {
        this.keys = new Set();
        this.keyJustPressed = new Set();
        this.keyJustReleased = new Set();
        
        this.mouse = {
            x: 0,
            y: 0,
            deltaX: 0,
            deltaY: 0,
            leftButton: false,
            rightButton: false,
            wheelDelta: 0
        };
        
        this.canvas = null;
        this.enabled = true;
        
        // 除錯標記
        this.debugMode = true;
        this.frameCount = 0;
        
        console.log('InputHandler constructor called');
        this.setupEventListeners();
    }
    
    // 設定事件監聽器
    setupEventListeners() {
        // 鍵盤事件
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        document.addEventListener('keyup', (e) => this.onKeyUp(e));
        
        // 滑鼠事件
        document.addEventListener('mousemove', (e) => this.onMouseMove(e));
        document.addEventListener('mousedown', (e) => this.onMouseDown(e));
        document.addEventListener('mouseup', (e) => this.onMouseUp(e));
        document.addEventListener('wheel', (e) => this.onMouseWheel(e));
        
        // 防止右鍵選單
        document.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // 防止某些按鍵的預設行為
        document.addEventListener('keydown', (e) => {
            if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
                e.preventDefault();
            }
        });
    }
    
    // 鍵盤按下事件
    onKeyDown(event) {
        if (!this.enabled) {
            if (this.debugMode) console.log('InputHandler disabled, ignoring keydown');
            return;
        }
        
        const key = event.key;
        
        // 特別檢查P鍵
        if (key === 'p' || key === 'P') {
            console.log('=== P KEY DETECTED IN onKeyDown ===');
            console.log('Key:', key, 'Enabled:', this.enabled);
            console.log('Keys set size before:', this.keys.size);
            console.log('JustPressed set size before:', this.keyJustPressed.size);
        }
        
        // 只檢測首次按下
        if (!this.keys.has(key)) {
            this.keyJustPressed.add(key);
            
            if (key === 'p' || key === 'P') {
                console.log('P key added to keyJustPressed set');
                console.log('keyJustPressed contents:', Array.from(this.keyJustPressed));
            }
        } else if (key === 'p' || key === 'P') {
            console.log('P key already in keys set, not adding to justPressed');
        }
        
        this.keys.add(key);
        
        if (key === 'p' || key === 'P') {
            console.log('Keys set size after:', this.keys.size);
            console.log('JustPressed set size after:', this.keyJustPressed.size);
        }
    }
    
    // 鍵盤釋放事件
    onKeyUp(event) {
        if (!this.enabled) return;
        
        const key = event.key;
        this.keys.delete(key);
        this.keyJustReleased.add(key);
    }
    
    // 滑鼠移動事件
    onMouseMove(event) {
        if (!this.enabled) return;
        
        const rect = this.canvas ? this.canvas.getBoundingClientRect() : { left: 0, top: 0 };
        
        const newX = event.clientX - rect.left;
        const newY = event.clientY - rect.top;
        
        this.mouse.deltaX = newX - this.mouse.x;
        this.mouse.deltaY = newY - this.mouse.y;
        this.mouse.x = newX;
        this.mouse.y = newY;
    }
    
    // 滑鼠按下事件
    onMouseDown(event) {
        if (!this.enabled) return;
        
        switch (event.button) {
            case 0: // 左鍵
                this.mouse.leftButton = true;
                break;
            case 2: // 右鍵
                this.mouse.rightButton = true;
                break;
        }
    }
    
    // 滑鼠釋放事件
    onMouseUp(event) {
        if (!this.enabled) return;
        
        switch (event.button) {
            case 0: // 左鍵
                this.mouse.leftButton = false;
                break;
            case 2: // 右鍵
                this.mouse.rightButton = false;
                break;
        }
    }
    
    // 滑鼠滾輪事件
    onMouseWheel(event) {
        if (!this.enabled) return;
        
        this.mouse.wheelDelta = event.deltaY;
    }
    
    // 設定 canvas 元素（用於滑鼠座標計算）
    setCanvas(canvas) {
        this.canvas = canvas;
    }
    
    // 檢查按鍵是否按住
    isKeyPressed(key) {
        return this.keys.has(key);
    }
    
    // 檢查按鍵是否剛按下
    isKeyJustPressed(key) {
        return this.keyJustPressed.has(key);
    }
    
    // 檢查按鍵是否剛釋放
    isKeyJustReleased(key) {
        return this.keyJustReleased.has(key);
    }
    
    // 獲取滑鼠位置
    getMousePosition() {
        return { x: this.mouse.x, y: this.mouse.y };
    }
    
    // 獲取滑鼠移動量
    getMouseDelta() {
        return { x: this.mouse.deltaX, y: this.mouse.deltaY };
    }
    
    // 檢查滑鼠按鍵狀態
    isMouseButtonPressed(button) {
        switch (button) {
            case 'left':
                return this.mouse.leftButton;
            case 'right':
                return this.mouse.rightButton;
            default:
                return false;
        }
    }
    
    // 獲取滾輪移動量
    getWheelDelta() {
        return this.mouse.wheelDelta;
    }
    
    // 更新輸入狀態（每幀調用）
    update() {
        // 記錄清除前的狀態
        if (this.debugMode && this.keyJustPressed.size > 0) {
            console.log('Before update clear - keyJustPressed:', Array.from(this.keyJustPressed));
        }
        
        // 清除單次事件
        this.keyJustPressed.clear();
        this.keyJustReleased.clear();
        
        // 重置滑鼠增量
        this.mouse.deltaX = 0;
        this.mouse.deltaY = 0;
        this.mouse.wheelDelta = 0;
        
        if (this.debugMode && this.frameCount % 60 === 0) {
            console.log(`Frame ${this.frameCount} - Input update completed`);
        }
    }
    
    // 啟用/禁用輸入
    setEnabled(enabled) {
        this.enabled = enabled;
        
        if (!enabled) {
            // 清除所有輸入狀態
            this.keys.clear();
            this.keyJustPressed.clear();
            this.keyJustReleased.clear();
            this.mouse.leftButton = false;
            this.mouse.rightButton = false;
        }
    }
    
    // 重置所有輸入狀態
    reset() {
        this.keys.clear();
        this.keyJustPressed.clear();
        this.keyJustReleased.clear();
        this.mouse.leftButton = false;
        this.mouse.rightButton = false;
        this.mouse.deltaX = 0;
        this.mouse.deltaY = 0;
        this.mouse.wheelDelta = 0;
    }
    
    // 檢查移動按鍵組合（移除W/S）
    getMovementInput() {
        return {
            // forward: this.isKeyPressed('w') || this.isKeyPressed('W'),  // 移除
            // backward: this.isKeyPressed('s') || this.isKeyPressed('S'), // 移除
            left: this.isKeyPressed('a') || this.isKeyPressed('A'),
            right: this.isKeyPressed('d') || this.isKeyPressed('D'),
            elevateUp: this.isKeyPressed('ArrowUp'),
            elevateDown: this.isKeyPressed('ArrowDown')
        };
    }
    
    // 檢查操作按鍵
    getActionInput() {
        this.frameCount++;
        
        // 檢查P鍵狀態 - 詳細除錯
        const pKeyPressed = this.keyJustPressed.has('p') || this.keyJustPressed.has('P');
        
        console.log(`=== getActionInput Frame ${this.frameCount} ===`);
        console.log('keyJustPressed size:', this.keyJustPressed.size);
        console.log('keyJustPressed contents:', Array.from(this.keyJustPressed));
        console.log('P key check results:');
        console.log('- has("p"):', this.keyJustPressed.has('p'));
        console.log('- has("P"):', this.keyJustPressed.has('P'));
        console.log('- pKeyPressed result:', pKeyPressed);
        
        if (pKeyPressed) {
            console.log('=== P KEY DETECTED IN getActionInput ===');
            console.log('Frame:', this.frameCount);
        }
        
        const toggleView = pKeyPressed;
        const fire = this.keyJustPressed.has(' ');
        const reset = this.keyJustPressed.has('r') || this.keyJustPressed.has('R');
        
        const result = {
            fire: fire,
            toggleView: toggleView,
            reset: reset
        };
        
        console.log('Final action input result:', result);
        
        return result;
    }
    
    // 獲取所有按下的按鍵（除錯用）
    getActiveKeys() {
        return Array.from(this.keys);
    }
    
    // 檢查特定按鍵組合
    isKeyComboPressed(keys) {
        return keys.every(key => this.isKeyPressed(key));
    }
    
    // 檢查是否有任何按鍵按下
    isAnyKeyPressed() {
        return this.keys.size > 0;
    }
    
    // 獲取輸入摘要（除錯用）
    getInputSummary() {
        return {
            activeKeys: this.getActiveKeys(),
            mousePosition: this.getMousePosition(),
            mouseDelta: this.getMouseDelta(),
            mouseButtons: {
                left: this.mouse.leftButton,
                right: this.mouse.rightButton
            },
            wheelDelta: this.mouse.wheelDelta
        };
    }
    
    // 設定除錯模式
    setDebugMode(enabled) {
        this.debugMode = enabled;
        console.log('InputHandler debug mode:', enabled);
    }
    
    // 強制觸發P鍵（測試用）
    triggerPKey() {
        console.log('=== MANUAL P KEY TRIGGER ===');
        this.keyJustPressed.add('p');
        console.log('keyJustPressed after manual trigger:', Array.from(this.keyJustPressed));
    }
}