# 🛒 **Sistema de Marketplace & Delivery - Documentación Completa**

## 📋 **Resumen Ejecutivo**

Este documento describe la implementación completa del **sistema de marketplace y delivery** para Uber Clone. Incluye desde la gestión de negocios hasta el flujo completo de pedidos de delivery, incluyendo integración con drivers, pagos y notificaciones.

---

## 🏗️ **Arquitectura del Sistema**

### **Componentes Principales**

```
📦 MARKETPLACE SYSTEM
├── 🏪 Stores Management (Negocios)
├── 📋 Products Management (Productos)
├── 🛒 Orders Management (Pedidos)
├── 🚚 Delivery Assignment (Asignación)
├── 💳 Payment Processing (Pagos)
└── 📊 Analytics & Reporting (Reportes)
```

### **Modelos de Datos (Ya definidos en Prisma)**

#### **🏪 Store Model**
```prisma
model Store {
  id           Int      @id @default(autoincrement())
  name         String   @db.VarChar(150)
  address      String   @db.VarChar(255)
  latitude     Decimal  @db.Decimal(9, 6)
  longitude    Decimal  @db.Decimal(9, 6)
  category     String?  @db.VarChar(50)        // 'restaurant', 'grocery', 'pharmacy'
  cuisineType  String?  @map("cuisine_type")   // 'italian', 'mexican', 'asian'
  logoUrl      String?  @map("logo_url")
  rating       Decimal  @default(0.00) @db.Decimal(3, 2)
  isOpen       Boolean  @default(true) @map("is_open")
  ownerClerkId String?  @map("owner_clerk_id") // Dueño del negocio
  phone        String?  @db.VarChar(20)
  email        String?  @db.VarChar(100)
  description  String?

  // Relations
  products       Product[]
  deliveryOrders DeliveryOrder[]
  ratings        Rating[]

  @@map("stores")
}
```

#### **📋 Product Model**
```prisma
model Product {
  id          Int      @id @default(autoincrement())
  storeId     Int      @map("store_id")
  name        String   @db.VarChar(150)
  description String?
  price       Decimal  @db.Decimal(10, 2)
  imageUrl    String?  @map("image_url")
  category    String?  @db.VarChar(50)        // 'main', 'drink', 'dessert'
  isAvailable Boolean  @default(true) @map("is_available")
  stock       Int?     @default(0)            // Para productos con inventario
  preparationTime Int? @map("preparation_time") // Minutos
  allergens   String?  // JSON string con alérgenos

  // Relations
  store      Store       @relation(fields: [storeId], references: [id], onDelete: Cascade)
  orderItems OrderItem[]

  @@map("products")
}
```

#### **🛒 DeliveryOrder Model**
```prisma
model DeliveryOrder {
  orderId          Int      @id @default(autoincrement()) @map("order_id")
  userClerkId      String   @map("user_clerk_id") @db.VarChar(50)
  storeId          Int      @map("store_id")
  courierId        Int?     @map("courier_id")
  deliveryAddress  String   @map("delivery_address") @db.VarChar(255)
  deliveryLatitude  Decimal  @map("delivery_latitude") @db.Decimal(9, 6)
  deliveryLongitude Decimal @map("delivery_longitude") @db.Decimal(9, 6)
  totalPrice       Decimal  @map("total_price") @db.Decimal(10, 2)
  deliveryFee      Decimal  @map("delivery_fee") @db.Decimal(10, 2)
  tip              Decimal  @default(0.00) @db.Decimal(10, 2)
  status           String   @default("pending") @db.VarChar(50)
  paymentStatus    String   @default("pending") @map("payment_status") @db.VarChar(20)
  createdAt        DateTime @default(now()) @map("created_at")
  estimatedDeliveryTime DateTime? @map("estimated_delivery_time")
  actualDeliveryTime DateTime? @map("actual_delivery_time")
  specialInstructions String? @map("special_instructions")
  paymentMethod   String?  @map("payment_method") @db.VarChar(20)

  // Relations
  user     User?      @relation(fields: [userClerkId], references: [clerkId])
  store    Store      @relation(fields: [storeId], references: [id])
  courier  Driver?    @relation(fields: [courierId], references: [id])
  orderItems OrderItem[]
  ratings   Rating[]
  messages  ChatMessage[]

  @@map("delivery_orders")
}
```

