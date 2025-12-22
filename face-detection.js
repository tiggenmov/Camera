// Advanced face detection with expression recognition and feature analysis
class EnhancedFaceDetection {
    constructor() {
        this.faceMesh = null;
        this.camera = null;
        this.isDetecting = false;
        this.faceExpressions = {
            neutral: 0,
            smiling: 0,
            eyesClosed: 0,
            mouthOpen: 0
        };
        this.faceFeatures = {
            faceShape: null,
            eyeSize: null,
            lipFullness: null,
            noseSize: null
        };
        this.landmarkHistory = [];
        this.MAX_HISTORY = 10;
    }

    async initialize() {
        try {
            this.faceMesh = new FaceMesh({
                locateFile: (file) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
                }
            });

            this.faceMesh.setOptions({
                maxNumFaces: 1,
                refineLandmarks: true,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5,
                staticImageMode: false
            });

            this.faceMesh.onResults(this.onFaceResults.bind(this));
            
            console.log('Enhanced Face Detection initialized');
            return true;
        } catch (error) {
            console.error('Failed to initialize face detection:', error);
            return false;
        }
    }

    async startCamera() {
        try {
            const video = document.createElement('video');
            video.style.display = 'none';
            document.body.appendChild(video);

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                }
            });

            video.srcObject = stream;
            await video.play();

            this.camera = new Camera(video, {
                onFrame: async () => {
                    if (this.isDetecting) {
                        await this.faceMesh.send({ image: video });
                    }
                },
                width: 640,
                height: 480
            });

            this.camera.start();
            this.isDetecting = true;
            return stream;
        } catch (error) {
            console.error('Camera error:', error);
            return null;
        }
    }

    stopCamera() {
        this.isDetecting = false;
        if (this.camera) {
            this.camera.stop();
        }
    }

    onFaceResults(results) {
        if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
            // No face detected
            this.onNoFace();
            return;
        }

        const landmarks = results.multiFaceLandmarks[0];
        
        // Store in history for smoothing
        this.landmarkHistory.push(landmarks);
        if (this.landmarkHistory.length > this.MAX_HISTORY) {
            this.landmarkHistory.shift();
        }

        // Get smoothed landmarks
        const smoothedLandmarks = this.smoothLandmarks();
        
        // Analyze face
        this.analyzeExpressions(smoothedLandmarks);
        this.analyzeFeatures(smoothedLandmarks);
        
        // Trigger events
        this.dispatchFaceEvent('facedetected', {
            landmarks: smoothedLandmarks,
            expressions: this.faceExpressions,
            features: this.faceFeatures
        });
    }

    smoothLandmarks() {
        if (this.landmarkHistory.length === 0) return null;
        if (this.landmarkHistory.length === 1) return this.landmarkHistory[0];

        const numLandmarks = this.landmarkHistory[0].length;
        const smoothed = [];

        for (let i = 0; i < numLandmarks; i++) {
            let sumX = 0, sumY = 0, sumZ = 0;
            
            for (let j = 0; j < this.landmarkHistory.length; j++) {
                sumX += this.landmarkHistory[j][i].x;
                sumY += this.landmarkHistory[j][i].y;
                sumZ += this.landmarkHistory[j][i].z;
            }
            
            smoothed.push({
                x: sumX / this.landmarkHistory.length,
                y: sumY / this.landmarkHistory.length,
                z: sumZ / this.landmarkHistory.length
            });
        }

        return smoothed;
    }

    analyzeExpressions(landmarks) {
        if (!landmarks) return;

        // Calculate mouth openness
        const mouthTop = landmarks[13]; // Top inner lip
        const mouthBottom = landmarks[14]; // Bottom inner lip
        const mouthOpenness = Math.abs(mouthBottom.y - mouthTop.y);
        this.faceExpressions.mouthOpen = mouthOpenness > 0.03 ? 1 : 0;

        // Calculate smile
        const leftMouthCorner = landmarks[61];
        const rightMouthCorner = landmarks[291];
        const smileWidth = Math.abs(rightMouthCorner.x - leftMouthCorner.x);
        this.faceExpressions.smiling = smileWidth > 0.1 ? 1 : 0;

        // Calculate eye closure
        const leftEyeTop = landmarks[159];
        const leftEyeBottom = landmarks[145];
        const rightEyeTop = landmarks[386];
        const rightEyeBottom = landmarks[374];
        
        const leftEyeOpenness = Math.abs(leftEyeBottom.y - leftEyeTop.y);
        const rightEyeOpenness = Math.abs(rightEyeBottom.y - rightEyeTop.y);
        
        this.faceExpressions.eyesClosed = (leftEyeOpenness < 0.01 && rightEyeOpenness < 0.01) ? 1 : 0;

        // Determine neutral
        this.faceExpressions.neutral = (
            !this.faceExpressions.mouthOpen &&
            !this.faceExpressions.smiling &&
            !this.faceExpressions.eyesClosed
        ) ? 1 : 0;
    }

    analyzeFeatures(landmarks) {
        if (!landmarks) return;

        // Analyze face shape
        this.faceFeatures.faceShape = this.determineFaceShape(landmarks);
        
        // Analyze eye size
        this.faceFeatures.eyeSize = this.calculateEyeSize(landmarks);
        
        // Analyze lip fullness
        this.faceFeatures.lipFullness = this.calculateLipFullness(landmarks);
        
        // Analyze nose size
        this.faceFeatures.noseSize = this.calculateNoseSize(landmarks);
    }

    determineFaceShape(landmarks) {
        // Calculate face proportions
        const faceWidth = Math.abs(landmarks[454].x - landmarks[234].x); // Cheek to cheek
        const faceHeight = Math.abs(landmarks[10].y - landmarks[152].y); // Forehead to chin
        
        const ratio = faceWidth / faceHeight;
        
        if (ratio > 1.05) return 'round';
        if (ratio < 0.85) return 'long';
        if (Math.abs(landmarks[454].x - landmarks[234].x) > 
            Math.abs(landmarks[33].x - landmarks[263].x) * 1.3) return 'heart';
        
        return 'oval';
    }

    calculateEyeSize(landmarks) {
        const leftEyeWidth = Math.abs(landmarks[33].x - landmarks[133].x);
        const rightEyeWidth = Math.abs(landmarks[362].x - landmarks[263].x);
        
        const avgEyeWidth = (leftEyeWidth + rightEyeWidth) / 2;
        const faceWidth = Math.abs(landmarks[454].x - landmarks[234].x);
        
        const ratio = avgEyeWidth / faceWidth;
        
        if (ratio > 0.15) return 'large';
        if (ratio < 0.1) return 'small';
        return 'medium';
    }

    calculateLipFullness(landmarks) {
        const lipHeight = Math.abs(landmarks[13].y - landmarks[14].y);
        const lipWidth = Math.abs(landmarks[61].x - landmarks[291].x);
        
        const ratio = lipHeight / lipWidth;
        
        if (ratio > 0.3) return 'full';
        if (ratio < 0.2) return 'thin';
        return 'medium';
    }

    calculateNoseSize(landmarks) {
        const noseWidth = Math.abs(landmarks[49].x - landmarks[279].x);
        const faceWidth = Math.abs(landmarks[454].x - landmarks[234].x);
        
        const ratio = noseWidth / faceWidth;
        
        if (ratio > 0.2) return 'wide';
        if (ratio < 0.15) return 'narrow';
        return 'medium';
    }

    onNoFace() {
        this.dispatchFaceEvent('noface');
    }

    dispatchFaceEvent(eventName, detail = {}) {
        const event = new CustomEvent(`face:${eventName}`, {
            detail: detail
        });
        document.dispatchEvent(event);
    }

    // Get makeup recommendations based on face features
    getFeatureBasedRecommendations() {
        const recommendations = {
            faceShape: {},
            eyeSize: {},
            lipFullness: {}
        };

        // Recommendations based on face shape
        switch (this.faceFeatures.faceShape) {
            case 'round':
                recommendations.faceShape = {
                    blush: 'Apply blush higher on cheekbones to elongate face',
                    contour: 'Contour along jawline and temples',
                    eyebrows: 'Higher arched brows create length'
                };
                break;
            case 'long':
                recommendations.faceShape = {
                    blush: 'Apply blush on apples of cheeks horizontally',
                    contour: 'Contour along hairline and under chin',
                    eyebrows: 'Flatter brows balance length'
                };
                break;
            case 'heart':
                recommendations.faceShape = {
                    blush: 'Apply blush lower on cheeks',
                    contour: 'Contour along temples and jawline',
                    eyebrows: 'Rounded brows soften forehead'
                };
                break;
            default: // oval
                recommendations.faceShape = {
                    blush: 'Apply blush on cheekbones',
                    contour: 'Light contour for definition',
                    eyebrows: 'Softly arched brows'
                };
        }

        // Recommendations based on eye size
        switch (this.faceFeatures.eyeSize) {
            case 'small':
                recommendations.eyeSize = {
                    eyeshadow: 'Light, shimmery colors to open up eyes',
                    eyeliner: 'Thin line on upper lid, white liner on waterline',
                    mascara: 'Focus on lengthening, not volumizing'
                };
                break;
            case 'large':
                recommendations.eyeSize = {
                    eyeshadow: 'Darker colors on outer corners',
                    eyeliner: 'Winged liner to elongate eyes',
                    mascara: 'Volumizing mascara'
                };
                break;
            default: // medium
                recommendations.eyeSize = {
                    eyeshadow: 'Most colors work well',
                    eyeliner: 'Classic liner on upper lid',
                    mascara: 'Balanced formula'
                };
        }

        // Recommendations based on lip fullness
        switch (this.faceFeatures.lipFullness) {
            case 'thin':
                recommendations.lipFullness = {
                    lipstick: 'Light, glossy colors to plump appearance',
                    liner: 'Overline slightly with matching liner',
                    finish: 'Glossy finishes create fullness'
                };
                break;
            case 'full':
                recommendations.lipFullness = {
                    lipstick: 'Matte or satin finishes',
                    liner: 'Line precisely at natural border',
                    finish: 'Avoid too much gloss'
                };
                break;
            default: // medium
                recommendations.lipFullness = {
                    lipstick: 'All finishes work',
                    liner: 'Define natural shape',
                    finish: 'Mix matte and gloss'
                };
        }

        return recommendations;
    }

    // Detect makeup application points with precision
    getPreciseApplicationPoints(landmarks) {
        return {
            lips: {
                upper: landmarks.slice(13, 20),
                lower: landmarks.slice(14, 20).reverse(),
                corners: [landmarks[61], landmarks[291]]
            },
            eyes: {
                left: {
                    lid: landmarks.slice(159, 165),
                    crease: landmarks.slice[33, 155, 133, 173],
                    outerCorner: landmarks[33],
                    innerCorner: landmarks[133]
                },
                right: {
                    lid: landmarks.slice(386, 392),
                    crease: landmarks.slice[362, 382, 263, 466],
                    outerCorner: landmarks[362],
                    innerCorner: landmarks[263]
                }
            },
            cheeks: {
                left: landmarks.slice(116, 120),
                right: landmarks.slice(346, 350),
                apples: [landmarks[100], landmarks[329]]
            },
            eyebrows: {
                left: landmarks.slice(70, 76),
                right: landmarks.slice(300, 306)
            }
        };
    }
}

