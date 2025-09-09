import { IsOptional, IsString, IsBoolean, Length } from 'class-validator';

export class UpdatePermissionDto {
  @IsOptional()
  @IsString()
  @Length(1, 150)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  module?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
