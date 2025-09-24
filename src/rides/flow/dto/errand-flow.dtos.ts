import {
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

export class CreateErrandDto {
  @ApiProperty({
    description: 'Descripción detallada del mandado que se debe realizar',
    example:
      'Comprar leche, pan integral, frutas frescas y medicamentos en la farmacia',
    minLength: 10,
    maxLength: 300,
    type: 'string',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(300)
  description: string;

  @ApiPropertyOptional({
    description: 'Lista específica de items a comprar (formato libre)',
    example:
      '• 1 litro de leche deslactosada\n• 1 bolsa de pan integral\n• 2 kg de manzanas rojas\n• 1 paquete de arroz\n• Medicamento: Paracetamol 500mg',
    maxLength: 500,
    type: 'string',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  itemsList?: string; // Free-text list of items

  @ApiProperty({
    description:
      'Dirección donde el conductor debe recoger al cliente para iniciar el mandado',
    example: 'Centro Comercial Gran Estación, Local 123, Nivel 2',
    minLength: 5,
    maxLength: 255,
    type: 'string',
  })
  @IsNotEmpty()
  @IsString()
  pickupAddress: string;

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
  pickupLat: number;

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
  pickupLng: number;

  @ApiProperty({
    description:
      'Dirección donde el conductor debe dejar al cliente después de completar el mandado',
    example: 'Casa del cliente, Calle 45 #123-45, Bogotá',
    minLength: 5,
    maxLength: 255,
    type: 'string',
  })
  @IsNotEmpty()
  @IsString()
  dropoffAddress: string;

  @ApiProperty({
    description: 'Latitud del punto de destino (coordenadas GPS)',
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
    description: 'Longitud del punto de destino (coordenadas GPS)',
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
}

export class ErrandShoppingUpdateDto {
  @ApiProperty({
    description: 'Costo total de los items comprados durante el mandado',
    example: 45.5,
    minimum: 0,
    maximum: 1000,
    type: 'number',
    format: 'float',
  })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  itemsCost: number;

  @ApiPropertyOptional({
    description:
      'Notas adicionales sobre las compras realizadas o cualquier incidente',
    example:
      'La leche estaba agotada así que compré una alternativa. El medicamento estaba disponible en la farmacia del segundo piso.',
    maxLength: 300,
    type: 'string',
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  notes?: string;
}
