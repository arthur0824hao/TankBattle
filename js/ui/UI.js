/**
 * UI管理器 - 移除計分相關功能
 * 管理遊戲界面元素和用戶互動
 */
class UI {
    constructor(gameManager) {
        this.gameManager = gameManager;
        
        // UI 元素引用
        this.elements = {
            viewIndicator: document.getElementById('viewIndicator')
        };
        
        // 訊息顯示佇列
        this.messageQueue = [];
        this.currentMessage = null;
        
        this.initializeUI();
        console.log('UI Manager initialized (no scoring elements)');
    }
    
    // 初始化UI
    initializeUI() {
        // 隱藏計分相關元素
        const scoreboardElement = document.getElementById('scoreboard');
        if (scoreboardElement) {
            scoreboardElement.style.display = 'none';
        }
        
        // 更新控制說明，移除彈藥相關內容
        this.updateControlsDisplay();
    }
    
    // 更新控制說明
    updateControlsDisplay() {
        const controlsElement = document.getElementById('controls');
        if (controlsElement) {
            controlsElement.innerHTML = `
                <div class="control-section">
                    <h3>控制說明</h3>
                    <div class="control-item">A/D: 坦克轉向</div>
                    <div class="control-item">空白鍵: 發射砲彈</div>
                    <div class="control-item">P: 切換視角</div>
                    <div class="control-item">R: 重新開始</div>
                    <div class="control-item">限制: 最多5顆砲彈同時存在</div>
                </div>
            `;
        }
    }
    
    // 更新視角指示器
    updateViewIndicator(viewMode) {
        if (this.elements.viewIndicator) {
            const indicator = this.elements.viewIndicator;
            indicator.textContent = viewMode === 'first' ? '第一人稱' : '第三人稱';
            indicator.className = viewMode === 'first' ? '' : 'third-person';
        }
    }
    
    // 顯示目標擊中訊息
    showTargetHitMessage(targetType) {
        const typeNames = {
            'white': '白球',
            'blue': '藍球', 
            'red': '紅球'
        };
        
        const message = `擊中${typeNames[targetType] || '目標'}！`;
        this.showGameMessage(message, 'success', 1500);
    }
    
    // 顯示遊戲重置訊息
    showGameResetMessage() {
        this.showGameMessage('遊戲重置', 'info', 2000);
    }
    
    // 顯示通用遊戲訊息
    showGameMessage(text, type = 'info', duration = 2000) {
        // 移除現有訊息
        if (this.currentMessage) {
            this.currentMessage.remove();
        }
        
        // 創建新訊息
        const message = document.createElement('div');
        message.className = `game-message message-${type}`;
        message.textContent = text;
        
        // 設定樣式
        const colors = {
            info: '#3498db',
            success: '#2ecc71',
            warning: '#f39c12',
            error: '#e74c3c'
        };
        
        message.style.borderColor = colors[type] || colors.info;
        message.style.color = colors[type] || colors.info;
        
        // 添加到遊戲容器
        const gameContainer = document.getElementById('gameContainer');
        if (gameContainer) {
            gameContainer.appendChild(message);
            this.currentMessage = message;
            
            // 自動移除
            setTimeout(() => {
                if (message.parentNode) {
                    message.parentNode.removeChild(message);
                }
                if (this.currentMessage === message) {
                    this.currentMessage = null;
                }
            }, duration);
        }
    }
    
    // 顯示系統訊息
    showSystemMessage(text, type = 'info') {
        console.log(`[UI ${type.toUpperCase()}] ${text}`);
        this.showGameMessage(text, type, 3000);
    }
    
    // 更新遊戲狀態顯示
    updateGameStateDisplay(gameState) {
        const stateNames = {
            'initializing': '初始化中',
            'playing': '遊戲中',
            'paused': '已暫停',
            'gameover': '遊戲結束'
        };
        
        console.log('Game state:', stateNames[gameState] || gameState);
    }
    
    // 顯示載入狀態
    showLoading(message = '載入中...') {
        // 移除現有載入元素
        const existingLoading = document.querySelector('.loading');
        if (existingLoading) {
            existingLoading.remove();
        }
        
        // 創建載入元素
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading';
        loadingDiv.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner"></div>
                <div class="loading-text">${message}</div>
            </div>
        `;
        
        document.body.appendChild(loadingDiv);
        return loadingDiv;
    }
    
    // 隱藏載入狀態
    hideLoading() {
        const loadingDiv = document.querySelector('.loading');
        if (loadingDiv) {
            loadingDiv.remove();
        }
    }
    
    // 顯示錯誤訊息
    showError(message, autoHide = true) {
        this.showGameMessage(`錯誤: ${message}`, 'error', autoHide ? 5000 : 0);
    }
    
    // 更新遊戲統計顯示（簡化版本）
    updateStatsDisplay(stats) {
        // 可以在控制台顯示統計資料
        if (window.DEBUG) {
            console.log('Game Stats:', stats);
        }
    }
    
    // 切換UI可見性
    toggleUIVisibility(visible = null) {
        const uiOverlay = document.getElementById('uiOverlay');
        if (uiOverlay) {
            if (visible === null) {
                uiOverlay.style.display = uiOverlay.style.display === 'none' ? 'block' : 'none';
            } else {
                uiOverlay.style.display = visible ? 'block' : 'none';
            }
        }
    }
    
    // 設定除錯模式
    setDebugMode(enabled) {
        window.DEBUG = enabled;
        if (enabled) {
            console.log('UI Debug mode enabled');
        }
    }
    
    // 獲取UI狀態
    getUIState() {
        return {
            currentMessage: !!this.currentMessage,
            messageQueue: this.messageQueue.length,
            viewIndicator: this.elements.viewIndicator?.textContent || 'unknown'
        };
    }
    
    // 清理UI資源
    cleanup() {
        // 移除所有動態創建的元素
        if (this.currentMessage) {
            this.currentMessage.remove();
            this.currentMessage = null;
        }
        
        this.messageQueue = [];
        
        // 重置UI元素引用
        this.elements = {};
        
        console.log('UI Manager cleaned up');
    }
    
    // 響應式UI調整
    handleResize() {
        // 這裡可以添加響應式調整邏輯
        console.log('UI responding to window resize');
    }

    // 顯示遊戲訊息
    showMessage(text, type = 'info', duration = 2000) {
        // 移除現有訊息
        const existingMessage = document.querySelector('.game-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        // 創建新訊息
        const messageDiv = document.createElement('div');
        messageDiv.className = `game-message message-${type}`;
        messageDiv.textContent = text;
        
        // 添加到遊戲容器
        const gameContainer = document.getElementById('gameContainer');
        if (gameContainer) {
            gameContainer.appendChild(messageDiv);
            
            // 自動移除
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.remove();
                }
            }, duration);
        }
        
        console.log(`UI Message [${type}]: ${text}`);
    }
}