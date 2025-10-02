import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ReferralStatsDto {
  @ApiProperty({
    description: 'Total number of referrals made by the user',
    example: 15,
  })
  @Expose()
  totalReferrals: number;

  @ApiProperty({
    description:
      'Number of referrals that have been converted (first ride completed)',
    example: 12,
  })
  @Expose()
  convertedReferrals: number;

  @ApiProperty({
    description: 'Conversion rate as percentage',
    example: 80.0,
  })
  @Expose()
  conversionRate: number;

  @ApiProperty({
    description: 'Total amount earned from referrals',
    example: 48.0,
  })
  @Expose()
  totalEarned: number;

  @ApiProperty({
    description: 'Amount of pending rewards not yet processed',
    example: 10.0,
  })
  @Expose()
  pendingRewards: number;

  @ApiProperty({
    description: 'Current tier of the user based on referral performance',
    example: 'ADVANCED',
    enum: ['BASIC', 'ADVANCED', 'VIP'],
  })
  @Expose()
  tier: string;

  @ApiProperty({
    description: 'Ranking position among all referrers',
    example: 5,
  })
  @Expose()
  rank: number;
}
