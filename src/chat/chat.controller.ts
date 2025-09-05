import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { ChatMessage } from '@prisma/client';
import { SendMessageDto } from './dto/send-message.dto';

@ApiTags('chat')
@Controller('api/chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get(':rideId/messages')
  @ApiOperation({
    summary: 'Get chat history for a specific ride',
    description: 'Retrieve all chat messages exchanged between driver and passenger for a specific ride'
  })
  @ApiParam({
    name: 'rideId',
    description: 'The unique ID of the ride',
    example: '1',
    type: Number
  })
  @ApiResponse({
    status: 200,
    description: 'Returns an array of chat messages ordered by timestamp',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          rideId: { type: 'number', example: 1 },
          senderId: { type: 'string', example: 'user_2abc123def456' },
          messageText: { type: 'string', example: "I'll be there in 2 minutes." },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' }
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Ride ID is missing or invalid'
  })
  @ApiResponse({ status: 403, description: 'Not authorized to view this ride chat' })
  @ApiResponse({ status: 404, description: 'Ride not found' })
  @ApiResponse({ status: 500, description: 'Database error' })
  async getRideMessages(
    @Param('rideId') rideId: string,
  ): Promise<ChatMessage[]> {
    return this.chatService.getRideMessages(Number(rideId));
  }

  @Get('order/:orderId/messages')
  @ApiOperation({
    summary: 'Get chat history for a specific order',
    description: 'Retrieve all chat messages for a delivery order conversation'
  })
  @ApiParam({
    name: 'orderId',
    description: 'The unique ID of the delivery order',
    example: '1',
    type: Number
  })
  @ApiResponse({
    status: 200,
    description: 'Returns an array of chat messages for the order',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          orderId: { type: 'number', example: 1 },
          senderId: { type: 'string', example: 'user_2abc123def456' },
          messageText: { type: 'string', example: 'Package delivered successfully.' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' }
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Order ID is missing or invalid'
  })
  @ApiResponse({ status: 403, description: 'Not authorized to view this order chat' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 500, description: 'Database error' })
  async getOrderMessages(
    @Param('orderId') orderId: string,
  ): Promise<ChatMessage[]> {
    return this.chatService.getOrderMessages(Number(orderId));
  }

  @Post(':rideId/messages')
  @ApiOperation({
    summary: 'Send a new message in the chat for a ride',
    description: 'Send a message in the ride chat between driver and passenger'
  })
  @ApiParam({
    name: 'rideId',
    description: 'The unique ID of the ride',
    example: '1',
    type: Number
  })
  @ApiBody({
    type: SendMessageDto,
    description: 'Message details including sender and content'
  })
  @ApiResponse({
    status: 201,
    description: 'Message sent successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        rideId: { type: 'number', example: 1 },
        senderId: { type: 'string', example: 'user_2abc123def456' },
        messageText: { type: 'string', example: "I'll be there in 2 minutes." },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Missing fields or invalid message content'
  })
  @ApiResponse({ status: 403, description: 'Not authorized to send messages for this ride' })
  @ApiResponse({ status: 404, description: 'Ride not found' })
  @ApiResponse({ status: 500, description: 'Database error' })
  async sendRideMessage(
    @Param('rideId') rideId: string,
    @Body() sendMessageDto: SendMessageDto,
  ): Promise<ChatMessage> {
    return this.chatService.sendRideMessage(Number(rideId), sendMessageDto);
  }

  @Post('order/:orderId/messages')
  @ApiOperation({
    summary: 'Send a new message in the chat for an order',
    description: 'Send a message in the delivery order chat conversation'
  })
  @ApiParam({
    name: 'orderId',
    description: 'The unique ID of the delivery order',
    example: '1',
    type: Number
  })
  @ApiBody({
    type: SendMessageDto,
    description: 'Message details including sender and content'
  })
  @ApiResponse({
    status: 201,
    description: 'Message sent successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        orderId: { type: 'number', example: 1 },
        senderId: { type: 'string', example: 'user_2abc123def456' },
        messageText: { type: 'string', example: 'Package is on the way.' },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Missing fields or invalid message content'
  })
  @ApiResponse({ status: 403, description: 'Not authorized to send messages for this order' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 500, description: 'Database error' })
  async sendOrderMessage(
    @Param('orderId') orderId: string,
    @Body() sendMessageDto: SendMessageDto,
  ): Promise<ChatMessage> {
    return this.chatService.sendOrderMessage(Number(orderId), sendMessageDto);
  }

  @Get('user/:userId/messages')
  @ApiOperation({
    summary: 'Get all messages sent by a user',
    description: 'Retrieve all chat messages sent by a specific user across all rides and orders'
  })
  @ApiParam({
    name: 'userId',
    description: 'The Clerk ID of the user whose messages to retrieve',
    example: 'user_2abc123def456'
  })
  @ApiResponse({
    status: 200,
    description: 'Returns an array of all messages sent by the user',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          rideId: { type: 'number', example: 1, nullable: true },
          orderId: { type: 'number', example: null, nullable: true },
          senderId: { type: 'string', example: 'user_2abc123def456' },
          messageText: { type: 'string', example: 'Thank you for the ride!' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' }
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'User ID is missing or invalid'
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 500, description: 'Database error' })
  async getUserMessages(
    @Param('userId') userId: string,
  ): Promise<ChatMessage[]> {
    return this.chatService.getUserMessages(userId);
  }
}
