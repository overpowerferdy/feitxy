# 🚀 Build Commands Quick Reference

## Local Development

```bash
# Start development server (web only, fastest)
npm run dev

# Build for production (web)
npm run build

# Build for Capacitor (mobile)
npm run build:capacitor

# Generate Android icons
npm run build:icons

# Complete mobile build (web + icons + sync)
npm run build:mobile

# Open in Android Studio
npx cap open android

# Open in Xcode (iOS)
npx cap open ios
```

## First Time Setup

```bash
# Install dependencies
npm install

# Add Android platform
npx cap add android

# Add iOS platform (Mac only)
npx cap add ios

# Initial mobile build
npm run build:mobile
```

## Build + Test Workflow

```bash
# 1. Build for mobile
npm run build:mobile

# 2. Open in Android Studio
npx cap open android

# 3. In Android Studio:
#    - Click "Run" (green play button)
#    - Or Build → Build Bundle(s) / APK(s) → Build APK(s)
```

## Capacitor Commands

```bash
# Sync web assets to native projects
npx cap sync

# Sync specific platform
npx cap sync android
npx cap sync ios

# Update Capacitor plugins
npx cap update

# Check Capacitor status
npx cap doctor
```

## Gradle Commands (Android)

```bash
cd android

# Build debug APK
./gradlew assembleDebug

# Build release APK
./gradlew assembleRelease

# Clean build
./gradlew clean

# List all tasks
./gradlew tasks
```

## GitHub Actions

```bash
# Trigger manual build
# Go to: Actions → Build Android APK → Run workflow
# Select: debug or release

# APK will be in Artifacts section after build completes
```

## Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Lint code
npm run lint

# Format code
npm run format
```

## Troubleshooting

```bash
# Clean everything and rebuild
rm -rf node_modules package-lock.json dist android/.gradle android/build
npm install
npm run build:mobile

# Check for outdated packages
npm outdated

# Update dependencies (careful!)
npm update

# Verify Capacitor setup
npx cap doctor
```

## Environment Variables

```bash
# For local development, create .env.local:
VITE_API_BASE=http://localhost:3000
LOVABLE_API_KEY=your_key_here

# For production (already set in vite.config.ts):
VITE_API_BASE=https://feitxy.lovable.app
```

## Common Issues

### White screen on Android
```bash
# Rebuild with new scripts
npm run build:mobile
npx cap sync android
```

### Wrong icon
```bash
# Regenerate icons
npm run build:icons
npx cap sync android
cd android && ./gradlew clean && cd ..
```

### Build fails
```bash
# Clear caches
rm -rf node_modules package-lock.json dist .output
npm install
npm run build:mobile
```

### Gradle issues
```bash
cd android
chmod +x gradlew
./gradlew clean
cd ..
npx cap sync android
```
