import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../../prisma/prisma.service';
import { EncryptionService } from './encryption.service';
import { APIKeysService } from './api-keys.service';

@Injectable()
export class APIKeysRotationService {
  private readonly logger = new Logger(APIKeysRotationService.name);

  constructor(
    private prisma: PrismaService,
    private encryptionService: EncryptionService,
    private apiKeysService: APIKeysService,
  ) {}

  /**
   * Rotación automática diaria a medianoche
   * Verifica claves que necesitan rotación basada en política
   */
  @Cron('0 0 * * *') // Ejecutar diariamente a medianoche
  async handleAutoRotation() {
    this.logger.log('Starting automatic API key rotation check');

    try {
      const keysToRotate = await this.findKeysNeedingRotation();
      this.logger.log(`Found ${keysToRotate.length} keys that need rotation`);

      const results: Array<{
        id: number;
        name: string;
        success: boolean;
        error?: string;
      }> = [];
      for (const key of keysToRotate) {
        try {
          const result = await this.rotateKey(
            key.id,
            `Auto-rotation: ${key.rotationPolicy}`,
          );
          results.push(result);
          this.logger.log(`Successfully rotated key: ${key.name}`);
        } catch (error) {
          this.logger.error(`Failed to rotate key ${key.name}:`, error);
          results.push({
            id: key.id,
            name: key.name,
            success: false,
            error: (error as Error).message,
          });
        }
      }

      this.logger.log(
        `Auto-rotation completed. Success: ${results.filter((r) => r.success).length}, Failed: ${results.filter((r) => !r.success).length}`,
      );

      // Log summary
      await this.logRotationSummary(results);
    } catch (error) {
      this.logger.error('Error during automatic rotation:', error);
    }
  }

  /**
   * Rotación de claves próximas a expirar (cada 6 horas)
   */
  @Cron('0 */6 * * *') // Ejecutar cada 6 horas
  async handleExpiringKeysRotation() {
    this.logger.log('Checking for expiring API keys');

    try {
      const expiringKeys = await this.findExpiringKeys();
      this.logger.log(`Found ${expiringKeys.length} keys expiring soon`);

      for (const key of expiringKeys) {
        try {
          if (!key.expiresAt) {
            this.logger.warn(`Key ${key.name} has no expiry date, skipping`);
            continue;
          }

          const daysUntilExpiry = Math.floor(
            (new Date(key.expiresAt).getTime() - Date.now()) /
              (1000 * 60 * 60 * 24),
          );

          if (daysUntilExpiry <= 7) {
            // Rotar claves que expiran en 7 días o menos
            await this.rotateKey(
              key.id,
              `Auto-rotation: Key expires in ${daysUntilExpiry} days`,
            );
            this.logger.log(
              `Rotated expiring key: ${key.name} (${daysUntilExpiry} days left)`,
            );
          } else {
            // Solo log para claves que expiran pronto pero no necesitan rotación inmediata
            this.logger.warn(
              `Key ${key.name} expires in ${daysUntilExpiry} days`,
            );
          }
        } catch (error) {
          this.logger.error(
            `Failed to rotate expiring key ${key.name}:`,
            error,
          );
        }
      }
    } catch (error) {
      this.logger.error('Error checking expiring keys:', error);
    }
  }

