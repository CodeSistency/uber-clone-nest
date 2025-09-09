/*
  Interactive CLI to test backend flows with self-healing preconditions.
  - Uses Prisma to ensure required data exists (tiers, vehicle types, stores, products).
  - If JWT is missing/invalid, registers a test user automatically and continues.
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

async function api(path, method = 'GET', body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': body && (process.env.IDEMP_KEY || `${Date.now()}-${Math.random().toString(36).slice(2)}`),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error(`HTTP ${res.status}`, json);
    throw new Error(`Request failed: ${res.status}`);
  }
  return json;
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
    } catch (_) {
      logWarning('Token existente inválido, registrando nuevo usuario');
    }
  }

  const rnd = Math.random().toString(36).slice(2);
  const userName = `Tester ${rnd}`;

  logInfo(`Registrando usuario de prueba: ${userName}`);

  const registerRes = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `tester_${rnd}@example.com`,
      password: 'Password123!@#',
      name: userName,
    }),
  });
  const regJson = await registerRes.json().catch(() => ({}));
  if (!registerRes.ok) {
    throw new Error(`Auto-register failed: ${registerRes.status} ${JSON.stringify(regJson)}`);
  }

  TOKEN = regJson.accessToken ? `Bearer ${regJson.accessToken}` : '';
  if (!TOKEN) throw new Error('Register did not return accessToken');

  logSuccess(`Usuario registrado exitosamente: ${userName}`);
  TEST_STATE.user = { name: userName, email: `tester_${rnd}@example.com` };
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
async function testTransport() {
  console.log('\n🚕 === FLUJO DE TRANSPORTE INTERACTIVO ===');

  // Preparar datos necesarios
  await ensureRideTier(1);
  await ensureVehicleType(1);

  logInfo('Bienvenido al sistema de transporte Uber Clone');

  // Paso 1: Definir viaje
  console.log('\n📝 Paso 1: Define tu viaje');
  const origin = await ask('¿Dónde estás?', null, 'Centro de Caracas');
  const destination = await ask('¿A dónde vas?', null, 'Plaza Venezuela');

  // Generar coordenadas realistas
  const rideData = {
    originAddress: origin,
    originLat: 10.506 + Math.random() * 0.01,
    originLng: -66.914 + Math.random() * 0.01,
    destinationAddress: destination,
    destinationLat: 10.500 + Math.random() * 0.01,
    destinationLng: -66.910 + Math.random() * 0.01,
    minutes: Math.floor(Math.random() * 30) + 10,
    tierId: 1,
    vehicleTypeId: 1
  };

  logInfo(`📍 Origen: ${origin}`);
  logInfo(`🎯 Destino: ${destination}`);
  logInfo(`⏱️  Tiempo estimado: ${rideData.minutes} minutos`);

  // Paso 2: Buscar conductores
  console.log('\n🔍 Paso 2: Buscando conductores disponibles...');
  await sleep(2000, 'Buscando conductores cercanos');

  const drivers = await generateNearbyDrivers(rideData.originLat, rideData.originLng);
  console.log(`\n✅ ${drivers.length} conductor(es) encontrado(s):`);

  drivers.forEach((driver, i) => {
    console.log(`${i + 1}. ${driver.name}`);
    console.log(`   🚗 ${driver.vehicle}`);
    console.log(`   ⭐ ${driver.rating} estrellas`);
    console.log(`   📍 ${driver.distance}km - ${driver.eta}min`);
    console.log(`   💰 $${driver.price}`);
    console.log('');
  });

  // Paso 3: Seleccionar tipo de vehículo
  const vehicleChoice = await ask('Selecciona tipo de vehículo:', [
    'UberX (Económico - $2.50 base)',
    'UberXL (Grande - $3.50 base)',
    'Uber Black (Premium - $5.00 base)'
  ], 'UberX');

  // Paso 4: Crear viaje
  logInfo('Creando solicitud de viaje...');
  const define = await api('/rides/flow/client/transport/define-ride', 'POST', rideData);
  const rideId = define.data.rideId;

  logSuccess(`Viaje creado exitosamente! ID: ${rideId}`);
  TEST_STATE.currentRide = { id: rideId, ...rideData };

  // Paso 5: Solicitar conductor
  await sleep(1000, 'Conectando con conductores disponibles');
  await api(`/rides/flow/client/transport/${rideId}/request-driver`, 'POST');

  await showNotification('ride_accepted', '¡Conductor encontrado! Un conductor ha aceptado tu viaje.', {
    driverName: drivers[0].name,
    vehicle: drivers[0].vehicle,
    eta: drivers[0].eta
  });

  // Simular flujo completo del conductor
  const rideCompleted = await simulateDriverFlow(rideId, rideData);

  if (rideCompleted) {
    // Paso 6: Confirmar pago
    const paymentMethod = await ask('Selecciona método de pago:', [
      'Efectivo',
      'Tarjeta de Crédito',
      'Wallet'
    ], 'Tarjeta de Crédito');

    logInfo(`Procesando pago con ${paymentMethod}...`);
    await sleep(1500, 'Procesando pago');

    const pay = await api(`/rides/flow/client/transport/${rideId}/confirm-payment`, 'POST', {
      method: paymentMethod.toLowerCase().includes('tarjeta') ? 'card' :
             paymentMethod.toLowerCase().includes('efectivo') ? 'cash' : 'wallet'
    });

    await showNotification('payment_success', 'Pago procesado exitosamente!', {
      amount: `$${drivers[0].price}`,
      method: paymentMethod
    });

    // Paso 7: Calificar viaje
    const rating = await ask('Califica tu viaje (1-5 estrellas):', null, '5');
    const comment = await ask('Comentario (opcional):', null, 'Excelente servicio!');

    logSuccess('¡Gracias por calificar tu viaje!');
    logSuccess('Viaje completado exitosamente 🎉');
  }
}

// Flujo de Delivery Interactivo Mejorado
async function testDelivery() {
  console.log('\n🍕 === FLUJO DE DELIVERY INTERACTIVO ===');

  await ensureStoreAndProduct(1, 1);

  logInfo('Bienvenido al servicio de delivery');

  // Paso 1: Seleccionar restaurante
  console.log('\n🏪 Paso 1: Seleccionando restaurante...');
  await sleep(1000, 'Buscando restaurantes cercanos');

  const restaurants = [
    { id: 1, name: 'Pizza Palace', cuisine: 'Italiana', rating: 4.5, distance: '1.2km' },
    { id: 2, name: 'Burger King', cuisine: 'Americana', rating: 4.2, distance: '2.1km' },
    { id: 3, name: 'Sushi Roll', cuisine: 'Japonesa', rating: 4.7, distance: '3.5km' }
  ];

  console.log('\nRestaurantes disponibles:');
  restaurants.forEach((rest, i) => {
    console.log(`${i + 1}. ${rest.name} (${rest.cuisine})`);
    console.log(`   ⭐ ${rest.rating} - 📍 ${rest.distance}`);
  });

  const restaurantChoice = await ask('Selecciona restaurante:', [
    'Pizza Palace',
    'Burger King',
    'Sushi Roll'
  ], 'Pizza Palace');

  // Paso 2: Seleccionar productos
  console.log('\n🍽️  Paso 2: Seleccionando productos...');
  const products = [
    { id: 1, name: 'Pizza Margherita Grande', price: 15.99, desc: 'Queso mozzarella y albahaca' },
    { id: 2, name: 'Pizza Pepperoni', price: 17.99, desc: 'Pepperoni y queso' },
    { id: 3, name: 'Coca Cola 2L', price: 3.99, desc: 'Refresco' }
  ];

  console.log('\nProductos disponibles:');
  products.forEach((prod, i) => {
    console.log(`${i + 1}. ${prod.name} - $${prod.price}`);
    console.log(`   ${prod.desc}`);
  });

  const productChoice = await ask('Selecciona producto:', [
    'Pizza Margherita Grande',
    'Pizza Pepperoni',
    'Coca Cola 2L'
  ], 'Pizza Margherita Grande');

  const selectedProduct = products.find(p => p.name === productChoice);
  const quantity = await ask('Cantidad:', null, '1');

  // Paso 3: Dirección de entrega
  const deliveryAddress = await ask('Dirección de entrega:', null, 'Mi casa, Calle 123');

  // Paso 4: Crear orden
  logInfo('Creando orden de delivery...');

  const orderData = {
    storeId: 1,
    items: [{ productId: selectedProduct.id, quantity: parseInt(quantity) }],
    deliveryAddress: deliveryAddress,
    deliveryLatitude: 10.506 + Math.random() * 0.01,
    deliveryLongitude: -66.914 + Math.random() * 0.01,
  };

  const order = await api('/rides/flow/client/delivery/create-order', 'POST', orderData);
  const orderId = order.data.orderId;

  logSuccess(`Orden creada exitosamente! ID: ${orderId}`);

  const total = selectedProduct.price * parseInt(quantity) + 2.99; // + delivery fee
  logInfo(`Total a pagar: $${total.toFixed(2)} (producto: $${selectedProduct.price * parseInt(quantity)}, delivery: $2.99)`);

  // Paso 5: Preparación en restaurante
  await sleep(2000, 'Esperando confirmación del restaurante');
  await showNotification('order_ready', 'Tu orden está siendo preparada!', {
    restaurant: restaurantChoice,
    estimatedTime: '25-30 minutos'
  });

  // Paso 6: Asignar repartidor
  await sleep(1500, 'Buscando repartidor disponible');
  await showNotification('driver_assigned', 'Repartidor asignado! Está en camino.', {
    driverName: 'Carlos García',
    vehicle: 'Moto Yamaha',
    eta: '15 minutos'
  });

  // Paso 7: Seguimiento
  await sleep(3000, 'Repartidor en camino');
  await showNotification('driver_arrived', 'Tu orden ha llegado!', {
    driverName: 'Carlos García',
    total: `$${total.toFixed(2)}`
  });

  // Paso 8: Pago
  const paymentMethod = await ask('Método de pago:', [
    'Efectivo',
    'Tarjeta de Crédito',
    'Wallet'
  ], 'Tarjeta de Crédito');

  logInfo(`Procesando pago de $${total.toFixed(2)} con ${paymentMethod}...`);
  await sleep(1000, 'Procesando pago');

  const pay = await api(`/rides/flow/client/delivery/${orderId}/confirm-payment`, 'POST', {
    method: paymentMethod.toLowerCase().includes('tarjeta') ? 'card' :
           paymentMethod.toLowerCase().includes('efectivo') ? 'cash' : 'wallet'
  });

  await showNotification('ride_completed', '¡Entrega completada! Gracias por tu pedido.', {
    total: `$${total.toFixed(2)}`,
    driverRating: '⭐⭐⭐⭐⭐'
  });

  logSuccess('Delivery completado exitosamente! 🍕');
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

// Función principal mejorada
async function main() {
  console.log('🚀 Iniciando Uber Clone Testing Suite...\n');

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
          await testTransport();
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
              case 'transport': await testTransport(); break;
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

// Exportar funciones para uso programático
module.exports = {
  testTransport,
  testDelivery,
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
  logWarning
};


