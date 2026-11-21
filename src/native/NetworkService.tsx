import { useEffect, useState } from 'react';
import { Network, ConnectionStatus } from '@capacitor/network';
import { Device } from '@capacitor/device';

export function useNetworkStatus() {
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const initNetwork = async () => {
      const info = await Device.getInfo();
      
      if (info.platform === 'web') {
        // Use browser API for web
        setIsOnline(navigator.onLine);
        window.addEventListener('online', () => setIsOnline(true));
        window.addEventListener('offline', () => setIsOnline(false));
        return;
      }

      // Get initial network status
      const networkStatus = await Network.getStatus();
      setStatus(networkStatus);
      setIsOnline(networkStatus.connected);

      // Listen for network changes
      const handler = Network.addListener('networkStatusChange', (status) => {
        console.log('Network status changed:', status);
        setStatus(status);
        setIsOnline(status.connected);
      });

      return () => {
        handler.remove();
      };
    };

    initNetwork();
  }, []);

  return { status, isOnline };
}

export const NetworkService = {
  async getStatus(): Promise<ConnectionStatus> {
    return await Network.getStatus();
  },

  async isOnline(): Promise<boolean> {
    const status = await Network.getStatus();
    return status.connected;
  },

  addListener(callback: (status: ConnectionStatus) => void) {
    return Network.addListener('networkStatusChange', callback);
  },
};
