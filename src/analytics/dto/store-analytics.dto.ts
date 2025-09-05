export interface StoreAnalytics {
  // Ventas
  totalRevenue: number;
  ordersCount: number;
  averageOrderValue: number;

  // Productos
  topProducts: { productId: number; name: string; sold: number }[];
  lowStockProducts: { id: number; name: string; stock: number }[];

  // Rendimiento
  averagePreparationTime: number;
  customerSatisfaction: number;

  // Tendencias
  revenueByDay: { date: string; amount: number }[];
  peakHours: { hour: number; orders: number }[];
}
