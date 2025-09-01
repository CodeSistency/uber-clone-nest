import { Injectable, Logger } from '@nestjs/common';
import { Socket } from 'socket.io';

interface DriverLocation {
  lat: number;
  lng: number;
  timestamp: Date;
}

interface ClientInfo {
  socket: Socket;
  userId?: string;
  driverId?: number;
  rideId?: number;
}

@Injectable()
export class RealTimeService {
  private readonly logger = new Logger('RealTimeService');

  // In-memory storage for real-time data
  private clients: Map<string, ClientInfo> = new Map();
  private driverLocations: Map<number, DriverLocation> = new Map();
  private activeRides: Map<number, { driverId: number; userId: string; passengers: string[] }> = new Map();
  private driverStatuses: Map<number, string> = new Map();

  // Redis-like Pub/Sub simulation (in production, use actual Redis)
  private subscribers: Map<string, Set<string>> = new Map();

  addClient(socket: Socket, userId?: string, driverId?: number) {
    this.clients.set(socket.id, {
      socket,
      userId,
      driverId,
      rideId: undefined,
    });

    this.logger.log(`Client added: ${socket.id} (User: ${userId || 'unknown'}, Driver: ${driverId || 'none'})`);
  }

  removeClient(socket: Socket) {
    const clientInfo = this.clients.get(socket.id);
    if (clientInfo) {
      // Clean up subscriptions
      if (clientInfo.rideId) {
        this.removeUserFromRide(clientInfo.userId!, clientInfo.rideId);
      }

      this.clients.delete(socket.id);
      this.logger.log(`Client removed: ${socket.id}`);
    }
  }

  updateDriverLocation(driverId: number, location: { lat: number; lng: number }) {
    this.driverLocations.set(driverId, {
      ...location,
      timestamp: new Date(),
    });

    this.logger.debug(`Driver ${driverId} location updated: ${location.lat}, ${location.lng}`);
  }

  getDriverLocation(driverId: number): DriverLocation | undefined {
    return this.driverLocations.get(driverId);
  }

  updateDriverStatus(driverId: number, status: string) {
    this.driverStatuses.set(driverId, status);
    this.logger.log(`Driver ${driverId} status updated to: ${status}`);
  }

  getDriverStatus(driverId: number): string | undefined {
    return this.driverStatuses.get(driverId);
  }

  addUserToRide(userId: string, rideId: number) {
    if (!this.activeRides.has(rideId)) {
      this.activeRides.set(rideId, {
        driverId: 0,
        userId,
        passengers: [],
      });
    }

    const ride = this.activeRides.get(rideId)!;
    if (!ride.passengers.includes(userId)) {
      ride.passengers.push(userId);
    }

    // Update client info
    this.clients.forEach(client => {
      if (client.userId === userId) {
        client.rideId = rideId;
      }
    });

    this.logger.log(`User ${userId} added to ride ${rideId}`);
  }

  removeUserFromRide(userId: string, rideId: number) {
    const ride = this.activeRides.get(rideId);
    if (ride) {
      ride.passengers = ride.passengers.filter(id => id !== userId);

      // If no more passengers, clean up ride
      if (ride.passengers.length === 0 && ride.driverId === 0) {
        this.activeRides.delete(rideId);
      }
    }

    // Update client info
    this.clients.forEach(client => {
      if (client.userId === userId && client.rideId === rideId) {
        client.rideId = undefined;
      }
    });

    this.logger.log(`User ${userId} removed from ride ${rideId}`);
  }

  assignDriverToRide(rideId: number, driverId: number) {
    const ride = this.activeRides.get(rideId);
    if (ride) {
      ride.driverId = driverId;

      // Update driver status to in_ride
      this.updateDriverStatus(driverId, 'in_ride');

      this.logger.log(`Driver ${driverId} assigned to ride ${rideId}`);
    }
  }

  completeRide(rideId: number) {
    const ride = this.activeRides.get(rideId);
    if (ride) {
      // Update driver status back to online
      if (ride.driverId > 0) {
        this.updateDriverStatus(ride.driverId, 'online');
      }

      // Remove all passengers from ride
      ride.passengers.forEach(userId => {
        this.removeUserFromRide(userId, rideId);
      });

      // Clean up ride
      this.activeRides.delete(rideId);

      this.logger.log(`Ride ${rideId} completed and cleaned up`);
    }
  }

  getDriverLocationForRide(rideId: number): DriverLocation | null {
    const ride = this.activeRides.get(rideId);
    if (ride && ride.driverId > 0) {
      return this.getDriverLocation(ride.driverId) || null;
    }
    return null;
  }

  getDriverForRide(rideId: number): number | null {
    const ride = this.activeRides.get(rideId);
    return ride ? ride.driverId : null;
  }

  getActiveRides(): Map<number, any> {
    return this.activeRides;
  }

  getConnectedClients(): string[] {
    return Array.from(this.clients.keys());
  }

  getOnlineDrivers(): number[] {
    return Array.from(this.driverStatuses.entries())
      .filter(([_, status]) => status === 'online')
      .map(([driverId, _]) => driverId);
  }

  // Pub/Sub simulation methods
  subscribe(channel: string, subscriberId: string) {
    if (!this.subscribers.has(channel)) {
      this.subscribers.set(channel, new Set());
    }
    this.subscribers.get(channel)!.add(subscriberId);
  }

  unsubscribe(channel: string, subscriberId: string) {
    const channelSubs = this.subscribers.get(channel);
    if (channelSubs) {
      channelSubs.delete(subscriberId);
      if (channelSubs.size === 0) {
        this.subscribers.delete(channel);
      }
    }
  }

  publish(channel: string, message: any) {
    const channelSubs = this.subscribers.get(channel);
    if (channelSubs) {
      channelSubs.forEach(subscriberId => {
        // In a real implementation, this would send to Redis subscribers
        this.logger.debug(`Published to ${subscriberId}: ${JSON.stringify(message)}`);
      });
    }
  }

  // Health check method
  getHealthStatus() {
    return {
      connectedClients: this.clients.size,
      activeRides: this.activeRides.size,
      onlineDrivers: this.getOnlineDrivers().length,
      totalDriverLocations: this.driverLocations.size,
      timestamp: new Date(),
    };
  }
}
