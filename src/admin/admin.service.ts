import {
  Injectable,
  UnauthorizedException,
  Logger,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { AdminRole, Permission } from './entities/admin.entity';
import { AdminJwtPayload } from './interfaces/admin.interface';
import {
  AdminLoginDto,
  AdminLoginResponseDto,
  RefreshTokenParams,
  AdminInfoDto,
} from './dto/admin-login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  // ===============================
  // AUTENTICACIÓN
  // ===============================

  /**
   * Login de administrador
   */
  async login(loginDto: AdminLoginDto): Promise<AdminLoginResponseDto> {
    const { email, password } = loginDto;
    this.logger.debug(`[Login] Intento de login para: ${email}`);

    const admin = await this.prisma.user.findFirst({
      where: { email: email.toLowerCase().trim(), userType: 'admin' },
    });

    if (!admin) {
      this.logger.warn(`[Login] Admin no encontrado: ${email}`);
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!admin.isActive) {
      this.logger.warn(`[Login] Cuenta desactivada: ${email}`);
      throw new UnauthorizedException('Esta cuenta ha sido desactivada');
    }

    if (!admin.password) {
      this.logger.error(`[Login] Admin sin contraseña configurada: ${email}`);
      throw new UnauthorizedException(
        'Cuenta no configurada correctamente. Contacte al soporte.',
      );
    }

    const isPasswordValid = await bcrypt.compare(
      password.trim(),
      admin.password.trim(),
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Generar tokens
    const payload: AdminJwtPayload = {
      sub: admin.id.toString(),
      email: admin.email,
      role: (admin.adminRole as AdminRole) || AdminRole.ADMIN,
      permissions: (admin.adminPermissions || []) as Permission[],
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    });
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    });

    await this.prisma.user.update({
      where: { id: admin.id },
      data: {
        lastLogin: new Date(),
        lastAdminLogin: new Date(),
        refreshToken: await bcrypt.hash(refreshToken, 12),
      },
    });

    this.logger.log(`[Login] Admin ${email} autenticado correctamente`);

    return {
      accessToken,
      refreshToken,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        isActive: admin.isActive,
        lastLogin: admin.lastLogin || new Date(),
        userType: admin.userType as 'user' | 'admin',
        adminRole: admin.adminRole as AdminRole,
        adminPermissions: (admin.adminPermissions || []) as Permission[],
        lastAdminLogin: admin.lastAdminLogin || new Date(),
        profileImage: admin.profileImage || null,
        phone: admin.phone || null,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt,
        role: undefined,
      },
      expiresIn: parseInt(process.env.JWT_EXPIRES_IN || '3600', 10),
    };
  }

  /**
   * Refrescar tokens
   */
  async refreshTokens(
    user: RefreshTokenParams,
  ): Promise<AdminLoginResponseDto> {
    this.logger.debug(`[Refresh] Intento de refresh para: ${user.email}`);

    const admin = await this.prisma.user.findUnique({
      where: { email: user.email, userType: 'admin', isActive: true },
    });

    if (!admin || !admin.refreshToken) {
      this.logger.warn(
        `[Refresh] Admin no encontrado o sin refresh token: ${user.email}`,
      );
      throw new UnauthorizedException('Acceso denegado');
    }

    // Validar que el refresh token enviado coincida con el hash en la DB
    const isTokenValid = await bcrypt.compare(
      user.refreshToken,
      admin.refreshToken,
    );
    if (!isTokenValid) {
      this.logger.warn(`[Refresh] Refresh token inválido para: ${user.email}`);
      throw new UnauthorizedException('Refresh token inválido');
    }

    const payload: AdminJwtPayload = {
      sub: admin.id.toString(),
      email: admin.email,
      role: (admin.adminRole as AdminRole) || AdminRole.ADMIN,
      permissions: (admin.adminPermissions || []) as Permission[],
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    });
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    });

    await this.prisma.user.update({
      where: { id: admin.id },
      data: {
        refreshToken: await bcrypt.hash(refreshToken, 12),
        lastLogin: new Date(),
        lastAdminLogin: new Date(),
      },
    });

    this.logger.log(`[Refresh] Tokens renovados para: ${admin.email}`);

    return {
      accessToken,
      refreshToken,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        isActive: admin.isActive,
        lastLogin: admin.lastLogin || new Date(),
        userType: admin.userType as 'user' | 'admin',
        adminRole: admin.adminRole as AdminRole,
        adminPermissions: (admin.adminPermissions || []) as Permission[],
        lastAdminLogin: admin.lastAdminLogin || new Date(),
        profileImage: admin.profileImage || null,
        phone: admin.phone || null,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt,
        role: undefined,
      },
      expiresIn: parseInt(process.env.JWT_EXPIRES_IN || '3600', 10),
    };
  }

  /**
   * Generar un token de prueba (solo debugging)
   */

  // ===============================
  // HELPERS
  // ===============================

  async FindAdminById(id: number): Promise<AdminInfoDto> {
    try {
      this.logger.debug(`[FindAdminById] Buscando admin con ID: ${id}`);

      const admin = await this.prisma.user.findUnique({
        where: { id, userType: 'admin' },
      });

      if (!admin) {
        this.logger.warn(`[FindAdminById] No se encontró admin con ID: ${id}`);
        throw new NotFoundException('Administrador no encontrado');
      }

      if (!admin.isActive) {
        this.logger.warn(`[FindAdminById] Cuenta desactivada: ${id}`);
        throw new UnauthorizedException('Esta cuenta ha sido desactivada');
      }

      if (!admin.password) {
        this.logger.error(
          `[FindAdminById] Admin sin contraseña configurada: ${id}`,
        );
        throw new UnauthorizedException(
          'Cuenta no configurada correctamente. Contacte al soporte.',
        );
      }

      this.logger.log(`[FindAdminById] Admin encontrado correctamente: ${id}`);

      return {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        isActive: admin.isActive,
        lastLogin: admin.lastLogin || new Date(),
        userType: admin.userType as 'user' | 'admin',
        adminRole: admin.adminRole as AdminRole,
        adminPermissions: (admin.adminPermissions || []) as Permission[],
        lastAdminLogin: admin.lastAdminLogin || new Date(),
        profileImage: admin.profileImage || null,
        phone: admin.phone || null,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt,
        role: (admin.adminRole as AdminRole) || AdminRole.ADMIN,
      };
    } catch (error: unknown) {
      this.logger.error(
        `[FindAdminById] Error al buscar admin con ID: ${id} → ${String(error)}`,
      );
      throw new InternalServerErrorException(
        'Error interno al buscar administrador',
      );
    }
  }

  private getDefaultPermissionsForRole(role: AdminRole): Permission[] {
    switch (role) {
      case AdminRole.SUPER_ADMIN:
        return Object.values(Permission);
      case AdminRole.ADMIN:
        return [
          Permission.USER_READ,
          Permission.USER_WRITE,
          Permission.DRIVER_APPROVE,
          Permission.DRIVER_READ,
          Permission.DRIVER_WRITE,
          Permission.RIDE_MONITOR,
          Permission.RIDE_READ,
          Permission.RIDE_WRITE,
          Permission.DELIVERY_READ,
          Permission.DELIVERY_WRITE,
          Permission.DELIVERY_MONITOR,
          Permission.FINANCIAL_READ,
          Permission.REPORTS_VIEW,
          Permission.STORE_READ,
          Permission.STORE_WRITE,
          Permission.STORE_APPROVE,
          Permission.PRODUCT_READ,
          Permission.PRODUCT_WRITE,
          Permission.NOTIFICATION_SEND,
          Permission.NOTIFICATION_READ,
        ];
      case AdminRole.MODERATOR:
        return [
          Permission.USER_READ,
          Permission.DRIVER_READ,
          Permission.RIDE_MONITOR,
          Permission.RIDE_READ,
          Permission.DELIVERY_READ,
          Permission.DELIVERY_MONITOR,
          Permission.REPORTS_VIEW,
          Permission.STORE_READ,
          Permission.PRODUCT_READ,
          Permission.NOTIFICATION_READ,
        ];
      case AdminRole.SUPPORT:
        return [
          Permission.USER_READ,
          Permission.DRIVER_READ,
          Permission.RIDE_READ,
          Permission.DELIVERY_READ,
          Permission.NOTIFICATION_SEND,
          Permission.NOTIFICATION_READ,
        ];
      default:
        return [];
    }
  }
}
