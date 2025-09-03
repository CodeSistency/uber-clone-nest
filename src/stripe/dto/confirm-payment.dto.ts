import { IsNotEmpty, IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConfirmPaymentDto {
  @ApiProperty({
    description: 'Stripe payment method ID (starts with pm_)',
    example: 'pm_1N2B3C4D5E6F7G8H',
    pattern: '^pm_',
    minLength: 20,
    maxLength: 30
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^pm_/)
  payment_method_id: string;

  @ApiProperty({
    description: 'Stripe payment intent ID (starts with pi_)',
    example: 'pi_1N2B3C4D5E6F7G8H',
    pattern: '^pi_',
    minLength: 20,
    maxLength: 30
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^pi_/)
  payment_intent_id: string;

  @ApiProperty({
    description: 'Stripe customer ID (starts with cus_)',
    example: 'cus_1N2B3C4D5E6F7G8H',
    pattern: '^cus_',
    minLength: 20,
    maxLength: 30
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^cus_/)
  customer_id: string;
}
