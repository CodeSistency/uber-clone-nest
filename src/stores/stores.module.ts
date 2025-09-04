import { Module } from '@nestjs/common';
import { StoresService } from './stores.service';
import { StoresController } from './stores.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { StoreOwnerGuard } from './guards/store-owner.guard';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [StoresController],
  providers: [StoresService, StoreOwnerGuard],
  exports: [StoresService, StoreOwnerGuard],
})
export class StoresModule {}
