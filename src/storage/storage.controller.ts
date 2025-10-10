import { 
  Controller, 
  Post, 
  UploadedFile, 
  UseInterceptors, 
  Body,
  Get,
  Query,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  BadRequestException,
  NotFoundException
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody, ApiQuery, ApiParam } from '@nestjs/swagger';
import { StorageService } from './storage.service';
import { UploadFileDto } from './dto/upload-file.dto';
import { FileResponseDto } from './dto/file-response.dto';
import { ListFilesOptions } from './interfaces/storage.interface';

/**
 * Controlador para operaciones de Storage
 * Proporciona endpoints para subir, listar y eliminar archivos
 */
@ApiTags('Storage')
@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  /**
   * Sube un archivo al bucket
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ 
    summary: 'Subir archivo',
    description: 'Sube un archivo al bucket de MinIO/S3 y retorna la información del archivo subido'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Archivo a subir',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Archivo a subir'
        },
        path: {
          type: 'string',
          description: 'Ruta opcional donde guardar el archivo',
          example: 'uploads/2024/10'
        }
      },
      required: ['file']
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Archivo subido exitosamente',
    type: FileResponseDto
  })
  @ApiResponse({
    status: 400,
    description: 'Error en la validación del archivo'
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor'
  })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadDto: UploadFileDto
  ): Promise<FileResponseDto> {
    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }

    // Validaciones básicas
    if (file.size === 0) {
      throw new BadRequestException('El archivo está vacío');
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB máximo
      throw new BadRequestException('El archivo es demasiado grande (máximo 10MB)');
    }

    // Tipos de archivo permitidos
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(`Tipo de archivo no permitido: ${file.mimetype}`);
    }

    try {
      const result = await this.storageService.uploadFile(file, {
        path: uploadDto.path,
        generateUniqueName: true,
        maxFileSize: 10 * 1024 * 1024, // 10MB
        allowedMimeTypes
      });

      return result;
    } catch (error) {
      throw new BadRequestException(`Error al subir el archivo: ${error.message}`);
    }
  }

  /**
   * Lista archivos en el bucket
   */
  @Get('files')
  @ApiOperation({ 
    summary: 'Listar archivos',
    description: 'Lista archivos en el bucket con opciones de filtrado'
  })
  @ApiQuery({
    name: 'prefix',
    required: false,
    description: 'Prefijo para filtrar archivos',
    example: 'uploads/2024'
  })
  @ApiQuery({
    name: 'maxKeys',
    required: false,
    description: 'Número máximo de archivos a retornar',
    example: 100
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de archivos obtenida exitosamente'
  })
  async listFiles(
    @Query('prefix') prefix?: string,
    @Query('maxKeys') maxKeys?: number
  ) {
    try {
      const options: ListFilesOptions = {
        prefix,
        maxKeys: maxKeys ? parseInt(maxKeys.toString(), 10) : 1000
      };

      const result = await this.storageService.listFiles(options);
      return {
        success: true,
        data: result
      };
    } catch (error) {
      throw new BadRequestException(`Error al listar archivos: ${error.message}`);
    }
  }

  /**
   * Obtiene metadatos de un archivo específico
   */
  @Get('files/:key')
  @ApiOperation({ 
    summary: 'Obtener metadatos de archivo',
    description: 'Obtiene los metadatos de un archivo específico'
  })
  @ApiParam({
    name: 'key',
    description: 'Clave del archivo en el bucket',
    example: 'uploads/2024/10/10/1739123456789-profile-picture.jpg'
  })
  @ApiResponse({
    status: 200,
    description: 'Metadatos del archivo obtenidos exitosamente'
  })
  @ApiResponse({
    status: 404,
    description: 'Archivo no encontrado'
  })
  async getFileMetadata(@Param('key') key: string) {
    try {
      const metadata = await this.storageService.getFileMetadata(key);
      
      if (!metadata) {
        throw new NotFoundException('Archivo no encontrado');
      }

      return {
        success: true,
        data: metadata
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Error al obtener metadatos: ${error.message}`);
    }
  }

  /**
   * Elimina un archivo del bucket
   */
  @Delete('files/:key')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ 
    summary: 'Eliminar archivo',
    description: 'Elimina un archivo del bucket'
  })
  @ApiParam({
    name: 'key',
    description: 'Clave del archivo en el bucket',
    example: 'uploads/2024/10/10/1739123456789-profile-picture.jpg'
  })
  @ApiResponse({
    status: 204,
    description: 'Archivo eliminado exitosamente'
  })
  @ApiResponse({
    status: 404,
    description: 'Archivo no encontrado'
  })
  async deleteFile(@Param('key') key: string) {
    try {
      await this.storageService.deleteFile(key);
      return {
        success: true,
        message: 'Archivo eliminado exitosamente'
      };
    } catch (error) {
      throw new BadRequestException(`Error al eliminar archivo: ${error.message}`);
    }
  }

  /**
   * Obtiene la URL pública de un archivo
   */
  @Get('files/:key/url')
  @ApiOperation({ 
    summary: 'Obtener URL pública',
    description: 'Obtiene la URL pública de un archivo'
  })
  @ApiParam({
    name: 'key',
    description: 'Clave del archivo en el bucket',
    example: 'uploads/2024/10/10/1739123456789-profile-picture.jpg'
  })
  @ApiResponse({
    status: 200,
    description: 'URL pública obtenida exitosamente'
  })
  async getFileUrl(@Param('key') key: string) {
    try {
      const url = this.storageService.getFileUrl(key);
      return {
        success: true,
        data: {
          key,
          url
        }
      };
    } catch (error) {
      throw new BadRequestException(`Error al obtener URL: ${error.message}`);
    }
  }
}
