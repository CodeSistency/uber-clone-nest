# Notification System Implementation Plan

## Uber Clone - Complete Notification System Architecture

**Document Version:** 1.0  
**Last Updated:** January 2024  
**Authors:** AI Assistant  
**Status:** Ready for Implementation

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current State Analysis](#current-state-analysis)
3. [System Architecture Overview](#system-architecture-overview)
4. [Backend Implementation (NestJS)](#backend-implementation-nestjs)
5. [Frontend Implementation (React Native)](#frontend-implementation-react-native)
6. [Database Schema Changes](#database-schema-changes)
7. [Real-Time Communication](#real-time-communication)
8. [Push Notification Setup](#push-notification-setup)
9. [SMS Integration](#sms-integration)
10. [Testing Strategy](#testing-strategy)
11. [Monitoring and Analytics](#monitoring-and-analytics)
12. [Deployment Strategy](#deployment-strategy)
13. [Implementation Phases](#implementation-phases)
14. [Risk Assessment](#risk-assessment)
15. [Success Metrics](#success-metrics)

---

## Executive Summary

This document outlines the comprehensive implementation plan for a production-ready notification system for the Uber clone application. The current implementation lacks real-time communication between passengers and drivers, push notifications, and robust status tracking.

### Key Objectives

- Implement real-time ride status notifications
- Add push notification support for critical events
- Create SMS fallback mechanisms
- Establish WebSocket-based real-time communication
- Implement comprehensive error handling and fallbacks
- Ensure scalability and reliability

### Expected Outcomes

- **90%+ notification delivery rate**
- **< 5 second real-time updates**
- **Complete ride flow visibility**
- **Enhanced user experience**
- **Driver-passenger communication**
- **Emergency notification support**

---

## Current State Analysis

### Existing Infrastructure ✅

**Frontend (React Native):**
- ✅ Expo/React Native setup
- ✅ Google Maps integration
- ✅ Location services
- ✅ Basic ride flow (find → confirm → book)
- ✅ Stripe payment integration
- ✅ Driver selection UI

**Backend (Current - API Routes):**
- ✅ Neon database integration
- ✅ Basic ride creation API
- ✅ Driver data fetching
- ✅ User authentication (Clerk)
- ✅ Basic CRUD operations

### Missing Components ❌

**Real-Time Features:**
- ❌ WebSocket/Socket.io integration
- ❌ Real-time driver location updates
- ❌ Live ride status tracking
- ❌ Real-time chat functionality

**Notification System:**
- ❌ Push notification infrastructure
- ❌ SMS fallback mechanisms
- ❌ In-app notification system
- ❌ Notification preferences
- ❌ Notification history

**State Management:**
- ❌ Comprehensive ride status tracking
- ❌ Driver availability management
- ❌ Real-time driver matching

---

## System Architecture Overview

### High-Level Architecture

```mermaid
graph TB
    subgraph "Frontend (React Native)"
        A[Passenger App]
        B[Driver App]
        C[Notification Handler]
        D[WebSocket Client]
    end

    subgraph "Backend (NestJS)"
        E[API Gateway]
        F[Ride Service]
        G[Notification Service]
        H[WebSocket Gateway]
        I[Push Service]
        J[SMS Service]
    end

    subgraph "External Services"
        K[Firebase Cloud Messaging]
        L[Twilio SMS]
        M[Redis Cache]
        N[PostgreSQL Database]
    end

    A --> E
    B --> E
    A --> D
    B --> D
    D --> H
    E --> F
    E --> G
    F --> G
    G --> I
    G --> J
    I --> K
    J --> L
    F --> M
    G --> M
    F --> N
    G --> N
```

### Component Breakdown

| Component | Technology | Responsibility |
|-----------|------------|----------------|
| API Gateway | NestJS | Request routing, authentication |
| Ride Service | NestJS | Ride lifecycle management |
| Notification Service | NestJS | Notification orchestration |
| WebSocket Gateway | Socket.io | Real-time communication |
| Push Service | Firebase | Push notification delivery |
| SMS Service | Twilio | SMS fallback delivery |
| Cache Layer | Redis | Session management, real-time data |

---

## Backend Implementation (NestJS)

### 1. Project Structure Setup

```bash
# Initialize NestJS project
nest new notification-service

# Install required packages
npm install @nestjs/websockets @nestjs/platform-socket.io
npm install @nestjs/config @nestjs/jwt @nestjs/passport
npm install socket.io socket.io-redis
npm install firebase-admin twilio
npm install redis @nestjs/cache-manager cache-manager-redis-yet
npm install @nestjs/typeorm typeorm pg
npm install class-validator class-transformer
npm install @nestjs/throttler @nestjs/monitoring
```

### 2. Core Module Structure

```
src/
├── modules/
│   ├── rides/
│   │   ├── rides.module.ts
│   │   ├── rides.service.ts
│   │   ├── rides.controller.ts
│   │   ├── entities/
│   │   │   ├── ride.entity.ts
│   │   │   └── ride-status-history.entity.ts
│   │   └── dto/
│   │       ├── create-ride.dto.ts
│   │       └── update-ride-status.dto.ts
│   ├── notifications/
│   │   ├── notifications.module.ts
│   │   ├── notifications.service.ts
│   │   ├── notifications.controller.ts
│   │   └── dto/
│   │       └── send-notification.dto.ts
│   ├── drivers/
│   │   ├── drivers.module.ts
│   │   ├── drivers.service.ts
│   │   └── entities/
│   │       └── driver.entity.ts
│   └── users/
│       ├── users.module.ts
│       ├── users.service.ts
│       └── entities/
│           └── user.entity.ts
├── gateways/
│   └── rides.gateway.ts
├── services/
│   ├── firebase.service.ts
│   ├── twilio.service.ts
│   ├── websocket.service.ts
│   └── cache.service.ts
├── common/
│   ├── decorators/
│   ├── guards/
│   ├── interceptors/
│   └── filters/
├── config/
│   └── configuration.ts
└── app.module.ts
```

### 3. Ride Service Implementation

```typescript
// src/modules/rides/rides.service.ts
@Injectable()
export class RidesService {
  constructor(
    @InjectRepository(Ride)
    private rideRepository: Repository<Ride>,
    @InjectRepository(RideStatusHistory)
    private statusHistoryRepository: Repository<RideStatusHistory>,
    private notificationsService: NotificationsService,
    private websocketService: WebsocketService,
  ) {}

  async createRide(createRideDto: CreateRideDto): Promise<Ride> {
    const ride = this.rideRepository.create({
      ...createRideDto,
      status: RideStatus.REQUESTED,
    });

    const savedRide = await this.rideRepository.save(ride);

    // Create initial status history
    await this.createStatusHistory(savedRide.id, RideStatus.REQUESTED);

    // Notify nearby drivers
    await this.notificationsService.notifyNearbyDrivers(savedRide);

    // Broadcast to WebSocket clients
    this.websocketService.broadcastRideUpdate(savedRide.id, {
      type: 'RIDE_CREATED',
      data: savedRide,
    });

    return savedRide;
  }

  async updateRideStatus(
    rideId: number,
    status: RideStatus,
    driverId?: number,
  ): Promise<Ride> {
    const ride = await this.rideRepository.findOne({ where: { id: rideId } });
    if (!ride) throw new NotFoundException('Ride not found');

    const oldStatus = ride.status;
    ride.status = status;
    if (driverId) ride.driverId = driverId;

    const updatedRide = await this.rideRepository.save(ride);

    // Record status change
    await this.createStatusHistory(rideId, status, driverId);

    // Send appropriate notifications
    await this.sendStatusNotifications(updatedRide, oldStatus);

    // Broadcast real-time update
    this.websocketService.broadcastRideUpdate(rideId, {
      type: 'RIDE_STATUS_UPDATED',
      data: { ride: updatedRide, oldStatus, newStatus: status },
    });

    return updatedRide;
  }

  private async sendStatusNotifications(
    ride: Ride,
    oldStatus: RideStatus,
  ): Promise<void> {
    const notifications = this.getNotificationsForStatus(ride, oldStatus);
    await Promise.all(
      notifications.map(notification =>
        this.notificationsService.sendNotification(notification),
      ),
    );
  }

  private getNotificationsForStatus(
    ride: Ride,
    oldStatus: RideStatus,
  ): NotificationPayload[] {
    // Implementation based on the proposed flow
    // ... detailed notification logic
  }
}
```

### 4. WebSocket Gateway Implementation

```typescript
// src/gateways/rides.gateway.ts
@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/rides',
})
export class RidesGateway implements OnGatewayInit {
  @WebSocketServer()
  server: Server;

  constructor(
    private ridesService: RidesService,
    private jwtService: JwtService,
  ) {}

  afterInit(server: Server) {
    console.log('WebSocket Gateway initialized');
  }

  @SubscribeMessage('joinRideRoom')
  handleJoinRideRoom(
    @MessageBody() data: { rideId: number },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`ride_${data.rideId}`);
    client.emit('joinedRoom', { rideId: data.rideId });
  }

  @SubscribeMessage('updateDriverLocation')
  async handleDriverLocation(
    @MessageBody() data: { rideId: number; location: LocationDto },
    @ConnectedSocket() client: Socket,
  ) {
    // Update driver location in cache/database
    await this.ridesService.updateDriverLocation(data.rideId, data.location);

    // Broadcast to ride participants
    client.to(`ride_${data.rideId}`).emit('driverLocationUpdate', {
      rideId: data.rideId,
      location: data.location,
      timestamp: new Date(),
    });
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() data: { rideId: number; message: string },
    @ConnectedSocket() client: Socket,
  ) {
    const message = await this.ridesService.saveMessage(data.rideId, data.message);

    client.to(`ride_${data.rideId}`).emit('newMessage', message);
  }
}
```

### 5. Notification Service Implementation

```typescript
// src/modules/notifications/notifications.service.ts
@Injectable()
export class NotificationsService {
  constructor(
    private firebaseService: FirebaseService,
    private twilioService: TwilioService,
    private cacheService: CacheService,
  ) {}

  async sendNotification(payload: NotificationPayload): Promise<void> {
    const { userId, type, data } = payload;

    // Get user device tokens and preferences
    const userDevices = await this.getUserDevices(userId);
    const preferences = await this.getUserNotificationPreferences(userId);

    // Send push notifications
    if (preferences.pushEnabled && userDevices.length > 0) {
      await this.sendPushNotifications(userDevices, payload);
    }

    // Send SMS fallback if critical
    if (this.isCriticalNotification(type) && preferences.smsEnabled) {
      await this.sendSMSFallback(userId, payload);
    }

    // Store notification history
    await this.saveNotificationHistory(payload);
  }

  async notifyNearbyDrivers(ride: Ride): Promise<void> {
    const nearbyDrivers = await this.findNearbyDrivers(ride.originLatitude, ride.originLongitude);

    const notifications = nearbyDrivers.map(driver => ({
      userId: driver.userId,
      type: NotificationType.RIDE_REQUEST,
      data: {
        rideId: ride.id,
        pickupLocation: ride.originAddress,
        destination: ride.destinationAddress,
        estimatedFare: ride.farePrice,
        distance: driver.distance,
      },
    }));

    await Promise.all(
      notifications.map(notification => this.sendNotification(notification)),
    );
  }

  private async sendPushNotifications(
    devices: DeviceToken[],
    payload: NotificationPayload,
  ): Promise<void> {
    const messages = devices.map(device => ({
      token: device.token,
      notification: {
        title: this.getNotificationTitle(payload.type),
        body: this.getNotificationBody(payload),
      },
      data: {
        type: payload.type,
        rideId: payload.data.rideId?.toString(),
      },
      android: {
        priority: 'high',
        notification: {
          sound: this.getNotificationSound(payload.type),
          channelId: this.getNotificationChannel(payload.type),
        },
      },
      apns: {
        payload: {
          aps: {
            sound: this.getNotificationSound(payload.type),
            badge: 1,
          },
        },
      },
    }));

    await this.firebaseService.sendMulticast(messages);
  }

  private async sendSMSFallback(
    userId: number,
    payload: NotificationPayload,
  ): Promise<void> {
    const user = await this.getUserById(userId);
    if (!user.phoneNumber) return;

    const message = this.formatSMSMessage(payload);
    await this.twilioService.sendSMS(user.phoneNumber, message);
  }
}
```

---

## Frontend Implementation (React Native)

### 1. Project Structure Updates

```
app/
├── components/
│   ├── notifications/
│   │   ├── NotificationBanner.tsx
│   │   ├── NotificationModal.tsx
│   │   ├── NotificationList.tsx
│   │   └── NotificationItem.tsx
│   ├── chat/
│   │   ├── ChatScreen.tsx
│   │   ├── MessageBubble.tsx
│   │   └── ChatInput.tsx
│   └── ride-tracking/
│       ├── LiveRideMap.tsx
│       ├── RideStatusIndicator.tsx
│       └── DriverLocationMarker.tsx
├── hooks/
│   ├── useNotifications.ts
│   ├── useWebSocket.ts
│   ├── useRideTracking.ts
│   └── usePushNotifications.ts
├── services/
│   ├── notificationService.ts
│   ├── websocketService.ts
│   ├── pushNotificationService.ts
│   └── rideTrackingService.ts
├── stores/
│   ├── notificationStore.ts
│   ├── rideStore.ts
│   └── websocketStore.ts
├── types/
│   └── notification.types.ts
└── utils/
    ├── notificationHelpers.ts
    └── websocketHelpers.ts
```

### 2. Notification Service Implementation

```typescript
// app/services/notificationService.ts
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

export class NotificationService {
  private static instance: NotificationService;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async initialize(): Promise<void> {
    // Request permissions
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Notification permissions not granted');
    }

    // Set notification handler
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    // Set up notification listeners
    this.setupNotificationListeners();
  }

  private setupNotificationListeners(): void {
    // Handle notification received while app is foreground
    Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
      this.handleNotificationReceived(notification);
    });

    // Handle notification tapped
    Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped:', response);
      this.handleNotificationTapped(response);
    });
  }

  async sendLocalNotification(
    title: string,
    body: string,
    data?: any,
  ): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null, // Send immediately
    });
  }

  async scheduleNotification(
    title: string,
    body: string,
    delayInSeconds: number,
    data?: any,
  ): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: 'default',
      },
      trigger: {
        seconds: delayInSeconds,
      },
    });
  }

  private handleNotificationReceived(notification: Notifications.Notification): void {
    const { title, body, data } = notification.request.content;

    // Show in-app banner if app is active
    if (data.type === 'RIDE_STATUS_UPDATE') {
      this.showInAppNotification(title, body, data);
    }

    // Update ride status if applicable
    if (data.rideId) {
      this.updateRideStatus(data.rideId, data);
    }
  }

  private handleNotificationTapped(response: Notifications.NotificationResponse): void {
    const { data } = response.notification.request.content;

    // Navigate to appropriate screen based on notification type
    switch (data.type) {
      case 'RIDE_REQUEST':
        router.push(`/driver/ride-requests`);
        break;
      case 'RIDE_ACCEPTED':
        router.push(`/ride/${data.rideId}`);
        break;
      case 'DRIVER_ARRIVED':
        router.push(`/ride/${data.rideId}/pickup`);
        break;
      default:
        router.push('/home');
    }
  }

  private showInAppNotification(title: string, body: string, data: any): void {
    // Implementation for in-app banner/modal
    // This would integrate with your UI notification components
  }

  private updateRideStatus(rideId: string, data: any): void {
    // Update ride status in your state management
    // This would integrate with your ride store
  }
}
```

### 3. WebSocket Service Implementation

```typescript
// app/services/websocketService.ts
import { io, Socket } from 'socket.io-client';
import { useNotificationStore } from '../stores/notificationStore';

export class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(userId: string, token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = io(`${process.env.EXPO_PUBLIC_WS_URL}/rides`, {
        auth: {
          token,
          userId,
        },
        transports: ['websocket'],
        upgrade: false,
      });

      this.socket.on('connect', () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        resolve();
      });

      this.socket.on('disconnect', (reason) => {
        console.log('WebSocket disconnected:', reason);
        this.handleDisconnect();
      });

      this.socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        reject(error);
      });

      this.setupEventListeners();
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinRideRoom(rideId: number): void {
    if (this.socket) {
      this.socket.emit('joinRideRoom', { rideId });
    }
  }

  updateDriverLocation(rideId: number, location: Location): void {
    if (this.socket) {
      this.socket.emit('updateDriverLocation', {
        rideId,
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
      });
    }
  }

  sendMessage(rideId: number, message: string): void {
    if (this.socket) {
      this.socket.emit('sendMessage', {
        rideId,
        message,
        timestamp: new Date(),
      });
    }
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    // Ride status updates
    this.socket.on('rideStatusUpdate', (data) => {
      console.log('Ride status update:', data);
      this.handleRideStatusUpdate(data);
    });

    // Driver location updates
    this.socket.on('driverLocationUpdate', (data) => {
      console.log('Driver location update:', data);
      this.handleDriverLocationUpdate(data);
    });

    // New messages
    this.socket.on('newMessage', (data) => {
      console.log('New message:', data);
      this.handleNewMessage(data);
    });

    // Ride created
    this.socket.on('rideCreated', (data) => {
      console.log('Ride created:', data);
      this.handleRideCreated(data);
    });
  }

  private handleRideStatusUpdate(data: any): void {
    const { ride, oldStatus, newStatus } = data;

    // Update local ride state
    useNotificationStore.getState().updateRideStatus(ride.id, newStatus);

    // Show appropriate notification
    this.showStatusNotification(ride, oldStatus, newStatus);
  }

  private handleDriverLocationUpdate(data: any): void {
    const { rideId, location, timestamp } = data;

    // Update driver location on map
    useNotificationStore.getState().updateDriverLocation(rideId, location);
  }

  private handleNewMessage(data: any): void {
    // Add message to chat
    useNotificationStore.getState().addMessage(data.rideId, data);
  }

  private handleRideCreated(data: any): void {
    // Handle new ride creation
    useNotificationStore.getState().addRide(data);
  }

  private showStatusNotification(ride: any, oldStatus: string, newStatus: string): void {
    // Show in-app notification based on status change
    const notification = this.getNotificationForStatus(ride, oldStatus, newStatus);
    if (notification) {
      // Send local notification or show banner
    }
  }

  private getNotificationForStatus(ride: any, oldStatus: string, newStatus: string): any {
    // Return appropriate notification based on status transition
    // Implementation based on your proposed flows
  }

  private handleDisconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        // Implement reconnection logic
      }, 1000 * this.reconnectAttempts);
    }
  }
}
```

### 4. Notification Hook Implementation

```typescript
// app/hooks/useNotifications.ts
import { useState, useEffect } from 'react';
import { useNotificationStore } from '../stores/notificationStore';
import { NotificationService } from '../services/notificationService';

export const useNotifications = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const notificationService = NotificationService.getInstance();

  const {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    clearNotifications,
  } = useNotificationStore();

  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        await notificationService.initialize();
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize notifications:', error);
      }
    };

    initializeNotifications();
  }, []);

  const sendLocalNotification = async (
    title: string,
    body: string,
    data?: any,
  ) => {
    await notificationService.sendLocalNotification(title, body, data);
  };

  const scheduleNotification = async (
    title: string,
    body: string,
    delayInSeconds: number,
    data?: any,
  ) => {
    await notificationService.scheduleNotification(title, body, delayInSeconds, data);
  };

  return {
    isInitialized,
    notifications,
    unreadCount,
    sendLocalNotification,
    scheduleNotification,
    markAsRead,
    clearNotifications,
  };
};
```

### 5. Notification Banner Component

```typescript
// app/components/notifications/NotificationBanner.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react-native';

interface NotificationBannerProps {
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  duration?: number;
  onClose?: () => void;
  action?: {
    label: string;
    onPress: () => void;
  };
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  type,
  title,
  message,
  duration = 5000,
  onClose,
  action,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [animation] = useState(new Animated.Value(0));

  useEffect(() => {
    // Slide in animation
    Animated.timing(animation, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Auto-hide after duration
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    Animated.timing(animation, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setIsVisible(false);
      onClose?.();
    });
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} color="#10B981" />;
      case 'error':
        return <AlertCircle size={20} color="#EF4444" />;
      case 'warning':
        return <AlertCircle size={20} color="#F59E0B" />;
      case 'info':
        return <Info size={20} color="#3B82F6" />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return '#D1FAE5';
      case 'error':
        return '#FEE2E2';
      case 'warning':
        return '#FEF3C7';
      case 'info':
        return '#DBEAFE';
    }
  };

  if (!isVisible) return null;

  return (
    <Animated.View
      style={{
        transform: [
          {
            translateY: animation.interpolate({
              inputRange: [0, 1],
              outputRange: [-100, 0],
            }),
          },
        ],
      }}
      className="absolute top-0 left-0 right-0 z-50 p-4"
    >
      <View
        style={{ backgroundColor: getBackgroundColor() }}
        className="rounded-lg p-4 shadow-lg"
      >
        <View className="flex-row items-start">
          <View className="mr-3 mt-0.5">
            {getIcon()}
          </View>

          <View className="flex-1">
            <Text className="font-JakartaBold text-sm mb-1">
              {title}
            </Text>
            <Text className="font-JakartaRegular text-sm text-gray-600">
              {message}
            </Text>

            {action && (
              <TouchableOpacity
                onPress={action.onPress}
                className="mt-2"
              >
                <Text className="font-JakartaBold text-sm text-blue-600">
                  {action.label}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            onPress={handleClose}
            className="ml-3 p-1"
          >
            <X size={16} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};
```

---

## Database Schema Changes

### New Tables Required

```sql
-- Notification preferences
CREATE TABLE notification_preferences (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  push_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT false,
  email_enabled BOOLEAN DEFAULT false,
  ride_updates BOOLEAN DEFAULT true,
  driver_messages BOOLEAN DEFAULT true,
  promotional BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- Push notification tokens
CREATE TABLE push_tokens (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  token VARCHAR(255) NOT NULL,
  device_type VARCHAR(50), -- 'ios', 'android'
  device_id VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, token)
);

-- Notification history
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  push_sent BOOLEAN DEFAULT false,
  sms_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP,
  INDEX idx_user_created (user_id, created_at),
  INDEX idx_type (type)
);

-- Ride status history
CREATE TABLE ride_status_history (
  id SERIAL PRIMARY KEY,
  ride_id INTEGER NOT NULL REFERENCES rides(id),
  old_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  changed_by VARCHAR(255), -- user_id or 'system'
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ride_id) REFERENCES rides(id) ON DELETE CASCADE,
  INDEX idx_ride_status (ride_id, created_at)
);

-- Driver locations (for real-time tracking)
CREATE TABLE driver_locations (
  id SERIAL PRIMARY KEY,
  driver_id INTEGER NOT NULL REFERENCES drivers(id),
  ride_id INTEGER REFERENCES rides(id),
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  heading DECIMAL(5, 2),
  speed DECIMAL(5, 2),
  accuracy DECIMAL(5, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_driver_ride (driver_id, ride_id),
  INDEX idx_location (latitude, longitude),
  INDEX idx_created (created_at)
);

-- Chat messages
CREATE TABLE chat_messages (
  id SERIAL PRIMARY KEY,
  ride_id INTEGER NOT NULL REFERENCES rides(id),
  sender_id VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  message_type VARCHAR(50) DEFAULT 'text', -- 'text', 'image', 'location'
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ride_id) REFERENCES rides(id) ON DELETE CASCADE,
  INDEX idx_ride_sender (ride_id, sender_id, created_at)
);

-- Emergency contacts
CREATE TABLE emergency_contacts (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  relationship VARCHAR(100),
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_primary (user_id, is_primary)
);
```

### Updated Ride Table

```sql
-- Add new columns to existing rides table
ALTER TABLE rides
ADD COLUMN status VARCHAR(50) DEFAULT 'requested',
ADD COLUMN driver_assigned_at TIMESTAMP,
ADD COLUMN passenger_picked_up_at TIMESTAMP,
ADD COLUMN completed_at TIMESTAMP,
ADD COLUMN cancelled_at TIMESTAMP,
ADD COLUMN cancel_reason TEXT,
ADD COLUMN emergency_triggered BOOLEAN DEFAULT false,
ADD COLUMN emergency_at TIMESTAMP,
ADD COLUMN real_time_updates BOOLEAN DEFAULT true,
ADD COLUMN last_location_update TIMESTAMP,
ADD COLUMN estimated_arrival TIMESTAMP,
ADD COLUMN actual_arrival TIMESTAMP;
```

---

## Real-Time Communication

### WebSocket Implementation Details

1. **Connection Management**
   - JWT-based authentication
   - Room-based message routing (per ride)
   - Automatic reconnection with exponential backoff
   - Connection pooling and load balancing

2. **Message Types**
   ```typescript
   enum WebSocketMessageType {
     RIDE_CREATED = 'RIDE_CREATED',
     RIDE_STATUS_UPDATED = 'RIDE_STATUS_UPDATED',
     DRIVER_LOCATION_UPDATE = 'DRIVER_LOCATION_UPDATE',
     NEW_MESSAGE = 'NEW_MESSAGE',
     DRIVER_JOINED_RIDE = 'DRIVER_JOINED_RIDE',
     PASSENGER_JOINED_RIDE = 'PASSENGER_JOINED_RIDE',
     EMERGENCY_TRIGGERED = 'EMERGENCY_TRIGGERED',
     RIDE_CANCELLED = 'RIDE_CANCELLED',
   }
   ```

3. **Redis Integration for Scaling**
   ```typescript
   // Redis adapter for Socket.io clustering
   import { RedisAdapter } from '@socket.io/redis-adapter';
   import { createClient } from 'redis';

   const pubClient = createClient({ host: 'localhost', port: 6379 });
   const subClient = pubClient.duplicate();

   io.adapter(new RedisAdapter(pubClient, subClient));
   ```

### Real-Time Data Flow

```mermaid
sequenceDiagram
    participant P as Passenger App
    participant WS as WebSocket Gateway
    participant RS as Ride Service
    participant NS as Notification Service
    participant D as Driver App

    P->>WS: Request Ride
    WS->>RS: Create Ride
    RS->>NS: Notify Nearby Drivers
    NS->>D: Push Notification
    D->>WS: Accept Ride
    WS->>RS: Update Ride Status
    RS->>WS: Broadcast Status Update
    WS->>P: Real-time Status Update
    D->>WS: Update Location
    WS->>P: Live Location Update
```

---

## Push Notification Setup

### Firebase Configuration

```typescript
// Firebase Admin SDK setup
import * as admin from 'firebase-admin';

const serviceAccount = require('./firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: process.env.FIREBASE_PROJECT_ID,
});

export const sendPushNotification = async (
  token: string,
  title: string,
  body: string,
  data?: any,
) => {
  const message = {
    token,
    notification: {
      title,
      body,
    },
    data: data || {},
    android: {
      priority: 'high',
      notification: {
        sound: 'default',
        channelId: 'ride_updates',
      },
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
          badge: 1,
        },
      },
    },
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('Push notification sent:', response);
    return response;
  } catch (error) {
    console.error('Error sending push notification:', error);
    throw error;
  }
};
```

### Notification Channels (Android)

```xml
<!-- AndroidManifest.xml -->
<manifest>
  <application>
    <meta-data
      android:name="com.google.firebase.messaging.default_notification_channel_id"
      android:value="ride_updates" />
  </application>
</manifest>
```

```kotlin
// NotificationHelper.kt
class NotificationHelper(private val context: Context) {

  fun createNotificationChannels() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val rideChannel = NotificationChannel(
        "ride_updates",
        "Ride Updates",
        NotificationManager.IMPORTANCE_HIGH
      ).apply {
        description = "Notifications for ride updates"
        enableLights(true)
        lightColor = Color.BLUE
        enableVibration(true)
        vibrationPattern = longArrayOf(0, 250, 250, 250)
      }

      val chatChannel = NotificationChannel(
        "chat_messages",
        "Chat Messages",
        NotificationManager.IMPORTANCE_DEFAULT
      ).apply {
        description = "Notifications for chat messages"
      }

      val emergencyChannel = NotificationChannel(
        "emergency",
        "Emergency",
        NotificationManager.IMPORTANCE_MAX
      ).apply {
        description = "Emergency notifications"
        setSound(Uri.parse("android.resource://${context.packageName}/${R.raw.emergency_sound}"), null)
      }

      val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
      notificationManager.createNotificationChannels(listOf(rideChannel, chatChannel, emergencyChannel))
    }
  }
}
```

---

## SMS Integration

### Twilio Setup

```typescript
// Twilio service implementation
import { Twilio } from 'twilio';

export class TwilioService {
  private client: Twilio;

  constructor() {
    this.client = new Twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN,
    );
  }

  async sendSMS(to: string, message: string): Promise<any> {
    try {
      const result = await this.client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to,
      });

      console.log('SMS sent:', result.sid);
      return result;
    } catch (error) {
      console.error('Error sending SMS:', error);
      throw error;
    }
  }

  async sendBulkSMS(recipients: string[], message: string): Promise<any[]> {
    const promises = recipients.map(recipient =>
      this.sendSMS(recipient, message)
    );

    return Promise.allSettled(promises);
  }

  getSMSStatus(messageSid: string): Promise<any> {
    return this.client.messages(messageSid).fetch();
  }
}
```

### SMS Templates

```typescript
// SMS template configurations
export const smsTemplates = {
  DRIVER_ARRIVED: (driverName: string, vehicleInfo: string) =>
    `🚗 Your driver ${driverName} has arrived in ${vehicleInfo}. Please meet them outside.`,

  RIDE_STARTED: (destination: string) =>
    `🚀 Your ride has started! Heading to ${destination}.`,

  RIDE_COMPLETED: (fare: string) =>
    `✅ Your ride is complete! Total fare: $${fare}. Please rate your driver.`,

  EMERGENCY_TRIGGERED: () =>
    `🚨 Emergency alert triggered. Help is on the way. Stay calm.`,

  DRIVER_CANCELLED: () =>
    `❌ Your driver had to cancel. We're finding you a new driver.`,

  RIDE_REQUEST: (pickupLocation: string, fare: string) =>
    `🚕 New ride request! Pickup at ${pickupLocation}. Estimated fare: $${fare}`,
};
```

---

## Testing Strategy

### Unit Testing

```typescript
// Notification service tests
describe('NotificationsService', () => {
  let service: NotificationsService;
  let mockFirebaseService: jest.Mocked<FirebaseService>;
  let mockTwilioService: jest.Mocked<TwilioService>;

  beforeEach(() => {
    mockFirebaseService = {
      sendPushNotification: jest.fn(),
    } as any;

    mockTwilioService = {
      sendSMS: jest.fn(),
    } as any;

    service = new NotificationsService(mockFirebaseService, mockTwilioService);
  });

  describe('sendNotification', () => {
    it('should send push notification when enabled', async () => {
      const payload = {
        userId: 'user123',
        type: NotificationType.RIDE_ACCEPTED,
        data: { rideId: 1 },
      };

      await service.sendNotification(payload);

      expect(mockFirebaseService.sendPushNotification).toHaveBeenCalledWith(
        expect.any(Array),
        payload,
      );
    });

    it('should fallback to SMS for critical notifications', async () => {
      const payload = {
        userId: 'user123',
        type: NotificationType.EMERGENCY,
        data: { rideId: 1 },
      };

      await service.sendNotification(payload);

      expect(mockTwilioService.sendSMS).toHaveBeenCalled();
    });
  });
});
```

### Integration Testing

```typescript
// WebSocket integration tests
describe('WebSocket Integration', () => {
  let clientSocket: Socket;
  let server: Server;

  beforeAll((done) => {
    server = app.listen(3001);
    clientSocket = io('http://localhost:3001');
    clientSocket.on('connect', done);
  });

  afterAll(() => {
    clientSocket.disconnect();
    server.close();
  });

  it('should join ride room', (done) => {
    clientSocket.emit('joinRideRoom', { rideId: 1 });

    clientSocket.on('joinedRoom', (data) => {
      expect(data.rideId).toBe(1);
      done();
    });
  });

  it('should broadcast ride updates', (done) => {
    const rideUpdate = {
      rideId: 1,
      status: 'accepted',
      driverId: 123,
    };

    clientSocket.emit('updateRideStatus', rideUpdate);

    clientSocket.on('rideStatusUpdate', (data) => {
      expect(data.rideId).toBe(1);
      expect(data.status).toBe('accepted');
      done();
    });
  });
});
```

### End-to-End Testing

```typescript
// Ride request flow E2E test
describe('Ride Request Flow', () => {
  it('should handle complete ride request to completion', async () => {
    // 1. Passenger requests ride
    const rideRequest = await request(app)
      .post('/api/rides')
      .send({
        originAddress: '123 Main St',
        destinationAddress: '456 Broadway',
        // ... other ride data
      })
      .expect(201);

    const rideId = rideRequest.body.id;

    // 2. Driver receives notification
    // Mock WebSocket connection and verify notification sent

    // 3. Driver accepts ride
    await request(app)
      .patch(`/api/rides/${rideId}/accept`)
      .send({ driverId: 123 })
      .expect(200);

    // 4. Passenger receives driver assignment notification
    // Verify WebSocket broadcast and push notification

    // 5. Driver arrives
    await request(app)
      .patch(`/api/rides/${rideId}/status`)
      .send({ status: 'arrived' })
      .expect(200);

    // 6. Ride starts
    await request(app)
      .patch(`/api/rides/${rideId}/status`)
      .send({ status: 'in_progress' })
      .expect(200);

    // 7. Ride completes
    await request(app)
      .patch(`/api/rides/${rideId}/status`)
      .send({ status: 'completed' })
      .expect(200);

    // Verify all notifications were sent appropriately
    // Verify database state
    // Verify payment processing
  });
});
```

---

## Monitoring and Analytics

### Key Metrics to Track

```typescript
// Monitoring service
@Injectable()
export class MonitoringService {
  constructor(private prometheusService: PrometheusService) {}

  // Notification delivery metrics
  async trackNotificationDelivery(
    notificationId: string,
    type: 'push' | 'sms',
    success: boolean,
    latency: number,
  ) {
    this.prometheusService.histogram(
      'notification_delivery_latency',
      latency,
      { type, success: success.toString() },
    );

    this.prometheusService.counter(
      'notification_delivery_total',
      1,
      { type, success: success.toString() },
    );
  }

  // WebSocket connection metrics
  async trackWebSocketConnection(userId: string, connected: boolean) {
    this.prometheusService.gauge(
      'websocket_connections_active',
      connected ? 1 : -1,
      { user_id: userId },
    );
  }

  // Ride status transition metrics
  async trackRideStatusTransition(
    rideId: number,
    fromStatus: string,
    toStatus: string,
    duration: number,
  ) {
    this.prometheusService.histogram(
      'ride_status_transition_duration',
      duration,
      { from_status: fromStatus, to_status: toStatus },
    );
  }
}
```

### Alert Configuration

```yaml
# Prometheus alerting rules
groups:
  - name: notification_alerts
    rules:
      - alert: HighNotificationFailureRate
        expr: rate(notification_delivery_total{success="false"}[5m]) > 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High notification failure rate detected"
          description: "Notification failure rate is {{ $value }} over the last 5 minutes"

      - alert: WebSocketConnectionIssues
        expr: websocket_connections_active < 10
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Low WebSocket connection count"
          description: "Only {{ $value }} active WebSocket connections"

      - alert: HighLatencyNotifications
        expr: histogram_quantile(0.95, rate(notification_delivery_latency_bucket[5m])) > 30000
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High notification latency"
          description: "95th percentile notification latency is {{ $value }}ms"
```

---

## Deployment Strategy

### Infrastructure Requirements

```yaml
# Docker Compose for development
version: '3.8'
services:
  nestjs-app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:password@postgres:5432/uber_clone
      - REDIS_URL=redis://redis:6379
      - FIREBASE_PROJECT_ID=your-project-id
      - TWILIO_ACCOUNT_SID=your-account-sid
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: uber_clone
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

### Production Deployment

```yaml
# Kubernetes deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: notification-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: notification-service
  template:
    metadata:
      labels:
        app: notification-service
    spec:
      containers:
      - name: notification-service
        image: your-registry/notification-service:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: database-url
        - name: REDIS_URL
          value: "redis://redis-service:6379"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

### Scaling Strategy

1. **Horizontal Pod Autoscaling**
   ```yaml
   apiVersion: autoscaling/v2
   kind: HorizontalPodAutoscaler
   metadata:
     name: notification-service-hpa
   spec:
     scaleTargetRef:
       apiVersion: apps/v1
       kind: Deployment
       name: notification-service
     minReplicas: 3
     maxReplicas: 20
     metrics:
     - type: Resource
       resource:
         name: cpu
         target:
           type: Utilization
           averageUtilization: 70
   ```

2. **Redis Clustering** for WebSocket scaling
3. **Database Read Replicas** for notification history
4. **CDN** for static notification assets

---

## Implementation Phases

### Phase 1: Core Infrastructure (Week 1-2)
- [ ] Set up NestJS project structure
- [ ] Implement basic notification service
- [ ] Set up Firebase Cloud Messaging
- [ ] Configure Twilio SMS service
- [ ] Create database migrations
- [ ] Implement basic push notification sending

### Phase 2: Real-Time Communication (Week 3-4)
- [ ] Implement WebSocket gateway
- [ ] Add Socket.io client to React Native
- [ ] Create room-based messaging
- [ ] Implement reconnection logic
- [ ] Add Redis adapter for scaling

### Phase 3: Ride Flow Integration (Week 5-6)
- [ ] Update ride status tracking
- [ ] Implement notification triggers for status changes
- [ ] Add driver location broadcasting
- [ ] Create in-app notification banners
- [ ] Implement SMS fallbacks

### Phase 4: Advanced Features (Week 7-8)
- [ ] Add chat functionality
- [ ] Implement emergency notifications
- [ ] Create notification preferences
- [ ] Add notification history
- [ ] Implement analytics tracking

### Phase 5: Testing & Optimization (Week 9-10)
- [ ] Write comprehensive unit tests
- [ ] Create integration tests
- [ ] Perform load testing
- [ ] Optimize performance
- [ ] Implement monitoring

### Phase 6: Deployment & Monitoring (Week 11-12)
- [ ] Set up production infrastructure
- [ ] Configure CI/CD pipelines
- [ ] Implement monitoring and alerting
- [ ] Create deployment documentation
- [ ] Perform production testing

---

## Risk Assessment

### High Risk Items

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| WebSocket connection failures | High | Medium | Implement reconnection logic, fallback to polling |
| Push notification delivery failures | High | Low | SMS fallback, retry mechanisms |
| Database performance under load | Medium | Medium | Read replicas, query optimization |
| Real-time location update delays | Medium | Low | Optimize WebSocket payload, implement compression |

### Contingency Plans

1. **WebSocket Failure**: Fallback to HTTP polling every 5 seconds
2. **Push Notification Failure**: Immediate SMS fallback for critical notifications
3. **Database Overload**: Implement caching layer with Redis
4. **Service Outage**: Circuit breaker pattern for external services

---

## Success Metrics

### Technical Metrics
- **Notification Delivery Rate**: > 95%
- **WebSocket Connection Success**: > 99%
- **API Response Time**: < 200ms (p95)
- **System Uptime**: > 99.9%

### Business Metrics
- **User Engagement**: Increase in app usage during rides
- **Ride Completion Rate**: Maintain current levels
- **User Satisfaction**: > 4.5 star rating
- **Support Ticket Reduction**: 30% reduction in ride-related queries

### Monitoring Dashboard

```typescript
// Key metrics to display
const metrics = {
  realTime: {
    activeConnections: 0,
    messagesPerSecond: 0,
    averageLatency: 0,
  },
  notifications: {
    pushDeliveryRate: 0,
    smsDeliveryRate: 0,
    averageDeliveryTime: 0,
  },
  rides: {
    activeRides: 0,
    completedToday: 0,
    averageCompletionTime: 0,
  },
  system: {
    cpuUsage: 0,
    memoryUsage: 0,
    errorRate: 0,
  },
};
```

---

## Conclusion

This implementation plan provides a comprehensive roadmap for adding a production-ready notification system to your Uber clone. The phased approach ensures:

1. **Gradual Implementation**: Each phase builds upon the previous one
2. **Risk Mitigation**: Contingency plans for potential issues
3. **Scalability**: Architecture designed to handle growth
4. **Reliability**: Multiple fallback mechanisms
5. **User Experience**: Real-time updates and seamless communication

### Next Steps

1. **Review and Approval**: Get stakeholder buy-in for the implementation plan
2. **Team Assignment**: Assign developers to specific phases
3. **Timeline Confirmation**: Adjust timelines based on team capacity
4. **Resource Allocation**: Ensure necessary infrastructure and tools are available
5. **Kickoff Meeting**: Start Phase 1 implementation

### Support and Documentation

- **API Documentation**: Auto-generated with Swagger/OpenAPI
- **Frontend Components**: Storybook documentation
- **Database Schema**: Version-controlled migrations
- **Deployment Guide**: Infrastructure as Code with Terraform
- **Monitoring Dashboard**: Real-time metrics and alerting

---

**Document Version:** 1.0  
**Last Updated:** January 2024  
**Review Date:** February 2024  
**Document Owner:** Development Team  
**Approval Status:** Ready for Implementation
