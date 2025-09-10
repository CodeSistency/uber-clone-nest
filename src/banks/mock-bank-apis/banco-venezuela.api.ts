import { Injectable } from '@nestjs/common';
import { BankApiInterface, PaymentValidation, BankInfo } from '../../payments/interfaces/bank-api.interface';

@Injectable()
export class BancoVenezuelaApi implements BankApiInterface {
  async verifyPayment(referenceNumber: string): Promise<PaymentValidation> {
    // Simular consulta a API bancaria
    // En desarrollo: 90% de éxito, en producción consultar API real
    const isConfirmed = Math.random() > 0.1; // 90% de éxito

    if (isConfirmed) {
      // Simular monto basado en la referencia (últimos 4 dígitos / 100)
      const simulatedAmount = parseInt(referenceNumber.slice(-4)) / 100;

      return {
        confirmed: true,
        transactionId: `BV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        amount: simulatedAmount,
        timestamp: new Date(),
        bankCode: '0102'
      };
    } else {
      return {
        confirmed: false,
        message: 'Pago no encontrado o aún en proceso de validación',
        bankCode: '0102'
      };
    }
  }

  getBankInfo(): BankInfo {
    return {
      code: '0102',
      name: 'Banco de Venezuela',
      methods: ['transfer', 'pago_movil']
    };
  }
}
