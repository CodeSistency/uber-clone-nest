import { IsNotEmpty, IsString, IsNumber, IsOptional, IsBoolean, IsDateString, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVehicleDto {
  @ApiProperty({
    description: 'Vehicle type ID',
    example: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  vehicleTypeId: number;

  @ApiProperty({
    description: 'Vehicle make/brand',
    example: 'Toyota',
  })
  @IsNotEmpty()
  @IsString()
  make: string;

  @ApiProperty({
    description: 'Vehicle model',
    example: 'Corolla',
  })
  @IsNotEmpty()
  @IsString()
  model: string;

  @ApiProperty({
    description: 'Manufacturing year',
    example: 2020,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1900)
  @Max(new Date().getFullYear() + 1)
  year: number;

  @ApiPropertyOptional({
    description: 'Vehicle color',
    example: 'White',
  })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiProperty({
    description: 'License plate number',
    example: 'ABC-1234',
  })
  @IsNotEmpty()
  @IsString()
  licensePlate: string;

  @ApiPropertyOptional({
    description: 'Vehicle Identification Number (VIN)',
    example: '1HGBH41JXMN109186',
  })
  @IsOptional()
  @IsString()
  vin?: string;

  @ApiProperty({
    description: 'Number of passenger seats',
    example: 4,
    default: 4,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(20)
  seatingCapacity: number;

  @ApiPropertyOptional({
    description: 'Has air conditioning',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  hasAC?: boolean;

  @ApiPropertyOptional({
    description: 'Has GPS navigation',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  hasGPS?: boolean;

  @ApiPropertyOptional({
    description: 'Fuel type',
    example: 'gasoline',
    enum: ['gasoline', 'diesel', 'electric', 'hybrid'],
    default: 'gasoline',
  })
  @IsOptional()
  @IsString()
  fuelType?: string;

  @ApiPropertyOptional({
    description: 'Insurance provider name',
    example: 'Allianz',
  })
  @IsOptional()
  @IsString()
  insuranceProvider?: string;

  @ApiPropertyOptional({
    description: 'Insurance policy number',
    example: 'POL-123456789',
  })
  @IsOptional()
  @IsString()
  insurancePolicyNumber?: string;

  @ApiPropertyOptional({
    description: 'Insurance expiry date',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsDateString()
  insuranceExpiryDate?: string;

  @ApiPropertyOptional({
    description: 'Front view image URL',
    example: 'https://example.com/vehicle/front.jpg',
  })
  @IsOptional()
  @IsString()
  frontImageUrl?: string;

  @ApiPropertyOptional({
    description: 'Side view image URL',
    example: 'https://example.com/vehicle/side.jpg',
  })
  @IsOptional()
  @IsString()
  sideImageUrl?: string;

  @ApiPropertyOptional({
    description: 'Back view image URL',
    example: 'https://example.com/vehicle/back.jpg',
  })
  @IsOptional()
  @IsString()
  backImageUrl?: string;

  @ApiPropertyOptional({
    description: 'Interior image URL',
    example: 'https://example.com/vehicle/interior.jpg',
  })
  @IsOptional()
  @IsString()
  interiorImageUrl?: string;

  @ApiPropertyOptional({
    description: 'Set as default vehicle for the driver',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
