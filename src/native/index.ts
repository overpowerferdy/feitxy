/**
 * Native Mobile Integration for Feit App
 * Capacitor-based services for iOS and Android
 */

export { useCapacitorApp } from './CapacitorApp';
export { usePushNotifications, PushNotificationService } from './PushNotifications';
export { 
  useBackgroundTask, 
  backgroundTaskManager, 
  AndroidBackgroundService,
  IOSBackgroundModes,
  type BackgroundTaskConfig 
} from './BackgroundTask';
export { GeolocationService, geolocationService } from './GeolocationService';
export { useNetworkStatus, NetworkService } from './NetworkService';

/**
 * Initialize all native features
 * Call this in your root component
 */
export function initializeNativeFeatures() {
  console.log('Initializing native mobile features...');
  
  // Background task manager initialization
  import('./BackgroundTask').then(({ backgroundTaskManager }) => {
    backgroundTaskManager.initialize();
  });
}
