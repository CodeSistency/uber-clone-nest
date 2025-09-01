import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConfirmPaymentDto {
  @ApiProperty({ example: 'pm_...' })
  @IsNotEmpty()
  @IsString()
  payment_method_id: string;

  @ApiProperty({ example: 'pi_...' })
  @IsNotEmpty()
  @IsString()
  payment_intent_id: string;

  @ApiProperty({ example: 'cus_...' })
  @IsNotEmpty()
  @IsString()
  customer_id: string;
}
