/*
  Interactive CLI to test REAL backend endpoints with self-healing preconditions.
  - Uses Prisma to ensure required data exists (tiers, vehicle types, stores, products).
  - If JWT is missing/invalid, registers a test user automatically and continues.
  - Makes REAL HTTP calls to backend endpoints for complete integration testing.
  - Interactive simulation of real user experience with driver/passenger flows.
*/
const readline = require('readline');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BASE = process.env.BASE_URL || 'http://localhost:3000';
let TOKEN = process.env.TEST_JWT || '';

// Sistema de Estados Interactivo
let TEST_STATE = {
  user: null,
  currentRide: null,
  currentOrder: null,
  currentDriver: null,
  websocketConnected: false,
  testMode: false
};

// Sistema de Logging Mejorado con colores
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${colors[color]}[${timestamp}] ${message}${colors.reset}`);
}

function logSuccess(message) { log(`✅ ${message}`, 'green'); }
function logError(message) { log(`❌ ${message}`, 'red'); }
function logInfo(message) { log(`ℹ️  ${message}`, 'blue'); }
function logWarning(message) { log(`⚠️  ${message}`, 'yellow'); }

// Función Mejorada ask() con opciones
async function ask(question, options = null, defaultValue = null) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  if (options) {
    console.log(`\n${question}`);
    options.forEach((opt, i) => console.log(`${i + 1}) ${opt}`));
    if (defaultValue) console.log(`Default: ${defaultValue}`);
  } else {
    console.log(`\n${question}`);
  }

  return new Promise((resolve) => {
    rl.question('> ', (ans) => {
      rl.close();
      const trimmed = ans.trim();
      if (!trimmed && defaultValue) {
        resolve(defaultValue);
      } else if (options && !isNaN(trimmed)) {
        const index = parseInt(trimmed) - 1;
        if (index >= 0 && index < options.length) {
          resolve(options[index]);
        } else {
          resolve(trimmed);
        }
      } else {
        resolve(trimmed);
      }
    });
  });
}

// Función de Sleep Mejorada
function sleep(ms, message = '') {
  return new Promise(resolve => {
    if (message) {
      console.log(message);
      const interval = setInterval(() => {
        process.stdout.write('.');
      }, 500);

      setTimeout(() => {
        clearInterval(interval);
        console.log(' ✅');
        resolve();
      }, ms);
    } else {
      setTimeout(resolve, ms);
    }
  });
}

async function api(path, method = 'GET', body, description = '') {
  const startTime = Date.now();

  try {
    const url = `${BASE}${path}`;
    const options = {
    method,
    headers: {
        'Authorization': TOKEN,
      'Content-Type': 'application/json',
      'Idempotency-Key': body && (process.env.IDEMP_KEY || `${Date.now()}-${Math.random().toString(36).slice(2)}`),
    },
    body: body ? JSON.stringify(body) : undefined,
    };

    console.log(`📡 ${method} ${path}${description ? ` (${description})` : ''}`);

    const res = await fetch(url, options);
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    let json;
    try {
      json = await res.json();
    } catch (parseError) {
      console.log(`⚠️  Could not parse response as JSON: ${parseError.message}`);
      json = { rawResponse: await res.text() };
    }

    if (!res.ok) {
      console.log(`❌ ${method} ${path} - ${responseTime}ms - HTTP ${res.status}`);
      console.log(`   Response:`, JSON.stringify(json, null, 2));

      const errorMessage = json.message || json.error || `HTTP ${res.status}`;
      throw new Error(`Request failed: ${errorMessage}`);
    }

    console.log(`✅ ${method} ${path} - ${responseTime}ms`);
    return json;

  } catch (error) {
    if (error.message.includes('Request failed')) {
      throw error; // Re-throw our custom errors
    }

    const endTime = Date.now();
    const responseTime = endTime - startTime;
    console.log(`❌ ${method} ${path} - ${responseTime}ms - Network Error: ${error.message}`);
    throw new Error(`Network error: ${error.message}`);
  }
}

// Sistema de Notificaciones Simulado
async function showNotification(type, message, data = {}) {
  const icons = {
    'ride_accepted': '✅',
    'driver_arrived': '🚗',
    'ride_started': '🏁',
    'ride_completed': '🎉',
    'emergency': '🚨',
    'order_ready': '🍕',
    'driver_assigned': '👨‍🚗',
    'payment_success': '💳'
  };

  console.log(`\n${icons[type] || '🔔'} NOTIFICACIÓN:`);
  console.log(message);

  if (Object.keys(data).length > 0) {
    console.log('Detalles:', JSON.stringify(data, null, 2));
  }

  // Esperar confirmación del usuario
  await ask('Presiona Enter para continuar...');
}

// Generador de Datos Realistas
async function generateNearbyDrivers(lat, lng) {
  const drivers = [];
  const count = Math.floor(Math.random() * 5) + 1; // 1-5 conductores

  for (let i = 0; i < count; i++) {
    drivers.push({
      id: Math.floor(Math.random() * 1000) + 1,
      name: `Conductor ${i + 1}`,
      vehicle: ['Toyota Corolla', 'Honda Civic', 'Ford Focus', 'Chevrolet Spark'][Math.floor(Math.random() * 4)],
      rating: (Math.random() * 2 + 3).toFixed(1), // 3.0 - 5.0
      distance: Math.floor(Math.random() * 5) + 1, // 1-5 km
      eta: Math.floor(Math.random() * 10) + 2, // 2-12 min
      price: Math.floor(Math.random() * 20) + 10 // $10-30
    });
  }

  return drivers;
}

// Simulación de Conductor Interactiva
async function simulateDriverFlow(rideId, rideData) {
  console.log('\n🚗 === SIMULACIÓN DE CONDUCTOR ===');
  console.log(`Nuevo viaje disponible:`);
  console.log(`📍 Origen: ${rideData.originAddress}`);
  console.log(`🎯 Destino: ${rideData.destinationAddress}`);
  console.log(`💰 Tarifa estimada: $${rideData.estimatedFare || rideData.farePrice || '15'}`);

  const accept = await ask('¿Aceptar este viaje?', ['Sí', 'No'], 'No');

  if (accept.toLowerCase() === 'sí' || accept === '1') {
    logSuccess('Conductor aceptó el viaje!');

    // Simular llegada
    await sleep(2000, 'Conductor en camino al punto de recogida');
    const arrive = await ask('¿El conductor llegó al punto de recogida?', ['Sí'], 'Sí');

    if (arrive.toLowerCase() === 'sí' || arrive === '1') {
      logSuccess('Conductor llegó al punto de recogida!');

      // Simular inicio del viaje
      await sleep(1000, 'Preparando inicio del viaje');
      const start = await ask('¿Iniciar el viaje?', ['Sí'], 'Sí');

      if (start.toLowerCase() === 'sí' || start === '1') {
        logSuccess('Viaje iniciado!');

        // Simular progreso del viaje
        await sleep(3000, 'Viaje en progreso');

        const complete = await ask('¿Completar el viaje?', ['Sí'], 'Sí');

        if (complete.toLowerCase() === 'sí' || complete === '1') {
          logSuccess('Viaje completado exitosamente!');
          return true;
        }
      }
    }
  } else {
    logWarning('Conductor rechazó el viaje');
    return false;
  }
  return false;
}

async function ensureAuthToken() {
  // If a token exists and works, keep it; otherwise, register a new user and use its token
  if (TOKEN) {
    try {
      await api('/api/auth/profile');
      logSuccess('Token existente válido');
      return;
    } catch (error) {
      logWarning('Token existente inválido, registrando nuevo usuario');
      TOKEN = ''; // Reset token to force registration
    }
  }

  const rnd = Math.random().toString(36).slice(2);
  const userName = `Tester ${rnd}`;

  logInfo(`Registrando usuario de prueba: ${userName}`);

  try {
  const registerRes = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `tester_${rnd}@example.com`,
      password: 'Password123!@#',
        name: userName,
    }),
  });

    console.log(`Register response status: ${registerRes.status}`);

    let regJson;
    try {
      regJson = await registerRes.json();
      console.log('Register response:', JSON.stringify(regJson, null, 2));
    } catch (parseError) {
      console.log('Could not parse response as JSON:', parseError.message);
      regJson = {};
    }

  if (!registerRes.ok) {
      logError(`Registro falló - Status: ${registerRes.status}`);
      logError(`Respuesta del servidor: ${JSON.stringify(regJson)}`);
      throw new Error(`Auto-register failed: ${registerRes.status} - ${regJson.message || 'Unknown error'}`);
    }

    // Verificar diferentes posibles estructuras de respuesta
    if (regJson.accessToken) {
      TOKEN = `Bearer ${regJson.accessToken}`;
    } else if (regJson.token) {
      TOKEN = `Bearer ${regJson.token}`;
    } else if (regJson.data && regJson.data.accessToken) {
      TOKEN = `Bearer ${regJson.data.accessToken}`;
    } else if (regJson.data && regJson.data.token) {
      TOKEN = `Bearer ${regJson.data.token}`;
    } else {
      logError('Respuesta del registro no contiene token:');
      logError(JSON.stringify(regJson, null, 2));
      throw new Error('Register response does not contain access token');
    }

    logSuccess(`Usuario registrado exitosamente: ${userName}`);
    logInfo(`Token obtenido: ${TOKEN.substring(0, 20)}...`);

    TEST_STATE.user = {
      name: userName,
      email: `tester_${rnd}@example.com`,
      id: regJson.user?.id || regJson.data?.user?.id
    };

  } catch (error) {
    logError(`Error durante registro: ${error.message}`);
    logWarning('Asegúrate de que:');
    logWarning('1. El backend esté ejecutándose (npm run start:dev)');
    logWarning('2. La base de datos esté conectada');
    logWarning('3. Las variables de entorno estén configuradas');
    throw error;
  }
}

async function ensureRideTier(id = 1) {
  const tier = await prisma.rideTier.findUnique({ where: { id } });
  if (!tier) {
    await prisma.rideTier.create({
      data: {
        id,
        name: 'UberX',
        baseFare: 2.5,
        perMinuteRate: 0.25,
        perMileRate: 1.25,
      },
    });
    logSuccess('Tier UberX creado');
  }
}

async function ensureVehicleType(id = 1) {
  const vt = await prisma.vehicleType.findUnique({ where: { id } });
  if (!vt) {
    await prisma.vehicleType.create({
      data: { id, name: 'car', displayName: 'Carro', isActive: true },
    });
    logSuccess('Tipo de vehículo Carro creado');
  }
}

async function ensureStoreAndProduct(storeId = 1, productId = 1) {
  let store = await prisma.store.findUnique({ where: { id: storeId } });
  if (!store) {
    store = await prisma.store.create({
      data: {
        id: storeId,
        name: 'Pizza Palace',
        address: 'Centro de Caracas',
        latitude: 10.5,
        longitude: -66.9,
        isOpen: true,
      },
    });
    logSuccess('Tienda Pizza Palace creada');
  }
  let product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    await prisma.product.create({
      data: {
        id: productId,
        storeId: storeId,
        name: 'Pizza Margherita Grande',
        description: 'Pizza clásica con queso mozzarella y albahaca',
        price: 15.99,
        isAvailable: true,
      },
    });
    logSuccess('Producto Pizza Margherita creado');
  }
}

// Flujo de Transporte Interactivo Mejorado
// Función mejorada que llama endpoints reales del backend
async function testTransportRealEndpoints() {
  console.log('\n🚕 === FLUJO DE TRANSPORTE - ENDPOINTS REALES ===');

  // Preparar datos necesarios
  await ensureRideTier(1);
  await ensureVehicleType(1);

  logInfo('Bienvenido al sistema de transporte Uber Clone');

  // Paso 1: Definir viaje usando endpoint real
  console.log('\n📝 Paso 1: Define tu viaje');
  const origin = await ask('¿Dónde estás?', null, 'Centro de Caracas');
  const destination = await ask('¿A dónde vas?', null, 'Plaza Venezuela');

  // Generar coordenadas realistas
  const rideData = {
    origin_address: origin,
    origin_latitude: 10.506 + Math.random() * 0.01,
    origin_longitude: -66.914 + Math.random() * 0.01,
    destination_address: destination,
    destination_latitude: 10.500 + Math.random() * 0.01,
    destination_longitude: -66.910 + Math.random() * 0.01,
    ride_time: Math.floor(Math.random() * 30) + 10,
    fare_price: 15.99,
    payment_status: 'pending',
    user_id: TEST_STATE.user?.id || 1,
    tier_id: 1,
    vehicle_type_id: 1
  };

  logInfo(`📍 Origen: ${origin}`);
  logInfo(`🎯 Destino: ${destination}`);
  logInfo(`⏱️  Tiempo estimado: ${rideData.ride_time} minutos`);

  // Paso 2: Crear viaje usando endpoint real
  logInfo('Creando solicitud de viaje...');
  try {
    const createResponse = await api('/api/ride/create', 'POST', rideData);
    const rideId = createResponse.rideId;

    logSuccess(`Viaje creado exitosamente! ID: ${rideId}`);
    TEST_STATE.currentRide = { id: rideId, ...rideData };

    // Paso 3: Obtener detalles del viaje
    const rideDetails = await api(`/api/ride/${rideId}`, 'GET');
    logInfo(`Estado del viaje: ${rideDetails.status || 'created'}`);

    // Paso 4: Obtener tipos de vehículo disponibles
    const vehicleTypes = await api('/api/ride/vehicle-types', 'GET');
    logInfo(`Tipos de vehículo disponibles: ${vehicleTypes.data?.length || 0}`);

    // Paso 5: Simular que conductor acepta el viaje
    const acceptChoice = await ask('¿Simular aceptación de conductor?', ['Sí', 'No'], 'Sí');

    if (acceptChoice.toLowerCase() === 'sí') {
      // En un escenario real, esto sería hecho por otro usuario (conductor)
      // Aquí simulamos el flujo
      const acceptResponse = await api(`/api/ride/${rideId}/accept`, 'POST', {
        driver_id: 1 // ID de conductor de prueba
      });

      logSuccess('Conductor aceptó el viaje!');
      await showNotification('ride_accepted', '¡Conductor encontrado!', {
        driverName: 'Conductor de Prueba',
        vehicle: 'Toyota Corolla'
      });

      // Paso 6: Simular inicio del viaje
      const startChoice = await ask('¿Iniciar el viaje?', ['Sí', 'No'], 'Sí');
      if (startChoice.toLowerCase() === 'sí') {
        await api(`/api/ride/${rideId}/start`, 'POST', { driverId: 1 });
        logSuccess('Viaje iniciado!');

        await sleep(2000, 'Viaje en progreso');

        // Paso 7: Completar el viaje
        const completeChoice = await ask('¿Completar el viaje?', ['Sí', 'No'], 'Sí');
        if (completeChoice.toLowerCase() === 'sí') {
          await api(`/api/ride/${rideId}/complete`, 'POST', {
            driverId: 1,
            finalDistance: 12.5,
            finalTime: 25
          });
          logSuccess('Viaje completado exitosamente!');

          // Paso 8: Calificar el viaje
          const rating = await ask('Califica tu viaje (1-5):', null, '5');
          await api(`/api/ride/${rideId}/rate`, 'POST', {
            ratedByUserId: TEST_STATE.user?.id || 1,
            ratedUserId: 1,
            ratingValue: parseInt(rating),
            comment: 'Excelente servicio!'
          });

          logSuccess('¡Viaje calificado exitosamente! ⭐');
        }
      }
    }

    // Paso 9: Ver historial de viajes
    const userRides = await api(`/api/ride/${TEST_STATE.user?.id || 1}`, 'GET');
    logInfo(`Total de viajes realizados: ${userRides.length || 0}`);

  } catch (error) {
    logError(`Error en el flujo de transporte: ${error.message}`);
    logWarning('Posibles causas:');
    logWarning('- Backend no está ejecutándose');
    logWarning('- Token JWT expirado');
    logWarning('- Datos de prueba no encontrados');
  }
}

// Función mejorada que llama endpoints reales del backend para delivery
async function testDeliveryRealEndpoints() {
  console.log('\n🍕 === FLUJO DE DELIVERY - ENDPOINTS REALES ===');

  await ensureStoreAndProduct(1, 1);

  logInfo('Bienvenido al servicio de delivery Uber Clone');

  try {
    // Paso 1: Obtener tiendas cercanas usando endpoint real
    logInfo('Buscando restaurantes cercanos...');
    const nearbyStores = await api('/stores', 'GET');
    logSuccess(`Encontradas ${nearbyStores.length || 0} tiendas cercanas`);

    // Paso 2: Obtener detalles de una tienda
    const storeDetails = await api('/stores/1', 'GET');
    logInfo(`Tienda seleccionada: ${storeDetails.name || 'Pizza Palace'}`);
    logInfo(`Rating: ${storeDetails.rating || 4.5} ⭐`);

    // Paso 3: Crear orden usando endpoint real
    const orderData = {
    storeId: 1,
      items: [
        { productId: 1, quantity: 2, specialInstructions: 'Extra queso' }
      ],
      deliveryAddress: 'Mi casa, Calle 123',
      deliveryLatitude: 10.506 + Math.random() * 0.01,
      deliveryLongitude: -66.914 + Math.random() * 0.01,
      specialInstructions: 'Timbrar en el intercomunicador'
    };

    logInfo('Creando orden de delivery...');
    const createOrderResponse = await api('/orders', 'POST', orderData);
    const orderId = createOrderResponse.orderId || createOrderResponse.id;

    logSuccess(`Orden creada exitosamente! ID: ${orderId}`);
    TEST_STATE.currentOrder = { id: orderId, ...orderData };

    // Paso 4: Obtener detalles de la orden
    const orderDetails = await api(`/orders/${orderId}`, 'GET');
    logInfo(`Estado de la orden: ${orderDetails.status || 'pending'}`);
    logInfo(`Total: $${orderDetails.totalPrice || '25.99'}`);

    // Paso 5: Simular aceptación por conductor
    const acceptChoice = await ask('¿Simular aceptación por conductor?', ['Sí', 'No'], 'Sí');

    if (acceptChoice.toLowerCase() === 'sí') {
      // Obtener órdenes disponibles para conductores
      const availableOrders = await api('/orders/driver/available', 'GET');
      logInfo(`Órdenes disponibles para conductores: ${availableOrders.data?.length || 0}`);

      // Simular aceptación (en un escenario real, esto sería hecho por otro usuario)
      await api(`/orders/${orderId}/accept`, 'POST', {});
      logSuccess('Conductor aceptó la orden!');

      await showNotification('driver_assigned', '¡Repartidor asignado!', {
        driverName: 'Carlos García',
        vehicle: 'Moto Yamaha',
        eta: '12 minutos'
      });

      // Paso 6: Simular recogida
      const pickupChoice = await ask('¿Marcar orden como recogida?', ['Sí', 'No'], 'Sí');
      if (pickupChoice.toLowerCase() === 'sí') {
        await api(`/orders/${orderId}/pickup`, 'POST', {});
        logSuccess('Orden recogida del restaurante!');

        await showNotification('order_ready', 'Tu orden está en camino!', {
          driverName: 'Carlos García',
          estimatedTime: '10 minutos'
        });

        await sleep(2000, 'Repartidor en camino');

        // Paso 7: Simular entrega
        const deliverChoice = await ask('¿Marcar orden como entregada?', ['Sí', 'No'], 'Sí');
        if (deliverChoice.toLowerCase() === 'sí') {
          await api(`/orders/${orderId}/deliver`, 'POST', {});
          logSuccess('Orden entregada exitosamente!');

          await showNotification('ride_completed', '¡Pedido entregado!', {
            driverName: 'Carlos García',
            total: '$25.99',
            rating: '⭐⭐⭐⭐⭐'
          });
        }
      }
    }

    // Paso 8: Ver historial de órdenes
    const userOrders = await api('/orders', 'GET');
    logInfo(`Total de órdenes realizadas: ${userOrders.length || 0}`);

  } catch (error) {
    logError(`Error en el flujo de delivery: ${error.message}`);
    logWarning('Posibles causas:');
    logWarning('- Backend no está ejecutándose');
    logWarning('- Tienda o productos de prueba no encontrados');
    logWarning('- Usuario no tiene permisos para crear órdenes');
  }
}

// Mantener función original para comparación
async function testDelivery() {
  console.log('\n🍕 === FLUJO DE DELIVERY INTERACTIVO (SIMULADO) ===');
  await testDeliveryRealEndpoints();
}

// Flujo de Errands Interactivo Mejorado
async function testErrand() {
  console.log('\n🛒 === FLUJO DE MANDADOS INTERACTIVO ===');

  logInfo('Servicio de mandados - Te ayudamos con tus compras');

  // Paso 1: Definir el mandado
  console.log('\n📝 Paso 1: Define tu mandado');
  const errandType = await ask('Tipo de mandado:', [
    'Compras en supermercado',
    'Recoger medicamentos',
    'Compras en farmacia',
    'Otros'
  ], 'Compras en supermercado');

  const description = await ask('Describe lo que necesitas:', null,
    errandType === 'Compras en supermercado' ? 'Leche, pan, huevos y frutas' :
    errandType === 'Recoger medicamentos' ? 'Medicamentos recetados' :
    'Artículos varios');

  // Paso 2: Ubicaciones
  const pickupLocation = await ask('Lugar de recogida:', null,
    errandType === 'Compras en supermercado' ? 'Supermercado Central' :
    errandType === 'Recoger medicamentos' ? 'Farmacia del Centro' : 'Centro comercial');

  const dropoffLocation = await ask('Dirección de entrega:', null, 'Mi casa, Calle 123');

  // Paso 3: Estimación de costo
  const estimatedCost = await ask('Costo estimado de compras ($):', null, '25');

  logInfo(`Mandado: ${errandType}`);
  logInfo(`📍 Recogida: ${pickupLocation}`);
  logInfo(`🏠 Entrega: ${dropoffLocation}`);
  logInfo(`💰 Costo estimado: $${estimatedCost}`);

  // Paso 4: Crear mandado
  logInfo('Creando solicitud de mandado...');

  const errandData = {
    description: `${errandType}: ${description}`,
    pickupAddress: pickupLocation,
    pickupLat: 10.506 + Math.random() * 0.01,
    pickupLng: -66.914 + Math.random() * 0.01,
    dropoffAddress: dropoffLocation,
    dropoffLat: 10.500 + Math.random() * 0.01,
    dropoffLng: -66.910 + Math.random() * 0.01,
    estimatedCost: parseFloat(estimatedCost)
  };

  const errand = await api('/rides/flow/client/errand/create', 'POST', errandData);

  logSuccess('Mandado creado exitosamente!');
  logSuccess('Buscando conductor disponible...');

  // Simular aceptación
  await sleep(2000, 'Buscando conductores disponibles');
  await showNotification('driver_assigned', 'Conductor asignado para tu mandado!', {
    driverName: 'María López',
    eta: '10 minutos'
  });

  // Simular proceso
  await sleep(1500, 'Conductor en camino');
  await showNotification('driver_arrived', 'Conductor llegó al lugar de recogida', {
    location: pickupLocation
  });

  await sleep(2000, 'Realizando compras');
  const actualCost = (parseFloat(estimatedCost) + Math.random() * 10 - 5).toFixed(2);
  await showNotification('order_ready', 'Compras realizadas!', {
    cost: `$${actualCost}`,
    items: description
  });

  await sleep(1500, 'Regresando con las compras');
  await showNotification('ride_completed', 'Mandado completado! Tus compras han llegado.', {
    totalCost: `$${actualCost}`,
    deliveryFee: '$3.99'
  });

  logSuccess('Mandado completado exitosamente! 🛒');
}

// Flujo de Parcel Interactivo Mejorado
async function testParcel() {
  console.log('\n📦 === FLUJO DE PAQUETES INTERACTIVO ===');

  logInfo('Servicio de envío de paquetes');

  // Paso 1: Información del paquete
  console.log('\n📦 Paso 1: Información del paquete');
  const parcelType = await ask('Tipo de paquete:', [
    'Documentos',
    'Ropa y accesorios',
    'Electrónicos pequeños',
    'Otros'
  ], 'Documentos');

  const description = await ask('Descripción del paquete:', null,
    parcelType === 'Documentos' ? 'Sobre con documentos importantes' :
    parcelType === 'Ropa y accesorios' ? 'Paquete con ropa' :
    'Paquete pequeño');

  const weight = await ask('Peso aproximado (kg):', null, '0.5');

  // Paso 2: Ubicaciones
  const pickupLocation = await ask('Dirección de recogida:', null, 'Oficina Central, Piso 5');
  const dropoffLocation = await ask('Dirección de entrega:', null, 'Casa del destinatario');

  // Paso 3: Información del destinatario
  const recipientName = await ask('Nombre del destinatario:', null, 'Juan Pérez');
  const recipientPhone = await ask('Teléfono del destinatario:', null, '+58412123456');

  logInfo(`Tipo: ${parcelType}`);
  logInfo(`Descripción: ${description}`);
  logInfo(`Peso: ${weight}kg`);
  logInfo(`📍 Recogida: ${pickupLocation}`);
  logInfo(`🏠 Entrega: ${dropoffLocation}`);
  logInfo(`👤 Destinatario: ${recipientName}`);

  // Paso 4: Crear envío
  logInfo('Creando envío de paquete...');

  const parcelData = {
    pickupAddress: pickupLocation,
    pickupLat: 10.506 + Math.random() * 0.01,
    pickupLng: -66.914 + Math.random() * 0.01,
    dropoffAddress: dropoffLocation,
    dropoffLat: 10.500 + Math.random() * 0.01,
    dropoffLng: -66.910 + Math.random() * 0.01,
    type: parcelType.toLowerCase(),
    description: description,
    weight: parseFloat(weight),
    recipientName: recipientName,
    recipientPhone: recipientPhone
  };

  const parcel = await api('/rides/flow/client/parcel/create', 'POST', parcelData);

  logSuccess('Envío de paquete creado exitosamente!');
  logSuccess('Buscando mensajero disponible...');

  // Simular proceso
  await sleep(2000, 'Buscando mensajeros disponibles');
  await showNotification('driver_assigned', 'Mensajero asignado!', {
    driverName: 'Pedro Ramírez',
    vehicle: 'Moto',
    eta: '8 minutos'
  });

  await sleep(1500, 'Mensajero en camino a recoger paquete');
  await showNotification('driver_arrived', 'Mensajero llegó a recoger el paquete', {
    location: pickupLocation
  });

  await sleep(1000, 'Recogiendo paquete');
  await showNotification('order_ready', 'Paquete recogido exitosamente!', {
    weight: `${weight}kg`,
    type: parcelType
  });

  await sleep(2000, 'Transportando paquete');
  await showNotification('ride_completed', 'Paquete entregado exitosamente!', {
    recipient: recipientName,
    signature: 'Firma digital registrada',
    photo: 'Foto de entrega tomada'
  });

  logSuccess('Envío de paquete completado exitosamente! 📦');
}

// Función para mostrar menú principal
async function showMainMenu() {
  console.clear();
  console.log('🚗 === UBER CLONE - TESTING SUITE ===');
  console.log('🧪 Herramienta interactiva para probar flujos del backend');
  console.log('');
  console.log('📊 Estado actual:');
  console.log(`👤 Usuario: ${TEST_STATE.user?.name || 'No registrado'}`);
  console.log(`🚕 Viaje actual: ${TEST_STATE.currentRide?.id || 'Ninguno'}`);
  console.log(`🍕 Orden actual: ${TEST_STATE.currentOrder?.id || 'Ninguna'}`);
  console.log('');

  console.log('🎯 Servicios disponibles:');
  console.log('1) 🚕 Transporte - Viajes de pasajeros');
  console.log('2) 🍕 Delivery - Pedidos de comida');
  console.log('3) 🛒 Mandados - Compras y encargos');
  console.log('4) 📦 Paquetes - Envío de encomiendas');
  console.log('5) 🔄 Repetir último flujo');
  console.log('6) 📊 Ver estado del sistema');
  console.log('7) 🚪 Salir');
  console.log('');
  console.log('💡 TIP: Usa "Transporte" para probar endpoints reales del backend');
  console.log('');

  return await ask('Selecciona una opción:', [
    'Transporte',
    'Delivery',
    'Mandados',
    'Paquetes',
    'Repetir último',
    'Ver estado',
    'Salir'
  ], 'Transporte');
}

// Función para mostrar estado del sistema
async function showSystemStatus() {
  console.log('\n📊 === ESTADO DEL SISTEMA ===');

  try {
    // Verificar conexión con API
    const healthCheck = await fetch(`${BASE}/health`).catch(() => null);
    const apiStatus = healthCheck?.ok ? '✅ Conectado' : '❌ Desconectado';
    console.log(`🌐 API Status: ${apiStatus}`);

    // Verificar base de datos
    const userCount = await prisma.user.count();
    const rideCount = await prisma.ride.count();
    const driverCount = await prisma.driver.count();

    console.log(`👥 Usuarios registrados: ${userCount}`);
    console.log(`🚕 Viajes totales: ${rideCount}`);
    console.log(`👨‍🚗 Conductores registrados: ${driverCount}`);

    // Verificar datos de prueba
    const tiers = await prisma.rideTier.count();
    const vehicleTypes = await prisma.vehicleType.count();
    const stores = await prisma.store.count();

    console.log(`🏷️  Tiers disponibles: ${tiers}`);
    console.log(`🚗 Tipos de vehículo: ${vehicleTypes}`);
    console.log(`🏪 Tiendas registradas: ${stores}`);

  } catch (error) {
    console.log('❌ Error al consultar estado del sistema');
    console.log('Detalle:', error.message);
  }

  console.log('');
  await ask('Presiona Enter para continuar...');
}

// Función para verificar que el backend esté funcionando
async function verifyBackendConnection() {
  try {
    logInfo('Verificando conexión con el backend...');

    // Intentar acceder a un endpoint básico
    const testResponse = await fetch(`${BASE}/api/auth/profile`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      }
    });

    // Si obtenemos 401 es porque el backend está funcionando (solo no autorizado)
    if (testResponse.status === 401) {
      logSuccess('✅ Backend conectado y funcionando');
      return true;
    }

    // Si obtenemos 404 podría ser que el endpoint no existe pero el servidor responde
    if (testResponse.status === 404) {
      logWarning('⚠️  Endpoint no encontrado, pero backend responde');
      logWarning('   Esto podría indicar que el endpoint cambió o no está implementado');
      return true;
    }

    // Cualquier otro código indica que el backend podría no estar funcionando
    logWarning(`⚠️  Respuesta inesperada del backend: ${testResponse.status}`);
    return false;

  } catch (error) {
    logError('❌ No se pudo conectar al backend');
    logError(`   Error: ${error.message}`);
    logError(`   URL intentada: ${BASE}`);
    logError('');
    logError('🔧 Soluciones posibles:');
    logError('   1. Asegúrate de que el backend esté ejecutándose: npm run start:dev');
    logError('   2. Verifica que la URL sea correcta: BASE_URL en .env');
    logError('   3. Revisa que no haya firewall bloqueando la conexión');
    return false;
  }
}

// Función principal mejorada
async function main() {
  console.log('🚀 Iniciando Uber Clone Testing Suite...\n');

  // Verificar conexión con backend antes de continuar
  const backendConnected = await verifyBackendConnection();
  if (!backendConnected) {
    logError('No se puede continuar sin conexión al backend');
    logInfo('Ejecuta: npm run start:dev');
    process.exit(1);
  }

  // Inicializar sistema
  await ensureAuthToken();

  let lastChoice = null;
  let running = true;

  while (running) {
    try {
      const choice = await showMainMenu();

      switch (choice.toLowerCase()) {
        case 'transporte':
        case '1':
          lastChoice = 'transport';
          await testTransportRealEndpoints(); // Usar función con endpoints reales
          break;

        case 'delivery':
        case '2':
          lastChoice = 'delivery';
          await testDelivery();
          break;

        case 'mandados':
        case '3':
          lastChoice = 'errand';
          await testErrand();
          break;

        case 'paquetes':
        case '4':
          lastChoice = 'parcel';
          await testParcel();
          break;

        case 'repetir último':
        case '5':
          if (lastChoice) {
            logInfo(`Repitiendo último flujo: ${lastChoice}`);
            switch (lastChoice) {
              case 'transport': await testTransportRealEndpoints(); break; // Usar función con endpoints reales
              case 'delivery': await testDelivery(); break;
              case 'errand': await testErrand(); break;
              case 'parcel': await testParcel(); break;
            }
          } else {
            logWarning('No hay un último flujo para repetir');
            await sleep(1000);
          }
          break;

        case 'ver estado':
        case '6':
          await showSystemStatus();
          break;

        case 'salir':
        case '7':
          running = false;
          break;

        default:
          logWarning('Opción no válida');
          await sleep(1000);
      }

      if (running) {
        console.log('\n' + '='.repeat(50));
        await ask('¿Listo para continuar? Presiona Enter...', null, '');
      }

    } catch (error) {
      logError(`Error durante la ejecución: ${error.message}`);
      console.log('\n🔧 Sugerencias para solucionar el error:');
      console.log('1. Verifica que el servidor backend esté ejecutándose');
      console.log('2. Revisa la configuración de la base de datos');
      console.log('3. Verifica las variables de entorno (BASE_URL)');
      console.log('4. Revisa los logs del servidor para más detalles');

      const retry = await ask('¿Quieres intentar de nuevo?', ['Sí', 'No'], 'No');
      if (retry.toLowerCase() !== 'sí' && retry !== '1') {
        running = false;
      }
    }
  }

  // Cleanup
  logInfo('Cerrando Testing Suite...');
  await prisma.$disconnect().catch(() => {});

  console.log('\n👋 ¡Gracias por usar Uber Clone Testing Suite!');
  console.log('🎯 Recuerda: Este es un entorno de pruebas para desarrollo.');
  console.log('🚀 ¡Happy coding!\n');
}

// Ejecutar programa principal
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });
}

// Crear archivo adicional para testing puro de endpoints
const fs = require('fs');
const path = require('path');

const endpointsTestPath = path.join(__dirname, 'test-endpoints-real.js');

// Crear archivo de testing puro de endpoints
const endpointsTestContent = `/*
  Pure Endpoint Testing for Uber Clone Backend
  - Tests all REST API endpoints systematically
  - Validates responses and error handling
  - Measures response times
  - Generates test reports
*/

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
let AUTH_TOKEN = process.env.TEST_JWT || '';

