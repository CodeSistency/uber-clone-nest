import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { WebSocketGatewayClass } from '../websocket/websocket.gateway';

export interface CreateParcelDto {
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  dropoffAddress: string;
  dropoffLat: number;
  dropoffLng: number;
  type: string;
  description?: string;
  weight?: number;
  dimensions?: string;
}

export interface DeliveryProofDto {
  photoUrl?: string;
  signatureUrl?: string;
  recipientName?: string;
  recipientPhone?: string;
}

@Injectable()
export class ParcelsService {
  private readonly logger = new Logger(ParcelsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly gateway: WebSocketGatewayClass,
  ) {}

  async createParcel(userId: number, dto: CreateParcelDto) {
    this.logger.log(`Creating parcel for user ${userId}: ${dto.type}`);

    const parcel = await this.prisma.parcel.create({
      data: {
        userId,
        pickupAddress: dto.pickupAddress,
        pickupLat: dto.pickupLat,
        pickupLng: dto.pickupLng,
        dropoffAddress: dto.dropoffAddress,
        dropoffLat: dto.dropoffLat,
        dropoffLng: dto.dropoffLng,
        type: dto.type,
        description: dto.description,
        weight: dto.weight,
        dimensions: dto.dimensions,
        status: 'requested',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Emit WebSocket event
    this.gateway.server?.to(`parcel-${parcel.id}`).emit('parcel:created', {
      id: parcel.id,
      status: parcel.status,
      pickupAddress: parcel.pickupAddress,
      dropoffAddress: parcel.dropoffAddress,
      type: parcel.type,
      timestamp: new Date(),
    });

    this.logger.log(`Parcel ${parcel.id} created successfully`);
    return parcel;
  }

  async findParcelById(parcelId: number) {
    return this.prisma.parcel.findUnique({
      where: { id: parcelId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImageUrl: true,
          },
        },
      },
    });
  }

  async acceptParcel(parcelId: number, driverId: number) {
    this.logger.log(`Driver ${driverId} accepting parcel ${parcelId}`);

    const parcel = await this.prisma.parcel.update({
      where: { id: parcelId },
      data: {
        driverId,
        status: 'accepted',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Emit WebSocket event
    this.gateway.server?.to(`parcel-${parcelId}`).emit('parcel:accepted', {
      id: parcel.id,
      status: parcel.status,
      driverId: parcel.driverId,
      driverInfo: parcel.driver,
      estimatedPickupTime: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      timestamp: new Date(),
    });

    this.logger.log(`Parcel ${parcelId} accepted by driver ${driverId}`);
    return parcel;
  }

  async pickupParcel(parcelId: number) {
    this.logger.log(`Picking up parcel ${parcelId}`);

    const parcel = await this.prisma.parcel.update({
      where: { id: parcelId },
      data: {
        status: 'picked_up',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Emit WebSocket event
    this.gateway.server?.to(`parcel-${parcelId}`).emit('parcel:picked_up', {
      id: parcel.id,
      status: parcel.status,
      pickupTime: new Date(),
      message: 'Paquete recogido del punto de origen',
      timestamp: new Date(),
    });

    this.logger.log(`Parcel ${parcelId} picked up`);
    return parcel;
  }

  async deliverParcel(parcelId: number, proof: DeliveryProofDto) {
    this.logger.log(`Delivering parcel ${parcelId}`);

    const parcel = await this.prisma.parcel.update({
      where: { id: parcelId },
      data: {
        status: 'delivered',
        proofOfDelivery: proof.photoUrl,
        recipientName: proof.recipientName,
        recipientPhone: proof.recipientPhone,
        serviceFee: 10.0, // Base delivery fee
        totalAmount: 10.0,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Emit WebSocket event
    this.gateway.server?.to(`parcel-${parcelId}`).emit('parcel:delivered', {
      id: parcel.id,
      status: parcel.status,
      deliveryTime: new Date(),
      proofOfDelivery: {
        photoUrl: proof.photoUrl,
        signatureUrl: proof.signatureUrl,
        recipientName: proof.recipientName,
      },
      finalPrice: parcel.totalAmount,
      timestamp: new Date(),
    });

    this.logger.log(`Parcel ${parcelId} delivered successfully`);
    return parcel;
  }

  async cancelParcel(parcelId: number, reason?: string) {
    this.logger.log(
      `Cancelling parcel ${parcelId}: ${reason || 'No reason provided'}`,
    );

    const parcel = await this.prisma.parcel.update({
      where: { id: parcelId },
      data: {
        status: 'cancelled',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Emit WebSocket event
    this.gateway.server?.to(`parcel-${parcelId}`).emit('parcel:cancelled', {
      id: parcel.id,
      status: parcel.status,
      reason,
      timestamp: new Date(),
    });

    this.logger.log(`Parcel ${parcelId} cancelled`);
    return { ok: true };
  }

  async getParcelStatus(parcelId: number) {
    const parcel = await this.findParcelById(parcelId);
    if (!parcel) {
      throw new Error('Parcel not found');
    }
    return parcel;
  }

  async getUserParcels(userId: number) {
    return this.prisma.parcel.findMany({
      where: { userId },
      include: {
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImageUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDriverParcels(driverId: number) {
    return this.prisma.parcel.findMany({
      where: { driverId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getParcelTypes() {
    // Return available parcel types
    return [
      {
        id: 'documents',
        name: 'Documentos',
        description: 'Documentos y papeles importantes',
      },
      {
        id: 'small_package',
        name: 'Paquete Pequeño',
        description: 'Hasta 5kg, dimensiones pequeñas',
      },
      {
        id: 'large_package',
        name: 'Paquete Grande',
        description: 'Hasta 15kg, dimensiones grandes',
      },
      {
        id: 'fragile',
        name: 'Frágil',
        description: 'Artículos delicados que requieren cuidado especial',
      },
    ];
  }
}