#### **📦 OrderItem Model**
```prisma
model OrderItem {
  id               Int     @id @default(autoincrement())
  orderId          Int     @map("order_id")
  productId        Int     @map("product_id")
  quantity         Int
  priceAtPurchase  Decimal @map("price_at_purchase") @db.Decimal(10, 2)
  specialRequests  String? @map("special_requests") // "Sin cebolla", "Extra queso"

  // Relations
  order   DeliveryOrder @relation(fields: [orderId], references: [orderId], onDelete: Cascade)
  product Product       @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@map("order_items")
}
```

---

## 🎯 **Módulos a Implementar**

### **1. 🏪 Stores Module**

#### **StoresController**
```typescript
@Controller('stores')
@UseGuards(JwtAuthGuard)
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  // Endpoints para usuarios/clientes
  @Get()
  @ApiOperation({ summary: 'Get nearby stores' })
  async getNearbyStores(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
    @Query('radius') radius: number = 5,
    @Query('category') category?: string,
  ) {
    return this.storesService.getNearbyStores(lat, lng, radius, category);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get store details with products' })
  async getStoreDetails(@Param('id') id: number) {
    return this.storesService.getStoreWithProducts(id);
  }

  @Get(':id/products')
  @ApiOperation({ summary: 'Get store products' })
  async getStoreProducts(
    @Param('id') id: number,
    @Query('category') category?: string,
  ) {
    return this.storesService.getStoreProducts(id, category);
  }

  // Endpoints para propietarios de negocios
  @Post()
  @UseGuards(StoreOwnerGuard)
  @ApiOperation({ summary: 'Create new store' })
  async createStore(@Body() createStoreDto: CreateStoreDto) {
    return this.storesService.createStore(createStoreDto);
  }

  @Put(':id')
  @UseGuards(StoreOwnerGuard)
  @ApiOperation({ summary: 'Update store' })
  async updateStore(
    @Param('id') id: number,
    @Body() updateStoreDto: UpdateStoreDto,
  ) {
    return this.storesService.updateStore(id, updateStoreDto);
  }

  @Post(':id/products')
  @UseGuards(StoreOwnerGuard)
  @ApiOperation({ summary: 'Add product to store' })
  async addProduct(
    @Param('id') id: number,
    @Body() createProductDto: CreateProductDto,
  ) {
    return this.storesService.addProduct(id, createProductDto);
  }

  @Put(':id/products/:productId')
  @UseGuards(StoreOwnerGuard)
  @ApiOperation({ summary: 'Update product' })
  async updateProduct(
    @Param('id') id: number,
    @Param('productId') productId: number,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.storesService.updateProduct(productId, updateProductDto);
  }
}
```

#### **StoresService**
```typescript
@Injectable()
export class StoresService {
  constructor(private prisma: PrismaService) {}

  async getNearbyStores(
    lat: number,
    lng: number,
    radius: number = 5,
    category?: string,
  ): Promise<Store[]> {
    // Calcular bounding box para búsqueda eficiente
    const earthRadius = 6371; // km
    const latDelta = (radius / earthRadius) * (180 / Math.PI);
    const lngDelta = (radius / earthRadius) * (180 / Math.PI) / Math.cos((lat * Math.PI) / 180);

    const minLat = lat - latDelta;
    const maxLat = lat + latDelta;
    const minLng = lng - lngDelta;
    const maxLng = lng + lngDelta;

    return this.prisma.store.findMany({
      where: {
        latitude: { gte: minLat, lte: maxLat },
        longitude: { gte: minLng, lte: maxLng },
        isOpen: true,
        ...(category && { category }),
      },
      include: {
        _count: {
          select: { products: true }
        },
        products: {
          where: { isAvailable: true },
          take: 3, // Preview de productos
        },
      },
      orderBy: { rating: 'desc' },
    });
  }

  async getStoreWithProducts(storeId: number): Promise<Store> {
    return this.prisma.store.findUnique({
      where: { id: storeId },
      include: {
        products: {
          where: { isAvailable: true },
          orderBy: { category: 'asc' },
        },
        ratings: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async createStore(createStoreDto: CreateStoreDto): Promise<Store> {
    const { ownerClerkId, ...storeData } = createStoreDto;

    return this.prisma.store.create({
      data: {
        ...storeData,
        ownerClerkId,
      },
    });
  }

  async addProduct(storeId: number, createProductDto: CreateProductDto): Promise<Product> {
    return this.prisma.product.create({
      data: {
        ...createProductDto,
        storeId,
      },
    });
  }
}
```

