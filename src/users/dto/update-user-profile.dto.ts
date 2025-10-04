import {
  IsOptional,
  IsString,
  IsEmail,
  IsIn,
  IsDateString,
  IsPhoneNumber,
  IsUrl,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class UpdateUserProfileDto {
  @ApiPropertyOptional({
    description: 'Full name of the user',
    example: 'Juan Carlos Pérez',
    minLength: 2,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  @MaxLength(100, { message: 'Name must not exceed 100 characters' })
  @Transform(({ value }) => value?.trim())
  name?: string;

  @ApiPropertyOptional({
    description: 'Email address of the user',
    example: 'juan.perez@example.com',
    format: 'email',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email?: string;

  @ApiPropertyOptional({
    description: 'Phone number of the user',
    example: '+584141234567',
    pattern: '^\\+[1-9]\\d{1,14}$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\+[1-9]\d{1,14}$/, {
    message: 'Phone number must be in international format (e.g., +584141234567)',
  })
  phone?: string;

  @ApiPropertyOptional({
    description: 'Date of birth of the user',
    example: '1990-05-15',
    format: 'date',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Date of birth must be a valid date in YYYY-MM-DD format' })
  dateOfBirth?: string;

  @ApiPropertyOptional({
    description: 'Gender of the user',
    example: 'male',
    enum: ['male', 'female', 'other', 'prefer_not_to_say'],
  })
  @IsOptional()
  @IsIn(['male', 'female', 'other', 'prefer_not_to_say'], {
    message: 'Gender must be one of: male, female, other, prefer_not_to_say',
  })
  gender?: string;

  @ApiPropertyOptional({
    description: 'Profile image URL',
    example: 'https://example.com/profile.jpg',
    format: 'uri',
  })
  @IsOptional()
  @IsUrl({}, { message: 'Profile image must be a valid URL' })
  profileImage?: string;

  @ApiPropertyOptional({
    description: 'Address of the user',
    example: 'Calle 123, Edificio ABC, Apartamento 4B',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Address must not exceed 255 characters' })
  @Transform(({ value }) => value?.trim())
  address?: string;

  @ApiPropertyOptional({
    description: 'City where the user lives',
    example: 'Caracas',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'City must not exceed 100 characters' })
  @Transform(({ value }) => value?.trim())
  city?: string;

  @ApiPropertyOptional({
    description: 'State or province where the user lives',
    example: 'Miranda',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'State must not exceed 100 characters' })
  @Transform(({ value }) => value?.trim())
  state?: string;

  @ApiPropertyOptional({
    description: 'Country where the user lives',
    example: 'Venezuela',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Country must not exceed 100 characters' })
  @Transform(({ value }) => value?.trim())
  country?: string;

  @ApiPropertyOptional({
    description: 'Postal code of the user',
    example: '1010',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'Postal code must not exceed 20 characters' })
  @Transform(({ value }) => value?.trim())
  postalCode?: string;

  @ApiPropertyOptional({
    description: 'Preferred language of the user',
    example: 'es',
    enum: ['es', 'en', 'pt', 'fr'],
  })
  @IsOptional()
  @IsIn(['es', 'en', 'pt', 'fr'], {
    message: 'Preferred language must be one of: es, en, pt, fr',
  })
  preferredLanguage?: string;

  @ApiPropertyOptional({
    description: 'Timezone of the user',
    example: 'America/Caracas',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'Timezone must not exceed 50 characters' })
  @Transform(({ value }) => value?.trim())
  timezone?: string;

  @ApiPropertyOptional({
    description: 'Preferred currency of the user',
    example: 'USD',
    enum: ['USD', 'EUR', 'VES', 'COP', 'BRL'],
  })
  @IsOptional()
  @IsIn(['USD', 'EUR', 'VES', 'COP', 'BRL'], {
    message: 'Currency must be one of: USD, EUR, VES, COP, BRL',
  })
  currency?: string;
}
