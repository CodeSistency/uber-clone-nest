import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class DefineRideDto {
  @ApiProperty({
    description: 'Dirección completa del punto de recogida del pasajero',
    example: 'Calle 123 #45-67, Bogotá, Colombia',
    minLength: 10,
    maxLength: 255,
    type: 'string'
  })
  @IsNotEmpty()
  @IsString()
  originAddress: string;

  @ApiProperty({
    description: 'Latitud del punto de recogida (coordenadas GPS)',
    example: 4.6097,
    minimum: -90,
    maximum: 90,
    type: 'number',
    format: 'float'
  })
  @IsNumber()
  @Min(-90)
  @Max(90)
  @Type(() => Number)
  originLat: number;

  @ApiProperty({
    description: 'Longitud del punto de recogida (coordenadas GPS)',
    example: -74.0817,
    minimum: -180,
    maximum: 180,
    type: 'number',
    format: 'float'
  })
  @IsNumber()
  @Min(-180)
  @Max(180)
  @Type(() => Number)
  originLng: number;

  @ApiProperty({
    description: 'Dirección completa del destino del viaje',
    example: 'Carrera 7 #23-45, Medellín, Colombia',
    minLength: 10,
    maxLength: 255,
    type: 'string'
  })
  @IsNotEmpty()
  @IsString()
  destinationAddress: string;

  @ApiProperty({
    description: 'Latitud del punto de destino (coordenadas GPS)',
    example: 6.2518,
    minimum: -90,
    maximum: 90,
    type: 'number',
    format: 'float'
  })
  @IsNumber()
  @Min(-90)
  @Max(90)
  @Type(() => Number)
  destinationLat: number;

  @ApiProperty({
    description: 'Longitud del punto de destino (coordenadas GPS)',
    example: -75.5636,
    minimum: -180,
    maximum: 180,
    type: 'number',
    format: 'float'
  })
  @IsNumber()
  @Min(-180)
  @Max(180)
  @Type(() => Number)
  destinationLng: number;

  @ApiProperty({
    description: 'Tiempo estimado del viaje en minutos',
    example: 25,
    minimum: 1,
    maximum: 300,
    type: 'number'
  })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  minutes: number;

  @ApiPropertyOptional({
    description: 'ID del nivel de servicio (tier) solicitado. Si no se especifica, se asignará automáticamente.',
    example: 1,
    minimum: 1,
    type: 'number',
    enum: [1, 2, 3] // Ejemplo de tiers disponibles
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  tierId?: number;

  @ApiPropertyOptional({
    description: 'ID del tipo de vehículo solicitado. Si no se especifica, se asignará automáticamente.',
    example: 1,
    minimum: 1,
    type: 'number',
    enum: [1, 2, 3, 4] // 1=Carro, 2=Moto, 3=Bicicleta, 4=Camión
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  vehicleTypeId?: number;
}

export class ConfirmRidePaymentDto {
  @ApiProperty({
    description: 'Método de pago venezolano para el viaje',
    example: 'transfer',
    enum: ['cash', 'transfer', 'pago_movil', 'zelle', 'bitcoin'],
    enumName: 'VenezuelanPaymentMethod'
  })
  @IsIn(['cash', 'transfer', 'pago_movil', 'zelle', 'bitcoin'])
  method: 'cash' | 'transfer' | 'pago_movil' | 'zelle' | 'bitcoin';

  @ApiPropertyOptional({
    description: 'Código del banco venezolano (requerido para transfer y pago_movil)',
    example: '0102',
    minLength: 4,
    maxLength: 4,
    enum: ['0102', '0105', '0196', '0108'] // Banco Venezuela, Mercantil, BNC, Provincial
  })
  @IsOptional()
  @IsString()
  @Length(4, 4)
  bankCode?: string;
}

export class SelectVehicleDto {
  @ApiPropertyOptional({
    description: 'ID del nivel de servicio (tier) a seleccionar. Si no se especifica, mantiene el valor actual.',
    example: 1,
    minimum: 1,
    type: 'number',
    enum: [1, 2, 3],
    required: false,
    nullable: true
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  tierId?: number | null;

  @ApiPropertyOptional({
    description: 'ID del tipo de vehículo a seleccionar. Si no se especifica, mantiene el valor actual.',
    example: 1,
    minimum: 1,
    type: 'number',
    enum: [1, 2, 3, 4],
    required: false,
    nullable: true
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  vehicleTypeId?: number | null;
}

export class SetDriverAvailabilityDto {
  @ApiProperty({
    description: 'Estado de disponibilidad del conductor',
    example: 'online',
    enum: ['online', 'offline', 'busy'],
    type: 'string'
  })
  @IsIn(['online', 'offline', 'busy'])
  status: 'online' | 'offline' | 'busy';
}

export class RateRideFlowDto {
  @ApiProperty({
    description: 'Calificación del viaje del 1 al 5',
    example: 5,
    minimum: 1,
    maximum: 5,
    type: 'number'
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  rating: number;

  @ApiPropertyOptional({
    description: 'Comentario opcional sobre la experiencia del viaje',
    example: 'Excelente conductor, muy amable y puntual',
    maxLength: 500,
    type: 'string'
  })
  @IsOptional()
  @IsString()
  @Max(500)
  comment?: string;
}


