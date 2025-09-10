import { Injectable } from '@nestjs/common';
import { BankApiInterface, PaymentValidation, BankInfo } from '../../payments/interfaces/bank-api.interface';

@Injectable()
export class ProvincialApi implements BankApiInterface {
  async verifyPayment(referenceNumber: string): Promise<PaymentValidation> {
    // Simular consulta a API bancaria - Provincial tiene buena tasa (92%)
    const isConfirmed = Math.random() > 0.08; // 92% de éxito

    if (isConfirmed) {
      const simulatedAmount = parseInt(referenceNumber.slice(-4)) / 100;

      return {
        confirmed: true,
        transactionId: `PROV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        amount: simulatedAmount,
        timestamp: new Date(),
        bankCode: '0108'
      };
    } else {
      return {
        confirmed: false,
        message: 'Pago pendiente de confirmación en Provincial',
        bankCode: '0108'
      };
    }
  }

  getBankInfo(): BankInfo {
    return {
      code: '0108',
      name: 'Banco Provincial',
      methods: ['transfer', 'pago_movil']
    };
  }
}
