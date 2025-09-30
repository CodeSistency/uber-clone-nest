import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateParcelDto {
  @ApiProperty({
    description: 'Dirección completa donde se recogerá el paquete',
    example: 'Oficina Principal, Calle 100 #15-30, Torre A Piso 5, Oficina 501',
    minLength: 10,
    maxLength: 255,
    type: 'string',
  })
  @IsNotEmpty()
  @IsString()
  pickupAddress: string;

  @ApiProperty({
    description: 'Latitud del punto de recogida del paquete (coordenadas GPS)',
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
  pickupLat: number;

  @ApiProperty({
    description: 'Longitud del punto de recogida del paquete (coordenadas GPS)',
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
  pickupLng: number;

  @ApiProperty({
    description: 'Dirección completa donde se entregará el paquete',
    example: 'Casa del destinatario, Carrera 7 #45-67, Apartamento 802, Bogotá',
    minLength: 10,
    maxLength: 255,
    type: 'string',
  })
  @IsNotEmpty()
  @IsString()
  dropoffAddress: string;

  @ApiProperty({
    description: 'Latitud del punto de entrega del paquete (coordenadas GPS)',
    example: 4.615,
    minimum: -90,
    maximum: 90,
    type: 'number',
    format: 'float',
  })
  @IsNumber()
  @Min(-90)
  @Max(90)
  @Type(() => Number)
  dropoffLat: number;

  @ApiProperty({
    description: 'Longitud del punto de entrega del paquete (coordenadas GPS)',
    example: -74.075,
    minimum: -180,
    maximum: 180,
    type: 'number',
    format: 'float',
  })
  @IsNumber()
  @Min(-180)
  @Max(180)
  @Type(() => Number)
  dropoffLng: number;

  @ApiProperty({
    description: 'Tipo de paquete para determinar el manejo especial requerido',
    example: 'electronics',
    enum: ['documents', 'electronics', 'fragile', 'other'],
    enumName: 'ParcelType',
  })
  @IsIn(['documents', 'electronics', 'fragile', 'other'])
  type: 'documents' | 'electronics' | 'fragile' | 'other';

  @ApiPropertyOptional({
    description:
      'Descripción detallada del contenido del paquete para manejo adecuado',
    example:
      'Laptop Dell XPS 13 con accesorios: cargador original, mouse inalámbrico, maletín protector',
    maxLength: 300,
    type: 'string',
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string;
}

export class ProofOfDeliveryDto {
  @ApiPropertyOptional({
    description:
      'URL de la imagen de la firma digital del destinatario como prueba de entrega',
    example: 'https://storage.googleapis.com/signatures/parcel_sig_123456.png',
    type: 'string',
    format: 'uri',
  })
  @IsOptional()
  @IsString()
  signatureImageUrl?: string;

  @ApiPropertyOptional({
    description: 'URL de la foto del paquete entregado como prueba adicional',
    example:
      'https://storage.googleapis.com/deliveries/parcel_proof_123456.jpg',
    type: 'string',
    format: 'uri',
  })
  @IsOptional()
  @IsString()
  photoUrl?: string;
}
