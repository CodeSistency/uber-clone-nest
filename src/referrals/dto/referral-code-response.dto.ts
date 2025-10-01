import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ReferralCodeResponseDto {
  @ApiProperty({
    description: 'Unique referral code',
    example: 'UBER123ABC',
  })
  @Expose()
  code: string;

  @ApiProperty({
    description: 'Whether the code is currently active',
    example: true,
  })
  @Expose()
  isActive: boolean;

  @ApiProperty({
    description: 'Number of times the code has been used',
    example: 5,
  })
  @Expose()
  usageCount: number;

  @ApiProperty({
    description: 'Maximum number of uses allowed',
    example: 100,
  })
  @Expose()
  maxUses: number;

  @ApiProperty({
    description: 'Expiration date of the code (null if no expiration)',
    example: '2024-12-31T23:59:59.000Z',
    nullable: true,
  })
  @Expose()
  expiresAt?: Date;

  @ApiProperty({
    description: 'When the code was created',
    example: '2024-01-15T10:30:00.000Z',
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: 'When the code was last updated',
    example: '2024-01-15T10:30:00.000Z',
  })
  @Expose()
  updatedAt: Date;
}


