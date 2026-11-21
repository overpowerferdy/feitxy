# 📱 Mobile Build Fix - White Screen & Icon Issues

> **UPDATE (real white-screen root cause):** The hand-written `index.html` with `<div id="root"></div>` was the actual cause of the blank page. TanStack Start's client bundle calls `hydrateRoot(document, ...)`, so it needs the real server-rendered SPA shell. The build now enables `tanstackStart.spa.enabled` (generating `.output/public/_shell.html`) and `scripts/build-capacitor.js` copies that shell to `dist/index.html`. Verified in a headless browser: the old HTML produced 0 rendered elements; the SPA shell produced the full UI.

## 🐛 Problems Identified

Your APK was showing a white screen and wrong icons due to three issues:

### 1. **Incorrect index.html Entry Point**
- TanStack Start is an SSR framework, but Capacitor needs a static client-only build
- The build was creating server-side code that couldn't run in Android WebView
- The generated `index.html` wasn't loading the correct client bundle

### 2. **Missing Client-Only Build Configuration**
- TanStack Start's default build includes server components
- Android can't run Node.js server code
- Needed proper static export configuration

### 3. **Improper Android Icon Resources**
- Icons weren't being placed in the correct `mipmap-*` folders
- Android needs different sized icons for different screen densities
- Just copying PNG files doesn't follow Android conventions

## ✅ What Was Fixed

### 1. **Build Scripts**
Created two new build scripts:

#### `scripts/build-capacitor.js`
- Automatically finds the generated client bundle
- Creates a proper `index.html` that loads React correctly
- Copies all public assets
- Verifies the build output

#### `scripts/generate-android-icons.js`
- Generates proper Android icon resources from PWA icons
- Creates `mipmap-mdpi`, `mipmap-hdpi`, `mipmap-xhdpi`, `mipmap-xxhdpi`, `mipmap-xxxhdpi` folders
- Copies correctly sized icons for each density
- Adds adaptive icon background color

### 2. **Package.json Scripts**
Updated build commands:
```json
{
  "build:capacitor": "vite build && node scripts/build-capacitor.js",
  "build:icons": "node scripts/generate-android-icons.js",
  "build:mobile": "npm run build:capacitor && npm run build:icons && cap sync"
}
```

### 3. **Vite Configuration**
Improved `vite.config.ts`:
- Added proper code splitting for mobile
- Configured static preset for Capacitor
- Optimized chunk sizes

### 4. **GitHub Actions Workflow**
Simplified `.github/workflows/build-android-apk.yml`:
- Uses new build scripts
- Automatically generates icons
- Cleaner build process

## 🚀 How to Build Locally

### Initial Setup (One Time)
```bash
cd feit-native

# Install dependencies
npm install

# Add Android platform (if not already added)
npx cap add android
```

### Regular Build Process
```bash
# Build for mobile (includes web build, icons, and Capacitor sync)
npm run build:mobile

# Open in Android Studio to run
npx cap open android
```

### Individual Steps (for debugging)
```bash
# 1. Build web assets
npm run build:capacitor

# 2. Generate Android icons
npm run build:icons

# 3. Sync with Capacitor
npx cap sync

# 4. Open Android Studio
npx cap open android
```

## 📦 What Gets Generated

After running `npm run build:mobile`, you'll have:

```
dist/
├── index.html              ← Proper HTML entry point
├── assets/
│   ├── client-*.js         ← React app bundle
│   ├── styles-*.css        ← Compiled styles
│   └── *.png, *.jpg        ← Images
├── favicon.png
├── apple-touch-icon.png
├── icon-192.png
├── icon-512.png
└── manifest.webmanifest

android/
└── app/src/main/res/
    ├── mipmap-mdpi/        ← 48x48 icons
    ├── mipmap-hdpi/        ← 72x72 icons
    ├── mipmap-xhdpi/       ← 96x96 icons
    ├── mipmap-xxhdpi/      ← 144x144 icons
    └── mipmap-xxxhdpi/     ← 192x192 icons
```