class EndpointTester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      total: 0,
      responseTimes: [],
      errors: []
    };
    this.testUser = null;
    this.testDriver = null;
    this.testRide = null;
    this.testOrder = null;
  }

  async makeRequest(endpoint, method = 'GET', body = null, description = '') {
    const startTime = Date.now();

    try {
      const url = \`\${BASE_URL}\${endpoint}\`;
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': AUTH_TOKEN ? \`Bearer \${AUTH_TOKEN}\` : undefined
        }
      };

      if (body) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(url, options);
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      this.results.responseTimes.push(responseTime);

      if (!response.ok) {
        throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
      }

      const data = await response.json().catch(() => ({}));

      console.log(\`✅ \${method} \${endpoint} - \${responseTime}ms\`);
      this.results.passed++;
      this.results.total++;

      return { success: true, data, responseTime };

    } catch (error) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      console.log(\`❌ \${method} \${endpoint} - \${responseTime}ms - \${error.message}\`);
      this.results.failed++;
      this.results.total++;
      this.results.errors.push({
        endpoint,
        method,
        error: error.message,
        responseTime,
        description
      });

      return { success: false, error: error.message, responseTime };
    }
  }

  async setupTestData() {
    console.log('\\n🔧 Setting up test data...');

    // Create test user
    const userResult = await this.makeRequest('/api/auth/register', 'POST', {
      name: 'Test User',
      email: \`test_user_\${Date.now()}@example.com\`,
      password: 'TestPass123!'
    }, 'Create test user');

    if (userResult.success) {
      AUTH_TOKEN = userResult.data.accessToken;
      this.testUser = userResult.data.user;
      console.log('👤 Test user created:', this.testUser?.name);
    }

    // Create test driver
    const driverResult = await this.makeRequest('/api/driver/register', 'POST', {
      firstName: 'Test',
      lastName: 'Driver',
      email: \`test_driver_\${Date.now()}@example.com\`,
      clerkId: \`driver_clerk_\${Date.now()}\`,
      carModel: 'Toyota Corolla',
      licensePlate: 'TEST-123',
      carSeats: 4
    }, 'Create test driver');

    if (driverResult.success) {
      this.testDriver = driverResult.data;
      console.log('👨‍🚗 Test driver created:', this.testDriver?.firstName);
    }
  }

  async testAuthEndpoints() {
    console.log('\\n🔐 === TESTING AUTH ENDPOINTS ===');

    // Test login
    await this.makeRequest('/api/auth/login', 'POST', {
      email: 'test@example.com',
      password: 'password123'
    }, 'User login');

    // Test profile
    await this.makeRequest('/api/auth/profile', 'GET', null, 'Get user profile');

    // Test refresh token
    await this.makeRequest('/api/auth/refresh', 'POST', {
      refreshToken: 'fake-refresh-token'
    }, 'Refresh access token');
  }

  async testRideEndpoints() {
    console.log('\\n🚕 === TESTING RIDE ENDPOINTS ===');

    // Create ride
    const rideResult = await this.makeRequest('/api/ride/create', 'POST', {
      origin_address: 'Centro de Caracas',
      destination_address: 'Plaza Venezuela',
      origin_latitude: 10.506,
      origin_longitude: -66.914,
      destination_latitude: 10.500,
      destination_longitude: -66.910,
      ride_time: 25,
      fare_price: 15.99,
      payment_status: 'pending',
      user_id: this.testUser?.id || 1,
      tier_id: 1,
      vehicle_type_id: 1
    }, 'Create ride');

    if (rideResult.success) {
      this.testRide = rideResult.data;
      const rideId = this.testRide.rideId;

      // Get ride details
      await this.makeRequest(\`/api/ride/\${rideId}\`, 'GET', null, 'Get ride details');

      // Get vehicle types
      await this.makeRequest('/api/ride/vehicle-types', 'GET', null, 'Get vehicle types');

      // Get ride requests
      await this.makeRequest('/api/ride/requests?driverLat=10.5&driverLng=-66.9&radius=5', 'GET', null, 'Get ride requests');

      // Accept ride
      await this.makeRequest(\`/api/ride/\${rideId}/accept\`, 'POST', {
        driver_id: this.testDriver?.id || 1
      }, 'Accept ride');

      // Start ride
      await this.makeRequest(\`/api/ride/\${rideId}/start\`, 'POST', {
        driverId: this.testDriver?.id || 1
      }, 'Start ride');

      // Complete ride
      await this.makeRequest(\`/api/ride/\${rideId}/complete\`, 'POST', {
        driverId: this.testDriver?.id || 1,
        finalDistance: 12.5,
        finalTime: 25
      }, 'Complete ride');

      // Rate ride
      await this.makeRequest(\`/api/ride/\${rideId}/rate\`, 'POST', {
        ratedByUserId: this.testUser?.id || 1,
        ratedUserId: this.testDriver?.id || 1,
        ratingValue: 5,
        comment: 'Excelente servicio!'
      }, 'Rate ride');
    }
  }

  async testDriverEndpoints() {
    console.log('\\n👨‍🚗 === TESTING DRIVER ENDPOINTS ===');

    // Get all drivers
    await this.makeRequest('/api/driver', 'GET', null, 'Get all drivers');

    // Get driver details
    if (this.testDriver) {
      await this.makeRequest(\`/api/driver/\${this.testDriver.id}\`, 'GET', null, 'Get driver details');

      // Update driver status
      await this.makeRequest(\`/api/driver/\${this.testDriver.id}/status\`, 'PUT', {
        status: 'online'
      }, 'Update driver status');

      // Get driver rides
      await this.makeRequest(\`/api/driver/\${this.testDriver.id}/rides\`, 'GET', null, 'Get driver rides');
    }
  }

  async testStoreEndpoints() {
    console.log('\\n🏪 === TESTING STORE ENDPOINTS ===');

    // Get nearby stores
    await this.makeRequest('/stores?lat=10.5&lng=-66.9&radius=5', 'GET', null, 'Get nearby stores');

    // Get store details
    await this.makeRequest('/stores/1', 'GET', null, 'Get store details');
  }

  async testOrderEndpoints() {
    console.log('\\n🍕 === TESTING ORDER ENDPOINTS ===');

    // Create order
    const orderResult = await this.makeRequest('/orders', 'POST', {
      storeId: 1,
      items: [
        { productId: 1, quantity: 2, specialInstructions: 'Extra cheese' }
      ],
      deliveryAddress: 'Test Address 123',
      deliveryLatitude: 10.506,
      deliveryLongitude: -66.914
    }, 'Create order');

    if (orderResult.success) {
      this.testOrder = orderResult.data;
      const orderId = this.testOrder.orderId || this.testOrder.id;

      // Get order details
      await this.makeRequest(\`/orders/\${orderId}\`, 'GET', null, 'Get order details');

      // Get user orders
      await this.makeRequest('/orders', 'GET', null, 'Get user orders');

      // Get available orders for drivers
      await this.makeRequest('/orders/driver/available', 'GET', null, 'Get available orders');

      // Accept order
      await this.makeRequest(\`/orders/\${orderId}/accept\`, 'POST', {}, 'Accept order');

      // Mark as picked up
      await this.makeRequest(\`/orders/\${orderId}/pickup\`, 'POST', {}, 'Mark order as picked up');

      // Mark as delivered
      await this.makeRequest(\`/orders/\${orderId}/deliver\`, 'POST', {}, 'Mark order as delivered');
    }
  }

  async testFlowEndpoints() {
    console.log('\\n🔄 === TESTING FLOW ENDPOINTS ===');

    // Transport flow
    await this.makeRequest('/rides/flow/client/transport/define-ride', 'POST', {
      originAddress: 'Centro',
      originLat: 10.5,
      originLng: -66.91,
      destinationAddress: 'Plaza',
      destinationLat: 10.49,
      destinationLng: -66.9,
      minutes: 20,
      tierId: 1,
      vehicleTypeId: 1
    }, 'Define transport ride');

    // Delivery flow
    await this.makeRequest('/rides/flow/client/delivery/create-order', 'POST', {
      storeId: 1,
      items: [{ productId: 1, quantity: 1 }],
      deliveryAddress: 'Test Address',
      deliveryLatitude: 10.5,
      deliveryLongitude: -66.9
    }, 'Create delivery order');
  }

  generateReport() {
    console.log('\\n📊 === TEST REPORT ===');
    console.log(\`Total Tests: \${this.results.total}\`);
    console.log(\`Passed: \${this.results.passed}\`);
    console.log(\`Failed: \${this.results.failed}\`);
    console.log(\`Success Rate: \${((this.results.passed / this.results.total) * 100).toFixed(1)}%\`);

    if (this.results.responseTimes.length > 0) {
      const avgResponseTime = this.results.responseTimes.reduce((a, b) => a + b, 0) / this.results.responseTimes.length;
      const minTime = Math.min(...this.results.responseTimes);
      const maxTime = Math.max(...this.results.responseTimes);

      console.log(\`\\nResponse Times:\`);
      console.log(\`Average: \${avgResponseTime.toFixed(0)}ms\`);
      console.log(\`Min: \${minTime}ms\`);
      console.log(\`Max: \${maxTime}ms\`);
    }

    if (this.results.errors.length > 0) {
      console.log(\`\\n❌ Errors (\${this.results.errors.length}):\`);
      this.results.errors.forEach((error, i) => {
        console.log(\`\${i + 1}. \${error.method} \${error.endpoint} - \${error.error}\`);
      });
    }

    return this.results;
  }

  async runAllTests() {
    console.log('🚀 Starting Uber Clone Backend Endpoint Tests');
    console.log('=' .repeat(50));

    try {
      await this.setupTestData();
      await this.testAuthEndpoints();
      await this.testDriverEndpoints();
      await this.testStoreEndpoints();
      await this.testRideEndpoints();
      await this.testOrderEndpoints();
      await this.testFlowEndpoints();

    } catch (error) {
      console.error('Test execution failed:', error);
    } finally {
      await prisma.\$disconnect();
    }

    return this.generateReport();
  }
}

// Export for use
module.exports = EndpointTester;

// Run if called directly
if (require.main === module) {
  const tester = new EndpointTester();
  tester.runAllTests().then(() => {
    console.log('\\n🏁 Tests completed!');
    process.exit(0);
  }).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
`;

fs.writeFileSync(endpointsTestPath, endpointsTestContent);
logSuccess('Archivo test-endpoints-real.js creado exitosamente!');
logInfo('Este archivo contiene testing puro de endpoints sin interfaz interactiva.');
logInfo('Ejecútalo con: node test-endpoints-real.js');

// Exportar funciones para uso programático
module.exports = {
  testTransportRealEndpoints,
  testDeliveryRealEndpoints,
  testErrand,
  testParcel,
  generateNearbyDrivers,
  simulateDriverFlow,
  showNotification,
  ask,
  sleep,
  logSuccess,
  logError,
  logInfo,
  logWarning,
  EndpointTester: require('./test-endpoints-real')
};


