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

/**
 * 座標空間轉換工具類
 * 提供統一的世界座標提取和轉換功能
 */
class CoordinateUtils {
    /**
     * 從 4x4 變換矩陣中提取世界座標
     * @param {Float32Array|Array} matrix - 4x4變換矩陣 (column-major)
     * @returns {Array} [x, y, z] 世界座標
     */
    static extractWorldPosition(matrix) {
        if (!matrix || matrix.length < 16) {
            console.warn('Invalid matrix for world position extraction');
            return [0, 0, 0];
        }
        
        // 4x4矩陣的平移部分在 [12], [13], [14] (column-major)
        return [
            matrix[12], // X
            matrix[13], // Y
            matrix[14]  // Z
        ];
    }
    
    /**
     * 從變換矩陣中提取縮放係數
     * @param {Float32Array|Array} matrix - 4x4變換矩陣
     * @returns {Array} [scaleX, scaleY, scaleZ] 縮放係數
     */
    static extractScale(matrix) {
        if (!matrix || matrix.length < 16) {
            return [1, 1, 1];
        }
        
        // 計算每個軸的縮放
        const scaleX = Math.sqrt(matrix[0] * matrix[0] + matrix[1] * matrix[1] + matrix[2] * matrix[2]);
        const scaleY = Math.sqrt(matrix[4] * matrix[4] + matrix[5] * matrix[5] + matrix[6] * matrix[6]);
        const scaleZ = Math.sqrt(matrix[8] * matrix[8] + matrix[9] * matrix[9] + matrix[10] * matrix[10]);
        
        return [scaleX, scaleY, scaleZ];
    }
    
    /**
     * 從變換矩陣中提取旋轉(歐拉角)
     * @param {Float32Array|Array} matrix - 4x4變換矩陣
     * @returns {Array} [rotX, rotY, rotZ] 旋轉角度(弧度)
     */
    static extractRotation(matrix) {
        if (!matrix || matrix.length < 16) {
            return [0, 0, 0];
        }
        
        // 提取旋轉矩陣部分(去除縮放)
        const scale = this.extractScale(matrix);
        
        const m11 = matrix[0] / scale[0];
        const m12 = matrix[1] / scale[0]; 
        const m13 = matrix[2] / scale[0];
        const m21 = matrix[4] / scale[1];
        const m22 = matrix[5] / scale[1];
        const m23 = matrix[6] / scale[1];
        const m31 = matrix[8] / scale[2];
        const m32 = matrix[9] / scale[2];
        const m33 = matrix[10] / scale[2];
        
        // 計算歐拉角
        let rotX, rotY, rotZ;
        
        if (m13 < 1) {
            if (m13 > -1) {
                rotY = Math.asin(m13);
                rotX = Math.atan2(-m23, m33);
                rotZ = Math.atan2(-m12, m11);
            } else {
                rotY = -Math.PI / 2;
                rotX = -Math.atan2(m21, m22);
                rotZ = 0;
            }
        } else {
            rotY = Math.PI / 2;
            rotX = Math.atan2(m21, m22);
            rotZ = 0;
        }
        
        return [rotX, rotY, rotZ];
    }
    
