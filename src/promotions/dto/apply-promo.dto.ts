import { IsNotEmpty, IsString, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class ApplyPromoDto {
  @ApiProperty({
    description: 'The promotional code to apply',
    example: 'WELCOME10',
    minLength: 3,
    maxLength: 20
  })
  @IsNotEmpty()
  @IsString()
  promoCode: string;

  @ApiProperty({
    description: 'The total amount of the ride before discount',
    example: 25.0,
    minimum: 0,
    type: Number
  })
  @IsNotEmpty()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @Min(0)
  rideAmount: number;
}
