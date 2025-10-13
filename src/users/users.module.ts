import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { OnboardingController } from './onboarding.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AppConfigModule } from '../config/config.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { TwilioService } from '../services/twilio.service';

// New controllers
import { EmailChangeController } from './controllers/email-change.controller';
import { PasswordChangeController } from './controllers/password-change.controller';
import { PhoneChangeController } from './controllers/phone-change.controller';
import { IdentityVerificationController } from './controllers/identity-verification.controller';

// New services
import { VerificationCodesService } from './services/verification-codes.service';
import { IdentityVerificationService } from './services/identity-verification.service';
import { EmailVerificationService } from './services/email-verification.service';
import { SMSVerificationService } from './services/sms-verification.service';

@Module({
  imports: [PrismaModule, AppConfigModule, NotificationsModule],
  controllers: [
    UsersController,
    OnboardingController,
    EmailChangeController,
    PasswordChangeController,
    PhoneChangeController,
    IdentityVerificationController,
  ],
  providers: [
    UsersService,
    VerificationCodesService,
    IdentityVerificationService,
    EmailVerificationService,
    SMSVerificationService,
    TwilioService,
  ],
  exports: [
    UsersService,
    VerificationCodesService,
    IdentityVerificationService,
    EmailVerificationService,
    SMSVerificationService,
  ],
})
export class UsersModule {}
