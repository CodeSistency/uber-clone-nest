import { Module } from '@nestjs/common';
import { ReportsController } from './controllers/reports.controller';
import { ReportsService } from './services/reports.service';
import { PrismaService } from '../../../prisma/prisma.service';

@Module({
  controllers: [ReportsController],
  providers: [ReportsService, PrismaService],
  exports: [ReportsService],
})
export class ReportsModule {}
