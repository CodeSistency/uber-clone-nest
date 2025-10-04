import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Param,
  UseGuards,
  HttpException,
  HttpStatus,
  Logger,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { IdentityVerificationService } from '../services/identity-verification.service';
import { SubmitIdentityVerificationDto, AdminVerifyIdentityDto, GetVerificationStatusDto } from '../dto/identity-verification.dto';
import { IdentityVerificationStatus } from '../interfaces/verification.interface';

@ApiTags('users')
@Controller('api/user/identity-verification')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class IdentityVerificationController {
  private readonly logger = new Logger(IdentityVerificationController.name);

  constructor(
    private identityVerificationService: IdentityVerificationService,
  ) {}

  @Post('submit')
  @ApiOperation({
    summary: 'Enviar verificación de identidad',
    description: `
    Envía una solicitud de verificación de identidad con DNI y fotos.
    
    **Proceso:**
    1. Valida el formato del DNI
    2. Verifica que el DNI no esté en uso
    3. Crea la solicitud de verificación
    4. Espera revisión manual por administradores
    
    **Requisitos:**
    - DNI entre 7-9 dígitos
    - Foto frontal del DNI (URL)
    - Foto trasera del DNI (URL)
    - Solo una solicitud por usuario
    
    **Estados:**
    - pending: Esperando revisión
    - verified: Aprobada por admin
    - rejected: Rechazada por admin
    `,
  })
  @ApiBody({
    type: SubmitIdentityVerificationDto,
    description: 'Datos para verificación de identidad',
    examples: {
      example1: {
        summary: 'Solicitud básica',
        value: {
          dniNumber: '12345678',
          frontPhotoUrl: 'https://storage.example.com/dni/front_12345678.jpg',
          backPhotoUrl: 'https://storage.example.com/dni/back_12345678.jpg',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Solicitud de verificación enviada exitosamente',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Solicitud de verificación enviada exitosamente' },
        verification: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            dniNumber: { type: 'string', example: '12345678' },
            status: { type: 'string', example: 'pending' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o DNI ya en uso',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: 'Este número de DNI ya está registrado por otro usuario' },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Solicitud ya existe',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 409 },
        message: { type: 'string', example: 'Ya tienes una solicitud de verificación de identidad pendiente' },
        error: { type: 'string', example: 'Conflict' },
      },
    },
  })
  async submitIdentityVerification(
    @GetUser() user: any,
    @Body() submitIdentityVerificationDto: SubmitIdentityVerificationDto,
  ): Promise<{ success: boolean; message: string; verification: any }> {
    try {
      const { dniNumber, frontPhotoUrl, backPhotoUrl } = submitIdentityVerificationDto;

      this.logger.log(`Identity verification submission for user ${user.id}, DNI: ${dniNumber}`);

      // 1. Validar formato del DNI
      if (!this.identityVerificationService.validateDNIFormat(dniNumber)) {
        throw new HttpException(
          'Formato de DNI inválido. Debe contener entre 7 y 9 dígitos',
          HttpStatus.BAD_REQUEST,
        );
      }

      // 2. Crear solicitud de verificación
      const verification = await this.identityVerificationService.createVerificationRequest(
        user.id,
        dniNumber,
        frontPhotoUrl,
        backPhotoUrl,
      );

      this.logger.log(`Identity verification submitted: ${verification.id} for user ${user.id}`);

      return {
        success: true,
        message: 'Solicitud de verificación enviada exitosamente',
        verification: {
          id: verification.id,
          dniNumber: verification.dniNumber,
          status: verification.status,
          createdAt: verification.createdAt,
        },
      };
    } catch (error) {
      this.logger.error(`Identity verification submission failed for user ${user.id}:`, error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Error interno del servidor', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('status')
  @ApiOperation({
    summary: 'Obtener estado de verificación',
    description: `
    Obtiene el estado actual de la verificación de identidad del usuario.
    
    **Respuesta incluye:**
    - Estado actual (pending, verified, rejected)
    - Fecha de verificación (si aplica)
    - Razón de rechazo (si aplica)
    - Información de la solicitud
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Estado de verificación obtenido exitosamente',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        verification: {
          type: 'object',
          properties: {
            isVerified: { type: 'boolean', example: false },
            status: { type: 'string', example: 'pending' },
            verifiedAt: { type: 'string', format: 'date-time', nullable: true },
            rejectionReason: { type: 'string', nullable: true },
            dniNumber: { type: 'string', example: '12345678' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  })
  async getVerificationStatus(
    @GetUser() user: any,
  ): Promise<{ success: boolean; verification: any }> {
    try {
      this.logger.log(`Getting verification status for user ${user.id}`);

      const verificationStatus = await this.identityVerificationService.getUserVerificationStatus(user.id);
      const verification = await this.identityVerificationService.getUserVerification(user.id);

      return {
        success: true,
        verification: {
          ...verificationStatus,
          dniNumber: verification?.dniNumber,
          createdAt: verification?.createdAt,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to get verification status for user ${user.id}:`, error);
      throw new HttpException('Error interno del servidor', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('admin/pending')
  @ApiOperation({
    summary: 'Obtener verificaciones pendientes (Admin)',
    description: `
    Obtiene todas las solicitudes de verificación de identidad pendientes.
    
    **Solo para administradores:**
    - Lista todas las solicitudes pendientes
    - Incluye información del usuario
    - Ordenadas por fecha de creación
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Verificaciones pendientes obtenidas exitosamente',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        verifications: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              dniNumber: { type: 'string', example: '12345678' },
              status: { type: 'string', example: 'pending' },
              createdAt: { type: 'string', format: 'date-time' },
              user: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 1 },
                  name: { type: 'string', example: 'Juan Pérez' },
                  email: { type: 'string', example: 'juan@example.com' },
                  phone: { type: 'string', example: '+584121234567' },
                },
              },
            },
          },
        },
      },
    },
  })
  async getPendingVerifications(): Promise<{ success: boolean; verifications: any[] }> {
    try {
      this.logger.log('Getting pending identity verifications');

      const verifications = await this.identityVerificationService.getPendingVerifications();

      return {
        success: true,
        verifications,
      };
    } catch (error) {
      this.logger.error('Failed to get pending verifications:', error);
      throw new HttpException('Error interno del servidor', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('admin/verify')
  @ApiOperation({
    summary: 'Verificar identidad (Admin)',
    description: `
    Procesa una solicitud de verificación de identidad como administrador.
    
    **Proceso:**
    1. Busca la solicitud de verificación
    2. Actualiza el estado (verified/rejected)
    3. Si se aprueba, actualiza el usuario
    4. Registra quién procesó la solicitud
    
    **Solo para administradores:**
    - Requiere permisos de administrador
    - Puede aprobar o rechazar solicitudes
    - Debe proporcionar razón si rechaza
    `,
  })
  @ApiBody({
    type: AdminVerifyIdentityDto,
    description: 'Datos para verificar identidad',
    examples: {
      example1: {
        summary: 'Aprobar verificación',
        value: {
          verificationId: 1,
          status: 'verified',
        },
      },
      example2: {
        summary: 'Rechazar verificación',
        value: {
          verificationId: 1,
          status: 'rejected',
          reason: 'Foto frontal no es legible',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Verificación procesada exitosamente',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Verificación procesada exitosamente' },
        verification: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            status: { type: 'string', example: 'verified' },
            verifiedAt: { type: 'string', format: 'date-time' },
            verifiedBy: { type: 'number', example: 1 },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Solicitud no encontrada',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Solicitud de verificación no encontrada' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  async verifyIdentity(
    @GetUser() admin: any,
    @Body() adminVerifyIdentityDto: AdminVerifyIdentityDto,
  ): Promise<{ success: boolean; message: string; verification: any }> {
    try {
      const { verificationId, status, reason } = adminVerifyIdentityDto;

      this.logger.log(`Admin ${admin.id} processing verification ${verificationId}, status: ${status}`);

      const verification = await this.identityVerificationService.verifyIdentity(
        verificationId,
        admin.id,
        status as any,
        reason,
      );

      this.logger.log(`Verification ${verificationId} processed by admin ${admin.id}`);

      return {
        success: true,
        message: 'Verificación procesada exitosamente',
        verification: {
          id: verification.id,
          status: verification.status,
          verifiedAt: verification.verifiedAt,
          verifiedBy: verification.verifiedBy,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to process verification:`, error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Error interno del servidor', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('admin/stats')
  @ApiOperation({
    summary: 'Obtener estadísticas de verificación (Admin)',
    description: `
    Obtiene estadísticas generales de verificación de identidad.
    
    **Estadísticas incluidas:**
    - Total de solicitudes
    - Pendientes
    - Verificadas
    - Rechazadas
    
    **Solo para administradores:**
    - Requiere permisos de administrador
    - Datos agregados de todas las verificaciones
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas obtenidas exitosamente',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        stats: {
          type: 'object',
          properties: {
            total: { type: 'number', example: 100 },
            pending: { type: 'number', example: 25 },
            verified: { type: 'number', example: 70 },
            rejected: { type: 'number', example: 5 },
          },
        },
      },
    },
  })
  async getVerificationStats(): Promise<{ success: boolean; stats: any }> {
    try {
      this.logger.log('Getting identity verification stats');

      const stats = await this.identityVerificationService.getVerificationStats();

      return {
        success: true,
        stats,
      };
    } catch (error) {
      this.logger.error('Failed to get verification stats:', error);
      throw new HttpException('Error interno del servidor', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('admin/verifications')
  @ApiOperation({
    summary: 'Obtener verificaciones por estado (Admin)',
    description: `
    Obtiene verificaciones filtradas por estado con paginación.
    
    **Filtros disponibles:**
    - pending: Solo pendientes
    - verified: Solo verificadas
    - rejected: Solo rechazadas
    
    **Paginación:**
    - page: Número de página (default: 1)
    - limit: Resultados por página (default: 10)
    
    **Solo para administradores:**
    - Requiere permisos de administrador
    - Incluye información del usuario
    - Ordenadas por fecha de creación
    `,
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: IdentityVerificationStatus,
    description: 'Estado de verificación a filtrar',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Número de página',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Límite de resultados por página',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Verificaciones obtenidas exitosamente',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              dniNumber: { type: 'string', example: '12345678' },
              status: { type: 'string', example: 'pending' },
              createdAt: { type: 'string', format: 'date-time' },
              user: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 1 },
                  name: { type: 'string', example: 'Juan Pérez' },
                  email: { type: 'string', example: 'juan@example.com' },
                },
              },
            },
          },
        },
        pagination: {
          type: 'object',
          properties: {
            total: { type: 'number', example: 100 },
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 10 },
            totalPages: { type: 'number', example: 10 },
          },
        },
      },
    },
  })
  async getVerificationsByStatus(
    @Query() query: GetVerificationStatusDto,
  ): Promise<{ success: boolean; data: any[]; pagination: any }> {
    try {
      const { status, page = 1, limit = 10 } = query;

      this.logger.log(`Getting verifications by status: ${status}, page: ${page}, limit: ${limit}`);

      const result = await this.identityVerificationService.getVerificationsByStatus(
        status as any,
        page,
        limit,
      );

      return {
        success: true,
        data: result.data,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      };
    } catch (error) {
      this.logger.error('Failed to get verifications by status:', error);
      throw new HttpException('Error interno del servidor', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
