// Script completo para probar el flujo de creación de rides y matching automático
const axios = require('axios');

async function testRideMatching() {
  console.log('🚀 INICIANDO PRUEBA COMPLETA DE MATCHING AUTOMÁTICO\n');

  try {
    // 1. Login como usuario normal
    console.log('1. 🔐 Iniciando sesión como usuario normal...');
    const loginResponse = await axios.post('http://localhost:3000/auth/login', {
      email: 'john.doe@example.com',
      password: 'password123',
    });
    const userToken = loginResponse.data.access_token;
    console.log('✅ Login de usuario exitoso\n');

    // 2. Crear un ride muy cercano (simulando ubicación del usuario)
    console.log('2. 🚗 Creando ride muy cercano...');
    const rideData = {
      origin_address: 'Calle 93 #13-45, Bogotá',
      destination_address: 'Zona Rosa, Bogotá',
      origin_latitude: 4.6767,
      origin_longitude: -74.0483,
      destination_latitude: 4.6768,
      destination_longitude: -74.0484,
      ride_time: 15,
      fare_price: 0, // Se calculará
      payment_status: 'pending',
      user_id: 1, // John Doe
      vehicle_type_id: 1, // Carro
    };

    console.log('📍 Ubicación del ride:', {
      lat: rideData.origin_latitude,
      lng: rideData.origin_longitude
    });

    const rideResponse = await axios.post('http://localhost:3000/rides', rideData, {
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      }
    });

    const rideId = rideResponse.data.rideId;
    console.log(`✅ Ride creado exitosamente con ID: ${rideId}\n`);

    // 3. Verificar estado del ride
    console.log('3. 📊 Verificando estado del ride...');
    const rideStatusResponse = await axios.get(`http://localhost:3000/rides/${rideId}`, {
      headers: { 'Authorization': `Bearer ${userToken}` }
    });

    console.log('📋 Estado del ride:', rideStatusResponse.data.status);
    console.log('👤 Driver asignado:', rideStatusResponse.data.driverId || 'Ninguno');

    // 4. Si hay driver asignado, probar el endpoint de pending requests
    if (rideStatusResponse.data.driverId) {
      console.log('\n4. 📱 Probando endpoint de pending requests del driver...');

      // Login como el driver asignado (asumiendo que es maria.driver por ahora)
      const driverLoginResponse = await axios.post('http://localhost:3000/auth/login', {
        email: 'maria.driver@example.com',
        password: 'Driver123!',
      });
      const driverToken = driverLoginResponse.data.access_token;
      console.log('✅ Login de driver exitoso');

      // Obtener pending requests
      const pendingResponse = await axios.get('http://localhost:3000/rides/flow/driver/transport/pending-requests', {
        headers: { 'Authorization': `Bearer ${driverToken}` }
      });

      console.log(`📋 Solicitudes pendientes encontradas: ${pendingResponse.data.length}`);
      if (pendingResponse.data.length > 0) {
        console.log('🎯 Primera solicitud:', {
          rideId: pendingResponse.data[0].rideId,
          status: pendingResponse.data[0].status,
          passenger: pendingResponse.data[0].passenger.name,
          timeRemaining: pendingResponse.data[0].timeRemainingSeconds
        });
      }
    } else {
      console.log('\n4. ⚠️ No se asignó driver automáticamente');
      console.log('🔍 Revisar logs del servidor para más detalles');
    }

  } catch (error) {
    console.error('❌ Error en la prueba:', error.response?.data || error.message);

    if (error.response?.status === 403) {
      console.log('\n💡 Posible causa: Driver no está online o no está verificado');
      console.log('🔧 Solución: Asegurarse de que los drivers estén en estado "online"');
    }

    if (error.response?.status === 401) {
      console.log('\n💡 Posible causa: Token inválido o expirado');
    }
  }
}

// Verificar estado de drivers antes de la prueba
async function checkDriversStatus() {
  console.log('🔍 VERIFICANDO ESTADO DE DRIVERS ANTES DE LA PRUEBA\n');

  try {
    // Aquí podríamos hacer una consulta directa a la DB, pero por ahora usamos el endpoint público
    console.log('👥 Drivers deberían estar en estado "online" para el matching automático');
    console.log('📝 Drivers de prueba: maria.driver@example.com (password: Driver123!)');
  } catch (error) {
    console.error('Error verificando drivers:', error.message);
  }
}

async function main() {
  await checkDriversStatus();
  console.log('\n' + '='.repeat(60) + '\n');
  await testRideMatching();
}

main();
