// AI-powered color recommendations based on skin tone, hair color, etc.
class AISuggestions {
    constructor(makeupEngine) {
        this.engine = makeupEngine;
        this.skinTone = null;
        this.eyeColor = null;
        this.hairColor = null;
        this.undertone = null; // warm, cool, neutral
        this.colorPalettes = {
            warm: {
                lips: ['#FF6B6B', '#FF8E53', '#FFAF40', '#FF5252', '#E65100'],
                eyes: ['#FF9800', '#FF5722', '#795548', '#8D6E63', '#5D4037'],
                cheeks: ['#FFAB91', '#FF8A65', '#FF7043', '#FF5722', '#D84315']
            },
            cool: {
                lips: ['#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3'],
                eyes: ['#7E57C2', '#5C6BC0', '#42A5F5', '#26C6DA', '#0097A7'],
                cheeks: ['#F48FB1', '#EC407A', '#D81B60', '#C2185B', '#880E4F']
            },
            neutral: {
                lips: ['#FF4081', '#F50057', '#C51162', '#FF5252', '#FF1744'],
                eyes: ['#9C27B0', '#673AB7', '#3F51B5', '#2196F3', '#00BCD4'],
                cheeks: ['#FF80AB', '#F06292', '#EC407A', '#E91E63', '#D81B60']
            }
        };
    }

    // Analyze image to detect features
    async analyzeImage(imageData) {
        // This would typically call a backend API
        // For demo, we'll simulate analysis
        
        // Mock analysis results
        return {
            skinTone: this.detectSkinTone(imageData),
            undertone: this.detectUndertone(imageData),
            eyeColor: this.detectEyeColor(imageData),
            hairColor: this.detectHairColor(imageData),
            faceShape: this.detectFaceShape(imageData)
        };
    }

    detectSkinTone(imageData) {
        // Simplified skin tone detection
        // In reality, this would use color sampling from cheek/forehead areas
        const tones = [
            { name: 'fair', hex: '#FFDBAC' },
            { name: 'light', hex: '#F1C27D' },
            { name: 'medium', hex: '#E0AC69' },
            { name: 'olive', hex: '#C68642' },
            { name: 'tan', hex: '#8D5524' },
            { name: 'deep', hex: '#5D4037' }
        ];
        
        // Return a mock tone for now
        return tones[2]; // medium
    }

    detectUndertone(imageData) {
        // Simple undertone detection
        const undertones = ['warm', 'cool', 'neutral'];
        return undertones[Math.floor(Math.random() * undertones.length)];
    }

    // Get color recommendations based on analysis
    getRecommendations(category) {
        if (!this.undertone) return this.getDefaultColors();
        
        const palette = this.colorPalettes[this.undertone];
        return palette[category] || palette.lips;
    }

    getDefaultColors() {
        return {
            lips: ['#ff4081', '#d81b60', '#c2185b', '#880e4f'],
            eyes: ['#9c27b0', '#673ab7', '#3f51b5', '#2196f3'],
            cheeks: ['#ff80ab', '#f06292', '#ec407a', '#e91e63']
        };
    }

    // Get complete makeup look recommendation
    getCompleteLook(lookType = 'everyday') {
        const looks = {
            everyday: {
                lips: { color: '#ff8a80', opacity: 0.6, type: 'matte' },
                eyeshadow: { color: '#b39ddb', opacity: 0.4, type: 'gradient' },
                blush: { color: '#ff80ab', opacity: 0.3, radius: 25 },
                foundation: { color: '#fff8e1', opacity: 0.2 }
            },
            professional: {
                lips: { color: '#d81b60', opacity: 0.7, type: 'matte' },
                eyeshadow: { color: '#5c6bc0', opacity: 0.3, type: 'gradient' },
                eyeliner: { color: '#000000', opacity: 0.8, thickness: 2 },
                blush: { color: '#f06292', opacity: 0.2, radius: 20 }
            },
            evening: {
                lips: { color: '#c2185b', opacity: 0.9, type: 'gloss' },
                eyeshadow: { color: '#7e57c2', opacity: 0.7, type: 'gradient' },
                eyeliner: { color: '#000000', opacity: 0.9, thickness: 3 },
                blush: { color: '#ec407a', opacity: 0.4, radius: 30 }
            },
            bold: {
                lips: { color: '#880e4f', opacity: 0.9, type: 'matte' },
                eyeshadow: { color: '#4527a0', opacity: 0.8, type: 'gradient' },
                eyeliner: { color: '#000000', opacity: 1, thickness: 4 },
                blush: { color: '#d81b60', opacity: 0.5, radius: 35 }
            }
        };

        return looks[lookType] || looks.everyday;
    }

