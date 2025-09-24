import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Permission } from '../entities/admin.entity';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { AuthenticatedAdmin } from '../interfaces/admin.interface';

@Injectable()
export class PermissionsGuard implements CanActivate {
  private readonly logger = new Logger(PermissionsGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Obtener los permisos requeridos del metadata
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Si no hay permisos requeridos, permitir acceso
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    // Obtener el admin del request
    const request = context.switchToHttp().getRequest();
    const admin: AuthenticatedAdmin = request.admin;

    this.logger.debug('PermissionsGuard - checking admin in request:', {
      hasAdmin: !!admin,
      adminEmail: admin?.email,
      adminRole: admin?.adminRole,
      permissionsCount: admin?.adminPermissions?.length || 0,
      requestKeys: Object.keys(request),
    });

    if (!admin) {
      this.logger.warn(
        'No admin found in request - available request properties:',
        Object.keys(request),
      );
      throw new ForbiddenException('Admin not authenticated');
    }

    // Verificar si el admin tiene todos los permisos requeridos
    const hasAllPermissions = requiredPermissions.every(
      (permission) => admin.adminPermissions?.includes(permission) ?? false,
    );

    if (!hasAllPermissions) {
      this.logger.warn(
        `Admin ${admin.email} lacks required permissions: ${requiredPermissions.join(', ')}`,
      );
      throw new ForbiddenException(
        'You do not have the required permissions to access this resource',
      );
    }

    this.logger.debug(
      `Admin ${admin.email} has required permissions: ${requiredPermissions.join(', ')}`,
    );

    return true;
  }
}
