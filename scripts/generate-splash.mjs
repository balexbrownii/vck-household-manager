// Script to generate PWA splash screens for iOS devices
import sharp from 'sharp';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

// iOS device splash screen sizes (width x height)
const splashSizes = [
  // iPhone 15 Pro Max, 14 Pro Max
  { width: 1290, height: 2796, name: 'splash-1290x2796' },
  // iPhone 15 Pro, 14 Pro
  { width: 1179, height: 2556, name: 'splash-1179x2556' },
  // iPhone 15, 15 Plus, 14, 14 Plus, 13, 13 Pro, 12, 12 Pro
  { width: 1170, height: 2532, name: 'splash-1170x2532' },
  // iPhone 14 Plus, 13 Pro Max, 12 Pro Max
  { width: 1284, height: 2778, name: 'splash-1284x2778' },
  // iPhone 13 mini, 12 mini
  { width: 1080, height: 2340, name: 'splash-1080x2340' },
  // iPhone 11 Pro Max, XS Max
  { width: 1242, height: 2688, name: 'splash-1242x2688' },
  // iPhone 11, XR
  { width: 828, height: 1792, name: 'splash-828x1792' },
  // iPhone 11 Pro, X, XS
  { width: 1125, height: 2436, name: 'splash-1125x2436' },
  // iPhone 8 Plus
  { width: 1242, height: 2208, name: 'splash-1242x2208' },
  // iPhone 8, SE
  { width: 750, height: 1334, name: 'splash-750x1334' },
  // iPad Pro 12.9"
  { width: 2048, height: 2732, name: 'splash-2048x2732' },
  // iPad Pro 11"
  { width: 1668, height: 2388, name: 'splash-1668x2388' },
  // iPad Air, iPad 10.2"
  { width: 1620, height: 2160, name: 'splash-1620x2160' },
  // iPad Mini
  { width: 1536, height: 2048, name: 'splash-1536x2048' },
];

function createSplashSvg(width, height) {
  // Calculate icon size (about 20% of smallest dimension)
  const iconSize = Math.min(width, height) * 0.25;
  const centerX = width / 2;
  const centerY = height / 2 - height * 0.05; // Slightly above center
  const textY = centerY + iconSize / 2 + 60;

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#9333ea"/>
      <stop offset="50%" style="stop-color:#a855f7"/>
      <stop offset="100%" style="stop-color:#7c3aed"/>
    </linearGradient>
    <linearGradient id="star" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#fbbf24"/>
      <stop offset="100%" style="stop-color:#f59e0b"/>
    </linearGradient>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="#000" flood-opacity="0.3"/>
    </filter>
  </defs>

  <!-- Background gradient -->
  <rect width="${width}" height="${height}" fill="url(#bg)"/>

  <!-- Decorative circles -->
  <circle cx="${width * 0.1}" cy="${height * 0.15}" r="${Math.min(width, height) * 0.08}" fill="rgba(255,255,255,0.05)"/>
  <circle cx="${width * 0.85}" cy="${height * 0.25}" r="${Math.min(width, height) * 0.12}" fill="rgba(255,255,255,0.03)"/>
  <circle cx="${width * 0.15}" cy="${height * 0.75}" r="${Math.min(width, height) * 0.1}" fill="rgba(255,255,255,0.04)"/>
  <circle cx="${width * 0.9}" cy="${height * 0.8}" r="${Math.min(width, height) * 0.06}" fill="rgba(255,255,255,0.05)"/>

  <!-- Star icon -->
  <g transform="translate(${centerX}, ${centerY})" filter="url(#shadow)">
    <g transform="scale(${iconSize / 512}) translate(-256, -256)">
      <path d="M256 60 L306 200 L455 200 L340 290 L385 430 L256 345 L127 430 L172 290 L57 200 L206 200 Z"
            fill="url(#star)"
            stroke="#fcd34d"
            stroke-width="10"
            stroke-linejoin="round"
            filter="url(#glow)"/>
    </g>
  </g>

  <!-- Sparkles around star -->
  <g fill="#fef3c7" opacity="0.8">
    <circle cx="${centerX + iconSize * 0.6}" cy="${centerY - iconSize * 0.5}" r="${iconSize * 0.04}"/>
    <circle cx="${centerX - iconSize * 0.55}" cy="${centerY + iconSize * 0.4}" r="${iconSize * 0.03}"/>
    <circle cx="${centerX + iconSize * 0.5}" cy="${centerY + iconSize * 0.45}" r="${iconSize * 0.025}"/>
    <circle cx="${centerX - iconSize * 0.4}" cy="${centerY - iconSize * 0.45}" r="${iconSize * 0.02}"/>
  </g>

  <!-- App name -->
  <text x="${centerX}" y="${textY}"
        font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif"
        font-size="${iconSize * 0.28}"
        font-weight="700"
        fill="white"
        text-anchor="middle"
        letter-spacing="2">StarKids</text>

  <!-- Tagline -->
  <text x="${centerX}" y="${textY + iconSize * 0.18}"
        font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif"
        font-size="${iconSize * 0.1}"
        font-weight="400"
        fill="rgba(255,255,255,0.7)"
        text-anchor="middle"
        letter-spacing="1">Earn stars, build habits</text>
</svg>
`;
}

async function generateSplashScreens() {
  console.log('Generating PWA splash screens...\n');

  // Create splash directory
  const splashDir = join(publicDir, 'splash');
  await sharp(Buffer.from(createSplashSvg(100, 100)))
    .toBuffer()
    .catch(() => {}); // Just to ensure sharp is loaded

  // Generate each size
  for (const size of splashSizes) {
    console.log(`Creating ${size.name}.png (${size.width}x${size.height})...`);
    const svg = createSplashSvg(size.width, size.height);

    await sharp(Buffer.from(svg))
      .png()
      .toFile(join(publicDir, `${size.name}.png`));
  }

  // Create a default splash.png (iPhone 14/15 size)
  console.log('\nCreating default splash.png...');
  const defaultSvg = createSplashSvg(1170, 2532);
  await sharp(Buffer.from(defaultSvg))
    .png()
    .toFile(join(publicDir, 'splash.png'));

  console.log('\nDone! Splash screens created in public/');
  console.log('\nAdd these to your layout.tsx metadata for full iOS support.');
}

generateSplashScreens().catch(console.error);
