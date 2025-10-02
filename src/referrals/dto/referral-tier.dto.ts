import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ReferralTierDto {
  @ApiProperty({
    description: 'Tier identifier',
    example: 'BASIC',
    enum: ['BASIC', 'ADVANCED', 'VIP'],
  })
  @Expose()
  tier: string;

  @ApiProperty({
    description: 'Minimum number of referrals needed to unlock this tier',
    example: 0,
  })
  @Expose()
  minReferrals: number;

  @ApiProperty({
    description:
      'Maximum number of referrals for this tier (null for unlimited)',
    example: 5,
    nullable: true,
  })
  @Expose()
  maxReferrals?: number;

  @ApiProperty({
    description: 'Type of reward offered in this tier',
    example: 'CREDIT',
    enum: ['CREDIT', 'FREE_RIDE', 'PERCENTAGE_DISCOUNT'],
  })
  @Expose()
  rewardType: string;

  @ApiProperty({
    description: 'Amount or percentage of the reward',
    example: 5.0,
  })
  @Expose()
  rewardAmount: number;

  @ApiProperty({
    description: 'Flexible conditions for reward activation',
    example: { firstRideCompleted: true, minRideValue: 15.0 },
  })
  @Expose()
  conditions?: any;

  @ApiProperty({
    description: 'How long the reward is valid in days',
    example: 30,
  })
  @Expose()
  validityDays: number;

  @ApiProperty({
    description: 'Whether this tier configuration is currently active',
    example: true,
  })
  @Expose()
  isActive: boolean;
}
