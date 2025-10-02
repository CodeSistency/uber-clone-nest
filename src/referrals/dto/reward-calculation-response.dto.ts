import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class RewardCalculationResponseDto {
  @ApiProperty({
    description: 'Tier used for the calculation',
    example: 'BASIC',
    enum: ['BASIC', 'ADVANCED', 'VIP'],
  })
  @Expose()
  tier: string;

  @ApiProperty({
    description: 'Number of referrals used for calculation',
    example: 3,
  })
  @Expose()
  referralCount: number;

  @ApiProperty({
    description: 'Amount the referrer would earn',
    example: 15.00,
  })
  @Expose()
  referrerReward: number;

  @ApiProperty({
    description: 'Amount the referee would receive as bonus',
    example: 10.00,
  })
  @Expose()
  refereeReward: number;

  @ApiProperty({
    description: 'Total potential earnings for the referrer',
    example: 15.00,
  })
  @Expose()
  totalEarnings: number;

  @ApiProperty({
    description: 'Conditions that must be met for rewards',
    example: {
      firstRideCompleted: true,
      minRideValue: 15.00,
    },
  })
  @Expose()
  conditions: any;

  @ApiProperty({
    description: 'How long rewards remain valid in days',
    example: 30,
  })
  @Expose()
  validityDays: number;
}


