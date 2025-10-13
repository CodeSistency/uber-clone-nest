import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedReportsData() {
  console.log('📊 Starting reports data seed...');

  // Helper function to get date in the past
  const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // Get existing data
  const users = await prisma.user.findMany({ take: 3 });
  const drivers = await prisma.driver.findMany({ take: 3 });
  const rideTiers = await prisma.rideTier.findMany();
  const vehicleTypes = await prisma.vehicleType.findMany();
  const vehicles = await prisma.vehicle.findMany({ take: 3 });

  if (users.length === 0 || drivers.length === 0 || rideTiers.length === 0 || vehicleTypes.length === 0) {
    console.log('❌ Insufficient data found. Run main seed first.');
    console.log(`Users: ${users.length}, Drivers: ${drivers.length}, Tiers: ${rideTiers.length}, VehicleTypes: ${vehicleTypes.length}`);
    return;
  }

  // Users are already properly set up with IDs for relationships
  console.log('🔧 Users ready for relationships...');

  // =========================================
  // ADDITIONAL RIDES FOR FINANCIAL REPORTS
  // =========================================
  console.log('🚕 Adding rides for comprehensive financial reports...');

  const additionalRides: any[] = [];

  // Generate rides for the last 90 days with different patterns
  for (let day = 1; day <= 90; day++) {
    const date = daysAgo(day);
    const numRides = Math.floor(Math.random() * 5) + 1; // 1-5 rides per day

    for (let i = 0; i < numRides; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const driver = drivers[Math.floor(Math.random() * drivers.length)];
      const tier = rideTiers[Math.floor(Math.random() * rideTiers.length)];
      const vehicle = vehicles.find(v => v.driverId === driver.id);

      if (!vehicle) continue;

      // Different fare prices based on tier
      let baseFare = 100; // Default for Economy
      if (tier.name?.toLowerCase().includes('comfort')) baseFare = 150;
      if (tier.name?.toLowerCase().includes('premium')) baseFare = 200;

      const farePrice = baseFare + Math.floor(Math.random() * 100);

      // 80% completed, 15% pending, 5% failed
      const statusRandom = Math.random();
      let paymentStatus = 'COMPLETED';
      if (statusRandom > 0.8 && statusRandom <= 0.95) paymentStatus = 'PENDING';
      if (statusRandom > 0.95) paymentStatus = 'FAILED';

      // Generate realistic coordinates within Caracas area
      const baseLat = 10.5061; // Centro de Caracas
      const baseLng = -66.9146;
      const radius = 0.05; // About 5km radius

      const originLat = baseLat + (Math.random() - 0.5) * radius * 2;
      const originLng = baseLng + (Math.random() - 0.5) * radius * 2;
      const destLat = baseLat + (Math.random() - 0.5) * radius * 2;
      const destLng = baseLng + (Math.random() - 0.5) * radius * 2;

      additionalRides.push({
        originAddress: `Ubicación ${day}-${i}, Caracas, Venezuela`,
        destinationAddress: `Destino ${day}-${i}, Caracas, Venezuela`,
        originLatitude: originLat,
        originLongitude: originLng,
        destinationLatitude: destLat,
        destinationLongitude: destLng,
        rideTime: Math.floor(Math.random() * 30) + 5,
        farePrice: paymentStatus === 'COMPLETED' ? farePrice : 0,
        paymentStatus: paymentStatus as any,
        driverId: driver.id,
        userId: user.id, // Use user ID for relationship
        tierId: tier.id,
        vehicleId: vehicle.id,
        requestedVehicleTypeId: vehicleTypes[0].id,
        createdAt: new Date(date.getTime() + i * 60 * 60 * 1000), // Spread throughout the day
      });
    }
  }

  // Create rides in batches
  for (let i = 0; i < additionalRides.length; i += 50) {
    const batch = additionalRides.slice(i, i + 50);
    await prisma.ride.createMany({ data: batch });
    console.log(`Created rides batch ${Math.floor(i/50) + 1}/${Math.ceil(additionalRides.length/50)}`);
  }

  // =========================================
  // WALLET TRANSACTIONS FOR LAST 90 DAYS
  // =========================================
  console.log('💰 Adding wallet transactions for financial reports...');

  const wallets = await prisma.wallet.findMany();
  let walletTransactionCount = 0;
  const walletTransactions: any[] = [];

  if (wallets.length === 0) {
    console.log('⚠️ No wallets found, skipping wallet transactions...');
  } else {
    for (let day = 1; day <= 90; day++) {
      const date = daysAgo(day);

      for (const wallet of wallets) {
        // Random deposits (less frequent)
        if (Math.random() < 0.1) { // 10% chance per day per wallet
          walletTransactions.push({
            walletId: wallet.id,
            amount: Math.floor(Math.random() * 500) + 100,
            transactionType: 'credit' as const,
            description: 'Depósito bancario',
            createdAt: date,
          });
        }

        // Random bonus/referral (rare)
        if (Math.random() < 0.05) { // 5% chance
          walletTransactions.push({
            walletId: wallet.id,
            amount: Math.floor(Math.random() * 100) + 50,
            transactionType: 'credit' as const,
            description: 'Bono por referidos',
            createdAt: date,
          });
        }
      }
    }

    // Create wallet transactions in batches
    for (let i = 0; i < walletTransactions.length; i += 50) {
      const batch = walletTransactions.slice(i, i + 50);
      await prisma.walletTransaction.createMany({ data: batch });
    }

    walletTransactionCount = walletTransactions.length;
    console.log(`💰 Added ${walletTransactionCount} wallet transactions`);
  }

  // =========================================
  // UPDATE WALLET BALANCES
  // =========================================
  console.log('🔄 Updating wallet balances...');

  if (wallets.length > 0) {
    for (const wallet of wallets) {
      const transactions = await prisma.walletTransaction.findMany({
        where: { walletId: wallet.id },
      });

      const balance = transactions.reduce((sum, tx) => {
        return tx.transactionType === 'credit' ? sum + Number(tx.amount) : sum - Math.abs(Number(tx.amount));
      }, 0);

      await prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: balance },
      });
    }
    console.log(`🔄 Updated ${wallets.length} wallet balances`);
  }

  console.log('✅ Reports data seeding completed!');
  console.log(`📊 Added ${additionalRides.length} rides`);
  console.log(`💰 Added ${walletTransactionCount} wallet transactions`);
}

seedReportsData()
  .catch((e) => {
    console.error('❌ Error seeding reports data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
