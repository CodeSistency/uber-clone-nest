import { ApiProperty } from '@nestjs/swagger';

export class BankTransaction {
  @ApiProperty({
    description: 'ID único de la transacción',
    example: 1
  })
  id: number;

  @ApiProperty({
    description: 'ID de la referencia de pago relacionada',
    example: 1
  })
  paymentReferenceId: number;

  @ApiProperty({
    description: 'ID de transacción del banco',
    example: 'BV-1725979200000'
  })
  bankTransactionId: string;

  @ApiProperty({
    description: 'Respuesta completa del banco',
    example: {
      confirmed: true,
      transactionId: 'BV-1725979200000',
      amount: 25.50,
      timestamp: '2025-09-10T14:30:00.000Z'
    }
  })
  bankResponse: any;

  @ApiProperty({
    description: 'Monto confirmado por el banco',
    example: 25.50
  })
  confirmedAmount: number;

  @ApiProperty({
    description: 'Timestamp de confirmación del banco',
    example: '2025-09-10T14:30:00.000Z'
  })
  confirmationTimestamp: Date;

  @ApiProperty({
    description: 'Fecha de creación del registro',
    example: '2025-09-10T14:30:00.000Z'
  })
  createdAt: Date;
}
