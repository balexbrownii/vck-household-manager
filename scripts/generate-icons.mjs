// Script to generate app icons from SVG
import sharp from 'sharp';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

// StarKids icon SVG - Purple star with gradient
const iconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#9333ea"/>
      <stop offset="100%" style="stop-color:#7c3aed"/>
    </linearGradient>
    <linearGradient id="star" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#fbbf24"/>
      <stop offset="100%" style="stop-color:#f59e0b"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#000" flood-opacity="0.25"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="512" height="512" rx="96" fill="url(#bg)"/>

  <!-- Star -->
  <g filter="url(#shadow)">
    <path d="M256 85 L298 195 L415 195 L320 268 L355 380 L256 310 L157 380 L192 268 L97 195 L214 195 Z"
          fill="url(#star)"
          stroke="#fcd34d"
          stroke-width="8"
          stroke-linejoin="round"/>
  </g>

  <!-- Sparkles -->
  <circle cx="400" cy="120" r="12" fill="#fef3c7"/>
  <circle cx="112" cy="400" r="10" fill="#fef3c7"/>
  <circle cx="420" cy="380" r="8" fill="#fef3c7"/>
</svg>
`;

// Maskable icon SVG - with safe zone padding (icon centered in 80% area)
const maskableSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#9333ea"/>
      <stop offset="100%" style="stop-color:#7c3aed"/>
    </linearGradient>
    <linearGradient id="star" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#fbbf24"/>
      <stop offset="100%" style="stop-color:#f59e0b"/>
    </linearGradient>
  </defs>

  <!-- Full background for maskable -->
  <rect width="512" height="512" fill="url(#bg)"/>

  <!-- Star - scaled down and centered for safe zone -->
  <g transform="translate(256, 256) scale(0.65) translate(-256, -256)">
    <path d="M256 85 L298 195 L415 195 L320 268 L355 380 L256 310 L157 380 L192 268 L97 195 L214 195 Z"
          fill="url(#star)"
          stroke="#fcd34d"
          stroke-width="8"
          stroke-linejoin="round"/>
  </g>
</svg>
`;

async function generateIcons() {
  console.log('Generating app icons...');

  const sizes = [192, 512];

  for (const size of sizes) {
    // Regular icon
    console.log(`Creating icon-${size}.png...`);
    await sharp(Buffer.from(iconSvg))
      .resize(size, size)
      .png()
      .toFile(join(publicDir, `icon-${size}.png`));

    // Maskable icon
    console.log(`Creating icon-maskable-${size}.png...`);
    await sharp(Buffer.from(maskableSvg))
      .resize(size, size)
      .png()
      .toFile(join(publicDir, `icon-maskable-${size}.png`));
  }

  // Also create apple-touch-icon (180x180)
  console.log('Creating apple-touch-icon.png...');
  await sharp(Buffer.from(iconSvg))
    .resize(180, 180)
    .png()
    .toFile(join(publicDir, 'apple-touch-icon.png'));

  // Create favicon (32x32)
  console.log('Creating favicon.ico...');
  await sharp(Buffer.from(iconSvg))
    .resize(32, 32)
    .png()
    .toFile(join(publicDir, 'favicon.png'));

  console.log('Done! Icons created in public/');
}

generateIcons().catch(console.error);
