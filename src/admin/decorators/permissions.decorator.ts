import { SetMetadata } from '@nestjs/common';
import { Permission } from '../entities/admin.entity';

// Key para el metadata de permisos
export const PERMISSIONS_KEY = 'permissions';

/**
 * Decorator para especificar qué permisos requiere una ruta
 * @param permissions - Lista de permisos requeridos
 */
export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

/**
 * Decorator para rutas que requieren un rol específico
 */
export const RequireRole = (role: string) => SetMetadata('required_role', role);

/**
 * Decorator para rutas que requieren cualquier permiso de una lista
 */
export const RequireAnyPermission = (...permissions: Permission[]) =>
  SetMetadata('any_permission', permissions);

/**
 * Decorator para rutas que requieren todos los permisos de una lista
 */
export const RequireAllPermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
