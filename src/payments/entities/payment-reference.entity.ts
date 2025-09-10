import { ApiProperty } from '@nestjs/swagger';

export class PaymentReference {
  @ApiProperty({
    description: 'ID único de la referencia',
    example: 1
  })
  id: number;

  @ApiProperty({
    description: 'Número de referencia bancaria de 20 dígitos',
    example: '12345678901234567890'
  })
  referenceNumber: string;

  @ApiProperty({
    description: 'Código del banco venezolano',
    example: '0102'
  })
  bankCode: string;

  @ApiProperty({
    description: 'Monto del pago',
    example: 25.50
  })
  amount: number;

  @ApiProperty({
    description: 'Moneda del pago',
    example: 'VES'
  })
  currency: string;

  @ApiProperty({
    description: 'ID del usuario',
    example: 1
  })
  userId: number;

  @ApiProperty({
    description: 'Tipo de servicio',
    example: 'ride',
    enum: ['ride', 'delivery', 'errand', 'parcel']
  })
  serviceType: 'ride' | 'delivery' | 'errand' | 'parcel';

  @ApiProperty({
    description: 'ID del servicio específico',
    example: 123
  })
  serviceId: number;

  @ApiProperty({
    description: 'Estado de la referencia',
    example: 'pending',
    enum: ['pending', 'confirmed', 'expired', 'failed']
  })
  status: 'pending' | 'confirmed' | 'expired' | 'failed';

  @ApiProperty({
    description: 'Fecha de expiración de la referencia',
    example: '2025-09-11T12:00:00.000Z'
  })
  expiresAt: Date;

  @ApiProperty({
    description: 'Fecha de confirmación del pago',
    example: '2025-09-10T14:30:00.000Z',
    required: false
  })
  confirmedAt?: Date;

  @ApiProperty({
    description: 'Fecha de creación',
    example: '2025-09-10T12:00:00.000Z'
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Fecha de última actualización',
    example: '2025-09-10T12:00:00.000Z'
  })
  updatedAt: Date;
}
