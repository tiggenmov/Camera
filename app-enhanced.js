// Enhanced main application with all advanced features
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Initializing Enhanced GlamAI Makeup Studio...');
    
    // Initialize core engine
    const makeupEngine = new MakeupEngine('outputCanvas');
    console.log('✅ Makeup Engine initialized');
    
    // Initialize UI controls
    const uiControls = new UIControls(makeupEngine);
    console.log('✅ UI Controls initialized');
    
    // Initialize History System
    const historyManager = new MakeupHistory(makeupEngine);
    const historyUI = new HistoryUI(historyManager, uiControls);
    new MakeupChangeObserver(makeupEngine, historyManager);
    console.log('✅ History System initialized');
    
    // Initialize AI Suggestions
    const aiEngine = new AISuggestions(makeupEngine);
    const aiUI = new AISuggestionsUI(aiEngine, uiControls);
    console.log('✅ AI Suggestions initialized');
    
    // Initialize Enhanced Face Detection
    const faceDetection = new EnhancedFaceDetection();
    const faceDetectionUI = new FaceDetectionUI(faceDetection, makeupEngine);
    console.log('✅ Face Detection initialized');
    
    // Add CSS animations
    addAdvancedStyles();
    
    // Global access for debugging
    window.app = {
        engine: makeupEngine,
        ui: uiControls,
        history: historyManager,
        ai: aiEngine,
        faceDetection: faceDetection
    };
    
    console.log('🎉 GlamAI Enhanced fully initialized!');
    
    // Demo mode (optional)
    // setTimeout(() => showWelcomeTour(), 1000);
});

function addAdvancedStyles() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        @keyframes slideUp {
            from { transform: translateY(100%); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        .ai-notification {
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
        }
    `;
    document.head.appendChild(style);
}

function showWelcomeTour() {
    if (!localStorage.getItem('glamai_tour_completed')) {
        const tour = document.createElement('div');
        tour.id = 'welcomeTour';
        tour.innerHTML = `
            <div class="tour-overlay"></div>
            <div class="tour-modal">
                <div class="tour-header">
                    <h2>Welcome to GlamAI! 🎨</h2>
                    <p>Your virtual makeup studio with advanced features</p>
                </div>
                <div class="tour-steps">
                    <div class="tour-step active" data-step="1">
                        <h3>🎯 Upload or Capture</h3>
                        <p>Start by uploading a photo or using your camera</p>
                    </div>
                    <div class="tour-step" data-step="2">
                        <h3>🤖 AI Assistant</h3>
                        <p>Get personalized color recommendations based on your features</p>
                    </div>
                    <div class="tour-step" data-step="3">
                        <h3>📜 History & Saves</h3>
                        <p>Undo/redo changes and save your favorite looks</p>
                    </div>
                    <div class="tour-step" data-step="4">
                        <h3>🎭 Live Detection</h3>
                        <p>Use live face detection for real-time makeup preview</p>
                    </div>
                </div>
                <div class="tour-footer">
                    <button id="skipTour" class="btn btn-outline">Skip Tour</button>
                    <button id="nextTour" class="btn btn-primary">Next →</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(tour);
        
        let currentStep = 1;
        
        document.getElementById('nextTour').addEventListener('click', () => {
            currentStep++;
            if (currentStep > 4) {
                completeTour();
                return;
            }
            
            document.querySelectorAll('.tour-step').forEach(step => {
                step.classList.remove('active');
            });
            document.querySelector(`[data-step="${currentStep}"]`).classList.add('active');
        });
        
        document.getElementById('skipTour').addEventListener('click', completeTour);
        
        function completeTour() {
            localStorage.setItem('glamai_tour_completed', 'true');
            document.getElementById('welcomeTour').remove();
        }
    }
}
