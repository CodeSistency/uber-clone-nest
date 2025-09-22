import { Module } from '@nestjs/common';
import { TestingService } from './testing.service';
import { TestingController } from './testing.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TestingController],
  providers: [TestingService],
  exports: [TestingService],
})
export class TestingModule {}
