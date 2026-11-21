import { useEffect } from 'react';
import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Keyboard } from '@capacitor/keyboard';
import { Device } from '@capacitor/device';

export function useCapacitorApp() {
  useEffect(() => {
    const initializeApp = async () => {
      // Get device info
      const info = await Device.getInfo();
      console.log('Device info:', info);

      // Configure status bar
      if (info.platform !== 'web') {
        try {
          await StatusBar.setStyle({ style: Style.Dark });
          await StatusBar.setBackgroundColor({ color: '#113b22' });
        } catch (error) {
          console.error('Status bar configuration error:', error);
        }

        // Hide splash screen after app loads
        await SplashScreen.hide();

        // Keyboard configuration
        Keyboard.setAccessoryBarVisible({ isVisible: false });
      }

      // Handle app state changes
      App.addListener('appStateChange', ({ isActive }) => {
        console.log('App state changed. Is active:', isActive);
        // You can add logic here for when app goes to background/foreground
      });

      // Handle deep links
      App.addListener('appUrlOpen', (data) => {
        console.log('App opened with URL:', data);
        // Handle deep linking here
      });

      // Handle back button (Android)
      App.addListener('backButton', ({ canGoBack }) => {
        if (!canGoBack) {
          App.exitApp();
        } else {
          window.history.back();
        }
      });
    };

    initializeApp();

    return () => {
      App.removeAllListeners();
    };
  }, []);
}
