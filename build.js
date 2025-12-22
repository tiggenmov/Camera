const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

class BuildManager {
    constructor() {
        this.projectRoot = process.cwd();
        this.buildDir = path.join(this.projectRoot, 'build');
        this.androidDir = path.join(this.projectRoot, 'android');
        this.iosDir = path.join(this.projectRoot, 'ios');
    }
    
    async clean() {
        console.log('🧹 Cleaning build directories...');
        
        if (fs.existsSync(this.buildDir)) {
            await fs.remove(this.buildDir);
        }
        
        if (fs.existsSync(this.androidDir)) {
            await fs.remove(this.androidDir);
        }
        
        if (fs.existsSync(this.iosDir)) {
            await fs.remove(this.iosDir);
        }
        
        console.log('✅ Clean complete');
    }
    
    async buildWeb() {
        console.log('🌐 Building web version...');
        
        // Create build directory
        await fs.ensureDir(this.buildDir);
        
        // Copy public files
        await fs.copy(path.join(this.projectRoot, 'public'), this.buildDir);
        
        // Copy src files
        await fs.copy(path.join(this.projectRoot, 'src'), path.join(this.buildDir, 'src'));
        
        // Generate service worker
        await this.generateServiceWorker();
        
        // Optimize images
        await this.optimizeImages();
        
        // Create build info
        await this.createBuildInfo();
        
        console.log('✅ Web build complete');
    }
    
    async buildAndroid() {
        console.log('🤖 Building Android app...');
        
        // Create Cordova project if it doesn't exist
        if (!fs.existsSync(this.androidDir)) {
            console.log('📱 Creating Cordova project...');
            execSync('cordova create android com.glamai.makeupstudio "GlamAI Makeup Studio"', {
                cwd: this.projectRoot,
                stdio: 'inherit'
            });
        }
        
        // Copy web build to Cordova www directory
        const wwwDir = path.join(this.androidDir, 'www');
        await fs.copy(this.buildDir, wwwDir);
        
        // Add Android platform
        execSync('cordova platform add android', {
            cwd: this.androidDir,
            stdio: 'inherit'
        });
        
        // Add plugins
        const plugins = [
            'cordova-plugin-camera',
            'cordova-plugin-file',
            'cordova-plugin-media-capture',
            'cordova-plugin-device',
            'cordova-plugin-network-information',
            'cordova-plugin-inappbrowser',
            'cordova-plugin-splashscreen',
            'cordova-plugin-statusbar',
            'cordova-plugin-screen-orientation',
            'cordova-plugin-whitelist'
        ];
        
        for (const plugin of plugins) {
            execSync(`cordova plugin add ${plugin}`, {
                cwd: this.androidDir,
                stdio: 'inherit'
            });
        }
        
        // Build Android app
        execSync('cordova build android --release', {
            cwd: this.androidDir,
            stdio: 'inherit'
        });
        
        console.log('✅ Android build complete');
        console.log('📦 APK location: android/platforms/android/app/build/outputs/apk/release/');
    }
    
    async buildIOS() {
        console.log('🍎 Building iOS app (requires macOS)...');
        
        // Similar to Android build but for iOS
        // Note: Requires macOS and Xcode
        
        console.log('✅ iOS build instructions:');
        console.log('1. Open Xcode');
        console.log('2. Open ios/platforms/ios/GlamAI.xcworkspace');
        console.log('3. Configure signing certificates');
        console.log('4. Build and archive');
    }
    
    async generateServiceWorker() {
        const swContent = `
// Auto-generated service worker
const CACHE_NAME = 'glamai-${Date.now()}';
const ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/src/css/main.css',
    '/src/js/app.js'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    );
});
        `;
        
        await fs.writeFile(path.join(this.buildDir, 'service-worker.js'), swContent);
    }
    
    async optimizeImages() {
        console.log('🖼️ Optimizing images...');
        // This would use sharp or imagemin in production
    }
    
    async createBuildInfo() {
        const buildInfo = {
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            commit: process.env.GIT_COMMIT || 'local',
            environment: process.env.NODE_ENV || 'development'
        };
        
        await fs.writeJson(path.join(this.buildDir, 'build-info.json'), buildInfo, {
            spaces: 2
        });
    }
    
    async buildAll() {
        try {
            await this.clean();
            await this.buildWeb();
            await this.buildAndroid();
            // await this.buildIOS(); // Uncomment if building for iOS
            
            console.log('🎉 All builds complete!');
            console.log('\n📱 Next steps for Play Store:');
            console.log('1. Sign APK with your keystore');
            console.log('2. Create app listing on Google Play Console');
            console.log('3. Upload APK to Play Console');
            console.log('4. Add screenshots and description');
            console.log('5. Submit for review');
            
        } catch (error) {
            console.error('🚨 Build failed:', error);
            process.exit(1);
        }
    }
}

// Run build
const builder = new BuildManager();
builder.buildAll();
