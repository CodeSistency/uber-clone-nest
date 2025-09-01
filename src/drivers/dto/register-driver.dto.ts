import { IsNotEmpty, IsString, IsEmail, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDriverDto {
  @ApiProperty({ example: 'Alex Rodriguez' })
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Rodriguez' })
  @IsNotEmpty()
  @IsString()
  lastName: string;

  @ApiProperty({ example: 'alex.r@example.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'user_2driverclerkid' })
  @IsNotEmpty()
  @IsString()
  clerkId: string;

  @ApiProperty({ example: 'Toyota Camry' })
  @IsNotEmpty()
  @IsString()
  carModel: string;

  @ApiProperty({ example: 'ABC-1234' })
  @IsNotEmpty()
  @IsString()
  licensePlate: string;

  @ApiProperty({ example: 4 })
  @IsNotEmpty()
  @IsNumber()
  carSeats: number;

  @ApiProperty({ example: 'https://example.com/profile.jpg', required: false })
  @IsOptional()
  @IsString()
  profileImageUrl?: string;

  @ApiProperty({ example: 'https://example.com/car.jpg', required: false })
  @IsOptional()
  @IsString()
  carImageUrl?: string;
}
