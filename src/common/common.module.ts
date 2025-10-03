import { Module } from '@nestjs/common';
import { DriverEventsService } from './events/driver-events.service';

@Module({
  providers: [DriverEventsService],
  exports: [DriverEventsService],
})
export class CommonModule {}