### **2. 🛒 Orders Module**

#### **OrdersController**
```typescript
@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create new delivery order' })
  async createOrder(@Body() createOrderDto: CreateOrderDto, @Req() req) {
    return this.ordersService.createOrder(createOrderDto, req.user.clerkId);
  }

  @Get()
  @ApiOperation({ summary: 'Get user orders' })
  async getUserOrders(
    @Query('status') status?: string,
    @Query('limit') limit: number = 20,
    @Req() req,
  ) {
    return this.ordersService.getUserOrders(req.user.clerkId, status, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order details' })
  async getOrderDetails(@Param('id') id: number, @Req() req) {
    return this.ordersService.getOrderDetails(id, req.user.clerkId);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel order' })
  async cancelOrder(@Param('id') id: number, @Req() req) {
    return this.ordersService.cancelOrder(id, req.user.clerkId);
  }

  @Post(':id/rate')
  @ApiOperation({ summary: 'Rate order and delivery' })
  async rateOrder(
    @Param('id') id: number,
    @Body() ratingDto: RateOrderDto,
    @Req() req,
  ) {
    return this.ordersService.rateOrder(id, ratingDto, req.user.clerkId);
  }

  // Endpoints para couriers/drivers
  @Get('available')
  @UseGuards(DriverGuard)
  @ApiOperation({ summary: 'Get available orders for delivery' })
  async getAvailableOrders(@Req() req) {
    return this.ordersService.getAvailableOrdersForDelivery(req.driver.id);
  }

  @Post(':id/accept')
  @UseGuards(DriverGuard)
  @ApiOperation({ summary: 'Accept delivery order' })
  async acceptOrder(@Param('id') id: number, @Req() req) {
    return this.ordersService.acceptOrderForDelivery(id, req.driver.id);
  }

  @Post(':id/pickup')
  @UseGuards(DriverGuard)
  @ApiOperation({ summary: 'Mark order as picked up' })
  async pickupOrder(@Param('id') id: number, @Req() req) {
    return this.ordersService.markOrderPickedUp(id, req.driver.id);
  }

  @Post(':id/deliver')
  @UseGuards(DriverGuard)
  @ApiOperation({ summary: 'Mark order as delivered' })
  async deliverOrder(@Param('id') id: number, @Req() req) {
    return this.ordersService.markOrderDelivered(id, req.driver.id);
  }
}
```

