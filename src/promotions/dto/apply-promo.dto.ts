import { IsNotEmpty, IsString, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class ApplyPromoDto {
  @ApiProperty({ example: 'WELCOME10' })
  @IsNotEmpty()
  @IsString()
  promoCode: string;

  @ApiProperty({ example: 25.00 })
  @IsNotEmpty()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @Min(0)
  rideAmount: number;
}
