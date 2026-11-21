# Feit Native App - Architecture Overview

## System Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                         User Interface                          │
│                  (React Components + Tailwind)                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Routes (TanStack Router)                                │  │
│  │  ├─ Home                                                 │  │
│  │  ├─ Settings                                             │  │
│  │  └─ Other routes...                                      │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────┬───────────────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────────────┐
│                    Application Logic                            │
│           (React Hooks, State Management, API Calls)            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  React Query (TanStack Query)                            │  │
│  │  Business Logic                                          │  │
│  │  Data Management                                         │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────┬───────────────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────────────┐
│                   Native Integration Layer                      │
│                      (src/native/)                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Capacitor Hooks & Services                              │  │
│  │  ├─ useCapacitorApp()      - App lifecycle              │  │
│  │  ├─ usePushNotifications() - Notifications              │  │
│  │  ├─ useBackgroundTask()    - Background execution       │  │
│  │  ├─ useNetworkStatus()     - Network monitoring         │  │
│  │  └─ Services                                             │  │
│  │      ├─ GeolocationService - Location tracking          │  │
│  │      └─ PushNotificationService - Local notifications   │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────┬───────────────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────────────┐
│                     Capacitor Core                              │
│                  (Bridge Layer - WebView)                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Capacitor Plugins                                       │  │
│  │  ├─ @capacitor/app                                       │  │
│  │  ├─ @capacitor/push-notifications                        │  │
│  │  ├─ @capacitor/geolocation                               │  │
│  │  ├─ @capacitor/network                                   │  │
│  │  ├─ @capacitor/local-notifications                       │  │
│  │  └─ @capacitor/device                                    │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────┬───────────────────────────────────────────────┘
                 │
         ┌───────┴────────┐
         ▼                ▼
┌─────────────────┐  ┌─────────────────┐
│   Android       │  │      iOS        │
│   Native        │  │     Native      │
│                 │  │                 │
│  ┌───────────┐  │  │  ┌───────────┐  │
│  │ Foreground│  │  │  │Background │  │
│  │ Service   │  │  │  │ Modes     │  │
│  └───────────┘  │  │  └───────────┘  │
│  ┌───────────┐  │  │  ┌───────────┐  │
│  │ Location  │  │  │  │ Location  │  │
│  │ Manager   │  │  │  │ Manager   │  │
│  └───────────┘  │  │  └───────────┘  │
│  ┌───────────┐  │  │  ┌───────────┐  │
│  │   FCM     │  │  │  │   APNs    │  │
│  └───────────┘  │  │  └───────────┘  │
└─────────────────┘  └─────────────────┘
```

---

## Data Flow

### 1. User Interaction Flow

```
User Action
    ↓
React Component
    ↓
Event Handler
    ↓
Native Hook/Service
    ↓
Capacitor Plugin
    ↓
Native Platform
    ↓
Device Feature
```

### 2. Background Task Flow

```
App in Background
    ↓
Background Task Manager
    ↓
Scheduled Callback
    ↓
Execute Task
    ├─ Sync Data
    ├─ Update Location
    └─ Send Notification
    ↓
Update UI (if app returns to foreground)
```

### 3. Push Notification Flow

```
Server/Firebase
    ↓
FCM (Android) / APNs (iOS)
    ↓
Device Receives Notification
    ↓
Capacitor Plugin
    ↓
Event Listener
    ↓
React Handler
    ↓
Update UI / Navigate
```

---

## Component Architecture

### Core Components

```
App (Root)
├── Native Providers
│   ├── CapacitorApp Provider
│   ├── PushNotifications Provider
│   └── Network Status Provider
│
├── Router (TanStack)
│   ├── Layout
│   │   ├── Header
│   │   ├── Content
│   │   └── Footer
│   │
│   └── Routes
│       ├── Home
│       ├── Settings
│       └── ...
│
└── Background Services
    ├── Location Tracking
    ├── Data Sync
    └── Task Scheduler
```

---

## Native Integration Layers

### Layer 1: React Hooks (High-Level API)

```typescript
// Easy to use in any component
function MyComponent() {
  useCapacitorApp();              // App lifecycle
  usePushNotifications();         // Push notifications
  const { isOnline } = useNetworkStatus();  // Network status
  
  useBackgroundTask({
    taskId: 'sync',
    callback: async () => { }
  });
}
```

### Layer 2: Service Classes (Mid-Level API)

```typescript
// Direct service access
import { geolocationService } from './native';

// More control over features
const position = await geolocationService.getCurrentPosition();
await geolocationService.startWatchingPosition(callback);
```

### Layer 3: Capacitor Plugins (Low-Level API)

```typescript
// Direct plugin access (advanced)
import { Geolocation } from '@capacitor/geolocation';

const position = await Geolocation.getCurrentPosition();
```

---

## Background Execution Architecture

### Android Background Service

```
App Lifecycle
    ↓
Service Manager
    ↓
Foreground Service
    ├─ Persistent Notification
    ├─ Location Updates
    ├─ Data Sync
    └─ Long-running Tasks
    ↓
WorkManager (for periodic tasks)
```

### iOS Background Modes

```
App Lifecycle
    ↓
Background Task Scheduler
    ↓
Background Modes
    ├─ Background Fetch (periodic)
    ├─ Location Updates (continuous)
    ├─ Remote Notifications (push)
    └─ Background Processing (system-scheduled)
