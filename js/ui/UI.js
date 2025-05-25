/**
 * UI 管理器
 * 管理遊戲界面元素和用戶互動
 */
class UI {
    constructor(gameManager) {
        this.gameManager = gameManager;
        
        // UI 元素引用
        this.elements = {};
        this.overlays = {};
        
        // UI 狀態
        this.visible = true;
        this.hudVisible = true;
        this.menuVisible = false;
        
        // 動畫
        this.animations = new Map();
        
        // 訊息佇列
        this.messageQueue = [];
        this.maxMessages = 5;
        
        this.init();
    }
    
    // 初始化 UI
    init() {
        this.initElements();
        this.initEventListeners();
        this.createMessageContainer();
        
        console.log('UI Manager initialized');
    }
    
    // 初始化 UI 元素
    initElements() {
        // 計分板元素
        this.elements.scoreboard = document.getElementById('scoreboard');
        this.elements.totalScore = document.getElementById('totalScore');
        this.elements.whiteScore = document.getElementById('whiteScore');
        this.elements.blueScore = document.getElementById('blueScore');
        this.elements.redScore = document.getElementById('redScore');
        
        // 控制說明
        this.elements.controls = document.getElementById('controls');
        
        // 視角指示器
        this.elements.viewIndicator = document.getElementById('viewIndicator');
        
        // 遊戲容器
        this.elements.gameContainer = document.getElementById('gameContainer');
        
        // UI 覆蓋層
        this.elements.uiOverlay = document.getElementById('uiOverlay');
    }
    
    // 初始化事件監聽器
    initEventListeners() {
        // 鍵盤快捷鍵
        document.addEventListener('keydown', (e) => {
            this.handleKeyDown(e);
        });
        
        // 視窗大小改變
        window.addEventListener('resize', () => {
            this.handleResize();
        });
        
        // 滑鼠事件
        document.addEventListener('click', (e) => {
            this.handleClick(e);
        });
    }
    
