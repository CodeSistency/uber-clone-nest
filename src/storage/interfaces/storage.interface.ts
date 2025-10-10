/**
 * Interfaces para el módulo de Storage
 * Define los contratos de datos para operaciones con MinIO/S3
 */

export interface FileUploadResult {
  key: string;
  originalName: string;
  size: number;
  mimetype: string;
  url?: string;
}

export interface FileMetadata {
  key: string;
  size: number;
  lastModified: Date;
  etag: string;
  mimetype?: string;
}

export interface StorageConfig {
  endpoint: string;
  port: number;
  accessKey: string;
  secretKey: string;
  useSSL: boolean;
  bucketName: string;
  region: string;
  publicUrl?: string;
}

export interface UploadOptions {
  path?: string;
  generateUniqueName?: boolean;
  allowedMimeTypes?: string[];
  maxFileSize?: number;
}

export interface ListFilesOptions {
  prefix?: string;
  maxKeys?: number;
  continuationToken?: string;
}

export interface ListFilesResult {
  files: FileMetadata[];
  isTruncated: boolean;
  nextContinuationToken?: string;
}

export interface StorageError extends Error {
  code: string;
  statusCode?: number;
  requestId?: string;
}

export interface BucketPolicy {
  Version: string;
  Statement: Array<{
    Effect: string;
    Principal: string;
    Action: string[];
    Resource: string[];
  }>;
}
