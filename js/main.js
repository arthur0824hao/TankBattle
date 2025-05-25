/**
 * 主程式入口
 * 初始化並運行坦克大戰遊戲
 */
class TankBattleGame {
    constructor() {
        // 核心系統
        this.webglCore = null;
        this.shaderManager = null;
        this.camera = null;
        this.inputHandler = null;
        this.gameManager = null;
        
        // 遊戲物件
        this.tank = null;
        this.bulletManager = null;
        this.targetManager = null;
        this.scene = null;
        
        // 渲染系統
        this.lighting = null;
        this.textureManager = null;
        this.frameBuffer = null;
        this.shadowRenderer = null;
        this.ui = null;
        
        // 時間管理
        this.lastTime = 0;
        this.deltaTime = 0;
        this.isRunning = false;
        
        this.init();
    }
    
    // 初始化遊戲
    async init() {
        try {
            console.log('Initializing Tank Battle Game...');
            
            // 初始化核心系統
            this.initWebGL();
            this.initShaders();
            this.initCamera();
            this.initInput();
            this.initGameManager();
            this.initLighting();
            
            // 初始化遊戲物件
            this.initGameObjects();
            
            // 設定事件監聽
            this.setupEventListeners();
            
            console.log('Game initialized successfully');
            
            // 開始遊戲循環
            this.start();
            
        } catch (error) {
            console.error('Failed to initialize game:', error);
            this.showError('遊戲初始化失敗：' + error.message);
        }
    }
    
    // 初始化 WebGL
    initWebGL() {
        this.webglCore = new WebGLCore('gameCanvas');
        
        // 設定 canvas 大小
        const canvas = this.webglCore.getCanvas();
        const rect = canvas.getBoundingClientRect();
        this.webglCore.resizeCanvas(rect.width, rect.height);
    }
    
    // 初始化著色器
    initShaders() {
        this.shaderManager = new ShaderManager(this.webglCore);
        
        if (!this.shaderManager.initAllShaders()) {
            throw new Error('Failed to initialize shaders');
        }
    }
    
    // 初始化攝影機
    initCamera() {
        this.camera = new Camera();
        
        const canvas = this.webglCore.getCanvas();
        this.camera.setAspectRatio(canvas.width / canvas.height);
    }
    
    // 初始化輸入處理
    initInput() {
        this.inputHandler = new InputHandler();
        this.inputHandler.setCanvas(this.webglCore.getCanvas());
    }
    
    // 初始化遊戲管理器
    initGameManager() {
        this.gameManager = new GameManager();
        
        // 設定回調
        this.gameManager.setCallbacks({
            onScoreUpdate: (score) => {
                console.log('Score updated:', score);
            },
            onGameStateChange: (state) => {
                console.log('Game state changed:', state);
            },
            onTargetHit: (hitData) => {
                console.log('Target hit:', hitData);
            }
        });
    }
    
    // 初始化光照
    initLighting() {
        this.lighting = new Lighting();
        console.log('Lighting system initialized');
    }
    
    // 初始化渲染系統
    initRenderingSystems() {
        // 初始化紋理管理器
        this.textureManager = new TextureManager(this.webglCore);
        
        // 初始化幀緩衝管理器
        this.frameBuffer = new FrameBuffer(this.webglCore, this.textureManager);
        
        // 初始化陰影渲染器
        this.shadowRenderer = new ShadowRenderer(
            this.webglCore, 
            this.shaderManager, 
            this.frameBuffer, 
            this.lighting
        );
        
        // 初始化UI管理器
        this.ui = new UI(this.gameManager);
        
        // 設定初始視角指示器
        if (this.ui) {
            this.ui.updateViewIndicator(this.camera.getViewMode());
        }
        
        // 添加陰影投射物件
        this.shadowRenderer.addShadowCaster(this.tank);
        this.targetManager.getTargets().forEach(target => {
            this.shadowRenderer.addShadowCaster(target);
        });
        
        console.log('Rendering systems initialized');
    }
    
