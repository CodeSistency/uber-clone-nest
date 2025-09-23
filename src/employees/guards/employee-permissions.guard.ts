import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Permission } from '../../admin/entities/admin.entity';
import { EMPLOYEE_PERMISSIONS_KEY } from '../decorators/employee-permissions.decorator';

/**
 * Guard que valida permisos específicos para operaciones de empleados.
 * Este guard está diseñado para usuarios business (no necesariamente admins)
 * que necesitan permisos específicos para gestionar empleados.
 *
 * Los permisos requeridos son:
 * - BUSINESS_READ: Para operaciones de lectura
 * - BUSINESS_WRITE: Para operaciones de escritura (crear, actualizar, eliminar)
 * - BUSINESS_APPROVE: Para operaciones de aprobación (activar/desactivar)
 */
interface BusinessUser {
  id: number;
  email: string;
  permissions?: Permission[];
  businessPermissions?: Permission[];
}

/**
 * Guard que valida permisos para operaciones de gestión de empleados.
 * Busca el usuario autenticado en request.user y valida que tenga
 * los permisos requeridos para la operación específica.
 */
@Injectable()
export class EmployeePermissionsGuard implements CanActivate {
  private readonly logger = new Logger(EmployeePermissionsGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Obtener los permisos requeridos del metadata
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      EMPLOYEE_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()]
    );

    // Si no hay permisos requeridos, permitir acceso
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    // Obtener el usuario del request (usuario business autenticado)
    const request = context.switchToHttp().getRequest();
    const user: BusinessUser = request.user;

    this.logger.debug('EmployeePermissionsGuard - checking user in request:', {
      hasUser: !!user,
      userEmail: user?.email,
      userId: user?.id,
      permissionsCount: user?.permissions?.length || user?.businessPermissions?.length || 0,
      requiredPermissions: requiredPermissions,
      requestKeys: Object.keys(request)
    });

    if (!user) {
      this.logger.warn('No user found in request for employee operation');
      throw new UnauthorizedException('Authentication required for this operation');
    }

    // Verificar si el usuario tiene todos los permisos requeridos
    // Primero buscar en businessPermissions, luego en permissions general
    const userPermissions = user.businessPermissions || user.permissions || [];
    const hasAllPermissions = requiredPermissions.every(permission =>
      userPermissions.includes(permission)
    );

    if (!hasAllPermissions) {
      this.logger.warn(
        `User ${user.email} lacks required employee permissions: ${requiredPermissions.join(', ')}. User permissions: ${userPermissions.join(', ') || 'none'}`
      );
      throw new ForbiddenException(
        `You need the following permissions to perform this employee operation: ${requiredPermissions.join(', ')}`
      );
    }

    this.logger.debug(
      `User ${user.email} has required employee permissions: ${requiredPermissions.join(', ')}`
    );

    return true;
  }
}
