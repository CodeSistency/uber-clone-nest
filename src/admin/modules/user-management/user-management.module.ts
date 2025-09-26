import { Module } from '@nestjs/common';

// Controllers
import { UserManagementController } from './controllers/user-management.controller';

// Services
import { UserManagementService } from './services/user-management.service';

// Prisma
import { PrismaModule } from '../../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [UserManagementController],
  providers: [UserManagementService],
  exports: [UserManagementService],
})
export class UserManagementModule {}
