import { IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCartItemDto {
  @ApiProperty({
    description: 'ID del producto a actualizar en el carrito',
    example: 123,
    type: 'number'
  })
  @IsNotEmpty()
  @IsNumber()
  productId: number;

  @ApiProperty({
    description: 'Nueva cantidad del producto',
    example: 3,
    minimum: 1,
    type: 'number'
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({
    description: 'Notas especiales para este producto',
    example: 'Sin cebolla, extra queso',
    maxLength: 255,
    type: 'string'
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  notes?: string;
}
