class GlamAIApp {
    constructor() {
        this.engine = null;
        this.camera = null;
        this.gallery = null;
        this.aiAssistant = null;
        this.skinAnalyzer = null;
        this.currentPage = 'home';
        this.isInitialized = false;
        
        this.init();
    }
    
    async init() {
        try {
            // Show splash screen
            this.showSplashScreen();
            
            // Initialize core components
            await this.initializeCoreComponents();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Load user preferences
            this.loadUserPreferences();
            
            // Check for first run
            this.checkFirstRun();
            
            // Hide splash screen and show app
            setTimeout(() => {
                this.hideSplashScreen();
                this.showApp();
            }, 2000);
            
            this.isInitialized = true;
            console.log('GlamAI App initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showError('Failed to initialize app. Please refresh the page.');
        }
    }
    
    async initializeCoreComponents() {
        // Initialize Makeup Engine
        this.engine = new GlamAIEngine();
        
        // Initialize Camera Manager
        this.camera = new CameraManager();
        
        // Initialize Gallery Manager
        this.gallery = new GalleryManager();
        
        // Initialize AI Assistant
        this.aiAssistant = new AIAssistant(this.engine);
        
        // Initialize Skin Analyzer
        this.skinAnalyzer = new SkinAnalyzer();
        
        // Initialize other managers
        this.tutorialManager = new TutorialManager();
        this.shopManager = new ShopManager();
        this.shareManager = new ShareManager();
        this.historyManager = new HistoryManager(this.engine);
    }
    
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.footer-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const page = e.currentTarget.dataset.page;
                this.navigateTo(page);
            });
        });
        
        // Camera controls
        document.getElementById('captureBtn').addEventListener('click', () => {
            this.capturePhoto();
        });
        
        document.getElementById('switchCameraBtn').addEventListener('click', () => {
            this.switchCamera();
        });
        
        document.getElementById('toggleFlashBtn').addEventListener('click', () => {
            this.toggleFlash();
        });
        
        // Makeup category buttons
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const category = e.currentTarget.dataset.category;
                this.selectMakeupCategory(category);
            });
        });
        
        // AI Assistant
        document.getElementById('analyzeFaceBtn').addEventListener('click', () => {
            this.analyzeFace();
        });
        
        // Skin Analysis
        document.getElementById('startAnalysisBtn').addEventListener('click', () => {
            this.startSkinAnalysis();
        });
        
        // Presets
        document.querySelectorAll('.preset-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const preset = e.currentTarget.dataset.preset;
                this.applyPreset(preset);
            });
        });
        
        // Social Sharing
        document.querySelectorAll('.share-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const platform = e.currentTarget.dataset.platform;
                this.shareToPlatform(platform);
            });
        });
        
        // Save to gallery
        document.getElementById('saveToGalleryBtn').addEventListener('click', () => {
            this.saveToGallery();
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
        
        // PWA install prompt
        window.addEventListener('beforeinstallprompt', (e) => {
            this.handleInstallPrompt(e);
        });
        
        // Online/offline detection
        window.addEventListener('online', () => this.showToast('Back online', 'success'));
        window.addEventListener('offline', () => this.showToast('You are offline', 'warning'));
    }
    
    async navigateTo(page) {
        if (this.currentPage === page) return;
        
        // Update active button
        document.querySelectorAll('.footer-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.page === page);
        });
        
        // Show loading
        this.showLoading(`Loading ${page}...`);
        
        try {
            switch (page) {
                case 'home':
                    await this.showHomePage();
                    break;
                case 'gallery':
                    await this.showGalleryPage();
                    break;
                case 'tutorials':
                    await this.showTutorialsPage();
                    break;
                case 'shop':
                    await this.showShopPage();
                    break;
                case 'profile':
                    await this.showProfilePage();
                    break;
            }
            
            this.currentPage = page;
            
        } catch (error) {
            console.error(`Failed to navigate to ${page}:`, error);
            this.showToast(`Failed to load ${page}`, 'error');
        } finally {
            this.hideLoading();
        }
    }
    
    async showHomePage() {
        // Default view - show camera
        await this.camera.start();
    }
    
    async showGalleryPage() {
        // Show gallery modal
        const galleryModal = new GalleryModal();
        await galleryModal.show();
    }
    
    async showTutorialsPage() {
        // Show tutorials modal
        const tutorialModal = new TutorialModal();
        await tutorialModal.show();
    }
    
    async showShopPage() {
        // Show shop modal
        const shopModal = new ShopModal();
        await shopModal.show();
    }
    
    async showProfilePage() {
        // Show profile modal
        const profileModal = new ProfileModal();
        await profileModal.show();
    }
    
    async capturePhoto() {
        try {
            this.showLoading('Capturing photo...');
            
            const photoData = await this.camera.capture();
            
            // Process with makeup engine
            const processedPhoto = await this.engine.processImage(photoData);
            
            // Display processed photo
            this.displayPhoto(processedPhoto);
            
            // Save to gallery
            await this.gallery.savePhoto(processedPhoto, {
                makeupSettings: this.engine.getMakeupSettings(),
                timestamp: Date.now()
            });
            
            this.showToast('Photo captured and saved!', 'success');
            
        } catch (error) {
            console.error('Failed to capture photo:', error);
            this.showToast('Failed to capture photo', 'error');
        } finally {
            this.hideLoading();
        }
    }
    
    async analyzeFace() {
        try {
            this.showLoading('Analyzing face...');
            
            const analysis = await this.aiAssistant.analyzeCurrentFace();
            
            // Display recommendations
            this.displayAIRecommendations(analysis);
            
            // Apply suggested makeup
            if (analysis.recommendedLook) {
                this.engine.applyPreset(analysis.recommendedLook);
                this.showToast(`Applied ${analysis.recommendedLook} look`, 'success');
            }
            
        } catch (error) {
            console.error('Face analysis failed:', error);
            this.showToast('Analysis failed. Please try again.', 'error');
        } finally {
            this.hideLoading();
        }
    }
    
    async startSkinAnalysis() {
        try {
            this.showLoading('Analyzing skin...');
            
            const skinData = await this.skinAnalyzer.analyze();
            
            // Display skin metrics
            this.displaySkinMetrics(skinData);
            
            // Show product recommendations
            this.displaySkinRecommendations(skinData.recommendations);
            
            this.showToast('Skin analysis complete!', 'success');
            
        } catch (error) {
            console.error('Skin analysis failed:', error);
            this.showToast('Skin analysis failed', 'error');
        } finally {
            this.hideLoading();
        }
    }
    
    applyPreset(presetName) {
        const success = this.engine.applyPreset(presetName);
        
        if (success) {
            this.showToast(`${presetName} look applied!`, 'success');
            
            // Update UI to reflect changes
            this.updateMakeupUI();
        } else {
            this.showToast('Failed to apply preset', 'error');
        }
    }
    
    selectMakeupCategory(category) {
        // Update active category button
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.category === category);
        });
        
        // Load tools for this category
        this.loadMakeupTools(category);
    }
    
    loadMakeupTools(category) {
        const toolContent = document.getElementById('toolContent');
        
        // This would dynamically load tools based on category
        // For now, show a placeholder
        toolContent.innerHTML = `
            <div class="tool-section">
                <h4>${category.charAt(0).toUpperCase() + category.slice(1)} Tools</h4>
                <p>Select colors and adjust settings for ${category}</p>
                
                <div class="color-picker">
                    <h5>Colors</h5>
                    <div class="color-grid">
                        ${this.generateColorOptions(category)}
                    </div>
                </div>
                
                <div class="slider-group">
                    <div class="slider-item">
                        <label>Intensity</label>
                        <input type="range" min="0" max="100" value="50" class="slider">
                        <span class="slider-value">50%</span>
                    </div>
                </div>
            </div>
        `;
        
        // Setup event listeners for new controls
        this.setupToolControls(category);
    }
    
    generateColorOptions(category) {
        const colorPalettes = {
            foundation: ['#FFE4C4', '#F5DEB3', '#DEB887', '#D2B48C', '#BC8F8F', '#8B4513'],
            blush: ['#FFB6C1', '#FF80AB', '#F06292', '#EC407A', '#D81B60', '#C2185B'],
            lips: ['#FF4081', '#E91E63', '#C2185B', '#AD1457', '#880E4F', '#4A148C'],
            eyeshadow: ['#9C27B0', '#673AB7', '#3F51B5', '#2196F3', '#00BCD4', '#009688']
        };
        
        const colors = colorPalettes[category] || ['#FF4081', '#9C27B0', '#2196F3', '#4CAF50'];
        
        return colors.map(color => `
            <div class="color-option" style="background-color: ${color};" data-color="${color}"></div>
        `).join('');
    }
    
    setupToolControls(category) {
        // Setup color pickers
        document.querySelectorAll('.color-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const color = e.target.dataset.color;
                this.engine.updateMakeupSetting(category, 'color', color);
                this.engine.applyMakeup();
            });
        });
        
        // Setup sliders
        document.querySelectorAll('.slider').forEach(slider => {
            slider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value) / 100;
                const property = this.getPropertyFromLabel(e.target.previousElementSibling.textContent);
                
                this.engine.updateMakeupSetting(category, property, value);
                this.engine.applyMakeup();
                
                // Update display value
                e.target.nextElementSibling.textContent = `${e.target.value}%`;
            });
        });
    }
    
    getPropertyFromLabel(label) {
        const mapping = {
            'Intensity': 'intensity',
            'Opacity': 'opacity',
            'Blend': 'blend',
            'Coverage': 'coverage',
            'Shimmer': 'shimmer'
        };
        
        return mapping[label] || label.toLowerCase();
    }
    
    async shareToPlatform(platform) {
        try {
            this.showLoading('Preparing to share...');
            
            // Get current makeup image
            const imageData = this.engine.exportImage();
            
            // Use share manager
            const success = await this.shareManager.shareToPlatform(platform, imageData);
            
            if (success) {
                this.showToast(`Shared to ${platform}!`, 'success');
            }
            
        } catch (error) {
            console.error(`Failed to share to ${platform}:`, error);
            this.showToast(`Failed to share to ${platform}`, 'error');
        } finally {
            this.hideLoading();
        }
    }
    
    async saveToGallery() {
        try {
            this.showLoading('Saving to gallery...');
            
            await this.gallery.saveCurrentLook(this.engine);
            
            this.showToast('Saved to gallery!', 'success');
            
        } catch (error) {
            console.error('Failed to save to gallery:', error);
            this.showToast('Failed to save', 'error');
        } finally {
            this.hideLoading();
        }
    }
    
    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + S: Save
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            this.saveToGallery();
        }
        
        // Ctrl/Cmd + Z: Undo
        if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
            e.preventDefault();
            if (e.shiftKey) {
                this.engine.redo();
            } else {
                this.engine.undo();
            }
        }
        
        // Ctrl/Cmd + Y: Redo
        if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
            e.preventDefault();
            this.engine.redo();
        }
        
        // Escape: Close modals
        if (e.key === 'Escape') {
            this.closeAllModals();
        }
    }
    
    handleInstallPrompt(e) {
        // Prevent the default prompt
        e.preventDefault();
        
        // Store the event for later use
        this.deferredPrompt = e;
        
        // Show install button
        this.showInstallButton();
    }
    
    showInstallButton() {
        const installBtn = document.createElement('button');
        installBtn.id = 'installBtn';
        installBtn.className = 'install-btn';
        installBtn.innerHTML = '<i class="fas fa-download"></i> Install App';
        installBtn.addEventListener('click', () => this.promptInstall());
        
        document.querySelector('.app-nav').appendChild(installBtn);
    }
    
    async promptInstall() {
        if (!this.deferredPrompt) return;
        
        // Show the install prompt
        this.deferredPrompt.prompt();
        
        // Wait for the user to respond
        const { outcome } = await this.deferredPrompt.userChoice;
        
        // Clear the deferred prompt
        this.deferredPrompt = null;
        
        // Remove install button
        const installBtn = document.getElementById('installBtn');
        if (installBtn) installBtn.remove();
        
        if (outcome === 'accepted') {
            this.showToast('App installed successfully!', 'success');
        }
    }
    
    showSplashScreen() {
        document.getElementById('splashScreen').style.display = 'flex';
    }
    
    hideSplashScreen() {
        document.getElementById('splashScreen').style.display = 'none';
    }
    
    showApp() {
        document.getElementById('app').style.display = 'block';
    }
    
    showLoading(message = 'Loading...') {
        const overlay = document.getElementById('loadingOverlay');
        const messageEl = document.getElementById('loadingMessage');
        
        messageEl.textContent = message;
        overlay.style.display = 'flex';
    }
    
    hideLoading() {
        document.getElementById('loadingOverlay').style.display = 'none';
    }
    
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <i class="fas fa-${this.getToastIcon(type)}"></i>
            <span>${message}</span>
            <button class="toast-close">&times;</button>
        `;
        
        const container = document.getElementById('toastContainer');
        container.appendChild(toast);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            toast.classList.add('toast-hide');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
        
        // Close button
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.remove();
        });
    }
    
    getToastIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }
    
    showError(message) {
        const errorEl = document.createElement('div');
        errorEl.className = 'error-screen';
        errorEl.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <h2>Oops! Something went wrong</h2>
            <p>${message}</p>
            <button class="btn-primary" onclick="location.reload()">Reload App</button>
        `;
        
        document.body.innerHTML = '';
        document.body.appendChild(errorEl);
    }
    
    loadUserPreferences() {
        try {
            const preferences = JSON.parse(localStorage.getItem('glamai_preferences')) || {};
            
            // Apply theme
            if (preferences.darkMode) {
                document.body.classList.add('dark-mode');
            }
            
            // Apply other preferences
            this.userPreferences = preferences;
            
        } catch (error) {
            console.error('Failed to load preferences:', error);
        }
    }
    
    saveUserPreferences() {
        try {
            localStorage.setItem('glamai_preferences', JSON.stringify(this.userPreferences));
        } catch (error) {
            console.error('Failed to save preferences:', error);
        }
    }
    
    checkFirstRun() {
        const hasRunBefore = localStorage.getItem('glamai_first_run');
        
        if (!hasRunBefore) {
            // Show welcome tutorial
            setTimeout(() => {
                this.tutorialManager.showWelcomeTour();
            }, 3000);
            
            localStorage.setItem('glamai_first_run', 'true');
        }
    }
    
    updateMakeupUI() {
        // Update UI to reflect current makeup settings
        // This would update sliders, color pickers, etc.
    }
    
    displayPhoto(photoData) {
        const img = document.getElementById('displayedPhoto');
        const placeholder = document.getElementById('photoPlaceholder');
        
        img.src = photoData;
        img.style.display = 'block';
        placeholder.style.display = 'none';
    }
    
    displayAIRecommendations(analysis) {
        const container = document.getElementById('aiRecommendations');
        
        container.innerHTML = `
            <div class="ai-result">
                <div class="ai-feature">
                    <strong>Skin Tone:</strong> ${analysis.skinTone}
                </div>
                <div class="ai-feature">
                    <strong>Face Shape:</strong> ${analysis.faceShape}
                </div>
                <div class="ai-feature">
                    <strong>Recommended Colors:</strong>
                    <div class="ai-colors">
                        ${analysis.recommendedColors.map(color => `
                            <div class="ai-color" style="background-color: ${color}"></div>
                        `).join('')}
                    </div>
                </div>
                <div class="ai-look">
                    <strong>Suggested Look:</strong> ${analysis.recommendedLook}
                </div>
            </div>
        `;
    }
    
    displaySkinMetrics(skinData) {
        const metrics = document.querySelectorAll('.metric-value');
        
        if (metrics[0]) metrics[0].textContent = skinData.skinTone;
        if (metrics[1]) metrics[1].textContent = skinData.undertone;
        if (metrics[2]) metrics[2].textContent = skinData.skinType;
        if (metrics[3]) metrics[3].textContent = `${skinData.acneScore}/10`;
    }
    
    displaySkinRecommendations(recommendations) {
        const container = document.getElementById('skinRecommendations');
        
        container.innerHTML = `
            <div class="recommendation-list">
                <h5>Product Recommendations:</h5>
                <ul>
                    ${recommendations.products.map(product => `
                        <li>${product.name} - ${product.brand}</li>
                    `).join('')}
                </ul>
                <p class="recommendation-tip">${recommendations.tip}</p>
            </div>
        `;
    }
    
    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.glamaiApp = new GlamAIApp();
});
