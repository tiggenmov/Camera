class MakeupEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.sourceImage = null;
        this.faceLandmarks = null;
        this.currentMakeup = {
            lips: { color: '#ff4081', opacity: 0.7, type: 'gloss' },
            eyeshadow: { color: '#9c27b0', opacity: 0.5, type: 'gradient' },
            eyeliner: { color: '#000000', opacity: 0.8, thickness: 2 },
            blush: { color: '#ff80ab', opacity: 0.4, radius: 30 },
            foundation: { color: '#fff8e1', opacity: 0.3 }
        };
        
        // Face mesh landmark indices (MediaPipe specific)
        this.LIP_INDICES = {
            outer: [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185],
            inner: [78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308, 415, 310, 311, 312, 13, 82, 81, 80, 191]
        };
        
        this.EYE_INDICES = {
            left: {
                outline: [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246],
                lid: [159, 160, 161, 246, 33, 7, 163, 144]
            },
            right: {
                outline: [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398],
                lid: [386, 385, 384, 398, 362, 382, 381, 380]
            }
        };
        
        this.CHEEK_INDICES = {
            left: [116, 117, 118, 119, 100, 126, 209, 49, 50],
            right: [346, 347, 348, 349, 329, 355, 429, 279, 280]
        };
    }
    
    // Initialize with source image
    setSourceImage(imageElement) {
        this.sourceImage = imageElement;
        this.canvas.width = imageElement.width;
        this.canvas.height = imageElement.height;
        this.redraw();
    }
    
    // Update face landmarks from MediaPipe
    updateFaceLandmarks(landmarks) {
        this.faceLandmarks = landmarks;
        this.redraw();
    }
    
    // Update makeup settings
    updateMakeup(category, property, value) {
        if (this.currentMakeup[category]) {
            this.currentMakeup[category][property] = value;
            this.redraw();
        }
    }
    
    // Main redraw function
    redraw() {
        if (!this.sourceImage) return;
        
        // Clear canvas and draw source image
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(this.sourceImage, 0, 0, this.canvas.width, this.canvas.height);
        
        // Apply makeup if face landmarks are detected
        if (this.faceLandmarks) {
            this.applyLips();
            this.applyEyeshadow();
            this.applyBlush();
            this.applyFoundation();
            this.applyEyeliner();
        }
    }
    
    // Apply lipstick
    applyLips() {
        const lips = this.currentMakeup.lips;
        if (lips.opacity <= 0) return;
        
        this.ctx.save();
        this.ctx.globalAlpha = lips.opacity;
        this.ctx.fillStyle = lips.color;
        
        // Create lip path
        this.ctx.beginPath();
        const lipPoints = this.LIP_INDICES.outer.map(idx => this.faceLandmarks[idx]);
        
        // Move to first point
        this.ctx.moveTo(
            lipPoints[0].x * this.canvas.width,
            lipPoints[0].y * this.canvas.height
        );
        
        // Draw curve through points
        for (let i = 1; i < lipPoints.length; i++) {
            const point = lipPoints[i];
            this.ctx.lineTo(
                point.x * this.canvas.width,
                point.y * this.canvas.height
            );
        }
        
        this.ctx.closePath();
        
        // Apply different lip textures
        if (lips.type === 'matte') {
            this.ctx.fill();
        } else if (lips.type === 'gloss') {
            this.ctx.fill();
            // Add gloss highlight
            this.ctx.globalAlpha = 0.3;
            this.ctx.fillStyle = 'white';
            
            // Create a smaller highlight path
            this.ctx.beginPath();
            const midPoint = lipPoints[Math.floor(lipPoints.length / 2)];
            const highlightRadius = 15;
            this.ctx.arc(
                midPoint.x * this.canvas.width,
                midPoint.y * this.canvas.height - 5,
                highlightRadius,
                0,
                Math.PI * 2
            );
            this.ctx.fill();
        }
        
        this.ctx.restore();
    }
    
    // Apply eyeshadow
    applyEyeshadow() {
        const eyeshadow = this.currentMakeup.eyeshadow;
        if (eyeshadow.opacity <= 0) return;
        
        this.ctx.save();
        this.ctx.globalAlpha = eyeshadow.opacity;
        
        // Apply to both eyes
        ['left', 'right'].forEach(side => {
            const eyePoints = this.EYE_INDICES[side].lid.map(idx => 
                this.faceLandmarks[idx]
            );
            
            // Create gradient
            const gradient = this.ctx.createRadialGradient(
                eyePoints[0].x * this.canvas.width,
                eyePoints[0].y * this.canvas.height,
                5,
                eyePoints[0].x * this.canvas.width,
                eyePoints[0].y * this.canvas.height,
                40
            );
            
            gradient.addColorStop(0, eyeshadow.color);
            gradient.addColorStop(1, this.adjustColor(eyeshadow.color, 50));
            
            this.ctx.fillStyle = gradient;
            
            // Create eyeshadow shape
            this.ctx.beginPath();
            eyePoints.forEach((point, i) => {
                const x = point.x * this.canvas.width;
                const y = point.y * this.canvas.height;
                
                if (i === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            });
            this.ctx.closePath();
            this.ctx.fill();
        });
        
        this.ctx.restore();
    }
    
    // Apply blush
    applyBlush() {
        const blush = this.currentMakeup.blush;
        if (blush.opacity <= 0) return;
        
        this.ctx.save();
        this.ctx.globalAlpha = blush.opacity;
        
        // Apply to both cheeks
        ['left', 'right'].forEach(side => {
            const cheekPoints = this.CHEEK_INDICES[side].map(idx => 
                this.faceLandmarks[idx]
            );
            
            // Calculate cheek center
            let sumX = 0, sumY = 0;
            cheekPoints.forEach(point => {
                sumX += point.x;
                sumY += point.y;
            });
            
            const centerX = (sumX / cheekPoints.length) * this.canvas.width;
            const centerY = (sumY / cheekPoints.length) * this.canvas.height;
            
            // Create blush circle
            const gradient = this.ctx.createRadialGradient(
                centerX, centerY, 0,
                centerX, centerY, blush.radius
            );
            
            gradient.addColorStop(0, blush.color);
            gradient.addColorStop(1, 'transparent');
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, blush.radius, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        this.ctx.restore();
    }
    
    // Apply foundation (skin tone adjustment)
    applyFoundation() {
        const foundation = this.currentMakeup.foundation;
        if (foundation.opacity <= 0) return;
        
        this.ctx.save();
        this.ctx.globalAlpha = foundation.opacity;
        this.ctx.fillStyle = foundation.color;
        this.ctx.globalCompositeOperation = 'overlay';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();
    }
    
    // Apply eyeliner
    applyEyeliner() {
        const eyeliner = this.currentMakeup.eyeliner;
        if (eyeliner.opacity <= 0) return;
        
        this.ctx.save();
        this.ctx.globalAlpha = eyeliner.opacity;
        this.ctx.strokeStyle = eyeliner.color;
        this.ctx.lineWidth = eyeliner.thickness;
        this.ctx.lineCap = 'round';
        
        // Apply to both eyes
        ['left', 'right'].forEach(side => {
            const eyePoints = this.EYE_INDICES[side].outline.map(idx => 
                this.faceLandmarks[idx]
            );
            
            this.ctx.beginPath();
            eyePoints.forEach((point, i) => {
                const x = point.x * this.canvas.width;
                const y = point.y * this.canvas.height;
                
                if (i === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            });
            this.ctx.closePath();
            this.ctx.stroke();
        });
        
        this.ctx.restore();
    }
    
    // Helper: Adjust color brightness
    adjustColor(color, amount) {
        let usePound = false;
        
        if (color[0] === "#") {
            color = color.slice(1);
            usePound = true;
        }
        
        const num = parseInt(color, 16);
        let r = (num >> 16) + amount;
        let g = ((num >> 8) & 0x00FF) + amount;
        let b = (num & 0x0000FF) + amount;
        
        r = Math.min(Math.max(0, r), 255);
        g = Math.min(Math.max(0, g), 255);
        b = Math.min(Math.max(0, b), 255);
        
        return (usePound ? "#" : "") + 
               (b | (g << 8) | (r << 16)).toString(16).padStart(6, '0');
    }
    
    // Get current makeup settings
    getMakeupSettings() {
        return JSON.parse(JSON.stringify(this.currentMakeup));
    }
    
    // Apply a preset look
    applyPreset(presetName) {
        const presets = {
            natural: {
                lips: { color: '#ff8a80', opacity: 0.5, type: 'matte' },
                eyeshadow: { color: '#b39ddb', opacity: 0.3, type: 'gradient' },
                blush: { color: '#ff80ab', opacity: 0.3, radius: 25 }
            },
            glam: {
                lips: { color: '#d81b60', opacity: 0.8, type: 'gloss' },
                eyeshadow: { color: '#8e24aa', opacity: 0.7, type: 'gradient' },
                eyeliner: { color: '#000000', opacity: 0.9, thickness: 3 },
                blush: { color: '#f06292', opacity: 0.5, radius: 30 }
            },
            bold: {
                lips: { color: '#c2185b', opacity: 0.9, type: 'matte' },
                eyeshadow: { color: '#5e35b1', opacity: 0.8, type: 'gradient' },
                eyeliner: { color: '#000000', opacity: 1, thickness: 4 }
            },
            party: {
                lips: { color: '#ff4081', opacity: 0.9, type: 'gloss' },
                eyeshadow: { color: '#e91e63', opacity: 0.6, type: 'gradient' },
                blush: { color: '#ff80ab', opacity: 0.6, radius: 35 }
            }
        };
        
        if (presets[presetName]) {
            Object.assign(this.currentMakeup, presets[presetName]);
            this.redraw();
            return presets[presetName];
        }
        return null;
    }
    
    // Download the final image
    downloadImage(filename = 'glamai-makeup-look.png') {
        const link = document.createElement('a');
        link.download = filename;
        link.href = this.canvas.toDataURL('image/png');
        link.click();
    }
}
