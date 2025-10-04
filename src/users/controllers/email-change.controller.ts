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
import { RequestEmailChangeDto, VerifyEmailChangeDto, CancelEmailChangeDto } from '../dto/email-change.dto';
import { VerificationType } from '../interfaces/verification.interface';
import * as bcrypt from 'bcrypt';

@ApiTags('users')
@Controller('api/user/change-email')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class EmailChangeController {
  private readonly logger = new Logger(EmailChangeController.name);

  constructor(
    private usersService: UsersService,
    private verificationCodesService: VerificationCodesService,
    private emailVerificationService: EmailVerificationService,
  ) {}

  @Post('request')
  @ApiOperation({
    summary: 'Solicitar cambio de email',
    description: `
    Solicita un cambio de email para el usuario autenticado.
    
    **Proceso:**
    1. Valida la contraseña actual del usuario
    2. Verifica que el nuevo email no esté en uso
    3. Genera un código de verificación de 6 dígitos
    4. Envía el código al nuevo email
    5. El código expira en 15 minutos
    
    **Seguridad:**
    - Requiere contraseña actual para confirmar identidad
    - Máximo 3 intentos de verificación por código
    - Rate limiting: máximo 3 códigos por hora
    - Código válido por 15 minutos únicamente
    `,
  })
  @ApiBody({
    type: RequestEmailChangeDto,
    description: 'Datos para solicitar cambio de email',
    examples: {
      example1: {
        summary: 'Solicitud básica',
        value: {
          newEmail: 'nuevo.email@example.com',
          password: 'MiContraseña123!',
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
        message: { type: 'string', example: 'Código de verificación enviado al nuevo email' },
        expiresAt: { type: 'string', format: 'date-time', example: '2024-01-15T10:45:00.000Z' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o email ya en uso',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: 'El email ya está en uso por otro usuario' },
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
        message: { type: 'string', example: 'Demasiadas solicitudes. Intenta más tarde' },
        error: { type: 'string', example: 'Too Many Requests' },
      },
    },
  })
  async requestEmailChange(
    @GetUser() user: any,
    @Body() requestEmailChangeDto: RequestEmailChangeDto,
  ): Promise<{ success: boolean; message: string; expiresAt: Date }> {
    try {
      const { newEmail, password } = requestEmailChangeDto;

      this.logger.log(`Email change request for user ${user.id}, new email: ${newEmail}`);

      // 1. Obtener usuario actual con contraseña
      const currentUser = await this.usersService.findUserByEmail(user.email);
      if (!currentUser) {
        throw new HttpException('Usuario no encontrado', HttpStatus.NOT_FOUND);
      }

      // 2. Verificar contraseña actual
      if (!currentUser.password) {
        throw new HttpException('Usuario no tiene contraseña configurada', HttpStatus.BAD_REQUEST);
      }

      const isPasswordValid = await bcrypt.compare(password, currentUser.password);
      if (!isPasswordValid) {
        throw new HttpException('Contraseña incorrecta', HttpStatus.UNAUTHORIZED);
      }

      // 3. Verificar que el nuevo email no esté en uso
      const emailExists = await this.usersService.findUserByEmail(newEmail);
      if (emailExists && emailExists.id !== user.id) {
        throw new HttpException('El email ya está en uso por otro usuario', HttpStatus.BAD_REQUEST);
      }

      // 4. Verificar que no haya un código activo
      const canRequest = await this.verificationCodesService.canRequestNewCode(
        user.id,
        VerificationType.EMAIL_CHANGE,
      );
      if (!canRequest) {
        throw new HttpException(
          'Ya tienes un código activo o has excedido el límite de solicitudes',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      // 5. Crear código de verificación
      const verificationCode = await this.verificationCodesService.createVerificationCode(
        user.id,
        VerificationType.EMAIL_CHANGE,
        newEmail,
      );

      // 6. Enviar código por email
      await this.emailVerificationService.sendVerificationCode({
        email: newEmail,
        code: verificationCode.code,
        type: VerificationType.EMAIL_CHANGE,
        userName: user.name,
      });

      this.logger.log(`Email change code sent to ${newEmail} for user ${user.id}`);

      return {
        success: true,
        message: 'Código de verificación enviado al nuevo email',
        expiresAt: verificationCode.expiresAt,
      };
    } catch (error) {
      this.logger.error(`Email change request failed for user ${user.id}:`, error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Error interno del servidor', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('verify')
  @ApiOperation({
    summary: 'Verificar cambio de email',
    description: `
    Verifica el código de verificación y completa el cambio de email.
    
    **Proceso:**
    1. Valida el código de verificación
    2. Actualiza el email del usuario
    3. Marca el email como verificado
    4. Envía confirmación al nuevo email
    5. Invalida el código usado
    
    **Seguridad:**
    - Código debe ser válido y no expirado
    - Máximo 3 intentos de verificación
    - Un solo uso por código
    `,
  })
  @ApiBody({
    type: VerifyEmailChangeDto,
    description: 'Datos para verificar cambio de email',
    examples: {
      example1: {
        summary: 'Verificación básica',
        value: {
          newEmail: 'nuevo.email@example.com',
          code: '123456',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Email cambiado exitosamente',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Email actualizado exitosamente' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            email: { type: 'string', example: 'nuevo.email@example.com' },
            emailVerified: { type: 'boolean', example: true },
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
  async verifyEmailChange(
    @GetUser() user: any,
    @Body() verifyEmailChangeDto: VerifyEmailChangeDto,
  ): Promise<{ success: boolean; message: string; user: any }> {
    try {
      const { newEmail, code } = verifyEmailChangeDto;

      this.logger.log(`Email change verification for user ${user.id}, new email: ${newEmail}`);

      // 1. Verificar código
      const verificationResult = await this.verificationCodesService.verifyCode(
        user.id,
        VerificationType.EMAIL_CHANGE,
        code,
      );

      if (!verificationResult.success) {
        throw new HttpException(verificationResult.message, HttpStatus.BAD_REQUEST);
      }

      // 2. Actualizar email del usuario
      const updatedUser = await this.usersService.updateUser(user.id, {
        email: newEmail,
        emailVerified: true,
      });

      // 3. Enviar confirmación al nuevo email
      await this.emailVerificationService.sendChangeConfirmation(
        newEmail,
        VerificationType.EMAIL_CHANGE,
        user.name,
      );

      this.logger.log(`Email changed successfully for user ${user.id} to ${newEmail}`);

      return {
        success: true,
        message: 'Email actualizado exitosamente',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          emailVerified: updatedUser.emailVerified,
          updatedAt: updatedUser.updatedAt,
        },
      };
    } catch (error) {
      this.logger.error(`Email change verification failed for user ${user.id}:`, error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Error interno del servidor', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('cancel')
  @ApiOperation({
    summary: 'Cancelar cambio de email',
    description: `
    Cancela una solicitud de cambio de email pendiente.
    
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
    type: CancelEmailChangeDto,
    description: 'Confirmación para cancelar cambio de email',
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
    description: 'Cambio de email cancelado exitosamente',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Solicitud de cambio de email cancelada' },
      },
    },
  })
  async cancelEmailChange(
    @GetUser() user: any,
    @Body() cancelEmailChangeDto: CancelEmailChangeDto,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const { confirm } = cancelEmailChangeDto;

      if (!confirm) {
        throw new HttpException('Confirmación requerida para cancelar', HttpStatus.BAD_REQUEST);
      }

      this.logger.log(`Cancelling email change for user ${user.id}`);

      // Cancelar código de verificación activo
      await this.verificationCodesService.cancelVerificationCode(
        user.id,
        VerificationType.EMAIL_CHANGE,
      );

      this.logger.log(`Email change cancelled for user ${user.id}`);

      return {
        success: true,
        message: 'Solicitud de cambio de email cancelada',
      };
    } catch (error) {
      this.logger.error(`Email change cancellation failed for user ${user.id}:`, error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Error interno del servidor', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
