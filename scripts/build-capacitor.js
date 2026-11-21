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
const outputDir = path.join(rootDir, '.output', 'public');
const distDir = path.join(rootDir, 'dist');

async function ensureDir(dir) {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

async function copyOutputToDist() {
  console.log('📁 Moving .output/public to dist/...');
  
  // Ensure dist directory exists
  await ensureDir(distDir);
  
  try {
    // Copy everything from .output/public to dist
    const entries = await fs.readdir(outputDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const src = path.join(outputDir, entry.name);
      const dest = path.join(distDir, entry.name);
      
      if (entry.isDirectory()) {
        // Copy directory recursively
        await fs.cp(src, dest, { recursive: true });
        console.log(`   Copied: ${entry.name}/`);
      } else {
        await fs.copyFile(src, dest);
        console.log(`   Copied: ${entry.name}`);
      }
    }
  } catch (error) {
    console.error('❌ Failed to copy .output/public to dist:', error.message);
    throw error;
  }
}

async function generateIndexHtml() {
  console.log('📝 Installing the TanStack Start SPA shell as index.html...');

  // TanStack Start's client bundle calls hydrateRoot(document, ...), so the WebView
  // must receive the real server-rendered document shell. Hand-writing an empty
  // <div id="root"> page gives React nothing to hydrate and results in a white screen.
  const shellPath = path.join(outputDir, '_shell.html');

  let html;
  try {
    html = await fs.readFile(shellPath, 'utf-8');
  } catch {
    throw new Error(
      '❌ .output/public/_shell.html was not generated. ' +
        'Make sure tanstackStart.spa.enabled is true in vite.config.ts and rebuild.'
    );
  }

  if (!html.includes('<html') || !html.includes('/assets/') || !html.includes('index-')) {
    throw new Error('❌ The generated SPA shell is invalid; refusing to write a blank index.html.');
  }

  await fs.writeFile(path.join(distDir, 'index.html'), html, 'utf-8');
  console.log('✅ index.html created from the TanStack SPA shell');
}

async function copyPublicAssets() {
  console.log('📦 Ensuring all public assets are in dist...');
  const publicDir = path.join(rootDir, 'public');
  
  try {
    const entries = await fs.readdir(publicDir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isFile()) {
        const src = path.join(publicDir, entry.name);
        const dest = path.join(distDir, entry.name);
        
        // Only copy if not already present
        try {
          await fs.access(dest);
        } catch {
          await fs.copyFile(src, dest);
          console.log(`   Added: ${entry.name}`);
        }
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

  // A page with no client script can only ever render white on a device.
  const indexHtml = await fs.readFile(path.join(distDir, 'index.html'), 'utf-8');
  if (!indexHtml.includes('<script type="module"') || !indexHtml.includes('<body>')) {
    throw new Error('❌ dist/index.html has no client bundle; the app would show a white screen.');
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

    // Move .output/public to dist
    await copyOutputToDist();

    // Ensure public assets are present
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
