import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, Min } from 'class-validator';

export class RewardCalculationDto {
  @ApiProperty({
    description: 'Number of referrals to calculate rewards for',
    example: 3,
    minimum: 1,
  })
  @IsInt({ message: 'Number of referrals must be an integer' })
  @Min(1, { message: 'Number of referrals must be at least 1' })
  referralCount: number;

  @ApiProperty({
    description: 'Specific tier to calculate for (optional - will use current tier if not provided)',
    example: 'ADVANCED',
    enum: ['BASIC', 'ADVANCED', 'VIP'],
    required: false,
  })
  @IsOptional()
  tier?: string;
}


