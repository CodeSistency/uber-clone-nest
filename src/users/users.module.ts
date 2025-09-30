import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { OnboardingController } from './onboarding.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AppConfigModule } from '../config/config.module';

@Module({
  imports: [PrismaModule, AppConfigModule],
  controllers: [UsersController, OnboardingController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
