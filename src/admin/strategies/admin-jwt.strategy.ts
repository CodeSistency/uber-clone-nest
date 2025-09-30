import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AdminAuthService } from '../services/admin-auth.service';
import { AdminJwtPayload } from '../interfaces/admin.interface';

export const JWT_STRATEGY_NAME = 'admin-jwt';

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(
  Strategy,
  JWT_STRATEGY_NAME,
) {
  constructor(
    private configService: ConfigService,
    private adminAuthService: AdminAuthService,
  ) {
    const secret =
      configService.get<string>('ADMIN_JWT_SECRET') ||
      configService.get<string>('JWT_SECRET');

    if (!secret) {
      throw new Error('JWT secret not configured for admin authentication');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: AdminJwtPayload) {
    const user = await this.adminAuthService.validateAdmin(payload);

    if (!user) {
      throw new UnauthorizedException('Token inválido o usuario no encontrado');
    }

    // Return user object that will be attached to request.user
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      permissions: user.permissions,
    };
  }
}
