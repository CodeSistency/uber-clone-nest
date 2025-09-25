const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDrivers() {
  try {
    const drivers = await prisma.driver.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        status: true,
        verificationStatus: true,
        isLocationActive: true,
        currentLatitude: true,
        currentLongitude: true,
        lastLocationUpdate: true,
      },
    });

    console.log('Conductores en BD:');
    drivers.forEach((d, i) => {
      console.log(`  ${i + 1}. ID=${d.id} - ${d.firstName} ${d.lastName} - Status: ${d.status} - Verified: ${d.verificationStatus} - Location: ${d.isLocationActive ? '✅' : '❌'} (${d.currentLatitude}, ${d.currentLongitude})`);
    });

    const onlineApproved = drivers.filter(d => d.status === 'online' && d.verificationStatus === 'approved' && d.isLocationActive);
    console.log(`🎯 Conductores listos para matching: ${onlineApproved.length}`);

    if (onlineApproved.length > 0) {
      console.log('\n✅ ¡Perfecto! Los conductores están listos para el matching.');
      console.log('Ahora puedes probar el endpoint POST /rides/flow/client/transport/match-best-driver');
    } else {
      console.log('\n❌ Aún hay problemas con la configuración de conductores.');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDrivers();
