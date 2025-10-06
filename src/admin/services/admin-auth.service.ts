import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { AdminLoginDto, AdminLoginResponseDto } from '../dto/admin-login.dto';
import {
  AdminRole,
  AdminPermission,
  AdminJwtPayload,
  ROLE_PERMISSIONS,
} from '../interfaces/admin.interface';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AdminAuthService {
  private readonly logger = new Logger(AdminAuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async login(loginDto: AdminLoginDto): Promise<AdminLoginResponseDto> {
    const { email, password } = loginDto;

    // Find admin user with admin relation
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        isActive: true,
        lastLogin: true,
        admin: {
          select: {
            role: true,
            permissions: true,
            lastLogin: true,
          },
        },
      },
    });

    // Validate user exists and is admin
    if (!user) {
      this.logger.warn(`Login attempt for non-existent user: ${email}`);
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!user.isActive) {
      this.logger.warn(`Login attempt for inactive user: ${email}`);
      throw new UnauthorizedException('Cuenta inactiva');
    }
    console.log(user);
    if (!user.admin) {
      this.logger.warn(`Login attempt for non-admin user: ${email}`);
      throw new UnauthorizedException('Acceso no autorizado');
    }

    // Validate password
    if (!user.password) {
      this.logger.warn(`User has no password set: ${email}`);
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      this.logger.warn(`Invalid password for user: ${email}`);
      throw new UnauthorizedException('Credenciales inválidas');
    }

    

    // Generate tokens
    const permissions =
      (user.admin.permissions as AdminPermission[]) ||
      ROLE_PERMISSIONS[user.admin.role as AdminRole] ||
      [];

    const payload: AdminJwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.admin.role as AdminRole,
      permissions,
    };

    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);
    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        lastLogin: new Date(),
        refreshToken: refreshToken,
        admin: {
          update: { 
            lastLogin: new Date(),
          },
        },
      },
    });

    // Log successful login
    this.logger.log(`Admin login successful: ${email} (${user.admin.role})`);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.admin.role || 'ADMIN',
        permissions,
      },
      expires_in: this.getAccessTokenExpiration(),
    };
  }

  async validateAdmin(payload: AdminJwtPayload): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        admin: {
          select: {
            role: true,
            permissions: true,
          },
        },
      },
    });

    if (!user || !user.isActive || !user.admin) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.admin.role,
      permissions:
        user.admin.permissions ||
        ROLE_PERMISSIONS[user.admin.role as AdminRole] ||
        [],
    };
  }

  async refreshToken(refreshToken: string): Promise<AdminLoginResponseDto> {
    try {
      if (!refreshToken || typeof refreshToken !== 'string') {
        this.logger.error(
          `Invalid refresh token provided: ${typeof refreshToken}`,
        );
        throw new UnauthorizedException('Refresh token inválido');
      }

      const payload = this.jwtService.verify(refreshToken, {
        secret:
          this.configService.get('ADMIN_JWT_REFRESH_SECRET') ||
          this.configService.get('JWT_SECRET'),
      });

      const user = await this.validateAdmin(payload);
      if (!user) {
        throw new UnauthorizedException('Token inválido');
      }

      const newPayload: AdminJwtPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
      };

      return {
        access_token: this.generateAccessToken(newPayload),
        refresh_token: this.generateRefreshToken(newPayload),
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          permissions: user.permissions,
        },
        expires_in: this.getAccessTokenExpiration(),
      };
    } catch (error) {
      this.logger.error(`Token refresh failed: ${error.message}`);
      throw new UnauthorizedException('Token de refresco inválido');
    }
  }

  private generateAccessToken(payload: AdminJwtPayload): string {
    return this.jwtService.sign(payload, {
      secret:
        this.configService.get('ADMIN_JWT_SECRET') ||
        this.configService.get('JWT_SECRET'),
      expiresIn:
        this.configService.get('ADMIN_JWT_EXPIRES_IN') ||
        this.configService.get('JWT_EXPIRES_IN') ||
        '1h',
    });
  }

  private generateRefreshToken(payload: AdminJwtPayload): string {
    return this.jwtService.sign(payload, {
      secret:
        this.configService.get('ADMIN_JWT_REFRESH_SECRET') ||
        this.configService.get('JWT_SECRET'),
      expiresIn:
        this.configService.get('ADMIN_JWT_REFRESH_EXPIRES_IN') ||
        this.configService.get('JWT_REFRESH_EXPIRES_IN') ||
        '7d',
    });
  }

  private getAccessTokenExpiration(): number {
    const expiresIn =
      this.configService.get('ADMIN_JWT_EXPIRES_IN') ||
      this.configService.get('JWT_EXPIRES_IN') ||
      '1h';
    // Convert to seconds (simplified - in production you'd use a proper library)
    const seconds = expiresIn.includes('h') ? parseInt(expiresIn) * 3600 : 3600;
    return Math.floor(Date.now() / 1000) + seconds;
  }
}
