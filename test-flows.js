/*
  Interactive CLI to test backend flows with self-healing preconditions.
  - Uses Prisma to ensure required data exists (tiers, vehicle types, stores, products).
  - If JWT is missing/invalid, registers a test user automatically and continues.
*/
const readline = require('readline');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BASE = process.env.BASE_URL || 'http://localhost:3000';
let TOKEN = process.env.TEST_JWT || '';

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (ans) => { rl.close(); resolve(ans); }));
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

async function ensureAuthToken() {
  // If a token exists and works, keep it; otherwise, register a new user and use its token
  if (TOKEN) {
    try {
      await api('/api/auth/profile');
      return;
    } catch (_) {
      // fallthrough to register
    }
  }
  const rnd = Math.random().toString(36).slice(2);
  const registerRes = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `tester_${rnd}@example.com`,
      password: 'Password123!@#',
      name: `Tester ${rnd}`,
    }),
  });
  const regJson = await registerRes.json().catch(() => ({}));
  if (!registerRes.ok) {
    throw new Error(`Auto-register failed: ${registerRes.status} ${JSON.stringify(regJson)}`);
  }
  TOKEN = regJson.accessToken ? `Bearer ${regJson.accessToken}` : '';
  if (!TOKEN) throw new Error('Register did not return accessToken');
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
    console.log('Created RideTier id=1');
  }
}

async function ensureVehicleType(id = 1) {
  const vt = await prisma.vehicleType.findUnique({ where: { id } });
  if (!vt) {
    await prisma.vehicleType.create({
      data: { id, name: 'car', displayName: 'Carro', isActive: true },
    });
    console.log('Created VehicleType id=1');
  }
}

async function ensureStoreAndProduct(storeId = 1, productId = 1) {
  let store = await prisma.store.findUnique({ where: { id: storeId } });
  if (!store) {
    store = await prisma.store.create({
      data: {
        id: storeId,
        name: 'Test Store',
        address: 'Some address',
        latitude: 10.5,
        longitude: -66.9,
        isOpen: true,
      },
    });
    console.log('Created Store id=1');
  }
  let product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    await prisma.product.create({
      data: {
        id: productId,
        storeId: storeId,
        name: 'Test Product',
        price: 9.99,
        isAvailable: true,
      },
    });
    console.log('Created Product id=1 for Store id=1');
  }
}

async function testTransport() {
  console.log('--- Transport Flow ---');
  await ensureRideTier(1);
  await ensureVehicleType(1);
  const define = await api('/rides/flow/client/transport/define-ride', 'POST', {
    originAddress: 'Origen 123', originLat: 10.5, originLng: -66.91,
    destinationAddress: 'Destino 456', destinationLat: 10.49, destinationLng: -66.9,
    minutes: 20, tierId: 1,
  });
  const rideId = define.data.rideId;
  console.log('Ride created:', rideId);

  await api(`/rides/flow/client/transport/${rideId}/request-driver`, 'POST');
  console.log('Requested driver matching');

  const method = await ask('Payment method (cash/card)? ');
  const pay = await api(`/rides/flow/client/transport/${rideId}/confirm-payment`, 'POST', { method: method === 'card' ? 'card' : 'cash' });
  console.log('Payment response:', pay.data);

  const status = await api(`/rides/flow/client/transport/${rideId}/status`);
  console.log('Status:', status.data?.driverId || status.data?.driver);
}

async function testDelivery() {
  console.log('--- Delivery Flow ---');
  await ensureStoreAndProduct(1, 1);
  const order = await api('/rides/flow/client/delivery/create-order', 'POST', {
    storeId: 1,
    items: [{ productId: 1, quantity: 1 }],
    deliveryAddress: 'Mi casa', deliveryLatitude: 10.5, deliveryLongitude: -66.9,
  });
  const orderId = order.data.orderId;
  console.log('Order created:', orderId);

  const method = await ask('Payment method (cash/card/wallet)? ');
  const pay = await api(`/rides/flow/client/delivery/${orderId}/confirm-payment`, 'POST', { method: method || 'cash' });
  console.log('Payment response:', pay.data);

  const status = await api(`/rides/flow/client/delivery/${orderId}/status`);
  console.log('Status:', status.data?.status);
}

async function testErrand() {
  console.log('--- Errand Flow ---');
  const e = await api('/rides/flow/client/errand/create', 'POST', {
    description: 'Comprar medicina',
    pickupAddress: 'Farmacia', pickupLat: 10.5, pickupLng: -66.91,
    dropoffAddress: 'Casa', dropoffLat: 10.49, dropoffLng: -66.9,
  });
  console.log('Errand:', e.data);
}

async function testParcel() {
  console.log('--- Parcel Flow ---');
  const p = await api('/rides/flow/client/parcel/create', 'POST', {
    pickupAddress: 'Oficina', pickupLat: 10.5, pickupLng: -66.91,
    dropoffAddress: 'Cliente', dropoffLat: 10.49, dropoffLng: -66.9,
    type: 'documents', description: 'Sobre',
  });
  console.log('Parcel:', p.data);
}

async function main() {
  await ensureAuthToken();
  console.log('Select flow to test:');
  console.log('1) Transport');
  console.log('2) Delivery');
  console.log('3) Errand');
  console.log('4) Parcel');
  const choice = await ask('Enter number: ');
  try {
    if (choice === '1') await testTransport();
    else if (choice === '2') await testDelivery();
    else if (choice === '3') await testErrand();
    else if (choice === '4') await testParcel();
    else console.log('Invalid choice');
  } catch (e) {
    console.error('Test failed:', e.message);
  }
  await prisma.$disconnect().catch(() => {});
}

main();