```

---

## State Management

```
┌─────────────────────────────────────┐
│      Application State              │
├─────────────────────────────────────┤
│  React Component State              │
│  ├─ Local component state           │
│  └─ React Context                   │
├─────────────────────────────────────┤
│  TanStack Query (Server State)      │
│  ├─ API data caching                │
│  ├─ Background refetch              │
│  └─ Optimistic updates              │
├─────────────────────────────────────┤
│  Native State                       │
│  ├─ Device info                     │
│  ├─ Location data                   │
│  ├─ Network status                  │
│  └─ App state                       │
└─────────────────────────────────────┘
```

---

## Build & Deployment Pipeline

### Development Build

```
Source Code (src/)
    ↓
TypeScript Compilation
    ↓
Vite Build
    ↓
Output (dist/)
    ↓
Capacitor Sync
    ├─ Copy to android/app/src/main/assets/
    └─ Copy to ios/App/public/
    ↓
Native IDE
    ├─ Android Studio (Gradle build)
    └─ Xcode (Swift/Obj-C build)
    ↓
Device/Emulator
```

### Production Build

```
Source Code
    ↓
Build Optimization
    ├─ Minification
    ├─ Tree-shaking
    └─ Code splitting
    ↓
Capacitor Sync
    ↓
Native Build
    ├─ Android: APK/AAB
    └─ iOS: IPA
    ↓
App Store Submission
    ├─ Google Play Console
    └─ App Store Connect
```

---

## Permission Flow

### Android Permission Request

```
User Action
    ↓
Check Permission Status
    ↓
Permission Granted?
    ├─ Yes → Execute Feature
    └─ No  → Request Permission
        ↓
    User Prompt
        ├─ Allow → Execute Feature
        ├─ Deny  → Show Rationale
        └─ Deny & Don't Ask Again → Direct to Settings
```

### iOS Permission Request

```
User Action
    ↓
Check Authorization Status
    ↓
Status?
    ├─ Authorized → Execute Feature
    ├─ Not Determined → Request Authorization
    │   ↓
    │   User Prompt
    │       ├─ Allow → Execute Feature
    │       └─ Deny → Show Rationale
    ├─ Denied → Direct to Settings
    └─ Restricted → Show Error
```

---

## Network Communication

```
┌─────────────────────────────────────┐
│          React App                  │
├─────────────────────────────────────┤
│      API Client (fetch/axios)       │
├─────────────────────────────────────┤
│    TanStack Query (caching)         │
├─────────────────────────────────────┤
│      Network Status Monitor         │
│      (Capacitor Network)            │
├─────────────────────────────────────┤
│         HTTP/HTTPS                  │
├─────────────────────────────────────┤
│       Backend Server                │
│       (Supabase)                    │
└─────────────────────────────────────┘
```

---

## Error Handling

### Error Flow

```
Native Operation
    ↓
Error Occurs
    ↓
Capacitor Plugin Catches
    ↓
JavaScript Error Object
    ↓
React Error Boundary / Try-Catch
    ↓
Error Handler
    ├─ Log Error
    ├─ Show User Message
    ├─ Retry Logic
    └─ Fallback Behavior
```

### Error Types

1. **Permission Errors**: User denied permission
2. **Network Errors**: No connection or timeout
3. **Platform Errors**: Feature not supported
4. **Background Errors**: Background task failed
5. **Native Errors**: OS-level errors

---

## Testing Strategy

```
┌─────────────────────────────────────┐
│        Unit Tests                   │
│  - Component logic                  │
│  - Service functions                │
│  - Utility functions                │
├─────────────────────────────────────┤
│      Integration Tests              │
│  - Native hooks                     │
│  - API integration                  │
│  - State management                 │
├─────────────────────────────────────┤
│        E2E Tests                    │
│  - User flows                       │
│  - Platform-specific                │
│  - Background tasks                 │
├─────────────────────────────────────┤
│      Manual Testing                 │
│  - Physical devices                 │
│  - Background execution             │
│  - Permission flows                 │
└─────────────────────────────────────┘
```

---

## Security Architecture

```
┌─────────────────────────────────────┐
│      Application Security           │
├─────────────────────────────────────┤
│  HTTPS Only                         │
│  Certificate Pinning (optional)     │
├─────────────────────────────────────┤
│  Authentication                     │
│  ├─ JWT Tokens                      │
│  └─ Secure Storage                  │
├─────────────────────────────────────┤
│  Data Protection                    │
│  ├─ Encrypted Storage               │
│  └─ Secure Communication            │
├─────────────────────────────────────┤
│  Platform Security                  │
│  ├─ App Sandboxing                  │
│  ├─ Keychain (iOS)                  │
│  └─ Keystore (Android)              │
└─────────────────────────────────────┘
```

---

## Performance Optimization

### Web Layer
- Code splitting
- Lazy loading
- Image optimization
- Bundle size optimization

### Native Layer
- Efficient background tasks
- Battery optimization
- Memory management
- Network request batching

### Best Practices
- Minimize bridge calls
- Cache native data
- Use appropriate intervals
- Clean up listeners

---

## Monitoring & Analytics

```
User Event
    ↓
Analytics Service
    ├─ Track Event
    ├─ Log Error
    └─ Record Performance
    ↓
Analytics Platform
    ├─ Firebase Analytics
    ├─ Crash Reporting
    └─ Performance Monitoring
```

---

## Summary

This architecture provides:

✅ **Separation of Concerns**: Web, native, and platform layers  
✅ **Reusability**: Shared code across platforms  
✅ **Maintainability**: Clear structure and patterns  
✅ **Scalability**: Easy to add new features  
✅ **Testability**: Multiple testing levels  
✅ **Performance**: Optimized for mobile  
✅ **Security**: Platform-level protection  

---

For implementation details, see:
- `src/native/` - Native integration code
- `SETUP_GUIDE.md` - Setup instructions
- `PWA_VS_NATIVE.md` - Architecture decisions
