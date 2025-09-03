import { IsNotEmpty, IsString, IsPhoneNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEmergencyContactDto {
  @ApiProperty({
    description: 'Clerk ID of the user adding the emergency contact',
    example: 'user_2abc123def456',
    minLength: 10,
    maxLength: 50
  })
  @IsNotEmpty()
  @IsString()
  userClerkId: string;

  @ApiProperty({
    description: 'Full name of the emergency contact person',
    example: 'Jane Doe',
    minLength: 2,
    maxLength: 100
  })
  @IsNotEmpty()
  @IsString()
  contactName: string;

  @ApiProperty({
    description: 'Phone number of the emergency contact (must include country code)',
    example: '+15551234567',
    pattern: '/^\+[1-9]\d{1,14}$/'
  })
  @IsNotEmpty()
  @IsString()
  contactPhone: string;
}
