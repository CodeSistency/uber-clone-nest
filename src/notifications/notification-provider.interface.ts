import { NotificationPayload, NotificationDeliveryResult } from './interfaces/notification.interface';

export interface INotificationProvider {
  sendNotification(payload: NotificationPayload): Promise<NotificationDeliveryResult[]>;
  sendBulkNotifications(payloads: NotificationPayload[]): Promise<NotificationDeliveryResult[][]>;
  notifyNearbyDrivers(rideId: number, pickupLocation: { lat: number; lng: number }): Promise<void>;
  findAndAssignNearbyDriver(
    rideId: number,
    pickupLocation: { lat: number; lng: number },
  ): Promise<{
    assigned: boolean;
    driverId?: number;
    availableDrivers: number;
    notifiedDrivers: number;
  }>;
  confirmDriverForRide(rideId: number, driverId: number): Promise<void>;
  notifyRideStatusUpdate(
    rideId: number,
    userId: string,
    driverId: number | null,
    status: string,
    additionalData?: Record<string, any>,
  ): Promise<void>;
}




