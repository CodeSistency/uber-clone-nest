import { Injectable } from '@nestjs/common';
import { RedisPubSubService } from './redis-pubsub.service';

interface DriverLocation {
  driverId: number;
  location: {
    lat: number;
    lng: number;
  };
  timestamp: Date;
  rideId?: number;
}

interface RideUpdate {
  rideId: number;
  type: 'location' | 'status' | 'message';
  data: any;
  timestamp: Date;
}

@Injectable()
export class LocationTrackingService extends RedisPubSubService {

  private driverLocations: Map<number, DriverLocation> = new Map();
  private rideSubscribers: Map<number, Set<string>> = new Map();

  async onModuleInit() {
    await super.onModuleInit();

    // Subscribe to driver location channels
    await this.subscribe('driver:locations');
    await this.subscribe('ride:updates');
    await this.subscribe('emergency:alerts');
  }

  protected handleIncomingMessage(channel: string, message: string): void {
    super.handleIncomingMessage(channel, message);

    try {
      const data = JSON.parse(message);

      switch (channel) {
        case 'driver:locations':
          this.handleDriverLocationUpdate(data);
          break;
        case 'ride:updates':
          this.handleRideUpdate(data);
          break;
        case 'emergency:alerts':
          this.handleEmergencyAlert(data);
          break;
      }
    } catch (error) {
      console.error('Failed to handle incoming message:', error);
    }
  }

  // Driver location updates
  async updateDriverLocation(driverId: number, location: { lat: number; lng: number }, rideId?: number) {
    const locationData: DriverLocation = {
      driverId,
      location,
      timestamp: new Date(),
      rideId,
    };

    // Store in memory (for Redis fallback)
    this.driverLocations.set(driverId, locationData);

    // Publish to Redis
    await this.publish('driver:locations', locationData);

    // If ride is active, publish ride update
    if (rideId) {
      await this.publishRideUpdate(rideId, 'location', { driverLocation: location });
    }

    console.debug(`Driver ${driverId} location updated: ${location.lat}, ${location.lng}`);
  }

  async getDriverLocation(driverId: number): Promise<DriverLocation | null> {
    return this.driverLocations.get(driverId) || null;
  }

  // Ride tracking
  async subscribeToRide(rideId: number, userId: string) {
    if (!this.rideSubscribers.has(rideId)) {
      this.rideSubscribers.set(rideId, new Set());
    }
    this.rideSubscribers.get(rideId)!.add(userId);

    // Send current driver location if available
    const driverLocation = await this.getDriverLocationForRide(rideId);
    if (driverLocation) {
      await this.publishRideUpdate(rideId, 'location', { driverLocation: driverLocation.location });
    }

    console.log(`User ${userId} subscribed to ride ${rideId}`);
  }

  async unsubscribeFromRide(rideId: number, userId: string) {
    const subscribers = this.rideSubscribers.get(rideId);
    if (subscribers) {
      subscribers.delete(userId);
      if (subscribers.size === 0) {
        this.rideSubscribers.delete(rideId);
      }
    }

    console.log(`User ${userId} unsubscribed from ride ${rideId}`);
  }

  async publishRideUpdate(rideId: number, type: string, data: any) {
    const update: RideUpdate = {
      rideId,
      type: type as any,
      data,
      timestamp: new Date(),
    };

    await this.publish('ride:updates', update);

    // Also publish to specific ride channel
    await this.publish(`ride:${rideId}`, update);
  }

  // Emergency alerts
  async sendEmergencyAlert(alertData: {
    userId: string;
    rideId: number;
    location: { lat: number; lng: number };
    message: string;
  }) {
    await this.publish('emergency:alerts', {
      ...alertData,
      timestamp: new Date(),
    });

    // Also publish to specific ride channel
    await this.publish(`ride:${alertData.rideId}`, {
      type: 'emergency',
      data: alertData,
      timestamp: new Date(),
    });

    console.warn(`Emergency alert sent for ride ${alertData.rideId}`);
  }

  // Private handlers
  private handleDriverLocationUpdate(data: DriverLocation) {
    this.driverLocations.set(data.driverId, data);

    // If ride is active, forward to ride subscribers
    if (data.rideId) {
      this.publishRideUpdate(data.rideId, 'location', {
        driverLocation: data.location
      }).catch(error => {
        console.error('Failed to publish ride update:', error);
      });
    }
  }

  private handleRideUpdate(data: RideUpdate) {
    // Forward ride updates to subscribers
    console.debug(`Ride ${data.rideId} update: ${data.type}`);
  }

  private handleEmergencyAlert(data: any) {
    console.warn(`Emergency alert received: ${JSON.stringify(data)}`);
  }

  private async getDriverLocationForRide(rideId: number) {
    // In a real implementation, you'd query the database for the driver assigned to this ride
    // For now, we'll check our in-memory storage
    for (const [driverId, location] of this.driverLocations.entries()) {
      if (location.rideId === rideId) {
        return location;
      }
    }
    return null;
  }

  // Health check
  getHealthStatus() {
    return {
      redisConnected: this.isRedisConnected(),
      activeDrivers: this.driverLocations.size,
      activeRides: this.rideSubscribers.size,
      totalSubscribers: Array.from(this.rideSubscribers.values())
        .reduce((total, subscribers) => total + subscribers.size, 0),
      timestamp: new Date(),
    };
  }
}
