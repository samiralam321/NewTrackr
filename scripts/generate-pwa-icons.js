const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function generateIcons() {
  const logoPath = path.join(__dirname, '..', 'public', 'logo.png');
  const publicDir = path.join(__dirname, '..', 'public');

  console.log('Generating PWA icons from:', logoPath);

  // 1. Generate standard 192x192 icon (with transparent canvas and safe padding)
  await sharp(logoPath)
    .resize(160, 160, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .extend({
      top: 16,
      bottom: 16,
      left: 16,
      right: 16,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toFile(path.join(publicDir, 'icon-192x192.png'));
  console.log('✓ Created icon-192x192.png');

  // 2. Generate standard 512x512 icon (with transparent canvas and safe padding)
  await sharp(logoPath)
    .resize(430, 430, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .extend({
      top: 41,
      bottom: 41,
      left: 41,
      right: 41,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toFile(path.join(publicDir, 'icon-512x512.png'));
  console.log('✓ Created icon-512x512.png');

  // 3. Generate maskable 512x512 icon (with solid violet background #7C3AED and 20% safe zone padding)
  // Inner size: 360x360 within 512x512 gives 76px padding on all sides, well inside Android's 80% safe zone
  const maskableLogoBuffer = await sharp(logoPath)
    .resize(360, 360, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .toBuffer();

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 124, g: 58, b: 237, alpha: 1 } // #7C3AED
    }
  })
    .composite([
      {
        input: maskableLogoBuffer,
        gravity: 'center'
      }
    ])
    .png()
    .toFile(path.join(publicDir, 'icon-maskable-512x512.png'));
  console.log('✓ Created icon-maskable-512x512.png (maskable safe zone on #7C3AED)');

  // 4. Generate Apple Touch Icon 180x180 (opaque background #7C3AED for iOS home screens)
  const appleLogoBuffer = await sharp(logoPath)
    .resize(130, 130, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .toBuffer();

  await sharp({
    create: {
      width: 180,
      height: 180,
      channels: 4,
      background: { r: 124, g: 58, b: 237, alpha: 1 } // #7C3AED
    }
  })
    .composite([
      {
        input: appleLogoBuffer,
        gravity: 'center'
      }
    ])
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('✓ Created apple-touch-icon.png (180x180 for iOS)');

  console.log('All PWA icons generated successfully!');
}

generateIcons().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
