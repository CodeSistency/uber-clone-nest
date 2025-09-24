import { Injectable } from '@nestjs/common';
import {
  BankApiInterface,
  PaymentValidation,
  BankInfo,
} from '../../payments/interfaces/bank-api.interface';

@Injectable()
export class BNCApi implements BankApiInterface {
  async verifyPayment(referenceNumber: string): Promise<PaymentValidation> {
    // Simular consulta a API bancaria - BNC tiene tasa media (85%)
    const isConfirmed = Math.random() > 0.15; // 85% de éxito

    if (isConfirmed) {
      const simulatedAmount = parseInt(referenceNumber.slice(-4)) / 100;

      return {
        confirmed: true,
        transactionId: `BNC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        amount: simulatedAmount,
        timestamp: new Date(),
        bankCode: '0196',
      };
    } else {
      return {
        confirmed: false,
        message: 'Transacción no localizada en BNC',
        bankCode: '0196',
      };
    }
  }

  getBankInfo(): BankInfo {
    return {
      code: '0196',
      name: 'BNC (Banco Nacional de Crédito)',
      methods: ['transfer'], // Solo transferencias, sin pago móvil
    };
  }
}