#### **OrdersService**
```typescript
@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private websocketService: RealTimeService,
  ) {}

  async createOrder(
    createOrderDto: CreateOrderDto,
    userClerkId: string,
  ): Promise<DeliveryOrder> {
    const { items, ...orderData } = createOrderDto;

    // Calcular total
    const totalPrice = await this.calculateOrderTotal(items);

    // Calcular delivery fee basado en distancia
    const deliveryFee = await this.calculateDeliveryFee(
      orderData.storeId,
      orderData.deliveryLatitude,
      orderData.deliveryLongitude,
    );

    // Crear orden
    const order = await this.prisma.deliveryOrder.create({
      data: {
        ...orderData,
        userClerkId,
        totalPrice,
        deliveryFee,
        orderItems: {
          create: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            priceAtPurchase: item.price,
            specialRequests: item.specialRequests,
          })),
        },
      },
      include: {
        orderItems: {
          include: { product: true },
        },
        store: true,
      },
    });

    // Notificar conductores disponibles
    await this.notifyNearbyCouriers(order);

    return order;
  }

  async acceptOrderForDelivery(
    orderId: number,
    driverId: number,
  ): Promise<DeliveryOrder> {
    const order = await this.prisma.deliveryOrder.update({
      where: { orderId },
      data: {
        courierId: driverId,
        status: 'accepted',
        estimatedDeliveryTime: new Date(Date.now() + 45 * 60 * 1000), // 45 min
      },
      include: {
        store: true,
        user: true,
        courier: true,
        orderItems: { include: { product: true } },
      },
    });

    // Notificar usuario
    await this.notificationsService.sendNotification({
      userId: order.userClerkId,
      type: 'order_accepted',
      title: 'Order Accepted!',
      message: `Your order from ${order.store.name} is being prepared`,
      data: { orderId: order.orderId },
      channels: [NotificationChannel.PUSH],
    });

    // Notificar tienda
    await this.notificationsService.sendNotification({
      userId: order.store.ownerClerkId!,
      type: 'order_assigned',
      title: 'New Order Assigned',
      message: `Order #${order.orderId} has been assigned to a courier`,
      data: { orderId: order.orderId },
      channels: [NotificationChannel.PUSH],
    });

    return order;
  }

  async markOrderPickedUp(
    orderId: number,
    driverId: number,
  ): Promise<DeliveryOrder> {
    const order = await this.prisma.deliveryOrder.update({
      where: {
        orderId,
        courierId: driverId,
        status: 'accepted',
      },
      data: {
        status: 'picked_up',
      },
      include: { user: true, store: true },
    });

    // Notificar usuario
    await this.notificationsService.sendNotification({
      userId: order.userClerkId,
      type: 'order_picked_up',
      title: 'Order Picked Up!',
      message: `Your order from ${order.store.name} is on the way`,
      data: { orderId: order.orderId },
      channels: [NotificationChannel.PUSH],
    });

    return order;
  }

  async markOrderDelivered(
    orderId: number,
    driverId: number,
  ): Promise<DeliveryOrder> {
    const order = await this.prisma.deliveryOrder.update({
      where: {
        orderId,
        courierId: driverId,
        status: 'picked_up',
      },
      data: {
        status: 'delivered',
        actualDeliveryTime: new Date(),
      },
      include: { user: true, store: true },
    });

    // Notificar usuario
    await this.notificationsService.sendNotification({
      userId: order.userClerkId,
      type: 'order_delivered',
      title: 'Order Delivered!',
      message: `Your order from ${order.store.name} has been delivered`,
      data: { orderId: order.orderId },
      channels: [NotificationChannel.PUSH],
    });

    return order;
  }

  private async calculateOrderTotal(items: OrderItemDto[]): Promise<number> {
    let total = 0;
    for (const item of items) {
      total += item.price * item.quantity;
    }
    return total;
  }

  private async calculateDeliveryFee(
    storeId: number,
    deliveryLat: number,
    deliveryLng: number,
  ): Promise<number> {
    // Obtener ubicación de la tienda
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      select: { latitude: true, longitude: true },
    });

    if (!store) throw new Error('Store not found');

    // Calcular distancia
    const distance = this.calculateDistance(
      Number(store.latitude),
      Number(store.longitude),
      deliveryLat,
      deliveryLng,
    );

    // Tarifa base + por km
    const baseFee = 2.99;
    const perKmFee = 0.75;
    return Math.round((baseFee + distance * perKmFee) * 100) / 100;
  }

  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private async notifyNearbyCouriers(order: DeliveryOrder): Promise<void> {
    // Buscar couriers cercanos que puedan hacer deliveries
    const nearbyCouriers = await this.prisma.driver.findMany({
      where: {
        canDoDeliveries: true,
        status: 'online',
      },
      take: 10,
    });

    // Notificar cada courier
    for (const courier of nearbyCouriers) {
      await this.notificationsService.sendNotification({
        userId: courier.id.toString(),
        type: 'delivery_available',
        title: 'New Delivery Available',
        message: `Delivery order from ${order.store.name}`,
        data: { orderId: order.orderId },
        channels: [NotificationChannel.PUSH],
      });
    }
  }
}
```

### **3. 📊 Analytics Module**

#### **AnalyticsController**
```typescript
@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('stores/:storeId/summary')
  @UseGuards(StoreOwnerGuard)
  @ApiOperation({ summary: 'Get store analytics summary' })
  async getStoreSummary(@Param('storeId') storeId: number) {
    return this.analyticsService.getStoreAnalytics(storeId);
  }

  @Get('stores/:storeId/orders')
  @UseGuards(StoreOwnerGuard)
  @ApiOperation({ summary: 'Get store orders analytics' })
  async getStoreOrders(
    @Param('storeId') storeId: number,
    @Query('period') period: string = '7d',
  ) {
    return this.analyticsService.getStoreOrdersAnalytics(storeId, period);
  }

  @Get('drivers/:driverId/summary')
  @UseGuards(DriverGuard)
  @ApiOperation({ summary: 'Get driver delivery analytics' })
  async getDriverSummary(@Param('driverId') driverId: number) {
    return this.analyticsService.getDriverAnalytics(driverId);
  }
}
```

---

## 🔄 **Flujos de Usuario**

### **1. 📱 Flujo del Cliente (Customer)**

#### **Buscar y Explorar Tiendas**
```
1. Usuario abre app → Pantalla de búsqueda
2. GET /api/stores?lat=X&lng=Y&radius=5&category=restaurant
3. Mostrar lista de tiendas cercanas con rating y productos destacados
4. Usuario selecciona tienda → GET /api/stores/{id}
5. Mostrar menú completo con productos organizados por categoría
```

#### **Realizar Pedido**
```
1. Usuario agrega productos al carrito
2. Calcula totales y costos de delivery
3. POST /api/orders con items del carrito
4. Sistema asigna conductor automáticamente
5. Usuario recibe notificaciones del progreso:
   - Orden aceptada por tienda
   - Orden asignada a conductor
   - Orden recogida
   - Orden entregada