    // 創建訊息容器
    createMessageContainer() {
        this.messageContainer = document.createElement('div');
        this.messageContainer.id = 'messageContainer';
        this.messageContainer.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 1000;
            pointer-events: none;
            width: 400px;
            max-height: 300px;
            overflow: hidden;
        `;
        
        document.body.appendChild(this.messageContainer);
    }
    
    // 處理鍵盤事件
    handleKeyDown(event) {
        switch (event.key.toLowerCase()) {
            case 'h':
                this.toggleHUD();
                break;
            case 'escape':
                this.toggleMenu();
                break;
            case 'f1':
                event.preventDefault();
                this.showHelp();
                break;
        }
    }
    
    // 處理點擊事件
    handleClick(event) {
        // 處理UI元素點擊
        if (event.target.closest('#controls')) {
            // 點擊控制說明不做任何事
            return;
        }
    }
    
    // 處理視窗大小改變
    handleResize() {
        // 調整UI元素位置
        this.updateLayout();
    }
    
    // 更新分數顯示
    updateScore(score) {
        if (this.elements.totalScore) {
            this.animateNumber(this.elements.totalScore, score.total);
        }
        if (this.elements.whiteScore) {
            this.animateNumber(this.elements.whiteScore, score.white);
        }
        if (this.elements.blueScore) {
            this.animateNumber(this.elements.blueScore, score.blue);
        }
        if (this.elements.redScore) {
            this.animateNumber(this.elements.redScore, score.red);
        }
    }
    
    // 數字動畫
    animateNumber(element, targetValue) {
        const currentValue = parseInt(element.textContent) || 0;
        const duration = 500; // 毫秒
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // 使用緩動函數
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const value = Math.round(currentValue + (targetValue - currentValue) * easeOut);
            
            element.textContent = value;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }
    
    // 更新視角指示器
    updateViewIndicator(viewMode) {
        if (this.elements.viewIndicator) {
            const indicator = this.elements.viewIndicator;
            indicator.textContent = viewMode === 'first' ? '第一人稱' : '第三人稱';
            
            // 添加視覺效果
            indicator.classList.toggle('third-person', viewMode === 'third');
            
            // 閃爍效果
            this.flashElement(indicator);
        }
    }
    
    // 元素閃爍效果
    flashElement(element) {
        element.style.animation = 'none';
        element.offsetHeight; // 強制重排
        element.style.animation = 'flash 0.3s ease-in-out';
        
        setTimeout(() => {
            element.style.animation = '';
        }, 300);
    }
    
    // 顯示訊息
    showMessage(text, type = 'info', duration = 3000) {
        const message = this.createMessage(text, type);
        this.messageQueue.push(message);
        
        // 限制訊息數量
        while (this.messageQueue.length > this.maxMessages) {
            const oldMessage = this.messageQueue.shift();
            if (oldMessage.parentNode) {
                oldMessage.parentNode.removeChild(oldMessage);
            }
        }
        
        this.messageContainer.appendChild(message);
        
        // 動畫進入
        requestAnimationFrame(() => {
            message.style.transform = 'translateX(0)';
            message.style.opacity = '1';
        });
        
        // 自動移除
        setTimeout(() => {
            this.removeMessage(message);
        }, duration);
    }
    
    // 創建訊息元素
    createMessage(text, type) {
        const message = document.createElement('div');
        message.className = `game-message message-${type}`;
        message.textContent = text;
        
        // 設定樣式
        const colors = {
            info: '#3498db',
            success: '#2ecc71',
            warning: '#f39c12',
            error: '#e74c3c',
            score: '#f39c12'
        };
        
        message.style.cssText = `
            background: rgba(0, 0, 0, 0.9);
            color: ${colors[type] || colors.info};
            border: 2px solid ${colors[type] || colors.info};
            padding: 12px 20px;
            margin: 5px 0;
            border-radius: 8px;
            font-size: 16px;
            font-weight: bold;
            text-align: center;
            transform: translateX(100%);
            opacity: 0;
            transition: all 0.3s ease-in-out;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        `;
        
        return message;
    }
    
    // 移除訊息
    removeMessage(message) {
        if (message && message.parentNode) {
            message.style.transform = 'translateX(100%)';
            message.style.opacity = '0';
            
            setTimeout(() => {
                if (message.parentNode) {
                    message.parentNode.removeChild(message);
                }
                
                const index = this.messageQueue.indexOf(message);
                if (index > -1) {
                    this.messageQueue.splice(index, 1);
                }
            }, 300);
        }
    }
    
    // 顯示擊中效果
    showHitEffect(position, score, type) {
        this.showMessage(`+${score}分`, 'score', 2000);
        
        // 可以在這裡添加3D空間中的粒子效果
        this.createFloatingText(position, `+${score}`, type);
    }
    
    // 創建浮動文字（3D空間中）
    createFloatingText(position, text, type) {
        // 這裡需要將3D位置轉換為螢幕座標
        // 為了簡化，暫時使用螢幕中心位置
        const floatingText = document.createElement('div');
        floatingText.textContent = text;
        floatingText.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 24px;
            font-weight: bold;
            color: ${type === 'red' ? '#e74c3c' : type === 'blue' ? '#3498db' : '#ffffff'};
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
            pointer-events: none;
            z-index: 999;
            animation: floatUp 2s ease-out forwards;
        `;
        
        document.body.appendChild(floatingText);
        
        // 2秒後移除
        setTimeout(() => {
            if (floatingText.parentNode) {
                floatingText.parentNode.removeChild(floatingText);
            }
        }, 2000);
    }
    
    // 切換 HUD 顯示
    toggleHUD() {
        this.hudVisible = !this.hudVisible;
        
        if (this.elements.uiOverlay) {
            this.elements.uiOverlay.style.display = this.hudVisible ? 'block' : 'none';
        }
        
        this.showMessage(`HUD ${this.hudVisible ? '顯示' : '隱藏'}`, 'info', 1500);
    }
    
    // 切換選單
    toggleMenu() {
        this.menuVisible = !this.menuVisible;
        
        if (this.menuVisible) {
            this.showPauseMenu();
        } else {
            this.hidePauseMenu();
        }
    }
    
    // 顯示暫停選單
    showPauseMenu() {
        if (!this.overlays.pauseMenu) {
            this.createPauseMenu();
        }
        
        this.overlays.pauseMenu.style.display = 'flex';
        this.gameManager.togglePause();
    }
    
    // 隱藏暫停選單
    hidePauseMenu() {
        if (this.overlays.pauseMenu) {
            this.overlays.pauseMenu.style.display = 'none';
        }
        
        if (this.gameManager.getGameState() === 'paused') {
            this.gameManager.togglePause();
        }
    }
    
