const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function createIcon() {
  const inputPath = path.join(__dirname, '..', 'assets', 'images', 'logo.png');
  const outputPath = path.join(__dirname, '..', 'build', 'icon.png');

  // Ensure build directory exists
  const buildDir = path.dirname(outputPath);
  if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
  }

  // Get image info
  const metadata = await sharp(inputPath).metadata();
  console.log(`Original size: ${metadata.width}x${metadata.height}`);

  // Make it square (256x256 for good quality icon)
  const size = 256;

  await sharp(inputPath)
    .resize(size, size, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    })
    .png()
    .toFile(outputPath);

  console.log(`Created square icon: ${outputPath} (${size}x${size})`);

  // Also create ico using png-to-ico
  try {
    const pngToIco = require('png-to-ico');
    const icoBuffer = await pngToIco(outputPath);
    const icoPath = path.join(buildDir, 'icon.ico');
    fs.writeFileSync(icoPath, icoBuffer);
    console.log(`Created ICO: ${icoPath}`);
  } catch (err) {
    console.log('Could not create .ico file:', err.message);
  }
}

createIcon().catch(console.error);
