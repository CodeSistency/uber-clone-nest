const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugLocationUpdates() {
  console.log('🔍 === DEBUGGING UBICACIONES GPS - MARIA GARCIA ===\n');

  try {
    // 1. Verificar usuario Maria Garcia
    const user = await prisma.user.findUnique({
      where: { email: 'maria.driver@example.com' },
      select: {
        id: true,
        name: true,
        email: true
      }
    });

    console.log('👤 Usuario Maria Garcia:', user);

    if (!user) {
      console.log('❌ Usuario NO encontrado');
      return;
    }

    // 2. Verificar conductor Maria Garcia
    const driver = await prisma.driver.findUnique({
      where: { id: user.id },
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
        locationAccuracy: true
      }
    });

    console.log('\n🚗 Conductor Maria Garcia (ID local):', driver);

    // 3. Verificar si hay location history
    const locationHistory = await prisma.driverLocationHistory.findMany({
      where: { driverId: user.id },
      orderBy: { timestamp: 'desc' },
      take: 5,
      select: {
        id: true,
        latitude: true,
        longitude: true,
        accuracy: true,
        timestamp: true,
        source: true
      }
    });

    console.log('\n📍 Historial de ubicaciones (últimas 5):');
    if (locationHistory.length === 0) {
      console.log('❌ NO hay registros de ubicación en el historial');
    } else {
      locationHistory.forEach((loc, index) => {
        console.log(`${index + 1}. Lat: ${loc.latitude}, Lng: ${loc.longitude}, Accuracy: ${loc.accuracy}, Source: ${loc.source}, Time: ${loc.timestamp}`);
      });
    }

    // 4. Comparar con el conductor ID 7 (Luis Martinez)
    const driver7 = await prisma.driver.findUnique({
      where: { id: 7 },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        status: true,
        currentLatitude: true,
        currentLongitude: true,
        isLocationActive: true,
        lastLocationUpdate: true
      }
    });

    console.log('\n👥 Conductor ID 7 (Luis Martinez):', driver7);

    const locationHistory7 = await prisma.driverLocationHistory.findMany({
      where: { driverId: 7 },
      orderBy: { timestamp: 'desc' },
      take: 3,
      select: {
        id: true,
        latitude: true,
        longitude: true,
        timestamp: true
      }
    });

    console.log('📍 Historial de ubicaciones de Luis (últimas 3):');
    locationHistory7.forEach((loc, index) => {
      console.log(`${index + 1}. Lat: ${loc.latitude}, Lng: ${loc.longitude}, Time: ${loc.timestamp}`);
    });

    // 5. Análisis del problema
    console.log('\n🔍 ANÁLISIS DEL PROBLEMA:');
    console.log(`Maria Garcia - ID Local: ${user.id}, ID VPS: 7`);
    console.log(`Maria tiene ubicaciones GPS: ${driver?.isLocationActive ? '✅ SÍ' : '❌ NO'}`);
    console.log(`Luis tiene ubicaciones GPS: ${driver7?.isLocationActive ? '✅ SÍ' : '❌ NO'}`);

    if (!driver?.isLocationActive && driver7?.isLocationActive) {
      console.log('\n💡 HIPÓTESIS: Las actualizaciones GPS se están guardando en Luis (ID 7) en lugar de Maria (ID 6)');
      console.log('🔧 SOLUCIÓN: Verificar que la app esté usando el JWT token correcto de Maria');
    } else if (!driver?.isLocationActive && !driver7?.isLocationActive) {
      console.log('\n💡 HIPÓTESIS: La app NO está enviando ubicaciones GPS en absoluto');
      console.log('🔧 SOLUCIÓN: Verificar que la app llame al endpoint /location');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugLocationUpdates();
