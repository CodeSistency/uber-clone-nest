import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from 'eventemitter2';

export interface DriverOnlineEvent {
  driverId: number;
  lat: number;
  lng: number;
  timestamp: Date;
}

@Injectable()
export class DriverEventsService {
  private eventEmitter: EventEmitter2;

  constructor() {
    this.eventEmitter = new EventEmitter2({
      wildcard: false,
      delimiter: '.',
      maxListeners: 20,
    });
  }

  /**
   * Emit when a driver comes online
   */
  emitDriverOnline(event: DriverOnlineEvent) {
    this.eventEmitter.emit('driver.online', event);
  }

  /**
   * Subscribe to driver online events
   */
  onDriverOnline(callback: (event: DriverOnlineEvent) => void) {
    this.eventEmitter.on('driver.online', callback);
  }

  /**
   * Remove listener
   */
  removeListener(event: string, callback: (...args: any[]) => void) {
    this.eventEmitter.removeListener(event, callback);
  }
}
