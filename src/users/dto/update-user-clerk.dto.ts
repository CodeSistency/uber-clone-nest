import { IsOptional, IsString, IsEmail } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para actualizar usuario usando autenticación de Clerk
 * Solo se actualizan los campos proporcionados
 */
export class UpdateUserClerkDto {
  @ApiPropertyOptional({
    example: 'Updated Name',
    description: 'New name for the user'
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    example: 'updated.email@example.com',
    description: 'New email for the user'
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  // No incluimos clerkId porque no debería ser actualizable
}
