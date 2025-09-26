import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AdminPermission } from '../interfaces/admin.interface';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<
      AdminPermission[]
    >('permissions', [context.getHandler(), context.getClass()]);

    if (!requiredPermissions) {
      return true; // No permissions required for this route
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user || !user.permissions) {
      throw new ForbiddenException('Usuario no autenticado o sin permisos');
    }

    const hasPermission = requiredPermissions.every((permission) =>
      user.permissions.includes(permission),
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `Permisos insuficientes. Se requieren: ${requiredPermissions.join(', ')}`,
      );
    }

    return true;
  }
}
