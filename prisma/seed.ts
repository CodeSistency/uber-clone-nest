import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt'
import { AdminRole, ROLE_PERMISSIONS } from '../src/admin/interfaces/admin.interface';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // =========================================
  // SECTION 1: USERS
  // =========================================
  console.log('📝 Seeding users...');
  const users = await Promise.all([
    prisma.user.create({
      data: {
        name: 'John Doe',
        email: 'john.doe@example.com',
        refreshToken: '',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        refreshToken: '',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Mike Johnson',
        email: 'mike.johnson@example.com',
        refreshToken: '',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Sarah Wilson',
        email: 'sarah.wilson@example.com',
        refreshToken: '',
      },
    }),
    prisma.user.create({
      data: {
        name: 'David Brown',
        email: 'david.brown@example.com',
        refreshToken: '',
      },
    }),
  ]);

  // =========================================
  // SECTION 2: VEHICLE TYPES
  // =========================================
  console.log('🚗 Seeding vehicle types...');
  const vehicleTypes = await Promise.all([
    prisma.vehicleType.create({
      data: {
        name: 'car',
        displayName: 'Carro',
        icon: '🚗',
        isActive: true,
      },
    }),
    prisma.vehicleType.create({
      data: {
        name: 'motorcycle',
        displayName: 'Moto',
        icon: '🏍️',
        isActive: true,
      },
    }),
    prisma.vehicleType.create({
      data: {
        name: 'bicycle',
        displayName: 'Bicicleta',
        icon: '🚲',
        isActive: true,
      },
    }),
    prisma.vehicleType.create({
      data: {
        name: 'truck',
        displayName: 'Camión',
        icon: '🚚',
        isActive: true,
      },
    }),
  ]);

  // =========================================
  // SECTION 3: DRIVERS (with associated users)
  // =========================================
  console.log('🚗 Seeding drivers...');

  // Create users for drivers first
  const driverUsers = await Promise.all([
    prisma.user.create({
      data: {
        name: 'Carlos Rodriguez',
        email: 'carlos.driver@example.com',
        refreshToken: '',
        password: await bcrypt.hash('Driver123!', 12),
      },
    }),
    prisma.user.create({
      data: {
        name: 'Maria Garcia',
        email: 'maria.driver@example.com',
        refreshToken: '',
        password: await bcrypt.hash('Driver123!', 12),
      },
    }),
    prisma.user.create({
      data: {
        name: 'Luis Martinez',
        email: 'luis.driver@example.com',
        refreshToken: '',
        password: await bcrypt.hash('Driver123!', 12),
      },
    }),
  ]);

  const drivers = await Promise.all([
    prisma.driver.create({
      data: {
        id: driverUsers[0].id, // Associate with user
        firstName: 'Carlos',
        lastName: 'Rodriguez',
        email: 'carlos.driver@example.com',
        phone: '+58-412-1234567',
        profileImageUrl:
          'https://api.dicebear.com/7.x/avataaars/svg?seed=carlos',
        status: 'online',
        verificationStatus: 'approved',
        isLocationActive: true,
        currentLatitude: 10.5061, // Caracas - Centro
        currentLongitude: -66.9146,
        lastLocationUpdate: new Date(),
        canDoDeliveries: true,
        averageRating: 4.8,
        totalRides: 45,
        totalEarnings: 2250.75,
        completionRate: 98.5,
      },
    }),
    prisma.driver.create({
      data: {
        id: driverUsers[1].id, // Associate with user
        firstName: 'Maria',
        lastName: 'Garcia',
        email: 'maria.driver@example.com',
        phone: '+58-414-7654321',
        profileImageUrl:
          'https://api.dicebear.com/7.x/avataaars/svg?seed=maria',
        status: 'online',
        verificationStatus: 'approved',
        isLocationActive: true,
        currentLatitude: 10.5000, // Caracas - Altamira
        currentLongitude: -66.8500,
        lastLocationUpdate: new Date(),
        canDoDeliveries: false,
        averageRating: 4.6,
        totalRides: 32,
        totalEarnings: 1680.25,
        completionRate: 95.2,
      },
    }),
    prisma.driver.create({
      data: {
        id: driverUsers[2].id, // Associate with user
        firstName: 'Luis',
        lastName: 'Martinez',
        email: 'luis.driver@example.com',
        phone: '+58-416-9876543',
        profileImageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=luis',
        status: 'offline',
        verificationStatus: 'approved',
        isLocationActive: true,
        currentLatitude: 10.4806, // Caracas - La Castellana
        currentLongitude: -66.9036,
        lastLocationUpdate: new Date(),
        canDoDeliveries: true,
        averageRating: 4.9,
        totalRides: 28,
        totalEarnings: 1575.50,
        completionRate: 97.8,
      },
    }),
  ]);

  // =========================================
  // SECTION 4: DRIVER VEHICLES
  // =========================================
  console.log('🚗 Seeding driver vehicles...');
  const vehicles = await Promise.all([
    prisma.vehicle.create({
      data: {
        driverId: drivers[0].id,
        vehicleTypeId: vehicleTypes[0].id, // Carro
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        color: 'White',
        licensePlate: 'ABC123',
        vin: '1HGBH41JXMN109186',
        seatingCapacity: 4,
        hasAC: true,
        hasGPS: true,
        fuelType: 'gasoline',
        insuranceProvider: 'Seguros Caracas',
        insurancePolicyNumber: 'POL-001234',
        insuranceExpiryDate: new Date('2024-12-31'),
        frontImageUrl: 'https://images.unsplash.com/photo-1549924231-f129b911e442?w=400',
        backImageUrl: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
        status: 'active',
        verificationStatus: 'verified',
        isDefault: true,
      },
    }),
    prisma.vehicle.create({
      data: {
        driverId: drivers[1].id,
        vehicleTypeId: vehicleTypes[0].id, // Carro
        make: 'Honda',
        model: 'Civic',
        year: 2019,
        color: 'Blue',
        licensePlate: 'XYZ789',
        vin: '2HGFC2F59JH123456',
        seatingCapacity: 4,
        hasAC: true,
        hasGPS: false,
        fuelType: 'gasoline',
        insuranceProvider: 'Seguros Nacional',
        insurancePolicyNumber: 'POL-005678',
        insuranceExpiryDate: new Date('2024-10-15'),
        frontImageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
        status: 'active',
        verificationStatus: 'verified',
        isDefault: true,
      },
    }),
    prisma.vehicle.create({
      data: {
        driverId: drivers[2].id,
        vehicleTypeId: vehicleTypes[1].id, // Moto
        make: 'Yamaha',
        model: 'MT-07',
        year: 2021,
        color: 'Black',
        licensePlate: 'MOT789',
        vin: 'JY1MS02A1M0000123',
        seatingCapacity: 2,
        hasAC: false,
        hasGPS: true,
        fuelType: 'gasoline',
        insuranceProvider: 'Seguros Moto',
        insurancePolicyNumber: 'POL-009012',
        insuranceExpiryDate: new Date('2024-08-20'),
        frontImageUrl: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
        status: 'active',
        verificationStatus: 'verified',
        isDefault: true,
      },
    }),
  ]);

  // =========================================
  // SECTION 5: DRIVER DOCUMENTS
  // =========================================
  console.log('📄 Seeding driver documents...');
  await Promise.all([
    prisma.driverDocument.create({
      data: {
        driverId: drivers[0].id,
        documentType: 'license',
        documentUrl: 'https://example.com/docs/license-carlos.jpg',
        verificationStatus: 'verified',
      },
    }),
    prisma.driverDocument.create({
      data: {
        driverId: drivers[0].id,
        documentType: 'insurance',
        documentUrl: 'https://example.com/docs/insurance-carlos.jpg',
        verificationStatus: 'verified',
      },
    }),
    prisma.driverDocument.create({
      data: {
        driverId: drivers[1].id,
        documentType: 'license',
        documentUrl: 'https://example.com/docs/license-maria.jpg',
        verificationStatus: 'verified',
      },
    }),
  ]);

  // =========================================
  // SECTION 6: VEHICLE DOCUMENTS
  // =========================================
  console.log('📋 Seeding vehicle documents...');
  await Promise.all([
    // Carlos' Toyota Camry documents
    prisma.vehicleDocument.create({
      data: {
        vehicleId: vehicles[0].id,
        documentType: 'registration',
        documentUrl: 'https://example.com/vehicle-docs/toyota-registration.jpg',
        verificationStatus: 'verified',
        verifiedAt: new Date(),
        verifiedBy: 1, // Admin ID
      },
    }),
    prisma.vehicleDocument.create({
      data: {
        vehicleId: vehicles[0].id,
        documentType: 'insurance',
        documentUrl: 'https://example.com/vehicle-docs/toyota-insurance.jpg',
        verificationStatus: 'verified',
        verifiedAt: new Date(),
        verifiedBy: 1,
      },
    }),
    // Maria's Honda Civic documents
    prisma.vehicleDocument.create({
      data: {
        vehicleId: vehicles[1].id,
        documentType: 'registration',
        documentUrl: 'https://example.com/vehicle-docs/honda-registration.jpg',
        verificationStatus: 'verified',
        verifiedAt: new Date(),
        verifiedBy: 1,
      },
    }),
    // Luis' Yamaha MT-07 documents
    prisma.vehicleDocument.create({
      data: {
        vehicleId: vehicles[2].id,
        documentType: 'registration',
        documentUrl: 'https://example.com/vehicle-docs/yamaha-registration.jpg',
        verificationStatus: 'verified',
        verifiedAt: new Date(),
        verifiedBy: 1,
      },
    }),
  ]);

  // =========================================
  // SECTION 7: RIDE TIERS
  // =========================================
  console.log('⭐ Seeding ride tiers...');
  const rideTiers = await Promise.all([
    prisma.rideTier.create({
      data: {
        name: 'Economy',
        baseFare: 2.5,
        perMinuteRate: 0.15,
        perMileRate: 1.25,
        imageUrl:
          'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=100',
      },
    }),
    prisma.rideTier.create({
      data: {
        name: 'Comfort',
        baseFare: 4.0,
        perMinuteRate: 0.25,
        perMileRate: 2.0,
        imageUrl:
          'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=100',
      },
    }),
    prisma.rideTier.create({
      data: {
        name: 'Premium',
        baseFare: 6.0,
        perMinuteRate: 0.35,
        perMileRate: 3.0,
        imageUrl:
          'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=100',
      },
    }),
  ]);

  // =========================================
  // SECTION 8: TIER-VEHICLE TYPE COMBINATIONS
  // =========================================
  console.log('🔗 Seeding tier-vehicle type combinations...');
  const tierVehicleCombinations = await Promise.all([
    // Economy tier - Disponible en Carro y Moto
    prisma.tierVehicleType.create({
      data: {
        tierId: rideTiers[0].id, // Economy
        vehicleTypeId: vehicleTypes[0].id, // Car
        isActive: true,
      },
    }),
    prisma.tierVehicleType.create({
      data: {
        tierId: rideTiers[0].id, // Economy
        vehicleTypeId: vehicleTypes[1].id, // Motorcycle
        isActive: true,
      },
    }),

    // Comfort tier - Disponible en Carro y Moto
    prisma.tierVehicleType.create({
      data: {
        tierId: rideTiers[1].id, // Comfort
        vehicleTypeId: vehicleTypes[0].id, // Car
        isActive: true,
      },
    }),
    prisma.tierVehicleType.create({
      data: {
        tierId: rideTiers[1].id, // Comfort
        vehicleTypeId: vehicleTypes[1].id, // Motorcycle
        isActive: true,
      },
    }),

    // Premium tier - Solo disponible en Carro
    prisma.tierVehicleType.create({
      data: {
        tierId: rideTiers[2].id, // Premium
        vehicleTypeId: vehicleTypes[0].id, // Car
        isActive: true,
      },
    }),

    // Opcional: Comfort en bicicleta para entregas locales
    prisma.tierVehicleType.create({
      data: {
        tierId: rideTiers[1].id, // Comfort
        vehicleTypeId: vehicleTypes[2].id, // Bicycle
        isActive: true,
      },
    }),
  ]);

  // =========================================
  // SECTION 9: RIDES
  // =========================================
  console.log('🚕 Seeding rides...');
  const rides = await Promise.all([
    prisma.ride.create({
      data: {
        originAddress: '123 Main St, New York, NY 10001',
        destinationAddress: '456 Broadway, New York, NY 10002',
        originLatitude: 40.7505,
        originLongitude: -73.9934,
        destinationLatitude: 40.7589,
        destinationLongitude: -73.9851,
        rideTime: 15,
        farePrice: 12.5,
        paymentStatus: 'completed',
        driverId: drivers[0].id,
        userId: users[0].id,
        tierId: rideTiers[0].id,
        vehicleId: vehicles[0].id, // Toyota Camry
        requestedVehicleTypeId: vehicleTypes[0].id, // Solicitó carro
      },
    }),
    prisma.ride.create({
      data: {
        originAddress: '789 Park Ave, New York, NY 10003',
        destinationAddress: '321 5th Ave, New York, NY 10004',
        originLatitude: 40.7829,
        originLongitude: -73.9654,
        destinationLatitude: 40.7505,
        destinationLongitude: -73.9934,
        rideTime: 22,
        farePrice: 18.75,
        paymentStatus: 'completed',
        driverId: drivers[1].id,
        userId: users[1].id,
        tierId: rideTiers[1].id,
        vehicleId: vehicles[1].id, // Honda Civic
        requestedVehicleTypeId: vehicleTypes[1].id, // Solicitó moto
      },
    }),
    prisma.ride.create({
      data: {
        originAddress: '555 Madison Ave, New York, NY 10005',
        destinationAddress: '999 Wall St, New York, NY 10006',
        originLatitude: 40.7589,
        originLongitude: -73.9851,
        destinationLatitude: 40.7074,
        destinationLongitude: -74.0113,
        rideTime: 30,
        farePrice: 25.0,
        paymentStatus: 'pending',
        userId: users[2].id,
        tierId: rideTiers[2].id,
        scheduledFor: new Date(Date.now() + 3600000), // 1 hour from now
      },
    }),
  ]);

  // =========================================
  // SECTION 10: STORES
  // =========================================
  console.log('🏪 Seeding stores...');
  const stores = await Promise.all([
    prisma.store.create({
      data: {
        name: 'Pizza Palace',
        address: '123 Pizza St, New York, NY 10001',
        latitude: 40.7505,
        longitude: -73.9934,
        category: 'Restaurant',
        cuisineType: 'Italian',
        logoUrl:
          'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=100',
        rating: 4.5,
        isOpen: true,
        ownerId: users[0].id,
      },
    }),
    prisma.store.create({
      data: {
        name: 'Burger Heaven',
        address: '456 Burger Ave, New York, NY 10002',
        latitude: 40.7589,
        longitude: -73.9851,
        category: 'Restaurant',
        cuisineType: 'American',
        logoUrl:
          'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=100',
        rating: 4.2,
        isOpen: true,
        ownerId: users[1].id,
      },
    }),
    prisma.store.create({
      data: {
        name: 'Green Grocery',
        address: '789 Healthy Ln, New York, NY 10003',
        latitude: 40.7829,
        longitude: -73.9654,
        category: 'Grocery',
        cuisineType: 'Healthy',
        logoUrl:
          'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=100',
        rating: 4.7,
        isOpen: true,
        ownerId: users[2].id,
      },
    }),
  ]);

  // =========================================
  // SECTION 11: PRODUCTS
  // =========================================
  console.log('🍕 Seeding products...');
  const products = await Promise.all([
    // Pizza Palace products
    prisma.product.create({
      data: {
        storeId: stores[0].id,
        name: 'Margherita Pizza',
        description: 'Classic pizza with tomato sauce, mozzarella, and basil',
        price: 15.99,
        imageUrl:
          'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200',
        category: 'Pizza',
        isAvailable: true,
      },
    }),
    prisma.product.create({
      data: {
        storeId: stores[0].id,
        name: 'Pepperoni Pizza',
        description: 'Pizza with tomato sauce, mozzarella, and pepperoni',
        price: 18.99,
        imageUrl:
          'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=200',
        category: 'Pizza',
        isAvailable: true,
      },
    }),
    // Burger Heaven products
    prisma.product.create({
      data: {
        storeId: stores[1].id,
        name: 'Classic Cheeseburger',
        description: 'Juicy beef patty with cheese, lettuce, and tomato',
        price: 12.99,
        imageUrl:
          'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200',
        category: 'Burger',
        isAvailable: true,
      },
    }),
    prisma.product.create({
      data: {
        storeId: stores[1].id,
        name: 'French Fries',
        description: 'Crispy golden fries',
        price: 4.99,
        imageUrl:
          'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=200',
        category: 'Sides',
        isAvailable: true,
      },
    }),
    // Green Grocery products
    prisma.product.create({
      data: {
        storeId: stores[2].id,
        name: 'Organic Apples',
        description: 'Fresh organic apples, 1 lb',
        price: 3.99,
        imageUrl:
          'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=200',
        category: 'Fruits',
        isAvailable: true,
      },
    }),
    prisma.product.create({
      data: {
        storeId: stores[2].id,
        name: 'Spinach',
        description: 'Fresh organic spinach, 1 bunch',
        price: 2.49,
        imageUrl:
          'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=200',
        category: 'Vegetables',
        isAvailable: true,
      },
    }),
  ]);

  // =========================================
  // SECTION 12: DELIVERY ORDERS
  // =========================================
  console.log('📦 Seeding delivery orders...');
  const deliveryOrders = await Promise.all([
    prisma.deliveryOrder.create({
      data: {
        userId: users[0].id,
        storeId: stores[0].id,
        courierId: drivers[0].id,
        deliveryAddress: '123 Main St, New York, NY 10001',
        deliveryLatitude: 40.7505,
        deliveryLongitude: -73.9934,
        totalPrice: 34.98,
        deliveryFee: 3.99,
        tip: 5.0,
        status: 'delivered',
        paymentStatus: 'completed',
      },
    }),
    prisma.deliveryOrder.create({
      data: {
        userId: users[1].id,
        storeId: stores[1].id,
        courierId: drivers[2].id,
        deliveryAddress: '456 Broadway, New York, NY 10002',
        deliveryLatitude: 40.7589,
        deliveryLongitude: -73.9851,
        totalPrice: 17.98,
        deliveryFee: 2.99,
        tip: 3.0,
        status: 'in_transit',
        paymentStatus: 'completed',
      },
    }),
  ]);

  // =========================================
  // SECTION 13: ORDER ITEMS
  // =========================================
  console.log('🛒 Seeding order items...');
  await Promise.all([
    // Order 1 items (Pizza Palace)
    prisma.orderItem.create({
      data: {
        orderId: deliveryOrders[0].orderId,
        productId: products[0].id,
        quantity: 2,
        priceAtPurchase: 15.99,
      },
    }),
    prisma.orderItem.create({
      data: {
        orderId: deliveryOrders[0].orderId,
        productId: products[1].id,
        quantity: 1,
        priceAtPurchase: 18.99,
      },
    }),
    // Order 2 items (Burger Heaven)
    prisma.orderItem.create({
      data: {
        orderId: deliveryOrders[1].orderId,
        productId: products[2].id,
        quantity: 1,
        priceAtPurchase: 12.99,
      },
    }),
    prisma.orderItem.create({
      data: {
        orderId: deliveryOrders[1].orderId,
        productId: products[3].id,
        quantity: 1,
        priceAtPurchase: 4.99,
      },
    }),
  ]);

  // =========================================
  // SECTION 14: PROMOTIONS
  // =========================================
  console.log('🎁 Seeding promotions...');
  const promotions = await Promise.all([
    prisma.promotion.create({
      data: {
        promoCode: 'WELCOME10',
        discountPercentage: 10.0,
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        isActive: true,
      },
    }),
    prisma.promotion.create({
      data: {
        promoCode: 'RIDE20',
        discountAmount: 5.0,
        expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
        isActive: true,
      },
    }),
    prisma.promotion.create({
      data: {
        promoCode: 'FOOD15',
        discountPercentage: 15.0,
        expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        isActive: true,
      },
    }),
  ]);

  // =========================================
  // SECTION 15: WALLETS
  // =========================================
  console.log('💰 Seeding wallets...');
  const wallets = await Promise.all([
    prisma.wallet.create({
      data: {
        userId: users[0].id,
        balance: 150.0,
      },
    }),
    prisma.wallet.create({
      data: {
        userId: users[1].id,
        balance: 75.5,
      },
    }),
    prisma.wallet.create({
      data: {
        userId: users[2].id,
        balance: 200.25,
      },
    }),
  ]);

  // =========================================
  // SECTION 16: WALLET TRANSACTIONS
  // =========================================
  console.log('💸 Seeding wallet transactions...');
  await Promise.all([
    prisma.walletTransaction.create({
      data: {
        walletId: wallets[0].id,
        amount: 50.0,
        transactionType: 'credit',
        description: 'Initial deposit',
      },
    }),
    prisma.walletTransaction.create({
      data: {
        walletId: wallets[0].id,
        amount: -12.5,
        transactionType: 'debit',
        description: 'Ride payment',
      },
    }),
    prisma.walletTransaction.create({
      data: {
        walletId: wallets[1].id,
        amount: 100.0,
        transactionType: 'credit',
        description: 'Referral bonus',
      },
    }),
    prisma.walletTransaction.create({
      data: {
        walletId: wallets[1].id,
        amount: -18.75,
        transactionType: 'debit',
        description: 'Ride payment',
      },
    }),
  ]);

  // =========================================
  // SECTION 17: RATINGS
  // =========================================
  console.log('⭐ Seeding ratings...');
  await Promise.all([
    // Ride ratings
    prisma.rating.create({
      data: {
        rideId: rides[0].rideId,
        ratedByUserId: users[0].id,
        ratedUserId: users[rides[0].userId - 1]?.id,
        ratingValue: 5,
        comment: 'Great driver, very friendly!',
      },
    }),
    prisma.rating.create({
      data: {
        rideId: rides[1].rideId,
        ratedByUserId: users[1].id,
        ratedUserId: users[rides[1].userId - 1]?.id,
        ratingValue: 4,
        comment: 'Good service, arrived on time',
      },
    }),
    // Store ratings
    prisma.rating.create({
      data: {
        storeId: stores[0].id,
        ratedByUserId: users[0].id,
        ratingValue: 5,
        comment: 'Amazing pizza, will order again!',
      },
    }),
    prisma.rating.create({
      data: {
        storeId: stores[1].id,
        ratedByUserId: users[1].id,
        ratingValue: 4,
        comment: 'Great burgers, fast delivery',
      },
    }),
    // Delivery order ratings
    prisma.rating.create({
      data: {
        orderId: deliveryOrders[0].orderId,
        ratedByUserId: users[0].id,
        ratedUserId: users.find((u) => u.id === deliveryOrders[0].userId)?.id,
        ratingValue: 5,
        comment: 'Fast delivery, food was hot!',
      },
    }),
  ]);

  // =========================================
  // SECTION 18: EMERGENCY CONTACTS
  // =========================================
  console.log('🚨 Seeding emergency contacts...');
  await Promise.all([
    prisma.emergencyContact.create({
      data: {
        userId: users[0].id,
        contactName: 'Mom',
        contactPhone: '+1-555-0123',
      },
    }),
    prisma.emergencyContact.create({
      data: {
        userId: users[0].id,
        contactName: 'Dad',
        contactPhone: '+1-555-0124',
      },
    }),
    prisma.emergencyContact.create({
      data: {
        userId: users[1].id,
        contactName: 'Sister',
        contactPhone: '+1-555-0125',
      },
    }),
  ]);

  // =========================================
  // SECTION 19: CHAT MESSAGES
  // =========================================
  console.log('💬 Seeding chat messages...');
  await Promise.all([
    // Ride chat messages
    prisma.chatMessage.create({
      data: {
        rideId: rides[0].rideId,
        senderId: users[0].id,
        messageText: "Hi Carlos, I'm waiting at the entrance",
      },
    }),
    prisma.chatMessage.create({
      data: {
        rideId: rides[0].rideId,
        senderId: users[rides[0].userId - 1]?.id || users[0].id,
        messageText: "Sure, I'll be there in 2 minutes!",
      },
    }),
    prisma.chatMessage.create({
      data: {
        rideId: rides[1].rideId,
        senderId: users[1].id,
        messageText: "Please wait, I'm coming down",
      },
    }),
    // Delivery chat messages
    prisma.chatMessage.create({
      data: {
        orderId: deliveryOrders[0].orderId,
        senderId: users[0].id,
        messageText: 'Pizza looks amazing! Thank you!',
      },
    }),
    prisma.chatMessage.create({
      data: {
        orderId: deliveryOrders[0].orderId,
        senderId:
          users.find((u) => u.id === deliveryOrders[0].userId)?.id ||
          users[0].id,
        messageText: 'Enjoy your meal! Rate us 5 stars please 😊',
      },
    }),
  ]);

  // =========================================
  // SECTION 20: ADMIN SYSTEM
  // =========================================
  console.log('👑 Seeding admin system...');

  // Crear contraseña hasheada para el super admin
  const superAdminPassword = await bcrypt.hash('SuperAdmin123!', 12);

  const superAdmin = await prisma.user.create({
    data: {
      name: 'Super Admin',
      email: 'superadmin@uberclone.com',
      password: superAdminPassword,
      userType: 'admin',
      adminRole: 'super_admin',
      adminPermissions: ROLE_PERMISSIONS[AdminRole.SUPER_ADMIN],
      isActive: true,
      adminCreatedAt: new Date(),
    },
  });

  // Crear admin regular
  const adminPassword = await bcrypt.hash('Admin123!', 12);

  const regularAdmin = await prisma.user.create({
    data: {
      name: 'System Admin',
      email: 'admin@uberclone.com',
      password: adminPassword,
      userType: 'admin',
      refreshToken: '',
      adminRole: 'admin',
      adminPermissions: ROLE_PERMISSIONS[AdminRole.ADMIN],
      isActive: true,
      adminCreatedAt: new Date(),
    },
  });

  // Crear moderador
  const moderatorPassword = await bcrypt.hash('Moderator123!', 12);

  const moderator = await prisma.user.create({
    data: {
      name: 'Content Moderator',
      email: 'moderator@uberclone.com',
      password: moderatorPassword,
      userType: 'admin',
      refreshToken: '',
      adminRole: 'moderator',
      adminPermissions: ROLE_PERMISSIONS[AdminRole.MODERATOR],
      isActive: true,
      adminCreatedAt: new Date(),
    },
  });

  // Crear soporte
  const supportPassword = await bcrypt.hash('Support123!', 12);

  const support = await prisma.user.create({
    data: {
      name: 'Customer Support',
      email: 'support@uberclone.com',
      password: supportPassword,
      userType: 'admin',
      refreshToken: '',
      adminRole: 'support',
      adminPermissions: ROLE_PERMISSIONS[AdminRole.SUPPORT],
      isActive: true,
      adminCreatedAt: new Date(),
    },
  });

  console.log('✅ Database seeded successfully!');
  console.log('📊 Summary:');
  console.log(`   👥 ${users.length} users created`);
  console.log(`   🚗 ${drivers.length} drivers created`);
  console.log(`   🚙 ${vehicles.length} vehicles created`);
  console.log(`   📄 ${3} driver documents created`);
  console.log(`   📋 ${4} vehicle documents created`);
  console.log(`   ⭐ ${rideTiers.length} ride tiers created`);
  console.log(`   🚕 ${rides.length} rides created`);
  console.log(`   🏪 ${stores.length} stores created`);
  console.log(`   🍕 ${products.length} products created`);
  console.log(`   📦 ${deliveryOrders.length} delivery orders created`);
  console.log(`   🛒 ${4} order items created`);
  console.log(`   🎁 ${promotions.length} promotions created`);
  console.log(`   💰 ${wallets.length} wallets created`);
  console.log(`   💸 ${4} wallet transactions created`);
  console.log(`   ⭐ ${5} ratings created`);
  console.log(`   🚨 ${3} emergency contacts created`);
  console.log(`   💬 ${5} chat messages created`);
  console.log(
    `   👑 ${4} admins created (super_admin, admin, moderator, support)`,
  );

  // =========================================
  // VENEZUELAN PAYMENT SYSTEM SEEDS
  // =========================================

  console.log('\n🌍 Creating Venezuelan Payment System data...');

  // Create sample payment references for testing
  const paymentReferences = [
    {
      referenceNumber: '12345678901234567890',
      bankCode: '0102',
      amount: 25.5,
      userId: 1,
      serviceType: 'ride',
      serviceId: 1,
      paymentMethod: 'transfer',
      status: 'pending',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    },
    {
      referenceNumber: '09876543210987654321',
      bankCode: '0105',
      amount: 35.75,
      userId: 2,
      serviceType: 'delivery',
      serviceId: 1,
      paymentMethod: 'pago_movil',
      status: 'confirmed',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      confirmedAt: new Date(),
    },
    {
      referenceNumber: '11111111111111111111',
      bankCode: '0196',
      amount: 15.0,
      userId: 3,
      serviceType: 'errand',
      serviceId: 1,
      paymentMethod: 'transfer',
      status: 'expired',
      expiresAt: new Date(Date.now() - 60 * 60 * 1000), // Expired 1 hour ago
    },
    {
      referenceNumber: '22222222222222222222',
      bankCode: '0108',
      amount: 45.25,
      userId: 4,
      serviceType: 'parcel',
      serviceId: 1,
      paymentMethod: 'zelle',
      status: 'pending',
      expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours from now
    },
  ];

  for (const ref of paymentReferences) {
    await prisma.paymentReference.create({
      data: ref,
    });
  }

  console.log(`   💳 ${paymentReferences.length} payment references created`);

  // Create sample bank transactions for confirmed payments
  const bankTransactions = [
    {
      paymentReferenceId: 2, // Confirmed delivery reference
      bankTransactionId: 'MERC-1725979200000-abc123def',
      confirmedAmount: 35.75,
      bankResponse: {
        confirmed: true,
        transactionId: 'MERC-1725979200000-abc123def',
        amount: 35.75,
        timestamp: new Date(),
        bankCode: '0105',
      },
      confirmationTimestamp: new Date(),
    },
  ];

  for (const tx of bankTransactions) {
    await prisma.bankTransaction.create({
      data: tx,
    });
  }

  console.log(`   🏦 ${bankTransactions.length} bank transactions created`);

  console.log('\n✅ Venezuelan Payment System seeded successfully!');
  console.log('📋 Test Payment References:');
  paymentReferences.forEach((ref, index) => {
    console.log(
      `   ${index + 1}. ${ref.referenceNumber} - ${ref.serviceType} - ${ref.amount} VES - ${ref.status}`,
    );
  });

}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
