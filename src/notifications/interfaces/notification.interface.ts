// No imports needed for this interface file

export enum NotificationType {
  RIDE_REQUEST = 'ride_request',
  RIDE_ACCEPTED = 'ride_accepted',
  DRIVER_ARRIVED = 'driver_arrived',
  RIDE_STARTED = 'ride_started',
  RIDE_COMPLETED = 'ride_completed',
  RIDE_CANCELLED = 'ride_cancelled',
  ORDER_CREATED = 'order_created',
  ORDER_ACCEPTED = 'order_accepted',
  ORDER_ASSIGNED = 'order_assigned',
  ORDER_PICKED_UP = 'order_picked_up',
  ORDER_DELIVERED = 'order_delivered',
  ORDER_CANCELLED = 'order_cancelled',
  DELIVERY_AVAILABLE = 'delivery_available',
  EMERGENCY_TRIGGERED = 'emergency_triggered',
  PAYMENT_SUCCESSFUL = 'payment_successful',
  PAYMENT_FAILED = 'payment_failed',
  DRIVER_MESSAGE = 'driver_message',
  PROMOTIONAL = 'promotional',
  SYSTEM_MAINTENANCE = 'system_maintenance',
  // Nuevos tipos para reportes y reembolsos
  DRIVER_REPORT_TRAFFIC = 'driver_report_traffic',
  DRIVER_REPORT_BREAKDOWN = 'driver_report_breakdown',
  DRIVER_REPORT_ACCIDENT = 'driver_report_accident',
  DRIVER_REPORT_PASSENGER_ISSUE = 'driver_report_passenger_issue',
  DRIVER_CANCEL_RIDE = 'driver_cancel_ride',
  RIDE_REFUND_PROCESSED = 'ride_refund_processed',
  DRIVER_REQUEST_EXPIRED = 'driver_request_expired',
  PASSENGER_RATED_BY_DRIVER = 'passenger_rated_by_driver',
}

export enum NotificationChannel {
  PUSH = 'push',
  SMS = 'sms',
  EMAIL = 'email',
  WEBSOCKET = 'websocket',
}

export interface NotificationPayload {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  channels?: NotificationChannel[];
  priority?: 'low' | 'normal' | 'high' | 'critical';
}

export interface NotificationPreferences {
  pushEnabled: boolean;
  smsEnabled: boolean;
  emailEnabled: boolean;
  rideUpdates: boolean;
  driverMessages: boolean;
  promotional: boolean;
  emergencyAlerts: boolean;
}

export interface PushTokenData {
  token: string;
  deviceType?: 'ios' | 'android' | 'web';
  deviceId?: string;
  isActive: boolean;
}

export interface NotificationDeliveryResult {
  success: boolean;
  channel: NotificationChannel;
  messageId?: string;
  error?: string;
  timestamp: Date;
}

export interface NotificationHistory {
  id: number;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  pushSent: boolean;
  pushSentAt?: Date;
  smsSent: boolean;
  smsSentAt?: Date;
  emailSent: boolean;
  emailSentAt?: Date;
  createdAt: Date;
  readAt?: Date;
}
