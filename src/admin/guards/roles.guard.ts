import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AdminRole } from '../interfaces/admin.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<AdminRole[]>(
      'roles',
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true; // No roles required for this route
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user || !user.role) {
      throw new ForbiddenException('Usuario no autenticado o sin rol asignado');
    }

    const hasRole = requiredRoles.includes(user.role as AdminRole);

    if (!hasRole) {
      throw new ForbiddenException(
        `Rol insuficiente. Se requieren roles: ${requiredRoles.join(', ')}. Rol actual: ${user.role}`,
      );
    }

    return true;
  }
}
