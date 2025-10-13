import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { StorageController } from './storage.controller';

/**
 * Módulo de Storage
 * Proporciona funcionalidades para la gestión de archivos con MinIO/S3
 *
 * Características:
 * - Subida de archivos con validaciones
 * - Gestión automática de buckets
 * - URLs públicas dinámicas
 * - API compatible con S3
 * - Endpoints de prueba documentados
 */
@Module({
  providers: [StorageService],
  controllers: [StorageController],
  exports: [StorageService], // Exportar para uso en otros módulos
})
export class StorageModule {}
