// Admin roles and permissions interfaces
export enum AdminRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  SUPPORT = 'support',
}

export enum AdminPermission {
  // User management permissions
  USERS_READ = 'users:read',
  USERS_WRITE = 'users:write',
  USERS_DELETE = 'users:delete',
  USERS_SUSPEND = 'users:suspend',
  USERS_VERIFY = 'users:verify',

  // Driver management permissions
  DRIVERS_READ = 'drivers:read',
  DRIVERS_WRITE = 'drivers:write',
  DRIVERS_DELETE = 'drivers:delete',
  DRIVERS_VERIFY = 'drivers:verify',
  DRIVERS_SUSPEND = 'drivers:suspend',

  // Ride management permissions
  RIDES_READ = 'rides:read',
  RIDES_WRITE = 'rides:write',
  RIDES_CANCEL = 'rides:cancel',
  RIDES_REASSIGN = 'rides:reassign',
  RIDES_REFUND = 'rides:refund',

  // Analytics and reports permissions
  ANALYTICS_READ = 'analytics:read',
  REPORTS_READ = 'reports:read',
  REPORTS_GENERATE = 'reports:generate',
  REPORTS_EXPORT = 'reports:export',

  // Notifications permissions
  NOTIFICATIONS_READ = 'notifications:read',
  NOTIFICATIONS_WRITE = 'notifications:write',
  NOTIFICATIONS_SEND = 'notifications:send',

  // Pricing management permissions
  PRICING_READ = 'pricing:read',
  PRICING_WRITE = 'pricing:write',

  // Geographical Management
  GEOGRAPHY_READ = 'geography:read',
  GEOGRAPHY_WRITE = 'geography:write',

  // System configuration permissions
  CONFIG_READ = 'config:read',
  CONFIG_WRITE = 'config:write',
  SYSTEM_CONFIG_READ = 'system:config:read',
  SYSTEM_CONFIG_WRITE = 'system:config:write',
  SYSTEM_MAINTENANCE = 'system:maintenance',

  // Admin permissions
  ADMIN = 'admin',

  // Emergency and safety permissions
  EMERGENCY_INTERVENE = 'emergency:intervene',
  SAFETY_MONITOR = 'safety:monitor',
}

export interface AdminUser {
  id: number;
  email: string;
  name: string;
  role: AdminRole;
  permissions: AdminPermission[];
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
}

export interface AdminJwtPayload {
  sub: number;
  email: string;
  role: AdminRole;
  permissions: AdminPermission[];
  iat?: number;
  exp?: number;
}

// Permission matrix by role
export const ROLE_PERMISSIONS: Record<AdminRole, AdminPermission[]> = {
  [AdminRole.SUPER_ADMIN]: Object.values(AdminPermission),

  [AdminRole.ADMIN]: [
    // User permissions
    AdminPermission.USERS_READ,
    AdminPermission.USERS_WRITE,
    AdminPermission.USERS_SUSPEND,
    AdminPermission.USERS_VERIFY,

    // Driver permissions
    AdminPermission.DRIVERS_READ,
    AdminPermission.DRIVERS_WRITE,
    AdminPermission.DRIVERS_DELETE,
    AdminPermission.DRIVERS_VERIFY,
    AdminPermission.DRIVERS_SUSPEND,

    // Ride permissions
    AdminPermission.RIDES_READ,
    AdminPermission.RIDES_WRITE,
    AdminPermission.RIDES_CANCEL,
    AdminPermission.RIDES_REASSIGN,
    AdminPermission.RIDES_REFUND,

    // Analytics permissions
    AdminPermission.ANALYTICS_READ,
    AdminPermission.REPORTS_READ,
    AdminPermission.REPORTS_GENERATE,
    AdminPermission.REPORTS_EXPORT,

    // Notifications permissions
    AdminPermission.NOTIFICATIONS_READ,
    AdminPermission.NOTIFICATIONS_WRITE,
    AdminPermission.NOTIFICATIONS_SEND,

    // Pricing permissions
    AdminPermission.PRICING_READ,
    AdminPermission.PRICING_WRITE,

    // Geographical permissions
    AdminPermission.GEOGRAPHY_READ,
    AdminPermission.GEOGRAPHY_WRITE,

    // Configuration permissions
    AdminPermission.CONFIG_READ,
    AdminPermission.CONFIG_WRITE,

    // System permissions (limited)
    AdminPermission.SYSTEM_CONFIG_READ,

    // Emergency permissions
    AdminPermission.EMERGENCY_INTERVENE,
    AdminPermission.SAFETY_MONITOR,
  ],

  [AdminRole.MODERATOR]: [
    // Limited user permissions
    AdminPermission.USERS_READ,

    // Limited driver permissions
    AdminPermission.DRIVERS_READ,
    AdminPermission.DRIVERS_VERIFY,

    // Limited ride permissions
    AdminPermission.RIDES_READ,
    AdminPermission.RIDES_CANCEL,

    // Analytics permissions (read-only)
    AdminPermission.ANALYTICS_READ,
    AdminPermission.NOTIFICATIONS_READ,

    // Safety monitoring
    AdminPermission.SAFETY_MONITOR,
  ],

  [AdminRole.SUPPORT]: [
    // Basic user permissions
    AdminPermission.USERS_READ,

    // Basic ride permissions
    AdminPermission.RIDES_READ,

    // Safety monitoring (limited)
    AdminPermission.SAFETY_MONITOR,
  ],
};
