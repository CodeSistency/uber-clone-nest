import { IsNotEmpty, IsString, IsNumber, Min, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class BlockWalletDto {
  @ApiProperty({
    example: 1,
    description: 'ID del usuario cuya wallet se va a bloquear',
    minimum: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  userId: number;

  @ApiProperty({
    example: 'Suspicious activity detected',
    description: 'Razón del bloqueo',
    minLength: 1,
    maxLength: 500,
  })
  @IsNotEmpty()
  @IsString()
  @Length(1, 500)
  reason: string;

  @ApiProperty({
    example: 1,
    description: 'ID del administrador que realiza el bloqueo',
    minimum: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  adminId: number;
}
