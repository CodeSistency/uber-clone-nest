
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
  
