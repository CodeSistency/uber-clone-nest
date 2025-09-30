import { IsNotEmpty, IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VerifyDriverDto {
  @ApiProperty({
    description: 'Verification status',
    example: 'approved',
    enum: ['pending', 'approved', 'rejected', 'under_review'],
  })
  @IsNotEmpty()
  @IsString()
  verificationStatus: string;

  @ApiPropertyOptional({
    description: 'Reason for approval or rejection',
    example: 'All documents verified successfully',
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({
    description: 'Additional notes',
    example: 'Insurance document needs renewal',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Request additional documents',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  requestAdditionalDocs?: boolean;

  @ApiPropertyOptional({
    description: 'List of additional documents needed',
    example: ['criminal_record', 'medical_certificate'],
    type: [String],
  })
  @IsOptional()
  @IsString({ each: true })
  additionalDocuments?: string[];
}
