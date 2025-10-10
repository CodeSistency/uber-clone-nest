import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * DTO para la subida de archivos
 */
export class UploadFileDto {
  @ApiProperty({
    description: 'Ruta opcional donde guardar el archivo en el bucket',
    example: 'uploads/2024/10',
    required: false,
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'La ruta no puede exceder 255 caracteres' })
  path?: string;
}
