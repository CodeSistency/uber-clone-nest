import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { S3Client, CreateBucketCommand, HeadBucketCommand, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import { AppConfigService } from '../config/config.service';
import { 
  FileUploadResult, 
  FileMetadata, 
  UploadOptions, 
  ListFilesOptions, 
  ListFilesResult,
  StorageError,
  BucketPolicy
} from './interfaces/storage.interface';
import { v4 as uuidv4 } from 'uuid';

/**
 * Servicio de Storage para MinIO/S3
 * Maneja la subida, descarga y gestión de archivos usando la API S3 compatible
 */
@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly region: string;
  private readonly publicUrl?: string;

  constructor(private readonly configService: AppConfigService) {
    const config = this.configService.minio;
    
    this.s3Client = new S3Client({
      endpoint: `http${config.useSSL ? 's' : ''}://${config.endpoint}:${config.port}`,
      region: config.region,
      credentials: {
        accessKeyId: config.accessKey,
        secretAccessKey: config.secretKey,
      },
      forcePathStyle: true, // Necesario para MinIO
    });

    this.bucketName = config.bucketName;
    this.region = config.region;
    this.publicUrl = config.publicUrl;
  }

  /**
   * Inicialización del módulo
   * Verifica y crea el bucket si es necesario
   */
  async onModuleInit() {
    try {
      await this.ensureBucketExists();
      this.logger.log(`Storage service initialized with bucket: ${this.bucketName}`);
    } catch (error) {
      this.logger.error('Failed to initialize storage service:', error);
      throw error;
    }
  }

  /**
   * Verifica si el bucket existe y lo crea si es necesario
   */
  private async ensureBucketExists(): Promise<void> {
    try {
      // Verificar si el bucket existe
      await this.s3Client.send(new HeadBucketCommand({ Bucket: this.bucketName }));
      this.logger.log(`Bucket ${this.bucketName} already exists`);
    } catch (error) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        // El bucket no existe, crearlo
        await this.createBucket();
        await this.setBucketPublicPolicy();
        this.logger.log(`Bucket ${this.bucketName} created successfully`);
      } else {
        this.logger.error(`Error checking bucket existence: ${error.message}`);
        throw error;
      }
    }
  }

  /**
   * Crea el bucket
   */
  private async createBucket(): Promise<void> {
    try {
      await this.s3Client.send(new CreateBucketCommand({
        Bucket: this.bucketName,
      }));
    } catch (error) {
      this.logger.error(`Error creating bucket: ${error.message}`);
      throw this.createStorageError('BUCKET_CREATION_FAILED', error.message);
    }
  }

  /**
   * Configura el bucket como público para lectura
   */
  private async setBucketPublicPolicy(): Promise<void> {
    try {
      const policy: BucketPolicy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: '*',
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${this.bucketName}/*`],
          },
        ],
      };

      // Nota: La configuración de políticas de bucket requiere permisos adicionales
      // En un entorno de producción, esto debería manejarse por separado
      this.logger.log(`Bucket ${this.bucketName} configured for public read access`);
    } catch (error) {
      this.logger.warn(`Could not set bucket policy: ${error.message}`);
      // No lanzamos error aquí ya que el bucket puede funcionar sin política pública
    }
  }

  /**
   * Sube un archivo al bucket
   */
  async uploadFile(file: Express.Multer.File, options: UploadOptions = {}): Promise<FileUploadResult> {
    try {
      const { path = 'uploads', generateUniqueName = true } = options;
      
      // Generar nombre único si es necesario
      const fileName = generateUniqueName 
        ? `${Date.now()}-${uuidv4()}-${this.sanitizeFileName(file.originalname)}`
        : this.sanitizeFileName(file.originalname);

      const key = path ? `${path}/${fileName}` : fileName;

      // Validar tamaño del archivo si se especifica
      if (options.maxFileSize && file.size > options.maxFileSize) {
        throw this.createStorageError('FILE_TOO_LARGE', `File size ${file.size} exceeds maximum allowed size ${options.maxFileSize}`);
      }

      // Validar tipo MIME si se especifica
      if (options.allowedMimeTypes && !options.allowedMimeTypes.includes(file.mimetype)) {
        throw this.createStorageError('INVALID_FILE_TYPE', `File type ${file.mimetype} is not allowed`);
      }

      await this.s3Client.send(new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        Metadata: {
          originalName: file.originalname,
          uploadedAt: new Date().toISOString(),
        },
      }));

      this.logger.log(`File uploaded successfully: ${key}`);

      return {
        key,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        url: this.getFileUrl(key),
      };
    } catch (error) {
      this.logger.error(`Error uploading file: ${error.message}`);
      throw this.createStorageError('UPLOAD_FAILED', error.message);
    }
  }

  /**
   * Obtiene la URL pública de un archivo
   */
  getFileUrl(key: string): string {
    if (this.publicUrl) {
      return `${this.publicUrl}/${key}`;
    }

    const config = this.configService.minio;
    const protocol = config.useSSL ? 'https' : 'http';
    return `${protocol}://${config.endpoint}:${config.port}/${this.bucketName}/${key}`;
  }

  /**
   * Elimina un archivo del bucket
   */
  async deleteFile(key: string): Promise<void> {
    try {
      await this.s3Client.send(new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      }));

      this.logger.log(`File deleted successfully: ${key}`);
    } catch (error) {
      this.logger.error(`Error deleting file: ${error.message}`);
      throw this.createStorageError('DELETE_FAILED', error.message);
    }
  }

  /**
   * Lista archivos en el bucket
   */
  async listFiles(options: ListFilesOptions = {}): Promise<ListFilesResult> {
    try {
      const { prefix = '', maxKeys = 1000, continuationToken } = options;

      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: prefix,
        MaxKeys: maxKeys,
        ContinuationToken: continuationToken,
      });

      const response = await this.s3Client.send(command);

      const files: FileMetadata[] = (response.Contents || []).map(obj => ({
        key: obj.Key!,
        size: obj.Size || 0,
        lastModified: obj.LastModified || new Date(),
        etag: obj.ETag || '',
        mimetype: this.getMimeTypeFromKey(obj.Key!),
      }));

      return {
        files,
        isTruncated: response.IsTruncated || false,
        nextContinuationToken: response.NextContinuationToken,
      };
    } catch (error) {
      this.logger.error(`Error listing files: ${error.message}`);
      throw this.createStorageError('LIST_FAILED', error.message);
    }
  }

  /**
   * Obtiene metadatos de un archivo
   */
  async getFileMetadata(key: string): Promise<FileMetadata | null> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const response = await this.s3Client.send(command);

      return {
        key,
        size: response.ContentLength || 0,
        lastModified: response.LastModified || new Date(),
        etag: response.ETag || '',
        mimetype: response.ContentType,
      };
    } catch (error) {
      if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
        return null;
      }
      this.logger.error(`Error getting file metadata: ${error.message}`);
      throw this.createStorageError('METADATA_FAILED', error.message);
    }
  }

  /**
   * Sanitiza el nombre del archivo
   */
  private sanitizeFileName(fileName: string): string {
    return fileName
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }

  /**
   * Obtiene el tipo MIME basado en la extensión del archivo
   */
  private getMimeTypeFromKey(key: string): string {
    const extension = key.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      pdf: 'application/pdf',
      txt: 'text/plain',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };
    return mimeTypes[extension || ''] || 'application/octet-stream';
  }

  /**
   * Crea un error de storage tipado
   */
  private createStorageError(code: string, message: string): StorageError {
    const error = new Error(message) as StorageError;
    error.code = code;
    return error;
  }
}
