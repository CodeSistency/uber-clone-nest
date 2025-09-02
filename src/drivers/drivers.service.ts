import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Driver, DriverDocument, Prisma } from '@prisma/client';
import { RegisterDriverDto } from './dto/register-driver.dto';
import { UploadDocumentDto } from './dto/upload-document.dto';

@Injectable()
export class DriversService {
  constructor(private prisma: PrismaService) {}

  async createDriver(data: Prisma.DriverCreateInput): Promise<Driver> {
    return this.prisma.driver.create({
      data,
    });
  }

  async findAllDrivers(): Promise<Driver[]> {
    return this.prisma.driver.findMany({
      include: {
        documents: true,
      },
    });
  }

  async registerDriver(registerDriverDto: RegisterDriverDto): Promise<Driver> {
    const {
      firstName,
      lastName,
      carModel,
      licensePlate,
      carSeats,
      profileImageUrl,
      carImageUrl,
    } = registerDriverDto;

    return this.prisma.driver.create({
      data: {
        firstName,
        lastName,
        profileImageUrl,
        carImageUrl,
        carModel,
        licensePlate,
        carSeats,
      },
    });
  }

  async uploadDocument(
    uploadDocumentDto: UploadDocumentDto,
  ): Promise<DriverDocument> {
    const { driverId, documentType, documentUrl } = uploadDocumentDto;

    return this.prisma.driverDocument.create({
      data: {
        driverId,
        documentType,
        documentUrl,
      },
    });
  }

  async findDriverById(id: number): Promise<Driver | null> {
    return this.prisma.driver.findUnique({
      where: { id },
      include: {
        documents: true,
      },
    });
  }

  async findAvailableDrivers(): Promise<Driver[]> {
    return this.prisma.driver.findMany({
      where: {
        status: 'online',
        canDoDeliveries: true,
      },
      include: {
        documents: true,
      },
    });
  }

  async updateDriver(
    id: number,
    data: Prisma.DriverUpdateInput,
  ): Promise<Driver> {
    return this.prisma.driver.update({
      where: { id },
      data,
    });
  }

  async updateDriverStatus(id: number, status: string): Promise<Driver> {
    return this.prisma.driver.update({
      where: { id },
      data: { status },
    });
  }

  async deleteDriver(id: number): Promise<Driver> {
    return this.prisma.driver.delete({
      where: { id },
    });
  }

  async getRideRequests(): Promise<any[]> {
    const rides = await this.prisma.ride.findMany({
      where: {
        driverId: null, // Rides without assigned driver
        paymentStatus: 'completed',
      },
      include: {
        tier: true,
      },
    });

    return rides.map((ride) => ({
      ride_id: ride.rideId,
      origin_address: ride.originAddress,
      destination_address: ride.destinationAddress,
      fare_price: ride.farePrice.toString(),
      tier_name: ride.tier?.name || 'Standard',
    }));
  }

  async getDriverRides(driverId: number): Promise<any[]> {
    const rides = await this.prisma.ride.findMany({
      where: { driverId },
      include: {
        user: true,
        tier: true,
        ratings: true,
        messages: true,
      },
    });
    return rides;
  }

  async getDriverDeliveryOrders(driverId: number): Promise<any[]> {
    const orders = await this.prisma.deliveryOrder.findMany({
      where: { courierId: driverId },
      include: {
        user: true,
        store: true,
        orderItems: {
          include: {
            product: true,
          },
        },
        ratings: true,
        messages: true,
      },
    });
    return orders;
  }
}
