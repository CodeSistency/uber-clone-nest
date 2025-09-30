import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { Logger } from '@nestjs/common';
import { createClient } from 'redis';
import { RealTimeService } from './real-time.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ConfigService } from '@nestjs/config';
import {
  NotificationType,
  NotificationChannel,
} from '../notifications/interfaces/notification.interface';
import { DriverLocationUpdateDto } from './dto/driver-location-update.dto';
import { RideJoinDto } from './dto/ride-join.dto';
import { RideAcceptDto } from './dto/ride-accept.dto';
import { ChatMessageDto } from './dto/chat-message.dto';
import { DriverStatusUpdateDto } from './dto/driver-status-update.dto';
import { EmergencySOSDto } from './dto/emergency-sos.dto';
import { RideCompleteDto } from './dto/ride-complete.dto';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  namespace: '/uber-realtime',
})
export class WebSocketGatewayClass
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('WebSocketGateway');

  constructor(
    private readonly realTimeService: RealTimeService,
    private readonly notificationsService: NotificationsService,
    private readonly configService: ConfigService,
  ) {}

  async afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');

    // Log Redis configuration for debugging
    const redisConfig = this.configService.get('redis');
    this.logger.log('🔍 Redis Config Debug:');
    this.logger.log(`- URL: ${redisConfig?.url || 'Not set'}`);
    this.logger.log(`- Host: ${redisConfig?.host || 'Not set'}`);
    this.logger.log(`- Port: ${redisConfig?.port || 'Not set'}`);
    this.logger.log(`- Password: ${redisConfig?.password ? 'Set' : 'Not set'}`);
    this.logger.log(`- DB: ${redisConfig?.db || 'Not set'}`);

    // Log Socket.IO version and createAdapter availability
    this.logger.log('🔍 Socket.IO Debug:');
    this.logger.log(`- Server version: ${this.getSocketIOVersion()}`);
    this.logger.log(`- createAdapter available: ${!!createAdapter}`);
    if (createAdapter) {
      this.logger.log(`- createAdapter type: ${typeof createAdapter}`);
      this.logger.log(
        `- createAdapter function: ${createAdapter.name}`,
      );
    }

    // Configure Redis adapter for scalability if Redis is available
    try {
      if (redisConfig?.url || (redisConfig?.host && redisConfig?.port)) {
        this.logger.log(
          '🔄 Configuring Redis adapter for WebSocket scalability...',
        );

        // Create Redis clients for pub/sub
        const pubClient = createClient({
          url:
            redisConfig.url ||
            `redis://${redisConfig.host}:${redisConfig.port}`,
          password: redisConfig.password,
          database: redisConfig.db || 0,
        });

        const subClient = pubClient.duplicate();

        // Handle connection events with detailed logging
        pubClient.on('error', (err) => {
          this.logger.error('❌ Redis pub client error:', err.message);
          this.logger.error('❌ Redis pub client error details:', err);
        });

        subClient.on('error', (err) => {
          this.logger.error('❌ Redis sub client error:', err.message);
          this.logger.error('❌ Redis sub client error details:', err);
        });

        pubClient.on('connect', () => {
          this.logger.log('✅ Redis pub client connected');
        });

        subClient.on('connect', () => {
          this.logger.log('✅ Redis sub client connected');
        });

        pubClient.on('ready', () => {
          this.logger.log('✅ Redis pub client ready');
        });

        subClient.on('ready', () => {
          this.logger.log('✅ Redis sub client ready');
        });

        // Connect to Redis with timeout
        try {
          this.logger.log('🔄 Attempting to connect Redis clients...');
          await Promise.all([pubClient.connect(), subClient.connect()]);
          this.logger.log('✅ Redis clients connected successfully');
        } catch (connectError: any) {
          this.logger.error(
            '❌ Failed to connect Redis clients:',
            connectError.message,
          );
          this.logger.error('❌ Redis connection error details:', connectError);
          throw connectError;
        }

        // Crear Redis adapter usando createAdapter
        try {
          this.logger.log('🔄 Creating Redis adapter using createAdapter...');

          // createAdapter espera (pubClient, subClient)
          const adapter = createAdapter(pubClient, subClient);

          // Aplicar adapter al servidor principal (desde el namespace)
          (server as any).server.adapter(adapter);

          this.logger.log('✅ Redis adapter configured successfully for WebSocket horizontal scaling');
          this.logger.log('🚀 Multiple WebSocket server instances can now share connections and rooms');
        } catch (adapterError: any) {
          this.logger.error('❌ Failed to configure Redis adapter:', adapterError.message);
          this.logger.error('❌ Adapter error details:', adapterError);
          this.logger.error('❌ Adapter error stack:', adapterError.stack);

          // Fallback a adapter en memoria (Socket.IO ya usa por defecto el in-memory adapter)
          this.logger.warn('⚠️ Falling back to in-memory adapter for WebSocket');
          this.logger.warn('💡 To enable horizontal scaling, check Redis connection and Socket.IO version compatibility');

          // Intentar cerrar conexiones redis
          try {
            await pubClient.disconnect().catch(() => {});
            await subClient.disconnect().catch(() => {});
          } catch (cleanupError) {
            this.logger.warn('⚠️ Failed to clean up Redis connections:', cleanupError?.message || cleanupError);
          }
        }
      } else {
        this.logger.warn(
          '⚠️ Redis not configured. WebSocket will work in single-instance mode only.',
        );
        this.logger.warn(
          '💡 Configure REDIS_URL or REDIS_HOST/REDIS_PORT to enable horizontal scaling',
        );
      }
    } catch (error: any) {
      this.logger.error(
        '❌ Failed to configure Redis adapter for WebSocket:',
        error.message,
      );
      this.logger.error('❌ Redis setup error details:', error);
      this.logger.error('❌ Redis setup error stack:', error.stack);
      this.logger.warn('⚠️ WebSocket will continue in single-instance mode');
      this.logger.warn(
        '💡 Check Redis server availability and network connectivity',
      );
    }
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    this.realTimeService.addClient(client);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.realTimeService.removeClient(client);
  }

  // Driver location updates
  @SubscribeMessage('driver:location:update')
  handleDriverLocationUpdate(
    @MessageBody()
    data: DriverLocationUpdateDto,
  ) {
    const { driverId, location, rideId } = data;

    // Update driver location in real-time service
    this.realTimeService.updateDriverLocation(driverId, location);

    // If there's an active ride, notify passengers
    if (rideId) {
      this.server.to(`ride-${rideId}`).emit('driver:location:updated', {
        driverId,
        location,
        timestamp: new Date(),
      });
    }

    return { status: 'success', message: 'Location updated' };
  }

  // User joins ride tracking
  @SubscribeMessage('ride:join')
  handleJoinRide(@MessageBody() data: RideJoinDto) {
    const { rideId, userId } = data;

    // Join ride room
    // Note: client.join() is synchronous in Socket.IO v4+
    // client.join(`ride-${rideId}`);
    this.realTimeService.addUserToRide(userId, rideId);

    this.logger.log(`User ${userId} joined ride ${rideId}`);

    // Send current driver location if available
    const driverLocation =
      this.realTimeService.getDriverLocationForRide(rideId);
    // Note: In a real implementation, you'd emit to the client here

    return { status: 'success', message: 'Joined ride tracking' };
  }

  // Driver accepts ride
  @SubscribeMessage('ride:accept')
  async handleRideAccept(
    @MessageBody() data: RideAcceptDto,
    @ConnectedSocket() client: Socket,
  ) {
    const { rideId, driverId, userId } = data;

    // Update ride status
    this.realTimeService.assignDriverToRide(rideId, driverId);

    // Send push/SMS notification to passenger
    try {
      await this.notificationsService.notifyRideStatusUpdate(
        rideId,
        userId,
        driverId,
        'accepted',
        {
          driverName: 'Driver', // This would come from driver data
          vehicleInfo: 'Vehicle info', // This would come from driver data
        },
      );
      this.logger.log(`Sent ride acceptance notification for ride ${rideId}`);
    } catch (error) {
      this.logger.error(
        `Failed to send ride acceptance notification for ride ${rideId}:`,
        error,
      );
    }

    // Notify all users in the ride room via WebSocket
    this.server.to(`ride-${rideId}`).emit('ride:accepted', {
      rideId,
      driverId,
      timestamp: new Date(),
    });

    return { status: 'success', message: 'Ride accepted' };
  }

  // Chat messages
  @SubscribeMessage('chat:message')
  handleChatMessage(
    @MessageBody()
    data: ChatMessageDto,
  ) {
    const { rideId, orderId, senderId, message } = data;

    const roomId = rideId ? `ride-${rideId}` : `order-${orderId}`;

    // Broadcast message to room
    this.server.to(roomId).emit('chat:new-message', {
      senderId,
      message,
      timestamp: new Date(),
      type: rideId ? 'ride' : 'order',
    });

    return { status: 'success', message: 'Message sent' };
  }

  // Driver status updates
  @SubscribeMessage('driver:status:update')
  handleDriverStatusUpdate(@MessageBody() data: DriverStatusUpdateDto) {
    const { driverId, status } = data;

    // Update driver status
    this.realTimeService.updateDriverStatus(driverId, status);

    // Broadcast to all connected clients
    this.server.emit('driver:status:changed', {
      driverId,
      status,
      timestamp: new Date(),
    });

    return { status: 'success', message: 'Status updated' };
  }

  // Emergency SOS
  @SubscribeMessage('emergency:sos')
  async handleEmergencySOS(
    @MessageBody()
    data: EmergencySOSDto,
  ) {
    const { userId, rideId, location, message } = data;

    // Get driver info for this ride
    const driverId = this.realTimeService.getDriverForRide(rideId);

    // Send emergency notification via push/SMS
    try {
      await this.notificationsService.sendNotification({
        userId: driverId ? driverId.toString() : userId,
        type: NotificationType.EMERGENCY_TRIGGERED,
        title: '🚨 Emergency Alert!',
        message: `Emergency: ${message}`,
        data: {
          rideId,
          location,
          emergencyType: 'sos',
        },
        channels: [NotificationChannel.PUSH, NotificationChannel.SMS],
        priority: 'critical',
      });
      this.logger.log(`Sent emergency notification for ride ${rideId}`);
    } catch (error) {
      this.logger.error(
        `Failed to send emergency notification for ride ${rideId}:`,
        error,
      );
    }

    // Broadcast SOS to driver and emergency services via WebSocket
    this.server.to(`ride-${rideId}`).emit('emergency:sos-triggered', {
      userId,
      rideId,
      location,
      message,
      timestamp: new Date(),
    });

    // Also broadcast to emergency room (for emergency services)
    this.server.to('emergency-services').emit('emergency:sos-alert', {
      userId,
      rideId,
      driverId,
      location,
      message,
      timestamp: new Date(),
    });

    return { status: 'success', message: 'SOS alert sent' };
  }

  // Ride completion
  @SubscribeMessage('ride:complete')
  async handleRideComplete(
    @MessageBody()
    data: RideCompleteDto,
  ) {
    const { rideId, driverId, userId, fare } = data;

    // Remove driver from ride
    this.realTimeService.completeRide(rideId);

    // Send completion notification via push/SMS
    try {
      await this.notificationsService.notifyRideStatusUpdate(
        rideId,
        userId,
        driverId,
        'completed',
        {
          fare: fare,
        },
      );
      this.logger.log(`Sent ride completion notification for ride ${rideId}`);
    } catch (error) {
      this.logger.error(
        `Failed to send ride completion notification for ride ${rideId}:`,
        error,
      );
    }

    // Notify all users in the ride room via WebSocket
    this.server.to(`ride-${rideId}`).emit('ride:completed', {
      rideId,
      driverId,
      fare,
      timestamp: new Date(),
    });

    return { status: 'success', message: 'Ride completed' };
  }

  private getSocketIOVersion(): string {
    try {
      // Try to get version from package.json
      const fs = require('fs');
      const path = require('path');
      const packagePath = path.join(
        process.cwd(),
        'node_modules',
        'socket.io',
        'package.json',
      );
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      return packageJson.version;
    } catch (error) {
      return 'unknown';
    }
  }
}
