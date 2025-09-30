import { SetMetadata } from '@nestjs/common';
import { AdminPermission, AdminRole } from '../interfaces/admin.interface';

export const PERMISSIONS_KEY = 'permissions';
export const ROLES_KEY = 'roles';

export const Permissions = (...permissions: AdminPermission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

// Convenience decorator for requiring specific permissions
export const RequirePermissions = (...permissions: AdminPermission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

// Roles decorator
export const Roles = (...roles: AdminRole[]) => SetMetadata(ROLES_KEY, roles);

// Convenience decorator for requiring specific roles
export const RequireRoles = (...roles: AdminRole[]) =>
  SetMetadata(ROLES_KEY, roles);
