/**
 * 遊戲管理器
 * 統一管理遊戲狀態、計分和遊戲邏輯
 */
class GameManager {
    constructor() {
        // 遊戲狀態
        this.gameState = 'playing'; // 'playing', 'paused', 'gameOver'
        
        // 計分系統
        this.score = {
            total: 0,
            white: 0,
            blue: 0,
            red: 0
        };
        
        // 統計資料
        this.stats = {
            totalShots: 0,
            totalHits: 0,
            accuracy: 0,
            gameTime: 0,
            targetHits: {
                white: 0,
                blue: 0,
                red: 0
            }
        };
        
        // 遊戲設定
        this.settings = {
            enableShadows: true,
            enableReflections: true,
            enableParticles: true,
            soundEnabled: true
        };
        
        // UI 元素引用
        this.uiElements = {};
        this.initUIElements();
        
        // 事件回調
        this.onScoreUpdate = null;
        this.onGameStateChange = null;
        this.onTargetHit = null;
    }
    
    // 初始化 UI 元素
    initUIElements() {
        this.uiElements = {
            totalScore: document.getElementById('totalScore'),
            whiteScore: document.getElementById('whiteScore'),
            blueScore: document.getElementById('blueScore'),
            redScore: document.getElementById('redScore'),
            viewIndicator: document.getElementById('viewIndicator')
        };
    }
    
    // 更新遊戲
    update(deltaTime) {
        if (this.gameState !== 'playing') return;
        
        this.stats.gameTime += deltaTime;
        this.updateAccuracy();
    }
    
    // 處理射擊事件
    onBulletFired() {
        this.stats.totalShots++;
        console.log(`Shot fired. Total shots: ${this.stats.totalShots}`);
    }
    
    // 處理目標擊中事件
    onTargetHit(hitData) {
        const { target, score, type, position } = hitData;
        
        // 更新分數
        this.score.total += score;
        this.score[type] += score;
        
        // 更新統計
        this.stats.totalHits++;
        this.stats.targetHits[type]++;
        
        // 更新 UI
        this.updateScoreDisplay();
        
        // 顯示擊中效果
        this.showHitEffect(position, score, type);
        
        // 觸發回調
        if (this.onTargetHit) {
            this.onTargetHit(hitData);
        }
        
        console.log(`${type} target hit! Score: +${score}, Total: ${this.score.total}`);
    }
    
    // 更新準確度
    updateAccuracy() {
        this.stats.accuracy = this.stats.totalShots > 0 ? 
            (this.stats.totalHits / this.stats.totalShots * 100) : 0;
    }
    
    // 更新分數顯示
    updateScoreDisplay() {
        if (this.uiElements.totalScore) {
            this.uiElements.totalScore.textContent = this.score.total;
        }
        if (this.uiElements.whiteScore) {
            this.uiElements.whiteScore.textContent = this.score.white;
        }
        if (this.uiElements.blueScore) {
            this.uiElements.blueScore.textContent = this.score.blue;
        }
        if (this.uiElements.redScore) {
            this.uiElements.redScore.textContent = this.score.red;
        }
        
        // 觸發分數更新回調
        if (this.onScoreUpdate) {
            this.onScoreUpdate(this.score);
        }
    }
    
    // 更新視角指示器
    updateViewIndicator(viewMode) {
        if (this.uiElements.viewIndicator) {
            const indicator = this.uiElements.viewIndicator;
            indicator.textContent = viewMode === 'first' ? '第一人稱' : '第三人稱';
            indicator.className = viewMode === 'first' ? '' : 'third-person';
        }
    }
    
    // 顯示擊中效果
    showHitEffect(position, score, type) {
        // 創建臨時訊息元素
        const message = document.createElement('div');
        message.className = 'game-message';
        message.textContent = `+${score}分`;
        
        // 設定顏色
        switch (type) {
            case 'white':
                message.style.color = '#ffffff';
                message.style.borderColor = '#ffffff';
                break;
            case 'blue':
                message.style.color = '#3498db';
                message.style.borderColor = '#3498db';
                break;
            case 'red':
                message.style.color = '#e74c3c';
                message.style.borderColor = '#e74c3c';
                break;
        }
        
        document.getElementById('gameContainer').appendChild(message);
        
        // 2秒後移除
        setTimeout(() => {
            if (message.parentNode) {
                message.parentNode.removeChild(message);
            }
        }, 2000);
    }
    
