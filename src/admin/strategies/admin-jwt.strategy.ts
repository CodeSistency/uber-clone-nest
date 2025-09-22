import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AdminJwtPayload, AuthenticatedAdmin } from '../interfaces/admin.interface';
import { AdminService } from '../admin.service';
import { AdminRole } from '../entities/admin.entity';

export const JWT_STRATEGY_NAME = 'admin-jwt';

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, JWT_STRATEGY_NAME) {
  private readonly logger = new Logger(AdminJwtStrategy.name);

  constructor(private adminService: AdminService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-super-secret-jwt-key-here',
    });
  }

  async validate(payload: AdminJwtPayload): Promise<AuthenticatedAdmin> {
    this.logger.debug('Validating admin JWT payload:', {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
      permissionsCount: payload.permissions?.length || 0
    });

    const { sub: adminId, email } = payload;

    // Buscar el admin en la base de datos
    this.logger.debug(`Looking up admin by ID: ${adminId}`);
    const admin = await this.adminService.findAdminById(adminId);

    if (!admin) {
      this.logger.error(`Admin not found in database:`, { adminId, email });
      throw new UnauthorizedException('Admin not found');
    }

    if (!admin.isActive) {
      this.logger.warn(`Admin account is deactivated:`, { adminId, email });
      throw new UnauthorizedException('Admin account is deactivated');
    }

    this.logger.debug(`Admin found and active:`, {
      id: admin.id,
      email: admin.email,
      userType: admin.userType,
      adminRole: admin.adminRole,
      permissionsCount: admin.adminPermissions?.length || 0
    });

    // Retornar la información del admin autenticado
    return {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      userType: admin.userType || 'user',
      adminRole: admin.adminRole || AdminRole.SUPPORT,
      isActive: admin.isActive,
      adminPermissions: admin.adminPermissions,
      lastAdminLogin: admin.lastAdminLogin || undefined,
    };
  }
}
