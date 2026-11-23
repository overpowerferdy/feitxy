#!/usr/bin/env node

/**
 * Generate correctly sized Android launcher icons from the Feit logo.
 *
 * Android needs a separate bitmap size for every density. Copying one 192px/512px
 * file into every mipmap folder makes the launcher scale it at runtime, which is
 * what made the icon look zoomed out / blurry on the device.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

/** density -> [legacy launcher size, adaptive foreground size] */
const densities = {
  'mipmap-mdpi': [48, 108],
  'mipmap-hdpi': [72, 162],
  'mipmap-xhdpi': [96, 216],
  'mipmap-xxhdpi': [144, 324],
  'mipmap-xxxhdpi': [192, 432],
};

async function ensureDir(dir) {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

async function main() {
  console.log('🎨 Generating Android launcher icons...');

  const androidResDir = path.join(rootDir, 'android', 'app', 'src', 'main', 'res');

  try {
    await fs.access(androidResDir);
  } catch {
    console.warn('⚠️  Android platform not added yet. Run "npx cap add android" first.');
    return;
  }

  const source = path.join(rootDir, 'public', 'icon-512.png');
  try {
    await fs.access(source);
  } catch {
    console.error('❌ public/icon-512.png not found. Build the web app first.');
    process.exit(1);
  }

  const logo = await sharp(source).ensureAlpha().png().toBuffer();

  for (const [folder, [launcherSize, foregroundSize]] of Object.entries(densities)) {
    const folderPath = path.join(androidResDir, folder);
    await ensureDir(folderPath);

    // Flat launcher icon (used on older launchers and in Settings).
    const launcher = await sharp(logo)
      .resize(launcherSize, launcherSize, { fit: 'contain' })
      .png()
      .toBuffer();
    await fs.writeFile(path.join(folderPath, 'ic_launcher.png'), launcher);
    await fs.writeFile(path.join(folderPath, 'ic_launcher_round.png'), launcher);

    // Adaptive icon foreground: keep the artwork inside the central safe zone
    // (about 66% of the canvas) so the launcher mask never clips the logo.
    const safeLogo = await sharp(logo)
      .resize(Math.round(foregroundSize * 0.66), Math.round(foregroundSize * 0.66), {
        fit: 'contain',
      })
      .toBuffer();
    const foreground = await sharp({
      create: {
        width: foregroundSize,
        height: foregroundSize,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite([{ input: safeLogo, gravity: 'centre' }])
      .png()
      .toBuffer();
    await fs.writeFile(path.join(folderPath, 'ic_launcher_foreground.png'), foreground);

    console.log(`   ✓ ${folder}: ${launcherSize}px launcher, ${foregroundSize}px foreground`);
  }

  // Splash screens: replace Capacitor's default blue logo with the Feit mark.
  const splashSizes = {
    'drawable-land-mdpi': [480, 320], 'drawable-land-hdpi': [800, 480],
    'drawable-land-xhdpi': [1280, 720], 'drawable-land-xxhdpi': [1600, 960],
    'drawable-land-xxxhdpi': [1920, 1280],
    'drawable-port-mdpi': [320, 480], 'drawable-port-hdpi': [480, 800],
    'drawable-port-xhdpi': [720, 1280], 'drawable-port-xxhdpi': [960, 1600],
    'drawable-port-xxxhdpi': [1280, 1920],
  };
  for (const [folder, [width, height]] of Object.entries(splashSizes)) {
    const folderPath = path.join(androidResDir, folder);
    await ensureDir(folderPath);
    const markSize = Math.round(Math.min(width, height) * 0.3);
    const mark = await sharp(logo).resize(markSize, markSize, { fit: 'contain' }).toBuffer();
    const splash = await sharp({
      create: { width, height, channels: 4, background: { r: 17, g: 59, b: 34, alpha: 1 } },
    })
      .composite([{ input: mark, gravity: 'centre' }])
      .png()
      .toBuffer();
    await fs.writeFile(path.join(folderPath, 'splash.png'), splash);
  }
  console.log('   ✓ splash screens generated');

  const valuesDir = path.join(androidResDir, 'values');
  await ensureDir(valuesDir);
  await fs.writeFile(
    path.join(valuesDir, 'ic_launcher_background.xml'),
    `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#113b22</color>
</resources>
`,
    'utf-8'
  );

  console.log('✅ Android icons generated successfully!');
}

main().catch((error) => {
  console.error('\n❌ Icon generation failed:', error.message);
  process.exit(1);
});
