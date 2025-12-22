// src/js/utils/pwa-manager.js
class PWAManager {
    constructor() {
        this.deferredPrompt = null;
        this.installEvent = null;
        this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        this.isAndroid = /Android/.test(navigator.userAgent);
        this.isStandalone = window.matchMedia('(display-mode: standalone)').matches;
        
        this.init();
    }
    
    init() {
        this.setupInstallPrompt();
        this.setupServiceWorker();
        this.checkInstallStatus();
        this.setupOfflineDetection();
    }
    
    setupInstallPrompt() {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            this.installEvent = e;
            
            // Only show install button if not already installed
            if (!this.isStandalone) {
                setTimeout(() => this.showInstallButton(), 3000);
            }
        });
        
        window.addEventListener('appinstalled', () => {
            console.log('PWA installed successfully');
            this.isStandalone = true;
            this.hideInstallButton();
            this.showInstallSuccess();
            
            // Track installation
            this.trackInstall();
        });
        
        // Detect if already installed
        if (this.isStandalone) {
            console.log('App is running in standalone mode');
        }
    }
    
    setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/service-worker.js')
                    .then(registration => {
                        console.log('ServiceWorker registration successful');
                        
                        // Check for updates
                        registration.addEventListener('updatefound', () => {
                            const newWorker = registration.installing;
                            console.log('New service worker found');
                            
                            newWorker.addEventListener('statechange', () => {
                                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                    this.showUpdateAvailable();
                                }
                            });
                        });
                    })
                    .catch(err => console.log('ServiceWorker registration failed: ', err));
            });
        }
    }
    
    showInstallButton() {
        // Don't show if already installed or button exists
        if (this.isStandalone || document.getElementById('installBtn')) return;
        
        const installBtn = document.createElement('button');
        installBtn.id = 'installBtn';
        installBtn.className = 'pwa-install-btn';
        installBtn.innerHTML = `
            <i class="fas fa-download"></i>
            <span>Install App</span>
        `;
        installBtn.title = 'Install GlamAI on your device';
        
        installBtn.addEventListener('click', () => this.showInstallDialog());
        
        // Add to UI
        const header = document.querySelector('.app-header') || 
                      document.querySelector('header') || 
                      document.body;
        
        const existingBtn = header.querySelector('#installBtn');
        if (!existingBtn) {
            header.appendChild(installBtn);
            
            // Auto-hide after 10 seconds
            setTimeout(() => {
                if (installBtn.parentNode) {
                    installBtn.style.opacity = '0.5';
                }
            }, 10000);
        }
    }
    
    showInstallDialog() {
        if (this.isIOS) {
            this.showIOSInstructions();
        } else if (this.deferredPrompt) {
            this.promptInstall();
        } else {
            this.showGenericInstructions();
        }
    }
    
    async promptInstall() {
        if (!this.deferredPrompt) return;
        
        try {
            this.deferredPrompt.prompt();
            const { outcome } = await this.deferredPrompt.userChoice;
            
            if (outcome === 'accepted') {
                console.log('User accepted PWA installation');
                this.trackEvent('install_accepted');
            } else {
                console.log('User dismissed PWA installation');
                this.trackEvent('install_dismissed');
            }
            
            this.deferredPrompt = null;
            this.hideInstallButton();
            
        } catch (error) {
            console.error('Install prompt failed:', error);
        }
    }
    
    showIOSInstructions() {
        const modal = document.createElement('div');
        modal.className = 'ios-install-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>📱 Install GlamAI on iPhone</h3>
                <div class="instructions">
                    <div class="step">
                        <div class="step-number">1</div>
                        <p>Tap the <strong>Share button</strong> <i class="fas fa-share-square"></i></p>
                    </div>
                    <div class="step">
                        <div class="step-number">2</div>
                        <p>Scroll down and tap <strong>"Add to Home Screen"</strong></p>
                    </div>
                    <div class="step">
                        <div class="step-number">3</div>
                        <p>Tap <strong>"Add"</strong> in top right corner</p>
                    </div>
                </div>
                <button class="btn-close">Got it!</button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        modal.querySelector('.btn-close').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }
    
    showGenericInstructions() {
        const modal = document.createElement('div');
        modal.className = 'install-instructions-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Install GlamAI App</h3>
                <p>To install this app on your device:</p>
                
                <div class="platforms">
                    <div class="platform">
                        <h4><i class="fab fa-android"></i> Android</h4>
                        <p>• Tap menu (3 dots) → "Install app" or "Add to Home screen"</p>
                    </div>
                    <div class="platform">
                        <h4><i class="fab fa-apple"></i> iPhone/iPad</h4>
                        <p>• Tap Share button → "Add to Home Screen"</p>
                    </div>
                    <div class="platform">
                        <h4><i class="fab fa-windows"></i> Windows</h4>
                        <p>• Click the install button in address bar</p>
                    </div>
                </div>
                
                <div class="benefits">
                    <h4>Benefits of installing:</h4>
                    <ul>
                        <li><i class="fas fa-check"></i> Works offline</li>
                        <li><i class="fas fa-check"></i> Faster loading</li>
                        <li><i class="fas fa-check"></i> App icon on home screen</li>
                        <li><i class="fas fa-check"></i> Push notifications</li>
                    </ul>
                </div>
                
                <button class="btn-primary btn-close">Close</button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        modal.querySelector('.btn-close').addEventListener('click', () => {
            modal.remove();
        });
    }
    
    hideInstallButton() {
        const installBtn = document.getElementById('installBtn');
        if (installBtn) installBtn.remove();
        
        // Also remove any instruction modals
        const modals = document.querySelectorAll('.ios-install-modal, .install-instructions-modal');
        modals.forEach(modal => modal.remove());
    }
    
    showInstallSuccess() {
        const success = document.createElement('div');
        success.className = 'install-success';
        success.innerHTML = `
            <div class="success-content">
                <i class="fas fa-check-circle"></i>
                <h3>App Installed Successfully! 🎉</h3>
                <p>You can now find GlamAI on your home screen</p>
                <button class="btn-close">Continue</button>
            </div>
        `;
        
        document.body.appendChild(success);
        
        setTimeout(() => {
            if (success.parentNode) success.remove();
        }, 5000);
        
        success.querySelector('.btn-close').addEventListener('click', () => {
            success.remove();
        });
    }
    
    showUpdateAvailable() {
        const updateBanner = document.createElement('div');
        updateBanner.className = 'update-banner';
        updateBanner.innerHTML = `
            <p>New version available!</p>
            <button class="btn-update">Update Now</button>
            <button class="btn-dismiss">Later</button>
        `;
        
        document.body.appendChild(updateBanner);
        
        updateBanner.querySelector('.btn-update').addEventListener('click', () => {
            window.location.reload();
        });
        
        updateBanner.querySelector('.btn-dismiss').addEventListener('click', () => {
            updateBanner.remove();
        });
    }
    
    setupOfflineDetection() {
        window.addEventListener('online', () => {
            this.showToast('You are back online', 'success');
        });
        
        window.addEventListener('offline', () => {
            this.showToast('You are offline. Some features may not work.', 'warning');
        });
    }
    
    checkInstallStatus() {
        // Check if app was previously installed
        const wasInstalled = localStorage.getItem('pwa_installed');
        if (wasInstalled) {
            this.isStandalone = true;
        }
    }
    
    trackInstall() {
        localStorage.setItem('pwa_installed', 'true');
        // Send analytics
        this.trackEvent('pwa_installed');
    }
    
    trackEvent(eventName) {
        // Implement your analytics here
        console.log(`Event: ${eventName}`);
        
        // Example with Google Analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, {
                'event_category': 'PWA',
                'event_label': 'installation'
            });
        }
    }
    
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('toast-hide');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Initialize globally
window.pwaManager = new PWAManager();
