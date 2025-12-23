// ============ GLAMAI CORE APP (Optimized) ============

class GlamAICore {
    constructor() {
        console.log('🚀 GlamAI Core Initialized');
        this.isCameraActive = false;
        this.aiLoaded = false;
        this.currentLook = 'natural';
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.updateUI();
    }
    
    setupEventListeners() {
        // Camera controls
        document.getElementById('startCameraBtn').addEventListener('click', () => this.toggleCamera());
        document.getElementById('capturePhotoBtn').addEventListener('click', () => this.capturePhoto());
        document.getElementById('analyzeBtn').addEventListener('click', () => this.analyzeFace());
        
        // Preset looks
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.applyPreset(e.target.dataset.look));
        });
        
        // Advanced features loader
        document.getElementById('toggleAdvanced').addEventListener('click', () => this.loadAdvancedFeatures());
        
        // Range sliders
        document.querySelectorAll('input[type="range"]').forEach(slider => {
            slider.addEventListener('input', (e) => this.updateMakeup(e.target));
        });
    }
    
    async toggleCamera() {
        if (!this.isCameraActive) {
            try {
                await this.startCamera();
            } catch (error) {
                console.error('Camera error:', error);
                this.showNotification('Could not access camera', 'error');
            }
        } else {
            this.stopCamera();
        }
    }
    
    async startCamera() {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
        });
        
        const video = document.getElementById('cameraPreview');
        const placeholder = document.getElementById('cameraPlaceholder');
        
        video.srcObject = stream;
        video.style.display = 'block';
        placeholder.style.display = 'none';
        
        this.isCameraActive = true;
        document.getElementById('startCameraBtn').innerHTML = '<i class="fas fa-video-slash"></i> Stop Camera';
        
        // Lazy load AI when camera starts
        if (!this.aiLoaded) {
            this.loadAI();
        }
    }
    
    stopCamera() {
        const video = document.getElementById('cameraPreview');
        const stream = video.srcObject;
        
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            video.srcObject = null;
            video.style.display = 'none';
            
            document.getElementById('cameraPlaceholder').style.display = 'flex';
            this.isCameraActive = false;
            document.getElementById('startCameraBtn').innerHTML = '<i class="fas fa-video"></i> Start Camera';
        }
    }
    
    async loadAI() {
        console.log('⏳ Lazy loading AI modules...');
        
        try {
            // Load MediaPipe from CDN
            const mediaPipeScript = document.createElement('script');
            mediaPipeScript.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.0/face_mesh.js';
            
            await new Promise((resolve, reject) => {
                mediaPipeScript.onload = resolve;
                mediaPipeScript.onerror = reject;
                document.head.appendChild(mediaPipeScript);
            });
            
            console.log('✅ MediaPipe loaded');
            this.aiLoaded = true;
            this.showNotification('AI models loaded! Ready for analysis', 'success');
            
        } catch (error) {
            console.warn('Could not load AI models:', error);
            this.showNotification('AI features limited (offline mode)', 'warning');
        }
    }
    
    capturePhoto() {
        if (!this.isCameraActive) {
            this.showNotification('Start camera first!', 'warning');
            return;
        }
        
        const video = document.getElementById('cameraPreview');
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);
        
        // Convert to data URL and download
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `glamai-photo-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
        
        this.showNotification('Photo saved!', 'success');
    }
    
    analyzeFace() {
        if (!this.isCameraActive) {
            this.showNotification('Start camera for analysis', 'warning');
            return;
        }
        
        if (!this.aiLoaded) {
            this.showNotification('Loading AI models...', 'info');
            this.loadAI();
            return;
        }
        
        // Simulate AI analysis
        const suggestions = [
            "Your skin tone would suit warm coral lipstick",
            "Try a golden eyeshadow to enhance your eyes",
            "Consider a dewy foundation for natural glow",
            "Your face shape is perfect for winged eyeliner"
        ];
        
        const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
        
        document.getElementById('aiSuggestions').innerHTML = `
            <div style="padding: 10px;">
                <h4 style="margin-bottom: 10px; color: var(--primary);">
                    <i class="fas fa-magic"></i> AI Recommendation
                </h4>
                <p style="color: var(--dark);">${randomSuggestion}</p>
            </div>
        `;
        
        this.showNotification('Face analysis complete!', 'success');
    }
    
    applyPreset(look) {
        this.currentLook = look;
        
        const presets = {
            natural: { lipstick: 30, eyeshadow: 20, blush: 15 },
            glam: { lipstick: 80, eyeshadow: 60, blush: 40 },
            party: { lipstick: 90, eyeshadow: 70, blush: 50 },
            smokey: { lipstick: 40, eyeshadow: 90, blush: 20 }
        };
        
        const preset = presets[look];
        if (preset) {
            const sliders = document.querySelectorAll('input[type="range"]');
            sliders[0].value = preset.lipstick;
            sliders[1].value = preset.eyeshadow;
            sliders[2].value = preset.blush;
            
            this.showNotification(`Applied ${look} look!`, 'success');
        }
    }
    
    updateMakeup(slider) {
        // Update makeup in real-time
        console.log('Updating makeup:', slider.value);
    }
    
    loadAdvancedFeatures() {
        const btn = document.getElementById('toggleAdvanced');
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
        btn.disabled = true;
        
        // Lazy load advanced features
        const features = [
            'src/js/features/ai-suggestions.js',
            'src/js/features/skin-analysis.js',
            'src/js/features/virtual-tryon.js'
        ];
        
        let loaded = 0;
        features.forEach(src => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = () => {
                loaded++;
                if (loaded === features.length) {
                    btn.innerHTML = '<i class="fas fa-check"></i> Advanced Loaded';
                    this.showNotification('Advanced features loaded!', 'success');
                    
                    // Load additional CSS
                    const advancedCSS = document.createElement('link');
                    advancedCSS.rel = 'stylesheet';
                    advancedCSS.href = 'src/css/components.css';
                    document.head.appendChild(advancedCSS);
                }
            };
            document.body.appendChild(script);
        });
    }
    
    showNotification(message, type = 'info') {
        // Create toast notification
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#dc3545' : type === 'success' ? '#28a745' : '#17a2b8'};
            color: white;
            padding: 12px 20px;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            z-index: 1000;
            animation: slideIn 0.3s ease;
            display: flex;
            align-items: center;
            gap: 10px;
        `;
        
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            ${message}
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
        
        // Add CSS animation if not already present
        if (!document.querySelector('#toast-styles')) {
            const style = document.createElement('style');
            style.id = 'toast-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    updateUI() {
        // Initial UI updates
        document.getElementById('app').classList.add('fade-in');
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.glamAI = new GlamAICore();
    console.log('🎉 GlamAI Ready!');
});
