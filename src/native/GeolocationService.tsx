import { Geolocation, Position } from '@capacitor/geolocation';
import { Device } from '@capacitor/device';

export class GeolocationService {
  private watchId: string | null = null;

  /**
   * Get current position
   */
  async getCurrentPosition(): Promise<Position | null> {
    try {
      const info = await Device.getInfo();
      if (info.platform === 'web') {
        console.log('Geolocation on web - using browser API');
      }

      const position = await Geolocation.getCurrentPosition();
      return position;
    } catch (error) {
      console.error('Error getting position:', error);
      return null;
    }
  }

  /**
   * Watch position changes (for background tracking)
   */
  async startWatchingPosition(callback: (position: Position) => void) {
    try {
      const info = await Device.getInfo();
      if (info.platform === 'web') {
        console.log('Position watching on web platform');
      }

      // Request permissions first
      const permissions = await Geolocation.requestPermissions();
      if (permissions.location !== 'granted') {
        throw new Error('Location permission not granted');
      }

      this.watchId = await Geolocation.watchPosition(
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        },
        (position, err) => {
          if (err) {
            console.error('Watch position error:', err);
            return;
          }
          if (position) {
            callback(position);
          }
        }
      );

      console.log('Started watching position:', this.watchId);
    } catch (error) {
      console.error('Error starting position watch:', error);
    }
  }

  /**
   * Stop watching position
   */
  async stopWatchingPosition() {
    if (this.watchId) {
      await Geolocation.clearWatch({ id: this.watchId });
      this.watchId = null;
      console.log('Stopped watching position');
    }
  }

  /**
   * Check location permissions
   */
  async checkPermissions() {
    const permissions = await Geolocation.checkPermissions();
    return permissions.location;
  }

  /**
   * Request location permissions
   */
  async requestPermissions() {
    const permissions = await Geolocation.requestPermissions();
    return permissions.location;
  }
}

export const geolocationService = new GeolocationService();
