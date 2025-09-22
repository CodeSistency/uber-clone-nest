import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AdminService } from '../admin.service';

export const JWT_REFRESH_STRATEGY_NAME = 'jwt-refresh';

@Injectable()
export class AdminJwtRefreshStrategy extends PassportStrategy(Strategy, JWT_REFRESH_STRATEGY_NAME) {
  constructor(private adminService: AdminService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-here',
      passReqToCallback: true,
    });
  }

  async validate(req: any, payload: any) {
    // The JWT is already validated by Passport at this point
    // Just return the payload which will be attached to the request as req.user
    return { 
      id: payload.sub, 
      email: payload.email,
      role: payload.role,
      refreshToken: this.extractJwtFromRequest(req)
    };
  }

  private extractJwtFromRequest(req: any): string | null {
    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
      return req.headers.authorization.split(' ')[1];
    }
    return null;
  }
}
