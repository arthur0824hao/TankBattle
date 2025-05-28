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
            await this.initShaders(); // 添加 await
            this.initCamera();
            this.initInput();
            this.initGameManager();
            this.initLighting();
            
            // 初始化遊戲物件
            await this.initGameObjects();
            
            // 設定事件監聽
            this.setupEventListeners();
            
            console.log('Game initialized successfully');
            
            // 測試輸入系統
            this.testInputSystem();
            
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
    
    // 初始化著色器（修改為非同步）
    async initShaders() {
        this.shaderManager = new ShaderManager(this.webglCore);
        
        // 等待著色器載入完成
        const result = await this.shaderManager.initAllShaders();
        console.log('Shader initialization result:', result);
        
        // 檢查是否至少有 phong 著色器
        if (!this.shaderManager.hasProgram('phong')) {
            throw new Error('Critical shader (phong) failed to load');
        }
        
        console.log('Basic shaders loaded successfully');
        return true;
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
        
        // 確保遊戲立即開始
        this.gameManager.startGame();
        console.log('GameManager initialized and started');
        
        // 設定回調
        this.gameManager.setCallbacks({
            onGameStateChange: (state) => {
                console.log('Game state changed:', state);
            },
            onTargetHit: (hitData) => {
                console.log('Target hit:', hitData)                
                if (this.ui) {
                    this.ui.showTargetHitMessage(hitData.targetType);
                }
            }
        });
        
        this.initLighting();
    }
    
    // 初始化光照
    initLighting() {
        this.lighting = new Lighting();
        console.log('Lighting system initialized');
    }
    
    // 初始化遊戲物件
    async initGameObjects() {
        // 初始化渲染系統
        await this.initRenderingSystems();
        
        // 創建場景（傳入textureManager）
        this.scene = new Scene(this.webglCore, this.shaderManager, this.textureManager);
        
        // 創建坦克
        this.tank = new Tank(this.webglCore, this.shaderManager);
        
        // 設定攝影機跟隨坦克
        this.camera.setFollowTarget(this.tank);
        
        // 創建砲彈管理器
        this.bulletManager = new BulletManager(this.webglCore, this.shaderManager);
        
        // 創建目標管理器（支援隨機距離生成）
        this.targetManager = new TargetManager(this.webglCore, this.shaderManager);
        
        // 創建碰撞管理器
        this.collisionManager = new CollisionManager();
        
        // 設定砲彈管理器的即時碰撞檢測
        this.bulletManager.setTargetManager(this.targetManager);
        this.bulletManager.setOnHitCallback((hitData) => {
            // 即時命中處理
            this.handleImmediateHit(hitData);
        });
        
        // 創建鏡面球（固定在場景中央）
        this.mirrorBall = new MirrorBall(this.webglCore, this.shaderManager);
        
        console.log('Game objects created with immediate hit detection');
    }
    
    // 即時命中處理
    handleImmediateHit(hitData) {
        console.log(`🎯 IMMEDIATE HIT PROCESSED: ${hitData.targetType} (${hitData.targetId})`);
        
        // 立即更新UI
        if (this.ui) {
            this.ui.showTargetHitMessage(hitData.targetType);
        }
        
        // 立即更新遊戲管理器
        if (this.gameManager && this.gameManager.onTargetHit) {
            this.gameManager.onTargetHit(hitData);
        }
        
        // 即時音效或視覺效果（如果有的話）
        this.playHitEffect(hitData);
    }
    
    // 播放命中效果
    playHitEffect(hitData) {
        // 這裡可以添加粒子效果、音效等
        console.log(`✨ Hit effect for ${hitData.targetType}`);
        
        // 例如：閃爍效果、粒子爆炸等
        // (暫時只有console log)
    }
    
    // 初始化渲染系統
    async initRenderingSystems() {
        // 初始化紋理管理器
        this.textureManager = new TextureManager(this.webglCore);
        
        // 載入遊戲紋理
        await this.loadGameTextures();
        
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
        
        console.log('Rendering systems initialized');
    }
    
    // 載入遊戲紋理
    async loadGameTextures() {
        console.log('=== LOADING TEXTURES ===');
        
        // 定義要載入的紋理（新增法線貼圖）
        const texturesToLoad = [
            // 坦克紋理
            { name: 'tankBase', url: 'assets/textures/tank_base.jpg', type: 'texture' },
            { name: 'tankTurret', url: 'assets/textures/tank_turret.jpg', type: 'texture' },
            { name: 'tankBarrel', url: 'assets/textures/tank_barrel.jpg', type: 'texture' },
            
            // 法線貼圖
            { name: 'tankBaseNormal', url: 'assets/textures/tank_base_normal.jpg', type: 'texture' },
            
            // 環境紋理
            { name: 'ground', url: 'assets/textures/ground.jpg', type: 'texture' },
            { name: 'metal', url: 'assets/textures/metal.jpg', type: 'texture' },
            { name: 'target_texture', url: 'assets/textures/target_texture.jpg', type: 'texture' }
        ];
        
        // 天空盒紋理（確認路徑）
        const skyboxUrls = {
            px: 'assets/textures/skybox/px.jpg', // +X (右)
            nx: 'assets/textures/skybox/nx.jpg', // -X (左)
            py: 'assets/textures/skybox/py.jpg', // +Y (上)
            ny: 'assets/textures/skybox/ny.jpg', // -Y (下)
            pz: 'assets/textures/skybox/pz.jpg', // +Z (前)
            nz: 'assets/textures/skybox/nz.jpg'  // -Z (後)
        };
        
        try {
            // 載入一般紋理
            console.log('Loading individual textures...');
            const textureResults = await Promise.allSettled(
                texturesToLoad.map(texture => {
                    console.log(`Loading texture: ${texture.name} from ${texture.url}`);
                    return this.textureManager.loadTexture(texture.name, texture.url);
                })
            );
            
            // 檢查每個紋理載入結果
            textureResults.forEach((result, index) => {
                const texture = texturesToLoad[index];
                if (result.status === 'fulfilled') {
                    console.log(`✓ ${texture.name} loaded successfully`);
                } else {
                    console.error(`✗ ${texture.name} failed:`, result.reason);
                }
            });
            
            // 載入天空盒 cube map
            console.log('Loading skybox cube map...');
            const skyboxResult = await this.textureManager.loadCubeMap('skybox', skyboxUrls);
            
            // 檢查載入結果
            const successful = textureResults.filter(r => r.status === 'fulfilled').length;
            const failed = textureResults.filter(r => r.status === 'rejected').length;
            
            console.log(`Texture loading completed: ${successful} loaded, ${failed} failed`);
            console.log('Skybox cube map loaded:', !!skyboxResult);
            console.log('Ground texture loaded:', this.textureManager.isTextureLoaded('ground'));
            console.log('Tank base normal map loaded:', this.textureManager.isTextureLoaded('tankBaseNormal'));
            
            // 顯示所有載入的紋理
            console.log('Loaded textures:', Array.from(this.textureManager.textures.keys()));
            
            // 為失敗的紋理創建程序化替代品
            if (failed > 0) {
                console.warn('Some textures failed to load, creating fallbacks...');
                this.createFallbackTextures();
            }
            
            console.log('=== TEXTURE LOADING COMPLETE ===');
            
        } catch (error) {
            console.error('Error loading textures:', error);
            this.createFallbackTextures();
        }
    }
    
    // 創建後備程序化紋理
    createFallbackTextures() {
        console.log('Creating fallback procedural textures...');
        
        // 為坦克組件創建簡單顏色紋理
        const greenTexture = this.textureManager.createSolidColorTexture([50, 150, 50, 255], 64, 64);
        this.textureManager.textures.set('fallback_green', greenTexture);
        
        // 創建後備法線貼圖（平面法線貼圖：RGB(128, 128, 255) = Normal(0, 0, 1)）
        if (!this.textureManager.isTextureLoaded('tankBaseNormal')) {
            const normalTexture = this.textureManager.createSolidColorTexture([128, 128, 255, 255], 64, 64);
            this.textureManager.textures.set('tankBaseNormal', normalTexture);
            console.log('Created fallback normal map for tank base');
        }
        
        // 創建後備天空盒（如果需要）
        if (!this.textureManager.getCubeMap('skybox')) {
            const fallbackSkybox = this.textureManager.createSolidColorCubeMap([128, 180, 255, 255], 64);
            this.textureManager.cubeMaps.set('skybox', fallbackSkybox);
        }
        
        console.log('Fallback textures created');
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
    
    // 測試輸入系統
    testInputSystem() {
        console.log('=== TESTING INPUT SYSTEM ===');
        console.log('InputHandler exists:', !!this.inputHandler);
        console.log('InputHandler enabled:', this.inputHandler?.enabled);
        
        // 測試基本功能
        if (this.inputHandler) {
            console.log('InputHandler methods available:');
            console.log('- getActionInput:', typeof this.inputHandler.getActionInput);
            console.log('- update:', typeof this.inputHandler.update);
            console.log('- isKeyPressed:', typeof this.inputHandler.isKeyPressed);
            
            // 設定測試按鍵監聽
            const testKeyHandler = (event) => {
                if (event.key === 'p' || event.key === 'P') {
                    console.log('=== GAME: P KEY DETECTED IN DOCUMENT ===');
                    console.log('Game input enabled:', this.inputHandler.enabled);
                    
                    // 手動觸發輸入檢查
                    setTimeout(() => {
                        const actions = this.inputHandler.getActionInput();
                        console.log('Manual action check:', actions);
                    }, 50);
                }
            };
            
            document.addEventListener('keydown', testKeyHandler);
            
            console.log('Input system test setup complete');
        } else {
            console.error('InputHandler not initialized!');
        }
    }
    
    // 處理輸入
    handleInput() {
        if (!this.inputHandler) {
            console.error('InputHandler is null in handleInput!');
            return;
        }
        
        const movement = this.inputHandler.getMovementInput();
        const actions = this.inputHandler.getActionInput();
        
        // P鍵視角切換處理
        if (actions.toggleView) {
            if (this.camera) {
                const newMode = this.camera.toggleViewMode();
                this.camera.reloadCameraPosition();
                
                if (this.ui) {
                    this.ui.updateViewIndicator(newMode);
                }
                
                this.showViewModeMessage(newMode);
            }
        }
        
        // 坦克移動
        if (this.tank) {
            const tankMoved = this.tank.update(this.deltaTime, this.inputHandler);
            
            if (tankMoved && this.camera) {
                this.camera.update();
            }
        }
        
        // 射擊 - 移除過度debug，確保狀態檢查正確
        if (actions.fire) {
            if (this.tank && this.bulletManager && this.gameManager) {
                const currentBulletCount = this.bulletManager.getActiveBulletCount();
                
                if (this.gameManager.canFire(currentBulletCount)) {
                    const firePos = this.tank.getFirePosition();
                    const fireDir = this.tank.getFireDirection();
                    
                    const fired = this.bulletManager.fire(firePos, fireDir);
                    if (fired) {
                        this.gameManager.onBulletFired();
                        console.log('Bullet fired successfully!');
                    }
                } else {
                    console.log('Cannot fire: max bullets reached or game not playing');
                }
            }
        }
        
        // 重置遊戲
        if (actions.reset) {
            this.resetGame();
        }
    }
    
    // 更新遊戲邏輯
    update() {
        // 處理輸入 - 在 inputHandler.update() 之前
        this.handleInput();
        
        // 更新輸入處理 - 清除 keyJustPressed
        this.inputHandler.update();
        
        // 更新光照系統（傳入坦克位置）
        const tankPosition = this.tank ? this.tank.getPosition() : [0, 0, 0];
        this.lighting.update(this.deltaTime, tankPosition);
        
        // 更新攝影機
        this.camera.update();
        
        // 更新砲彈（內建即時命中處理）
        this.bulletManager.update(this.deltaTime);
        
        // 更新目標
        this.targetManager.update(this.deltaTime);
        
        // 更新鏡面球
        if (this.mirrorBall) {
            this.mirrorBall.update(this.deltaTime);
        }
        
        // 檢查其他碰撞（target重疊等，非緊急）
        this.checkNonCriticalCollisions();
        
        // 更新遊戲管理器
        this.gameManager.update(this.deltaTime);
        
        // 更新陰影投射物件列表
        this.updateShadowCasters();
    }
    
    // 檢查非關鍵碰撞（重疊等）
    checkNonCriticalCollisions() {
        if (!this.collisionManager || !this.targetManager) return;
        
        // 只檢查target間重疊，砲彈命中已在bulletManager中即時處理
        const overlaps = this.collisionManager.checkTargetOverlap(this.targetManager);
        
        // 處理重疊（重新定位）
        overlaps.forEach(overlap => {
            const newPosition = this.targetManager.getRandomPositionAwayFromTargets();
            overlap.target2.setPosition(...newPosition);
        });
        
        this.collisionManager.clearFrame();
    }
    
    // 更新陰影投射物件列表
    updateShadowCasters() {
        if (!this.shadowRenderer) return;
        
        // 清空現有列表
        this.shadowRenderer.shadowCasters.length = 0;
        
        // 添加坦克
        if (this.tank) {
            this.shadowRenderer.addShadowCaster(this.tank);
        }
        
        // 添加鏡面球
        if (this.mirrorBall && this.mirrorBall.active) {
            this.shadowRenderer.addShadowCaster(this.mirrorBall);
        }
        
        // 添加活躍的目標 - 修正方法呼叫
        if (this.targetManager && this.targetManager.getTargets) {
            this.targetManager.getTargets().forEach(target => {
                if (target.isActive()) {
                    this.shadowRenderer.addShadowCaster(target);
                }
            });
        }
        
        // 添加活躍的砲彈
        if (this.bulletManager && this.bulletManager.getBullets) {
            this.bulletManager.getBullets().forEach(bullet => {
                if (bullet.isActive()) {
                    this.shadowRenderer.addShadowCaster(bullet);
                }
            });
        }
    }
    
    // 檢查碰撞 - 增強版本
    checkCollisions() {
        if (!this.collisionManager || !this.bulletManager || !this.targetManager) return;
        
        // 1. 砲彈-目標碰撞檢測
        const hits = this.collisionManager.checkBulletTargetCollisions(this.bulletManager, this.targetManager);
        
        // 2. Target間重疊檢測
        const overlaps = this.collisionManager.checkTargetOverlap(this.targetManager);
        
        // 處理重疊（重新定位）
        overlaps.forEach(overlap => {
            // 重新定位其中一個target
            const newPosition = this.targetManager.getRandomPositionAwayFromTargets();
            overlap.target2.setPosition(...newPosition);
        });
        
        // 處理命中
        if (hits.length > 0) {
            hits.forEach(hit => {
                if (this.ui) {
                    this.ui.showTargetHitMessage(hit.targetType);
                }
                
                if (this.gameManager && this.gameManager.onTargetHit) {
                    this.gameManager.onTargetHit({
                        targetType: hit.targetType,
                        targetId: hit.targetId, // 精確ID追蹤
                        bulletId: hit.bulletId
                    });
                }
            });
        }
        
        this.collisionManager.clearFrame();
    }
    
    // 渲染場景 - 確保陰影優先渲染
    render() {
        // 第一階段：渲染陰影貼圖 (off-screen)
        if (this.shadowRenderer && this.shadowRenderer.enabled) {
            console.log('=== RENDERING SHADOW MAP ===');
            this.shadowRenderer.renderShadowMap();
        }
        
        // 確保回到主畫面緩衝區
        if (this.frameBuffer) {
            this.frameBuffer.unbind();
        }
        
        // 第二階段：主畫面渲染 (on-screen)
        console.log('=== MAIN RENDER WITH SHADOWS ===');
        
        // 清除主畫面
        this.webglCore.clear();
        
        // 獲取光照資訊
        const lightData = this.lighting;
        
        // 渲染順序很重要：先地面（接收陰影），再物體（投射陰影）
        
        // 1. 渲染場景環境 - 地面要接收陰影
        if (this.scene) {
            this.renderSceneWithShadows(lightData);
        }
        
        // 2. 渲染坦克 - 投射陰影到地面
        this.renderTankWithShadows(lightData);
        
        // 3. 渲染目標 - 投射陰影到地面
        this.renderTargetsWithShadows(lightData);
        
        // 4. 渲染砲彈 - 投射陰影到地面
        this.renderBulletsWithShadows(lightData);
        
        // 5. 渲染鏡面球
        this.renderMirrorBallWithShadows(lightData);
        
        // 檢查 WebGL 錯誤
        if (window.DEBUG) {
            this.webglCore.checkError('render');
        }
    }
    
    // 渲染場景（地面接收陰影）- 修正為強化陰影效果
    renderSceneWithShadows(lightData) {
        // 使用 phong 著色器並應用陰影
        const program = this.shaderManager.useProgram('phong');
        if (program && this.shadowRenderer) {
            // 先應用陰影，確保陰影貼圖正確綁定
            this.shadowRenderer.applyToShader(program, 1);
        }
        
        // 渲染天空盒（不受陰影影響）
        if (this.scene.skyboxGeometry) {
            this.scene.renderSkybox(this.camera);
        }
        
        // 渲染地面（主要接收陰影的表面）
        this.scene.renderGround(this.camera, lightData);
        
        console.log('Scene rendered with dramatic ground shadows');
    }
    
    // 渲染坦克（加入陰影支援）
    renderTankWithShadows(lightData) {
        // 坦克會投射陰影，但不一定需要接收陰影
        const program = this.shaderManager.useProgram('phong');
        if (program && this.shadowRenderer) {
            this.shadowRenderer.applyToShader(program, 1);
        }
        
        this.tank.render(this.camera, lightData, this.textureManager);
    }
    
    // 渲染砲彈（加入陰影支援）
    renderBulletsWithShadows(lightData) {
        const program = this.shaderManager.useProgram('phong');
        if (program && this.shadowRenderer) {
            this.shadowRenderer.applyToShader(program, 1);
        }
        
        this.bulletManager.render(this.camera, lightData, this.textureManager);
    }
    
    // 渲染目標（加入陰影支援）
    renderTargetsWithShadows(lightData) {
        const program = this.shaderManager.useProgram('phong');
        if (program && this.shadowRenderer) {
            this.shadowRenderer.applyToShader(program, 1);
        }
        
        this.targetManager.render(this.camera, lightData, this.textureManager);
    }
    
    // 渲染鏡面球（加入陰影支援）
    renderMirrorBallWithShadows(lightData) {
        if (!this.mirrorBall || !this.mirrorBall.active) return;
        
        const program = this.shaderManager.useProgram('phong');
        if (program && this.shadowRenderer) {
            this.shadowRenderer.applyToShader(program, 1);
        }
        
        this.mirrorBall.render(this.camera, lightData, this.textureManager);
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
        
        // 重置目標（將重新生成隨機位置）
        this.targetManager.reset();
        
        // 重置鏡面球（回到固定中央位置）
        if (this.mirrorBall) {
            this.mirrorBall.reset();
        }
        
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
        
        console.log('Game reset complete with new target positions and fixed MirrorBall');
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
    
    // 顯示視角切換訊息
    showViewModeMessage(mode) {
        const message = mode === 'first' ? '第一人稱視角' : '第三人稱視角';
        
        // 移除之前的訊息
        const existingMessage = document.getElementById('viewModeMessage');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        // 創建新訊息
        const messageDiv = document.createElement('div');
        messageDiv.id = 'viewModeMessage';
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            font-size: 16px;
            z-index: 1000;
            pointer-events: none;
        `;
        messageDiv.textContent = message;
        document.body.appendChild(messageDiv);
        
        // 2秒後自動移除
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 2000);
        
        console.log(`View mode message displayed: ${message}`);
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
    
    // 啟用調試模式
    window.DEBUG = true;
    console.log('🔧 Debug mode enabled for collision detection');
    
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
        
        console.log('Tank Battle Game ready with coordinate debugging!');
    } else {
        console.error('System not compatible, game initialization aborted');
    }
});