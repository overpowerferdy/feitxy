# Feit Native Mobile Application

A native iOS and Android application built with Capacitor, React, and TanStack Start. This app supports background execution, push notifications, location tracking, and other native mobile features.

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Build the web app
npm run build

# 3. Add mobile platforms
npm run cap:add:android
npm run cap:add:ios    # macOS only

# 4. Sync and open native IDEs
npm run build:mobile
npm run android        # Opens Android Studio
npm run ios           # Opens Xcode
```

## 📱 Features

### Native Capabilities
- ✅ **Background Execution**: Run tasks when app is in background
- ✅ **Push Notifications**: FCM (Android) and APNs (iOS)
- ✅ **Geolocation**: Real-time location tracking with background support
- ✅ **Network Status**: Monitor online/offline status
- ✅ **Local Notifications**: Schedule notifications locally
- ✅ **App Lifecycle**: Detect foreground/background transitions
- ✅ **Status Bar**: Customize status bar appearance
- ✅ **Haptics**: Vibration feedback
- ✅ **Device Info**: Access device details

### Web Features (from original PWA)
- Modern React UI with TanStack Router
- Server-side rendering with TanStack Start
- Tailwind CSS styling
- Supabase integration
- Push notifications via PushForge

## 📚 Documentation

- **[Complete Setup Guide](./SETUP_GUIDE.md)** - Full installation and configuration instructions
- **[Android Background Setup](./android-background-setup.md)** - Android-specific background service configuration
- **[iOS Background Setup](./ios-background-setup.md)** - iOS-specific background modes configuration

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev              # Start dev server
npm run build           # Build web app
npm run preview         # Preview production build

# Mobile Development
npm run cap:sync        # Sync web app with native projects
npm run build:mobile    # Build and sync in one command
npm run android         # Build and open Android Studio
npm run ios            # Build and open Xcode (macOS only)

# Capacitor Commands
npm run cap:open:android  # Open Android Studio
npm run cap:open:ios     # Open Xcode
npm run cap:add:android  # Add Android platform
npm run cap:add:ios     # Add iOS platform

# Code Quality
npm run lint            # Run ESLint
npm run format          # Format with Prettier
npm run test           # Run tests
npm run test:watch     # Run tests in watch mode
```

### Live Reload on Device

For faster development with live reload:

```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Run on device with live reload
npx cap run android -l --external
# or
npx cap run ios -l --external
```

## 📁 Project Structure

```
feit-native/
├── src/
│   ├── native/                    # Native integration layer
│   │   ├── CapacitorApp.tsx      # App lifecycle & status bar
│   │   ├── PushNotifications.tsx # Push notification handling
│   │   ├── BackgroundTask.tsx    # Background task management
│   │   ├── GeolocationService.tsx # Location tracking
│   │   ├── NetworkService.tsx    # Network status
│   │   ├── ExampleUsage.tsx      # Usage examples
│   │   └── index.ts              # Exports all native features
│   ├── routes/                   # TanStack Router routes
│   ├── components/               # React components
│   └── ...
├── android/                      # Android native project
├── ios/                         # iOS native project (macOS only)
├── public/                      # Static assets
│   ├── manifest.webmanifest     # PWA manifest
│   └── icons/                   # App icons
├── capacitor.config.ts          # Capacitor configuration
├── vite.config.ts              # Vite build configuration
├── package.json
├── SETUP_GUIDE.md              # Complete setup instructions
├── android-background-setup.md  # Android background config
└── ios-background-setup.md     # iOS background config
```

## 🔧 Native Integration

### Initialize Native Features

In your root component:

```typescript
import { useCapacitorApp, usePushNotifications, initializeNativeFeatures } from './native';

function App() {
  // Initialize app lifecycle and status bar
  useCapacitorApp();
  
  // Initialize push notifications
  usePushNotifications();
  
  useEffect(() => {
    initializeNativeFeatures();
  }, []);

  return <YourApp />;
}
```

### Use Geolocation

```typescript
import { geolocationService } from './native';

// Get current position
const position = await geolocationService.getCurrentPosition();

// Track position changes
await geolocationService.startWatchingPosition((position) => {
  console.log('Location:', position.coords);
});

// Stop tracking
await geolocationService.stopWatchingPosition();
```

### Background Tasks

```typescript
import { useBackgroundTask } from './native';

function MyComponent() {
  useBackgroundTask({
    taskId: 'sync-data',
    interval: 300000, // 5 minutes
    callback: async () => {
      await syncDataWithServer();
    }
  });
}
```

### Send Notifications

```typescript
import { PushNotificationService } from './native';

await PushNotificationService.sendLocalNotification(
  'Title',
  'Message body'
);
```

## 🎯 Platform-Specific Notes

### Android
- Minimum SDK: 24 (Android 7.0)
- Target SDK: 34 (Android 14)
- Background tasks require foreground service with notification
- Users must disable battery optimization for background location
- See `android-background-setup.md` for complete configuration

### iOS
- Minimum iOS: 13.0
- Background modes must be enabled in Xcode capabilities
- Background tasks have strict time limits (~30 seconds)
- Location tracking requires "Always" permission
- See `ios-background-setup.md` for complete configuration

## 🔐 Permissions

### Android Permissions (AndroidManifest.xml)
- `INTERNET` - Network access
- `ACCESS_FINE_LOCATION` - Precise location
- `ACCESS_BACKGROUND_LOCATION` - Background location
- `FOREGROUND_SERVICE` - Background tasks
- `POST_NOTIFICATIONS` - Push notifications
- `WAKE_LOCK` - Keep device awake

### iOS Permissions (Info.plist)
- `NSLocationWhenInUseUsageDescription` - Location while using app
- `NSLocationAlwaysAndWhenInUseUsageDescription` - Background location
- `NSUserNotificationsUsageDescription` - Notifications

## 🚨 Common Issues

### App crashes on startup
- Check native logs: `adb logcat` (Android) or Xcode console (iOS)
- Ensure all dependencies are installed: `npm install`
- Run `npx cap sync` to sync native projects

### Background tasks not running
- **Android**: Disable battery optimization for your app
- **iOS**: Enable Background App Refresh in Settings
- Test on physical devices (simulators have limitations)

### Location tracking stops
- Check that permissions are granted
- Implement foreground service (Android) or background modes (iOS)
- Review native setup documentation

### Build fails
- Clean and rebuild: `npm run build && npx cap sync`
- Android: `cd android && ./gradlew clean`
- iOS: Xcode → Product → Clean Build Folder

## 📦 Building for Production

### Android

```bash
cd android
./gradlew assembleRelease  # Generate APK
./gradlew bundleRelease   # Generate AAB for Play Store
```

Output: `android/app/build/outputs/`

### iOS

1. Open Xcode
2. Select "Generic iOS Device" or "Any iOS Device"
3. Product → Archive
4. Follow distribution workflow

## 🔗 Resources

- [Capacitor Docs](https://capacitorjs.com/docs)
- [TanStack Start](https://tanstack.com/start)
- [Android Developers](https://developer.android.com)
- [iOS Developer](https://developer.apple.com)

## 📝 License

Same as original Feit project.

## 🤝 Contributing

1. Make changes to web app in `src/`
2. Test in browser: `npm run dev`
3. Build and test on mobile: `npm run build:mobile && npm run android`
4. Commit and push

---

**Need help?** Check the complete [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed instructions.
