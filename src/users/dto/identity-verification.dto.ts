import {
  IsNotEmpty,
  IsString,
  Matches,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IdentityVerificationStatus } from '../interfaces/verification.interface';

export class SubmitIdentityVerificationDto {
  @ApiProperty({
    description: 'Número de DNI del usuario',
    example: '12345678',
    pattern: '^[0-9]{7,9}$',
  })
  @IsNotEmpty({ message: 'El número de DNI es requerido' })
  @IsString({ message: 'El DNI debe ser una cadena de texto' })
  @Matches(/^[0-9]{7,9}$/, {
    message: 'El DNI debe contener entre 7 y 9 dígitos numéricos',
  })
  dniNumber: string;

  @ApiProperty({
    description: 'URL de la foto frontal del DNI',
    example: 'https://storage.example.com/dni/front_12345678.jpg',
  })
  @IsNotEmpty({ message: 'La foto frontal es requerida' })
  @IsString({ message: 'La URL de la foto frontal debe ser una cadena de texto' })
  frontPhotoUrl: string;

  @ApiProperty({
    description: 'URL de la foto trasera del DNI',
    example: 'https://storage.example.com/dni/back_12345678.jpg',
  })
  @IsNotEmpty({ message: 'La foto trasera es requerida' })
  @IsString({ message: 'La URL de la foto trasera debe ser una cadena de texto' })
  backPhotoUrl: string;
}

export class AdminVerifyIdentityDto {
  @ApiProperty({
    description: 'ID de la verificación a procesar',
    example: 1,
  })
  @IsNotEmpty({ message: 'El ID de verificación es requerido' })
  verificationId: number;

  @ApiProperty({
    description: 'Estado de la verificación',
    enum: ['verified', 'rejected'],
    example: 'verified',
  })
  @IsNotEmpty({ message: 'El estado es requerido' })
  @IsEnum(['verified', 'rejected'], {
    message: 'El estado debe ser "verified" o "rejected"',
  })
  status: 'verified' | 'rejected';

  @ApiPropertyOptional({
    description: 'Razón del rechazo (solo si status es "rejected")',
    example: 'Foto frontal no es legible',
  })
  @IsOptional()
  @IsString({ message: 'La razón debe ser una cadena de texto' })
  reason?: string;
}

export class GetVerificationStatusDto {
  @ApiProperty({
    description: 'Estado de la verificación a filtrar',
    enum: IdentityVerificationStatus,
    example: 'pending',
  })
  @IsOptional()
  @IsEnum(IdentityVerificationStatus, {
    message: 'El estado debe ser uno de: pending, verified, rejected',
  })
  status?: IdentityVerificationStatus;

  @ApiPropertyOptional({
    description: 'Número de página',
    example: 1,
    default: 1,
  })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Límite de resultados por página',
    example: 10,
    default: 10,
  })
  @IsOptional()
  limit?: number = 10;
}