    // 創建暫停選單
    createPauseMenu() {
        const menu = document.createElement('div');
        menu.id = 'pauseMenu';
        menu.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 2000;
        `;
        
        menu.innerHTML = `
            <div style="background: rgba(44, 62, 80, 0.95); padding: 40px; border-radius: 15px; text-align: center; border: 2px solid #3498db;">
                <h2 style="color: #f39c12; margin-bottom: 30px;">遊戲暫停</h2>
                <div style="margin: 20px 0;">
                    <button id="resumeBtn" style="margin: 10px; padding: 12px 24px; font-size: 16px; background: #2ecc71; border: none; border-radius: 8px; color: white; cursor: pointer;">繼續遊戲</button>
                </div>
                <div style="margin: 20px 0;">
                    <button id="resetBtn" style="margin: 10px; padding: 12px 24px; font-size: 16px; background: #e74c3c; border: none; border-radius: 8px; color: white; cursor: pointer;">重新開始</button>
                </div>
                <div style="margin: 20px 0;">
                    <button id="settingsBtn" style="margin: 10px; padding: 12px 24px; font-size: 16px; background: #3498db; border: none; border-radius: 8px; color: white; cursor: pointer;">設定</button>
                </div>
                <p style="color: #ecf0f1; margin-top: 20px; font-size: 14px;">按 ESC 鍵繼續遊戲</p>
            </div>
        `;
        
        // 添加事件監聽器
        menu.querySelector('#resumeBtn').addEventListener('click', () => {
            this.toggleMenu();
        });
        
        menu.querySelector('#resetBtn').addEventListener('click', () => {
            this.confirmReset();
        });
        
        menu.querySelector('#settingsBtn').addEventListener('click', () => {
            this.showSettings();
        });
        
        document.body.appendChild(menu);
        this.overlays.pauseMenu = menu;
    }
    
    // 確認重置
    confirmReset() {
        if (confirm('確定要重新開始遊戲嗎？目前進度將會失去。')) {
            this.gameManager.resetGame();
            this.toggleMenu();
            this.showMessage('遊戲已重置', 'info');
        }
    }
    
    // 顯示設定
    showSettings() {
        this.showMessage('設定功能尚未實現', 'info');
    }
    
    // 顯示幫助
    showHelp() {
        const helpText = `
控制說明：
WASD - 移動坦克
方向鍵上下 - 調節砲管仰角
空白鍵 - 發射砲彈
P - 切換視角
Q/E - 第三人稱視角旋轉
R - 重新開始
H - 切換HUD顯示
ESC - 暫停選單
F1 - 顯示此幫助
        `;
        
        this.showMessage(helpText, 'info', 8000);
    }
    
    // 更新遊戲統計
    updateStats(stats) {
        // 可以在這裡顯示詳細統計資訊
        if (stats.accuracy !== undefined) {
            // 更新準確度等統計資料
        }
    }
    
    // 顯示載入畫面
    showLoading(message = '載入中...') {
        if (!this.overlays.loading) {
            this.createLoadingOverlay();
        }
        
        this.overlays.loading.querySelector('.loading-text').textContent = message;
        this.overlays.loading.style.display = 'flex';
    }
    
    // 隱藏載入畫面
    hideLoading() {
        if (this.overlays.loading) {
            this.overlays.loading.style.display = 'none';
        }
    }
    
    // 創建載入覆蓋層
    createLoadingOverlay() {
        const loading = document.createElement('div');
        loading.className = 'loading';
        loading.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner"></div>
                <div class="loading-text">載入中...</div>
            </div>
        `;
        
        document.body.appendChild(loading);
        this.overlays.loading = loading;
    }
    
    // 更新佈局
    updateLayout() {
        // 根據視窗大小調整UI元素
        const canvas = document.getElementById('gameCanvas');
        if (canvas) {
            const rect = canvas.getBoundingClientRect();
            // 調整UI元素位置以適應canvas大小
        }
    }
    
    // 顯示性能資訊（除錯用）
    showPerformanceInfo(fps, frameTime) {
        if (!this.elements.perfInfo) {
            this.createPerformanceDisplay();
        }
        
        this.elements.perfInfo.textContent = `FPS: ${fps} | Frame: ${frameTime.toFixed(1)}ms`;
    }
    
    // 創建性能顯示
    createPerformanceDisplay() {
        const perfInfo = document.createElement('div');
        perfInfo.id = 'perfInfo';
        perfInfo.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            background: rgba(0, 0, 0, 0.7);
            color: #2ecc71;
            padding: 5px 10px;
            border-radius: 5px;
            font-family: monospace;
            font-size: 12px;
            z-index: 1001;
        `;
        
        document.body.appendChild(perfInfo);
        this.elements.perfInfo = perfInfo;
    }
    
    // 清理 UI
    cleanup() {
        // 移除動態創建的元素
        Object.values(this.overlays).forEach(overlay => {
            if (overlay && overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        });
        
        if (this.messageContainer && this.messageContainer.parentNode) {
            this.messageContainer.parentNode.removeChild(this.messageContainer);
        }
        
        // 清空訊息佇列
        this.messageQueue.length = 0;
        
        console.log('UI cleaned up');
    }
    
    // 獲取UI狀態
    getState() {
        return {
            visible: this.visible,
            hudVisible: this.hudVisible,
            menuVisible: this.menuVisible,
            messageCount: this.messageQueue.length
        };
    }
}