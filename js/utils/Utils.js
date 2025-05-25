/**
 * 工具函式庫
 * 提供各種實用的輔助函式
 */
class Utils {
    // 角度與弧度轉換
    static degToRad(degrees) {
        return degrees * Math.PI / 180;
    }
    
    static radToDeg(radians) {
        return radians * 180 / Math.PI;
    }
    
    // 數值限制
    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }
    
    // 線性插值
    static lerp(a, b, t) {
        return a + (b - a) * t;
    }
    
    // 平滑步進
    static smoothstep(edge0, edge1, x) {
        const t = this.clamp((x - edge0) / (edge1 - edge0), 0, 1);
        return t * t * (3 - 2 * t);
    }
    
    // 隨機數生成
    static randomFloat(min, max) {
        return Math.random() * (max - min) + min;
    }
    
    static randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    // 數組洗牌
    static shuffle(array) {
        const result = [...array];
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }
    
    // 延遲執行
    static delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // 防抖動
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // 節流
    static throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
    
    // 格式化數字
    static formatNumber(num, decimals = 2) {
        return Number(num).toFixed(decimals);
    }
    
    // 格式化時間
    static formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    // 顏色轉換
    static hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16) / 255,
            g: parseInt(result[2], 16) / 255,
            b: parseInt(result[3], 16) / 255
        } : null;
    }
    
    static rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (Math.round(r * 255) << 16) + 
                      (Math.round(g * 255) << 8) + Math.round(b * 255))
                      .toString(16).slice(1);
    }
    
    // HSV 轉 RGB
    static hsvToRgb(h, s, v) {
        let r, g, b;
        const i = Math.floor(h * 6);
        const f = h * 6 - i;
        const p = v * (1 - s);
        const q = v * (1 - f * s);
        const t = v * (1 - (1 - f) * s);
        
        switch (i % 6) {
            case 0: r = v, g = t, b = p; break;
            case 1: r = q, g = v, b = p; break;
            case 2: r = p, g = v, b = t; break;
            case 3: r = p, g = q, b = v; break;
            case 4: r = t, g = p, b = v; break;
            case 5: r = v, g = p, b = q; break;
        }
        
        return [r, g, b];
    }
    
    // 碰撞檢測
    static sphereCollision(pos1, radius1, pos2, radius2) {
        const dx = pos1[0] - pos2[0];
        const dy = pos1[1] - pos2[1];
        const dz = pos1[2] - pos2[2];
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        return distance <= (radius1 + radius2);
    }
    
    static rayBoxIntersection(rayOrigin, rayDirection, boxMin, boxMax) {
        const invDir = [1 / rayDirection[0], 1 / rayDirection[1], 1 / rayDirection[2]];
        
        const t1 = (boxMin[0] - rayOrigin[0]) * invDir[0];
        const t2 = (boxMax[0] - rayOrigin[0]) * invDir[0];
        const t3 = (boxMin[1] - rayOrigin[1]) * invDir[1];
        const t4 = (boxMax[1] - rayOrigin[1]) * invDir[1];
        const t5 = (boxMin[2] - rayOrigin[2]) * invDir[2];
        const t6 = (boxMax[2] - rayOrigin[2]) * invDir[2];
        
        const tmin = Math.max(Math.max(Math.min(t1, t2), Math.min(t3, t4)), Math.min(t5, t6));
        const tmax = Math.min(Math.min(Math.max(t1, t2), Math.max(t3, t4)), Math.max(t5, t6));
        
        if (tmax < 0 || tmin > tmax) return null;
        
        const t = tmin < 0 ? tmax : tmin;
        return [
            rayOrigin[0] + rayDirection[0] * t,
            rayOrigin[1] + rayDirection[1] * t,
            rayOrigin[2] + rayDirection[2] * t
        ];
    }
    
    // 性能監控
    static createPerformanceMonitor() {
        return {
            frameCount: 0,
            lastTime: performance.now(),
            fps: 0,
            frameTime: 0,
            
            update() {
                const currentTime = performance.now();
                this.frameTime = currentTime - this.lastTime;
                this.lastTime = currentTime;
                this.frameCount++;
                
                if (this.frameCount % 60 === 0) {
                    this.fps = Math.round(1000 / this.frameTime);
                }
            },
            
            getFPS() {
                return this.fps;
            },
            
            getFrameTime() {
                return this.frameTime;
            }
        };
    }
    
    // 日誌工具
    static createLogger(prefix = 'Game') {
        return {
            log(message, ...args) {
                console.log(`[${prefix}] ${message}`, ...args);
            },
            
            warn(message, ...args) {
                console.warn(`[${prefix}] ${message}`, ...args);
            },
            
            error(message, ...args) {
                console.error(`[${prefix}] ${message}`, ...args);
            },
            
            debug(message, ...args) {
                if (this.debugMode) {
                    console.log(`[${prefix}:DEBUG] ${message}`, ...args);
                }
            },
            
            debugMode: false
        };
    }
    
    // 事件發射器
    static createEventEmitter() {
        const events = new Map();
        
        return {
            on(event, callback) {
                if (!events.has(event)) {
                    events.set(event, []);
                }
                events.get(event).push(callback);
            },
            
            off(event, callback) {
                if (events.has(event)) {
                    const callbacks = events.get(event);
                    const index = callbacks.indexOf(callback);
                    if (index > -1) {
                        callbacks.splice(index, 1);
                    }
                }
            },
            
            emit(event, ...args) {
                if (events.has(event)) {
                    events.get(event).forEach(callback => {
                        try {
                            callback(...args);
                        } catch (error) {
                            console.error(`Error in event callback for ${event}:`, error);
                        }
                    });
                }
            },
            
            once(event, callback) {
                const onceCallback = (...args) => {
                    callback(...args);
                    this.off(event, onceCallback);
                };
                this.on(event, onceCallback);
            }
        };
    }
    
    // 簡單的狀態機
    static createStateMachine(initialState, states) {
        let currentState = initialState;
        
        return {
            getCurrentState() {
                return currentState;
            },
            
            canTransition(newState) {
                const state = states[currentState];
                return state && state.transitions && state.transitions.includes(newState);
            },
            
            transition(newState) {
                if (this.canTransition(newState)) {
                    const oldState = currentState;
                    
                    // 執行離開回調
                    if (states[oldState] && states[oldState].onExit) {
                        states[oldState].onExit();
                    }
                    
                    currentState = newState;
                    
                    // 執行進入回調
                    if (states[newState] && states[newState].onEnter) {
                        states[newState].onEnter();
                    }
                    
                    return true;
                }
                return false;
            },
            
            update(...args) {
                const state = states[currentState];
                if (state && state.update) {
                    state.update(...args);
                }
            }
        };
    }
    
    // 載入資源
    static async loadImage(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = url;
        });
    }
    
    static async loadText(url) {
        try {
            const response = await fetch(url);
            return await response.text();
        } catch (error) {
            throw new Error(`Failed to load text from ${url}: ${error.message}`);
        }
    }
    
    // 深拷貝
    static deepClone(obj) {
        if (obj === null || typeof obj !== "object") return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        if (obj instanceof Object) {
            const clonedObj = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    clonedObj[key] = this.deepClone(obj[key]);
                }
            }
            return clonedObj;
        }
    }
    
    // 檢查是否為移動設備
    static isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    // 檢查 WebGL 支持
    static checkWebGLSupport() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            return !!gl;
        } catch (e) {
            return false;
        }
    }
}

// 全域工具函式
window.Utils = Utils;