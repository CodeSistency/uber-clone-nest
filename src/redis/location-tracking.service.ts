import { Injectable } from '@nestjs/common';
import { RedisPubSubService } from './redis-pubsub.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

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
  constructor(
    private prisma: PrismaService,
    configService: ConfigService,
  ) {
    super(configService);
  }

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
      const data: any = JSON.parse(message);

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
  async updateDriverLocation(
    driverId: number,
    location: { lat: number; lng: number },
    rideId?: number,
    additionalData?: {
      accuracy?: number;
      speed?: number;
      heading?: number;
      altitude?: number;
      source?: string;
    },
  ) {
    const now = new Date();
    const locationData: DriverLocation = {
      driverId,
      location,
      timestamp: now,
      rideId,
    };

    try {
      console.log(`🔄 [LOCATION-TRACKING] Actualizando BD para conductor ${driverId}:`);
      console.log(`   Lat: ${location.lat}, Lng: ${location.lng}`);
      console.log(`   Accuracy: ${additionalData?.accuracy || 'null'}`);
      console.log(`   Timestamp: ${now.toISOString()}`);

      // Update driver's current location in database
      const updateResult = await this.prisma.driver.update({
        where: { id: driverId },
        data: {
          currentLatitude: location.lat,
          currentLongitude: location.lng,
          lastLocationUpdate: now,
          locationAccuracy: additionalData?.accuracy || null,
          isLocationActive: true,
          updatedAt: now,
        },
      });

      console.log(`✅ [LOCATION-TRACKING] BD actualizada exitosamente para conductor ${driverId}`);
      console.log(`   Resultado: isLocationActive=${updateResult.isLocationActive}, lat=${updateResult.currentLatitude}, lng=${updateResult.currentLongitude}`);

      // Save to location history
      await this.prisma.driverLocationHistory.create({
        data: {
          driverId,
          latitude: location.lat,
          longitude: location.lng,
          accuracy: additionalData?.accuracy || null,
          speed: additionalData?.speed || null,
          heading: additionalData?.heading || null,
          altitude: additionalData?.altitude || null,
          rideId: rideId || null,
          timestamp: now,
          source: additionalData?.source || 'gps',
        },
      });

      // Store in memory (for Redis fallback)
      this.driverLocations.set(driverId, locationData);

      // Publish to Redis
      await this.publish('driver:locations', locationData);

      // If ride is active, publish ride update
      if (rideId) {
        await this.publishRideUpdate(rideId, 'location', {
          driverLocation: location,
        });
      }

      console.debug(
        `Driver ${driverId} location updated: ${location.lat}, ${location.lng}`,
      );
    } catch (error) {
      console.error(`Failed to update driver location:`, error);
      throw error;
    }
  }

  getDriverLocation(driverId: number): DriverLocation | null {
    return this.driverLocations.get(driverId) || null;
  }

  // Get driver location from database (fallback when not in memory)
  async getDriverLocationFromDB(driverId: number) {
    const driver = await this.prisma.driver.findUnique({
      where: { id: driverId },
      select: {
        currentLatitude: true,
        currentLongitude: true,
        lastLocationUpdate: true,
        locationAccuracy: true,
        isLocationActive: true,
      },
    });

    if (driver?.currentLatitude && driver?.currentLongitude) {
      return {
        driverId,
        location: {
          lat: Number(driver.currentLatitude),
          lng: Number(driver.currentLongitude),
        },
        timestamp: driver.lastLocationUpdate || new Date(),
        accuracy: driver.locationAccuracy
          ? Number(driver.locationAccuracy)
          : undefined,
        isActive: driver.isLocationActive,
      };
    }

    return null;
  }

  // Get driver location history
  async getDriverLocationHistory(
    driverId: number,
    options?: {
      limit?: number;
      startDate?: Date;
      endDate?: Date;
      rideId?: number;
    },
  ) {
    const whereClause: any = { driverId };

    if (options?.startDate || options?.endDate) {
      whereClause.timestamp = {};
      if (options.startDate) whereClause.timestamp.gte = options.startDate;
      if (options.endDate) whereClause.timestamp.lte = options.endDate;
    }

    if (options?.rideId) {
      whereClause.rideId = options.rideId;
    }

    return this.prisma.driverLocationHistory.findMany({
      where: whereClause,
      orderBy: { timestamp: 'desc' },
      take: options?.limit || 50,
      select: {
        id: true,
        latitude: true,
        longitude: true,
        accuracy: true,
        speed: true,
        heading: true,
        altitude: true,
        timestamp: true,
        source: true,
        rideId: true,
      },
    });
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
      await this.publishRideUpdate(rideId, 'location', {
        driverLocation: driverLocation.location,
      });
    }

    console.log(`User ${userId} subscribed to ride ${rideId}`);
  }

  unsubscribeFromRide(rideId: number, userId: string) {
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
        driverLocation: data.location,
      }).catch((error) => {
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
    for (const [, location] of this.driverLocations.entries()) {
      if (location.rideId === rideId) {
        return location;
      }
    }
    return null;
  }

  // Geofencing and validation methods
  async validateLocationInServiceArea(
    lat: number,
    lng: number,
  ): Promise<boolean> {
    // Define service area boundaries (Caracas, Venezuela as example)
    const serviceArea = {
      north: 10.55, // North boundary
      south: 10.45, // South boundary
      east: -66.85, // East boundary
      west: -66.95, // West boundary
    };

    return (
      lat >= serviceArea.south &&
      lat <= serviceArea.north &&
      lng >= serviceArea.west &&
      lng <= serviceArea.east
    );
  }

  // Calculate distance between two coordinates using Haversine formula
  calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
  }

  // Find drivers within radius and filter by criteria
  async findNearbyDrivers(
    centerLat: number,
    centerLng: number,
    radiusKm: number,
    filters?: {
      vehicleTypeId?: number;
      status?: string;
      verified?: boolean;
      verificationStatus?: string;
      tierId?: number;
    },
  ) {
    // First, validate location is in service area
    const isInServiceArea = await this.validateLocationInServiceArea(
      centerLat,
      centerLng,
    );
    if (!isInServiceArea) {
      return [];
    }

    // Get all online drivers from database
    const whereClause: any = {
      status: filters?.status || 'online',
      isLocationActive: true,
      currentLatitude: { not: null },
      currentLongitude: { not: null },
    };

    // Handle verification status filter
    if (filters?.verified !== undefined) {
      whereClause.verificationStatus = filters.verified
        ? 'approved'
        : { not: 'approved' };
    }

    // Handle direct verificationStatus filter (for backward compatibility)
    if (filters?.verificationStatus) {
      whereClause.verificationStatus = filters.verificationStatus;
    }

    if (filters?.vehicleTypeId) {
      whereClause.vehicleTypeId = filters.vehicleTypeId;
    }

    console.log(`🔍 [LOCATION-TRACKING] Where clause aplicado:`, JSON.stringify(whereClause, null, 2));

    const drivers = await this.prisma.driver.findMany({
      where: whereClause,
      include: {
        vehicles: {
          where: { isDefault: true, status: 'active' },
          take: 1,
          include: { vehicleType: true },
        },
      },
    });

    console.log(`📊 [LOCATION-TRACKING] Encontrados ${drivers.length} conductores antes del filtro de distancia`);
    drivers.forEach((driver, index) => {
      console.log(`   ${index + 1}. ID=${driver.id} - ${driver.firstName} ${driver.lastName} - Status: ${driver.status} - Verified: ${driver.verificationStatus} - Location: (${driver.currentLatitude}, ${driver.currentLongitude})`);
    });

    // Filter by distance and calculate additional data
    const nearbyDrivers = drivers
      .map((driver) => {
        const driverLat = Number(driver.currentLatitude);
        const driverLng = Number(driver.currentLongitude);
        const distance = this.calculateDistance(
          centerLat,
          centerLng,
          driverLat,
          driverLng,
        );

        console.log(`📍 [LOCATION-TRACKING] Conductor ${driver.id}: ubicación (${driverLat}, ${driverLng}) - Distancia: ${distance.toFixed(3)}km - Dentro del radio ${radiusKm}km: ${distance <= radiusKm}`);

        if (distance <= radiusKm) {
          // Calculate estimated time (assuming average speed of 30 km/h in city)
          const estimatedMinutes = Math.round((distance / 30) * 60);

          return {
            id: driver.id,
            firstName: driver.firstName,
            lastName: driver.lastName,
            profileImageUrl: driver.profileImageUrl,
            carModel: driver.vehicles?.[0] ? `${driver.vehicles[0].make} ${driver.vehicles[0].model}` : '',
            licensePlate: driver.vehicles?.[0]?.licensePlate || '',
            carSeats: driver.vehicles?.[0]?.seatingCapacity || 0,
            vehicleType: driver.vehicles?.[0]?.vehicleType?.displayName || 'Unknown',
            currentLocation: {
              lat: Number(driver.currentLatitude),
              lng: Number(driver.currentLongitude),
            },
            lastLocationUpdate: driver.lastLocationUpdate,
            locationAccuracy: driver.locationAccuracy
              ? Number(driver.locationAccuracy)
              : null,
            distance: Math.round(distance * 100) / 100, // Round to 2 decimal places
            estimatedMinutes,
            rating: 4.5, // TODO: Calculate from ratings table
          };
        }
        return null;
      })
      .filter((driver) => driver !== null)
      .sort((a, b) => a.distance - b.distance); // Sort by distance

    return nearbyDrivers;
  }

  // Health check
  async getHealthStatus() {
    const [activeDriversCount, totalHistoryRecords] = await Promise.all([
      this.prisma.driver.count({
        where: {
          status: 'online',
          isLocationActive: true,
          currentLatitude: { not: null },
          currentLongitude: { not: null },
        },
      }),
      this.prisma.driverLocationHistory.count(),
    ]);

    return {
      redisConnected: this.isRedisConnected(),
      activeDrivers: this.driverLocations.size,
      activeDriversInDB: activeDriversCount,
      activeRides: this.rideSubscribers.size,
      totalSubscribers: Array.from(this.rideSubscribers.values()).reduce(
        (total, subscribers) => total + subscribers.size,
        0,
      ),
      totalLocationHistoryRecords: totalHistoryRecords,
      timestamp: new Date(),
    };
  }
}
