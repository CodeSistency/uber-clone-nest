import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IdentityVerificationData, IdentityVerificationStatus } from '../interfaces/verification.interface';

@Injectable()
export class IdentityVerificationService {
  private readonly logger = new Logger(IdentityVerificationService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Crea una solicitud de verificación de identidad
   */
  async createVerificationRequest(
    userId: number,
    dniNumber: string,
    frontPhotoUrl: string,
    backPhotoUrl: string,
  ): Promise<IdentityVerificationData> {
    this.logger.log(`Creating identity verification request for user ${userId}, DNI: ${dniNumber}`);

    // Verificar si el usuario ya tiene una verificación pendiente o aprobada
    const existingVerification = await this.prisma.identityVerification.findUnique({
      where: { userId },
    });

    if (existingVerification) {
      if (existingVerification.status === 'PENDING') {
        throw new BadRequestException('Ya tienes una solicitud de verificación de identidad pendiente');
      }
      if (existingVerification.status === 'VERIFIED') {
        throw new BadRequestException('Tu identidad ya ha sido verificada');
      }
    }

    // Verificar si el DNI ya está en uso por otro usuario
    const dniInUse = await this.prisma.identityVerification.findFirst({
      where: {
        dniNumber,
        status: 'VERIFIED' as any,
        userId: { not: userId },
      },
    });

    if (dniInUse) {
      throw new BadRequestException('Este número de DNI ya está registrado por otro usuario');
    }

    // Crear o actualizar la verificación
    const verification = await this.prisma.identityVerification.upsert({
      where: { userId },
      update: {
        dniNumber,
        frontPhotoUrl,
        backPhotoUrl,
        status: 'PENDING' as any,
        verifiedAt: null,
        verifiedBy: null,
        rejectionReason: null,
      },
      create: {
        userId,
        dniNumber,
        frontPhotoUrl,
        backPhotoUrl,
        status: 'PENDING' as any,
      },
    });

    this.logger.log(`Identity verification request created: ${verification.id} for user ${userId}`);
    return verification as any;
  }

  /**
   * Obtiene la verificación de identidad de un usuario
   */
  async getUserVerification(userId: number): Promise<IdentityVerificationData | null> {
    return this.prisma.identityVerification.findUnique({
      where: { userId },
    }) as Promise<IdentityVerificationData | null>;
  }

  /**
   * Obtiene todas las solicitudes pendientes (para administradores)
   */
  async getPendingVerifications(): Promise<IdentityVerificationData[]> {
    return this.prisma.identityVerification.findMany({
      where: {
        status: 'PENDING' as any,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    }) as any;
  }

  /**
   * Verifica una identidad (para administradores)
   */
  async verifyIdentity(
    verificationId: number,
    adminId: number,
    status: 'verified' | 'rejected',
    reason?: string,
  ): Promise<IdentityVerificationData> {
    this.logger.log(`Processing identity verification ${verificationId} by admin ${adminId}, status: ${status}`);

    const verification = await this.prisma.identityVerification.findUnique({
      where: { id: verificationId },
      include: { user: true },
    });

    if (!verification) {
      throw new NotFoundException('Solicitud de verificación no encontrada');
    }

    if (verification.status !== 'PENDING') {
      throw new BadRequestException('Esta solicitud ya ha sido procesada');
    }

    const updateData: any = {
      status: status === 'verified' ? 'VERIFIED' as any : 'REJECTED' as any,
      verifiedBy: adminId,
      verifiedAt: new Date(),
    };

    if (status === 'rejected' && reason) {
      updateData.rejectionReason = reason;
    }

    const updatedVerification = await this.prisma.identityVerification.update({
      where: { id: verificationId },
      data: updateData,
    });

    // Si se aprueba, actualizar el estado de verificación del usuario
    if (status === 'verified') {
      await this.prisma.user.update({
        where: { id: verification.userId },
        data: {
          identityVerified: true,
          identityVerifiedAt: new Date(),
          dniNumber: verification.dniNumber,
        },
      });

      this.logger.log(`User ${verification.userId} identity verified successfully`);
    }

    this.logger.log(`Identity verification ${verificationId} processed: ${status}`);
    return updatedVerification as any;
  }

  /**
   * Obtiene estadísticas de verificación de identidad
   */
  async getVerificationStats(): Promise<{
    total: number;
    pending: number;
    verified: number;
    rejected: number;
  }> {
    const [total, pending, verified, rejected] = await Promise.all([
      this.prisma.identityVerification.count(),
      this.prisma.identityVerification.count({
        where: { status: 'PENDING' as any },
      }),
      this.prisma.identityVerification.count({
        where: { status: 'VERIFIED' as any },
      }),
      this.prisma.identityVerification.count({
        where: { status: 'REJECTED' as any },
      }),
    ]);

    return { total, pending, verified, rejected };
  }

  /**
   * Obtiene verificaciones por estado
   */
  async getVerificationsByStatus(
    status: IdentityVerificationStatus,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    data: IdentityVerificationData[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.identityVerification.findMany({
        where: { status: status as any },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.identityVerification.count({
        where: { status: status as any },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: data as any,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Obtiene una verificación específica por ID
   */
  async getVerificationById(verificationId: number): Promise<IdentityVerificationData | null> {
    return this.prisma.identityVerification.findUnique({
      where: { id: verificationId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            createdAt: true,
          },
        },
      },
    }) as Promise<IdentityVerificationData | null>;
  }

  /**
   * Valida el formato del DNI
   */
  validateDNIFormat(dniNumber: string): boolean {
    // Formato básico para DNI venezolano (8-9 dígitos)
    const dniRegex = /^[0-9]{7,9}$/;
    return dniRegex.test(dniNumber);
  }

  /**
   * Obtiene el estado de verificación de un usuario
   */
  async getUserVerificationStatus(userId: number): Promise<{
    isVerified: boolean;
    status: string;
    verifiedAt?: Date;
    rejectionReason?: string;
  }> {
    const verification = await this.getUserVerification(userId);

    if (!verification) {
      return {
        isVerified: false,
        status: 'not_submitted',
      };
    }

    return {
      isVerified: verification.status === IdentityVerificationStatus.VERIFIED,
      status: verification.status,
      verifiedAt: verification.verifiedAt,
      rejectionReason: verification.rejectionReason,
    };
  }
}
