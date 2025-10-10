# Módulo de Storage - MinIO/S3

Este módulo proporciona funcionalidades completas para la gestión de archivos usando MinIO con API compatible con S3.

## 🚀 Características

- ✅ **Subida de archivos** con validaciones automáticas
- ✅ **Creación automática de buckets** si no existen
- ✅ **Configuración de buckets públicos** para acceso directo
- ✅ **URLs dinámicas** basadas en configuración de entorno
- ✅ **API S3 compatible** - fácil migración a AWS S3
- ✅ **Validaciones de seguridad** (tipo de archivo, tamaño)
- ✅ **Endpoints de prueba** documentados con Swagger
- ✅ **Reutilizable** desde cualquier módulo de la aplicación

## 📁 Estructura

```
src/storage/
├── storage.module.ts          # Módulo principal
├── storage.service.ts         # Servicio con lógica de S3/MinIO
├── storage.controller.ts      # Endpoints de prueba
├── dto/
│   ├── upload-file.dto.ts    # DTOs para validación
│   └── file-response.dto.ts  # Response tipado
├── interfaces/
│   └── storage.interface.ts  # Interfaces compartidas
└── README.md                  # Esta documentación
```

## ⚙️ Configuración

### Variables de Entorno

Añade estas variables a tu archivo `.env`:

```env
# MinIO Configuration
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_USE_SSL=false
MINIO_BUCKET_NAME=uber-clone-uploads
MINIO_REGION=us-east-1
MINIO_PUBLIC_URL=http://localhost:9000  # Opcional, para URLs personalizadas
```

### Instalación de MinIO

Para desarrollo local, puedes usar Docker:

```bash
docker run -p 9000:9000 -p 9001:9001 \
  -e "MINIO_ROOT_USER=minioadmin" \
  -e "MINIO_ROOT_PASSWORD=minioadmin" \
  minio/minio server /data --console-address ":9001"
```

## 🔧 Uso del Servicio

### Inyección en otros servicios

```typescript
import { StorageService } from '../storage/storage.service';

@Injectable()
export class UserService {
  constructor(private readonly storageService: StorageService) {}

  async uploadProfilePicture(file: Express.Multer.File, userId: string) {
    const result = await this.storageService.uploadFile(file, {
      path: `profiles/${userId}`,
      generateUniqueName: true,
      maxFileSize: 5 * 1024 * 1024, // 5MB
      allowedMimeTypes: ['image/jpeg', 'image/png']
    });

    // Guardar solo el key en la base de datos
    await this.prisma.user.update({
      where: { id: userId },
      data: { profilePictureKey: result.key }
    });

    return result;
  }

  async getProfilePictureUrl(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user?.profilePictureKey) {
      return null;
    }

    return this.storageService.getFileUrl(user.profilePictureKey);
  }
}
```

### Métodos Disponibles

#### `uploadFile(file, options)`
Sube un archivo al bucket.

```typescript
const result = await storageService.uploadFile(file, {
  path: 'uploads/2024/10',           // Ruta opcional
  generateUniqueName: true,            // Generar nombre único
  maxFileSize: 10 * 1024 * 1024,      // 10MB máximo
  allowedMimeTypes: ['image/jpeg']     // Tipos permitidos
});
```

#### `getFileUrl(key)`
Obtiene la URL pública de un archivo.

```typescript
const url = storageService.getFileUrl('uploads/2024/10/image.jpg');
// Retorna: http://localhost:9000/uber-clone-uploads/uploads/2024/10/image.jpg
```

#### `deleteFile(key)`
Elimina un archivo del bucket.

```typescript
await storageService.deleteFile('uploads/2024/10/image.jpg');
```

#### `listFiles(options)`
Lista archivos en el bucket.

```typescript
const result = await storageService.listFiles({
  prefix: 'uploads/2024',    // Filtrar por prefijo
  maxKeys: 100              // Máximo de archivos
});
```

#### `getFileMetadata(key)`
Obtiene metadatos de un archivo.

```typescript
const metadata = await storageService.getFileMetadata('uploads/2024/10/image.jpg');
```

## 🌐 Endpoints de Prueba

El módulo incluye endpoints para testing documentados en Swagger:

### Subir Archivo
```http
POST /storage/upload
Content-Type: multipart/form-data

Body:
- file: [archivo]
- path: "uploads/2024/10" (opcional)
```

### Listar Archivos
```http
GET /storage/files?prefix=uploads/2024&maxKeys=100
```

### Obtener Metadatos
```http
GET /storage/files/{key}
```

### Eliminar Archivo
```http
DELETE /storage/files/{key}
```

### Obtener URL Pública
```http
GET /storage/files/{key}/url
```

## 🔒 Validaciones de Seguridad

- **Tipos de archivo permitidos**: Solo tipos seguros por defecto
- **Tamaño máximo**: 10MB por defecto (configurable)
- **Nombres sanitizados**: Caracteres especiales reemplazados
- **Nombres únicos**: UUID para evitar conflictos

## 🚀 Migración a AWS S3

Para migrar a AWS S3, solo necesitas cambiar las variables de entorno:

```env
# AWS S3 Configuration
MINIO_ENDPOINT=s3.amazonaws.com
MINIO_PORT=443
MINIO_ACCESS_KEY=AKIA...
MINIO_SECRET_KEY=...
MINIO_USE_SSL=true
MINIO_BUCKET_NAME=mi-bucket-s3
MINIO_REGION=us-east-1
```

## 📊 Monitoreo y Logs

El servicio incluye logging detallado:

- ✅ Creación de buckets
- ✅ Subida de archivos
- ✅ Eliminación de archivos
- ✅ Errores y excepciones

## 🧪 Testing

Para probar el módulo:

1. **Inicia MinIO** (Docker o instalación local)
2. **Configura las variables de entorno**
3. **Inicia la aplicación**: `npm run start:dev`
4. **Visita Swagger**: `http://localhost:3000/api`
5. **Prueba los endpoints** en la sección "Storage"

## 🔧 Personalización

### Tipos de Archivo Permitidos

Modifica el array `allowedMimeTypes` en el controlador:

```typescript
const allowedMimeTypes = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf',
  // Añadir más tipos según necesidades
];
```

### Tamaño Máximo

Cambia el límite en el controlador:

```typescript
if (file.size > 50 * 1024 * 1024) { // 50MB
  throw new BadRequestException('El archivo es demasiado grande');
}
```

## 🆘 Solución de Problemas

### Error de Conexión
- Verifica que MinIO esté ejecutándose
- Revisa las credenciales en las variables de entorno
- Confirma que el puerto sea correcto

### Error de Bucket
- El servicio crea automáticamente el bucket si no existe
- Verifica permisos de acceso
- Revisa logs para más detalles

### Error de Archivo
- Verifica el tipo MIME del archivo
- Confirma que el tamaño esté dentro del límite
- Revisa que el archivo no esté corrupto
