import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty({ example: 'user_2abc123def456' })
  @IsNotEmpty()
  @IsString()
  senderClerkId: string;

  @ApiProperty({ example: "I'll be there in 2 minutes." })
  @IsNotEmpty()
  @IsString()
  messageText: string;
}
