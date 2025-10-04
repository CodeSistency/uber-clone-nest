import { Injectable, Logger } from '@nestjs/common';
import { TwilioService } from '../../services/twilio.service';
import { SMSVerificationData } from '../interfaces/verification.interface';

@Injectable()
export class SMSVerificationService {
  private readonly logger = new Logger(SMSVerificationService.name);

  constructor(private twilioService: TwilioService) {}

  /**
   * Envía código de verificación por SMS
   */
  async sendVerificationCode(data: SMSVerificationData): Promise<void> {
    this.logger.log(`Sending verification code to ${data.phone}`);

    const message = this.getSMSMessage(data);

    try {
      const result = await this.twilioService.sendSMS({
        to: data.phone,
        body: message,
      });

      if (result) {
        this.logger.log(`SMS sent successfully to ${data.phone}, SID: ${result.sid}`);
      } else {
        this.logger.warn(`SMS service not available, message not sent to ${data.phone}`);
      }
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${data.phone}:`, error);
      throw error;
    }
  }

  /**
   * Envía confirmación de cambio exitoso
   */
  async sendChangeConfirmation(phone: string, userName?: string): Promise<void> {
    this.logger.log(`Sending change confirmation to ${phone}`);

    const message = this.getConfirmationMessage(userName);

    try {
      const result = await this.twilioService.sendSMS({
        to: phone,
        body: message,
      });

      if (result) {
        this.logger.log(`Confirmation SMS sent successfully to ${phone}, SID: ${result.sid}`);
      } else {
        this.logger.warn(`SMS service not available, confirmation not sent to ${phone}`);
      }
    } catch (error) {
      this.logger.error(`Failed to send confirmation SMS to ${phone}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene el mensaje SMS de verificación
   */
  private getSMSMessage(data: SMSVerificationData): string {
    const { code, userName } = data;
    const greeting = userName ? `Hola ${userName}` : 'Hola';

    return `${greeting}, tu código de verificación es: ${code}. Válido por 15 minutos. Uber Clone`;
  }

  /**
   * Obtiene el mensaje SMS de confirmación
   */
  private getConfirmationMessage(userName?: string): string {
    const greeting = userName ? `Hola ${userName}` : 'Hola';

    return `${greeting}, tu número de teléfono ha sido actualizado exitosamente. Uber Clone`;
  }

  /**
   * Valida el formato del número de teléfono
   */
  async validatePhoneNumber(phone: string): Promise<boolean> {
    return this.twilioService.validatePhoneNumber(phone);
  }

  /**
   * Obtiene el balance de la cuenta Twilio
   */
  async getAccountBalance(): Promise<number | null> {
    return this.twilioService.getAccountBalance();
  }

  /**
   * Verifica si el servicio SMS está disponible
   */
  isServiceAvailable(): boolean {
    return this.twilioService.isInitialized();
  }
}