// Face Detection UI Integration
class FaceDetectionUI {
    constructor(faceDetection, makeupEngine) {
        this.faceDetection = faceDetection;
        this.makeupEngine = makeupEngine;
        this.isActive = false;
        this.init();
    }

    init() {
        this.createUI();
        this.bindEvents();
        this.setupEventListeners();
    }

    createUI() {
        // Add face detection controls
        const cameraControls = document.querySelector('.camera-controls');
        
        const faceDetectionBtn = document.createElement('button');
        faceDetectionBtn.id = 'faceDetectionBtn';
        faceDetectionBtn.className = 'btn btn-secondary';
        faceDetectionBtn.innerHTML = '<i class="fas fa-face-smile"></i> Live Detection';
        
        cameraControls.appendChild(faceDetectionBtn);

        // Add face analysis panel
        const displayPanel = document.querySelector('.display-panel');
        
        const faceAnalysisPanel = document.createElement('div');
        faceAnalysisPanel.id = 'faceAnalysisPanel';
        faceAnalysisPanel.className = 'face-analysis-panel';
        faceAnalysisPanel.innerHTML = `
            <div class="face-analysis-header">
                <h4><i class="fas fa-brain"></i> Face Analysis</h4>
                <button id="closeAnalysisBtn" class="btn-close">&times;</button>
            </div>
            <div class="analysis-content">
                <div class="expression-meter">
                    <h5>Expressions</h5>
                    <div class="meter-group">
                        <div class="meter">
                            <span>Smiling</span>
                            <div class="meter-bar">
                                <div class="meter-fill" id="smileMeter"></div>
                            </div>
                        </div>
                        <div class="meter">
                            <span>Eyes Open</span>
                            <div class="meter-bar">
                                <div class="meter-fill" id="eyesMeter"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="face-features">
                    <h5>Features</h5>
                    <div class="features-grid">
                        <div class="feature-item">
                            <span class="feature-label">Face Shape:</span>
                            <span class="feature-value" id="faceShapeValue">-</span>
                        </div>
                        <div class="feature-item">
                            <span class="feature-label">Eyes:</span>
                            <span class="feature-value" id="eyeSizeValue">-</span>
                        </div>
                        <div class="feature-item">
                            <span class="feature-label">Lips:</span>
                            <span class="feature-value" id="lipFullnessValue">-</span>
                        </div>
                        <div class="feature-item">
                            <span class="feature-label">Nose:</span>
                            <span class="feature-value" id="noseSizeValue">-</span>
                        </div>
                    </div>
                </div>
                <div class="recommendations" id="faceRecommendations">
                    <h5>Makeup Tips</h5>
                    <div id="makeupTips"></div>
                </div>
            </div>
        `;
        
        displayPanel.appendChild(faceAnalysisPanel);
        
        // Initially hidden
        faceAnalysisPanel.style.display = 'none';
    }