    // Suggest colors based on color theory
    suggestComplementaryColors(baseColor) {
        // Convert hex to RGB
        const rgb = this.hexToRgb(baseColor);
        
        // Calculate complementary color (opposite on color wheel)
        const complementary = {
            r: 255 - rgb.r,
            g: 255 - rgb.g,
            b: 255 - rgb.b
        };
        
        // Calculate analogous colors (adjacent on color wheel)
        const analogous1 = this.rotateHue(rgb, -30);
        const analogous2 = this.rotateHue(rgb, 30);
        
        // Calculate triadic colors
        const triadic1 = this.rotateHue(rgb, 120);
        const triadic2 = this.rotateHue(rgb, -120);
        
        return {
            complementary: this.rgbToHex(complementary),
            analogous: [this.rgbToHex(analogous1), this.rgbToHex(analogous2)],
            triadic: [this.rgbToHex(triadic1), this.rgbToHex(triadic2)]
        };
    }

    // Color conversion helpers
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
    }

    rgbToHex(rgb) {
        return '#' + [rgb.r, rgb.g, rgb.b]
            .map(x => x.toString(16).padStart(2, '0'))
            .join('');
    }

    rotateHue(rgb, degrees) {
        // Convert RGB to HSL, rotate hue, convert back
        let [h, s, l] = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
        h = (h + degrees / 360) % 1;
        if (h < 0) h += 1;
        
        const newRgb = this.hslToRgb(h, s, l);
        return { r: newRgb[0], g: newRgb[1], b: newRgb[2] };
    }

    rgbToHsl(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0; // achromatic
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        return [h, s, l];
    }

    hslToRgb(h, s, l) {
        let r, g, b;

        if (s === 0) {
            r = g = b = l; // achromatic
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };

            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }

        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    }
}

// UI Component for AI Suggestions
class AISuggestionsUI {
    constructor(aiEngine, uiControls) {
        this.aiEngine = aiEngine;
        this.uiControls = uiControls;
        this.init();
    }

    init() {
        this.createUI();
        this.bindEvents();
    }

    createUI() {
        // Add AI section to controls panel
        const controlsPanel = document.querySelector('.controls-panel');
        
        const aiSection = document.createElement('div');
        aiSection.className = 'ai-section';
        aiSection.innerHTML = `
            <div class="ai-header">
                <h3><i class="fas fa-robot"></i> AI Color Assistant</h3>
                <button id="analyzeBtn" class="btn btn-sm">
                    <i class="fas fa-magic"></i> Analyze Face
                </button>
            </div>
            <div class="ai-recommendations" id="aiRecommendations">
                <div class="loading">Click "Analyze Face" to get recommendations</div>
            </div>
            <div class="color-theory">
                <h4>Color Theory Suggestions</h4>
                <div id="colorTheorySuggestions"></div>
            </div>
        `;
        
        // Insert after presets section
        const presetsSection = document.querySelector('.presets-section');
        controlsPanel.insertBefore(aiSection, presetsSection.nextSibling);
    }

    bindEvents() {
        document.getElementById('analyzeBtn').addEventListener('click', () => {
            this.analyzeAndRecommend();
        });
    }

    async analyzeAndRecommend() {
        const canvas = document.getElementById('outputCanvas');
        if (!canvas) return;
        
        // Show loading
        const recommendationsDiv = document.getElementById('aiRecommendations');
        recommendationsDiv.innerHTML = '<div class="loading">Analyzing face features...</div>';
        
        try {
            // Get image data from canvas
            const imageData = canvas.toDataURL('image/jpeg');
            
            // Analyze image (in real app, this would call an API)
            const analysis = await this.aiEngine.analyzeImage(imageData);
            
            // Display recommendations
            this.displayRecommendations(analysis);
            
            // Show color theory suggestions for current color
            this.showColorTheorySuggestions();
            
        } catch (error) {
            console.error('Analysis failed:', error);
            recommendationsDiv.innerHTML = '<div class="error">Analysis failed. Please try again.</div>';
        }
    }

