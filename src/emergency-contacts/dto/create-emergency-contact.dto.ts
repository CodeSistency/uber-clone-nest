import { IsNotEmpty, IsString, IsPhoneNumber, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateEmergencyContactDto {
  @ApiProperty({
    description: 'User ID of the user adding the emergency contact',
    example: 1,
  })
  @IsNotEmpty()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  userId: number;

  @ApiProperty({
    description: 'Full name of the emergency contact person',
    example: 'Jane Doe',
    minLength: 2,
    maxLength: 100,
  })
  @IsNotEmpty()
  @IsString()
  contactName: string;

  @ApiProperty({
    description:
      'Phone number of the emergency contact (must include country code)',
    example: '+15551234567',
    pattern: '/^\+[1-9]\d{1,14}$/',
  })
  @IsNotEmpty()
  @IsString()
  contactPhone: string;
}
