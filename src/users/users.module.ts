import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { ClerkService } from './clerk.service';
import { ClerkAuthGuard } from './guards/clerk-auth.guard';
import { PrismaModule } from '../prisma/prisma.module';
import { AppConfigModule } from '../config/config.module';

@Module({
  imports: [PrismaModule, AppConfigModule],
  controllers: [UsersController],
  providers: [UsersService, ClerkService, ClerkAuthGuard],
  exports: [UsersService, ClerkService],
})
export class UsersModule {}
