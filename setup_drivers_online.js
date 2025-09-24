// Script para verificar y configurar drivers online para testing
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setupDriversForTesting() {
  console.log('🔧 CONFIGURANDO DRIVERS PARA TESTING\n');

  try {
    // 1. Verificar drivers existentes
    console.log('1. 📋 Verificando drivers existentes...');
    const drivers = await prisma.driver.findMany({
      include: {
        vehicleType: true,
      },
    });

    console.log(`👥 Encontrados ${drivers.length} drivers:`);
    drivers.forEach((driver, index) => {
      console.log(`  ${index + 1}. ${driver.firstName} ${driver.lastName} (${driver.email || 'sin email'})`);
      console.log(`     Estado: ${driver.status} | Verificado: ${driver.verificationStatus}`);
      console.log(`     Vehículo: ${driver.vehicleType?.displayName || 'Sin tipo'}`);
    });

    // 2. Actualizar drivers para que estén online y verificados
    console.log('\n2. 🔄 Actualizando drivers para testing...');

    for (const driver of drivers) {
      await prisma.driver.update({
        where: { id: driver.id },
        data: {
          status: 'online',
          verificationStatus: 'approved',
          canDoDeliveries: false, // Solo rides por ahora
          updatedAt: new Date(),
        },
      });
      console.log(`✅ Driver ${driver.firstName} ${driver.lastName} actualizado: online + verificado`);
    }

    // 3. Verificar que los usuarios correspondientes existan
    console.log('\n3. 👤 Verificando usuarios correspondientes...');
    for (const driver of drivers) {
      const user = await prisma.user.findUnique({
        where: { id: driver.id },
        select: { id: true, name: true, email: true },
      });

      if (user) {
        console.log(`✅ Usuario ${user.name} (${user.email}) encontrado para driver ${driver.id}`);
      } else {
        console.log(`❌ Usuario no encontrado para driver ${driver.id}`);
      }
    }

    console.log('\n🎯 SETUP COMPLETADO');
    console.log('📝 Todos los drivers están ahora online y verificados');
    console.log('🚀 Puedes ejecutar la prueba de matching automático');

  } catch (error) {
    console.error('❌ Error en setup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupDriversForTesting();
