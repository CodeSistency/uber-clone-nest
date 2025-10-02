// Script de prueba para WebSocket del Uber Clone
const io = require('socket.io-client');

console.log('🔍 Probando conexión WebSocket...');
console.log('📡 URL: http://72.60.119.19:3001/uber-realtime');

// Intentar conectar
const socket = io('http://72.60.119.19:3001/uber-realtime', {
  transports: ['websocket', 'polling'],
  timeout: 5000,
  forceNew: true
});

// Eventos de conexión
socket.on('connect', () => {
  console.log('✅ ¡Conexión exitosa!');
  console.log('🆔 Socket ID:', socket.id);

  // Probar algunos eventos
  console.log('\n📤 Enviando eventos de prueba...');

  // Unirse a un viaje de prueba
  socket.emit('ride:join', {
    rideId: 999,
    userId: 'test_user_websocket'
  });

  // Actualizar ubicación
  socket.emit('driver:location:update', {
    driverId: 999,
    location: { lat: 40.7128, lng: -74.0060 },
    rideId: 999
  });

  // Estado del conductor
  socket.emit('driver:status:update', {
    driverId: 999,
    status: 'online'
  });

  // Mensaje de chat
  socket.emit('chat:message', {
    rideId: 999,
    senderId: 'test_user_websocket',
    message: 'Prueba de conexión WebSocket'
  });

  console.log('✅ Eventos enviados correctamente');
});

socket.on('connect_error', (error) => {
  console.log('❌ Error de conexión:', error.message);
  console.log('🔍 Detalles del error:', error);

  if (error.message.includes('timeout')) {
    console.log('💡 Posible causa: El servidor no responde (timeout)');
  } else if (error.message.includes('ECONNREFUSED')) {
    console.log('💡 Posible causa: Puerto cerrado o servidor no corriendo');
  } else if (error.message.includes('CORS')) {
    console.log('💡 Posible causa: Problema de CORS');
  }
});

socket.on('disconnect', (reason) => {
  console.log('🔌 Desconectado:', reason);
});

// Escuchar eventos entrantes
socket.on('driver:location:updated', (data) => {
  console.log('📍 Ubicación del conductor actualizada:', data);
});

socket.on('driver:status:changed', (data) => {
  console.log('📊 Estado del conductor cambiado:', data);
});

socket.on('chat:new-message', (data) => {
  console.log('💬 Nuevo mensaje:', data);
});

socket.on('ride:accepted', (data) => {
  console.log('✅ Viaje aceptado:', data);
});

// Timeout de 10 segundos
setTimeout(() => {
  console.log('\n⏰ Timeout de prueba alcanzado');
  socket.disconnect();
  process.exit(0);
}, 10000);

console.log('⏳ Intentando conectar... (timeout: 5s)');


