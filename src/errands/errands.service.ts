import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationManagerService } from '../notifications/notification-manager.service';
import { WebSocketGatewayClass } from '../websocket/websocket.gateway';
import {
  CreateErrandDto,
  ErrandShoppingUpdateDto,
} from '../rides/flow/dto/errand-flow.dtos';

@Injectable()
export class ErrandsService {
  private readonly logger = new Logger(ErrandsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationManager: NotificationManagerService,
    private readonly gateway: WebSocketGatewayClass,
  ) {}

  async createErrand(userId: number, dto: CreateErrandDto) {
    this.logger.log(`Creating errand for user ${userId}: ${dto.description}`);

    const errand = await this.prisma.errand.create({
      data: {
        userId,
        description: dto.description,
        itemsList: dto.itemsList,
        pickupAddress: dto.pickupAddress,
        pickupLat: dto.pickupLat,
        pickupLng: dto.pickupLng,
        dropoffAddress: dto.dropoffAddress,
        dropoffLat: dto.dropoffLat,
        dropoffLng: dto.dropoffLng,
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
    this.gateway.server?.to(`errand-${errand.id}`).emit('errand:created', {
      id: errand.id,
      status: errand.status,
      description: errand.description,
      pickupAddress: errand.pickupAddress,
      dropoffAddress: errand.dropoffAddress,
      timestamp: new Date(),
    });

    this.logger.log(`Errand ${errand.id} created successfully`);
    return errand;
  }

  async findErrandById(errandId: number) {
    return this.prisma.errand.findUnique({
      where: { id: errandId },
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

  async acceptErrand(errandId: number, driverId: number) {
    this.logger.log(`Driver ${driverId} accepting errand ${errandId}`);

    const errand = await this.prisma.errand.update({
      where: { id: errandId },
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
    this.gateway.server?.to(`errand-${errandId}`).emit('errand:accepted', {
      id: errand.id,
      status: errand.status,
      driverId: errand.driverId,
      driverInfo: errand.driver,
      estimatedArrival: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      timestamp: new Date(),
    });

    this.logger.log(`Errand ${errandId} accepted by driver ${driverId}`);
    return errand;
  }

  async updateErrandShopping(
    errandId: number,
    update: ErrandShoppingUpdateDto,
  ) {
    this.logger.log(`Updating shopping for errand ${errandId}`);

    const errand = await this.prisma.errand.update({
      where: { id: errandId },
      data: {
        itemsCost: update.itemsCost,
        shoppingNotes: update.notes,
        status: 'shopping_in_progress',
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
    this.gateway.server
      ?.to(`errand-${errandId}`)
      .emit('errand:shopping_update', {
        id: errand.id,
        status: errand.status,
        shoppingUpdate: {
          itemsCost: update.itemsCost,
          notes: update.notes,
          photos: [], // Could be extended to include photo URLs
        },
        timestamp: new Date(),
      });

    this.logger.log(`Shopping updated for errand ${errandId}`);
    return errand;
  }

  async startErrandDelivery(errandId: number) {
    this.logger.log(`Starting delivery for errand ${errandId}`);

    const errand = await this.prisma.errand.update({
      where: { id: errandId },
      data: {
        status: 'en_route',
        serviceFee: 5.0, // Base service fee
        totalAmount: {
          increment: 5.0, // Add to existing itemsCost if any
        },
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
    this.gateway.server?.to(`errand-${errandId}`).emit('errand:started', {
      id: errand.id,
      status: errand.status,
      message: 'Saliendo hacia su dirección con las compras',
      totalCost: errand.totalAmount,
      timestamp: new Date(),
    });

    this.logger.log(`Delivery started for errand ${errandId}`);
    return errand;
  }

  async completeErrand(errandId: number) {
    this.logger.log(`Completing errand ${errandId}`);

    const errand = await this.prisma.errand.update({
      where: { id: errandId },
      data: {
        status: 'completed',
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
    this.gateway.server?.to(`errand-${errandId}`).emit('errand:completed', {
      id: errand.id,
      status: errand.status,
      finalCost: errand.totalAmount,
      serviceFee: errand.serviceFee,
      totalAmount: errand.totalAmount,
      timestamp: new Date(),
    });

    this.logger.log(`Errand ${errandId} completed successfully`);
    return errand;
  }

  async cancelErrand(errandId: number, reason?: string) {
    this.logger.log(
      `Cancelling errand ${errandId}: ${reason || 'No reason provided'}`,
    );

    const errand = await this.prisma.errand.update({
      where: { id: errandId },
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
    this.gateway.server?.to(`errand-${errandId}`).emit('errand:cancelled', {
      id: errand.id,
      status: errand.status,
      reason,
      timestamp: new Date(),
    });

    this.logger.log(`Errand ${errandId} cancelled`);
    return { ok: true };
  }

  async getErrandStatus(errandId: number) {
    const errand = await this.findErrandById(errandId);
    if (!errand) {
      throw new Error('Errand not found');
    }
    return errand;
  }

  async getUserErrands(userId: number) {
    return this.prisma.errand.findMany({
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

  async getDriverErrands(driverId: number) {
    return this.prisma.errand.findMany({
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
}
