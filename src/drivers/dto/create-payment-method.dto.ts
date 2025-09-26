import { IsNotEmpty, IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePaymentMethodDto {
  @ApiProperty({
    description: 'Payment method type',
    example: 'bank_transfer',
    enum: ['bank_transfer', 'cash', 'wallet', 'crypto'],
  })
  @IsNotEmpty()
  @IsString()
  methodType: string;

  @ApiPropertyOptional({
    description: 'Account number for bank transfers',
    example: '1234567890',
  })
  @IsOptional()
  @IsString()
  accountNumber?: string;

  @ApiPropertyOptional({
    description: 'Account holder name',
    example: 'John Doe',
  })
  @IsOptional()
  @IsString()
  accountName?: string;

  @ApiPropertyOptional({
    description: 'Bank name',
    example: 'Banco Nacional',
  })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiPropertyOptional({
    description: 'Routing number',
    example: '021000021',
  })
  @IsOptional()
  @IsString()
  routingNumber?: string;

  @ApiPropertyOptional({
    description: 'SWIFT/BIC code',
    example: 'BNPAFRPP',
  })
  @IsOptional()
  @IsString()
  swiftCode?: string;

  @ApiPropertyOptional({
    description: 'Crypto wallet address',
    example: '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2',
  })
  @IsOptional()
  @IsString()
  walletAddress?: string;

  @ApiPropertyOptional({
    description: 'Set as default payment method',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
