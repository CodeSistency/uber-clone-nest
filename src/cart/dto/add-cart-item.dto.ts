import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddCartItemDto {
  @ApiProperty({
    description: 'ID del producto a agregar al carrito',
    example: 123,
    type: 'number',
  })
  @IsNotEmpty()
  @IsNumber()
  productId: number;

  @ApiProperty({
    description: 'Cantidad del producto a agregar',
    example: 2,
    minimum: 1,
    default: 1,
    type: 'number',
  })
  @IsNotEmpty()
  @IsNumber()
  quantity: number = 1;

  @ApiPropertyOptional({
    description: 'Notas especiales para este producto',
    example: 'Sin cebolla, extra queso',
    maxLength: 255,
    type: 'string',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  notes?: string;
}
