const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugUserMapping() {
  try {
    // Buscar usuario por email
    const user = await prisma.user.findUnique({
      where: { email: 'maria.driver@example.com' },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        createdAt: true
      }
    });

    console.log('Usuario encontrado:');
    console.log(JSON.stringify(user, null, 2));

    if (!user) {
      console.log('❌ Usuario no encontrado');
      return;
    }

    // Buscar conductor por ID de usuario
    const driver = await prisma.driver.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        status: true,
        verificationStatus: true,
        createdAt: true
      }
    });

    console.log('Conductor encontrado:');
    console.log(JSON.stringify(driver, null, 2));

    // Verificar mapping en JWT payload simulado
    console.log('JWT Payload simulado:');
    console.log(JSON.stringify({
      sub: user.id,
      email: user.email,
      driverId: driver ? driver.id : null,
      iat: Date.now() / 1000,
      exp: (Date.now() / 1000) + 3600
    }, null, 2));

    // Verificar todos los conductores online
    const onlineDrivers = await prisma.driver.findMany({
      where: { status: 'online' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        status: true,
        verificationStatus: true
      }
    });

    console.log('Conductores online:');
    console.log(JSON.stringify(onlineDrivers, null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugUserMapping();
