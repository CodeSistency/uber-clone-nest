import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChatMessage } from '@prisma/client';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async getRideMessages(rideId: number): Promise<ChatMessage[]> {
    return this.prisma.chatMessage.findMany({
      where: { rideId },
      include: {
        sender: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async getOrderMessages(orderId: number): Promise<ChatMessage[]> {
    return this.prisma.chatMessage.findMany({
      where: { orderId },
      include: {
        sender: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async sendRideMessage(rideId: number, sendMessageDto: SendMessageDto): Promise<ChatMessage> {
    const { senderClerkId, messageText } = sendMessageDto;

    return this.prisma.chatMessage.create({
      data: {
        rideId,
        senderClerkId,
        messageText,
      },
      include: {
        sender: true,
      },
    });
  }

  async sendOrderMessage(orderId: number, sendMessageDto: SendMessageDto): Promise<ChatMessage> {
    const { senderClerkId, messageText } = sendMessageDto;

    return this.prisma.chatMessage.create({
      data: {
        orderId,
        senderClerkId,
        messageText,
      },
      include: {
        sender: true,
      },
    });
  }

  async getUserMessages(userId: string): Promise<ChatMessage[]> {
    return this.prisma.chatMessage.findMany({
      where: { senderClerkId: userId },
      include: {
        sender: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
