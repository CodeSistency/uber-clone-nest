import { IsNotEmpty, IsString, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class AddFundsDto {
  @ApiProperty({ example: 'user_2abc123def456' })
  @IsNotEmpty()
  @IsString()
  userClerkId: string;

  @ApiProperty({ example: 50.0 })
  @IsNotEmpty()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ example: 'Wallet top-up' })
  @IsNotEmpty()
  @IsString()
  description: string;
}
