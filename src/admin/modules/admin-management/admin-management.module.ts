import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { AdminManagementController } from './controllers/admin-management.controller';
import { AdminManagementService } from './services/admin-management.service';
import { PrismaService } from '../../../prisma/prisma.service';

@Module({
  imports: [
    RouterModule.register([
      {
        path: '', // This will be prefixed with 'admin/management' from parent
        module: AdminManagementModule,
      },
    ]),
  ],
  controllers: [AdminManagementController],
  providers: [AdminManagementService, PrismaService],
  exports: [AdminManagementService],
})
export class AdminManagementModule {}
