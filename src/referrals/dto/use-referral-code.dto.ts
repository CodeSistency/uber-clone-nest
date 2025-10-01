import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class UseReferralCodeDto {
  @ApiProperty({
    description: 'Referral code to apply during user registration',
    example: 'UBER123ABC',
    minLength: 8,
    maxLength: 12,
  })
  @IsNotEmpty({ message: 'Referral code is required' })
  @IsString({ message: 'Referral code must be a string' })
  @Length(8, 12, { message: 'Referral code must be between 8 and 12 characters' })
  referralCode: string;
}