    /**
     * 計算兩點間的歐幾里得距離
     * @param {Array} pos1 - 第一個位置 [x, y, z]
     * @param {Array} pos2 - 第二個位置 [x, y, z]
     * @returns {number} 距離
     */
    static calculateDistance(pos1, pos2) {
        const dx = pos1[0] - pos2[0];
        const dy = pos1[1] - pos2[1];
        const dz = pos1[2] - pos2[2];
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    
    /**
     * 計算兩點間的平面距離(忽略Y軸)
     * @param {Array} pos1 - 第一個位置 [x, y, z]
     * @param {Array} pos2 - 第二個位置 [x, y, z]
     * @returns {number} 平面距離
     */
    static calculateDistance2D(pos1, pos2) {
        const dx = pos1[0] - pos2[0];
        const dz = pos1[2] - pos2[2];
        return Math.sqrt(dx * dx + dz * dz);
    }
    
    /**
     * 檢查點是否在球體範圍內
     * @param {Array} point - 檢查的點 [x, y, z]
     * @param {Array} sphereCenter - 球體中心 [x, y, z]
     * @param {number} sphereRadius - 球體半徑
     * @returns {boolean} 是否在範圍內
     */
    static isPointInSphere(point, sphereCenter, sphereRadius) {
        const distance = this.calculateDistance(point, sphereCenter);
        return distance <= sphereRadius;
    }
    
    /**
     * 檢查兩個球體是否相交
     * @param {Array} center1 - 第一個球體中心
     * @param {number} radius1 - 第一個球體半徑
     * @param {Array} center2 - 第二個球體中心
     * @param {number} radius2 - 第二個球體半徑
     * @returns {boolean} 是否相交
     */
    static sphereIntersection(center1, radius1, center2, radius2) {
        const distance = this.calculateDistance(center1, center2);
        return distance <= (radius1 + radius2);
    }
    
    /**
     * 線性插值兩個位置
     * @param {Array} pos1 - 起始位置 [x, y, z]
     * @param {Array} pos2 - 結束位置 [x, y, z]
     * @param {number} t - 插值參數 (0-1)
     * @returns {Array} 插值結果 [x, y, z]
     */
    static lerpPosition(pos1, pos2, t) {
        return [
            pos1[0] + (pos2[0] - pos1[0]) * t,
            pos1[1] + (pos2[1] - pos1[1]) * t,
            pos1[2] + (pos2[2] - pos1[2]) * t
        ];
    }
    
    /**
     * 標準化位置向量
     * @param {Array} position - 位置向量 [x, y, z]
     * @returns {Array} 標準化後的向量
     */
    static normalizePosition(position) {
        const length = Math.sqrt(
            position[0] * position[0] + 
            position[1] * position[1] + 
            position[2] * position[2]
        );
        
        if (length === 0) return [0, 0, 0];
        
        return [
            position[0] / length,
            position[1] / length,
            position[2] / length
        ];
    }
    
    /**
     * 檢查位置是否在邊界內
     * @param {Array} position - 檢查的位置 [x, y, z]
     * @param {Object} bounds - 邊界 {min: [x,y,z], max: [x,y,z]}
     * @returns {boolean} 是否在邊界內
     */
    static isPositionInBounds(position, bounds) {
        return (
            position[0] >= bounds.min[0] && position[0] <= bounds.max[0] &&
            position[1] >= bounds.min[1] && position[1] <= bounds.max[1] &&
            position[2] >= bounds.min[2] && position[2] <= bounds.max[2]
        );
    }
    
    /**
     * 將位置限制在邊界內
     * @param {Array} position - 位置 [x, y, z]
     * @param {Object} bounds - 邊界 {min: [x,y,z], max: [x,y,z]}
     * @returns {Array} 限制後的位置
     */
    static clampPositionToBounds(position, bounds) {
        return [
            Math.max(bounds.min[0], Math.min(bounds.max[0], position[0])),
            Math.max(bounds.min[1], Math.min(bounds.max[1], position[1])),
            Math.max(bounds.min[2], Math.min(bounds.max[2], position[2]))
        ];
    }
}

// 碰撞檢測專用工具
class CollisionUtils {
    /**
     * 球體與球體碰撞檢測
     * @param {Object} sphere1 - {position: [x,y,z], radius: number}
     * @param {Object} sphere2 - {position: [x,y,z], radius: number}
     * @returns {Object} {hit: boolean, distance: number, penetration: number}
     */
    static sphereToSphere(sphere1, sphere2) {
        const distance = CoordinateUtils.calculateDistance(sphere1.position, sphere2.position);
        const combinedRadius = sphere1.radius + sphere2.radius;
        const hit = distance <= combinedRadius;
        const penetration = hit ? combinedRadius - distance : 0;
        
        return {
            hit,
            distance,
            penetration
        };
    }
    
    /**
     * 射線與球體相交檢測
     * @param {Object} ray - {origin: [x,y,z], direction: [x,y,z]}
     * @param {Object} sphere - {position: [x,y,z], radius: number}
     * @returns {Object} {hit: boolean, distance: number, point: [x,y,z]}
     */
    static rayToSphere(ray, sphere) {
        const oc = [
            ray.origin[0] - sphere.position[0],
            ray.origin[1] - sphere.position[1], 
            ray.origin[2] - sphere.position[2]
        ];
        
        const a = ray.direction[0] * ray.direction[0] + 
                  ray.direction[1] * ray.direction[1] + 
                  ray.direction[2] * ray.direction[2];
        
        const b = 2.0 * (oc[0] * ray.direction[0] + 
                         oc[1] * ray.direction[1] + 
                         oc[2] * ray.direction[2]);
        
        const c = oc[0] * oc[0] + oc[1] * oc[1] + oc[2] * oc[2] - 
                  sphere.radius * sphere.radius;
        
        const discriminant = b * b - 4 * a * c;
        
        if (discriminant < 0) {
            return { hit: false, distance: Infinity, point: null };
        }
        
        const t = (-b - Math.sqrt(discriminant)) / (2 * a);
        
        if (t < 0) {
            return { hit: false, distance: Infinity, point: null };
        }
        
        const hitPoint = [
            ray.origin[0] + t * ray.direction[0],
            ray.origin[1] + t * ray.direction[1],
            ray.origin[2] + t * ray.direction[2]
        ];
        
        return {
            hit: true,
            distance: t,
            point: hitPoint
        };
    }
}

// 在全域範圍內註冊工具類
if (typeof window !== 'undefined') {
    window.CoordinateUtils = CoordinateUtils;
    window.CollisionUtils = CollisionUtils;
}