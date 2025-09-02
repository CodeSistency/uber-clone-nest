import { IsNotEmpty, IsString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UploadDocumentDto {
  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  @IsNumber()
  driverId: number;

  @ApiProperty({
    example: 'license',
    description: 'Document type (license, vehicle_registration, etc.)',
  })
  @IsNotEmpty()
  @IsString()
  documentType: string;

  @ApiProperty({ example: 'https://example.com/license.pdf' })
  @IsNotEmpty()
  @IsString()
  documentUrl: string;
}
