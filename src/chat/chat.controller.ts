import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { ChatMessage } from '@prisma/client';
import { SendMessageDto } from './dto/send-message.dto';

@ApiTags('chat')
@Controller('api/chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get(':rideId/messages')
  @ApiOperation({ summary: 'Get chat history for a specific ride' })
  @ApiParam({ name: 'rideId', description: 'The unique ID of the ride' })
  @ApiResponse({ status: 200, description: 'Returns an array of chat messages' })
  @ApiResponse({ status: 400, description: 'Ride ID is missing' })
  @ApiResponse({ status: 500, description: 'Database error' })
  async getRideMessages(@Param('rideId') rideId: string): Promise<ChatMessage[]> {
    return this.chatService.getRideMessages(Number(rideId));
  }

  @Get('order/:orderId/messages')
  @ApiOperation({ summary: 'Get chat history for a specific order' })
  @ApiParam({ name: 'orderId', description: 'The unique ID of the order' })
  @ApiResponse({ status: 200, description: 'Returns an array of chat messages' })
  async getOrderMessages(@Param('orderId') orderId: string): Promise<ChatMessage[]> {
    return this.chatService.getOrderMessages(Number(orderId));
  }

  @Post(':rideId/messages')
  @ApiOperation({ summary: 'Send a new message in the chat for a ride' })
  @ApiParam({ name: 'rideId', description: 'The unique ID of the ride' })
  @ApiBody({ type: SendMessageDto })
  @ApiResponse({ status: 201, description: 'Message sent successfully' })
  @ApiResponse({ status: 400, description: 'Missing fields' })
  @ApiResponse({ status: 500, description: 'Database error' })
  async sendRideMessage(
    @Param('rideId') rideId: string,
    @Body() sendMessageDto: SendMessageDto,
  ): Promise<ChatMessage> {
    return this.chatService.sendRideMessage(Number(rideId), sendMessageDto);
  }

  @Post('order/:orderId/messages')
  @ApiOperation({ summary: 'Send a new message in the chat for an order' })
  @ApiParam({ name: 'orderId', description: 'The unique ID of the order' })
  @ApiBody({ type: SendMessageDto })
  @ApiResponse({ status: 201, description: 'Message sent successfully' })
  async sendOrderMessage(
    @Param('orderId') orderId: string,
    @Body() sendMessageDto: SendMessageDto,
  ): Promise<ChatMessage> {
    return this.chatService.sendOrderMessage(Number(orderId), sendMessageDto);
  }

  @Get('user/:userId/messages')
  @ApiOperation({ summary: 'Get all messages sent by a user' })
  @ApiParam({ name: 'userId', description: 'The Clerk ID of the user' })
  @ApiResponse({ status: 200, description: 'Returns user messages' })
  async getUserMessages(@Param('userId') userId: string): Promise<ChatMessage[]> {
    return this.chatService.getUserMessages(userId);
  }
}
