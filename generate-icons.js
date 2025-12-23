const sharp = require('sharp');
const fs = require('fs-extra');
const path = require('path');

async function generateIcons() {
  const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
  const source = path.join(__dirname, '../src/assets/icon.png');
  const outputDir = path.join(__dirname, '../public/icons');
  
  await fs.ensureDir(outputDir);
  
  for (const size of sizes) {
    await sharp(source)
      .resize(size, size)
      .toFile(path.join(outputDir, `icon-${size}.png`));
    console.log(`Generated icon-${size}.png`);
  }
}

generateIcons().catch(console.error);
