# iOS Background Modes Setup

## 1. Configure Info.plist

After running `npm run cap:add:ios`, edit `ios/App/App/Info.plist`:

```xml
<key>UIBackgroundModes</key>
<array>
    <string>fetch</string>
    <string>location</string>
    <string>remote-notification</string>
    <string>processing</string>
    <string>audio</string>
</array>

<!-- Location permissions -->
<key>NSLocationWhenInUseUsageDescription</key>
<string>We need your location to provide location-based services</string>

<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>We need your location in the background to track your activity</string>

<key>NSLocationAlwaysUsageDescription</key>
<string>We need your location in the background for continuous tracking</string>

<!-- Notification permissions -->
<key>NSUserNotificationsUsageDescription</key>
<string>We need to send you notifications</string>
```

## 2. Configure Capabilities in Xcode

1. Open the project: `npm run cap:open:ios`
2. Select your app target
3. Go to "Signing & Capabilities" tab
4. Click "+ Capability" and add:
   - **Background Modes**
     - ☑ Location updates
     - ☑ Background fetch
     - ☑ Remote notifications
     - ☑ Background processing
   - **Push Notifications**

## 3. Implement Background Task Handler

Create a Swift file for background tasks in your iOS project:

```swift
// ios/App/App/BackgroundTaskManager.swift

import Foundation
import BackgroundTasks

class BackgroundTaskManager {
    static let shared = BackgroundTaskManager()
    
    private let taskIdentifier = "com.feit.app.refresh"
    
    func registerBackgroundTasks() {
        BGTaskScheduler.shared.register(
            forTaskWithIdentifier: taskIdentifier,
            using: nil
        ) { task in
            self.handleBackgroundTask(task: task as! BGAppRefreshTask)
        }
    }
    
    func scheduleBackgroundTask() {
        let request = BGAppRefreshTaskRequest(identifier: taskIdentifier)
        request.earliestBeginDate = Date(timeIntervalSinceNow: 15 * 60) // 15 minutes
        
        do {
            try BGTaskScheduler.shared.submit(request)
            print("Background task scheduled successfully")
        } catch {
            print("Could not schedule background task: \(error)")
        }
    }
    
    private func handleBackgroundTask(task: BGAppRefreshTask) {
        // Schedule next task
        scheduleBackgroundTask()
        
        // Perform your background work
        performBackgroundWork { success in
            task.setTaskCompleted(success: success)
        }
        
        // Set expiration handler
        task.expirationHandler = {
            print("Background task expired")
        }
    }
    
    private func performBackgroundWork(completion: @escaping (Bool) -> Void) {
        // Your background logic here
        // Examples:
        // - Sync data with server
        // - Update local database
        // - Fetch new content
        
        DispatchQueue.global().async {
            // Simulate work
            Thread.sleep(forTimeInterval: 2)
            completion(true)
        }
    }
}
```

## 4. Update AppDelegate.swift

```swift
import UIKit
import BackgroundTasks

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {
    
    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
    ) -> Bool {
        // Register background tasks
        BackgroundTaskManager.shared.registerBackgroundTasks()
        
        // Request notification permissions
        UNUserNotificationCenter.current().requestAuthorization(
            options: [.alert, .sound, .badge]
        ) { granted, error in
            print("Notification permission granted: \(granted)")
        }
        
        return true
    }
    
    func applicationDidEnterBackground(_ application: UIApplication) {
        // Schedule background task when app enters background
        BackgroundTaskManager.shared.scheduleBackgroundTask()
    }
}
```

## 5. Location Manager for Background Updates

```swift
// ios/App/App/LocationManager.swift

import CoreLocation

class LocationManager: NSObject, CLLocationManagerDelegate {
    static let shared = LocationManager()
    
    private let locationManager = CLLocationManager()
    
    override init() {
        super.init()
        locationManager.delegate = self
        locationManager.desiredAccuracy = kCLLocationAccuracyBest
        locationManager.allowsBackgroundLocationUpdates = true
        locationManager.pausesLocationUpdatesAutomatically = false
    }
    
    func requestPermissions() {
        locationManager.requestAlwaysAuthorization()
    }
    
    func startTracking() {
        locationManager.startUpdatingLocation()
    }
    
    func stopTracking() {
        locationManager.stopUpdatingLocation()
    }
    
    // Delegate methods
    func locationManager(
        _ manager: CLLocationManager,
        didUpdateLocations locations: [CLLocation]
    ) {
        guard let location = locations.last else { return }
        print("Location updated: \(location.coordinate)")
        // Send location to your server or save locally
    }
    
    func locationManager(
        _ manager: CLLocationManager,
        didFailWithError error: Error
    ) {
        print("Location error: \(error)")
    }
}
```

## 6. Add to Info.plist for Background Tasks

```xml
<key>BGTaskSchedulerPermittedIdentifiers</key>
<array>
    <string>com.feit.app.refresh</string>
</array>
```

## 7. Testing Background Tasks

Use the following command in Terminal while app is running:

```bash
# Trigger background fetch
e -l objc -- (void)[[BGTaskScheduler sharedScheduler] _simulateLaunchForTaskWithIdentifier:@"com.feit.app.refresh"]
```

## Important iOS Background Limitations

1. **Time Limits**: Background tasks have strict time limits (typically 30 seconds)
2. **Discretionary**: System decides when to run background tasks
3. **Battery**: Background activity is limited when battery is low
4. **User Control**: Users can disable background refresh in Settings
5. **Location**: Background location requires "Always" permission
6. **Testing**: Use Xcode debugger commands to test background modes

## Best Practices

1. Keep background tasks short and efficient
2. Handle task expiration gracefully
3. Schedule next task before current one completes
4. Use appropriate background modes (don't request unnecessary permissions)
5. Provide clear explanations for permission requests
6. Test on real devices (simulator behavior differs)
