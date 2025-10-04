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
import { SMSVerificationService } from '../services/sms-verification.service';
import { RequestPhoneChangeDto, VerifyPhoneChangeDto, CancelPhoneChangeDto } from '../dto/phone-change.dto';
import { VerificationType } from '../interfaces/verification.interface';

@ApiTags('users')
@Controller('api/user/change-phone')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class PhoneChangeController {
  private readonly logger = new Logger(PhoneChangeController.name);

  constructor(
    private usersService: UsersService,
    private verificationCodesService: VerificationCodesService,
    private smsVerificationService: SMSVerificationService,
  ) {}

  @Post('request')
  @ApiOperation({
    summary: 'Solicitar cambio de teléfono',
    description: `
    Solicita un cambio de teléfono para el usuario autenticado.
    
    **Proceso:**
    1. Valida el formato del nuevo número de teléfono
    2. Verifica que el teléfono no esté en uso
    3. Genera un código de verificación de 6 dígitos
    4. Envía el código por SMS al nuevo número
    5. El código expira en 15 minutos
    
    **Seguridad:**
    - Validación de formato internacional de teléfono
    - Verificación de unicidad del número
    - Máximo 3 intentos de verificación por código
    - Rate limiting: máximo 3 códigos por hora
    - Código válido por 15 minutos únicamente
    `,
  })
  @ApiBody({
    type: RequestPhoneChangeDto,
    description: 'Datos para solicitar cambio de teléfono',
    examples: {
      example1: {
        summary: 'Solicitud básica',
        value: {
          newPhone: '+584121234567',
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
        message: { type: 'string', example: 'Código de verificación enviado por SMS' },
        expiresAt: { type: 'string', format: 'date-time', example: '2024-01-15T10:45:00.000Z' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o teléfono ya en uso',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: 'El teléfono ya está en uso por otro usuario' },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'No autorizado' },
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
  @ApiResponse({
    status: 503,
    description: 'Servicio SMS no disponible',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 503 },
        message: { type: 'string', example: 'Servicio SMS temporalmente no disponible' },
        error: { type: 'string', example: 'Service Unavailable' },
      },
    },
  })
  async requestPhoneChange(
    @GetUser() user: any,
    @Body() requestPhoneChangeDto: RequestPhoneChangeDto,
  ): Promise<{ success: boolean; message: string; expiresAt: Date }> {
    try {
      const { newPhone } = requestPhoneChangeDto;

      this.logger.log(`Phone change request for user ${user.id}, new phone: ${newPhone}`);

      // 1. Verificar que el servicio SMS esté disponible
      if (!this.smsVerificationService.isServiceAvailable()) {
        throw new HttpException(
          'Servicio SMS temporalmente no disponible',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      // 2. Validar formato del teléfono
      const isValidPhone = await this.smsVerificationService.validatePhoneNumber(newPhone);
      if (!isValidPhone) {
        throw new HttpException(
          'Formato de teléfono inválido',
          HttpStatus.BAD_REQUEST,
        );
      }

      // 3. Verificar que el teléfono no esté en uso
      const phoneExists = await this.usersService.findUserByPhone(newPhone);
      if (phoneExists && phoneExists.id !== user.id) {
        throw new HttpException(
          'El teléfono ya está en uso por otro usuario',
          HttpStatus.BAD_REQUEST,
        );
      }

      // 4. Verificar que no haya un código activo
      const canRequest = await this.verificationCodesService.canRequestNewCode(
        user.id,
        VerificationType.PHONE_CHANGE,
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
        VerificationType.PHONE_CHANGE,
        newPhone,
      );

      // 6. Enviar código por SMS
      await this.smsVerificationService.sendVerificationCode({
        phone: newPhone,
        code: verificationCode.code,
        userName: user.name,
      });

      this.logger.log(`Phone change code sent to ${newPhone} for user ${user.id}`);

      return {
        success: true,
        message: 'Código de verificación enviado por SMS',
        expiresAt: verificationCode.expiresAt,
      };
    } catch (error) {
      this.logger.error(`Phone change request failed for user ${user.id}:`, error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Error interno del servidor', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('verify')
  @ApiOperation({
    summary: 'Verificar cambio de teléfono',
    description: `
    Verifica el código de verificación y completa el cambio de teléfono.
    
    **Proceso:**
    1. Valida el código de verificación
    2. Actualiza el teléfono del usuario
    3. Marca el teléfono como verificado
    4. Envía confirmación por SMS al nuevo número
    5. Invalida el código usado
    
    **Seguridad:**
    - Código debe ser válido y no expirado
    - Máximo 3 intentos de verificación
    - Un solo uso por código
    `,
  })
  @ApiBody({
    type: VerifyPhoneChangeDto,
    description: 'Datos para verificar cambio de teléfono',
    examples: {
      example1: {
        summary: 'Verificación básica',
        value: {
          newPhone: '+584121234567',
          code: '123456',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Teléfono cambiado exitosamente',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Teléfono actualizado exitosamente' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            phone: { type: 'string', example: '+584121234567' },
            phoneVerified: { type: 'boolean', example: true },
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
  async verifyPhoneChange(
    @GetUser() user: any,
    @Body() verifyPhoneChangeDto: VerifyPhoneChangeDto,
  ): Promise<{ success: boolean; message: string; user: any }> {
    try {
      const { newPhone, code } = verifyPhoneChangeDto;

      this.logger.log(`Phone change verification for user ${user.id}, new phone: ${newPhone}`);

      // 1. Verificar código
      const verificationResult = await this.verificationCodesService.verifyCode(
        user.id,
        VerificationType.PHONE_CHANGE,
        code,
      );

      if (!verificationResult.success) {
        throw new HttpException(verificationResult.message, HttpStatus.BAD_REQUEST);
      }

      // 2. Actualizar teléfono del usuario
      const updatedUser = await this.usersService.updateUser(user.id, {
        phone: newPhone,
        phoneVerified: true,
      });

      // 3. Enviar confirmación por SMS al nuevo número
      await this.smsVerificationService.sendChangeConfirmation(
        newPhone,
        user.name,
      );

      this.logger.log(`Phone changed successfully for user ${user.id} to ${newPhone}`);

      return {
        success: true,
        message: 'Teléfono actualizado exitosamente',
        user: {
          id: updatedUser.id,
          phone: updatedUser.phone,
          phoneVerified: updatedUser.phoneVerified,
          updatedAt: updatedUser.updatedAt,
        },
      };
    } catch (error) {
      this.logger.error(`Phone change verification failed for user ${user.id}:`, error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Error interno del servidor', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('cancel')
  @ApiOperation({
    summary: 'Cancelar cambio de teléfono',
    description: `
    Cancela una solicitud de cambio de teléfono pendiente.
    
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
    type: CancelPhoneChangeDto,
    description: 'Confirmación para cancelar cambio de teléfono',
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
    description: 'Cambio de teléfono cancelado exitosamente',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Solicitud de cambio de teléfono cancelada' },
      },
    },
  })
  async cancelPhoneChange(
    @GetUser() user: any,
    @Body() cancelPhoneChangeDto: CancelPhoneChangeDto,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const { confirm } = cancelPhoneChangeDto;

      if (!confirm) {
        throw new HttpException('Confirmación requerida para cancelar', HttpStatus.BAD_REQUEST);
      }

      this.logger.log(`Cancelling phone change for user ${user.id}`);

      // Cancelar código de verificación activo
      await this.verificationCodesService.cancelVerificationCode(
        user.id,
        VerificationType.PHONE_CHANGE,
      );

      this.logger.log(`Phone change cancelled for user ${user.id}`);

      return {
        success: true,
        message: 'Solicitud de cambio de teléfono cancelada',
      };
    } catch (error) {
      this.logger.error(`Phone change cancellation failed for user ${user.id}:`, error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Error interno del servidor', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
