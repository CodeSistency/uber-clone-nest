import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateServiceDto {
  serviceType: 'ride' | 'delivery' | 'errand' | 'parcel';
  userId?: number;
  driverId?: number;
  data: any;
}

export interface SetServiceStateDto {
  serviceType: 'ride' | 'delivery' | 'errand' | 'parcel';
  state: string;
}

export interface SimulateEventDto {
  serviceId: number;
  serviceType: 'ride' | 'delivery' | 'errand' | 'parcel';
  eventType: string;
  data?: any;
}

@Injectable()
export class TestingService {
  private readonly logger = new Logger(TestingService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getActiveServices() {
    this.logger.log('Getting all active services for testing dashboard');

    const [rides, deliveries, errands, parcels] = await Promise.all([
      this.prisma.ride.findMany({
        where: {
          paymentStatus: { in: ['PENDING', 'PAID'] as any },
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          driver: { select: { id: true, firstName: true, lastName: true } },
          tier: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      this.prisma.deliveryOrder.findMany({
        where: {
          status: { in: ['PENDING', 'ACCEPTED', 'PICKED_UP'] },
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          courier: { select: { id: true, firstName: true, lastName: true } },
          store: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      this.prisma.errand.findMany({
        where: {
          status: {
            in: ['requested', 'accepted', 'shopping_in_progress', 'en_route'],
          },
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          driver: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      this.prisma.parcel.findMany({
        where: {
          status: { in: ['requested', 'accepted', 'picked_up'] },
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          driver: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    ]);

    const services = [
      ...rides.map((ride) => ({
        ...ride,
        serviceType: 'ride',
        serviceId: ride.rideId,
      })),
      ...deliveries.map((delivery) => ({
        ...delivery,
        serviceType: 'delivery',
        serviceId: delivery.orderId,
      })),
      ...errands.map((errand) => ({
        ...errand,
        serviceType: 'errand',
        serviceId: errand.id,
      })),
      ...parcels.map((parcel) => ({
        ...parcel,
        serviceType: 'parcel',
        serviceId: parcel.id,
      })),
    ];

    this.logger.log(`Found ${services.length} active services`);
    return services;
  }

  async createService(dto: CreateServiceDto) {
    this.logger.log(`Creating test service: ${dto.serviceType}`);

    let service;

    switch (dto.serviceType) {
      case 'ride':
        service = await this.prisma.ride.create({
          data: {
            originAddress: dto.data.originAddress || 'Test Origin',
            destinationAddress:
              dto.data.destinationAddress || 'Test Destination',
            originLatitude: dto.data.originLat || 10.5,
            originLongitude: dto.data.originLng || -66.9,
            destinationLatitude: dto.data.destLat || 10.49,
            destinationLongitude: dto.data.destLng || -66.91,
            rideTime: dto.data.rideTime || 15,
            farePrice: dto.data.farePrice || 10.0,
            paymentStatus: 'PENDING',
            userId: dto.userId || 1,
            driverId: dto.driverId,
            tierId: dto.data.tierId || 1,
          },
        });
        break;

      case 'delivery':
        service = await this.prisma.deliveryOrder.create({
          data: {
            userId: dto.userId || 1,
            storeId: dto.data.storeId || 1,
            courierId: dto.driverId,
            deliveryAddress:
              dto.data.deliveryAddress || 'Test Delivery Address',
            deliveryLatitude: dto.data.deliveryLat || 10.5,
            deliveryLongitude: dto.data.deliveryLng || -66.9,
            totalPrice: dto.data.totalPrice || 25.0,
            deliveryFee: dto.data.deliveryFee || 5.0,
            status: 'PENDING',
          },
        });
        break;

      case 'errand':
        service = await this.prisma.errand.create({
          data: {
            userId: dto.userId || 1,
            driverId: dto.driverId,
            description: dto.data.description || 'Test errand',
            itemsList: dto.data.itemsList,
            pickupAddress: dto.data.pickupAddress || 'Test Pickup',
            pickupLat: dto.data.pickupLat || 10.5,
            pickupLng: dto.data.pickupLng || -66.9,
            dropoffAddress: dto.data.dropoffAddress || 'Test Dropoff',
            dropoffLat: dto.data.dropoffLat || 10.49,
            dropoffLng: dto.data.dropoffLng || -66.91,
            status: 'requested',
          },
        });
        break;

      case 'parcel':
        service = await this.prisma.parcel.create({
          data: {
            userId: dto.userId || 1,
            driverId: dto.driverId,
            pickupAddress: dto.data.pickupAddress || 'Test Pickup',
            pickupLat: dto.data.pickupLat || 10.5,
            pickupLng: dto.data.pickupLng || -66.9,
            dropoffAddress: dto.data.dropoffAddress || 'Test Dropoff',
            dropoffLat: dto.data.dropoffLat || 10.49,
            dropoffLng: dto.data.dropoffLng || -66.91,
            type: dto.data.type || 'documents',
            description: dto.data.description,
            status: 'requested',
          },
        });
        break;

      default:
        throw new Error(`Unsupported service type: ${dto.serviceType}`);
    }

    this.logger.log(
      `Created test ${dto.serviceType} with ID: ${service.id || service.rideId || service.orderId}`,
    );
    return service;
  }

  async setServiceState(
    serviceId: number,
    serviceType: string,
    newState: string,
  ) {
    this.logger.log(
      `Setting ${serviceType} ${serviceId} state to: ${newState}`,
    );

    let result;

    switch (serviceType) {
      case 'ride':
        result = await this.prisma.ride.update({
          where: { rideId: serviceId },
          data: { paymentStatus: newState as any },
        });
        break;

      case 'delivery':
        result = await this.prisma.deliveryOrder.update({
          where: { orderId: serviceId },
          data: { status: newState },
        });
        break;

      case 'errand':
        result = await this.prisma.errand.update({
          where: { id: serviceId },
          data: { status: newState },
        });
        break;

      case 'parcel':
        result = await this.prisma.parcel.update({
          where: { id: serviceId },
          data: { status: newState },
        });
        break;

      default:
        throw new Error(`Unsupported service type: ${serviceType}`);
    }

    this.logger.log(`Updated ${serviceType} ${serviceId} state to ${newState}`);
    return result;
  }

  async simulateEvent(dto: SimulateEventDto) {
    this.logger.log(
      `Simulating ${dto.eventType} event for ${dto.serviceType} ${dto.serviceId}`,
    );

    // This would emit WebSocket events for testing
    // Implementation depends on WebSocket gateway setup

    const eventData = {
      serviceId: dto.serviceId,
      serviceType: dto.serviceType,
      eventType: dto.eventType,
      data: dto.data,
      timestamp: new Date(),
      simulated: true,
    };

    // Emit to testing namespace
    // this.gateway.server?.to('testing').emit('simulated-event', eventData);

    this.logger.log(`Simulated event: ${JSON.stringify(eventData)}`);
    return eventData;
  }

  async getServiceStats() {
    const [rideStats, deliveryStats, errandStats, parcelStats] =
      await Promise.all([
        this.prisma.ride.groupBy({
          by: ['paymentStatus'],
          _count: true,
        }),
        this.prisma.deliveryOrder.groupBy({
          by: ['status'],
          _count: true,
        }),
        this.prisma.errand.groupBy({
          by: ['status'],
          _count: true,
        }),
        this.prisma.parcel.groupBy({
          by: ['status'],
          _count: true,
        }),
      ]);

    return {
      rides: rideStats,
      deliveries: deliveryStats,
      errands: errandStats,
      parcels: parcelStats,
      totalActive:
        rideStats.length +
        deliveryStats.length +
        errandStats.length +
        parcelStats.length,
    };
  }

  async cleanupTestData() {
    this.logger.log('Cleaning up test data');

    // Only delete services created in the last hour to avoid deleting real data
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const [deletedRides, deletedDeliveries, deletedErrands, deletedParcels] =
      await Promise.all([
        this.prisma.ride.deleteMany({
          where: {
            createdAt: { gte: oneHourAgo },
            paymentStatus: 'PENDING',
          },
        }),
        this.prisma.deliveryOrder.deleteMany({
          where: {
            createdAt: { gte: oneHourAgo },
            status: 'PENDING',
          },
        }),
        this.prisma.errand.deleteMany({
          where: {
            createdAt: { gte: oneHourAgo },
            status: 'requested',
          },
        }),
        this.prisma.parcel.deleteMany({
          where: {
            createdAt: { gte: oneHourAgo },
            status: 'requested',
          },
        }),
      ]);

    this.logger.log(
      `Cleaned up: ${deletedRides.count} rides, ${deletedDeliveries.count} deliveries, ${deletedErrands.count} errands, ${deletedParcels.count} parcels`,
    );
    return {
      rides: deletedRides.count,
      deliveries: deletedDeliveries.count,
      errands: deletedErrands.count,
      parcels: deletedParcels.count,
    };
  }
}
