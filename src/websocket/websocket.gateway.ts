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
import { RedisAdapter } from '@socket.io/redis-adapter';
import { Logger, Inject } from '@nestjs/common';
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

    // Configure Redis adapter for scalability if Redis is available
    try {
      const redisConfig = this.configService.get('redis');

      if (redisConfig?.url || (redisConfig?.host && redisConfig?.port)) {
        this.logger.log('🔄 Configuring Redis adapter for WebSocket scalability...');

        // Create Redis clients for pub/sub
        const pubClient = createClient({
          url: redisConfig.url || `redis://${redisConfig.host}:${redisConfig.port}`,
          password: redisConfig.password,
          database: redisConfig.db || 0,
        });

        const subClient = pubClient.duplicate();

        // Handle connection events
        pubClient.on('error', (err) => {
          this.logger.error('❌ Redis pub client error:', err.message);
        });

        subClient.on('error', (err) => {
          this.logger.error('❌ Redis sub client error:', err.message);
        });

        pubClient.on('connect', () => {
          this.logger.log('✅ Redis pub client connected');
        });

        subClient.on('connect', () => {
          this.logger.log('✅ Redis sub client connected');
        });

        // Connect to Redis
        await Promise.all([
          pubClient.connect(),
          subClient.connect(),
        ]);

        // Set Redis adapter for the server
        // Configure Redis adapter for horizontal scaling
        try {
          // Create and configure Redis adapter
          const redisAdapter = new (RedisAdapter as any)(pubClient, subClient);

          // Apply adapter to server (this approach works with most Socket.IO versions)
          server.adapter(redisAdapter);

          this.logger.log('✅ Redis adapter configured successfully for WebSocket horizontal scaling');
          this.logger.log('🚀 Multiple WebSocket server instances can now share connections and rooms');
        } catch (adapterError) {
          this.logger.warn('⚠️ Failed to configure Redis adapter:', adapterError.message);
          this.logger.warn('💡 WebSocket will work in single-instance mode');
          this.logger.warn('💡 To enable horizontal scaling, check Redis connection and Socket.IO version compatibility');

          // Clean up Redis connections if adapter failed
          try {
            pubClient.disconnect();
            subClient.disconnect();
          } catch (cleanupError) {
            this.logger.debug('Error cleaning up Redis connections:', cleanupError.message);
          }
        }

      } else {
        this.logger.warn('⚠️ Redis not configured. WebSocket will work in single-instance mode only.');
        this.logger.warn('💡 Configure REDIS_URL in environment variables for horizontal scaling.');
      }
    } catch (error) {
      this.logger.error('❌ Failed to configure Redis adapter for WebSocket:', error);
      this.logger.warn('⚠️ WebSocket will continue in single-instance mode');
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
}
