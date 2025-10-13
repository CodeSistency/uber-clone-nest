import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  Length,
  ValidateNested,
  IsBoolean,
  IsArray,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class DefineRideDto {
  @ApiProperty({
    description: 'Dirección completa del punto de recogida del pasajero',
    example: 'Calle 123 #45-67, Bogotá, Colombia',
    minLength: 10,
    maxLength: 255,
    type: 'string',
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
    format: 'float',
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
    format: 'float',
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
    type: 'string',
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
    format: 'float',
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
    format: 'float',
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
    type: 'number',
  })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  minutes: number;

  @ApiPropertyOptional({
    description:
      'ID del nivel de servicio (tier) solicitado. Si no se especifica, se asignará automáticamente.',
    example: 1,
    minimum: 1,
    type: 'number',
    enum: [1, 2, 3], // Ejemplo de tiers disponibles
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  tierId?: number;

  @ApiPropertyOptional({
    description:
      'ID del tipo de vehículo solicitado. Si no se especifica, se asignará automáticamente.',
    example: 1,
    minimum: 1,
    type: 'number',
    enum: [1, 2, 3, 4], // 1=Carro, 2=Moto, 3=Bicicleta, 4=Camión
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
    enum: ['cash', 'transfer', 'pago_movil', 'zelle', 'bitcoin', 'wallet'],
    enumName: 'VenezuelanPaymentMethod',
  })
  @IsIn(['cash', 'transfer', 'pago_movil', 'zelle', 'bitcoin', 'wallet'])
  method: 'cash' | 'transfer' | 'pago_movil' | 'zelle' | 'bitcoin' | 'wallet';

  @ApiPropertyOptional({
    description:
      'Código del banco venezolano (requerido para transfer y pago_movil)',
    example: '0102',
    minLength: 4,
    maxLength: 4,
    enum: ['0102', '0105', '0196', '0108'], // Banco Venezuela, Mercantil, BNC, Provincial
  })
  @IsOptional()
  @IsString()
  @Length(4, 4)
  bankCode?: string;
}

export class SelectVehicleDto {
  @ApiPropertyOptional({
    description:
      'ID del nivel de servicio (tier) a seleccionar. Si no se especifica, mantiene el valor actual.',
    example: 1,
    minimum: 1,
    type: 'number',
    enum: [1, 2, 3],
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  tierId?: number | null;

  @ApiPropertyOptional({
    description:
      'ID del tipo de vehículo a seleccionar. Si no se especifica, mantiene el valor actual.',
    example: 1,
    minimum: 1,
    type: 'number',
    enum: [1, 2, 3, 4],
    required: false,
    nullable: true,
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
    type: 'string',
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
    type: 'number',
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
    type: 'string',
  })
  @IsOptional()
  @IsString()
  @Max(500)
  comment?: string;
}

// === NUEVOS DTOS PARA MATCHING AUTOMÁTICO ===

export class MatchBestDriverDto {
  @ApiProperty({
    description: 'Latitud de la ubicación del cliente',
    example: 4.6097,
    minimum: -90,
    maximum: 90,
    type: 'number',
    format: 'float',
  })
  @IsNumber()
  @Min(-90)
  @Max(90)
  @Type(() => Number)
  lat: number;

  @ApiProperty({
    description: 'Longitud de la ubicación del cliente',
    example: -74.0817,
    minimum: -180,
    maximum: 180,
    type: 'number',
    format: 'float',
  })
  @IsNumber()
  @Min(-180)
  @Max(180)
  @Type(() => Number)
  lng: number;

  @ApiPropertyOptional({
    description: 'ID del nivel de servicio (tier) solicitado',
    example: 1,
    minimum: 1,
    type: 'number',
    enum: [1, 2, 3],
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  tierId?: number;

  @ApiPropertyOptional({
    description: 'ID del tipo de vehículo solicitado',
    example: 1,
    minimum: 1,
    type: 'number',
    enum: [1, 2, 3, 4],
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  vehicleTypeId?: number;

  @ApiPropertyOptional({
    description: 'Radio de búsqueda en kilómetros',
    example: 5,
    minimum: 0.1,
    maximum: 20,
    type: 'number',
    default: 5,
  })
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(20)
  @Type(() => Number)
  radiusKm?: number = 5;
}

// DTOs simplificados para evitar problemas de referencias circulares en Swagger
export class MatchedDriverDto {
  @ApiProperty({
    type: 'object',
    properties: {
      driverId: { type: 'number', example: 1 },
      firstName: { type: 'string', example: 'Carlos' },
      lastName: { type: 'string', example: 'Rodriguez' },
      profileImageUrl: { type: 'string', example: 'https://...' },
      rating: { type: 'number', example: 4.8 },
      totalRides: { type: 'number', example: 1250 },
      memberSince: { type: 'string', format: 'date-time' },
    },
  })
  driver: any;

  @ApiProperty({
    type: 'object',
    properties: {
      carModel: { type: 'string', example: 'Toyota Camry 2020' },
      licensePlate: { type: 'string', example: 'ABC-123' },
      carSeats: { type: 'number', example: 4 },
      vehicleType: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          name: { type: 'string', example: 'car' },
          displayName: { type: 'string', example: 'Carro' },
          icon: { type: 'string', example: '🚗' },
        },
      },
    },
  })
  vehicle: any;

  @ApiProperty({
    type: 'object',
    properties: {
      distance: {
        type: 'number',
        example: 1.2,
        description: 'Distancia en km',
      },
      estimatedArrival: {
        type: 'number',
        example: 5,
        description: 'Tiempo estimado en minutos',
      },
      currentLocation: {
        type: 'object',
        properties: {
          lat: { type: 'number', example: 4.6097 },
          lng: { type: 'number', example: -74.0817 },
        },
      },
    },
  })
  location: any;

  @ApiProperty({
    type: 'object',
    properties: {
      tierId: { type: 'number', example: 1 },
      tierName: { type: 'string', example: 'Premium' },
      estimatedFare: { type: 'number', example: 15.5 },
    },
  })
  pricing: any;

  @ApiProperty({
    example: 85.3,
    description: 'Puntuación del matching (0-100)',
  })
  matchScore: number;

  @ApiProperty({
    type: 'string',
    format: 'date-time',
    example: '2024-01-15T10:30:00.000Z',
  })
  matchedAt: Date;
}

export class ConfirmDriverDto {
  @ApiProperty({
    description: 'ID del conductor que el usuario confirma',
    example: 1,
    minimum: 1,
    type: 'number',
  })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  driverId: number;

  @ApiPropertyOptional({
    description: 'Notas adicionales del usuario para el conductor',
    example: 'Por favor llegue rápido, tengo prisa',
    maxLength: 200,
    type: 'string',
  })
  @IsOptional()
  @IsString()
  @Max(200)
  notes?: string;
}

export class DriverRideRequestDto {
  @ApiProperty({
    description: 'ID del viaje solicitado',
    example: 123,
    minimum: 1,
    type: 'number',
  })
  rideId: number;

  @ApiProperty({
    description: 'Información del pasajero',
    type: 'object',
    properties: {
      name: { type: 'string', example: 'Juan Pérez' },
      rating: { type: 'number', example: 4.9 },
    },
  })
  passenger: {
    name: string;
    rating: number;
  };

  @ApiProperty({
    description: 'Detalles del viaje',
    type: 'object',
    properties: {
      originAddress: { type: 'string', example: 'Calle 123, Bogotá' },
      destinationAddress: {
        type: 'string',
        example: 'Centro Comercial, Medellín',
      },
      distance: {
        type: 'number',
        example: 15.5,
        description: 'Distancia en km',
      },
      estimatedDuration: {
        type: 'number',
        example: 25,
        description: 'Duración estimada en minutos',
      },
      fareAmount: { type: 'number', example: 25.5 },
    },
  })
  ride: {
    originAddress: string;
    destinationAddress: string;
    distance: number;
    estimatedDuration: number;
    fareAmount: number;
  };

  @ApiProperty({
    description: 'Ubicación de recogida',
    type: 'object',
    properties: {
      lat: { type: 'number', example: 4.6097 },
      lng: { type: 'number', example: -74.0817 },
    },
  })
  pickupLocation: {
    lat: number;
    lng: number;
  };

  @ApiPropertyOptional({
    description: 'Notas del pasajero',
    example: 'Por favor llegue rápido',
    type: 'string',
  })
  notes?: string;

  @ApiProperty({
    description: 'Tiempo límite para responder (minutos)',
    example: 2,
    minimum: 1,
    type: 'number',
  })
  responseTimeoutMinutes: number = 2;

  @ApiProperty({
    description: 'Timestamp de la solicitud',
    type: 'string',
    format: 'date-time',
  })
  requestedAt: Date;
}

export class DriverResponseDto {
  @ApiProperty({
    description: 'Respuesta del conductor',
    example: 'accept',
    enum: ['accept', 'reject'],
    enumName: 'DriverResponse',
  })
  @IsIn(['accept', 'reject'])
  response: 'accept' | 'reject';

  @ApiPropertyOptional({
    description: 'Razón de rechazo (solo si response es "reject")',
    example: 'Estoy muy lejos del punto de recogida',
    maxLength: 200,
    type: 'string',
  })
  @IsOptional()
  @IsString()
  @Max(200)
  reason?: string;

  @ApiPropertyOptional({
    description:
      'Tiempo estimado de llegada en minutos (solo si response es "accept")',
    example: 5,
    minimum: 1,
    maximum: 60,
    type: 'number',
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(60)
  @Type(() => Number)
  estimatedArrivalMinutes?: number;
}

// === RATING DEL CONDUCTOR AL PASAJERO ===

export class DriverRatePassengerDto {
  @ApiProperty({
    description: 'Calificación del conductor al pasajero (1-5 estrellas)',
    example: 5,
    minimum: 1,
    maximum: 5,
    type: 'number',
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  rating: number;

  @ApiPropertyOptional({
    description: 'Comentario opcional sobre la experiencia con el pasajero',
    example: 'Excelente pasajero, muy amable y respetuoso',
    maxLength: 500,
    type: 'string',
  })
  @IsOptional()
  @IsString()
  @Max(500)
  comment?: string;
}

// === REPORTES DE CONDUCTORES ===

export class ReportIssueDto {
  @ApiProperty({
    description: 'Tipo de problema reportado',
    example: 'traffic_jam',
    enum: ['traffic_jam', 'breakdown', 'accident', 'passenger_issue', 'other'],
  })
  @IsIn(['traffic_jam', 'breakdown', 'accident', 'passenger_issue', 'other'])
  type: 'traffic_jam' | 'breakdown' | 'accident' | 'passenger_issue' | 'other';

  @ApiProperty({
    description: 'Descripción detallada del problema',
    example: 'Hay un accidente bloqueando la ruta principal',
    minLength: 10,
    maxLength: 500,
  })
  @IsNotEmpty()
  @IsString()
  @Length(10, 500)
  description: string;

  @ApiProperty({
    description: 'Severidad del problema',
    example: 'medium',
    enum: ['low', 'medium', 'high'],
  })
  @IsIn(['low', 'medium', 'high'])
  severity: 'low' | 'medium' | 'high';

  @ApiPropertyOptional({
    description: 'Ubicación actual del conductor cuando reporta el problema',
    type: 'object',
    properties: {
      lat: { type: 'number', example: 4.6097 },
      lng: { type: 'number', example: -74.0817 },
    },
  })
  @IsOptional()
  @ValidateNested()
  location?: {
    lat: number;
    lng: number;
  };

  @ApiPropertyOptional({
    description: 'Tiempo estimado de retraso en minutos',
    example: 15,
    minimum: 1,
    maximum: 120,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(120)
  @Type(() => Number)
  estimatedDelay?: number;

  @ApiPropertyOptional({
    description: 'Indica si el problema requiere cancelación del viaje',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  requiresCancellation?: boolean = false;
}

export class CancelRideDto {
  @ApiProperty({
    description: 'Razón de la cancelación',
    example: 'Vehículo averiado en el motor',
    minLength: 10,
    maxLength: 200,
  })
  @IsNotEmpty()
  @IsString()
  @Length(10, 200)
  reason: string;

  @ApiPropertyOptional({
    description: 'Ubicación actual del conductor al momento de cancelar',
    type: 'object',
    properties: {
      lat: { type: 'number', example: 4.6097 },
      lng: { type: 'number', example: -74.0817 },
    },
  })
  @IsOptional()
  @ValidateNested()
  location?: {
    lat: number;
    lng: number;
  };

  @ApiPropertyOptional({
    description: 'Notas adicionales para el pasajero',
    example: 'Lamento las molestias, estoy coordinando asistencia',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @Max(200)
  notes?: string;
}

// === WALLET Y REEMBOLSOS ===

export class RefundRideDto {
  @ApiProperty({
    description: 'ID del viaje a reembolsar',
    example: 123,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  rideId: number;

  @ApiProperty({
    description: 'Razón del reembolso',
    example: 'driver_cancellation',
    enum: [
      'driver_cancellation',
      'passenger_cancellation',
      'system_cancellation',
      'technical_issue',
    ],
  })
  @IsIn([
    'driver_cancellation',
    'passenger_cancellation',
    'system_cancellation',
    'technical_issue',
  ])
  reason:
    | 'driver_cancellation'
    | 'passenger_cancellation'
    | 'system_cancellation'
    | 'technical_issue';

  @ApiPropertyOptional({
    description:
      'Monto a reembolsar (si no se especifica, se usa el monto completo del viaje)',
    example: 25.5,
    minimum: 0.01,
  })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  refundAmount?: number;

  @ApiPropertyOptional({
    description: 'Notas administrativas sobre el reembolso',
    example: 'Cancelación por avería del vehículo',
    maxLength: 300,
  })
  @IsOptional()
  @IsString()
  @Max(300)
  notes?: string;
}

// === NUEVOS DTOS PARA SISTEMA DE PAGOS COMPLETO ===

// DTO para elementos individuales del array de pagos
export class PaymentMethodDto {
  @ApiProperty({
    description: 'Método de pago venezolano',
    example: 'transfer',
    enum: ['cash', 'transfer', 'pago_movil', 'zelle', 'bitcoin', 'wallet'],
    enumName: 'VenezuelanPaymentMethod',
  })
  @IsIn(['cash', 'transfer', 'pago_movil', 'zelle', 'bitcoin', 'wallet'])
  method: 'cash' | 'transfer' | 'pago_movil' | 'zelle' | 'bitcoin' | 'wallet';

  @ApiProperty({
    description: 'Monto a pagar con este método',
    example: 25.5,
    minimum: 0.01,
    type: 'number',
    format: 'float',
  })
  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  amount: number;

  @ApiPropertyOptional({
    description: 'Código de banco (requerido para transfer y pago_movil)',
    example: '0102',
    minLength: 4,
    maxLength: 4,
    enum: ['0102', '0105', '0196', '0108'],
  })
  @IsOptional()
  @IsString()
  @Length(4, 4)
  bankCode?: string;
}

export class PayWithMultipleMethodsDto {
  @ApiProperty({
    description: 'Monto total del viaje a pagar',
    example: 25.5,
    minimum: 0.01,
    type: 'number',
    format: 'float',
  })
  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  totalAmount: number;

  @ApiProperty({
    description:
      'Array de métodos de pago. Puede contener un solo método o múltiples.',
    type: 'array',
    items: {
      $ref: '#/components/schemas/PaymentMethodDto',
    },
    minItems: 1,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => PaymentMethodDto)
  payments: PaymentMethodDto[];
}

export class GeneratePaymentReferenceDto {
  @ApiProperty({
    description: 'Método de pago para generar la referencia',
    example: 'transfer',
    enum: ['cash', 'transfer', 'pago_movil', 'zelle', 'bitcoin', 'wallet'],
    enumName: 'VenezuelanPaymentMethod',
  })
  @IsIn(['cash', 'transfer', 'pago_movil', 'zelle', 'bitcoin', 'wallet'])
  method: 'cash' | 'transfer' | 'pago_movil' | 'zelle' | 'bitcoin' | 'wallet';

  @ApiPropertyOptional({
    description:
      'Código del banco venezolano (requerido para transfer y pago_movil)',
    example: '0102',
    minLength: 4,
    maxLength: 4,
    enum: ['0102', '0105', '0196', '0108'],
  })
  @IsOptional()
  @IsString()
  @Length(4, 4)
  bankCode?: string;
}

export class ConfirmPaymentWithReferenceDto {
  @ApiProperty({
    description: 'Número de referencia bancaria de 20 dígitos',
    example: '12345678901234567890',
    minLength: 20,
    maxLength: 20,
    type: 'string',
  })
  @IsString()
  @Length(20, 20)
  referenceNumber: string;

  @ApiPropertyOptional({
    description:
      'Código del banco donde se realizó el pago (opcional, se infiere de la referencia)',
    example: '0102',
    minLength: 4,
    maxLength: 4,
    enum: ['0102', '0105', '0196', '0108'],
  })
  @IsOptional()
  @IsString()
  @Length(4, 4)
  bankCode?: string;
}

export class SimulateRequestDto {
  // No requiere parámetros - todo se genera automáticamente para testing
}

export class UpdateDriverLocationDto {
  @ApiProperty({
    description: 'Latitud de la ubicación actual del conductor',
    example: 4.6097,
    minimum: -90,
    maximum: 90,
    type: 'number',
  })
  @IsNumber()
  @Min(-90)
  @Max(90)
  @Type(() => Number)
  lat: number;

  @ApiProperty({
    description: 'Longitud de la ubicación actual del conductor',
    example: -74.0817,
    minimum: -180,
    maximum: 180,
    type: 'number',
  })
  @IsNumber()
  @Min(-180)
  @Max(180)
  @Type(() => Number)
  lng: number;

  @ApiPropertyOptional({
    description: 'Precisión de la ubicación en metros',
    example: 5.2,
    minimum: 0,
    type: 'number',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  accuracy?: number;

  @ApiPropertyOptional({
    description: 'Velocidad actual en km/h',
    example: 45.5,
    minimum: 0,
    type: 'number',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  speed?: number;

  @ApiPropertyOptional({
    description: 'Dirección en grados (0-360)',
    example: 90,
    minimum: 0,
    maximum: 360,
    type: 'number',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(360)
  @Type(() => Number)
  heading?: number;

  @ApiPropertyOptional({
    description: 'ID del ride activo (opcional)',
    example: 123,
    type: 'number',
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  rideId?: number;
}

// =========================================
// ASYNC DRIVER MATCHING DTOs
// =========================================

/**
 * DTO para iniciar una búsqueda asíncrona de conductor
 */
export class StartAsyncDriverSearchDto extends MatchBestDriverDto {
  @ApiPropertyOptional({
    description: 'Tiempo máximo de espera en segundos',
    example: 300,
    minimum: 30,
    maximum: 1800,
    default: 300,
    type: 'number',
  })
  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(1800)
  @Type(() => Number)
  maxWaitTime?: number = 300; // 5 minutos por defecto

  @ApiPropertyOptional({
    description: 'Prioridad de la búsqueda',
    example: 'normal',
    enum: ['low', 'normal', 'high'],
    default: 'normal',
    type: 'string',
  })
  @IsOptional()
  @IsIn(['low', 'normal', 'high'])
  priority?: 'low' | 'normal' | 'high' = 'normal';

  @ApiPropertyOptional({
    description: 'Unirse a una sala WebSocket específica para notificaciones',
    example: 'user-123',
    type: 'string',
  })
  @IsOptional()
  @IsString()
  websocketRoom?: string;
}

/**
 * DTO para cancelar una búsqueda asíncrona
 */
export class CancelAsyncSearchDto {
  @ApiProperty({
    description: 'ID único de la búsqueda a cancelar',
    example: 'search-123e4567-e89b-12d3-a456-426614174000',
    type: 'string',
  })
  @IsNotEmpty()
  @IsString()
  searchId: string;
}

/**
 * DTO para consultar estado de búsqueda asíncrona
 */
export class GetAsyncSearchStatusDto {
  @ApiProperty({
    description: 'ID único de la búsqueda',
    example: 'search-123e4567-e89b-12d3-a456-426614174000',
    type: 'string',
  })
  @IsNotEmpty()
  @IsString()
  searchId: string;
}

/**
 * DTO para confirmar conductor encontrado en búsqueda asíncrona
 */
export class ConfirmAsyncDriverDto {
  @ApiProperty({
    description: 'ID único de la búsqueda',
    example: 'search-123e4567-e89b-12d3-a456-426614174000',
    type: 'string',
  })
  @IsNotEmpty()
  @IsString()
  searchId: string;

  @ApiProperty({
    description: 'ID del conductor a confirmar',
    example: 42,
    type: 'number',
  })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  driverId: number;

  @ApiPropertyOptional({
    description: 'Notas adicionales para el conductor',
    example: 'Por favor llegue rápido, tengo prisa',
    type: 'string',
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  notes?: string;
}
