#!/usr/bin/env node

/**
 * Build script for Capacitor mobile apps
 * Creates a proper static build with correct index.html entry point
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

async function ensureDir(dir) {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

async function findAssetFile(pattern) {
  const assetsDir = path.join(distDir, 'assets');
  const files = await fs.readdir(assetsDir);
  return files.find(file => file.match(pattern));
}

async function generateIndexHtml() {
  console.log('📝 Generating Capacitor-compatible index.html...');
  
  // Find the generated JS and CSS files
  const jsFile = await findAssetFile(/^client-.*\.js$/) || 
                 await findAssetFile(/^index-.*\.js$/);
  const cssFile = await findAssetFile(/^styles-.*\.css$/);

  if (!jsFile) {
    throw new Error('❌ Could not find client JS bundle in dist/assets/');
  }

  console.log(`   Found JS: ${jsFile}`);
  if (cssFile) console.log(`   Found CSS: ${cssFile}`);

  // Generate the HTML
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <meta name="theme-color" content="#113b22">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="Feit">
  <title>Feit</title>
  
  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap">
  
  <!-- Icons -->
  <link rel="icon" href="/favicon.png" type="image/png">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <link rel="manifest" href="/manifest.webmanifest">
  
  <!-- Styles -->
  ${cssFile ? `<link rel="stylesheet" href="/assets/${cssFile}">` : ''}
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/assets/${jsFile}"></script>
</body>
</html>`;

  await fs.writeFile(path.join(distDir, 'index.html'), html, 'utf-8');
  console.log('✅ index.html generated successfully');
}

async function copyPublicAssets() {
  console.log('📦 Copying public assets...');
  const publicDir = path.join(rootDir, 'public');
  
  try {
    const entries = await fs.readdir(publicDir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isFile()) {
        const src = path.join(publicDir, entry.name);
        const dest = path.join(distDir, entry.name);
        await fs.copyFile(src, dest);
        console.log(`   Copied: ${entry.name}`);
      }
    }
  } catch (error) {
    console.warn('⚠️  Warning: Could not copy public assets:', error.message);
  }
}

async function verifyBuild() {
  console.log('\n🔍 Verifying build...');
  
  const requiredFiles = [
    'index.html',
    'favicon.png',
    'apple-touch-icon.png',
    'manifest.webmanifest'
  ];

  for (const file of requiredFiles) {
    try {
      await fs.access(path.join(distDir, file));
      console.log(`   ✓ ${file}`);
    } catch {
      console.warn(`   ⚠️  Missing: ${file}`);
    }
  }

  // Check assets folder
  try {
    const assets = await fs.readdir(path.join(distDir, 'assets'));
    console.log(`   ✓ assets/ (${assets.length} files)`);
  } catch {
    console.error('   ❌ assets/ folder missing!');
    throw new Error('Build verification failed');
  }
}

async function main() {
  console.log('🚀 Building Feit for Capacitor...\n');

  try {
    // Ensure dist directory exists
    await ensureDir(distDir);

    // Copy public assets first (in case they're not in the build)
    await copyPublicAssets();

    // Generate proper index.html
    await generateIndexHtml();

    // Verify the build
    await verifyBuild();

    console.log('\n✨ Capacitor build ready!');
    console.log('   Next: Run "npx cap sync" to update native projects\n');

  } catch (error) {
    console.error('\n❌ Build failed:', error.message);
    process.exit(1);
  }
}

main();
