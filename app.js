// Main application initialization
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the makeup engine
    const makeupEngine = new MakeupEngine('outputCanvas');
    
    // Initialize UI controls
    const uiControls = new UIControls(makeupEngine);
    
    // Add some CSS for notifications
    const style = document.createElement('style');
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
    
    // Demo image for testing (optional)
    const demoImage = new Image();
    demoImage.onload = () => {
        // Uncomment to auto-load demo image
        // document.getElementById('imagePlaceholder').style.display = 'none';
        // document.getElementById('sourceImage').src = demoImage.src;
        // document.getElementById('sourceImage').style.display = 'block';
        // makeupEngine.setSourceImage(demoImage);
    };
    // demoImage.src = 'assets/demo-face.jpg'; // Add a demo image
    
    console.log('GlamAI Makeup Studio initialized!');
    
    // For development: Export to console for easy access
    window.makeupEngine = makeupEngine;
    window.uiControls = uiControls;
});
