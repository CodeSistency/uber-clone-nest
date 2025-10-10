import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para la respuesta de subida de archivos
 */
export class FileResponseDto {
  @ApiProperty({
    description: 'Clave única del archivo en el bucket',
    example: 'uploads/2024/10/10/1739123456789-profile-picture.jpg',
  })
  key: string;

  @ApiProperty({
    description: 'Nombre original del archivo',
    example: 'profile-picture.jpg',
  })
  originalName: string;

  @ApiProperty({
    description: 'Tamaño del archivo en bytes',
    example: 123456,
  })
  size: number;

  @ApiProperty({
    description: 'Tipo MIME del archivo',
    example: 'image/jpeg',
  })
  mimetype: string;

  @ApiProperty({
    description: 'URL pública del archivo (opcional)',
    example: 'http://localhost:9000/uber-clone-uploads/uploads/2024/10/10/1739123456789-profile-picture.jpg',
    required: false,
  })
  url?: string;
}
