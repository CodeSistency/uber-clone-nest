import { IsNotEmpty, IsString, IsOptional, IsNumber, IsBoolean, Length, Matches } from 'class-validator';

export class CreateGroupDto {
  @IsNotEmpty()
  @IsString()
  @Length(1, 100)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Color must be a valid hex color (e.g. #FF0000)' })
  color?: string;

  @IsOptional()
  @IsBoolean()
  isSystem?: boolean;

  @IsOptional()
  @IsNumber()
  priority?: number;
}
