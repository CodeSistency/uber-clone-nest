import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { BanksService } from '../banks/banks.service';
import {
  GenerateReferenceDto,
  InitiateMultiplePaymentsDto,
  ConfirmPartialPaymentDto,
  PaymentGroupStatusDto,
} from './dto/generate-reference.dto';
import { ConfirmReferenceDto } from './dto/confirm-reference.dto';
import { PaymentReference } from './entities/payment-reference.entity';
import { PaymentValidation } from './interfaces/bank-api.interface';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly banksService: BanksService,
  ) {}

  private convertPrismaToPaymentReference(
    prismaReference: any,
  ): PaymentReference {
    return {
      ...prismaReference,
      amount: Number(prismaReference.amount),
      serviceType: prismaReference.serviceType as
        | 'ride'
        | 'delivery'
        | 'errand'
        | 'parcel',
    };
  }

  async generateBankReference(
    dto: GenerateReferenceDto,
  ): Promise<PaymentReference> {
    this.logger.log(
      `🔄 Generando referencia bancaria para ${dto.serviceType} ${dto.serviceId}`,
    );

    // Generar número de referencia único
    const referenceNumber = this.generateReferenceNumber();
    this.logger.log(`📄 Referencia generada: ${referenceNumber}`);

    // Calcular fecha de expiración (24 horas por defecto)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Validar código de banco si se proporciona
    if (
      dto.bankCode &&
      !(await this.banksService.validateBankCode(dto.bankCode))
    ) {
      throw new Error(`Código de banco inválido: ${dto.bankCode}`);
    }

    // Crear registro en BD
    const reference = await this.prisma.paymentReference.create({
      data: {
        referenceNumber,
        bankCode: dto.bankCode ?? '0102', // Default Banco de Venezuela
        amount: dto.amount,
        currency: 'VES',
        userId: dto.userId,
        serviceType: dto.serviceType,
        serviceId: dto.serviceId,
        paymentMethod: dto.paymentMethod ?? 'transfer',
        isPartial: dto.isPartial || false,
        groupId: dto.groupId,
        expiresAt,
        status: 'pending',
      },
    });

    this.logger.log(`✅ Referencia creada exitosamente: ${reference.id}`);

    // Notificar al usuario
    try {
      await this.notificationsService.sendNotification({
        userId: dto.userId.toString(),
        type: 'payment_reference_generated',
        title: 'Referencia de Pago Generada',
        message: `Referencia: ${referenceNumber}. Monto: ${dto.amount} VES. Expira: ${expiresAt.toLocaleString()}`,
        data: {
          referenceNumber,
          amount: dto.amount,
          expiresAt,
          bankCode: reference.bankCode,
          paymentMethod: dto.paymentMethod,
        },
        channels: ['push', 'sms'],
      } as any);
    } catch (error) {
      this.logger.error(`❌ Error enviando notificación:`, error);
    }

    return this.convertPrismaToPaymentReference(reference);
  }

  async confirmBankReference(
    dto: ConfirmReferenceDto,
    userId: number,
  ): Promise<any> {
    this.logger.log(
      `🔍 Confirmando referencia bancaria: ${dto.referenceNumber}`,
    );

    // Buscar la referencia
    const reference = await this.prisma.paymentReference.findUnique({
      where: { referenceNumber: dto.referenceNumber },
    });

    if (!reference) {
      throw new Error(`Referencia no encontrada: ${dto.referenceNumber}`);
    }

    if (reference.userId !== userId) {
      throw new Error('Esta referencia no pertenece al usuario actual');
    }

    if (reference.status !== 'pending') {
      throw new Error(
        `Referencia ya procesada con estado: ${reference.status}`,
      );
    }

    if (reference.expiresAt < new Date()) {
      // Marcar como expirada
      await this.prisma.paymentReference.update({
        where: { referenceNumber: dto.referenceNumber },
        data: { status: 'expired' },
      });
      throw new Error('La referencia ha expirado');
    }

    // Usar bankCode del DTO o de la referencia almacenada
    const bankCodeToUse = dto.bankCode || reference.bankCode;
    this.logger.log(
      `🏦 Consultando banco ${bankCodeToUse} para referencia ${dto.referenceNumber}`,
    );

    // Consultar al banco simulado
    const bankApi = this.banksService.getBankApi(bankCodeToUse);
    const validation: PaymentValidation = await bankApi.verifyPayment(
      dto.referenceNumber,
    );

    if (validation.confirmed) {
      this.logger.log(
        `✅ Pago confirmado por banco. Monto: ${validation.amount}`,
      );

      // Actualizar referencia como confirmada
      await this.prisma.paymentReference.update({
        where: { referenceNumber: dto.referenceNumber },
        data: {
          status: 'confirmed',
          confirmedAt: new Date(),
        },
      });

      // Crear registro de transacción bancaria
      await this.prisma.bankTransaction.create({
        data: {
          paymentReferenceId: reference.id,
          bankTransactionId: validation.transactionId!,
          confirmedAmount: validation.amount!,
          bankResponse: JSON.parse(JSON.stringify(validation)),
          confirmationTimestamp: validation.timestamp!,
        },
      });

      // Actualizar el servicio correspondiente
      await this.updateServicePaymentStatus(
        this.convertPrismaToPaymentReference(reference),
      );

      // Notificar confirmación exitosa
      await this.notificationsService.sendNotification({
        userId: userId.toString(),
        type: 'payment_confirmed',
        title: 'Pago Confirmado',
        message: `Su pago de ${validation.amount} VES ha sido confirmado exitosamente`,
        data: {
          referenceNumber: dto.referenceNumber,
          amount: validation.amount,
          transactionId: validation.transactionId,
        },
        channels: ['push', 'sms'],
      } as any);

      return {
        success: true,
        message: 'Pago confirmado exitosamente',
        reference: reference,
        transaction: validation,
      };
    } else {
      this.logger.log(`❌ Pago no confirmado por banco: ${validation.message}`);

      return {
        success: false,
        message: validation.message || 'Pago no encontrado o en proceso',
        reference: reference,
      };
    }
  }

  async getReferenceStatus(
    referenceNumber: string,
    userId: number,
  ): Promise<PaymentReference> {
    const reference = await this.prisma.paymentReference.findUnique({
      where: { referenceNumber },
    });

    if (!reference) {
      throw new Error('Referencia no encontrada');
    }

    if (reference.userId !== userId) {
      throw new Error('Esta referencia no pertenece al usuario actual');
    }

    return this.convertPrismaToPaymentReference(reference);
  }

  async getUserPaymentReferences(userId: number): Promise<PaymentReference[]> {
    const references = await this.prisma.paymentReference.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return references.map((ref) => this.convertPrismaToPaymentReference(ref));
  }

  getSupportedBanks() {
    return this.banksService.getSupportedBanks();
  }

  getPaymentInstructions(
    paymentMethod: string,
    referenceNumber: string,
  ): string {
    const instructions = {
      transfer: `
Para completar el pago:

1. Abre la app de tu banco
2. Ve a "Transferencias" o "Pagos"
3. Selecciona "Pago de servicios" o "Transferencia a terceros"
4. Ingresa la referencia: ${referenceNumber}
5. Confirma el monto y realiza el pago
6. Regresa aquí y confirma que realizaste el pago
      `,
      pago_movil: `
Para completar el pago:

1. Abre la app de tu banco
2. Ve a "Pago Móvil" o "Transferencias P2P"
3. Escanea el código QR o ingresa la referencia: ${referenceNumber}
4. Confirma el monto y realiza el pago
5. Regresa aquí y confirma que realizaste el pago
      `,
      zelle: `
Para completar el pago:

1. Abre Zelle en tu app bancaria
2. Busca el destinatario usando la referencia: ${referenceNumber}
3. Ingresa el monto exacto
4. Confirma la transacción
5. Regresa aquí y confirma que realizaste el pago
      `,
      bitcoin: `
Para completar el pago:

1. Abre tu wallet de Bitcoin
2. Usa la referencia como dirección: ${referenceNumber}
3. Envía el monto exacto en BTC
4. Espera la confirmación en la blockchain
5. Regresa aquí y confirma que realizaste el pago
      `,
    };

    return (
      instructions[paymentMethod as keyof typeof instructions] ||
      instructions.transfer
    );
  }

  private generateReferenceNumber(): string {
    // Generar referencia de 20 dígitos
    // Formato: timestamp(6) + random(14)
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString().slice(2, 14);
    return (timestamp + random).padStart(20, '0');
  }

  private async updateServicePaymentStatus(
    reference: PaymentReference,
  ): Promise<void> {
    this.logger.log(
      `🔄 Actualizando status de pago para ${reference.serviceType} ${reference.serviceId}`,
    );

    switch (reference.serviceType) {
      case 'ride':
        await this.prisma.ride.update({
          where: { rideId: reference.serviceId },
          data: { paymentStatus: 'paid' },
        });
        break;

      case 'delivery':
        await this.prisma.deliveryOrder.update({
          where: { orderId: reference.serviceId },
          data: { paymentStatus: 'paid' },
        });
        break;

      case 'errand':
        // Para errand, actualizar el estado en el servicio correspondiente
        // Esto puede requerir acceso al ErrandService
        this.logger.warn(
          `Actualización de errand no implementada aún: ${reference.serviceId}`,
        );
        break;

      case 'parcel':
        // Para parcel, actualizar el estado en el servicio correspondiente
        // Esto puede requerir acceso al ParcelService
        this.logger.warn(
          `Actualización de parcel no implementada aún: ${reference.serviceId}`,
        );
        break;

      default:
        this.logger.error(
          `Tipo de servicio desconocido: ${reference.serviceType}`,
        );
    }
  }

  // =========================================
  // MULTIPLE PAYMENT METHODS SYSTEM
  // =========================================

  /**
   * Inicia un grupo de pagos múltiples
   */
  async initiateMultiplePayments(
    dto: InitiateMultiplePaymentsDto,
  ): Promise<any> {
    this.logger.log(
      `🔄 Iniciando pagos múltiples para ${dto.serviceType} ${dto.serviceId}`,
    );

    // Generar UUID para el grupo
    const groupId = require('crypto').randomUUID();

    // Calcular fecha de expiración del grupo (24 horas)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Crear el grupo de pagos
    const paymentGroup = await this.prisma.paymentGroup.create({
      data: {
        id: groupId,
        userId: dto.userId, // Asumiendo que se agrega userId al DTO
        serviceType: dto.serviceType,
        serviceId: dto.serviceId,
        totalAmount: dto.totalAmount,
        remainingAmount: dto.totalAmount,
        expiresAt,
      },
    });

    // Generar referencias para cada método de pago
    const paymentReferences: PaymentReference[] = [];
    for (const payment of dto.payments) {
      if (payment.method === 'cash') {
        // Para efectivo, no generar referencia, solo registrar el monto
        continue;
      }

      const reference = await this.generateBankReference({
        serviceType: dto.serviceType,
        serviceId: dto.serviceId,
        amount: payment.amount,
        paymentMethod: payment.method,
        bankCode: payment.bankCode,
        userId: dto.userId,
        isPartial: true,
        groupId: groupId,
      });

      paymentReferences.push(reference);
    }

    // Actualizar el grupo con las referencias creadas
    const totalElectronicAmount = paymentReferences.reduce(
      (sum, ref) => sum + Number(ref.amount),
      0,
    );
    const cashAmount = dto.totalAmount - totalElectronicAmount;

    await this.prisma.paymentGroup.update({
      where: { id: groupId },
      data: {
        paidAmount: 0,
        remainingAmount: dto.totalAmount,
      },
    });

    this.logger.log(`✅ Grupo de pagos múltiples creado: ${groupId}`);

    return {
      groupId,
      totalAmount: dto.totalAmount,
      electronicPayments: paymentReferences.length,
      cashAmount: cashAmount > 0 ? cashAmount : 0,
      references: paymentReferences,
      expiresAt,
      instructions:
        'Realiza los pagos electrónicos y confirma cada uno individualmente',
    };
  }

  /**
   * Confirma un pago parcial dentro de un grupo
   */
  async confirmPartialPayment(
    dto: ConfirmPartialPaymentDto,
    userId: number,
  ): Promise<any> {
    this.logger.log(`🔄 Confirmando pago parcial: ${dto.referenceNumber}`);

    // Buscar la referencia
    const reference = await this.prisma.paymentReference.findUnique({
      where: { referenceNumber: dto.referenceNumber },
      include: { paymentGroup: true },
    });

    if (!reference) {
      throw new Error('Referencia no encontrada');
    }

    if (reference.userId !== userId) {
      throw new Error('Esta referencia no pertenece al usuario actual');
    }

    if (!reference.groupId || !reference.isPartial) {
      throw new Error(
        'Esta referencia no pertenece a un grupo de pagos múltiples',
      );
    }

    // Confirmar el pago individual
    const confirmationResult = await this.confirmBankReference(
      {
        referenceNumber: dto.referenceNumber,
        bankCode: dto.bankCode || reference.bankCode,
      },
      userId,
    );

    if (confirmationResult.success) {
      // Actualizar el grupo de pagos
      const paymentGroup = await this.prisma.paymentGroup.findUnique({
        where: { id: reference.groupId },
        include: { paymentReferences: true },
      });

      if (paymentGroup) {
        const totalPaid = paymentGroup.paymentReferences
          .filter((ref) => ref.status === 'confirmed')
          .reduce((sum, ref) => sum + Number(ref.amount), 0);

        const remainingAmount = Number(paymentGroup.totalAmount) - totalPaid;

        // Actualizar estado del grupo
        const newStatus = remainingAmount <= 0 ? 'complete' : 'incomplete';

        await this.prisma.paymentGroup.update({
          where: { id: reference.groupId },
          data: {
            paidAmount: totalPaid,
            remainingAmount: Math.max(0, remainingAmount),
            status: newStatus,
            completedAt: newStatus === 'complete' ? new Date() : null,
          },
        });

        // Si el grupo está completo, actualizar el servicio correspondiente
        if (newStatus === 'complete') {
          await this.updateServicePaymentStatus(
            this.convertPrismaToPaymentReference(reference),
          );
        }
      }
    }

    return {
      ...confirmationResult,
      groupId: reference.groupId,
      isPartial: true,
    };
  }

  /**
   * Obtiene el estado de un grupo de pagos
   */
  async getPaymentGroupStatus(
    dto: PaymentGroupStatusDto,
    userId: number,
  ): Promise<any> {
    this.logger.log(`🔍 Consultando estado del grupo: ${dto.groupId}`);

    const paymentGroup = await this.prisma.paymentGroup.findUnique({
      where: { id: dto.groupId },
      include: {
        paymentReferences: {
          orderBy: { createdAt: 'asc' },
        },
        user: true,
      },
    });

    if (!paymentGroup) {
      throw new Error('Grupo de pagos no encontrado');
    }

    if (paymentGroup.userId !== userId) {
      throw new Error('Este grupo de pagos no pertenece al usuario actual');
    }

    // Calcular estadísticas
    const totalReferences = paymentGroup.paymentReferences.length;
    const confirmedReferences = paymentGroup.paymentReferences.filter(
      (ref) => ref.status === 'confirmed',
    ).length;
    const pendingReferences = paymentGroup.paymentReferences.filter(
      (ref) => ref.status === 'pending',
    ).length;
    const expiredReferences = paymentGroup.paymentReferences.filter(
      (ref) => ref.status === 'expired',
    ).length;

    return {
      groupId: paymentGroup.id,
      serviceType: paymentGroup.serviceType,
      serviceId: paymentGroup.serviceId,
      totalAmount: paymentGroup.totalAmount,
      paidAmount: paymentGroup.paidAmount,
      remainingAmount: paymentGroup.remainingAmount,
      status: paymentGroup.status,
      expiresAt: paymentGroup.expiresAt,
      completedAt: paymentGroup.completedAt,
      createdAt: paymentGroup.createdAt,

      // Estadísticas detalladas
      statistics: {
        totalReferences,
        confirmedReferences,
        pendingReferences,
        expiredReferences,
        confirmationRate:
          totalReferences > 0
            ? (confirmedReferences / totalReferences) * 100
            : 0,
      },

      // Detalles de cada pago
      payments: paymentGroup.paymentReferences.map((ref) => ({
        id: ref.id,
        referenceNumber: ref.referenceNumber,
        amount: ref.amount,
        method: ref.paymentMethod,
        status: ref.status,
        bankCode: ref.bankCode,
        createdAt: ref.createdAt,
        confirmedAt: ref.confirmedAt,
      })),
    };
  }

  /**
   * Cancela un grupo de pagos pendientes
   */
  async cancelPaymentGroup(groupId: string, userId: number): Promise<any> {
    this.logger.log(`🚫 Cancelando grupo de pagos: ${groupId}`);

    const paymentGroup = await this.prisma.paymentGroup.findUnique({
      where: { id: groupId },
      include: { paymentReferences: true },
    });

    if (!paymentGroup) {
      throw new Error('Grupo de pagos no encontrado');
    }

    if (paymentGroup.userId !== userId) {
      throw new Error('Este grupo de pagos no pertenece al usuario actual');
    }

    if (paymentGroup.status === 'complete') {
      throw new Error('No se puede cancelar un grupo de pagos completado');
    }

    // Cancelar todas las referencias pendientes
    await this.prisma.paymentReference.updateMany({
      where: {
        groupId: groupId,
        status: 'pending',
      },
      data: {
        status: 'expired',
      },
    });

    // Actualizar el grupo como cancelado
    await this.prisma.paymentGroup.update({
      where: { id: groupId },
      data: {
        status: 'cancelled',
      },
    });

    this.logger.log(`✅ Grupo de pagos cancelado: ${groupId}`);

    return {
      groupId,
      status: 'cancelled',
      message: 'Grupo de pagos cancelado exitosamente',
    };
  }
}
