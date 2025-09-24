import { IsNotEmpty, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RemoveCartItemDto {
  @ApiProperty({
    description: 'ID del producto a remover del carrito',
    example: 123,
    type: 'number',
  })
  @IsNotEmpty()
  @IsNumber()
  productId: number;
}
