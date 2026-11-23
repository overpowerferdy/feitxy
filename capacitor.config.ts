import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.feit.app',
  appName: 'Feit',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    BackgroundTask: {
      enabled: true
    },
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#113b22',
      androidSplashResourceName: 'splash',
      iosSplashResourceName: 'splash'
    }
  }
};

export default config;
