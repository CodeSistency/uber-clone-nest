import { IsNotEmpty, IsString, IsNumber, IsEmail, Min, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreatePaymentIntentDto {
  @ApiProperty({
    description: 'Full name of the customer making the payment',
    example: 'John Doe',
    minLength: 2,
    maxLength: 100
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Email address of the customer',
    example: 'john.doe@example.com',
    format: 'email'
  })
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Payment amount in USD (minimum $0.50, maximum $999.99)',
    example: 15.75,
    minimum: 0.50,
    maximum: 999.99,
    type: Number
  })
  @IsNotEmpty()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @Min(0.50)
  amount: number;
}
