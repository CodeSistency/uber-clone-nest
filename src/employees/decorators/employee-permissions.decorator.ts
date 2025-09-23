import { SetMetadata } from '@nestjs/common';
import { Permission } from '../../admin/entities/admin.entity';

// Key para el metadata de permisos de empleados
export const EMPLOYEE_PERMISSIONS_KEY = 'employee_permissions';

/**
 * Decorator para especificar qué permisos requiere una ruta de empleados
 * @param permissions - Lista de permisos requeridos (BUSSINESS_READ, BUSSINESS_WRITE, BUSSINESS_APPROVE)
 */
export const RequireEmployeePermissions = (...permissions: Permission[]) =>
  SetMetadata(EMPLOYEE_PERMISSIONS_KEY, permissions);

/**
 * Decorator para rutas que requieren permisos de lectura (BUSINESS_READ)
 */
export const RequireEmployeeRead = () =>
  RequireEmployeePermissions(Permission.BUSSINESS_READ);

/**
 * Decorator para rutas que requieren permisos de escritura (BUSINESS_WRITE)
 */
export const RequireEmployeeWrite = () =>
  RequireEmployeePermissions(Permission.BUSSINESS_WRITE);

/**
 * Decorator para rutas que requieren permisos de aprobación (BUSINESS_APPROVE)
 */
export const RequireEmployeeApprove = () =>
  RequireEmployeePermissions(Permission.BUSSINESS_APPROVE);

/**
 * Decorator para rutas que requieren permisos de escritura y aprobación
 */
export const RequireEmployeeWriteAndApprove = () =>
  RequireEmployeePermissions(Permission.BUSSINESS_WRITE, Permission.BUSSINESS_APPROVE);
