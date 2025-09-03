import { IsNotEmpty, IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para crear usuario usando autenticación de Clerk
 * El clerkId se obtiene automáticamente del token JWT
 */
export class CreateUserClerkDto {
  @ApiProperty({
    description: 'Full name of the user (obtained from Clerk token)',
    example: 'John Doe',
    minLength: 2,
    maxLength: 100
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Email address of the user (obtained from Clerk token)',
    example: 'john.doe@example.com',
    format: 'email'
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  // clerkId se obtiene del token, no se requiere en el body
}