  /**
   * Limpieza de claves expiradas (semanalmente)
   */
  @Cron('0 1 * * 1') // Ejecutar los lunes a la 1 AM
  async handleExpiredKeysCleanup() {
    this.logger.log('Starting expired API keys cleanup');

    try {
      const expiredKeys = await this.prisma.aPIKey.findMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
          isActive: true,
        },
      });

      this.logger.log(`Found ${expiredKeys.length} expired active keys`);

      for (const key of expiredKeys) {
        try {
          // Desactivar claves expiradas automáticamente
          await this.apiKeysService.toggleActive(key.id, false, 'system');
          this.logger.warn(`Deactivated expired key: ${key.name}`);

          // Crear auditoría
          await this.apiKeysService['createAuditLog'](
            key.id,
            'deactivated',
            null,
            null,
            {
              metadata: {
                reason: 'Key expired',
                expiredAt: key.expiresAt,
                autoDeactivated: true,
              },
            },
          );
        } catch (error) {
          this.logger.error(
            `Failed to deactivate expired key ${key.name}:`,
            error,
          );
        }
      }
    } catch (error) {
      this.logger.error('Error during expired keys cleanup:', error);
    }
  }

  /**
   * Encuentra claves que necesitan rotación basada en política
   */
  private async findKeysNeedingRotation() {
    const now = new Date();

    return this.prisma.aPIKey.findMany({
      where: {
        isActive: true,
        rotationPolicy: {
          not: 'manual',
        },
        OR: [
          // Rotación por política de tiempo
          ...this.buildRotationCondition(now),
          // Claves que nunca se han rotado (más de 90 días)
          {
            lastRotated: {
              lt: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
            },
          },
        ],
      },
    });
  }

  /**
   * Construye condición de rotación basada en política
   */
  private buildRotationCondition(now: Date) {
    const conditions: Array<{
      rotationPolicy: string;
      lastRotated: { lt: Date };
    }> = [];

    // auto_30d: Rotar si han pasado más de 30 días desde la última rotación
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    conditions.push({
      rotationPolicy: 'auto_30d',
      lastRotated: {
        lt: thirtyDaysAgo,
      },
    });

    // auto_90d: Rotar si han pasado más de 90 días
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    conditions.push({
      rotationPolicy: 'auto_90d',
      lastRotated: {
        lt: ninetyDaysAgo,
      },
    });

    // auto_1y: Rotar si han pasado más de 365 días
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    conditions.push({
      rotationPolicy: 'auto_1y',
      lastRotated: {
        lt: oneYearAgo,
      },
    });

    return conditions;
  }

  /**
   * Encuentra claves que están próximas a expirar
   */
  private async findExpiringKeys() {
    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    return this.prisma.aPIKey.findMany({
      where: {
        expiresAt: {
          lte: sevenDaysFromNow,
          gt: new Date(), // No incluir claves ya expiradas
        },
        isActive: true,
        rotationPolicy: {
          not: 'manual', // Solo rotar automáticamente claves con política automática
        },
      },
    });
  }

  /**
   * Rota una clave API específica
   */
  async rotateKey(id: number, reason: string): Promise<any> {
    const apiKey = await this.prisma.aPIKey.findUnique({
      where: { id },
    });

    if (!apiKey) {
      throw new Error(`API key with ID ${id} not found`);
    }

    // Generar nueva clave basada en el servicio
    const newKeyValue = await this.generateNewKeyForService(
      apiKey.service,
      apiKey.keyType,
    );

    // Usar el servicio de API keys para rotar
    const rotatedKey = await this.apiKeysService.rotateKey(
      id,
      {
        newKeyValue,
        reason,
      },
      'system-auto-rotation',
    );

    // Notificar sobre la rotación (si es necesario)
    await this.notifyKeyRotation(apiKey, newKeyValue);

    return {
      id: rotatedKey.id,
      name: rotatedKey.name,
      service: rotatedKey.service,
      environment: rotatedKey.environment,
      success: true,
      rotatedAt: new Date(),
      reason,
    };
  }

  /**
   * Genera una nueva clave para un servicio específico
   */
  private async generateNewKeyForService(
    service: string,
    keyType: string,
  ): Promise<string> {
    // Para servicios reales, esto debería integrar con APIs de gestión de claves
    // Por ahora, generamos claves seguras de placeholder

    switch (service) {
      case 'stripe':
        if (keyType === 'secret') {
          return `sk_live_${this.encryptionService.generateSecureAPIKey('', 24)}`;
        } else if (keyType === 'webhook_secret') {
          return `whsec_${this.encryptionService.generateSecureAPIKey('', 32)}`;
        }
        break;

      case 'twilio':
        if (keyType === 'secret') {
          return `SK${this.encryptionService.generateSecureAPIKey('', 34)}`;
        } else if (keyType === 'access_token') {
          return `AC${this.encryptionService.generateSecureAPIKey('', 34)}`;
        }
        break;

      case 'firebase':
        if (keyType === 'private_key') {
          // Firebase usa JSON, pero generamos un placeholder
          return this.encryptionService.generateSecureAPIKey('firebase_', 64);
        } else if (keyType === 'public') {
          return `AIza${this.encryptionService.generateSecureAPIKey('', 35)}`;
        }
        break;

      case 'google_maps':
        return `AIza${this.encryptionService.generateSecureAPIKey('', 35)}`;

      case 'sendgrid':
        return `SG.${this.encryptionService.generateSecureAPIKey('', 22)}.${this.encryptionService.generateSecureAPIKey('', 22)}`;

      case 'aws':
        if (keyType === 'access_token') {
          return `AKIA${this.encryptionService.generateSecureAPIKey('', 16)}`;
        } else if (keyType === 'secret') {
          return this.encryptionService.generateSecureAPIKey('', 40);
        }
        break;

      default:
        // Para servicios desconocidos, generar clave genérica segura
        return this.encryptionService.generateSecureAPIKey(`${service}_`, 32);
    }

    // Fallback
    return this.encryptionService.generateSecureAPIKey(
      `${service}_${keyType}_`,
      32,
    );
  }

  /**
   * Notifica sobre la rotación de una clave
   */
  private async notifyKeyRotation(
    oldKey: any,
    newKeyValue: string,
  ): Promise<void> {
    // Aquí se podría integrar con un sistema de notificaciones
    // Por ejemplo, enviar email al administrador o crear una alerta

    this.logger.log(
      `Key rotated notification: ${oldKey.name} (${oldKey.service}/${oldKey.environment})`,
    );

    // En un sistema real, esto podría:
    // 1. Enviar email al administrador
    // 2. Crear una alerta en el dashboard
    // 3. Actualizar sistemas externos que usan la clave
    // 4. Crear un ticket en un sistema de gestión de cambios

    // Por ahora, solo log
    const notification = {
      type: 'api_key_rotated',
      keyName: oldKey.name,
      service: oldKey.service,
      environment: oldKey.environment,
      rotatedAt: new Date(),
      newKeyPreview: this.encryptionService.maskSensitiveData(newKeyValue),
    };

    this.logger.log('Key rotation notification:', notification);
  }

  /**
   * Registra un resumen de las rotaciones realizadas
   */
  private async logRotationSummary(results: any[]): Promise<void> {
    const summary = {
      timestamp: new Date(),
      totalKeys: results.length,
      successfulRotations: results.filter((r) => r.success).length,
      failedRotations: results.filter((r) => !r.success).length,
      serviceBreakdown: this.groupResultsByService(results),
    };

    this.logger.log('API Key rotation summary:', summary);

    // Aquí se podría almacenar el resumen en una tabla de logs
    // o enviar a un sistema de monitoreo
  }

  /**
   * Agrupa resultados por servicio
   */
  private groupResultsByService(results: any[]): Record<string, any> {
    const groups = {};

    results.forEach((result) => {
      const service = result.service || 'unknown';
      if (!groups[service]) {
        groups[service] = {
          total: 0,
          successful: 0,
          failed: 0,
        };
      }

      groups[service].total++;
      if (result.success) {
        groups[service].successful++;
      } else {
        groups[service].failed++;
      }
    });

    return groups;
  }

  /**
   * Obtiene estadísticas de rotación para el dashboard
   */
  async getRotationStats(): Promise<any> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [totalKeys, keysNeedingRotation, expiringKeys, recentRotations] =
      await Promise.all([
        this.prisma.aPIKey.count(),
        this.findKeysNeedingRotation(),
        this.findExpiringKeys(),
        this.prisma.aPIKeyAudit.findMany({
          where: {
            action: 'rotated',
            performedAt: {
              gte: thirtyDaysAgo,
            },
          },
          include: {
            apiKey: {
              select: {
                name: true,
                service: true,
                environment: true,
              },
            },
          },
          orderBy: {
            performedAt: 'desc',
          },
          take: 10,
        }),
      ]);

    return {
      totalKeys,
      keysNeedingRotation: keysNeedingRotation.length,
      expiringKeys: expiringKeys.length,
      recentRotations: recentRotations.map((audit) => ({
        id: audit.id,
        keyName: audit.apiKey.name,
        service: audit.apiKey.service,
        environment: audit.apiKey.environment,
        rotatedAt: audit.performedAt,
        performedBy: audit.performedBy,
        reason:
          audit.metadata &&
          typeof audit.metadata === 'object' &&
          !Array.isArray(audit.metadata)
            ? (audit.metadata as any).reason
            : null,
      })),
      rotationPolicies: {
        manual: await this.prisma.aPIKey.count({
          where: { rotationPolicy: 'manual' },
        }),
        auto_30d: await this.prisma.aPIKey.count({
          where: { rotationPolicy: 'auto_30d' },
        }),
        auto_90d: await this.prisma.aPIKey.count({
          where: { rotationPolicy: 'auto_90d' },
        }),
        auto_1y: await this.prisma.aPIKey.count({
          where: { rotationPolicy: 'auto_1y' },
        }),
      },
    };
  }

  /**
   * Fuerza la rotación inmediata de una clave (para uso administrativo)
   */
  async forceRotateKey(
    id: number,
    reason: string = 'Forced rotation by administrator',
  ): Promise<any> {
    this.logger.log(`Forcing rotation of key ${id}: ${reason}`);
    return this.rotateKey(id, reason);
  }

  /**
   * Valida si una clave necesita rotación
   */
  async validateKeyRotation(id: number): Promise<{
    needsRotation: boolean;
    reason: string;
    recommendedAction: string;
  }> {
    const apiKey = await this.prisma.aPIKey.findUnique({
      where: { id },
    });

    if (!apiKey) {
      throw new Error(`API key with ID ${id} not found`);
    }

    // Verificar si está expirada
    if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()) {
      return {
        needsRotation: true,
        reason: 'Key is expired',
        recommendedAction: 'Immediate rotation required',
      };
    }

    // Verificar política de rotación
    if (apiKey.rotationPolicy === 'manual') {
      return {
        needsRotation: false,
        reason: 'Manual rotation policy',
        recommendedAction: 'Rotate when needed',
      };
    }

    // Verificar tiempo desde última rotación
    const now = new Date();
    const lastRotated = apiKey.lastRotated || apiKey.createdAt;
    const daysSinceRotation = Math.floor(
      (now.getTime() - lastRotated.getTime()) / (1000 * 60 * 60 * 24),
    );

    let threshold = 0;
    switch (apiKey.rotationPolicy) {
      case 'auto_30d':
        threshold = 30;
        break;
      case 'auto_90d':
        threshold = 90;
        break;
      case 'auto_1y':
        threshold = 365;
        break;
    }

    if (daysSinceRotation >= threshold) {
      return {
        needsRotation: true,
        reason: `Key is ${daysSinceRotation} days old, policy requires rotation every ${threshold} days`,
        recommendedAction: 'Schedule rotation',
      };
    }

    return {
      needsRotation: false,
      reason: `Key is ${daysSinceRotation} days old, next rotation in ${threshold - daysSinceRotation} days`,
      recommendedAction: 'No action needed',
    };
  }
}
