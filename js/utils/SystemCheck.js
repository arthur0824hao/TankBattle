/**
 * 系統檢查器
 * 檢查瀏覽器相容性和系統需求
 */
class SystemCheck {
    constructor() {
        this.requirements = {
            webgl: true,
            canvas: true,
            es6: true,
            performance: true
        };
        
        this.results = {};
        this.warnings = [];
        this.errors = [];
    }
    
    // 執行所有檢查
    checkAll() {
        console.log('Running system compatibility checks...');
        
        this.checkWebGLSupport();
        this.checkCanvasSupport();
        this.checkES6Support();
        this.checkPerformanceAPI();
        this.checkMemory();
        this.checkScreenSize();
        
        return this.generateReport();
    }
    
    // 檢查 WebGL 支援
    checkWebGLSupport() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            
            if (!gl) {
                this.results.webgl = false;
                this.errors.push('WebGL 不被支援。請使用現代瀏覽器。');
                return;
            }
            
            this.results.webgl = {
                supported: true,
                version: gl.getParameter(gl.VERSION),
                vendor: gl.getParameter(gl.VENDOR),
                renderer: gl.getParameter(gl.RENDERER),
                glslVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
                maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
                maxTextureUnits: gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS),
                maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS)
            };
            
            // 檢查擴展
            const extensions = {
                depthTexture: !!gl.getExtension('WEBGL_depth_texture'),
                floatTexture: !!gl.getExtension('OES_texture_float'),
                vertexArrayObject: !!gl.getExtension('OES_vertex_array_object'),
                anisotropicFiltering: !!gl.getExtension('EXT_texture_filter_anisotropic')
            };
            
            this.results.webgl.extensions = extensions;
            
            // 警告缺失的擴展
            if (!extensions.depthTexture) {
                this.warnings.push('深度紋理擴展不可用 - 陰影效果可能受限');
            }
            if (!extensions.floatTexture) {
                this.warnings.push('浮點紋理擴展不可用 - HDR效果可能受限');
            }
            
        } catch (error) {
            this.results.webgl = false;
            this.errors.push('WebGL 檢查失敗：' + error.message);
        }
    }
    
    // 檢查 Canvas 支援
    checkCanvasSupport() {
        try {
            const canvas = document.createElement('canvas');
            const ctx2d = canvas.getContext('2d');
            
            this.results.canvas = {
                supported: !!ctx2d,
                maxSize: this.getMaxCanvasSize()
            };
            
            if (!ctx2d) {
                this.errors.push('Canvas 2D 不被支援');
            }
            
        } catch (error) {
            this.results.canvas = false;
            this.errors.push('Canvas 檢查失敗：' + error.message);
        }
    }
    
    // 檢查 ES6 支援
    checkES6Support() {
        const features = {
            classes: false,
            arrowFunctions: false,
            const: false,
            let: false,
            destructuring: false,
            modules: false,
            promises: false
        };
        
        try {
            // 檢查 class
            eval('class TestClass {}');
            features.classes = true;
        } catch (e) {
            this.errors.push('ES6 類別語法不被支援');
        }
        
        try {
            // 檢查箭頭函數
            eval('const arrow = () => {}');
            features.arrowFunctions = true;
        } catch (e) {
            this.warnings.push('ES6 箭頭函數不被支援');
        }
        
        try {
            // 檢查 const/let
            eval('const constTest = 1; let letTest = 2;');
            features.const = true;
            features.let = true;
        } catch (e) {
            this.warnings.push('ES6 變數宣告語法部分不被支援');
        }
        
        // 檢查 Promise
        features.promises = typeof Promise !== 'undefined';
        if (!features.promises) {
            this.errors.push('Promise 不被支援');
        }
        
        this.results.es6 = features;
    }
    
    // 檢查效能 API
    checkPerformanceAPI() {
        this.results.performance = {
            performanceNow: typeof performance !== 'undefined' && typeof performance.now === 'function',
            requestAnimationFrame: typeof requestAnimationFrame === 'function',
            highResTime: false
        };
        
        if (this.results.performance.performanceNow) {
            // 檢查高解析度時間
            const start = performance.now();
            const end = performance.now();
            this.results.performance.highResTime = (end - start) !== 0 || end > start;
        }
        
        if (!this.results.performance.requestAnimationFrame) {
            this.errors.push('requestAnimationFrame 不被支援');
        }
    }
    
    // 檢查記憶體狀況
    checkMemory() {
        const memory = {
            available: false,
            jsHeapSizeLimit: 0,
            totalJSHeapSize: 0,
            usedJSHeapSize: 0
        };
        
        if (performance.memory) {
            memory.available = true;
            memory.jsHeapSizeLimit = performance.memory.jsHeapSizeLimit;
            memory.totalJSHeapSize = performance.memory.totalJSHeapSize;
            memory.usedJSHeapSize = performance.memory.usedJSHeapSize;
            
            // 檢查記憶體是否充足（建議至少 100MB）
            const availableMemory = memory.jsHeapSizeLimit - memory.usedJSHeapSize;
            const minimumRequired = 100 * 1024 * 1024; // 100MB
            
            if (availableMemory < minimumRequired) {
                this.warnings.push('可用記憶體可能不足，遊戲性能可能受影響');
            }
        }
        
        this.results.memory = memory;
    }
    
    // 檢查螢幕尺寸
    checkScreenSize() {
        const screen = {
            width: window.screen.width,
            height: window.screen.height,
            availableWidth: window.screen.availWidth,
            availableHeight: window.screen.availHeight,
            pixelRatio: window.devicePixelRatio || 1
        };
        
        // 檢查最小解析度建議
        if (screen.width < 1024 || screen.height < 768) {
            this.warnings.push('螢幕解析度較低，建議使用 1024x768 以上解析度以獲得最佳體驗');
        }
        
        // 檢查高DPI螢幕
        if (screen.pixelRatio > 2) {
            this.warnings.push('高DPI螢幕可能影響性能，建議調整瀏覽器縮放設定');
        }
        
        this.results.screen = screen;
    }
    
    // 獲取最大 Canvas 尺寸
    getMaxCanvasSize() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        let maxSize = 2048; // 保守估計
        
        // 二分搜尋法找出最大尺寸
        let min = 1;
        let max = 32768;
        
        while (min < max) {
            const test = Math.floor((min + max) / 2);
            canvas.width = test;
            canvas.height = test;
            
            if (canvas.width === test && canvas.height === test) {
                min = test + 1;
                maxSize = test;
            } else {
                max = test;
            }
        }
        
        return maxSize;
    }
    
    // 生成檢查報告
    generateReport() {
        const report = {
            compatible: this.errors.length === 0,
            results: this.results,
            warnings: this.warnings,
            errors: this.errors,
            recommendations: this.generateRecommendations()
        };
        
        console.log('System check complete:', report);
        return report;
    }
    
    // 生成建議
    generateRecommendations() {
        const recommendations = [];
        
        if (!this.results.webgl || !this.results.webgl.supported) {
            recommendations.push('請更新瀏覽器至最新版本或使用支援 WebGL 的瀏覽器（Chrome、Firefox、Safari、Edge）');
        }
        
        if (this.warnings.some(w => w.includes('記憶體'))) {
            recommendations.push('關閉其他瀏覽器分頁以釋放記憶體');
        }
        
        if (this.warnings.some(w => w.includes('解析度'))) {
            recommendations.push('在全螢幕或較大視窗中遊玩以獲得最佳體驗');
        }
        
        if (this.warnings.some(w => w.includes('DPI'))) {
            recommendations.push('如遇到性能問題，請嘗試調整瀏覽器縮放至100%');
        }
        
        return recommendations;
    }
    
    // 顯示相容性報告
    displayReport(report) {
        if (!report.compatible) {
            this.showErrorDialog(report);
        } else if (report.warnings.length > 0) {
            this.showWarningDialog(report);
        }
    }
    
    // 顯示錯誤對話框
    showErrorDialog(report) {
        const dialog = document.createElement('div');
        dialog.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            font-family: Arial, sans-serif;
        `;
        
        dialog.innerHTML = `
            <div style="background: #2c3e50; padding: 30px; border-radius: 10px; max-width: 500px; color: white; text-align: center;">
                <h2 style="color: #e74c3c; margin-bottom: 20px;">⚠️ 相容性問題</h2>
                <p style="margin-bottom: 20px;">您的瀏覽器不支援運行此遊戲所需的功能：</p>
                <ul style="text-align: left; margin: 20px 0; list-style: none; padding: 0;">
                    ${report.errors.map(error => `<li style="margin: 10px 0; color: #e74c3c;">• ${error}</li>`).join('')}
                </ul>
                <div style="margin-top: 20px;">
                    <h3 style="color: #f39c12;">建議解決方案：</h3>
                    <ul style="text-align: left; margin: 20px 0; list-style: none; padding: 0;">
                        ${report.recommendations.map(rec => `<li style="margin: 10px 0; color: #3498db;">• ${rec}</li>`).join('')}
                    </ul>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" 
                        style="background: #e74c3c; border: none; color: white; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-top: 20px;">
                    關閉
                </button>
            </div>
        `;
        
        document.body.appendChild(dialog);
    }
    
    // 顯示警告對話框
    showWarningDialog(report) {
        const dialog = document.createElement('div');
        dialog.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 20px;
            border-radius: 10px;
            max-width: 400px;
            z-index: 9999;
            font-family: Arial, sans-serif;
            border: 2px solid #f39c12;
        `;
        
        dialog.innerHTML = `
            <h3 style="color: #f39c12; margin: 0 0 15px 0;">⚠️ 注意事項</h3>
            <ul style="margin: 0; padding-left: 20px;">
                ${report.warnings.map(warning => `<li style="margin: 5px 0;">${warning}</li>`).join('')}
            </ul>
            <button onclick="this.parentElement.remove()" 
                    style="background: #f39c12; border: none; color: white; padding: 8px 16px; border-radius: 5px; cursor: pointer; margin-top: 15px; float: right;">
                確定
            </button>
            <div style="clear: both;"></div>
        `;
        
        document.body.appendChild(dialog);
        
        // 10秒後自動關閉
        setTimeout(() => {
            if (dialog.parentElement) {
                dialog.parentElement.removeChild(dialog);
            }
        }, 10000);
    }
}

// 全域系統檢查器
window.SystemCheck = SystemCheck;