    bindEvents() {
        document.getElementById('faceDetectionBtn').addEventListener('click', () => {
            this.toggleFaceDetection();
        });

        document.getElementById('closeAnalysisBtn').addEventListener('click', () => {
            this.hideAnalysisPanel();
        });
    }

    setupEventListeners() {
        // Listen for face detection events
        document.addEventListener('face:facedetected', (e) => {
            this.updateAnalysisPanel(e.detail);
        });

        document.addEventListener('face:noface', () => {
            this.showNoFaceMessage();
        });
    }

    async toggleFaceDetection() {
        if (!this.isActive) {
            await this.startFaceDetection();
        } else {
            this.stopFaceDetection();
        }
    }

    async startFaceDetection() {
        try {
            // Initialize face detection
            const initialized = await this.faceDetection.initialize();
            if (!initialized) {
                alert('Face detection failed to initialize');
                return;
            }

            // Start camera
            const stream = await this.faceDetection.startCamera();
            if (!stream) {
                alert('Unable to access camera');
                return;
            }

            this.isActive = true;
            document.getElementById('faceDetectionBtn').innerHTML = 
                '<i class="fas fa-stop-circle"></i> Stop Detection';
            document.getElementById('faceDetectionBtn').classList.add('active');

            // Show analysis panel
            this.showAnalysisPanel();

            // Update UI state
            this.updateDetectionStatus(true);

        } catch (error) {
            console.error('Failed to start face detection:', error);
            alert('Failed to start face detection: ' + error.message);
        }
    }

