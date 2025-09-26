import { IsNotEmpty, IsString, IsOptional, IsBoolean, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWorkZoneDto {
  @ApiProperty({
    description: 'Zone name',
    example: 'Downtown Caracas',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Zone description',
    example: 'Central business district with high demand',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'City where the zone is located',
    example: 'Caracas',
  })
  @IsNotEmpty()
  @IsString()
  city: string;

  @ApiProperty({
    description: 'State/Province',
    example: 'Distrito Capital',
  })
  @IsNotEmpty()
  @IsString()
  state: string;

  @ApiProperty({
    description: 'GeoJSON polygon defining the zone boundaries',
    example: {
      type: 'Polygon',
      coordinates: [[[-66.9036, 10.4806], [-66.9036, 10.5206], [-66.8636, 10.5206], [-66.8636, 10.4806], [-66.9036, 10.4806]]]
    },
  })
  @IsNotEmpty()
  @IsObject()
  coordinates: any;
}

export class AssignWorkZoneDto {
  @ApiProperty({
    description: 'Work zone ID',
    example: 1,
  })
  @IsNotEmpty()
  zoneId: number;

  @ApiPropertyOptional({
    description: 'Set as primary work zone',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}
