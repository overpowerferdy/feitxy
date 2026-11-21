/**
 * Example Component - Demonstrates Native Features
 * 
 * This component shows how to use all the native mobile features.
 * Copy patterns from here to integrate into your actual app.
 */

import React, { useState, useEffect } from 'react';
import { 
  useCapacitorApp,
  usePushNotifications,
  useBackgroundTask,
  useNetworkStatus,
  geolocationService,
  PushNotificationService,
  AndroidBackgroundService,
  IOSBackgroundModes
} from './index';
import { Device } from '@capacitor/device';

export function NativeFeaturesDemoApp() {
  // Initialize Capacitor app features (handles app lifecycle, status bar, etc.)
  useCapacitorApp();
  
  // Initialize push notifications
  usePushNotifications();
  
  // Monitor network status
  const { isOnline, status } = useNetworkStatus();
  
  // State
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const [location, setLocation] = useState<any>(null);
  const [isTracking, setIsTracking] = useState(false);

  // Background task example - syncs data every 5 minutes
  useBackgroundTask({
    taskId: 'data-sync',
    interval: 300000, // 5 minutes
    callback: async () => {
      console.log('Background sync running...');
      // Your sync logic here
      await syncDataWithServer();
    }
  });

  useEffect(() => {
    loadDeviceInfo();
  }, []);

  const loadDeviceInfo = async () => {
    const info = await Device.getInfo();
    setDeviceInfo(info);
  };

  const handleGetLocation = async () => {
    const position = await geolocationService.getCurrentPosition();
    if (position) {
      setLocation(position.coords);
    }
  };

  const handleStartTracking = async () => {
    await geolocationService.startWatchingPosition((position) => {
      console.log('Location update:', position.coords);
      setLocation(position.coords);
    });
    setIsTracking(true);
  };

  const handleStopTracking = async () => {
    await geolocationService.stopWatchingPosition();
    setIsTracking(false);
  };

  const handleSendNotification = async () => {
    await PushNotificationService.sendLocalNotification(
      'Hello from Feit!',
      'This is a local notification'
    );
  };

  const handleStartBackgroundService = async () => {
    const info = await Device.getInfo();
    
    if (info.platform === 'android') {
      await AndroidBackgroundService.startLocationTracking();
      await AndroidBackgroundService.startDataSync();
    } else if (info.platform === 'ios') {
      await IOSBackgroundModes.enableBackgroundFetch();
      await IOSBackgroundModes.enableBackgroundLocation();
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui' }}>
      <h1>Feit Native Features Demo</h1>
      
      {/* Device Info */}
      <section style={{ marginBottom: '30px' }}>
        <h2>Device Information</h2>
        {deviceInfo && (
          <div style={{ background: '#f5f5f5', padding: '10px', borderRadius: '8px' }}>
            <p><strong>Platform:</strong> {deviceInfo.platform}</p>
            <p><strong>OS Version:</strong> {deviceInfo.osVersion}</p>
            <p><strong>Model:</strong> {deviceInfo.model}</p>
            <p><strong>Manufacturer:</strong> {deviceInfo.manufacturer}</p>
          </div>
        )}
      </section>

      {/* Network Status */}
      <section style={{ marginBottom: '30px' }}>
        <h2>Network Status</h2>
        <div style={{ background: isOnline ? '#d4edda' : '#f8d7da', padding: '10px', borderRadius: '8px' }}>
          <p><strong>Status:</strong> {isOnline ? '🟢 Online' : '🔴 Offline'}</p>
          {status && (
            <>
              <p><strong>Connection Type:</strong> {status.connectionType}</p>
            </>
          )}
        </div>
      </section>

      {/* Location Services */}
      <section style={{ marginBottom: '30px' }}>
        <h2>Location Services</h2>
        
        <div style={{ marginBottom: '10px' }}>
          <button 
            onClick={handleGetLocation}
            style={buttonStyle}
          >
            Get Current Location
          </button>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <button 
            onClick={isTracking ? handleStopTracking : handleStartTracking}
            style={buttonStyle}
          >
            {isTracking ? '⏹ Stop Tracking' : '▶️ Start Tracking'}
          </button>
        </div>

        {location && (
          <div style={{ background: '#f5f5f5', padding: '10px', borderRadius: '8px' }}>
            <p><strong>Latitude:</strong> {location.latitude}</p>
            <p><strong>Longitude:</strong> {location.longitude}</p>
            <p><strong>Accuracy:</strong> {location.accuracy}m</p>
          </div>
        )}
      </section>

      {/* Notifications */}
      <section style={{ marginBottom: '30px' }}>
        <h2>Notifications</h2>
        <button 
          onClick={handleSendNotification}
          style={buttonStyle}
        >
          Send Test Notification
        </button>
      </section>

      {/* Background Services */}
      <section style={{ marginBottom: '30px' }}>
        <h2>Background Services</h2>
        <button 
          onClick={handleStartBackgroundService}
          style={buttonStyle}
        >
          Start Background Service
        </button>
        <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
          Note: Background services require proper native configuration. 
          See android-background-setup.md and ios-background-setup.md
        </p>
      </section>

      {/* Usage Instructions */}
      <section>
        <h2>Integration Guide</h2>
        <div style={{ background: '#e7f3ff', padding: '15px', borderRadius: '8px' }}>
          <h3>To use these features in your app:</h3>
          <ol style={{ marginLeft: '20px' }}>
            <li>Import the hooks/services from './native'</li>
            <li>Call useCapacitorApp() in your root component</li>
            <li>Use specific hooks/services as needed</li>
            <li>Follow platform-specific setup guides</li>
          </ol>
          
          <h3 style={{ marginTop: '15px' }}>Example:</h3>
          <pre style={{ background: '#fff', padding: '10px', borderRadius: '4px', overflow: 'auto' }}>
{`import { 
  useCapacitorApp, 
  usePushNotifications,
  geolocationService 
} from './native';

function MyApp() {
  useCapacitorApp();
  usePushNotifications();
  
  const getLocation = async () => {
    const pos = await geolocationService.getCurrentPosition();
    console.log(pos);
  };
  
  return <YourAppContent />;
}`}
          </pre>
        </div>
      </section>
    </div>
  );
}

// Dummy function for demo
async function syncDataWithServer() {
  // Your actual sync logic here
  return new Promise(resolve => setTimeout(resolve, 1000));
}

const buttonStyle: React.CSSProperties = {
  padding: '10px 20px',
  fontSize: '16px',
  backgroundColor: '#113b22',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  marginRight: '10px'
};