    stopFaceDetection() {
        this.faceDetection.stopCamera();
        this.isActive = false;
        
        document.getElementById('faceDetectionBtn').innerHTML = 
            '<i class="fas fa-face-smile"></i> Live Detection';
        document.getElementById('faceDetectionBtn').classList.remove('active');
        
        this.hideAnalysisPanel();
        this.updateDetectionStatus(false);
    }

    showAnalysisPanel() {
        const panel = document.getElementById('faceAnalysisPanel');
        panel.style.display = 'block';
        
        // Add animation
        panel.style.animation = 'slideInRight 0.3s ease';
    }

    hideAnalysisPanel() {
        const panel = document.getElementById('faceAnalysisPanel');
        panel.style.animation = 'slideOutRight 0.3s ease';
        
        setTimeout(() => {
            panel.style.display = 'none';
        }, 300);
    }

    updateAnalysisPanel(data) {
        // Update expression meters
        document.getElementById('smileMeter').style.width = 
            `${data.expressions.smiling * 100}%`;
        document.getElementById('eyesMeter').style.width = 
            `${(1 - data.expressions.eyesClosed) * 100}%`;

        // Update feature values
        document.getElementById('faceShapeValue').textContent = 
            data.features.faceShape || '-';
        document.getElementById('eyeSizeValue').textContent = 
            data.features.eyeSize || '-';
        document.getElementById('lipFullnessValue').textContent = 
            data.features.lipFullness || '-';
        document.getElementById('noseSizeValue').textContent = 
            data.features.noseSize || '-';

        // Update makeup recommendations
        this.updateMakeupTips(data.features);
        
        // Update makeup engine with latest landmarks
        this.makeupEngine.updateFaceLandmarks(data.landmarks);
    }

