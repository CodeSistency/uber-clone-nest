import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { UsersService } from '../users.service';
import { VerificationCodesService } from '../services/verification-codes.service';
import { EmailVerificationService } from '../services/email-verification.service';
import {
  RequestPasswordChangeDto,
  VerifyPasswordChangeDto,
  CancelPasswordChangeDto,
} from '../dto/password-change.dto';
import { VerificationType } from '../interfaces/verification.interface';
import * as bcrypt from 'bcrypt';

@ApiTags('users')
@Controller('api/user/change-password')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class PasswordChangeController {
  private readonly logger = new Logger(PasswordChangeController.name);

  constructor(
    private usersService: UsersService,
    private verificationCodesService: VerificationCodesService,
    private emailVerificationService: EmailVerificationService,
  ) {}

  @Post('request')
  @ApiOperation({
    summary: 'Solicitar cambio de contraseña',
    description: `
    Solicita un cambio de contraseña para el usuario autenticado.
    
    **Proceso:**
    1. Valida la contraseña actual del usuario
    2. Genera un código de verificación de 6 dígitos
    3. Envía el código al email del usuario
    4. El código expira en 15 minutos
    
    **Seguridad:**
    - Requiere contraseña actual para confirmar identidad
    - Máximo 3 intentos de verificación por código
    - Rate limiting: máximo 3 códigos por hora
    - Código válido por 15 minutos únicamente
    `,
  })
  @ApiBody({
    type: RequestPasswordChangeDto,
    description: 'Datos para solicitar cambio de contraseña',
    examples: {
      example1: {
        summary: 'Solicitud básica',
        value: {
          currentPassword: 'MiContraseñaActual123!',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Código de verificación enviado exitosamente',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Código de verificación enviado al email',
        },
        expiresAt: {
          type: 'string',
          format: 'date-time',
          example: '2024-01-15T10:45:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: 'Contraseña actual incorrecta' },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado o contraseña incorrecta',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Contraseña incorrecta' },
        error: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
  @ApiResponse({
    status: 429,
    description: 'Demasiadas solicitudes',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 429 },
        message: {
          type: 'string',
          example: 'Demasiadas solicitudes. Intenta más tarde',
        },
        error: { type: 'string', example: 'Too Many Requests' },
      },
    },
  })
  async requestPasswordChange(
    @GetUser() user: any,
    @Body() requestPasswordChangeDto: RequestPasswordChangeDto,
  ): Promise<{ success: boolean; message: string; expiresAt: Date }> {
    try {
      const { currentPassword } = requestPasswordChangeDto;

      this.logger.log(`Password change request for user ${user.id}`);

      // 1. Obtener usuario actual con contraseña
      const currentUser = await this.usersService.findUserByEmail(user.email);
      if (!currentUser) {
        throw new HttpException('Usuario no encontrado', HttpStatus.NOT_FOUND);
      }

      // 2. Verificar contraseña actual
      if (!currentUser.password) {
        throw new HttpException(
          'Usuario no tiene contraseña configurada',
          HttpStatus.BAD_REQUEST,
        );
      }

      const isPasswordValid = await bcrypt.compare(
        currentPassword,
        currentUser.password,
      );
      if (!isPasswordValid) {
        throw new HttpException(
          'Contraseña actual incorrecta',
          HttpStatus.UNAUTHORIZED,
        );
      }

      // 3. Verificar que no haya un código activo
      const canRequest = await this.verificationCodesService.canRequestNewCode(
        user.id,
        VerificationType.PASSWORD_CHANGE,
      );
      if (!canRequest) {
        throw new HttpException(
          'Ya tienes un código activo o has excedido el límite de solicitudes',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      // 4. Crear código de verificación
      const verificationCode =
        await this.verificationCodesService.createVerificationCode(
          user.id,
          VerificationType.PASSWORD_CHANGE,
          user.email, // Enviar al email actual
        );

      // 5. Enviar código por email
      await this.emailVerificationService.sendVerificationCode({
        email: user.email,
        code: verificationCode.code,
        type: VerificationType.PASSWORD_CHANGE,
        userName: user.name,
      });

      this.logger.log(
        `Password change code sent to ${user.email} for user ${user.id}`,
      );

      return {
        success: true,
        message: 'Código de verificación enviado al email',
        expiresAt: verificationCode.expiresAt,
      };
    } catch (error) {
      this.logger.error(
        `Password change request failed for user ${user.id}:`,
        error,
      );
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error interno del servidor',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('verify')
  @ApiOperation({
    summary: 'Verificar cambio de contraseña',
    description: `
    Verifica el código de verificación y completa el cambio de contraseña.
    
    **Proceso:**
    1. Valida el código de verificación
    2. Encripta la nueva contraseña
    3. Actualiza la contraseña del usuario
    4. Envía confirmación por email
    5. Invalida el código usado
    
    **Seguridad:**
    - Código debe ser válido y no expirado
    - Máximo 3 intentos de verificación
    - Un solo uso por código
    - Contraseña encriptada con bcrypt
    `,
  })
  @ApiBody({
    type: VerifyPasswordChangeDto,
    description: 'Datos para verificar cambio de contraseña',
    examples: {
      example1: {
        summary: 'Verificación básica',
        value: {
          newPassword: 'MiNuevaContraseña456!',
          code: '123456',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Contraseña cambiada exitosamente',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Contraseña actualizada exitosamente',
        },
        user: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            email: { type: 'string', example: 'usuario@example.com' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Código inválido o expirado',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: 'Código inválido o expirado' },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  async verifyPasswordChange(
    @GetUser() user: any,
    @Body() verifyPasswordChangeDto: VerifyPasswordChangeDto,
  ): Promise<{ success: boolean; message: string; user: any }> {
    try {
      const { newPassword, code } = verifyPasswordChangeDto;

      this.logger.log(`Password change verification for user ${user.id}`);

      // 1. Verificar código
      const verificationResult = await this.verificationCodesService.verifyCode(
        user.id,
        VerificationType.PASSWORD_CHANGE,
        code,
      );

      if (!verificationResult.success) {
        throw new HttpException(
          verificationResult.message,
          HttpStatus.BAD_REQUEST,
        );
      }

      // 2. Encriptar nueva contraseña
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // 3. Actualizar contraseña del usuario
      const updatedUser = await this.usersService.updateUser(user.id, {
        password: hashedPassword,
      });

      // 4. Enviar confirmación por email
      await this.emailVerificationService.sendChangeConfirmation(
        user.email,
        VerificationType.PASSWORD_CHANGE,
        user.name,
      );

      this.logger.log(`Password changed successfully for user ${user.id}`);

      return {
        success: true,
        message: 'Contraseña actualizada exitosamente',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          updatedAt: updatedUser.updatedAt,
        },
      };
    } catch (error) {
      this.logger.error(
        `Password change verification failed for user ${user.id}:`,
        error,
      );
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error interno del servidor',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('cancel')
  @ApiOperation({
    summary: 'Cancelar cambio de contraseña',
    description: `
    Cancela una solicitud de cambio de contraseña pendiente.
    
    **Proceso:**
    1. Invalida el código de verificación activo
    2. Limpia la solicitud pendiente
    3. Confirma la cancelación
    
    **Uso:**
    - Útil si el usuario cambió de opinión
    - O si el código expiró y quiere solicitar uno nuevo
    `,
  })
  @ApiBody({
    type: CancelPasswordChangeDto,
    description: 'Confirmación para cancelar cambio de contraseña',
    examples: {
      example1: {
        summary: 'Cancelación básica',
        value: {
          confirm: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Cambio de contraseña cancelado exitosamente',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Solicitud de cambio de contraseña cancelada',
        },
      },
    },
  })
  async cancelPasswordChange(
    @GetUser() user: any,
    @Body() cancelPasswordChangeDto: CancelPasswordChangeDto,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const { confirm } = cancelPasswordChangeDto;

      if (!confirm) {
        throw new HttpException(
          'Confirmación requerida para cancelar',
          HttpStatus.BAD_REQUEST,
        );
      }

      this.logger.log(`Cancelling password change for user ${user.id}`);

      // Cancelar código de verificación activo
      await this.verificationCodesService.cancelVerificationCode(
        user.id,
        VerificationType.PASSWORD_CHANGE,
      );

      this.logger.log(`Password change cancelled for user ${user.id}`);

      return {
        success: true,
        message: 'Solicitud de cambio de contraseña cancelada',
      };
    } catch (error) {
      this.logger.error(
        `Password change cancellation failed for user ${user.id}:`,
        error,
      );
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error interno del servidor',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
