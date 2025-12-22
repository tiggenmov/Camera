class GlamAIEngine {
    constructor() {
        this.canvas = document.getElementById('makeupCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.faceCanvas = document.getElementById('faceCanvas');
        this.faceCtx = this.faceCanvas.getContext('2d');
        
        this.currentImage = null;
        this.faceLandmarks = null;
        this.faceMesh = null;
        this.isFaceDetected = false;
        
        // All makeup categories with advanced settings
        this.makeupSettings = {
            foundation: {
                enabled: true,
                color: '#F5DEB3',
                opacity: 0.7,
                coverage: 0.8,
                blend: 0.5,
                texture: 'matte', // matte, dewy, satin
                finish: 'natural' // natural, full, sheer
            },
            concealer: {
                enabled: true,
                color: '#FFF8E1',
                opacity: 0.9,
                areas: ['under_eyes', 'blemishes', 'redness'],
                intensity: 0.7
            },
            blush: {
                enabled: true,
                color: '#FF80AB',
                opacity: 0.4,
                type: 'cream', // cream, powder, liquid
                placement: 'apples', // apples, cheekbones, draping
                shape: 'round',
                radius: 30
            },
            bronzer: {
                enabled: false,
                color: '#D2B48C',
                opacity: 0.3,
                areas: ['forehead', 'cheekbones', 'jawline'],
                contour: 0.5
            },
            highlighter: {
                enabled: false,
                color: '#FFF8E1',
                opacity: 0.6,
                type: 'powder', // powder, liquid, cream
                areas: ['cheekbones', 'nose', 'cupids_bow'],
                intensity: 0.7,
                shimmer: 0.3
            },
            eyeshadow: {
                enabled: false,
                colors: [
                    {color: '#9C27B0', position: 'crease', opacity: 0.6},
                    {color: '#673AB7', position: 'lid', opacity: 0.8},
                    {color: '#E1BEE7', position: 'browbone', opacity: 0.4}
                ],
                blend: 0.7,
                finish: 'matte' // matte, shimmer, metallic
            },
            eyeliner: {
                enabled: false,
                color: '#000000',
                opacity: 0.9,
                type: 'liquid', // liquid, gel, pencil
                style: 'winged', // natural, winged, cat-eye
                thickness: 2,
                wingLength: 20
            },
            mascara: {
                enabled: false,
                color: '#000000',
                opacity: 0.8,
                type: 'volumizing', // volumizing, lengthening, curling
                intensity: 0.7,
                clumpPrevention: 0.8
            },
            brows: {
                enabled: false,
                color: '#3E2723',
                opacity: 0.6,
                style: 'natural', // natural, defined, feathered
                fill: 0.7,
                shape: 'arched'
            },
            lips: {
                enabled: false,
                color: '#FF4081',
                opacity: 0.8,
                type: 'liquid', // liquid, bullet, gloss
                finish: 'matte', // matte, satin, gloss
                liner: {
                    enabled: true,
                    color: '#D81B60',
                    opacity: 0.9,
                    overlined: false
                }
            },
            lipliner: {
                enabled: false,
                color: '#D81B60',
                opacity: 0.9,
                thickness: 1,
                overlined: false
            },
            settingSpray: {
                enabled: false,
                intensity: 0.5,
                dewyFinish: 0.3
            }
        };
        
        this.undoStack = [];
        this.redoStack = [];
        this.MAX_UNDO_STEPS = 20;
        
        this.faceDetectionConfig = {
            maxFaces: 1,
            refineLandmarks: true,
            detectionConfidence: 0.7,
            trackingConfidence: 0.7
        };
        
        this.init();
    }
    
    async init() {
        await this.loadModels();
        this.setupEventListeners();
        this.setupCanvas();
    }
    
    async loadModels() {
        try {
            // Load MediaPipe Face Mesh
            this.faceMesh = new FaceMesh({
                locateFile: (file) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
                }
            });
            
            this.faceMesh.setOptions(this.faceDetectionConfig);
            this.faceMesh.onResults(this.onFaceResults.bind(this));
            
            // Load TensorFlow.js models for additional analysis
            await this.loadTensorFlowModels();
            
            console.log('AI Models loaded successfully');
        } catch (error) {
            console.error('Failed to load models:', error);
        }
    }
    
    async loadTensorFlowModels() {
        // Load face landmarks detection model
        this.faceLandmarkModel = await faceLandmarksDetection.load(
            faceLandmarksDetection.SupportedPackages.mediapipeFacemesh,
            {maxFaces: 1}
        );
    }
    
    setupCanvas() {
        // Set canvas dimensions
        const updateCanvasSize = () => {
            const container = this.canvas.parentElement;
            this.canvas.width = container.clientWidth;
            this.canvas.height = container.clientHeight;
            this.faceCanvas.width = container.clientWidth;
            this.faceCanvas.height = container.clientHeight;
        };
        
        updateCanvasSize();
        window.addEventListener('resize', updateCanvasSize);
    }
    
    setupEventListeners() {
        // Listen for makeup changes
        document.addEventListener('makeup:change', (e) => {
            this.updateMakeupSetting(e.detail.category, e.detail.property, e.detail.value);
            this.saveToHistory();
            this.applyMakeup();
        });
        
        // Listen for face detection events
        document.addEventListener('face:detected', (e) => {
            this.faceLandmarks = e.detail.landmarks;
            this.isFaceDetected = true;
            this.applyMakeup();
        });
    }
    
    async processImage(imageElement) {
        this.currentImage = imageElement;
        
        // Set canvas size to match image
        this.canvas.width = imageElement.width;
        this.canvas.height = imageElement.height;
        this.faceCanvas.width = imageElement.width;
        this.faceCanvas.height = imageElement.height;
        
        // Clear canvas and draw image
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(imageElement, 0, 0);
        
        // Detect faces
        await this.detectFaces(imageElement);
        
        // Apply makeup if face detected
        if (this.isFaceDetected) {
            this.applyMakeup();
        }
        
        return this.canvas.toDataURL('image/png');
    }
    
    async detectFaces(imageElement) {
        try {
            await this.faceMesh.send({image: imageElement});
        } catch (error) {
            console.error('Face detection failed:', error);
        }
    }
    
    onFaceResults(results) {
        if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
            this.faceLandmarks = results.multiFaceLandmarks[0];
            this.isFaceDetected = true;
            
            // Draw face mesh for debugging (optional)
            this.drawFaceMesh();
            
            // Dispatch event
            document.dispatchEvent(new CustomEvent('face:detected', {
                detail: {landmarks: this.faceLandmarks}
            }));
        } else {
            this.isFaceDetected = false;
        }
    }
    
    drawFaceMesh() {
        this.faceCtx.clearRect(0, 0, this.faceCanvas.width, this.faceCanvas.height);
        
        if (!this.faceLandmarks) return;
        
        // Draw face landmarks (for debugging)
        this.faceCtx.strokeStyle = 'rgba(0, 255, 0, 0.3)';
        this.faceCtx.lineWidth = 1;
        
        // Draw connections between landmarks
        this.drawFaceConnections();
    }
    
    drawFaceConnections() {
        // Simplified face mesh drawing
        // In production, use MediaPipe's drawing utilities
    }
    
    applyMakeup() {
        if (!this.currentImage || !this.faceLandmarks) return;
        
        // Clear canvas and draw original image
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(this.currentImage, 0, 0);
        
        // Apply each makeup category
        if (this.makeupSettings.foundation.enabled) {
            this.applyFoundation();
        }
        
        if (this.makeupSettings.concealer.enabled) {
            this.applyConcealer();
        }
        
        if (this.makeupSettings.blush.enabled) {
            this.applyBlush();
        }
        
        if (this.makeupSettings.eyeshadow.enabled) {
            this.applyEyeshadow();
        }
        
        if (this.makeupSettings.eyeliner.enabled) {
            this.applyEyeliner();
        }
        
        if (this.makeupSettings.lips.enabled) {
            this.applyLipstick();
        }
        
        if (this.makeupSettings.brows.enabled) {
            this.applyBrows();
        }
        
        if (this.makeupSettings.highlighter.enabled) {
            this.applyHighlighter();
        }
        
        if (this.makeupSettings.bronzer.enabled) {
            this.applyBronzer();
        }
        
        if (this.makeupSettings.settingSpray.enabled) {
            this.applySettingSpray();
        }
    }
    
    applyFoundation() {
        const settings = this.makeupSettings.foundation;
        
        this.ctx.save();
        this.ctx.globalAlpha = settings.opacity;
        this.ctx.globalCompositeOperation = 'overlay';
        
        // Create gradient for foundation
        const gradient = this.ctx.createRadialGradient(
            this.canvas.width / 2,
            this.canvas.height / 2,
            0,
            this.canvas.width / 2,
            this.canvas.height / 2,
            Math.max(this.canvas.width, this.canvas.height) / 2
        );
        
        gradient.addColorStop(0, settings.color);
        gradient.addColorStop(1, this.adjustColorBrightness(settings.color, 0.2));
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.restore();
    }
    
    applyConcealer() {
        const settings = this.makeupSettings.concealer;
        const landmarks = this.faceLandmarks;
        
        if (!landmarks) return;
        
        this.ctx.save();
        this.ctx.globalAlpha = settings.opacity;
        this.ctx.fillStyle = settings.color;
        
        // Under eyes
        if (settings.areas.includes('under_eyes')) {
            const leftEyePoints = [
                landmarks[33], landmarks[133], landmarks[157], landmarks[158], landmarks[159]
            ];
            const rightEyePoints = [
                landmarks[362], landmarks[263], landmarks[386], landmarks[387], landmarks[388]
            ];
            
            this.drawConcealerArea(leftEyePoints, settings.intensity);
            this.drawConcealerArea(rightEyePoints, settings.intensity);
        }
        
        // Blemishes (simplified - would use actual blemish detection)
        if (settings.areas.includes('blemishes')) {
            // Apply subtle blur effect
            this.ctx.filter = 'blur(2px)';
            this.ctx.globalCompositeOperation = 'lighten';
        }
        
        this.ctx.restore();
    }
    
    drawConcealerArea(points, intensity) {
        this.ctx.beginPath();
        points.forEach((point, i) => {
            const x = point.x * this.canvas.width;
            const y = point.y * this.canvas.height;
            
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        });
        this.ctx.closePath();
        
        // Create gradient for natural look
        const gradient = this.ctx.createRadialGradient(
            this.ctx.currentPoint.x,
            this.ctx.currentPoint.y,
            0,
            this.ctx.currentPoint.x,
            this.ctx.currentPoint.y,
            30 * intensity
        );
        
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
    }
    
    applyBlush() {
        const settings = this.makeupSettings.blush;
        const landmarks = this.faceLandmarks;
        
        if (!landmarks) return;
        
        this.ctx.save();
        this.ctx.globalAlpha = settings.opacity;
        
        // Calculate cheek positions
        const leftCheek = this.calculateCheekPosition('left', landmarks);
        const rightCheek = this.calculateCheekPosition('right', landmarks);
        
        // Apply blush based on placement type
        switch (settings.placement) {
            case 'apples':
                this.drawBlushApple(leftCheek, settings);
                this.drawBlushApple(rightCheek, settings);
                break;
            case 'cheekbones':
                this.drawBlushCheekbone(leftCheek, settings);
                this.drawBlushCheekbone(rightCheek, settings);
                break;
            case 'draping':
                this.drawBlushDraping(leftCheek, rightCheek, settings);
                break;
        }
        
        this.ctx.restore();
    }
    
    calculateCheekPosition(side, landmarks) {
        const indices = side === 'left' ? 
            [116, 117, 118, 119, 100, 126, 209] : 
            [346, 347, 348, 349, 329, 355, 429];
        
        let sumX = 0, sumY = 0;
        indices.forEach(idx => {
            sumX += landmarks[idx].x;
            sumY += landmarks[idx].y;
        });
        
        return {
            x: (sumX / indices.length) * this.canvas.width,
            y: (sumY / indices.length) * this.canvas.height,
            radius: settings.radius || 30
        };
    }
    
    drawBlushApple(position, settings) {
        const gradient = this.ctx.createRadialGradient(
            position.x, position.y, 0,
            position.x, position.y, position.radius
        );
        
        gradient.addColorStop(0, settings.color);
        gradient.addColorStop(1, this.adjustColorBrightness(settings.color, 0.3));
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(position.x, position.y, position.radius, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    applyEyeshadow() {
        const settings = this.makeupSettings.eyeshadow;
        const landmarks = this.faceLandmarks;
        
        if (!landmarks) return;
        
        this.ctx.save();
        
        // Apply each eyeshadow color
        settings.colors.forEach(colorConfig => {
            this.ctx.globalAlpha = colorConfig.opacity;
            
            // Apply to both eyes
            ['left', 'right'].forEach(side => {
                const eyePoints = this.getEyePoints(side, landmarks, colorConfig.position);
                
                if (eyePoints.length > 0) {
                    this.ctx.fillStyle = colorConfig.color;
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
                    
                    // Add blend effect
                    if (settings.blend > 0) {
                        this.ctx.filter = `blur(${settings.blend * 3}px)`;
                    }
                    
                    this.ctx.fill();
                }
            });
        });
        
        this.ctx.restore();
    }
    
    getEyePoints(side, landmarks, position) {
        const eyeIndices = {
            left: {
                crease: [33, 7, 163, 144, 145, 153, 154, 155],
                lid: [159, 160, 161, 246, 33, 7, 163, 144],
                browbone: [70, 63, 105, 66, 107, 55, 65]
            },
            right: {
                crease: [362, 382, 381, 380, 374, 373, 390, 249],
                lid: [386, 385, 384, 398, 362, 382, 381, 380],
                browbone: [300, 293, 334, 296, 336, 285, 295]
            }
        };
        
        const indices = eyeIndices[side][position] || eyeIndices[side].lid;
        return indices.map(idx => landmarks[idx]);
    }
    
    applyEyeliner() {
        const settings = this.makeupSettings.eyeliner;
        const landmarks = this.faceLandmarks;
        
        if (!landmarks) return;
        
        this.ctx.save();
        this.ctx.strokeStyle = settings.color;
        this.ctx.lineWidth = settings.thickness;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.globalAlpha = settings.opacity;
        
        // Apply to both eyes
        ['left', 'right'].forEach(side => {
            const eyeOutline = this.getEyeOutline(side, landmarks);
            
            this.ctx.beginPath();
            eyeOutline.forEach((point, i) => {
                const x = point.x * this.canvas.width;
                const y = point.y * this.canvas.height;
                
                if (i === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            });
            
            // Add wing if specified
            if (settings.style === 'winged' || settings.style === 'cat-eye') {
                this.addEyelinerWing(side, eyeOutline, settings.wingLength);
            }
            
            this.ctx.stroke();
        });
        
        this.ctx.restore();
    }
    
    addEyelinerWing(side, eyeOutline, wingLength) {
        const lastPoint = eyeOutline[eyeOutline.length - 1];
        const secondLastPoint = eyeOutline[eyeOutline.length - 2];
        
        const angle = Math.atan2(
            lastPoint.y - secondLastPoint.y,
            lastPoint.x - secondLastPoint.x
        );
        
        const wingX = lastPoint.x + Math.cos(angle) * wingLength;
        const wingY = lastPoint.y + Math.sin(angle) * wingLength;
        
        this.ctx.lineTo(wingX, wingY);
    }
    
    applyLipstick() {
        const settings = this.makeupSettings.lips;
        const landmarks = this.faceLandmarks;
        
        if (!landmarks) return;
        
        this.ctx.save();
        
        // Apply lipliner first if enabled
        if (settings.liner.enabled) {
            this.applyLipliner(settings.liner);
        }
        
        // Apply lipstick
        this.ctx.globalAlpha = settings.opacity;
        
        const lipIndices = [
            61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267
        ];
        
        const lipPoints = lipIndices.map(idx => landmarks[idx]);
        
        this.ctx.fillStyle = settings.color;
        this.ctx.beginPath();
        
        lipPoints.forEach((point, i) => {
            const x = point.x * this.canvas.width;
            const y = point.y * this.canvas.height;
            
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        });
        
        this.ctx.closePath();
        
        // Apply texture based on finish
        switch (settings.finish) {
            case 'matte':
                this.ctx.fill();
                break;
            case 'gloss':
                this.ctx.fill();
                // Add gloss highlight
                this.addLipGloss(lipPoints);
                break;
            case 'satin':
                this.ctx.fill();
                // Add subtle shine
                this.addLipShine(lipPoints, 0.3);
                break;
        }
        
        this.ctx.restore();
    }
    
    applyLipliner(linerSettings) {
        this.ctx.save();
        this.ctx.strokeStyle = linerSettings.color;
        this.ctx.lineWidth = 2;
        this.ctx.lineCap = 'round';
        this.ctx.globalAlpha = linerSettings.opacity;
        
        const lipOutline = this.getLipOutline();
        
        this.ctx.beginPath();
        lipOutline.forEach((point, i) => {
            const x = point.x * this.canvas.width;
            const y = point.y * this.canvas.height;
            
            // Overline if enabled
            if (linerSettings.overlined && i > lipOutline.length / 4 && i < lipOutline.length * 3 / 4) {
                this.ctx.lineTo(x, y - 3);
            } else {
                this.ctx.lineTo(x, y);
            }
        });
        
        this.ctx.stroke();
        this.ctx.restore();
    }
    
    addLipGloss(lipPoints) {
        this.ctx.save();
        this.ctx.globalAlpha = 0.3;
        this.ctx.fillStyle = 'white';
        
        // Create gloss highlight in the center
        const midIndex = Math.floor(lipPoints.length / 2);
        const highlightPoint = lipPoints[midIndex];
        
        this.ctx.beginPath();
        this.ctx.arc(
            highlightPoint.x * this.canvas.width,
            highlightPoint.y * this.canvas.height - 5,
            10, 0, Math.PI * 2
        );
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    applyBrows() {
        const settings = this.makeupSettings.brows;
        const landmarks = this.faceLandmarks;
        
        if (!landmarks) return;
        
        this.ctx.save();
        this.ctx.strokeStyle = settings.color;
        this.ctx.lineWidth = 0.5;
        this.ctx.globalAlpha = settings.opacity;
        
        // Apply to both brows
        ['left', 'right'].forEach(side => {
            const browPoints = this.getBrowPoints(side, landmarks);
            
            // Draw individual brow hairs for natural look
            for (let i = 0; i < browPoints.length - 1; i++) {
                const start = browPoints[i];
                const end = browPoints[i + 1];
                
                this.ctx.beginPath();
                this.ctx.moveTo(start.x * this.canvas.width, start.y * this.canvas.height);
                
                // Create natural hair stroke
                const controlX = (start.x + end.x) / 2;
                const controlY = (start.y + end.y) / 2 - 0.01;
                
                this.ctx.quadraticCurveTo(
                    controlX * this.canvas.width,
                    controlY * this.canvas.height,
                    end.x * this.canvas.width,
                    end.y * this.canvas.height
                );
                
                this.ctx.stroke();
            }
        });
        
        this.ctx.restore();
    }
    
    applyHighlighter() {
        const settings = this.makeupSettings.highlighter;
        const landmarks = this.faceLandmarks;
        
        if (!landmarks) return;
        
        this.ctx.save();
        this.ctx.globalAlpha = settings.opacity;
        this.ctx.fillStyle = settings.color;
        
        // Apply to specified areas
        settings.areas.forEach(area => {
            switch (area) {
                case 'cheekbones':
                    this.applyCheekboneHighlighter(landmarks, settings.intensity);
                    break;
                case 'nose':
                    this.applyNoseHighlighter(landmarks, settings.intensity);
                    break;
                case 'cupids_bow':
                    this.applyCupidsBowHighlighter(landmarks, settings.intensity);
                    break;
            }
        });
        
        // Add shimmer effect
        if (settings.shimmer > 0) {
            this.ctx.filter = `brightness(${1 + settings.shimmer})`;
        }
        
        this.ctx.restore();
    }
    
    applyBronzer() {
        const settings = this.makeupSettings.bronzer;
        const landmarks = this.faceLandmarks;
        
        if (!landmarks) return;
        
        this.ctx.save();
        this.ctx.globalAlpha = settings.opacity;
        this.ctx.fillStyle = settings.color;
        this.ctx.globalCompositeOperation = 'multiply';
        
        // Apply to specified areas
        settings.areas.forEach(area => {
            switch (area) {
                case 'forehead':
                    this.applyForeheadBronzer(landmarks, settings.contour);
                    break;
                case 'cheekbones':
                    this.applyCheekboneContour(landmarks, settings.contour);
                    break;
                case 'jawline':
                    this.applyJawlineContour(landmarks, settings.contour);
                    break;
            }
        });
        
        this.ctx.restore();
    }
    
    applySettingSpray() {
        const settings = this.makeupSettings.settingSpray;
        
        this.ctx.save();
        this.ctx.globalAlpha = settings.intensity * 0.1;
        this.ctx.filter = `blur(${settings.dewyFinish}px) brightness(${1 + settings.dewyFinish * 0.1})`;
        this.ctx.drawImage(this.canvas, 0, 0);
        this.ctx.restore();
    }
    
    // Helper methods
    adjustColorBrightness(color, amount) {
        // Convert hex to RGB
        let r = parseInt(color.substr(1, 2), 16);
        let g = parseInt(color.substr(3, 2), 16);
        let b = parseInt(color.substr(5, 2), 16);
        
        // Adjust brightness
        r = Math.min(255, Math.max(0, r + amount * 255));
        g = Math.min(255, Math.max(0, g + amount * 255));
        b = Math.min(255, Math.max(0, b + amount * 255));
        
        // Convert back to hex
        return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;
    }
    
    getLipOutline() {
        // Simplified lip outline points
        const indices = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291];
        return indices.map(idx => this.faceLandmarks[idx]);
    }
    
    getBrowPoints(side, landmarks) {
        const indices = side === 'left' ? 
            [70, 63, 105, 66, 107] : 
            [300, 293, 334, 296, 336];
        return indices.map(idx => landmarks[idx]);
    }
    
    getEyeOutline(side, landmarks) {
        const indices = side === 'left' ? 
            [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161] :
            [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384];
        return indices.map(idx => landmarks[idx]);
    }
    
    // Contouring methods
    applyCheekboneContour(landmarks, intensity) {
        // Simplified cheekbone contouring
        const leftCheekbone = landmarks[116];
        const rightCheekbone = landmarks[346];
        
        this.drawContourLine(leftCheekbone, intensity);
        this.drawContourLine(rightCheekbone, intensity);
    }
    
    drawContourLine(point, intensity) {
        this.ctx.beginPath();
        this.ctx.moveTo(point.x * this.canvas.width - 20, point.y * this.canvas.height);
        this.ctx.lineTo(point.x * this.canvas.width + 20, point.y * this.canvas.height);
        this.ctx.lineWidth = 5 * intensity;
        this.ctx.stroke();
    }
    
    applyForeheadBronzer(landmarks, intensity) {
        // Apply bronzer to forehead area
        const foreheadPoints = [10, 338, 297, 332, 284];
        
        this.ctx.beginPath();
        foreheadPoints.forEach((idx, i) => {
            const point = landmarks[idx];
            const x = point.x * this.canvas.width;
            const y = point.y * this.canvas.height;
            
            if (i === 0) this.ctx.moveTo(x, y);
            else this.ctx.lineTo(x, y);
        });
        this.ctx.closePath();
        this.ctx.fill();
    }
    
    applyJawlineContour(landmarks, intensity) {
        // Apply contour along jawline
        const jawlinePoints = [172, 136, 150, 149, 176, 148, 152, 377, 400, 378, 379, 365, 397, 288, 361, 323];
        
        this.ctx.beginPath();
        jawlinePoints.forEach(idx => {
            const point = landmarks[idx];
            this.ctx.lineTo(point.x * this.canvas.width, point.y * this.canvas.height);
        });
        this.ctx.lineWidth = 3 * intensity;
        this.ctx.stroke();
    }
    
    // History management
    saveToHistory() {
        const state = JSON.parse(JSON.stringify(this.makeupSettings));
        this.undoStack.push(state);
        
        // Limit undo stack size
        if (this.undoStack.length > this.MAX_UNDO_STEPS) {
            this.undoStack.shift();
        }
        
        // Clear redo stack when new change is made
        this.redoStack = [];
    }
    
    undo() {
        if (this.undoStack.length > 1) {
            const currentState = this.undoStack.pop();
            this.redoStack.push(currentState);
            
            const previousState = this.undoStack[this.undoStack.length - 1];
            this.makeupSettings = JSON.parse(JSON.stringify(previousState));
            this.applyMakeup();
            
            return true;
        }
        return false;
    }
    
    redo() {
        if (this.redoStack.length > 0) {
            const nextState = this.redoStack.pop();
            this.undoStack.push(nextState);
            
            this.makeupSettings = JSON.parse(JSON.stringify(nextState));
            this.applyMakeup();
            
            return true;
        }
        return false;
    }
    
    // Export functionality
    exportImage(format = 'png', quality = 1.0) {
        return this.canvas.toDataURL(`image/${format}`, quality);
    }
    
    saveToGallery(filename = 'glamai-makeup-look') {
        const link = document.createElement('a');
        link.download = `${filename}-${Date.now()}.png`;
        link.href = this.exportImage('png');
        link.click();
    }
    
    // Reset functionality
    resetMakeup() {
        Object.keys(this.makeupSettings).forEach(category => {
            if (this.makeupSettings[category].enabled !== undefined) {
                this.makeupSettings[category].enabled = false;
            }
        });
        
        this.saveToHistory();
        this.applyMakeup();
    }
    
    // Preset application
    applyPreset(presetName) {
        const presets = {
            natural: {
                foundation: { enabled: true, opacity: 0.5, coverage: 0.6 },
                blush: { enabled: true, color: '#FFB6C1', opacity: 0.3 },
                mascara: { enabled: true, opacity: 0.6 },
                lips: { enabled: true, color: '#FF6B8B', opacity: 0.5, finish: 'satin' }
            },
            glam: {
                foundation: { enabled: true, opacity: 0.8, coverage: 0.9, texture: 'matte' },
                eyeshadow: { enabled: true, colors: [
                    {color: '#9C27B0', position: 'crease', opacity: 0.7},
                    {color: '#673AB7', position: 'lid', opacity: 0.9}
                ]},
                eyeliner: { enabled: true, style: 'winged', thickness: 3 },
                lips: { enabled: true, color: '#D81B60', opacity: 0.9, finish: 'matte' },
                highlighter: { enabled: true, intensity: 0.8 }
            },
            smokey: {
                eyeshadow: { enabled: true, colors: [
                    {color: '#212121', position: 'crease', opacity: 0.8},
                    {color: '#424242', position: 'lid', opacity: 0.9},
                    {color: '#757575', position: 'browbone', opacity: 0.4}
                ], finish: 'matte' },
                eyeliner: { enabled: true, thickness: 4 },
                mascara: { enabled: true, intensity: 0.9 },
                lips: { enabled: true, color: '#333', opacity: 0.7, finish: 'matte' }
            },
            bridal: {
                foundation: { enabled: true, opacity: 0.7, finish: 'natural' },
                concealer: { enabled: true, intensity: 0.8 },
                blush: { enabled: true, color: '#FFCDD2', opacity: 0.4, placement: 'apples' },
                highlighter: { enabled: true, intensity: 0.6 },
                lips: { enabled: true, color: '#FF8A80', opacity: 0.6, finish: 'satin' }
            }
        };
        
        if (presets[presetName]) {
            Object.entries(presets[presetName]).forEach(([category, settings]) => {
                if (this.makeupSettings[category]) {
                    Object.assign(this.makeupSettings[category], settings);
                    this.makeupSettings[category].enabled = true;
                }
            });
            
            this.saveToHistory();
            this.applyMakeup();
            
            return true;
        }
        
        return false;
    }
    
    // Update individual setting
    updateMakeupSetting(category, property, value) {
        if (this.makeupSettings[category] && this.makeupSettings[category][property] !== undefined) {
            this.makeupSettings[category][property] = value;
        }
    }
    
    // Get current makeup settings
    getMakeupSettings() {
        return JSON.parse(JSON.stringify(this.makeupSettings));
    }
    
    // Check if makeup is applied
    hasMakeupApplied() {
        return Object.values(this.makeupSettings).some(category => 
            category.enabled === true
        );
    }
}
