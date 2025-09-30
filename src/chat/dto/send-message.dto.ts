import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty({
    description: 'Clerk ID of the user sending the message',
    example: 'user_2abc123def456',
    minLength: 10,
    maxLength: 50,
  })
  @IsNotEmpty()
  @IsString()
  senderId: string;

  @ApiProperty({
    description: 'The content of the chat message',
    example: "I'll be there in 2 minutes.",
    minLength: 1,
    maxLength: 1000,
  })
  @IsNotEmpty()
  @IsString()
  messageText: string;
}
