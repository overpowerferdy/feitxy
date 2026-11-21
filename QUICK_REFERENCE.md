# Quick Reference Card - Feit Native App

One-page reference for common tasks and commands.

---

## 🚀 Essential Commands

```bash
# Install dependencies
npm install

# Development (web)
npm run dev                 # Start dev server (localhost:3000)

# Build
npm run build              # Build web app
npm run build:mobile       # Build + sync to native

# Capacitor
npx cap sync              # Sync web → native
npx cap add android       # Add Android platform
npx cap add ios           # Add iOS platform (macOS only)

# Open native IDEs
npm run android           # Open Android Studio
npm run ios              # Open Xcode (macOS only)

# Alternative IDE commands
npm run cap:open:android  # Open Android Studio
npm run cap:open:ios     # Open Xcode (macOS only)
```

---

## 📁 Project Structure

```
feit-native/
├── src/
│   ├── native/          ← Native integration
│   └── ...             ← Your React app
├── android/            ← Android project (generated)
├── ios/               ← iOS project (generated)
├── public/            ← Static assets
└── dist/              ← Build output
```

---

## 📚 Documentation Quick Links

| Need | Read |
|------|------|
| **Getting started** | README.md |
| **Setup instructions** | SETUP_GUIDE.md |
| **Android config** | android-background-setup.md |
| **iOS config** | ios-background-setup.md |
| **Code examples** | src/native/ExampleUsage.tsx |
| **Architecture** | ARCHITECTURE.md |
| **Deploy checklist** | DEPLOYMENT_CHECKLIST.md |
| **Find anything** | INDEX.md |

---

## 💻 Code Snippets

### Initialize Native Features

```typescript
import { 
  useCapacitorApp, 
  usePushNotifications,
  initializeNativeFeatures 
} from './native';

function App() {
  useCapacitorApp();
  usePushNotifications();
  
  useEffect(() => {
    initializeNativeFeatures();
  }, []);

  return <YourApp />;
}
```

### Get Location

```typescript
import { geolocationService } from './native';

const position = await geolocationService.getCurrentPosition();
console.log(position.coords);
```

### Background Task

```typescript
import { useBackgroundTask } from './native';

useBackgroundTask({
  taskId: 'sync',
  interval: 300000, // 5 minutes
  callback: async () => {
    // Your task here
  }
});
```

### Send Notification

```typescript
import { PushNotificationService } from './native';

await PushNotificationService.sendLocalNotification(
  'Title',
  'Message'
);
```

### Check Network

```typescript
import { useNetworkStatus } from './native';

const { isOnline, status } = useNetworkStatus();
```

---

## 🔧 Troubleshooting

### Build Fails
```bash
npm install
npx cap sync
```

### Module Not Found
```bash
npm install
npm run build
```

### Android Won't Open
```bash
cd android
./gradlew clean
cd ..
npm run build:mobile
```

### iOS Won't Build (macOS)
```bash
cd ios/App
pod install
cd ../..
npm run build:mobile
```

### Background Not Working
- **Android**: Disable battery optimization
- **iOS**: Enable Background App Refresh
- **Both**: Test on physical device

---

## 📱 Platform Requirements

### Android
- Min SDK: 24 (Android 7.0)
- Target SDK: 34 (Android 14)
- Android Studio: Latest
- Java: JDK 17+

### iOS
- Min iOS: 13.0
- Xcode: 15+
- macOS: Required
- CocoaPods: Latest

---

## 🎯 Workflow

### Daily Development
```bash
1. npm run dev         # Test in browser
2. Make changes
3. npm run build:mobile
4. npm run android     # or npm run ios
5. Test on device
```

### Before Commit
```bash
npm run lint
npm run build
npm test
```

---

## 🔐 Important Files

### Configuration
- `capacitor.config.ts` - Capacitor settings
- `package.json` - Dependencies
- `vite.config.ts` - Build config

### Android
- `android/app/src/main/AndroidManifest.xml` - Permissions
- `android/app/build.gradle` - Build config

### iOS
- `ios/App/App/Info.plist` - Permissions
- `ios/App/App.xcodeproj` - Xcode project

---

## 🚨 Don't Forget

- ✅ Test on physical devices
- ✅ Check all permissions
- ✅ Test offline mode
- ✅ Test background execution
- ✅ Monitor battery usage
- ✅ Check app size
- ✅ Test on different OS versions

---

## 📞 Help Resources

1. **Project docs**: `feit-native/INDEX.md`
2. **Capacitor docs**: https://capacitorjs.com/docs
3. **Android docs**: https://developer.android.com
4. **iOS docs**: https://developer.apple.com/documentation

---

## 🎓 Learning Path

1. Read README.md (10 min)
2. Follow SETUP_GUIDE.md (1-2 hours)
3. Review ExampleUsage.tsx (10 min)
4. Build your features
5. Use DEPLOYMENT_CHECKLIST.md when ready

---

## ⚡ Quick Tips

- 💡 Test in browser first (`npm run dev`)
- 🔄 Use `npm run build:mobile` to sync quickly
- 📱 Physical devices for background testing
- 🐛 Check logs: `adb logcat` (Android), Xcode console (iOS)
- 🔋 Disable battery optimization for testing
- 📍 Request "Always" location for background tracking
- 🔔 Test notification permissions early

---

## 🎯 Common Tasks

### Add a new native feature
1. Import from `./native`
2. Use hook or service
3. Handle permissions
4. Test on device

### Update web app
1. Make changes in `src/`
2. `npm run build`
3. `npx cap sync`
4. Test in IDE

### Debug native code
- **Android**: Android Studio Logcat
- **iOS**: Xcode Console
- **Web**: Chrome DevTools

### Build for production
- **Android**: `cd android && ./gradlew bundleRelease`
- **iOS**: Xcode → Product → Archive

---

**Print this page and keep it handy!** 📄

For detailed information, refer to the full documentation.