    // 重置遊戲
    resetGame() {
        // 重置分數
        this.score = {
            total: 0,
            white: 0,
            blue: 0,
            red: 0
        };
        
        // 重置統計
        this.stats = {
            totalShots: 0,
            totalHits: 0,
            accuracy: 0,
            gameTime: 0,
            targetHits: {
                white: 0,
                blue: 0,
                red: 0
            }
        };
        
        // 更新 UI
        this.updateScoreDisplay();
        
        // 設定遊戲狀態
        this.gameState = 'playing';
        
        console.log('Game reset');
    }
    
    // 暫停/恢復遊戲
    togglePause() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
        } else if (this.gameState === 'paused') {
            this.gameState = 'playing';
        }
        
        if (this.onGameStateChange) {
            this.onGameStateChange(this.gameState);
        }
        
        console.log(`Game ${this.gameState}`);
    }
    
    // 獲取遊戲狀態
    getGameState() {
        return this.gameState;
    }
    
    // 獲取分數
    getScore() {
        return { ...this.score };
    }
    
    // 獲取統計資料
    getStats() {
        return { ...this.stats };
    }
    
    // 獲取格式化的遊戲時間
    getFormattedGameTime() {
        const minutes = Math.floor(this.stats.gameTime / 60);
        const seconds = Math.floor(this.stats.gameTime % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    // 獲取遊戲總結
    getGameSummary() {
        return {
            score: this.score,
            stats: this.stats,
            accuracy: this.stats.accuracy.toFixed(1),
            gameTime: this.getFormattedGameTime(),
            averageScore: this.stats.totalHits > 0 ? 
                (this.score.total / this.stats.totalHits).toFixed(1) : 0
        };
    }
    
    // 檢查成就
    checkAchievements() {
        const achievements = [];
        
        // 準確度成就
        if (this.stats.accuracy >= 80 && this.stats.totalShots >= 10) {
            achievements.push({ name: '神射手', description: '準確度達到80%以上' });
        }
        
        // 分數成就
        if (this.score.total >= 100) {
            achievements.push({ name: '百分突破', description: '總分達到100分' });
        }
        
        // 紅球成就
        if (this.stats.targetHits.red >= 5) {
            achievements.push({ name: '紅球獵人', description: '擊中5個紅球' });
        }
        
        // 連續擊中成就（需要額外追蹤）
        // 這裡可以擴展更多成就邏輯
        
        return achievements;
    }
    
    // 保存遊戲資料（未來可用於本地存儲）
    saveGameData() {
        const gameData = {
            score: this.score,
            stats: this.stats,
            settings: this.settings,
            timestamp: Date.now()
        };
        
        try {
            // 這裡可以實現本地存儲
            console.log('Game data saved:', gameData);
            return true;
        } catch (error) {
            console.error('Failed to save game data:', error);
            return false;
        }
    }
    
    // 載入遊戲資料
    loadGameData() {
        try {
            // 這裡可以實現從本地存儲載入
            console.log('Loading game data...');
            return true;
        } catch (error) {
            console.error('Failed to load game data:', error);
            return false;
        }
    }
    
    // 設定回調函數
    setCallbacks(callbacks) {
        this.onScoreUpdate = callbacks.onScoreUpdate || null;
        this.onGameStateChange = callbacks.onGameStateChange || null;
        this.onTargetHit = callbacks.onTargetHit || null;
    }
    
    // 獲取設定
    getSettings() {
        return { ...this.settings };
    }
    
    // 更新設定
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
    }
    
    // 獲取最高分統計
    getHighScore() {
        // 這裡可以實現最高分記錄
        return this.score.total;
    }
    
    // 檢查是否創造新記錄
    isNewRecord() {
        return this.score.total > this.getHighScore();
    }
}