    // 初始化遊戲物件
    initGameObjects() {
        // 創建場景
        this.scene = new Scene(this.webglCore, this.shaderManager);
        
        // 創建坦克
        this.tank = new Tank(this.webglCore, this.shaderManager);
        
        // 設定攝影機跟隨坦克
        this.camera.setFollowTarget(this.tank);
        
        // 創建砲彈管理器
        this.bulletManager = new BulletManager(this.webglCore, this.shaderManager);
        
        // 創建目標管理器
        this.targetManager = new TargetManager(this.webglCore, this.shaderManager);
        
        // 初始化渲染系統
        this.initRenderingSystems();
        
        console.log('Game objects created');
    }
    
    // 設定事件監聽
    setupEventListeners() {
        // 視窗大小改變
        window.addEventListener('resize', () => {
            this.handleResize();
        });
        
        // 頁面可見性改變
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pause();
            } else {
                this.resume();
            }
        });
    }
    
    // 處理輸入
    handleInput() {
        const movement = this.inputHandler.getMovementInput();
        const actions = this.inputHandler.getActionInput();
        
        // 除錯：檢查所有操作輸入
        if (Object.values(actions).some(action => action)) {
            console.log('Actions detected:', actions);
        }
        
        // 坦克移動
        const tankMoved = this.tank.update(this.deltaTime, this.inputHandler);
        
        // 射擊
        if (actions.fire) {
            console.log('Fire button pressed!');
            const firePos = this.tank.getFirePosition();
            const fireDir = this.tank.getFireDirection();
            this.bulletManager.fire(firePos, fireDir);
            this.gameManager.onBulletFired();
        }
        
        // 視角切換
        if (actions.toggleView) {
            console.log('Toggle view pressed!');
            const newMode = this.camera.toggleViewMode();
            console.log('New view mode:', newMode);
            
            // 更新UI指示器
            if (this.ui) {
                this.ui.updateViewIndicator(newMode);
            }
        }
        
        // 第三人稱視角旋轉
        if (actions.rotateViewLeft) {
            console.log('Rotate view left! (Q key pressed)');
            if (this.camera.viewMode === 'third') {
                this.camera.rotateThirdPersonLeft();
            }
        }
        if (actions.rotateViewRight) {
            console.log('Rotate view right! (E key pressed)');
            if (this.camera.viewMode === 'third') {
                this.camera.rotateThirdPersonRight();
            }
        }
        
        // 重置遊戲
        if (actions.reset) {
            console.log('Reset pressed!');
            this.resetGame();
        }
    }
    
    // 更新遊戲邏輯
    update() {
        // 更新輸入處理
        this.inputHandler.update();
        
        // 處理輸入
        this.handleInput();
        
        // 更新光照系統
        this.lighting.update(this.deltaTime);
        
        // 更新攝影機
        this.camera.update();
        
        // 更新砲彈
        this.bulletManager.update(this.deltaTime);
        
        // 更新目標
        this.targetManager.update(this.deltaTime);
        
        // 檢查碰撞
        this.checkCollisions();
        
        // 更新遊戲管理器
        this.gameManager.update(this.deltaTime);
        
        // 更新UI
        if (this.ui) {
            this.ui.updateScore(this.gameManager.getScore());
        }
    }
    
    // 檢查碰撞
    checkCollisions() {
        // 砲彈與目標的碰撞
        const hits = this.targetManager.checkCollisions(this.bulletManager.getBullets());
        
        hits.forEach(hit => {
            this.gameManager.onTargetHit(hit);
        });
    }
    
    // 渲染場景
    render() {
        // 清除畫面
        this.webglCore.clear();
        
        // 獲取光照資訊
        const lightData = {
            position: this.lighting.getMainLight().position,
            color: this.lighting.getMainLight().color
        };
        
        // 渲染場景環境
        if (this.scene) {
            this.scene.render(this.camera, lightData);
        }
        
        // 渲染坦克
        this.tank.render(this.camera, lightData);
        
        // 渲染砲彈
        this.bulletManager.render(this.camera, lightData);
        
        // 渲染目標
        this.targetManager.render(this.camera, lightData);
        
        // 檢查 WebGL 錯誤（只在開發模式）
        if (window.DEBUG) {
            this.webglCore.checkError('render');
        }
    }
    
    // 遊戲循環
    gameLoop(currentTime) {
        if (!this.isRunning) return;
        
        // 計算 delta time
        this.deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        // 限制 delta time 防止大幅跳躍
        this.deltaTime = Math.min(this.deltaTime, 1/30);
        
        // 更新和渲染
        this.update();
        this.render();
        
        // 繼續循環
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    // 開始遊戲
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.lastTime = performance.now();
        
        console.log('Game started');
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    // 暫停遊戲
    pause() {
        this.isRunning = false;
        this.gameManager.gameState = 'paused';
        console.log('Game paused');
    }
    
    // 恢復遊戲
    resume() {
        if (this.gameManager.gameState === 'paused') {
            this.isRunning = true;
            this.lastTime = performance.now();
            this.gameManager.gameState = 'playing';
            console.log('Game resumed');
            requestAnimationFrame((time) => this.gameLoop(time));
        }
    }
    
    // 重置遊戲
    resetGame() {
        console.log('Resetting game...');
        
        // 重置遊戲管理器
        this.gameManager.resetGame();
        
        // 重置坦克
        this.tank.reset();
        
        // 清除所有砲彈
        this.bulletManager.clear();
        
        // 重置目標
        this.targetManager.reset();
        
        // 重置攝影機
        this.camera.reset();
        this.camera.setFollowTarget(this.tank);
        
        // 重置光照
        if (this.lighting) {
            this.lighting.reset();
        }
        
        // 重新設定陰影投射物件
        if (this.shadowRenderer) {
            this.shadowRenderer.shadowCasters.length = 0;
            this.shadowRenderer.addShadowCaster(this.tank);
            this.targetManager.getTargets().forEach(target => {
                this.shadowRenderer.addShadowCaster(target);
            });
        }
        
        console.log('Game reset complete');
    }
    
    // 處理視窗大小改變
    handleResize() {
        const canvas = this.webglCore.getCanvas();
        const rect = canvas.getBoundingClientRect();
        
        this.webglCore.resizeCanvas(rect.width, rect.height);
        this.camera.setAspectRatio(rect.width / rect.height);
        
        console.log(`Canvas resized to ${rect.width}x${rect.height}`);
    }
    
    // 顯示錯誤訊息
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(231, 76, 60, 0.9);
            color: white;
            padding: 20px;
            border-radius: 10px;
            font-size: 16px;
            z-index: 1000;
            max-width: 400px;
            text-align: center;
        `;
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
        
        // 5秒後自動移除
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }
    
    // 獲取遊戲狀態（除錯用）
    getGameState() {
        return {
            isRunning: this.isRunning,
            gameManager: this.gameManager.getGameSummary(),
            camera: {
                viewMode: this.camera.getViewMode(),
                position: this.camera.getPosition()
            },
            bullets: this.bulletManager.getActiveBulletCount(),
            targets: this.targetManager.getActiveTargetCount()
        };
    }
}

// 全域變數
let game = null;

// 頁面載入完成後初始化遊戲
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, running system checks...');
    
    // 執行系統相容性檢查
    const systemCheck = new SystemCheck();
    const report = systemCheck.checkAll();
    
    // 顯示檢查結果
    systemCheck.displayReport(report);
    
    // 如果系統相容，初始化遊戲
    if (report.compatible) {
        console.log('System compatible, initializing game...');
        
        // 創建並啟動遊戲
        game = new TankBattleGame();
        
        // 設定全域除錯函數
        window.getGameState = () => game.getGameState();
        window.resetGame = () => game.resetGame();
        window.getSystemReport = () => report;
        
        console.log('Tank Battle Game ready!');
    } else {
        console.error('System not compatible, game initialization aborted');
    }
});