## 🔍 Verifying the Fix

### Check the HTML
```bash
cat dist/index.html
```
It must be the TanStack Start SPA shell (copied from `.output/public/_shell.html`): a full `<!DOCTYPE html><html>...<body>...<script type="module" src="/assets/index-[hash].js">` document with the dehydrated `$TSR`/`$_TSR` data scripts. It should NOT be a hand-written page with an empty `<div id="root"></div>` — that gives React nothing to hydrate and renders a white screen.

### Check Android Icons
```bash
ls -la android/app/src/main/res/mipmap-*/
```
Should show `ic_launcher.png` and `ic_launcher_round.png` in each folder.

### Check Bundle Size
```bash
du -sh dist/assets/*.js dist/assets/*.css
```
Client bundle should be around 300-500KB (gzipped: 100-150KB).

## 🐞 Troubleshooting

### White Screen Still Appears
1. **Check browser console in Android**:
   ```bash
   # Enable USB debugging on your phone
   # Open Chrome on desktop → chrome://inspect
   # Look for errors in the WebView console
   ```

2. **Verify dist/index.html**:
   - Should load from `/assets/client-*.js`, not `/assets/index-*.js`
   - Should have `<div id="root"></div>`

3. **Check Capacitor config**:
   ```bash
   cat capacitor.config.ts
   ```
   Should have `webDir: 'dist'`

### Icons Still Wrong
1. **Rebuild icons**:
   ```bash
   npm run build:icons
   npx cap sync android
   ```

2. **Check icon files exist**:
   ```bash
   ls -la android/app/src/main/res/mipmap-*/ic_launcher*
   ```

3. **Clear Android build cache**:
   ```bash
   cd android
   ./gradlew clean
   cd ..
   ```

### Build Fails
1. **Check Node version** (should be 20+):
   ```bash
   node --version
   ```

2. **Clean install**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Check for TypeScript errors**:
   ```bash
   npm run lint
   ```

## 📝 Testing the APK

After building in GitHub Actions:

1. **Download the APK** from the Artifacts section
2. **Install on Android device**:
   - Enable "Unknown sources" in Settings
   - Transfer APK to phone
   - Tap to install

3. **Test the app**:
   - Should show splash screen
   - Should load main interface (not white screen)
   - Icon should be correct green Feit logo

## 🎯 Next Steps

### For GitHub Actions
- Push your changes to trigger a new build
- Download the new APK from Actions → Artifacts
- The build will now use the fixed process automatically

### For Local Development
- Use `npm run build:mobile` when you want to test on Android
- Use `npm run dev` for web development (faster)
- Icons only need to be regenerated when you change them

## 📚 Technical Details

### Why TanStack Start Needs Special Handling

TanStack Start is designed for server-side rendering:
- It generates both server and client bundles
- The server bundle expects Node.js runtime
- Capacitor WebView can't run Node.js code

Our fix:
- Uses Vite's client-only build mode
- Creates a static HTML entry point
- Loads the client bundle directly without SSR

### Icon Generation Process

Android uses density-independent pixels (dp):
- **mdpi** (1x): 48×48 px
- **hdpi** (1.5x): 72×72 px  
- **xhdpi** (2x): 96×96 px
- **xxhdpi** (3x): 144×144 px
- **xxxhdpi** (4x): 192×192 px

Our script maps these from your PWA icons:
- `icon-192.png` → smaller densities (mdpi through xxhdpi)
- `icon-512.png` → larger densities (xxxhdpi)

## ✨ Summary

The build process now:
1. ✅ Creates a proper static client-only build
2. ✅ Generates correct `index.html` with right paths
3. ✅ Places Android icons in proper mipmap folders
4. ✅ Works in both GitHub Actions and local builds
5. ✅ No more white screen!
6. ✅ Correct app icon!

**Your next build should work correctly! 🎉**