    updateMakeupTips(features) {
        const recommendations = this.faceDetection.getFeatureBasedRecommendations();
        let tipsHtml = '';

        if (features.faceShape && recommendations.faceShape) {
            tipsHtml += `
                <div class="tip-category">
                    <strong>For ${features.faceShape} face:</strong>
                    <ul>
                        ${Object.values(recommendations.faceShape)
                            .map(tip => `<li>${tip}</li>`)
                            .join('')}
                    </ul>
                </div>
            `;
        }

        if (features.eyeSize && recommendations.eyeSize) {
            tipsHtml += `
                <div class="tip-category">
                    <strong>For ${features.eyeSize} eyes:</strong>
                    <ul>
                        ${Object.values(recommendations.eyeSize)
                            .map(tip => `<li>${tip}</li>`)
                            .join('')}
                    </ul>
                </div>
            `;
        }

        if (features.lipFullness && recommendations.lipFullness) {
            tipsHtml += `
                <div class="tip-category">
                    <strong>For ${features.lipFullness} lips:</strong>
                    <ul>
                        ${Object.values(recommendations.lipFullness)
                            .map(tip => `<li>${tip}</li>`)
                            .join('')}
                    </ul>
                </div>
            `;
        }

        document.getElementById('makeupTips').innerHTML = tipsHtml;
    }

    showNoFaceMessage() {
        const tipsDiv = document.getElementById('makeupTips');
        tipsDiv.innerHTML = `
            <div class="no-face-message">
                <i class="fas fa-user-slash"></i>
                <p>No face detected. Please position your face in the frame.</p>
            </div>
        `;
    }

    updateDetectionStatus(isActive) {
        const statusIndicator = document.createElement('div');
        statusIndicator.id = 'detectionStatus';
        statusIndicator.className = `detection-status ${isActive ? 'active' : 'inactive'}`;
        statusIndicator.innerHTML = `
            <div class="status-dot"></div>
            <span>${isActive ? 'Live Detection Active' : 'Detection Off'}</span>
        `;

        const existingStatus = document.getElementById('detectionStatus');
        if (existingStatus) {
            existingStatus.remove();
        }

        const header = document.querySelector('.app-header');
        header.appendChild(statusIndicator);
    }
}
