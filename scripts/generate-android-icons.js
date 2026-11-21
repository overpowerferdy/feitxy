#!/usr/bin/env node

/**
 * Generate Android icon resources from source images
 * This creates the proper mipmap-* folders with correctly sized icons
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

// Android icon sizes for different densities
const iconSizes = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192
};

async function ensureDir(dir) {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

async function copyIconsFromDist() {
  console.log('🎨 Generating Android icons...');
  
  const androidResDir = path.join(rootDir, 'android', 'app', 'src', 'main', 'res');
  const distDir = path.join(rootDir, 'dist');
  
  // Check if android folder exists
  try {
    await fs.access(androidResDir);
  } catch {
    console.log('⚠️  Android platform not added yet. Run "npx cap add android" first.');
    return;
  }

  // Source icons from dist
  const icon192 = path.join(distDir, 'icon-192.png');
  const icon512 = path.join(distDir, 'icon-512.png');
  
  try {
    await fs.access(icon192);
  } catch {
    console.error('❌ icon-192.png not found in dist/');
    console.log('   Make sure to build the project first: npm run build:capacitor');
    return;
  }

  // Create mipmap folders and copy appropriately sized icons
  for (const [folder, size] of Object.entries(iconSizes)) {
    const folderPath = path.join(androidResDir, folder);
    await ensureDir(folderPath);

    // Use icon-192 for smaller sizes, icon-512 for larger
    const sourceIcon = size <= 144 ? icon192 : icon512;
    
    try {
      // Copy for both launcher and round launcher
      await fs.copyFile(sourceIcon, path.join(folderPath, 'ic_launcher.png'));
      await fs.copyFile(sourceIcon, path.join(folderPath, 'ic_launcher_round.png'));
      await fs.copyFile(sourceIcon, path.join(folderPath, 'ic_launcher_foreground.png'));
      
      console.log(`   ✓ ${folder} (${size}x${size})`);
    } catch (error) {
      console.warn(`   ⚠️  Failed to copy to ${folder}:`, error.message);
    }
  }

  // Copy adaptive icon background
  const valuesDir = path.join(androidResDir, 'values');
  await ensureDir(valuesDir);
  
  const icLauncherBackgroundXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#113b22</color>
</resources>`;

  await fs.writeFile(
    path.join(valuesDir, 'ic_launcher_background.xml'),
    icLauncherBackgroundXml,
    'utf-8'
  );

  console.log('   ✓ ic_launcher_background.xml');
  console.log('\n✅ Android icons generated successfully!');
}

async function main() {
  try {
    await copyIconsFromDist();
  } catch (error) {
    console.error('\n❌ Icon generation failed:', error.message);
    process.exit(1);
  }
}

main();
