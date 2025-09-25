const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testDriverFlow() {
  console.log('🚀 === PRUEBA COMPLETA DEL FLUJO DE CONDUCTOR ===\n');

  try {
    // 1. Verificar estado inicial de conductores
    console.log('1️⃣ 📊 ESTADO INICIAL DE CONDUCTORES:');
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
        lastLocationUpdate: true
      },
      orderBy: { id: 'asc' }
    });

    allDrivers.forEach((driver, index) => {
      console.log(`${index + 1}. ${driver.firstName} ${driver.lastName} (ID: ${driver.id})`);
      console.log(`   Status: ${driver.status} | Verified: ${driver.verificationStatus}`);
      console.log(`   Location Active: ${driver.isLocationActive}`);
      console.log(`   Coordinates: ${driver.currentLatitude || 'null'}, ${driver.currentLongitude || 'null'}`);
      console.log(`   Last Update: ${driver.lastLocationUpdate || 'Nunca'}\n`);
    });

    // 2. Buscar usuario Maria Garcia
    console.log('2️⃣ 👤 BUSCANDO USUARIO MARIA GARCIA:');
    const user = await prisma.user.findUnique({
      where: { email: 'maria.driver@example.com' },
      select: {
        id: true,
        name: true,
        email: true
      }
    });

    if (!user) {
      console.log('❌ Usuario maria.driver@example.com NO encontrado');
      return;
    }

    console.log(`✅ Usuario encontrado: ${user.name} (ID: ${user.id})`);

    // 3. Verificar si es conductor
    const driver = await prisma.driver.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        status: true,
        verificationStatus: true
      }
    });

    if (!driver) {
      console.log('❌ Usuario NO es conductor');
      return;
    }

    console.log(`✅ Es conductor: ${driver.firstName} ${driver.lastName} (ID: ${driver.id})`);
    console.log(`   Status: ${driver.status} | Verification: ${driver.verificationStatus}`);

    // 4. Simular JWT payload
    console.log('\n3️⃣ 🔐 JWT PAYLOAD SIMULADO:');
    const jwtPayload = {
      sub: user.id,
      email: user.email,
      driverId: driver.id,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600
    };
    console.log(JSON.stringify(jwtPayload, null, 2));

    // 5. Simular cambio a online
    console.log('\n4️⃣ 🚗 SIMULANDO CAMBIO A ONLINE:');
    const updatedDriver = await prisma.driver.update({
      where: { id: driver.id },
      data: { status: 'online' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        status: true
      }
    });
    console.log(`✅ Conductor ${updatedDriver.firstName} ${updatedDriver.lastName} ahora está: ${updatedDriver.status}`);

    // 6. Simular actualización de ubicación
    console.log('\n5️⃣ 📍 SIMULANDO ACTUALIZACIÓN DE UBICACIÓN:');
    const testLocation = {
      lat: 9.9226993,
      lng: -67.3811529,
      accuracy: 5.5
    };

    console.log(`Ubicación de prueba: ${testLocation.lat}, ${testLocation.lng}`);

    const locationUpdatedDriver = await prisma.driver.update({
      where: { id: driver.id },
      data: {
        currentLatitude: testLocation.lat,
        currentLongitude: testLocation.lng,
        isLocationActive: true,
        lastLocationUpdate: new Date(),
        locationAccuracy: testLocation.accuracy,
        updatedAt: new Date()
      },
      select: {
        id: true,
        currentLatitude: true,
        currentLongitude: true,
        isLocationActive: true,
        lastLocationUpdate: true,
        locationAccuracy: true
      }
    });

    console.log('✅ Ubicación actualizada en BD:');
    console.log(`   Lat: ${locationUpdatedDriver.currentLatitude}`);
    console.log(`   Lng: ${locationUpdatedDriver.currentLongitude}`);
    console.log(`   Active: ${locationUpdatedDriver.isLocationActive}`);
    console.log(`   Last Update: ${locationUpdatedDriver.lastLocationUpdate}`);
    console.log(`   Accuracy: ${locationUpdatedDriver.locationAccuracy}`);

    // 7. Verificar estado final
    console.log('\n6️⃣ 🔍 ESTADO FINAL - CONDUCTOR LISTO PARA MATCHING:');
    const finalDriver = await prisma.driver.findUnique({
      where: { id: driver.id },
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

    const isMatchable =
      finalDriver.status === 'online' &&
      finalDriver.verificationStatus === 'approved' &&
      finalDriver.isLocationActive === true &&
      finalDriver.currentLatitude !== null &&
      finalDriver.currentLongitude !== null;

    console.log(`Conductor: ${finalDriver.firstName} ${finalDriver.lastName}`);
    console.log(`Status: ${finalDriver.status}`);
    console.log(`Verification: ${finalDriver.verificationStatus}`);
    console.log(`Location Active: ${finalDriver.isLocationActive}`);
    console.log(`Has Coordinates: ${finalDriver.currentLatitude !== null && finalDriver.currentLongitude !== null}`);
    console.log(`🚀 ¿LISTO PARA MATCHING?: ${isMatchable ? '✅ SÍ' : '❌ NO'}`);

    if (isMatchable) {
      console.log('\n🎉 ¡FLUJO COMPLETADO EXITOSAMENTE!');
      console.log('Ahora puedes probar el endpoint de matching y debería funcionar.');
    } else {
      console.log('\n❌ El conductor NO está listo para matching.');
      console.log('Revisa los logs de la aplicación para identificar el problema.');
    }

    // 8. Contar conductores matchables
    console.log('\n7️⃣ 📈 RESUMEN GENERAL:');
    const onlineDrivers = await prisma.driver.count({
      where: { status: 'online', verificationStatus: 'approved' }
    });

    const matchableDrivers = await prisma.driver.count({
      where: {
        status: 'online',
        verificationStatus: 'approved',
        isLocationActive: true,
        currentLatitude: { not: null },
        currentLongitude: { not: null }
      }
    });

    console.log(`Conductores online: ${onlineDrivers}`);
    console.log(`Conductores matchables: ${matchableDrivers}`);

  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDriverFlow();
