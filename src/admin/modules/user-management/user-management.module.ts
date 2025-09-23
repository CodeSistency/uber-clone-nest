import { Module } from '@nestjs/common';
import { UserManagementController } from './controllers/user-management.controller';
import { UserManagementService } from './services/user-management.service';
import { PrismaService } from '../../../prisma/prisma.service';

@Module({
  controllers: [UserManagementController],
  providers: [UserManagementService, PrismaService],
  exports: [UserManagementService],
})
export class UserManagementModule {}
