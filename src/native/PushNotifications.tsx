import { useEffect } from 'react';
import {
  PushNotifications,
  PushNotificationSchema,
  Token,
  ActionPerformed,
} from '@capacitor/push-notifications';
import { Device } from '@capacitor/device';

export function usePushNotifications() {
  useEffect(() => {
    const initializePushNotifications = async () => {
      const info = await Device.getInfo();
      
      if (info.platform === 'web') {
        console.log('Push notifications not available on web');
        return;
      }

      // Request permission
      const permissionStatus = await PushNotifications.requestPermissions();
      
      if (permissionStatus.receive === 'granted') {
        // Register with Apple / Google to receive push notifications
        await PushNotifications.register();
      } else {
        console.log('Push notification permission denied');
      }

      // On success, we should be able to receive notifications
      PushNotifications.addListener('registration', (token: Token) => {
        console.log('Push registration success, token:', token.value);
        // Send token to your backend server
        // Example: sendTokenToServer(token.value);
      });

      // Some issue with our setup and push will not work
      PushNotifications.addListener('registrationError', (error: any) => {
        console.error('Error on registration:', error);
      });

      // Show us the notification payload if the app is open on our device
      PushNotifications.addListener(
        'pushNotificationReceived',
        (notification: PushNotificationSchema) => {
          console.log('Push received:', notification);
          // Handle notification when app is in foreground
        }
      );

      // Method called when tapping on a notification
      PushNotifications.addListener(
        'pushNotificationActionPerformed',
        (notification: ActionPerformed) => {
          console.log('Push action performed:', notification);
          // Handle notification tap - navigate to specific screen
        }
      );
    };

    initializePushNotifications();

    return () => {
      PushNotifications.removeAllListeners();
    };
  }, []);
}

export const PushNotificationService = {
  async sendLocalNotification(title: string, body: string) {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    
    await LocalNotifications.schedule({
      notifications: [
        {
          title,
          body,
          id: Date.now(),
          schedule: { at: new Date(Date.now() + 1000) }, // 1 second from now
          actionTypeId: '',
          extra: null,
        },
      ],
    });
  },

  async getPushToken(): Promise<string | null> {
    try {
      const info = await Device.getInfo();
      if (info.platform === 'web') return null;
      
      // This would typically be stored after registration
      // For now, return null - implement token storage as needed
      return null;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  },
};
