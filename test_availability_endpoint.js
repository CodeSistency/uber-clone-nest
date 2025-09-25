// Usar fetch nativo de Node.js

// Configuración
const BASE_URL = 'http://localhost:3000';
const USER_EMAIL = 'maria.driver@example.com';

// Primero obtener token JWT
async function getAuthToken() {
  try {
    console.log('🔐 Obteniendo token JWT...');

    const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: USER_EMAIL,
        password: 'password123' // Asumiendo contraseña por defecto
      }),
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status} ${loginResponse.statusText}`);
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login exitoso');
    console.log('Token JWT obtenido (primeros 50 caracteres):', loginData.data.accessToken.substring(0, 50) + '...');

    return loginData.data.accessToken;
  } catch (error) {
    console.error('❌ Error en login:', error.message);
    throw error;
  }
}

// Probar endpoint de availability
async function testAvailabilityEndpoint(token) {
  try {
    console.log('\n📍 Probando endpoint POST /rides/flow/driver/availability...');

    const response = await fetch(`${BASE_URL}/rides/flow/driver/availability`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        status: 'online'
      }),
    });

    console.log(`Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Error response:', errorText);
      throw new Error(`Availability endpoint failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Endpoint de availability exitoso:');
    console.log(JSON.stringify(data, null, 2));

    return data;
  } catch (error) {
    console.error('❌ Error en availability endpoint:', error.message);
    throw error;
  }
}

// Probar endpoint de location update
async function testLocationUpdate(token) {
  try {
    console.log('\n📍 Probando endpoint POST /rides/flow/driver/transport/location...');

    const response = await fetch(`${BASE_URL}/rides/flow/driver/transport/location`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        lat: 9.9226993,
        lng: -67.3811529,
        accuracy: 5.5
      }),
    });

    console.log(`Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Error response:', errorText);
      throw new Error(`Location update failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Location update exitoso:');
    console.log(JSON.stringify(data, null, 2));

    return data;
  } catch (error) {
    console.error('❌ Error en location update:', error.message);
    throw error;
  }
}

// Verificar estado después de las operaciones
async function checkDriverStatus() {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  try {
    console.log('\n🔍 Verificando estado del conductor después de las operaciones...');

    const driver = await prisma.driver.findUnique({
      where: { id: 6 }, // Maria Garcia
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

    console.log('Estado actual del conductor Maria Garcia (ID: 6):');
    console.log(JSON.stringify(driver, null, 2));

  } catch (error) {
    console.error('❌ Error verificando estado:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Función principal
async function main() {
  try {
    console.log('🚀 Iniciando pruebas del flujo de conductor...\n');

    // 1. Obtener token
    const token = await getAuthToken();

    // 2. Ponerse online
    await testAvailabilityEndpoint(token);

    // 3. Actualizar ubicación
    await testLocationUpdate(token);

    // 4. Verificar estado final
    await checkDriverStatus();

    console.log('\n✅ Todas las pruebas completadas');

  } catch (error) {
    console.error('\n❌ Error en las pruebas:', error.message);
    process.exit(1);
  }
}

main();
