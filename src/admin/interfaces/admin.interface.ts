import { AdminRole, Permission } from '../entities/admin.entity';

// Interfaz para el payload del JWT de admin
export interface AdminJwtPayload {
  sub: number; // Admin ID
  email: string;
  role: AdminRole;
  permissions: Permission[];
  iat?: number;
  exp?: number;
}

// Interfaz para el admin autenticado en el request
export interface AuthenticatedAdmin {
  id: number;
  name: string;
  email: string;
  userType: 'user' | 'admin' | null;
  adminRole: AdminRole | null;
  adminPermissions: Permission[];
  lastAdminLogin?: Date | null;
}

// Interfaz para métricas del dashboard
export interface DashboardMetrics {
  // Usuarios
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;

  // Drivers
  totalDrivers: number;
  onlineDrivers: number;
  pendingVerifications: number;
  approvedDrivers: number;
  suspendedDrivers: number;

  // Rides
  activeRides: number;
  completedRidesToday: number;
  cancelledRidesToday: number;
  completedRidesThisWeek: number;
  totalRides: number;

  // Delivery
  activeOrders: number;
  completedOrdersToday: number;
  completedOrdersThisWeek: number;
  totalOrders: number;

  // Financial
  totalRevenue: number;
  revenueToday: number;
  revenueThisWeek: number;
  revenueThisMonth: number;
  pendingPayments: number;
  totalWalletBalance: number;

  // Stores
  totalStores: number;
  activeStores: number;
  pendingStores: number;

  // System
  totalNotificationsSent: number;
  systemUptime: string;
}

// Interfaz para filtros de búsqueda de usuarios
export interface UserFilters {
  search?: string; // nombre, email, teléfono
  status?: string[];
  registrationDate?: DateRange;
  rideCount?: NumberRange;
  rating?: NumberRange;
  location?: LocationFilter;
  hasWallet?: boolean;
  isVerified?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Interfaz para filtros de búsqueda de drivers
export interface DriverFilters {
  search?: string;
  status?: string[];
  verificationStatus?: string[];
  rideCount?: NumberRange;
  rating?: NumberRange;
  location?: LocationFilter;
  canDoDeliveries?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Interfaz para filtros de búsqueda de rides
export interface RideFilters {
  status?: string[];
  paymentStatus?: string[];
  dateRange?: DateRange;
  driverId?: number;
  userId?: string;
  tierId?: number;
  minFare?: number;
  maxFare?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Interfaz para filtros de búsqueda de stores
export interface StoreFilters {
  search?: string;
  category?: string[];
  isOpen?: boolean;
  rating?: NumberRange;
  ownerId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Interfaces auxiliares
export interface DateRange {
  start: Date;
  end: Date;
}

export interface NumberRange {
  min: number;
  max: number;
}

export interface LocationFilter {
  latitude: number;
  longitude: number;
  radius: number; // en kilómetros
}

// Interfaz para logs de auditoría
export interface AuditLog {
  id: string;
  adminId: number;
  adminEmail: string;
  action: string;
  resource: string;
  resourceId: string;
  oldValue?: any;
  newValue?: any;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

// Interfaz para configuración del sistema
export interface SystemConfig {
  // Pricing
  baseFare: number;
  perMinuteRate: number;
  perMileRate: number;

  // Commissions
  driverCommission: number;
  platformFee: number;
  deliveryCommission: number;

  // Safety
  sosResponseTime: number;
  emergencyContacts: string[];

  // Features
  features: {
    scheduledRides: boolean;
    delivery: boolean;
    promotions: boolean;
    wallet: boolean;
    notifications: boolean;
  };

  // Limits
  limits: {
    maxRideDistance: number;
    maxDeliveryDistance: number;
    maxActiveRidesPerDriver: number;
    maxActiveOrdersPerCourier: number;
  };
}
