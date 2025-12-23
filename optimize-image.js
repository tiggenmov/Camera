const sharp = require('sharp');
const fs = require('fs-extra');
const path = require('path');

async function optimizeImages() {
  const assetsDir = path.join(__dirname, '../src/assets');
  const outputDir = path.join(__dirname, '../public/assets');
  
  await fs.ensureDir(outputDir);
  
  const files = await fs.readdir(assetsDir);
  
  for (const file of files) {
    if (/\.(jpg|jpeg|png|webp)$/i.test(file)) {
      const inputPath = path.join(assetsDir, file);
      const outputPath = path.join(outputDir, path.parse(file).name + '.webp');
      
      await sharp(inputPath)
        .webp({ quality: 80 })
        .toFile(outputPath);
      
      console.log(`Optimized ${file} → ${path.basename(outputPath)}`);
    }
  }
}

optimizeImages().catch(console.error);
