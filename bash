#!/bin/bash
echo "🚀 Setting up GlamAI Makeup Studio..."

# Fill in your information
YOUR_NAME="Mikiale Yemane"
YOUR_GITHUB_USERNAME="tiggenmov"
YOUR_EMAIL="michealyemane359@gmail.com"
PROJECT_NAME="BeatyBot"

# 1. Update package.json with your details
cat > package.json << EOF
{
  "name": "glamai-makeup-studio",
  "version": "1.0.0",
  "description": "AI-powered virtual makeup try-on app for Android",
  "main": "src/js/app.js",
  "scripts": {
    "start": "http-server public -p 3000",
    "dev": "live-server public --port=3000",
    "build": "echo 'Build completed'",
    "build:web": "mkdir -p dist && cp -r public/* dist/",
    "test": "jest",
    "lint": "eslint src/js",
    "deploy": "npm run build:web && netlify deploy --prod",
    "generate-icons": "node scripts/generate-icons.js || echo 'Icons script not found'",
    "optimize-images": "node scripts/optimize-images.js || echo 'Optimize script not found'"
  },
  "dependencies": {
    "@mediapipe/face_mesh": "^0.4.0",
    "@tensorflow/tfjs": "^4.0.0",
    "@tensorflow-models/face-landmarks-detection": "^1.0.0",
    "sharp": "^0.33.4"
  },
  "devDependencies": {
    "eslint": "^8.57.0",
    "fs-extra": "^11.0.0",
    "http-server": "^14.0.0",
    "jest": "^29.0.0",
    "live-server": "^1.2.2",
    "webpack": "^5.0.0",
    "webpack-cli": "^5.0.0"
  },
  "keywords": [
    "makeup",
    "virtual",
    "ai",
    "beauty",
    "android",
    "pwa"
  ],
  "author": "${YOUR_NAME}",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/${YOUR_GITHUB_USERNAME}/glamai-makeup-studio"
  },
  "bugs": {
    "url": "https://github.com/${YOUR_GITHUB_USERNAME}/glamai-makeup-studio/issues"
  },
  "homepage": "https://glamai.app"
}
EOF

echo "✅ package.json updated with your details"

# 2. Create .gitignore file
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Build outputs
dist/
build/
.cache/
public/icons/
public/assets/

# Environment variables
.env
.env.local
.env.development
.env.production

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# IDE files
.vscode/
.idea/
*.swp
*.swo
*~

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Cordova
platforms/
plugins/

# Logs
logs
*.log

# Coverage directory used by tools like istanbul
coverage/

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env

# Next.js build output
.next

# Nuxt.js build / generate output
.nuxt

# Gatsby files
.cache/
public

# Serverless directories
.serverless/

# FuseBox cache
.fusebox/

# Temporary files
*.tmp
*.temp

# Sharp cache
.sharp-cache/

# Test output
test-results/

# Package lock
package-lock.json
EOF

echo "✅ .gitignore created"

# 3. Create Node.js version file
echo "18" > .nvmrc
echo "✅ .nvmrc created"

# 4. Create Netlify configuration
cat > netlify.toml << 'EOF'
[build]
  publish = "dist"
  command = "npm run build:web"

[build.environment]
  NODE_VERSION = "18"
  SHARP_IGNORE_GLOBAL_LIBVIPS = "1"
  NODE_ENV = "production"

[context.production.environment]
  NODE_ENV = "production"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
EOF

echo "✅ netlify.toml created"

# 5. Create scripts directory and basic scripts
mkdir -p scripts

# Create generate-icons.js
cat > scripts/generate-icons.js << 'EOF'
const sharp = require('sharp');
const fs = require('fs-extra');
const path = require('path');

