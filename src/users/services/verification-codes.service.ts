import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  VerificationCodeData,
  VerificationType,
  VerificationResult,
} from '../interfaces/verification.interface';

@Injectable()
export class VerificationCodesService {
  private readonly logger = new Logger(VerificationCodesService.name);
  private readonly CODE_LENGTH = 6;
  private readonly CODE_EXPIRY_MINUTES = 15;
  private readonly MAX_ATTEMPTS = 3;

  constructor(private prisma: PrismaService) {}

  /**
   * Genera un código de verificación de 6 dígitos
   */
  generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Crea un nuevo código de verificación
   */
  async createVerificationCode(
    userId: number,
    type: VerificationType,
    target: string,
  ): Promise<VerificationCodeData> {
    this.logger.log(
      `Creating verification code for user ${userId}, type: ${type}, target: ${target}`,
    );

    // Limpiar códigos expirados del usuario para este tipo
    await this.cleanExpiredCodes(userId, type);

    // Verificar si ya existe un código activo para este tipo
    const existingCode = await this.prisma.verificationCode.findFirst({
      where: {
        userId,
        type,
        isUsed: false,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (existingCode) {
      this.logger.warn(
        `Active verification code already exists for user ${userId}, type: ${type}`,
      );
      throw new BadRequestException(
        'Ya existe un código de verificación activo para esta operación',
      );
    }

    // Generar nuevo código
    const code = this.generateCode();
    const expiresAt = new Date(
      Date.now() + this.CODE_EXPIRY_MINUTES * 60 * 1000,
    );

    // Crear código en la base de datos
    const verificationCode = await this.prisma.verificationCode.create({
      data: {
        userId,
        type,
        code,
        target,
        expiresAt,
        attempts: 0,
        isUsed: false,
      },
    });

    this.logger.log(
      `Verification code created: ${verificationCode.id} for user ${userId}`,
    );
    return verificationCode as VerificationCodeData;
  }

  /**
   * Verifica un código de verificación
   */
  async verifyCode(
    userId: number,
    type: VerificationType,
    code: string,
  ): Promise<VerificationResult> {
    this.logger.log(
      `Verifying code for user ${userId}, type: ${type}, code: ${code}`,
    );

    // Buscar código activo
    const verificationCode = await this.prisma.verificationCode.findFirst({
      where: {
        userId,
        type,
        code,
        isUsed: false,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!verificationCode) {
      this.logger.warn(
        `Invalid or expired code for user ${userId}, type: ${type}`,
      );
      return {
        success: false,
        message: 'Código inválido o expirado',
        remainingAttempts: await this.getRemainingAttempts(userId, type),
      };
    }

    // Verificar intentos restantes
    if (verificationCode.attempts >= this.MAX_ATTEMPTS) {
      this.logger.warn(
        `Max attempts exceeded for user ${userId}, type: ${type}`,
      );
      await this.prisma.verificationCode.update({
        where: { id: verificationCode.id },
        data: { isUsed: true },
      });
      return {
        success: false,
        message: 'Máximo número de intentos excedido',
        remainingAttempts: 0,
      };
    }

    // Incrementar intentos
    await this.prisma.verificationCode.update({
      where: { id: verificationCode.id },
      data: {
        attempts: verificationCode.attempts + 1,
        isUsed: true,
        verifiedAt: new Date(),
      },
    });

    this.logger.log(
      `Code verified successfully for user ${userId}, type: ${type}`,
    );
    return {
      success: true,
      message: 'Código verificado exitosamente',
    };
  }

  /**
   * Obtiene los intentos restantes para un usuario y tipo
   */
  async getRemainingAttempts(
    userId: number,
    type: VerificationType,
  ): Promise<number> {
    const verificationCode = await this.prisma.verificationCode.findFirst({
      where: {
        userId,
        type,
        isUsed: false,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!verificationCode) {
      return 0;
    }

    return Math.max(0, this.MAX_ATTEMPTS - verificationCode.attempts);
  }

  /**
   * Obtiene un código de verificación activo
   */
  async getActiveCode(
    userId: number,
    type: VerificationType,
  ): Promise<VerificationCodeData | null> {
    return this.prisma.verificationCode.findFirst({
      where: {
        userId,
        type,
        isUsed: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    }) as Promise<VerificationCodeData | null>;
  }

  /**
   * Cancela un código de verificación activo
   */
  async cancelVerificationCode(
    userId: number,
    type: VerificationType,
  ): Promise<void> {
    this.logger.log(
      `Cancelling verification code for user ${userId}, type: ${type}`,
    );

    await this.prisma.verificationCode.updateMany({
      where: {
        userId,
        type,
        isUsed: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      data: {
        isUsed: true,
      },
    });

    this.logger.log(
      `Verification code cancelled for user ${userId}, type: ${type}`,
    );
  }

  /**
   * Limpia códigos expirados
   */
  async cleanExpiredCodes(
    userId?: number,
    type?: VerificationType,
  ): Promise<void> {
    const whereClause: any = {
      expiresAt: {
        lt: new Date(),
      },
    };

    if (userId) {
      whereClause.userId = userId;
    }

    if (type) {
      whereClause.type = type;
    }

    const result = await this.prisma.verificationCode.updateMany({
      where: whereClause,
      data: {
        isUsed: true,
      },
    });

    if (result.count > 0) {
      this.logger.log(`Cleaned ${result.count} expired verification codes`);
    }
  }

  /**
   * Obtiene estadísticas de códigos de verificación
   */
  async getVerificationStats(userId: number): Promise<{
    totalCodes: number;
    activeCodes: number;
    expiredCodes: number;
    usedCodes: number;
  }> {
    const [totalCodes, activeCodes, expiredCodes, usedCodes] =
      await Promise.all([
        this.prisma.verificationCode.count({
          where: { userId },
        }),
        this.prisma.verificationCode.count({
          where: {
            userId,
            isUsed: false,
            expiresAt: {
              gt: new Date(),
            },
          },
        }),
        this.prisma.verificationCode.count({
          where: {
            userId,
            isUsed: false,
            expiresAt: {
              lt: new Date(),
            },
          },
        }),
        this.prisma.verificationCode.count({
          where: {
            userId,
            isUsed: true,
          },
        }),
      ]);

    return {
      totalCodes,
      activeCodes,
      expiredCodes,
      usedCodes,
    };
  }

  /**
   * Valida si un usuario puede solicitar un nuevo código
   */
  async canRequestNewCode(
    userId: number,
    type: VerificationType,
  ): Promise<boolean> {
    // Verificar si hay un código activo
    const activeCode = await this.getActiveCode(userId, type);
    if (activeCode) {
      return false;
    }

    // Verificar rate limiting (máximo 3 códigos por hora)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentCodes = await this.prisma.verificationCode.count({
      where: {
        userId,
        type,
        createdAt: {
          gte: oneHourAgo,
        },
      },
    });

    return recentCodes < 3;
  }
}
