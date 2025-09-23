import { IsNotEmpty, IsNumber, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEmployeeDto {
  @ApiProperty({
    description: 'ID of the user to be employed at the store',
    example: 1,
    type: Number,
  })
  @IsNotEmpty()
  @IsNumber()
  userId: number;

  @ApiProperty({
    description: 'ID of the store where the user will work',
    example: 1,
    type: Number,
  })
  @IsNotEmpty()
  @IsNumber()
  storeId: number;

  @ApiPropertyOptional({
    description: 'Whether the employee relationship is active',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
