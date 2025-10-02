import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

export class ReferralRefereeDto {
  @ApiProperty({
    description: 'User ID of the referred user',
    example: 123,
  })
  @Expose()
  id: number;

  @ApiProperty({
    description: 'Name of the referred user',
    example: 'John Doe',
  })
  @Expose()
  name: string;

  @ApiProperty({
    description: 'Email of the referred user',
    example: 'john.doe@example.com',
  })
  @Expose()
  email: string;

  @ApiProperty({
    description: 'When the referred user was created',
    example: '2024-01-15T10:30:00.000Z',
  })
  @Expose()
  createdAt: Date;
}

export class ReferralTransactionDto {
  @ApiProperty({
    description: 'Transaction ID',
    example: 456,
  })
  @Expose()
  id: number;

  @ApiProperty({
    description: 'Amount of the transaction',
    example: 5.00,
  })
  @Expose()
  amount: number;

  @ApiProperty({
    description: 'Type of transaction',
    example: 'EARNED',
    enum: ['EARNED', 'REDEEMED', 'EXPIRED', 'CANCELLED'],
  })
  @Expose()
  type: string;

  @ApiProperty({
    description: 'Human readable description',
    example: 'Referral reward - BASIC tier',
  })
  @Expose()
  description?: string;

  @ApiProperty({
    description: 'When the transaction was created',
    example: '2024-01-15T10:30:00.000Z',
  })
  @Expose()
  createdAt: Date;
}

export class ReferralResponseDto {
  @ApiProperty({
    description: 'Referral ID',
    example: 789,
  })
  @Expose()
  id: number;

  @ApiProperty({
    description: 'ID of the referral code used',
    example: 101,
  })
  @Expose()
  referralCodeId: number;

  @ApiProperty({
    description: 'Status of the referral',
    example: 'converted',
    enum: ['pending', 'converted', 'cancelled', 'expired'],
  })
  @Expose()
  status: string;

  @ApiProperty({
    description: 'Amount earned from this referral',
    example: 5.00,
  })
  @Expose()
  rewardAmount?: number;

  @ApiProperty({
    description: 'Type of reward earned',
    example: 'CREDIT',
    enum: ['CREDIT', 'FREE_RIDE', 'PERCENTAGE_DISCOUNT'],
  })
  @Expose()
  rewardType?: string;

  @ApiProperty({
    description: 'When the referral was created',
    example: '2024-01-15T10:30:00.000Z',
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: 'When the referral was converted (first ride completed)',
    example: '2024-01-16T14:20:00.000Z',
  })
  @Expose()
  convertedAt?: Date;

  @ApiProperty({
    description: 'Information about the referred user',
    type: ReferralRefereeDto,
  })
  @Expose()
  @Type(() => ReferralRefereeDto)
  referee: ReferralRefereeDto;

  @ApiProperty({
    description: 'List of transactions related to this referral',
    type: [ReferralTransactionDto],
  })
  @Expose()
  @Type(() => ReferralTransactionDto)
  transactions: ReferralTransactionDto[];
}


