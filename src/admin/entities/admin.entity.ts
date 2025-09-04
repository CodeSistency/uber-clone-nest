// Entidad extendida para administradores (basada en User)
export class Admin {
  id: number;
  name: string;
  email: string;
  password?: string | null;
  clerkId?: string | null;
  isActive: boolean;
  lastLogin?: Date | null;
  createdAt: Date;
  updatedAt: Date;

  // Admin-specific fields
  userType: 'user' | 'admin' | null;
  adminRole: AdminRole | null;
  adminPermissions: Permission[];
  lastAdminLogin?: Date | null;
  adminCreatedAt?: Date | null;
  adminUpdatedAt?: Date | null;

  // Relations
  adminAuditLogs?: AdminAuditLog[];
}

// Entidad para logs de auditoría de administradores
export class AdminAuditLog {
  id: number;
  adminId: number;
  action: string;
  resource: string;
  resourceId?: string | null;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string | null;
  userAgent?: string | null;
  timestamp: Date;

  // Relations
  admin?: Admin;
}

// Roles definidos para el sistema RBAC
export enum AdminRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  SUPPORT = 'support'
}

// Permisos específicos por módulo
export enum Permission {
  // Users
  USER_READ = 'user:read',
  USER_WRITE = 'user:write',
  USER_DELETE = 'user:delete',

  // Drivers
  DRIVER_APPROVE = 'driver:approve',
  DRIVER_SUSPEND = 'driver:suspend',
  DRIVER_READ = 'driver:read',
  DRIVER_WRITE = 'driver:write',

  // Rides
  RIDE_MONITOR = 'ride:monitor',
  RIDE_INTERVENE = 'ride:intervene',
  RIDE_READ = 'ride:read',
  RIDE_WRITE = 'ride:write',

  // Delivery
  DELIVERY_READ = 'delivery:read',
  DELIVERY_WRITE = 'delivery:write',
  DELIVERY_MONITOR = 'delivery:monitor',

  // Financial
  PAYMENT_REFUND = 'payment:refund',
  WALLET_MANAGE = 'wallet:manage',
  FINANCIAL_READ = 'financial:read',

  // System
  SYSTEM_CONFIG = 'system:config',
  REPORTS_VIEW = 'reports:view',
  LOGS_VIEW = 'logs:view',

  // Stores & Products
  STORE_READ = 'store:read',
  STORE_WRITE = 'store:write',
  STORE_APPROVE = 'store:approve',
  PRODUCT_READ = 'product:read',
  PRODUCT_WRITE = 'product:write',

  // Notifications
  NOTIFICATION_SEND = 'notification:send',
  NOTIFICATION_READ = 'notification:read',
}