```

#### **Seguimiento en Tiempo Real**
```
1. Usuario puede ver ubicación del conductor en mapa
2. Chat en tiempo real con conductor
3. Actualizaciones automáticas del estado del pedido
4. Notificaciones push en cada cambio de estado
```

### **2. 🏪 Flujo del Propietario de Tienda (Store Owner)**

#### **Configurar Tienda**
```
1. Registro como propietario
2. POST /api/stores - Crear tienda con información básica
3. Subir logo y fotos del local
4. Configurar horario de atención
5. Definir zona de delivery
```

#### **Gestionar Menú**
```
1. POST /api/stores/{id}/products - Agregar productos
2. PUT /api/stores/{id}/products/{productId} - Actualizar productos
3. DELETE /api/stores/{id}/products/{productId} - Eliminar productos
4. Gestionar categorías y precios
5. Controlar disponibilidad de productos
```

#### **Gestionar Pedidos**
```
1. Recibir notificaciones de nuevos pedidos
2. Ver detalles del pedido en panel de control
3. Confirmar preparación del pedido
4. Marcar pedido como listo para recoger
5. Recibir feedback de clientes
```

### **3. 🚚 Flujo del Conductor (Courier)**

#### **Recibir Pedidos de Delivery**
```
1. Conductor marca como disponible para deliveries
2. Recibe notificaciones de pedidos cercanos
3. GET /api/orders/available - Ver pedidos disponibles
4. POST /api/orders/{id}/accept - Aceptar pedido
```

#### **Proceso de Delivery**
```
1. Ir a la tienda para recoger pedido
2. POST /api/orders/{id}/pickup - Marcar como recogido
3. Ir a dirección de entrega
4. POST /api/orders/{id}/deliver - Marcar como entregado
5. Recibir calificación y propina
```

---

## 💳 **Sistema de Pagos**

### **Flujo de Pago para Deliveries**

#### **1. Pago por Separado (Split Payment)**
```
Cliente paga:
- Subtotal de productos
- Costo de delivery
- Propina al conductor

Tienda recibe:
- Subtotal de productos (menos comisión de plataforma)

