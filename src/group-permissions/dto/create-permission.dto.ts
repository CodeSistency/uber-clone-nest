import { IsNotEmpty, IsString, IsOptional, Length } from 'class-validator';

export class CreatePermissionDto {
  @IsNotEmpty()
  @IsString()
  @Length(1, 100)
  code: string;

  @IsNotEmpty()
  @IsString()
  @Length(1, 150)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsString()
  @Length(1, 50)
  module: string;
}
