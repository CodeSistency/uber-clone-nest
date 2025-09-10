import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AdminJwtPayload, AuthenticatedAdmin } from '../interfaces/admin.interface';
import { AdminService } from '../admin.service';
import { AdminRole } from '../entities/admin.entity';

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, 'admin-jwt') {
  constructor(private adminService: AdminService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-super-secret-jwt-key-here',
    });
  }

  async validate(payload: AdminJwtPayload): Promise<AuthenticatedAdmin> {
    const { sub: adminId, email } = payload;

    // Buscar el admin en la base de datos
    const admin = await this.adminService.findAdminById(adminId);

    if (!admin) {
      throw new UnauthorizedException('Admin not found');
    }

    if (!admin.isActive) {
      throw new UnauthorizedException('Admin account is deactivated');
    }

    // Retornar la información del admin autenticado
    return {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      userType: admin.userType || 'user',
      adminRole: admin.adminRole || AdminRole.SUPPORT,
      adminPermissions: admin.adminPermissions,
      lastAdminLogin: admin.lastAdminLogin || undefined,
    };
  }
}
