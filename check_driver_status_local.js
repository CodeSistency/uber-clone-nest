const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDriverStatusLocal() {
  console.log('🔍 === VERIFICANDO ESTADO DEL CONDUCTOR EN TU ENTORNO LOCAL ===\n');

  try {
    // Buscar al usuario Maria Garcia
    const user = await prisma.user.findUnique({
      where: { email: 'maria.driver@example.com' },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true
      }
    });

    console.log('👤 Usuario encontrado:', user);

    if (!user) {
      console.log('❌ Usuario maria.driver@example.com NO encontrado');
      return;
    }

    // Verificar si es conductor
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

    console.log('\n🚗 Estado del conductor Maria Garcia:');
    console.log(JSON.stringify(driver, null, 2));

    if (!driver) {
      console.log('❌ El usuario NO es conductor');
      return;
    }

    // Verificar todos los conductores
    const allDrivers = await prisma.driver.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        status: true,
        verificationStatus: true,
        currentLatitude: true,
        currentLongitude: true,
        isLocationActive: true
      },
      orderBy: { id: 'asc' }
    });

    console.log('\n📊 TODOS LOS CONDUCTORES:');
    allDrivers.forEach((d, index) => {
      console.log(`${index + 1}. ${d.firstName} ${d.lastName} (ID: ${d.id})`);
      console.log(`   Status: ${d.status} | Verified: ${d.verificationStatus}`);
      console.log(`   Location: (${d.currentLatitude || 'null'}, ${d.currentLongitude || 'null'}) | Active: ${d.isLocationActive}`);
      console.log('');
    });

    // Contar conductores online y matchables
    const onlineDrivers = allDrivers.filter(d => d.status === 'online');
    const matchableDrivers = allDrivers.filter(d =>
      d.status === 'online' &&
      d.verificationStatus === 'approved' &&
      d.isLocationActive === true &&
      d.currentLatitude !== null &&
      d.currentLongitude !== null
    );

    console.log(`📈 RESUMEN:`);
    console.log(`   Total conductores: ${allDrivers.length}`);
    console.log(`   Conductores online: ${onlineDrivers.length}`);
    console.log(`   Conductores matchables: ${matchableDrivers.length}`);

    if (matchableDrivers.length === 0) {
      console.log('\n❌ PROBLEMA: No hay conductores listos para matching');
      console.log('💡 SOLUCIÓN: El conductor debe:');
      console.log('   1. Llamar POST /rides/flow/driver/availability { "status": "online" }');
      console.log('   2. Enviar ubicaciones GPS reales (no 0,0)');
    } else {
      console.log('\n✅ HAY conductores listos para matching');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDriverStatusLocal();
