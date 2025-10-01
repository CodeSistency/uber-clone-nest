import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ReferralCodeStatsDto {
  @ApiProperty({
    description: 'Unique referral code',
    example: 'UBER123ABC',
  })
  @Expose()
  code: string;

  @ApiProperty({
    description: 'Total number of referrals using this code',
    example: 15,
  })
  @Expose()
  totalReferrals: number;

  @ApiProperty({
    description: 'Number of converted referrals (users who completed their first ride)',
    example: 12,
  })
  @Expose()
  convertedReferrals: number;

  @ApiProperty({
    description: 'Total amount earned by the referrer using this code',
    example: 48.00,
  })
  @Expose()
  totalEarned: number;
}


