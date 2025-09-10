import { Injectable } from '@nestjs/common';
import { BankApiInterface, PaymentValidation, BankInfo } from '../../payments/interfaces/bank-api.interface';

@Injectable()
export class MercantilApi implements BankApiInterface {
  async verifyPayment(referenceNumber: string): Promise<PaymentValidation> {
    // Simular consulta a API bancaria - Mercantil tiene mejor tasa de éxito (95%)
    const isConfirmed = Math.random() > 0.05; // 95% de éxito

    if (isConfirmed) {
      const simulatedAmount = parseInt(referenceNumber.slice(-4)) / 100;

      return {
        confirmed: true,
        transactionId: `MERC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        amount: simulatedAmount,
        timestamp: new Date(),
        bankCode: '0105'
      };
    } else {
      return {
        confirmed: false,
        message: 'Referencia no encontrada en el sistema Mercantil',
        bankCode: '0105'
      };
    }
  }

  getBankInfo(): BankInfo {
    return {
      code: '0105',
      name: 'Banco Mercantil',
      methods: ['transfer', 'pago_movil']
    };
  }
}
