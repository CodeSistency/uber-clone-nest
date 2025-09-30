import { IsNotEmpty, IsString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UploadVehicleDocumentDto {
  @ApiProperty({
    description: 'Vehicle ID',
    example: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  vehicleId: number;

  @ApiProperty({
    description: 'Document type',
    example: 'registration',
    enum: ['registration', 'insurance', 'inspection', 'permit'],
  })
  @IsNotEmpty()
  @IsString()
  documentType: string;

  @ApiProperty({
    description: 'Document file URL',
    example: 'https://example.com/documents/vehicle_registration.pdf',
  })
  @IsNotEmpty()
  @IsString()
  documentUrl: string;
}
