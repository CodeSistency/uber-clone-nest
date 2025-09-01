import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEmergencyContactDto {
  @ApiProperty({ example: 'user_2abc123def456' })
  @IsNotEmpty()
  @IsString()
  userClerkId: string;

  @ApiProperty({ example: 'Jane Doe' })
  @IsNotEmpty()
  @IsString()
  contactName: string;

  @ApiProperty({ example: '+15551234567' })
  @IsNotEmpty()
  @IsString()
  contactPhone: string;
}
