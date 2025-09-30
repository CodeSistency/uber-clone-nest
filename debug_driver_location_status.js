const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugDriverLocationStatus() {
  try {
    console.log('=== ESTADO COMPLETO DE CONDUCTORES ===\n');

    // Obtener todos los conductores con información completa de ubicación
    const allDrivers = await prisma.driver.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        status: true,
        verificationStatus: true,
        currentLatitude: true,
        currentLongitude: true,
        isLocationActive: true,
        lastLocationUpdate: true,
        locationAccuracy: true,
        createdAt: true
      },
      orderBy: { id: 'asc' }
    });

    console.log('TODOS LOS CONDUCTORES:');
    allDrivers.forEach((driver, index) => {
      console.log(`${index + 1}. ${driver.firstName} ${driver.lastName} (ID: ${driver.id})`);
      console.log(`   Status: ${driver.status}`);
      console.log(`   Verification: ${driver.verificationStatus}`);
      console.log(`   Location Active: ${driver.isLocationActive}`);
      console.log(`   Current Lat/Lng: ${driver.currentLatitude}, ${driver.currentLongitude}`);
      console.log(`   Last Update: ${driver.lastLocationUpdate || 'Nunca'}`);
      console.log(`   Accuracy: ${driver.locationAccuracy || 'N/A'}\n`);
    });

    // Conductores online
    const onlineDrivers = allDrivers.filter(d => d.status === 'online');
    console.log(`CONDUCTORES ONLINE (${onlineDrivers.length}):`);
    onlineDrivers.forEach((driver, index) => {
      console.log(`${index + 1}. ${driver.firstName} ${driver.lastName} (ID: ${driver.id})`);
      console.log(`   Location Active: ${driver.isLocationActive}`);
      console.log(`   Has Coordinates: ${driver.currentLatitude !== null && driver.currentLongitude !== null}`);
      console.log(`   Last Update: ${driver.lastLocationUpdate || 'Nunca'}\n`);
    });

    // Conductores que cumplen TODOS los criterios para matching
    const matchableDrivers = allDrivers.filter(d =>
      d.status === 'online' &&
      d.verificationStatus === 'approved' &&
      d.isLocationActive === true &&
      d.currentLatitude !== null &&
      d.currentLongitude !== null
    );

    console.log(`CONDUCTORES MATCHEABLES (${matchableDrivers.length}):`);
    matchableDrivers.forEach((driver, index) => {
      console.log(`${index + 1}. ${driver.firstName} ${driver.lastName} (ID: ${driver.id})`);
      console.log(`   Coordinates: ${driver.currentLatitude}, ${driver.currentLongitude}`);
      console.log(`   Last Update: ${driver.lastLocationUpdate}\n`);
    });

    // Verificar si hay conductores online pero sin ubicación activa
    const onlineWithoutLocation = onlineDrivers.filter(d => !d.isLocationActive || !d.currentLatitude || !d.currentLongitude);
    if (onlineWithoutLocation.length > 0) {
      console.log('🚨 PROBLEMA: Conductores online pero sin ubicación GPS activa:');
      onlineWithoutLocation.forEach((driver, index) => {
        console.log(`${index + 1}. ${driver.firstName} ${driver.lastName} (ID: ${driver.id})`);
        console.log(`   isLocationActive: ${driver.isLocationActive}`);
        console.log(`   Has Coordinates: ${driver.currentLatitude !== null && driver.currentLongitude !== null}\n`);
      });
    }

    // Verificar si hay conductores con ubicación pero offline
    const offlineWithLocation = allDrivers.filter(d =>
      d.status !== 'online' &&
      d.isLocationActive === true &&
      d.currentLatitude !== null &&
      d.currentLongitude !== null
    );

    if (offlineWithLocation.length > 0) {
      console.log('ℹ️  INFO: Conductores offline pero con ubicación GPS:');
      offlineWithLocation.forEach((driver, index) => {
        console.log(`${index + 1}. ${driver.firstName} ${driver.lastName} (ID: ${driver.id})`);
        console.log(`   Status: ${driver.status}\n`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugDriverLocationStatus();