async function generateIcons() {
  try {
    const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
    const source = path.join(__dirname, '../src/assets/icon.png');
    const outputDir = path.join(__dirname, '../public/icons');
    
    // Check if source exists
    if (!await fs.pathExists(source)) {
      console.log('⚠️  Source icon not found:', source);
      console.log('📝 Creating a placeholder icon...');
      
      // Create a placeholder icon
      await fs.ensureDir(path.dirname(source));
      await sharp({
        create: {
          width: 512,
          height: 512,
          channels: 4,
          background: { r: 255, g: 107, b: 139 }
        }
      })
      .composite([{
        input: Buffer.from(`
          <svg width="512" height="512">
            <rect width="512" height="512" fill="#ff6b8b"/>
            <text x="256" y="256" font-family="Arial" font-size="48" 
                  fill="white" text-anchor="middle" dy=".3em">GlamAI</text>
          </svg>
        `),
        top: 0,
        left: 0
      }])
      .png()
      .toFile(source);
      
      console.log('✅ Created placeholder icon');
    }
    
    await fs.ensureDir(outputDir);
    
    for (const size of sizes) {
      await sharp(source)
        .resize(size, size)
        .toFile(path.join(outputDir, \`icon-\${size}.png\`));
      console.log(\`✅ Generated icon-\${size}.png\`);
    }
    
    console.log('🎉 All icons generated successfully!');
  } catch (error) {
    console.error('❌ Error generating icons:', error.message);
    process.exit(1);
  }
}

generateIcons();
EOF

# Create optimize-images.js
cat > scripts/optimize-images.js << 'EOF'
const sharp = require('sharp');
const fs = require('fs-extra');
const path = require('path');

async function optimizeImages() {
  try {
    const assetsDir = path.join(__dirname, '../src/assets');
    const outputDir = path.join(__dirname, '../public/assets');
    
    // Create directories if they don't exist
    await fs.ensureDir(assetsDir);
    await fs.ensureDir(outputDir);
    
    // Check if there are any images to optimize
    const files = await fs.readdir(assetsDir);
    const imageFiles = files.filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file));
    
    if (imageFiles.length === 0) {
      console.log('📁 No images found in src/assets/');
      console.log('💡 Place your images in src/assets/ and run again');
      return;
    }
    
    console.log(\`🖼️  Found \${imageFiles.length} images to optimize\`);
    
    for (const file of imageFiles) {
      const inputPath = path.join(assetsDir, file);
      const outputName = path.parse(file).name + '.webp';
      const outputPath = path.join(outputDir, outputName);
      
      try {
        await sharp(inputPath)
          .webp({ quality: 80 })
          .toFile(outputPath);
        
        const originalStats = await fs.stat(inputPath);
        const optimizedStats = await fs.stat(outputPath);
        const savings = ((originalStats.size - optimizedStats.size) / originalStats.size * 100).toFixed(1);
        
        console.log(\`✅ Optimized \${file} → \${outputName} (saved \${savings}%)\`);
      } catch (error) {
        console.warn(\`⚠️  Could not optimize \${file}:\`, error.message);
      }
    }
    
    console.log('🎉 Image optimization completed!');
  } catch (error) {
    console.error('❌ Error optimizing images:', error.message);
  }
}

optimizeImages();
EOF

echo "✅ Scripts created in scripts/ directory"

# 6. Create basic project structure
mkdir -p public/{css,js,assets,brands,tutorials}
mkdir -p src/{css,js/{core,features,components,utils},assets/{images,sounds,fonts}}

# Create basic CSS file
cat > public/css/style.css << 'EOF'
/* GlamAI Makeup Studio - Main Styles */
:root {
  --primary-color: #ff6b8b;
  --secondary-color: #6a11cb;
  --accent-color: #2575fc;
  --dark-color: #2d3436;
  --light-color: #f8f9fa;
  --success-color: #00b894;
  --warning-color: #fdcb6e;
  --danger-color: #d63031;
  
  --gradient-primary: linear-gradient(135deg, #ff6b8b 0%, #6a11cb 100%);
  --gradient-secondary: linear-gradient(135deg, #2575fc 0%, #6a11cb 100%);
  
  --shadow-sm: 0 2px 4px rgba(0,0,0,0.1);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
  --shadow-lg: 0 10px 15px rgba(0,0,0,0.1);
  --shadow-xl: 0 20px 25px rgba(0,0,0,0.1);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  color: var(--dark-color);
}

.app-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  text-align: center;
  margin-bottom: 40px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  box-shadow: var(--shadow-lg);
}

.header h1 {
  font-size: 3rem;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  margin-bottom: 10px;
}

.header p {
  color: #666;
  font-size: 1.2rem;
}

.main-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  margin-bottom: 40px;
}

.camera-section, .controls-section {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  padding: 30px;
  box-shadow: var(--shadow-lg);
}

.video-container {
  width: 100%;
  height: 400px;
  background: #000;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 20px;
  position: relative;
}

#videoElement {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.controls-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.control-group {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 10px;
}

.control-group h3 {
  font-size: 1rem;
  margin-bottom: 10px;
  color: var(--primary-color);
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 25px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary {
  background: var(--gradient-primary);
  color: white;
}

.btn-secondary {
  background: var(--gradient-secondary);
  color: white;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.btn:active {
  transform: translateY(0);
}

.footer {
  text-align: center;
  padding: 20px;
  color: white;
  font-size: 0.9rem;
}

/* Responsive design */
@media (max-width: 768px) {
  .main-content {
    grid-template-columns: 1fr;
  }
  
  .header h1 {
    font-size: 2rem;
  }
  
  .video-container {
    height: 300px;
  }
}
EOF

# Create basic HTML file
cat > public/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GlamAI Makeup Studio - Virtual Makeup Try-On</title>
    <meta name="description" content="AI-powered virtual makeup try-on app. Try different makeup styles in real-time using your camera.">
    
    <!-- PWA Manifest -->
    <link rel="manifest" href="/manifest.json">
    
    <!-- Favicon -->
    <link rel="icon" type="image/png" href="/icons/icon-192.png">
    
    <!-- Styles -->
    <link rel="stylesheet" href="/css/style.css">
    
    <!-- Font Awesome for icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <!-- Analytics (Add your GA4 ID here) -->
    <!-- <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script> -->
</head>
<body>
    <div class="app-container">
        <header class="header">
            <h1><i class="fas fa-sparkles"></i> GlamAI Makeup Studio</h1>
            <p>Try on virtual makeup in real-time with AI-powered technology</p>
        </header>
        
        <main class="main-content">
            <section class="camera-section">
                <h2><i class="fas fa-camera"></i> Live Preview</h2>
                <div class="video-container">
                    <video id="videoElement" autoplay playsinline></video>
                    <canvas id="overlayCanvas" style="position: absolute; top: 0; left: 0;"></canvas>
                </div>
                <div class="camera-controls">
                    <button id="startCamera" class="btn btn-primary">
                        <i class="fas fa-video"></i> Start Camera
                    </button>
                    <button id="capturePhoto" class="btn btn-secondary">
                        <i class="fas fa-camera-retro"></i> Capture Photo
                    </button>
                    <button id="toggleMakeup" class="btn">
                        <i class="fas fa-paint-brush"></i> Toggle Makeup
                    </button>
                </div>
            </section>
            
            <section class="controls-section">
                <h2><i class="fas fa-sliders-h"></i> Makeup Controls</h2>
                
                <div class="controls-grid">
                    <div class="control-group">
                        <h3><i class="fas fa-lips"></i> Lips</h3>
                        <input type="range" id="lipstickColor" min="0" max="360" value="0">
                        <input type="range" id="lipstickIntensity" min="0" max="100" value="50">
                    </div>
                    
                    <div class="control-group">
                        <h3><i class="fas fa-eye"></i> Eyeshadow</h3>
                        <input type="range" id="eyeshadowColor" min="0" max="360" value="180">
                        <input type="range" id="eyeshadowIntensity" min="0" max="100" value="50">
                    </div>
                    
                    <div class="control-group">
                        <h3><i class="fas fa-blush"></i> Blush</h3>
                        <input type="range" id="blushColor" min="0" max="360" value="10">
                        <input type="range" id="blushIntensity" min="0" max="100" value="30">
                    </div>
                    
                    <div class="control-group">
                        <h3><i class="fas fa-eye-lash"></i> Eyeliner</h3>
                        <input type="range" id="eyelinerIntensity" min="0" max="100" value="70">
                        <select id="eyelinerStyle">
                            <option value="natural">Natural</option>
                            <option value="cat">Cat Eye</option>
                            <option value="smoky">Smoky</option>
                        </select>
                    </div>
                </div>
                
                <div class="preset-buttons">
                    <h3><i class="fas fa-palette"></i> Preset Looks</h3>
                    <button class="btn" data-look="natural">Natural Day</button>
                    <button class="btn" data-look="evening">Evening Glam</button>
                    <button class="btn" data-look="party">Party Bold</button>
                    <button class="btn" data-look="reset">Reset</button>
                </div>
            </section>
        </main>
        
        <footer class="footer">
            <p>GlamAI Makeup Studio &copy; 2024 | AI-powered virtual beauty experience</p>
            <p class="social-links">
                <a href="#"><i class="fab fa-github"></i></a>
                <a href="#"><i class="fab fa-twitter"></i></a>
                <a href="#"><i class="fab fa-instagram"></i></a>
            </p>
        </footer>
    </div>

    <!-- JavaScript -->
    <script src="/js/app.js"></script>
</body>
</html>
EOF

# Create basic JavaScript file
cat > public/js/app.js << 'EOF'
// GlamAI Makeup Studio - Main Application
console.log('🎭 GlamAI Makeup Studio Initializing...');

class GlamAIApp {
    constructor() {
        this.videoElement = document.getElementById('videoElement');
        this.overlayCanvas = document.getElementById('overlayCanvas');
        this.ctx = this.overlayCanvas.getContext('2d');
        
        this.makeupSettings = {
            lips: { color: 0, intensity: 50, visible: true },
            eyeshadow: { color: 180, intensity: 50, visible: true },
            blush: { color: 10, intensity: 30, visible: true },
            eyeliner: { intensity: 70, style: 'natural', visible: true }
        };
        
        this.isCameraActive = false;
        this.isMakeupActive = true;
        
        this.init();
    }
    
    init() {
        console.log('🚀 Initializing GlamAI App...');
        
        // Set canvas size to match video
        this.updateCanvasSize();
        window.addEventListener('resize', () => this.updateCanvasSize());
        
        // Initialize event listeners
        this.setupEventListeners();
        
        // Initialize face detection (placeholder for now)
        this.initFaceDetection();
        
        console.log('✅ GlamAI App Initialized');
    }
    
    updateCanvasSize() {
        if (this.videoElement.videoWidth) {
            this.overlayCanvas.width = this.videoElement.videoWidth;
            this.overlayCanvas.height = this.videoElement.videoHeight;
        } else {
            this.overlayCanvas.width = 640;
            this.overlayCanvas.height = 480;
        }
    }
    
    setupEventListeners() {
        // Camera controls
        document.getElementById('startCamera').addEventListener('click', () => this.toggleCamera());
        document.getElementById('capturePhoto').addEventListener('click', () => this.capturePhoto());
        document.getElementById('toggleMakeup').addEventListener('click', () => this.toggleMakeup());
        
        // Makeup controls
        document.getElementById('lipstickColor').addEventListener('input', (e) => {
            this.makeupSettings.lips.color = e.target.value;
            this.updateMakeup();
        });
        
        document.getElementById('lipstickIntensity').addEventListener('input', (e) => {
            this.makeupSettings.lips.intensity = e.target.value;
            this.updateMakeup();
        });
        
        document.getElementById('eyeshadowColor').addEventListener('input', (e) => {
            this.makeupSettings.eyeshadow.color = e.target.value;
            this.updateMakeup();
        });
        
        // Preset looks
        document.querySelectorAll('[data-look]').forEach(button => {
            button.addEventListener('click', (e) => {
                const look = e.target.dataset.look;
                this.applyPresetLook(look);
            });
        });
        
        console.log('✅ Event listeners setup complete');
    }
    
    async toggleCamera() {
        if (!this.isCameraActive) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                        facingMode: 'user'
                    },
                    audio: false
                });
                
                this.videoElement.srcObject = stream;
                this.isCameraActive = true;
                document.getElementById('startCamera').innerHTML = '<i class="fas fa-video-slash"></i> Stop Camera';
                
                console.log('📹 Camera started successfully');
                
                // Start face detection loop
                this.startDetectionLoop();
                
            } catch (error) {
                console.error('❌ Error accessing camera:', error);
                alert('Unable to access camera. Please check permissions.');
            }
        } else {
            const stream = this.videoElement.srcObject;
            const tracks = stream.getTracks();
            
            tracks.forEach(track => track.stop());
            this.videoElement.srcObject = null;
            this.isCameraActive = false;
            document.getElementById('startCamera').innerHTML = '<i class="fas fa-video"></i> Start Camera';
            
            console.log('📹 Camera stopped');
        }
    }
    
    capturePhoto() {
        if (!this.isCameraActive) {
            alert('Please start the camera first!');
            return;
        }
        
        // Create a temporary canvas
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.overlayCanvas.width;
        tempCanvas.height = this.overlayCanvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        
        // Draw video frame
        tempCtx.drawImage(this.videoElement, 0, 0);
        
        // Draw makeup overlay
        if (this.isMakeupActive) {
            tempCtx.drawImage(this.overlayCanvas, 0, 0);
        }
        
        // Convert to data URL and trigger download
        const dataUrl = tempCanvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `glamai-photo-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
        
        console.log('📸 Photo captured and saved');
        
        // Show success message
        this.showNotification('Photo saved successfully!', 'success');
    }
    
    toggleMakeup() {
        this.isMakeupActive = !this.isMakeupActive;
        const button = document.getElementById('toggleMakeup');
        
        if (this.isMakeupActive) {
            button.innerHTML = '<i class="fas fa-paint-brush"></i> Hide Makeup';
            button.classList.add('btn-primary');
            button.classList.remove('btn-secondary');
        } else {
            button.innerHTML = '<i class="fas fa-paint-brush"></i> Show Makeup';
            button.classList.remove('btn-primary');
            button.classList.add('btn-secondary');
        }
        
        this.updateMakeup();
        console.log(`🎨 Makeup ${this.isMakeupActive ? 'enabled' : 'disabled'}`);
    }
    
    updateMakeup() {
        if (!this.isMakeupActive || !this.isCameraActive) {
            this.ctx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
            return;
        }
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
        
        // For now, draw simple makeup visualization
        // This will be replaced with actual face detection and makeup application
        this.drawPlaceholderMakeup();
        
        console.log('🔄 Makeup updated');
    }
    
    drawPlaceholderMakeup() {
        const width = this.overlayCanvas.width;
        const height = this.overlayCanvas.height;
        
        // Draw lips (placeholder)
        this.ctx.fillStyle = `hsl(${this.makeupSettings.lips.color}, 100%, 50%)`;
        this.ctx.globalAlpha = this.makeupSettings.lips.intensity / 100;
        this.ctx.beginPath();
        this.ctx.ellipse(width/2, height/2 + 50, 80, 40, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw eyes (placeholder)
        this.ctx.fillStyle = `hsl(${this.makeupSettings.eyeshadow.color}, 100%, 50%)`;
        this.ctx.globalAlpha = this.makeupSettings.eyeshadow.intensity / 100;
        this.ctx.beginPath();
        this.ctx.ellipse(width/2 - 100, height/2 - 30, 40, 25, 0, 0, Math.PI * 2);
        this.ctx.ellipse(width/2 + 100, height/2 - 30, 40, 25, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw blush (placeholder)
        this.ctx.fillStyle = `hsl(${this.makeupSettings.blush.color}, 100%, 75%)`;
        this.ctx.globalAlpha = this.makeupSettings.blush.intensity / 100;
        this.ctx.beginPath();
        this.ctx.ellipse(width/2 - 150, height/2 + 20, 30, 20, 0, 0, Math.PI * 2);
        this.ctx.ellipse(width/2 + 150, height/2 + 20, 30, 20, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.globalAlpha = 1.0;
    }
    
    applyPresetLook(look) {
        console.log(`🎭 Applying preset look: ${look}`);
        
        const presets = {
            natural: {
                lips: { color: 350, intensity: 40 },
                eyeshadow: { color: 280, intensity: 30 },
                blush: { color: 15, intensity: 25 },
                eyeliner: { intensity: 40, style: 'natural' }
            },
            evening: {
                lips: { color: 0, intensity: 80 },
                eyeshadow: { color: 240, intensity: 70 },
                blush: { color: 10, intensity: 40 },
                eyeliner: { intensity: 90, style: 'cat' }
            },
            party: {
                lips: { color: 120, intensity: 90 },
                eyeshadow: { color: 60, intensity: 80 },
                blush: { color: 300, intensity: 60 },
                eyeliner: { intensity: 100, style: 'smoky' }
            },
            reset: {
                lips: { color: 0, intensity: 50 },
                eyeshadow: { color: 180, intensity: 50 },
                blush: { color: 10, intensity: 30 },
                eyeliner: { intensity: 70, style: 'natural' }
            }
        };
        
        if (presets[look]) {
            this.makeupSettings = { ...this.makeupSettings, ...presets[look] };
            
            // Update UI sliders
            document.getElementById('lipstickColor').value = this.makeupSettings.lips.color;
            document.getElementById('lipstickIntensity').value = this.makeupSettings.lips.intensity;
            document.getElementById('eyeshadowColor').value = this.makeupSettings.eyeshadow.color;
            document.getElementById('eyeshadowIntensity').value = this.makeupSettings.eyeshadow.intensity;
            document.getElementById('blushColor').value = this.makeupSettings.blush.color;
            document.getElementById('blushIntensity').value = this.makeupSettings.blush.intensity;
            document.getElementById('eyelinerIntensity').value = this.makeupSettings.eyeliner.intensity;
            document.getElementById('eyelinerStyle').value = this.makeupSettings.eyeliner.style;
            
            this.updateMakeup();
            this.showNotification(`Applied ${look} look!`, 'success');
        }
    }
    
    initFaceDetection() {
        // Placeholder for face detection initialization
        // Will integrate with TensorFlow.js and MediaPipe Face Mesh
        console.log('🤖 Face detection placeholder initialized');
    }
    
    startDetectionLoop() {
        // Placeholder for face detection loop
        // This will continuously detect faces and apply makeup
        console.log('🔄 Starting detection loop placeholder');
    }
    
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
            ${message}
        `;
        
        // Style the notification
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#00b894' : '#0984e3'};
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            z-index: 1000;
            animation: slideIn 0.3s ease;
            display: flex;
            align-items: center;
            gap: 10px;
        `;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.glamAI = new GlamAIApp();
    
    // Add CSS animations for notifications
    const style = document.createElement('style');
    style.textContent = \`
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    \`;
    document.head.appendChild(style);
    
    console.log('🎉 GlamAI Makeup Studio Ready!');
});
EOF

# Create manifest.json for PWA
cat > public/manifest.json << 'EOF'
{
  "name": "GlamAI Makeup Studio",
  "short_name": "GlamAI",
  "description": "AI-powered virtual makeup try-on app",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#ff6b8b",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "categories": ["beauty", "lifestyle", "entertainment"],
  "screenshots": [
    {
      "src": "/assets/screenshots/screenshot1.png",
      "sizes": "1280x720",
      "type": "image/png",
      "label": "Main interface"
    }
  ],
  "shortcuts": [
    {
      "name": "Try New Look",
      "short_name": "New Look",
      "description": "Try a new makeup style",
      "url": "/?new=true",
      "icons": [{ "src": "/icons/icon-96.png", "sizes": "96x96" }]
    },
    {
      "name": "Capture Photo",
      "short_name": "Capture",
      "description": "Take a photo with your makeup",
      "url": "/?capture=true",
      "icons": [{ "src": "/icons/icon-96.png", "sizes": "96x96" }]
    }
  ]
}
EOF

# 7. Install dependencies
echo "📦 Installing dependencies..."
npm install

echo "✅ Project setup complete!"
echo ""
echo "📁 Project Structure Created:"
echo "├── package.json          # Updated with your details"
echo "├── .gitignore            # Git ignore file"
echo "├── .nvmrc                # Node.js version 18"
echo "├── netlify.toml          # Netlify configuration"
echo "├── scripts/              # Build scripts"
echo "│   ├── generate-icons.js"
echo "│   └── optimize-images.js"
echo "├── public/               # Web files"
echo "│   ├── index.html        # Main HTML"
echo "│   ├── css/style.css     # Styles"
echo "│   ├── js/app.js         # Main JavaScript"
echo "│   └── manifest.json     # PWA manifest"
echo "└── src/                  # Source files"
echo ""
echo "🚀 Next Steps:"
echo "1. Update your personal details in package.json:"
echo "   - YOUR_NAME: Replace with your full name"
echo "   - YOUR_GITHUB_USERNAME: Replace with your GitHub username"
echo "   - YOUR_EMAIL: Replace with your email"
echo ""
echo "2. Run the icon generator:"
echo "   npm run generate-icons"
echo ""
echo "3. Start the development server:"
echo "   npm run dev"
echo ""
echo "4. Deploy to Netlify:"
echo "   npm run deploy"
echo ""
echo "📝 Note: You need to replace the placeholder values in the script above with your actual information!"
