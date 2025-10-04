import { IsNotEmpty, IsString, IsNumber, Min, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UnblockWalletDto {
  @ApiProperty({ 
    example: 1,
    description: 'ID del usuario cuya wallet se va a desbloquear',
    minimum: 1
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  userId: number;

  @ApiProperty({ 
    example: 'Issue resolved after investigation',
    description: 'Razón del desbloqueo',
    minLength: 1,
    maxLength: 500
  })
  @IsNotEmpty()
  @IsString()
  @Length(1, 500)
  reason: string;

  @ApiProperty({ 
    example: 1,
    description: 'ID del administrador que realiza el desbloqueo',
    minimum: 1
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  adminId: number;
}
