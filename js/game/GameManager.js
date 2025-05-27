/**
 * 遊戲管理器
 * 負責管理遊戲狀態和生命週期（移除彈藥和計分系統）
 */
class GameManager {
    constructor() {
        // 遊戲狀態
        this.gameState = 'initializing'; // 'initializing', 'playing', 'paused', 'gameover'
        
        // 砲彈限制（保留同時存在限制，移除總彈藥限制）
        this.maxSimultaneousBullets = 5; // 場上最多同時存在5顆砲彈
        
        // 遊戲時間
        this.gameTime = 0;
        this.deltaTime = 0;
        
        // 事件回調
        this.callbacks = {
            onGameStateChange: null,
            onTargetHit: null
        };
        
        // 除錯資料來源
        this.debugSources = {};
        
        console.log('GameManager initialized (no ammo/scoring system)');
    }
    
    // 設定回調函數
    setCallbacks(callbacks) {
        this.callbacks = { ...this.callbacks, ...callbacks };
    }
    
    // 設定除錯資料來源
    setDebugSources(sources) {
        this.debugSources = sources;
    }
    
    // 更新遊戲管理器
    update(deltaTime) {
        this.deltaTime = deltaTime;
        
        if (this.gameState === 'playing') {
            this.gameTime += deltaTime;
        }
    }
    
    // 檢查是否可以發射（只檢查場上砲彈數量）
    canFire(currentBulletCount) {
        return currentBulletCount < this.maxSimultaneousBullets && this.gameState === 'playing';
    }
    
    // 處理砲彈發射
    onBulletFired() {
        console.log('Bullet fired (unlimited ammo)');
        return true; // 總是允許發射（除非超過同時存在限制）
    }
    
    // 處理目標被擊中（移除計分，只處理銷毀）
    onTargetHit(hitData) {
        console.log('Target hit (no scoring):', hitData);
        
        // 觸發目標擊中回調（用於顯示訊息等）
        if (this.callbacks.onTargetHit) {
            this.callbacks.onTargetHit(hitData);
        }
    }
    
    // 獲取最大同時砲彈數
    getMaxSimultaneousBullets() {
        return this.maxSimultaneousBullets;
    }
    
    // 重置遊戲
    resetGame() {
        console.log('Resetting game...');
        
        // 重置遊戲狀態
        this.gameState = 'playing';
        this.gameTime = 0;
        
        // 觸發狀態改變回調
        if (this.callbacks.onGameStateChange) {
            this.callbacks.onGameStateChange(this.gameState);
        }
        
        console.log('Game reset complete (no ammo/scoring to reset)');
    }
    
    // 開始遊戲
    startGame() {
        this.gameState = 'playing';
        this.gameTime = 0;
        
        if (this.callbacks.onGameStateChange) {
            this.callbacks.onGameStateChange(this.gameState);
        }
        
        console.log('Game started');
    }
    
    // 暫停遊戲
    pauseGame() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            
            if (this.callbacks.onGameStateChange) {
                this.callbacks.onGameStateChange(this.gameState);
            }
            
            console.log('Game paused');
        }
    }
    
    // 恢復遊戲
    resumeGame() {
        if (this.gameState === 'paused') {
            this.gameState = 'playing';
            
            if (this.callbacks.onGameStateChange) {
                this.callbacks.onGameStateChange(this.gameState);
            }
            
            console.log('Game resumed');
        }
    }
    
    // 結束遊戲
    endGame() {
        this.gameState = 'gameover';
        
        if (this.callbacks.onGameStateChange) {
            this.callbacks.onGameStateChange(this.gameState);
        }
        
        console.log('Game ended');
    }
    
    // 獲取遊戲狀態
    getGameState() {
        return this.gameState;
    }
    
    // 獲取遊戲時間
    getGameTime() {
        return this.gameTime;
    }
    
    // 獲取遊戲摘要
    getGameSummary() {
        return {
            state: this.gameState,
            time: this.gameTime,
            maxBullets: this.maxSimultaneousBullets
        };
    }
    
    // 強制除錯輸出
    forceDebugOutput() {
        console.log('=== GAME MANAGER DEBUG OUTPUT ===');
        console.log('Game State:', this.gameState);
        console.log('Game Time:', this.gameTime.toFixed(2), 'seconds');
        console.log('Max Simultaneous Bullets:', this.maxSimultaneousBullets);
        
        // 輸出除錯來源資料
        Object.entries(this.debugSources).forEach(([name, source]) => {
            if (source && typeof source.getStats === 'function') {
                console.log(`${name} stats:`, source.getStats());
            } else if (source && typeof source.getDebugInfo === 'function') {
                console.log(`${name} debug:`, source.getDebugInfo());
            }
        });
        
        console.log('=== END DEBUG OUTPUT ===');
    }
    
    // 檢查遊戲是否運行中
    isPlaying() {
        return this.gameState === 'playing';
    }
    
    // 檢查遊戲是否暫停
    isPaused() {
        return this.gameState === 'paused';
    }
    
    // 檢查遊戲是否結束
    isGameOver() {
        return this.gameState === 'gameover';
    }
    
    // 設定遊戲配置
    setGameConfig(config) {
        if (config.maxSimultaneousBullets) {
            this.maxSimultaneousBullets = config.maxSimultaneousBullets;
        }
        
        console.log('Game config updated:', config);
    }
    
    // 獲取遊戲配置
    getGameConfig() {
        return {
            maxSimultaneousBullets: this.maxSimultaneousBullets
        };
    }
    
    // 清理資源
    cleanup() {
        this.callbacks = {
            onGameStateChange: null,
            onTargetHit: null
        };
        
        this.debugSources = {};
        
        console.log('GameManager cleaned up');
    }
}