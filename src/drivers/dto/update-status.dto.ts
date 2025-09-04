import { IsNotEmpty, IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateDriverStatusDto {
  @ApiProperty({
    description: 'Driver availability status',
    example: 'online',
    enum: ['online', 'offline', 'busy']
  })
  @IsNotEmpty()
  @IsString()
  @IsIn(['online', 'offline', 'busy'])
  status: string;
}