    displayRecommendations(analysis) {
        const recommendationsDiv = document.getElementById('aiRecommendations');
        
        const html = `
            <div class="analysis-results">
                <div class="feature">
                    <span class="label">Skin Tone:</span>
                    <span class="value">${analysis.skinTone.name}</span>
                    <div class="color-swatch" style="background-color: ${analysis.skinTone.hex}"></div>
                </div>
                <div class="feature">
                    <span class="label">Undertone:</span>
                    <span class="value">${analysis.undertone}</span>
                </div>
                <div class="feature">
                    <span class="label">Recommended Colors:</span>
                    <div class="recommended-colors">
                        ${this.getColorSwatches('lips')}
                        ${this.getColorSwatches('eyes')}
                        ${this.getColorSwatches('cheeks')}
                    </div>
                </div>
                <div class="ai-looks">
                    <h5>AI Suggested Looks:</h5>
                    <div class="look-buttons">
                        <button class="look-btn" data-look="everyday">Everyday</button>
                        <button class="look-btn" data-look="professional">Professional</button>
                        <button class="look-btn" data-look="evening">Evening</button>
                        <button class="look-btn" data-look="bold">Bold</button>
                    </div>
                </div>
            </div>
        `;
        
        recommendationsDiv.innerHTML = html;
        
        // Bind look buttons
        document.querySelectorAll('.look-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const lookType = e.target.dataset.look;
                this.applyAILook(lookType);
            });
        });
    }

    getColorSwatches(category) {
        const colors = this.aiEngine.getRecommendations(category);
        return `
            <div class="color-category">
                <span class="category-label">${category}:</span>
                <div class="swatch-group">
                    ${colors.map(color => `
                        <div class="ai-swatch" 
                             style="background-color: ${color}"
                             data-color="${color}"
                             data-category="${category}"></div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    showColorTheorySuggestions() {
        const currentColor = this.uiControls.engine.currentMakeup.lips.color;
        const suggestions = this.aiEngine.suggestComplementaryColors(currentColor);
        
        const container = document.getElementById('colorTheorySuggestions');
        container.innerHTML = `
            <div class="theory-group">
                <span>Current: <div class="theory-swatch" style="background-color: ${currentColor}"></div></span>
                <span>Complementary: <div class="theory-swatch" style="background-color: ${suggestions.complementary}"></div></span>
                <span>Analogous: 
                    ${suggestions.analogous.map(color => `
                        <div class="theory-swatch" style="background-color: ${color}"></div>
                    `).join('')}
                </span>
            </div>
        `;
        
        // Bind swatch clicks
        container.querySelectorAll('.theory-swatch').forEach(swatch => {
            swatch.addEventListener('click', (e) => {
                const color = e.target.style.backgroundColor;
                // Convert rgb() to hex
                const hexColor = this.rgbToHex(color);
                this.uiControls.engine.updateMakeup('lips', 'color', hexColor);
            });
        });
    }

    rgbToHex(rgb) {
        // Parse rgb(r, g, b) string to hex
        const matches = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (!matches) return rgb;
        
        const r = parseInt(matches[1]);
        const g = parseInt(matches[2]);
        const b = parseInt(matches[3]);
        
        return '#' + [r, g, b]
            .map(x => x.toString(16).padStart(2, '0'))
            .join('');
    }

    applyAILook(lookType) {
        const look = this.aiEngine.getCompleteLook(lookType);
        
        // Apply to engine
        Object.keys(look).forEach(category => {
            Object.keys(look[category]).forEach(property => {
                this.uiControls.engine.updateMakeup(category, property, look[category][property]);
            });
        });
        
        // Update UI
        this.uiControls.loadCategoryControls(this.uiControls.currentCategory);
        
        // Show notification
        this.showNotification(`${lookType} look applied!`);
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'ai-notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 24px;
            border-radius: 25px;
            z-index: 1000;
            animation: slideUp 0.3s ease;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}
