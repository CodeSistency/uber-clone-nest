import { Module } from '@nestjs/common';
import { GroupPermissionsService } from './group-permissions.service';
import { GroupPermissionsController } from './group-permissions.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [GroupPermissionsController],
  providers: [GroupPermissionsService],
  exports: [GroupPermissionsService],
})
export class GroupPermissionsModule {}
