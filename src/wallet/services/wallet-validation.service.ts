import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Logger } from '@nestjs/common';

@Injectable()
export class WalletValidationService {
  private readonly logger = new Logger(WalletValidationService.name);

  // Límites de transacción
  private readonly MAX_DAILY_LIMIT = 1000;
  private readonly MAX_SINGLE_TRANSACTION = 500;
  private readonly MAX_TRANSFER_LIMIT = 200;

  constructor(private readonly prisma: PrismaService) {}

  async validateAddFunds(userId: number, amount: number): Promise<void> {
    this.logger.log(
      `🔍 Validando adición de fondos: Usuario ${userId}, Monto: ${amount}`,
    );

    // Validar usuario existe y está activo
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, isActive: true, name: true },
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
    }

    if (!user.isActive) {
      throw new BadRequestException('Usuario inactivo');
    }

    // Validar límites diarios
    const dailyTotal = await this.getDailyTransactionTotal(userId);
    if (dailyTotal + amount > this.MAX_DAILY_LIMIT) {
      throw new BadRequestException(
        `Límite diario excedido. Usado: ${dailyTotal}, Límite: ${this.MAX_DAILY_LIMIT}, Intento: ${amount}`,
      );
    }

    // Validar límite de transacción única
    if (amount > this.MAX_SINGLE_TRANSACTION) {
      throw new BadRequestException(
        `Monto excede el límite de transacción única. Máximo: ${this.MAX_SINGLE_TRANSACTION}, Intento: ${amount}`,
      );
    }

    this.logger.log(
      `✅ Validación de adición de fondos exitosa: Usuario ${userId}`,
    );
  }

  async validateTransfer(
    fromUserId: number,
    toUserId: number,
    amount: number,
  ): Promise<void> {
    this.logger.log(
      `🔍 Validando transferencia: De ${fromUserId} a ${toUserId}, Monto: ${amount}`,
    );

    // Validar que no es transferencia a sí mismo
    if (fromUserId === toUserId) {
      throw new BadRequestException('No puedes transferir a ti mismo');
    }

    // Validar que el destinatario existe
    const toUser = await this.prisma.user.findUnique({
      where: { id: toUserId },
      select: { id: true, isActive: true, name: true },
    });

    if (!toUser) {
      throw new NotFoundException(
        `Usuario destinatario con ID ${toUserId} no encontrado`,
      );
    }

    if (!toUser.isActive) {
      throw new BadRequestException('Usuario destinatario inactivo');
    }

    // Validar límite de transferencia
    if (amount > this.MAX_TRANSFER_LIMIT) {
      throw new BadRequestException(
        `Monto excede el límite de transferencia. Máximo: ${this.MAX_TRANSFER_LIMIT}, Intento: ${amount}`,
      );
    }

    // Validar que el remitente tiene fondos suficientes
    const fromWallet = await this.prisma.wallet.findUnique({
      where: { userId: fromUserId },
      select: { balance: true },
    });

    if (!fromWallet) {
      throw new NotFoundException('Wallet del remitente no encontrada');
    }

    if (Number(fromWallet.balance) < amount) {
      throw new BadRequestException(
        `Fondos insuficientes. Disponible: ${fromWallet.balance}, Requerido: ${amount}`,
      );
    }

    this.logger.log(
      `✅ Validación de transferencia exitosa: De ${fromUserId} a ${toUserId}`,
    );
  }

  async validateDeductFunds(userId: number, amount: number): Promise<void> {
    this.logger.log(
      `🔍 Validando deducción de fondos: Usuario ${userId}, Monto: ${amount}`,
    );

    // Validar usuario existe
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, isActive: true },
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
    }

    if (!user.isActive) {
      throw new BadRequestException('Usuario inactivo');
    }

    // Validar que la wallet existe y tiene fondos suficientes
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
      select: { balance: true },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet no encontrada');
    }

    if (Number(wallet.balance) < amount) {
      throw new BadRequestException(
        `Fondos insuficientes. Disponible: ${wallet.balance}, Requerido: ${amount}`,
      );
    }

    this.logger.log(`✅ Validación de deducción exitosa: Usuario ${userId}`);
  }

  async validateOperation(
    userId: number,
    operation: string,
    amount: number,
    toUserId?: number,
  ): Promise<{
    valid: boolean;
    message: string;
    limits: any;
  }> {
    try {
      switch (operation) {
        case 'add_funds':
          await this.validateAddFunds(userId, amount);
          break;
        case 'transfer':
          if (!toUserId) {
            throw new BadRequestException(
              'toUserId es requerido para transferencias',
            );
          }
          await this.validateTransfer(userId, toUserId, amount);
          break;
        case 'deduct':
          await this.validateDeductFunds(userId, amount);
          break;
        default:
          throw new BadRequestException(`Operación no válida: ${operation}`);
      }

      const dailyUsed = await this.getDailyTransactionTotal(userId);
      const limits = {
        dailyLimit: this.MAX_DAILY_LIMIT,
        singleTransactionLimit: this.MAX_SINGLE_TRANSACTION,
        transferLimit: this.MAX_TRANSFER_LIMIT,
        usedToday: dailyUsed,
        remainingToday: this.MAX_DAILY_LIMIT - dailyUsed,
      };

      return {
        valid: true,
        message: 'Operación válida',
        limits,
      };
    } catch (error) {
      return {
        valid: false,
        message: error.message,
        limits: {
          dailyLimit: this.MAX_DAILY_LIMIT,
          singleTransactionLimit: this.MAX_SINGLE_TRANSACTION,
          transferLimit: this.MAX_TRANSFER_LIMIT,
          usedToday: await this.getDailyTransactionTotal(userId),
          remainingToday:
            this.MAX_DAILY_LIMIT -
            (await this.getDailyTransactionTotal(userId)),
        },
      };
    }
  }

  private async getDailyTransactionTotal(userId: number): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!wallet) {
      return 0;
    }

    const transactions = await this.prisma.walletTransaction.findMany({
      where: {
        walletId: wallet.id,
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
        amount: {
          gt: 0, // Solo transacciones positivas (créditos)
        },
      },
      select: { amount: true },
    });

    return transactions.reduce(
      (total, transaction) => total + Number(transaction.amount),
      0,
    );
  }

  getLimits() {
    return {
      dailyLimit: this.MAX_DAILY_LIMIT,
      singleTransactionLimit: this.MAX_SINGLE_TRANSACTION,
      transferLimit: this.MAX_TRANSFER_LIMIT,
    };
  }
}
