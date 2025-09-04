import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class AdminLoginDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;
}

export class AdminLoginResponseDto {
  accessToken: string;
  refreshToken: string;
  admin: {
    id: number;
    name: string;
    email: string;
    userType: 'user' | 'admin';
    adminRole: string;
    adminPermissions: string[];
    lastAdminLogin?: Date;
  };
  expiresIn: number;
}
