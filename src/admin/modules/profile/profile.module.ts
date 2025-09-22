import { Module } from '@nestjs/common';
import { ProfileController } from './controllers/profile.controller';
import { ProfileService } from './services/profile.service';
import { PrismaService } from '../../../prisma/prisma.service';

@Module({
  controllers: [ProfileController],
  providers: [ProfileService, PrismaService],
  exports: [ProfileService],
})
export class ProfileModule {}
