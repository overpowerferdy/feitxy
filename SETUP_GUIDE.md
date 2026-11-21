# Feit Native Mobile App - Complete Setup Guide

This guide will walk you through converting the Feit PWA into a native mobile application for iOS and Android with background execution capabilities.

## Prerequisites

### Required Software
- **Node.js** (v18 or later) - [Download](https://nodejs.org/)
- **npm** or **bun** (package manager)
- **Git**

### For Android Development
- **Android Studio** - [Download](https://developer.android.com/studio)
- **Java JDK 17** or later
- **Android SDK** (API Level 24+)

### For iOS Development (macOS only)
- **Xcode 15** or later - [Download from App Store](https://apps.apple.com/app/xcode/id497799835)
- **CocoaPods** - Install: `sudo gem install cocoapods`
- **Apple Developer Account** (for device testing and App Store)

---

## Step 1: Install Dependencies

```bash
cd feit-native
npm install
```

Or if using Bun:
```bash
bun install
```

---

## Step 2: Build the Web Application

```bash
npm run build
```

This creates the optimized production build in the `dist` directory.

---

## Step 3: Initialize Capacitor

If not already initialized:

```bash
npx cap init
```

When prompted:
- **App name**: Feit
- **App ID**: com.feit.app (or your preferred bundle ID)
- **Web directory**: dist

---

## Step 4: Add Mobile Platforms

### Add Android:
```bash
npm run cap:add:android
```

### Add iOS (macOS only):
```bash
npm run cap:add:ios
```

---

## Step 5: Configure Native Projects

### Android Configuration

1. **Open Android Studio**:
   ```bash
   npm run cap:open:android
   ```

2. **Update AndroidManifest.xml**:
   - Follow instructions in `android-background-setup.md`
   - Add required permissions
   - Configure background service

3. **Create BackgroundService.java**:
   - Copy the service code from `android-background-setup.md`
   - Place in `android/app/src/main/java/com/feit/app/`

4. **Update build.gradle** if needed:
   ```gradle
   android {
       compileSdkVersion 34
       defaultConfig {
           minSdkVersion 24
           targetSdkVersion 34
       }
   }
   ```

### iOS Configuration

1. **Open Xcode**:
   ```bash
   npm run cap:open:ios
   ```

2. **Configure Info.plist**:
   - Follow instructions in `ios-background-setup.md`
   - Add background modes
   - Add location permissions

3. **Enable Capabilities**:
   - Select your target in Xcode
   - Go to "Signing & Capabilities"
   - Add "Background Modes"
   - Enable: Location updates, Background fetch, Remote notifications

4. **Add Background Task Files**:
   - Create `BackgroundTaskManager.swift` (see ios-background-setup.md)
   - Create `LocationManager.swift` if needed
   - Update `AppDelegate.swift`

---

## Step 6: Integrate Native Features in Your App

Update your main app component to initialize native features:

```typescript
// src/App.tsx or your main component
import { useEffect } from 'react';
import { 
  useCapacitorApp, 
  usePushNotifications,
  initializeNativeFeatures 
} from './native';

function App() {
  // Initialize Capacitor app features
  useCapacitorApp();
  
  // Initialize push notifications
  usePushNotifications();
  
  useEffect(() => {
    // Initialize all native features
    initializeNativeFeatures();
  }, []);

  // Your app code...
}
```

### Example: Background Location Tracking

```typescript
import { useEffect } from 'react';
import { geolocationService } from './native';

function LocationTracker() {
  useEffect(() => {
    const startTracking = async () => {
      await geolocationService.startWatchingPosition((position) => {
        console.log('Location:', position.coords);
        // Send to your server or process locally
      });
    };

    startTracking();

    return () => {
      geolocationService.stopWatchingPosition();
    };
  }, []);

  return <div>Tracking location...</div>;
}
```

### Example: Background Tasks

```typescript
import { useBackgroundTask } from './native';

function MyComponent() {
  useBackgroundTask({
    taskId: 'sync-data',
    interval: 300000, // 5 minutes
    callback: async () => {
      // Perform background sync
      await syncDataWithServer();
    }
  });

  return <div>My Component</div>;
}
```

---

## Step 7: Sync and Build

After making changes to your web app:

```bash
# Build web app and sync with native projects
npm run build:mobile

# Or manually:
npm run build
npx cap sync
```

---

## Step 8: Run on Devices

### Android

1. **Connect Android device via USB** or start emulator
2. **Enable USB Debugging** on device
3. Run:
   ```bash
   npm run android
   ```
   Or open in Android Studio and click "Run"

### iOS

1. **Connect iOS device** or use simulator
2. **Configure signing**:
   - Open Xcode
   - Select your target
   - Go to "Signing & Capabilities"
   - Select your Team
3. Run:
   ```bash
   npm run ios
   ```
   Or click "Run" in Xcode

---

## Step 9: Testing Background Features

### Android

1. **Install the app** on a physical device
2. **Grant all permissions** when prompted
3. **Disable battery optimization**:
   - Settings → Apps → Feit → Battery → Unrestricted
4. **Test background service**:
   - Start the background task from your app
   - Close the app
   - Check if background tasks continue running

### iOS

1. **Install on physical device** (background modes don't work well on simulator)
2. **Grant "Always" location permission** if using location tracking
3. **Enable Background App Refresh**:
   - Settings → General → Background App Refresh → On
4. **Test with Xcode debugger**:
   ```
   e -l objc -- (void)[[BGTaskScheduler sharedScheduler] _simulateLaunchForTaskWithIdentifier:@"com.feit.app.refresh"]
   ```

---

## Step 10: Production Build

### Android APK/AAB

```bash
cd android
./gradlew assembleRelease  # For APK
./gradlew bundleRelease    # For AAB (Play Store)
```

Output in: `android/app/build/outputs/`

### iOS IPA

1. Open Xcode
2. Select "Generic iOS Device" or "Any iOS Device (arm64)"
3. Product → Archive
4. Follow App Store Connect upload process

---

## Development Workflow

### Daily Development

```bash
# 1. Make changes to your web app
# 2. Test in browser first
npm run dev

# 3. Build and sync to native
npm run build:mobile

# 4. Test on device
npm run android  # or npm run ios
```

### Hot Reload (Live Reload)

For faster development, use Capacitor's live reload:

```bash
# Start dev server
npm run dev

# In another terminal, sync with live reload
npx cap run android -l --external
# or
npx cap run ios -l --external
```

---

## Common Issues & Solutions

### Issue: Build fails with "Module not found"
**Solution**: Run `npm install` and `npx cap sync`

### Issue: Android permissions not working
**Solution**: Check AndroidManifest.xml has all required permissions

### Issue: iOS background tasks not running
**Solution**: 
- Check Info.plist has UIBackgroundModes
- Test on physical device, not simulator
- Enable Background App Refresh in Settings

### Issue: Location tracking stops in background
**Solution**:
- Android: Disable battery optimization for your app
- iOS: Request "Always" location permission
- Implement foreground service (Android) or background modes (iOS)

### Issue: App crashes on startup
**Solution**: Check native logs:
- Android: `adb logcat`
- iOS: Xcode → Window → Devices and Simulators → View Device Logs

---

## Project Structure

```
feit-native/
├── src/
│   ├── native/              # Native integration layer
│   │   ├── CapacitorApp.tsx
│   │   ├── PushNotifications.tsx
│   │   ├── BackgroundTask.tsx
│   │   ├── GeolocationService.tsx
│   │   ├── NetworkService.tsx
│   │   └── index.ts
│   └── ...                  # Your app code
├── android/                 # Android native project
├── ios/                     # iOS native project
├── public/                  # Static assets
├── capacitor.config.ts      # Capacitor configuration
├── vite.config.ts          # Vite build configuration
└── package.json
```

---

## Native Features Available

✅ **App Lifecycle**: Detect app state changes (foreground/background)  
✅ **Push Notifications**: FCM (Android) / APNs (iOS)  
✅ **Background Tasks**: Periodic execution  
✅ **Geolocation**: Real-time location tracking  
✅ **Network Status**: Online/offline detection  
✅ **Local Notifications**: Schedule notifications  
✅ **Status Bar**: Customize appearance  
✅ **Splash Screen**: Native splash screen  
✅ **Keyboard**: Keyboard behavior control  
✅ **Haptics**: Vibration feedback  

---

## Next Steps

1. **Configure Firebase** (for push notifications)
2. **Set up crash reporting** (Sentry, Firebase Crashlytics)
3. **Implement analytics** (Firebase Analytics, Mixpanel)
4. **Add app signing** (for production releases)
5. **Set up CI/CD** (GitHub Actions, Bitrise)
6. **Prepare store listings** (screenshots, descriptions)

---

## Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Android Developer Guide](https://developer.android.com/guide)
- [iOS Developer Guide](https://developer.apple.com/documentation/)
- [TanStack Start](https://tanstack.com/start)

---

## Support

For issues or questions:
1. Check Capacitor docs
2. Review native platform documentation
3. Check console logs (`adb logcat` for Android, Xcode logs for iOS)

---

**Congratulations!** 🎉 You now have a native mobile app with background capabilities!
