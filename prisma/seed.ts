import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

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
        clerkId: 'user_2abc123def456ghi789jkl012',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        clerkId: 'user_2bcd234efg567hij890klm123',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Mike Johnson',
        email: 'mike.johnson@example.com',
        clerkId: 'user_2cde345fgh678ijk901lmn234',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Sarah Wilson',
        email: 'sarah.wilson@example.com',
        clerkId: 'user_2def456ghi789jkl012mno345',
      },
    }),
    prisma.user.create({
      data: {
        name: 'David Brown',
        email: 'david.brown@example.com',
        clerkId: 'user_2efg567hij890klm123nop456',
      },
    }),
  ]);

  // =========================================
  // SECTION 2: DRIVERS
  // =========================================
  console.log('🚗 Seeding drivers...');
  const drivers = await Promise.all([
    prisma.driver.create({
      data: {
        firstName: 'Carlos',
        lastName: 'Rodriguez',
        profileImageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=carlos',
        carImageUrl: 'https://images.unsplash.com/photo-1549924231-f129b911e442?w=400',
        carModel: 'Toyota Camry',
        licensePlate: 'ABC123',
        carSeats: 4,
        status: 'online',
        verificationStatus: 'verified',
        canDoDeliveries: true,
      },
    }),
    prisma.driver.create({
      data: {
        firstName: 'Maria',
        lastName: 'Garcia',
        profileImageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=maria',
        carImageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
        carModel: 'Honda Civic',
        licensePlate: 'XYZ789',
        carSeats: 4,
        status: 'online',
        verificationStatus: 'verified',
        canDoDeliveries: false,
      },
    }),
    prisma.driver.create({
      data: {
        firstName: 'Luis',
        lastName: 'Martinez',
        profileImageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=luis',
        carImageUrl: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
        carModel: 'Ford Focus',
        licensePlate: 'DEF456',
        carSeats: 4,
        status: 'offline',
        verificationStatus: 'verified',
        canDoDeliveries: true,
      },
    }),
  ]);

  // =========================================
  // SECTION 3: DRIVER DOCUMENTS
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
  // SECTION 4: RIDE TIERS
  // =========================================
  console.log('⭐ Seeding ride tiers...');
  const rideTiers = await Promise.all([
    prisma.rideTier.create({
      data: {
        name: 'Economy',
        baseFare: 2.50,
        perMinuteRate: 0.15,
        perMileRate: 1.25,
        imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=100',
      },
    }),
    prisma.rideTier.create({
      data: {
        name: 'Comfort',
        baseFare: 4.00,
        perMinuteRate: 0.25,
        perMileRate: 2.00,
        imageUrl: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=100',
      },
    }),
    prisma.rideTier.create({
      data: {
        name: 'Premium',
        baseFare: 6.00,
        perMinuteRate: 0.35,
        perMileRate: 3.00,
        imageUrl: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=100',
      },
    }),
  ]);

  // =========================================
  // SECTION 5: RIDES
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
        farePrice: 12.50,
        paymentStatus: 'completed',
        driverId: drivers[0].id,
        userId: users[0].id,
        tierId: rideTiers[0].id,
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
        farePrice: 25.00,
        paymentStatus: 'pending',
        userId: users[2].id,
        tierId: rideTiers[2].id,
        scheduledFor: new Date(Date.now() + 3600000), // 1 hour from now
      },
    }),
  ]);

  // =========================================
  // SECTION 6: STORES
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
        logoUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=100',
        rating: 4.5,
        isOpen: true,
        ownerClerkId: users[0].clerkId!,
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
        logoUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=100',
        rating: 4.2,
        isOpen: true,
        ownerClerkId: users[1].clerkId!,
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
        logoUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=100',
        rating: 4.7,
        isOpen: true,
        ownerClerkId: users[2].clerkId!,
      },
    }),
  ]);

  // =========================================
  // SECTION 7: PRODUCTS
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
        imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200',
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
        imageUrl: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=200',
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
        imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200',
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
        imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=200',
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
        imageUrl: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=200',
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
        imageUrl: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=200',
        category: 'Vegetables',
        isAvailable: true,
      },
    }),
  ]);

  // =========================================
  // SECTION 8: DELIVERY ORDERS
  // =========================================
  console.log('📦 Seeding delivery orders...');
  const deliveryOrders = await Promise.all([
    prisma.deliveryOrder.create({
      data: {
        userClerkId: users[0].clerkId!,
        storeId: stores[0].id,
        courierId: drivers[0].id,
        deliveryAddress: '123 Main St, New York, NY 10001',
        deliveryLatitude: 40.7505,
        deliveryLongitude: -73.9934,
        totalPrice: 34.98,
        deliveryFee: 3.99,
        tip: 5.00,
        status: 'delivered',
        paymentStatus: 'completed',
      },
    }),
    prisma.deliveryOrder.create({
      data: {
        userClerkId: users[1].clerkId!,
        storeId: stores[1].id,
        courierId: drivers[2].id,
        deliveryAddress: '456 Broadway, New York, NY 10002',
        deliveryLatitude: 40.7589,
        deliveryLongitude: -73.9851,
        totalPrice: 17.98,
        deliveryFee: 2.99,
        tip: 3.00,
        status: 'in_transit',
        paymentStatus: 'completed',
      },
    }),
  ]);

  // =========================================
  // SECTION 9: ORDER ITEMS
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
  // SECTION 10: PROMOTIONS
  // =========================================
  console.log('🎁 Seeding promotions...');
  const promotions = await Promise.all([
    prisma.promotion.create({
      data: {
        promoCode: 'WELCOME10',
        discountPercentage: 10.00,
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        isActive: true,
      },
    }),
    prisma.promotion.create({
      data: {
        promoCode: 'RIDE20',
        discountAmount: 5.00,
        expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
        isActive: true,
      },
    }),
    prisma.promotion.create({
      data: {
        promoCode: 'FOOD15',
        discountPercentage: 15.00,
        expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        isActive: true,
      },
    }),
  ]);

  // =========================================
  // SECTION 11: WALLETS
  // =========================================
  console.log('💰 Seeding wallets...');
  const wallets = await Promise.all([
    prisma.wallet.create({
      data: {
        userClerkId: users[0].clerkId!,
        balance: 150.00,
      },
    }),
    prisma.wallet.create({
      data: {
        userClerkId: users[1].clerkId!,
        balance: 75.50,
      },
    }),
    prisma.wallet.create({
      data: {
        userClerkId: users[2].clerkId!,
        balance: 200.25,
      },
    }),
  ]);

  // =========================================
  // SECTION 12: WALLET TRANSACTIONS
  // =========================================
  console.log('💸 Seeding wallet transactions...');
  await Promise.all([
    prisma.walletTransaction.create({
      data: {
        walletId: wallets[0].id,
        amount: 50.00,
        transactionType: 'credit',
        description: 'Initial deposit',
      },
    }),
    prisma.walletTransaction.create({
      data: {
        walletId: wallets[0].id,
        amount: -12.50,
        transactionType: 'debit',
        description: 'Ride payment',
      },
    }),
    prisma.walletTransaction.create({
      data: {
        walletId: wallets[1].id,
        amount: 100.00,
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
  // SECTION 13: RATINGS
  // =========================================
  console.log('⭐ Seeding ratings...');
  await Promise.all([
    // Ride ratings
    prisma.rating.create({
      data: {
        rideId: rides[0].rideId,
        ratedByClerkId: users[0].clerkId!,
        ratedClerkId: users[rides[0].userId - 1]?.clerkId,
        ratingValue: 5,
        comment: 'Great driver, very friendly!',
      },
    }),
    prisma.rating.create({
      data: {
        rideId: rides[1].rideId,
        ratedByClerkId: users[1].clerkId!,
        ratedClerkId: users[rides[1].userId - 1]?.clerkId,
        ratingValue: 4,
        comment: 'Good service, arrived on time',
      },
    }),
    // Store ratings
    prisma.rating.create({
      data: {
        storeId: stores[0].id,
        ratedByClerkId: users[0].clerkId!,
        ratingValue: 5,
        comment: 'Amazing pizza, will order again!',
      },
    }),
    prisma.rating.create({
      data: {
        storeId: stores[1].id,
        ratedByClerkId: users[1].clerkId!,
        ratingValue: 4,
        comment: 'Great burgers, fast delivery',
      },
    }),
    // Delivery order ratings
    prisma.rating.create({
      data: {
        orderId: deliveryOrders[0].orderId,
        ratedByClerkId: users[0].clerkId!,
        ratedClerkId: users.find(u => u.clerkId === deliveryOrders[0].userClerkId)?.clerkId!,
        ratingValue: 5,
        comment: 'Fast delivery, food was hot!',
      },
    }),
  ]);

  // =========================================
  // SECTION 14: EMERGENCY CONTACTS
  // =========================================
  console.log('🚨 Seeding emergency contacts...');
  await Promise.all([
    prisma.emergencyContact.create({
      data: {
        userClerkId: users[0].clerkId!,
        contactName: 'Mom',
        contactPhone: '+1-555-0123',
      },
    }),
    prisma.emergencyContact.create({
      data: {
        userClerkId: users[0].clerkId!,
        contactName: 'Dad',
        contactPhone: '+1-555-0124',
      },
    }),
    prisma.emergencyContact.create({
      data: {
        userClerkId: users[1].clerkId!,
        contactName: 'Sister',
        contactPhone: '+1-555-0125',
      },
    }),
  ]);

  // =========================================
  // SECTION 15: CHAT MESSAGES
  // =========================================
  console.log('💬 Seeding chat messages...');
  await Promise.all([
    // Ride chat messages
    prisma.chatMessage.create({
      data: {
        rideId: rides[0].rideId,
        senderClerkId: users[0].clerkId!,
        messageText: 'Hi Carlos, I\'m waiting at the entrance',
      },
    }),
    prisma.chatMessage.create({
      data: {
        rideId: rides[0].rideId,
        senderClerkId: users[rides[0].userId - 1]?.clerkId || users[0].clerkId!,
        messageText: 'Sure, I\'ll be there in 2 minutes!',
      },
    }),
    prisma.chatMessage.create({
      data: {
        rideId: rides[1].rideId,
        senderClerkId: users[1].clerkId!,
        messageText: 'Please wait, I\'m coming down',
      },
    }),
    // Delivery chat messages
    prisma.chatMessage.create({
      data: {
        orderId: deliveryOrders[0].orderId,
        senderClerkId: users[0].clerkId!,
        messageText: 'Pizza looks amazing! Thank you!',
      },
    }),
    prisma.chatMessage.create({
      data: {
        orderId: deliveryOrders[0].orderId,
        senderClerkId: users.find(u => u.clerkId === deliveryOrders[0].userClerkId)?.clerkId! || users[0].clerkId!,
        messageText: 'Enjoy your meal! Rate us 5 stars please 😊',
      },
    }),
  ]);

  // =========================================
  // SECTION 16: ADMIN SYSTEM
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
      adminPermissions: [
        'user:read', 'user:write', 'user:delete',
        'driver:approve', 'driver:suspend', 'driver:read', 'driver:write',
        'ride:monitor', 'ride:intervene', 'ride:read', 'ride:write',
        'delivery:read', 'delivery:write', 'delivery:monitor',
        'payment:refund', 'wallet:manage', 'financial:read',
        'system:config', 'reports:view', 'logs:view',
        'store:read', 'store:write', 'store:approve',
        'product:read', 'product:write',
        'notification:send', 'notification:read',
      ],
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
      adminRole: 'admin',
      adminPermissions: [
        'user:read', 'user:write',
        'driver:approve', 'driver:read', 'driver:write',
        'ride:monitor', 'ride:read', 'ride:write',
        'delivery:read', 'delivery:write', 'delivery:monitor',
        'financial:read', 'reports:view',
        'store:read', 'store:write', 'store:approve',
        'product:read', 'product:write',
        'notification:send', 'notification:read',
      ],
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
      adminRole: 'moderator',
      adminPermissions: [
        'user:read', 'driver:read', 'ride:monitor', 'ride:read',
        'delivery:read', 'delivery:monitor', 'reports:view',
        'store:read', 'product:read', 'notification:read',
      ],
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
      adminRole: 'support',
      adminPermissions: [
        'user:read', 'driver:read', 'ride:read', 'delivery:read',
        'notification:send', 'notification:read',
      ],
      isActive: true,
      adminCreatedAt: new Date(),
    },
  });

  console.log('✅ Database seeded successfully!');
  console.log('📊 Summary:');
  console.log(`   👥 ${users.length} users created`);
  console.log(`   🚗 ${drivers.length} drivers created`);
  console.log(`   📄 ${3} driver documents created`);
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
  console.log(`   👑 ${4} admins created (super_admin, admin, moderator, support)`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
