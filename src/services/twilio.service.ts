import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfigService } from '../config/config.service';
import { Twilio } from 'twilio';

export interface SMSMessage {
  to: string;
  body: string;
  from?: string;
}

export interface SMSResponse {
  sid: string;
  status: string;
  to: string;
  from: string;
  body: string;
  dateCreated: Date;
}

@Injectable()
export class TwilioService {
  private readonly logger = new Logger(TwilioService.name);
  private twilioClient: Twilio | null = null;
  private defaultFromNumber: string | null = null;

  constructor(
    private configService: ConfigService,
    private appConfigService: AppConfigService,
  ) {
    this.initializeTwilio();
  }

  private initializeTwilio(): void {
    try {
      const twilioConfig = this.appConfigService.twilio;

      if (!twilioConfig.isConfigured()) {
        this.logger.warn(
          'Twilio configuration not found. SMS functionality will be disabled.',
        );
        return;
      }

      this.defaultFromNumber = twilioConfig.phoneNumber!;
      this.twilioClient = new Twilio(twilioConfig.accountSid!, twilioConfig.authToken!);
      this.logger.log('Twilio client initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Twilio:', error);
      this.twilioClient = null;
    }
  }

  async sendSMS(message: SMSMessage): Promise<SMSResponse | null> {
    if (!this.twilioClient) {
      this.logger.warn('Twilio not initialized, skipping SMS');
      return null;
    }

    try {
      const fromNumber = message.from || this.defaultFromNumber;
      if (!fromNumber) {
        throw new Error('No sender phone number configured');
      }

      const twilioMessage = await this.twilioClient.messages.create({
        body: message.body,
        from: fromNumber,
        to: message.to,
      });

      const response: SMSResponse = {
        sid: twilioMessage.sid,
        status: twilioMessage.status,
        to: twilioMessage.to,
        from: twilioMessage.from,
        body: twilioMessage.body,
        dateCreated: twilioMessage.dateCreated,
      };

      this.logger.log(
        `SMS sent successfully: ${twilioMessage.sid} to ${message.to}`,
      );
      return response;
    } catch (error) {
      this.logger.error('Failed to send SMS:', error);

      // Handle specific Twilio errors
      if (error.code === 21211) {
        throw new Error('INVALID_PHONE_NUMBER');
      } else if (error.code === 21608) {
        throw new Error('UNAUTHORIZED_SENDER');
      }

      throw error;
    }
  }

  async sendBulkSMS(messages: SMSMessage[]): Promise<(SMSResponse | null)[]> {
    if (!this.twilioClient) {
      this.logger.warn('Twilio not initialized, skipping bulk SMS');
      return messages.map(() => null);
    }

    try {
      const promises = messages.map((message) => this.sendSMS(message));
      const results = await Promise.allSettled(promises);

      const responses = results.map((result) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          this.logger.error('SMS failed:', result.reason);
          return null;
        }
      });

      const successCount = responses.filter((r) => r !== null).length;
      this.logger.log(
        `Bulk SMS completed: ${successCount}/${messages.length} successful`,
      );

      return responses;
    } catch (error) {
      this.logger.error('Failed to send bulk SMS:', error);
      throw error;
    }
  }

  async getSMSStatus(messageSid: string): Promise<any> {
    if (!this.twilioClient) {
      throw new Error('Twilio not initialized');
    }

    try {
      const message = await this.twilioClient.messages(messageSid).fetch();
      return {
        sid: message.sid,
        status: message.status,
        to: message.to,
        from: message.from,
        dateSent: message.dateSent,
        dateCreated: message.dateCreated,
        dateUpdated: message.dateUpdated,
        price: message.price,
        errorCode: message.errorCode,
        errorMessage: message.errorMessage,
      };
    } catch (error) {
      this.logger.error(`Failed to get SMS status for ${messageSid}:`, error);
      throw error;
    }
  }

  async validatePhoneNumber(phoneNumber: string): Promise<boolean> {
    if (!this.twilioClient) {
      return false;
    }

    try {
      // Basic phone number validation - check if it looks like a phone number
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      return phoneRegex.test(phoneNumber);
    } catch (error) {
      this.logger.error(
        `Failed to validate phone number ${phoneNumber}:`,
        error,
      );
      // If validation fails, assume the number is valid to not block SMS sending
      return true;
    }
  }

  async getAccountBalance(): Promise<number | null> {
    if (!this.twilioClient) {
      return null;
    }

    try {
      const balance = await this.twilioClient.balance.fetch();
      return parseFloat(balance.balance);
    } catch (error) {
      this.logger.error('Failed to get account balance:', error);
      return null;
    }
  }

  isInitialized(): boolean {
    return this.twilioClient !== null;
  }

  // Predefined SMS templates for common notifications
  getSMSTemplate(type: string, data: Record<string, any> = {}): string {
    const templates = {
      RIDE_REQUEST: `🚕 New ride request! Pickup at ${data.pickupAddress || 'your location'}. Estimated fare: $${data.fare || 'TBD'}`,
      RIDE_ACCEPTED: `✅ Your ride has been accepted! Driver ${data.driverName || 'is on the way'}.`,
      DRIVER_ARRIVED: `🚗 Your driver has arrived. Please meet them outside.`,
      RIDE_STARTED: `🚀 Your ride has started! Heading to ${data.destination || 'your destination'}.`,
      RIDE_COMPLETED: `✅ Your ride is complete! Total fare: $${data.fare || 'TBD'}. Please rate your driver.`,
      RIDE_CANCELLED: `❌ Your ride has been cancelled. ${data.reason || ''}`,
      EMERGENCY: `🚨 Emergency alert triggered. Help is on the way.`,
      PAYMENT_FAILED: `❌ Payment failed. Please update your payment method.`,
      PROMOTIONAL: `🎁 Special offer: ${data.offer || 'Check out our latest deals!'}`,
    };

    return (
      templates[type] ||
      `Notification: ${data.message || 'You have a new message'}`
    );
  }
}