Conductor recibe:
- Costo de delivery
- Propina
```

#### **2. Pago en Tienda**
```
Cliente paga en efectivo en la tienda
- Solo productos, delivery gratuito
- Conductor solo cobra propina
```

#### **3. Pago con Wallet**
```
Cliente usa saldo de wallet
- Descuentos automáticos
- Acumulacion de puntos de lealtad
```

### **Integración con Stripe**

#### **PaymentIntent para Órdenes**
```typescript
async createOrderPaymentIntent(
  orderId: number,
  amount: number,
  userId: string,
): Promise<Stripe.PaymentIntent> {
  return this.stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency: 'usd',
    customer: userId,
    metadata: {
      orderId: orderId.toString(),
      type: 'delivery_order',
    },
    automatic_payment_methods: { enabled: true },
  });
}
```

#### **Transferencias Automáticas**
```typescript
// Cuando se completa la entrega
async processOrderPayments(orderId: number): Promise<void> {
  const order = await this.prisma.deliveryOrder.findUnique({
    where: { orderId },
    include: { store: true, courier: true },
  });

  // Transferir a tienda (menos comisión)
  const storeAmount = order.totalPrice * 0.9; // 10% comisión
  await this.stripe.transfers.create({
    amount: Math.round(storeAmount * 100),
    currency: 'usd',
    destination: order.store.stripeAccountId,
    metadata: { orderId: orderId.toString() },
  });

  // Transferir a conductor
  const courierAmount = order.deliveryFee + order.tip;
  await this.stripe.transfers.create({
    amount: Math.round(courierAmount * 100),
    currency: 'usd',
    destination: order.courier.stripeAccountId,
    metadata: { orderId: orderId.toString() },
  });
}
```

---

## 📱 **WebSocket Events para Delivery**

### **Eventos del Cliente**
```typescript
// Estado del pedido
'order:status:updated' - Cambios en el estado del pedido
'order:courier:assigned' - Conductor asignado
'order:courier:location' - Ubicación del conductor
'order:delivered' - Pedido entregado

// Chat
'order:chat:message' - Nuevo mensaje del conductor
'order:chat:typing' - Conductor escribiendo
```

### **Eventos del Conductor**
```typescript
// Nuevos pedidos
'delivery:new' - Nuevo pedido disponible
'delivery:assigned' - Pedido asignado

// Actualizaciones
'delivery:status:updated' - Cambios en el estado
'delivery:location:updated' - Actualización de ubicación
```

### **Eventos de la Tienda**
```typescript
// Pedidos
'store:new:order' - Nuevo pedido recibido
'store:order:ready' - Pedido listo para recoger
'store:courier:arrived' - Conductor llegó a recoger
```

---

## 🔔 **Sistema de Notificaciones**

### **Tipos de Notificaciones para Delivery**

#### **Para Clientes**
- `order_confirmed` - Pedido confirmado
- `order_preparing` - Pedido en preparación
- `courier_assigned` - Conductor asignado
- `order_ready` - Pedido listo para recoger
- `courier_picked_up` - Conductor recogió el pedido
- `order_on_the_way` - Pedido en camino
- `order_delivered` - Pedido entregado
- `order_rated` - Pedido calificado

#### **Para Conductores**
- `delivery_available` - Nuevo delivery disponible
- `delivery_assigned` - Delivery asignado
- `store_ready` - Tienda tiene pedido listo
- `delivery_completed` - Delivery completado
- `tip_received` - Propina recibida

#### **Para Tiendas**
- `new_order` - Nuevo pedido recibido
- `courier_assigned` - Conductor asignado
- `courier_arrived` - Conductor llegó a recoger
- `order_delivered` - Pedido entregado
- `customer_rated` - Cliente dejó calificación

---

## 📊 **Analytics y Reportes**

### **Métricas para Tiendas**
```typescript
interface StoreAnalytics {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  topProducts: Product[];
  peakHours: { hour: number; orders: number }[];
  customerRetention: number;
  averageRating: number;
}
```

### **Métricas para Conductores**
```typescript
interface DriverAnalytics {
  totalDeliveries: number;
  totalEarnings: number;
  averageDeliveryTime: number;
  customerRating: number;
  acceptanceRate: number;
  cancellationRate: number;
}
```

### **Métricas de Plataforma**
```typescript
interface PlatformAnalytics {
  totalStores: number;
  totalDrivers: number;
  totalOrders: number;
  totalRevenue: number;
  averageDeliveryTime: number;
  customerSatisfaction: number;
  marketShareByCategory: Record<string, number>;
}
```

---

## 🔧 **Implementación Técnica**

### **Módulos a Crear**
```
src/modules/
├── stores/
│   ├── stores.controller.ts
│   ├── stores.service.ts
│   ├── stores.module.ts
│   ├── dto/
│   └── guards/
├── orders/
│   ├── orders.controller.ts
│   ├── orders.service.ts
│   ├── orders.module.ts
│   ├── dto/
│   └── guards/
└── analytics/
    ├── analytics.controller.ts
    ├── analytics.service.ts
    ├── analytics.module.ts
    └── dto/
