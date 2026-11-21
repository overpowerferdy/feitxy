# Android Background Service Setup

## 1. Add Background Service to AndroidManifest.xml

After running `npm run cap:add:android`, add the following to `android/app/src/main/AndroidManifest.xml`:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    
    <!-- Add permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_LOCATION" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    
    <application>
        <!-- Add service declaration inside <application> tag -->
        <service
            android:name=".BackgroundService"
            android:enabled="true"
            android:exported="false"
            android:foregroundServiceType="location" />
    </application>
</manifest>
```

## 2. Create BackgroundService.java

Create `android/app/src/main/java/com/feit/app/BackgroundService.java`:

```java
package com.feit.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;
import androidx.core.app.NotificationCompat;

public class BackgroundService extends Service {
    private static final String CHANNEL_ID = "FeitBackgroundServiceChannel";
    private static final int NOTIFICATION_ID = 1;

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        // Create notification for foreground service
        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("Feit")
                .setContentText("Running in background")
                .setSmallIcon(R.mipmap.ic_launcher)
                .build();

        startForeground(NOTIFICATION_ID, notification);

        // Your background task logic here
        performBackgroundTask();

        return START_STICKY;
    }

    private void performBackgroundTask() {
        // Implement your background logic
        // Examples:
        // - Location tracking
        // - Data synchronization
        // - Periodic API calls
        new Thread(() -> {
            while (true) {
                try {
                    // Your periodic task
                    Thread.sleep(60000); // Run every minute
                } catch (InterruptedException e) {
                    e.printStackTrace();
                    break;
                }
            }
        }).start();
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        stopForeground(true);
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel serviceChannel = new NotificationChannel(
                    CHANNEL_ID,
                    "Feit Background Service Channel",
                    NotificationManager.IMPORTANCE_DEFAULT
            );
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(serviceChannel);
            }
        }
    }
}
```

## 3. Start the service from your app

Add this to your MainActivity.java or create a Capacitor plugin:

```java
import android.content.Intent;

public void startBackgroundService() {
    Intent serviceIntent = new Intent(this, BackgroundService.class);
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        startForegroundService(serviceIntent);
    } else {
        startService(serviceIntent);
    }
}

public void stopBackgroundService() {
    Intent serviceIntent = new Intent(this, BackgroundService.class);
    stopService(serviceIntent);
}
```

## 4. Build Configuration

Update `android/app/build.gradle` if needed:

```gradle
android {
    compileSdkVersion 34
    
    defaultConfig {
        minSdkVersion 24
        targetSdkVersion 34
    }
}
```

## 5. Testing

1. Build the app: `npm run build:mobile`
2. Open Android Studio: `npm run cap:open:android`
3. Run on device or emulator
4. Grant all required permissions
5. Start the background service from your app

## Important Notes

- **Foreground Service**: Android requires a persistent notification for background tasks
- **Battery Optimization**: Users may need to disable battery optimization for your app
- **Location Permissions**: For background location, request "Allow all the time" permission
- **WorkManager**: For periodic tasks, consider using WorkManager instead of a service
- **Background Restrictions**: Modern Android versions heavily restrict background execution
