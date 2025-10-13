import { Injectable, Logger } from '@nestjs/common';
import { NotificationManagerService } from '../../notifications/notification-manager.service';
import { EmailVerificationData } from '../interfaces/verification.interface';

@Injectable()
export class EmailVerificationService {
  private readonly logger = new Logger(EmailVerificationService.name);

  constructor(private notificationManager: NotificationManagerService) {}

  /**
   * Envía código de verificación por email
   */
  async sendVerificationCode(data: EmailVerificationData): Promise<void> {
    this.logger.log(
      `Sending verification code to ${data.email} for type: ${data.type}`,
    );

    const subject = this.getEmailSubject(data.type);
    const message = this.getEmailMessage(data);

    try {
      await this.notificationManager.sendNotification({
        userId: '0', // Se enviará por email directo
        type: 'email_verification' as any,
        title: subject,
        message,
        data: {
          email: data.email,
          code: data.code,
          type: data.type,
          userName: data.userName,
        },
        channels: ['email'] as any,
        priority: 'high',
      });

      this.logger.log(`Verification code sent successfully to ${data.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send verification code to ${data.email}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Envía confirmación de cambio exitoso
   */
  async sendChangeConfirmation(
    email: string,
    type: string,
    userName?: string,
  ): Promise<void> {
    this.logger.log(
      `Sending change confirmation to ${email} for type: ${type}`,
    );

    const subject = this.getConfirmationSubject(type);
    const message = this.getConfirmationMessage(type, userName);

    try {
      await this.notificationManager.sendNotification({
        userId: '0', // Se enviará por email directo
        type: 'change_confirmation' as any,
        title: subject,
        message,
        data: {
          email,
          type,
          userName,
        },
        channels: ['email'] as any,
        priority: 'normal',
      });

      this.logger.log(`Change confirmation sent successfully to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send change confirmation to ${email}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Obtiene el asunto del email según el tipo de verificación
   */
  private getEmailSubject(type: string): string {
    const subjects = {
      email_change: 'Código de verificación para cambio de email',
      password_change: 'Código de verificación para cambio de contraseña',
      phone_change: 'Código de verificación para cambio de teléfono',
      identity_verification:
        'Código de verificación para verificación de identidad',
    };

    return subjects[type] || 'Código de verificación';
  }

  /**
   * Obtiene el mensaje del email según el tipo de verificación
   */
  private getEmailMessage(data: EmailVerificationData): string {
    const { type, code, userName } = data;
    const greeting = userName ? `Hola ${userName}` : 'Hola';

    const messages = {
      email_change: `
${greeting},

Has solicitado cambiar tu dirección de email. Para completar este proceso, utiliza el siguiente código de verificación:

🔐 Código: ${code}

Este código expirará en 15 minutos por seguridad.

Si no solicitaste este cambio, por favor ignora este email.

Saludos,
El equipo de Uber Clone
      `,
      password_change: `
${greeting},

Has solicitado cambiar tu contraseña. Para completar este proceso, utiliza el siguiente código de verificación:

🔐 Código: ${code}

Este código expirará en 15 minutos por seguridad.

Si no solicitaste este cambio, por favor ignora este email.

Saludos,
El equipo de Uber Clone
      `,
      phone_change: `
${greeting},

Has solicitado cambiar tu número de teléfono. Para completar este proceso, utiliza el siguiente código de verificación:

🔐 Código: ${code}

Este código expirará en 15 minutos por seguridad.

Si no solicitaste este cambio, por favor ignora este email.

Saludos,
El equipo de Uber Clone
      `,
      identity_verification: `
${greeting},

Has solicitado verificar tu identidad. Para completar este proceso, utiliza el siguiente código de verificación:

🔐 Código: ${code}

Este código expirará en 15 minutos por seguridad.

Si no solicitaste esta verificación, por favor ignora este email.

Saludos,
El equipo de Uber Clone
      `,
    };

    return (
      messages[type] ||
      `
${greeting},

Utiliza el siguiente código de verificación:

🔐 Código: ${code}

Este código expirará en 15 minutos por seguridad.

Saludos,
El equipo de Uber Clone
    `
    );
  }

  /**
   * Obtiene el asunto del email de confirmación
   */
  private getConfirmationSubject(type: string): string {
    const subjects = {
      email_change: 'Email actualizado exitosamente',
      password_change: 'Contraseña actualizada exitosamente',
      phone_change: 'Teléfono actualizado exitosamente',
      identity_verification: 'Verificación de identidad completada',
    };

    return subjects[type] || 'Cambio completado exitosamente';
  }

  /**
   * Obtiene el mensaje del email de confirmación
   */
  private getConfirmationMessage(type: string, userName?: string): string {
    const greeting = userName ? `Hola ${userName}` : 'Hola';

    const messages = {
      email_change: `
${greeting},

Tu dirección de email ha sido actualizada exitosamente.

Si no realizaste este cambio, por favor contacta a soporte inmediatamente.

Saludos,
El equipo de Uber Clone
      `,
      password_change: `
${greeting},

Tu contraseña ha sido actualizada exitosamente.

Si no realizaste este cambio, por favor contacta a soporte inmediatamente.

Saludos,
El equipo de Uber Clone
      `,
      phone_change: `
${greeting},

Tu número de teléfono ha sido actualizado exitosamente.

Si no realizaste este cambio, por favor contacta a soporte inmediatamente.

Saludos,
El equipo de Uber Clone
      `,
      identity_verification: `
${greeting},

Tu verificación de identidad ha sido completada exitosamente.

Ahora puedes disfrutar de todas las funcionalidades de la plataforma.

Saludos,
El equipo de Uber Clone
      `,
    };

    return (
      messages[type] ||
      `
${greeting},

Tu solicitud ha sido procesada exitosamente.

Saludos,
El equipo de Uber Clone
    `
    );
  }
}