```

### **Guards Personalizados**
```typescript
// StoreOwnerGuard - Verifica que el usuario sea propietario de la tienda
@Injectable()
export class StoreOwnerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const storeId = request.params.id;
    const userId = request.user.clerkId;

    // Verificar que el usuario sea propietario de la tienda
    return this.storesService.isStoreOwner(storeId, userId);
  }
}

// DriverGuard - Verifica que el usuario sea conductor
@Injectable()
export class DriverGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    return this.driversService.isDriver(user.id);
  }
}
```

### **DTOs Principales**
```typescript
// CreateStoreDto
export class CreateStoreDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  address: string;

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  cuisineType?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  email?: string;
}

// CreateOrderDto
export class CreateOrderDto {
  @IsNumber()
  storeId: number;

  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  items: OrderItemDto[];

  @IsNotEmpty()
  @IsString()
  deliveryAddress: string;

  @IsNumber()
  deliveryLatitude: number;

  @IsNumber()
  deliveryLongitude: number;

  @IsOptional()
  @IsString()
  specialInstructions?: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string;
}

// OrderItemDto
export class OrderItemDto {
  @IsNumber()
  productId: number;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsString()
  specialRequests?: string;
}
```

---

## 🚀 **Próximos Pasos de Implementación**

### **Fase 1: Core Infrastructure (1-2 semanas)**
- ✅ Modelos ya definidos en Prisma
- ✅ Crear StoresController y StoresService
- ✅ Crear OrdersController y OrdersService
- ✅ Implementar DTOs y validaciones
- ✅ Configurar guards personalizados

### **Fase 2: Business Logic (2-3 semanas)**
- ✅ Implementar lógica de creación de órdenes
- ✅ Sistema de asignación automática de conductores
- ✅ Cálculos de delivery fee
- ✅ Gestión de estados de órdenes
- ✅ Integración con notificaciones

### **Fase 3: Real-time Features (1-2 semanas)**
- ✅ WebSocket events para orders
- ✅ Seguimiento en tiempo real
- ✅ Chat entre cliente y conductor
- ✅ Notificaciones push en tiempo real

### **Fase 4: Payment Integration (1 semana)**
- ✅ Integración con Stripe para órdenes
- ✅ Split payments (cliente → plataforma → tienda/conductor)
- ✅ Manejo de propinas
- ✅ Refunds y cancelaciones

### **Fase 5: Analytics & Optimization (1-2 semanas)**
- ✅ Dashboard para tiendas
- ✅ Analytics para conductores
- ✅ Reportes de plataforma
- ✅ Optimización de performance

---

## 📈 **Métricas de Éxito**

### **Métricas de Usuario**
- **Customer Satisfaction**: Rating promedio > 4.5 ⭐
- **Delivery Time**: < 35 minutos promedio
- **App Engagement**: Sesiones diarias por usuario
- **Retention Rate**: Usuarios que regresan semanalmente

### **Métricas de Negocio**
- **GMV (Gross Merchandise Value)**: Total de ventas mensuales
- **Take Rate**: Porcentaje de comisión por pedido
- **Driver Utilization**: Porcentaje de tiempo ocupado
- **Store Retention**: Tiendas activas mensualmente

### **Métricas Técnicas**
- **API Response Time**: < 200ms promedio
- **Uptime**: 99.9% disponibilidad
- **Error Rate**: < 0.1% de requests fallidos
- **Real-time Latency**: < 100ms para WebSocket events

---

## 🎯 **Conclusión**

Este sistema de marketplace y delivery representa una **extensión completa** de la plataforma Uber Clone, transformándola en una **solución integral** que incluye:

- 🚗 **Rides** (ya implementado)
- 🛒 **Food Delivery** (nueva funcionalidad)
- 📦 **Package Delivery** (puede extenderse)
- 🏪 **Store Management** (nueva funcionalidad)
- 💰 **Payment Processing** (ya implementado, extender)
- 📊 **Analytics** (nueva funcionalidad)

La implementación sigue los **patrones de arquitectura** ya establecidos en el proyecto, manteniendo **consistencia** en el código y **escalabilidad** para futuras expansiones.

¿Te gustaría que comience a implementar alguno de estos módulos específicos?
