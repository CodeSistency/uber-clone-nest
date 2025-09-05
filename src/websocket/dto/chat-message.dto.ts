import { IsNotEmpty, IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChatMessageDto {
  @ApiPropertyOptional({
    description: 'ID of the ride for ride-specific chat (mutually exclusive with orderId)',
    example: 1,
    type: Number
  })
  @IsOptional()
  @IsNumber()
  rideId?: number;

  @ApiPropertyOptional({
    description: 'ID of the order for delivery-specific chat (mutually exclusive with rideId)',
    example: 1,
    type: Number
  })
  @IsOptional()
  @IsNumber()
  orderId?: number;

  @ApiProperty({
    description: 'Clerk ID of the user sending the message',
    example: 'user_2abc123def456'
  })
  @IsNotEmpty()
  @IsString()
  senderId: string;

  @ApiProperty({
    description: 'Content of the chat message',
    example: 'I\'m running 5 minutes late due to traffic.',
    minLength: 1,
    maxLength: 1000
  })
  @IsNotEmpty()
  @IsString()
  message: string;
}




