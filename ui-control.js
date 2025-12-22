class UIControls {
    constructor(makeupEngine) {
        this.engine = makeupEngine;
        this.currentCategory = 'lips';
        this.initControls();
        this.bindEvents();
        this.loadCategoryControls('lips');
    }
    
    initControls() {
        // Define controls for each makeup category
        this.categoryControls = {
            lips: {
                colors: [
                    '#ff4081', '#d81b60', '#c2185b', '#880e4f',
                    '#ff8a80', '#ff5252', '#ff1744', '#d50000',
                    '#f50057', '#c51162', '#ff80ab', '#ff4081'
                ],
                sliders: [
                    { id: 'lipOpacity', label: 'Opacity', min: 0, max: 1, step: 0.1, value: 0.7 },
                    { id: 'lipShine', label: 'Shine', min: 0, max: 1, step: 0.1, value: 0.5 }
                ],
                types: [
                    { id: 'matte', label: 'Matte', icon: 'fas fa-square' },
                    { id: 'gloss', label: 'Gloss', icon: 'fas fa-sun' },
                    { id: 'satin', label: 'Satin', icon: 'fas fa-circle' }
                ]
            },
            eyes: {
                colors: [
                    '#9c27b0', '#673ab7', '#3f51b5', '#2196f3',
                    '#03a9f4', '#00bcd4', '#009688', '#4caf50',
                    '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107'
                ],
                sliders: [
                    { id: 'eyeOpacity', label: 'Opacity', min: 0, max: 1, step: 0.1, value: 0.5 },
                    { id: 'eyeBlend', label: 'Blend', min: 0, max: 1, step: 0.1, value: 0.7 }
                ]
            },
            cheeks: {
                colors: [
                    '#ff80ab', '#f06292', '#ec407a', '#e91e63',
                    '#d81b60', '#c2185b', '#ad1457', '#880e4f',
                    '#ffcdd2', '#f8bbd9', '#e1bee7', '#d1c4e9'
                ],
                sliders: [
                    { id: 'blushOpacity', label: 'Opacity', min: 0, max: 1, step: 0.1, value: 0.4 },
                    { id: 'blushRadius', label: 'Radius', min: 10, max: 60, step: 1, value: 30 }
                ]
            },
            foundation: {
                colors: [
                    '#fff8e1', '#ffecb3', '#ffe082', '#ffd54f',
                    '#ffca28', '#ffc107', '#ffb300', '#ffa000',
                    '#ff8f00', '#ff6f00', '#e65100', '#bf360c'
                ],
                sliders: [
                    { id: 'foundationOpacity', label: 'Opacity', min: 0, max: 1, step: 0.1, value: 0.3 },
                    { id: 'foundationBlend', label: 'Blend', min: 0, max: 1, step: 0.1, value: 0.5 }
                ]
            }
        };
    }
    
    bindEvents() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const category = e.currentTarget.dataset.category;
                this.switchCategory(category);
            });
        });
        
        // Preset buttons
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const preset = e.currentTarget.dataset.preset;
                this.applyPreset(preset);
            });
        });
        
        // File upload
        document.getElementById('uploadBtn').addEventListener('click', () => {
            document.getElementById('fileInput').click();
        });
        
        document.getElementById('fileInput').addEventListener('change', (e) => {
            this.handleImageUpload(e.target.files[0]);
        });
        
        // Camera
        document.getElementById('cameraBtn').addEventListener('click', () => {
            this.activateCamera();
        });
        
        // Reset
        document.getElementById('resetBtn').addEventListener('click', () => {
            this.resetMakeup();
        });
        
        // Download
        document.getElementById('downloadBtn').addEventListener('click', () => {
            this.engine.downloadImage();
        });
    }
    
    switchCategory(category) {
        this.currentCategory = category;
        
        // Update active tab
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.category === category);
        });
        
        // Load controls for this category
        this.loadCategoryControls(category);
    }
    
    loadCategoryControls(category) {
        const container = document.getElementById('controlsContainer');
        const controls = this.categoryControls[category];
        
        let html = `
            <div class="control-group">
                <h4>Color</h4>
                <div class="color-picker">
        `;
        
        // Color options
        controls.colors.forEach(color => {
            const isSelected = this.engine.currentMakeup[category]?.color === color;
            html += `
                <div class="color-option ${isSelected ? 'selected' : ''}" 
                     style="background-color: ${color}"
                     data-color="${color}"></div>
            `;
        });
        
        html += `</div></div>`;
        
        // Sliders
        controls.sliders.forEach(slider => {
            const currentValue = this.engine.currentMakeup[category]?.[slider.id.replace(category, '').toLowerCase()] || slider.value;
            html += `
                <div class="control-group">
                    <div class="slider-container">
                        <label>
                            <span>${slider.label}</span>
                            <span id="${slider.id}Value">${currentValue}</span>
                        </label>
                        <input type="range" 
                               id="${slider.id}" 
                               min="${slider.min}" 
                               max="${slider.max}" 
                               step="${slider.step}" 
                               value="${currentValue}">
                    </div>
                </div>
            `;
        });
        
        // Special controls for lips
        if (category === 'lips' && controls.types) {
            html += `<div class="control-group">
                        <h4>Lip Type</h4>
                        <div class="type-selector">`;
            
            controls.types.forEach(type => {
                const isSelected = this.engine.currentMakeup.lips.type === type.id;
                html += `
                    <button class="type-btn ${isSelected ? 'active' : ''}" 
                            data-type="${type.id}">
                        <i class="${type.icon}"></i> ${type.label}
                    </button>
                `;
            });
            
            html += `</div></div>`;
        }
        
        container.innerHTML = html;
        
        // Bind new event listeners
        this.bindControlEvents();
    }
    
    bindControlEvents() {
        // Color pickers
        document.querySelectorAll('.color-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const color = e.currentTarget.dataset.color;
                const category = this.currentCategory;
                
                // Update selected state
                document.querySelectorAll('.color-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                e.currentTarget.classList.add('selected');
                
                // Update engine
                this.engine.updateMakeup(category, 'color', color);
            });
        });
        
        // Sliders
        document.querySelectorAll('input[type="range"]').forEach(slider => {
            slider.addEventListener('input', (e) => {
                const id = e.target.id;
                const value = parseFloat(e.target.value);
                const category = this.currentCategory;
                
                // Update display value
                document.getElementById(`${id}Value`).textContent = value.toFixed(1);
                
                // Map slider ID to engine property
                let property = id.replace(category.toLowerCase(), '').toLowerCase();
                if (property.startsWith('lip')) property = property.replace('lip', '');
                if (property.startsWith('eye')) property = property.replace('eye', '');
                if (property.startsWith('blush')) property = property.replace('blush', '');
                if (property.startsWith('foundation')) property = property.replace('foundation', '');
                
                this.engine.updateMakeup(category, property, value);
            });
        });
        
        // Type buttons (for lips)
        document.querySelectorAll('.type-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.currentTarget.dataset.type;
                
                // Update active state
                document.querySelectorAll('.type-btn').forEach(b => {
                    b.classList.remove('active');
                });
                e.currentTarget.classList.add('active');
                
                this.engine.updateMakeup('lips', 'type', type);
            });
        });
    }
    
    async handleImageUpload(file) {
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                // Hide placeholder
                document.getElementById('imagePlaceholder').style.display = 'none';
                
                // Set source image
                const sourceImg = document.getElementById('sourceImage');
                sourceImg.src = img.src;
                sourceImg.style.display = 'block';
                
                // Initialize engine with image
                this.engine.setSourceImage(img);
                
                // Process with face detection
                this.detectFaces(img);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
    
    async activateCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                } 
            });
            
            const video = document.createElement('video');
            video.srcObject = stream;
            video.play();
            
            video.onloadeddata = () => {
                // Hide placeholder
                document.getElementById('imagePlaceholder').style.display = 'none';
                
                // Create canvas for video frame
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const ctx = canvas.getContext('2d');
                
                // Capture frame
                ctx.drawImage(video, 0, 0);
                
                // Set as source image
                const img = new Image();
                img.onload = () => {
                    const sourceImg = document.getElementById('sourceImage');
                    sourceImg.src = img.src;
                    sourceImg.style.display = 'block';
                    this.engine.setSourceImage(img);
                    this.detectFaces(img);
                    
                    // Stop camera
                    stream.getTracks().forEach(track => track.stop());
                };
                img.src = canvas.toDataURL('image/png');
            };
        } catch (error) {
            alert('Unable to access camera: ' + error.message);
        }
    }
    
    async detectFaces(imageElement) {
        // In a real app, you would send this to your backend or use client-side ML
        // For now, we'll simulate detection with a timeout
        console.log('Face detection would run here...');
        
        // Simulate face detection after a delay
        setTimeout(() => {
            // If we had real face detection, we would update landmarks here
            // For demo purposes, we'll just redraw
            this.engine.redraw();
        }, 500);
    }
    
    applyPreset(presetName) {
        const preset = this.engine.applyPreset(presetName);
        if (preset) {
            // Reload controls to reflect preset values
            this.loadCategoryControls(this.currentCategory);
            
            // Show notification
            this.showNotification(`${presetName} look applied!`);
        }
    }
    
    resetMakeup() {
        // Reset all makeup to default
        this.engine.currentMakeup = {
            lips: { color: '#ff4081', opacity: 0.7, type: 'gloss' },
            eyeshadow: { color: '#9c27b0', opacity: 0.5, type: 'gradient' },
            eyeliner: { color: '#000000', opacity: 0.8, thickness: 2 },
            blush: { color: '#ff80ab', opacity: 0.4, radius: 30 },
            foundation: { color: '#fff8e1', opacity: 0.3 }
        };
        
        this.engine.redraw();
        this.loadCategoryControls(this.currentCategory);
        this.showNotification('Makeup reset to default');
    }
    
    showNotification(message) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}
