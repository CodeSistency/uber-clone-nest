# 🌱 Database Seeding Guide

Esta guía explica cómo usar los comandos de seeding para poblar tu base de datos con datos de ejemplo realistas.

## 📋 Comandos Disponibles

### Comandos Disponibles

```bash
# 🚀 SETUP COMPLETO (Recomendado para primera vez)
npm run db:setup

# 🌱 Solo ejecutar semilla (agrega datos a la DB existente)
npm run db:seed

# 🔄 Desarrollo rápido (genera cliente + seed)
npm run db:dev

# 💥 Resetear la base de datos completamente
npm run db:reset

# 🔄 Reset completo + seed (borra todo y vuelve a crear)
npm run db:seed:fresh
```

## 📊 Datos Incluidos en la Semilla

### 👥 Usuarios (5)
- **John Doe** - Usuario regular con wallet y rides
- **Jane Smith** - Usuario con deliveries y ratings
- **Mike Johnson** - Usuario con ride programado
- **Sarah Wilson** - Usuario básico
- **David Brown** - Usuario básico

### 🚗 Conductores (3)
- **Carlos Rodriguez** - Conductor online, hace deliveries
- **Maria Garcia** - Conductora online, solo rides
- **Luis Martinez** - Conductor offline, hace deliveries

### 📄 Documentos de Conductores (3)
- Licencias y seguros verificados para los conductores activos

### ⭐ Niveles de Ride (3)
- **Economy**: Base $2.50, $0.15/min, $1.25/mile
- **Comfort**: Base $4.00, $0.25/min, $2.00/mile
- **Premium**: Base $6.00, $0.35/min, $3.00/mile

### 🚕 Rides (3)
- Ride completado con Carlos
- Ride completado con Maria
- Ride programado pendiente

### 🏪 Tiendas (3)
- **Pizza Palace** - Restaurante italiano
- **Burger Heaven** - Comida americana
- **Green Grocery** - Tienda saludable

### 🍕 Productos (6)
- Pizzas en Pizza Palace
- Hamburguesas y papas en Burger Heaven
- Frutas y verduras en Green Grocery

### 📦 Órdenes de Delivery (2)
- Orden completada de pizza
- Orden en tránsito de hamburguesa

### 🛒 Items de Órdenes (4)
- Items específicos para cada orden de delivery

### 🎁 Promociones (3)
- **WELCOME10**: 10% descuento
- **RIDE20**: $5 descuento en rides
- **FOOD15**: 15% descuento en comida

### 💰 Wallets (3)
- Saldos realistas para usuarios activos

### 💸 Transacciones de Wallet (4)
- Depósitos, pagos de rides y bonuses

### ⭐ Ratings (5)
- Ratings para rides, stores y deliveries

### 🚨 Contactos de Emergencia (3)
- Contactos familiares para usuarios

### 💬 Mensajes de Chat (5)
- Conversaciones en rides y deliveries

## 🚀 Uso Recomendado

### Para Desarrollo Inicial
```bash
# Primera vez que configuras la base de datos
npm run db:seed:fresh
```

### Para Agregar Datos de Prueba
```bash
# Si ya tienes datos y quieres agregar más
npm run db:seed
```

### Para Limpiar y Reiniciar
```bash
# Cuando necesitas empezar desde cero
npm run db:reset
```

## 📈 Estadísticas de la Semilla

Después de ejecutar la semilla, tendrás:
- **5 usuarios** con perfiles completos
- **3 conductores** verificados y listos para trabajar
- **3 tiendas** con productos variados
- **3 rides** en diferentes estados
- **2 órdenes de delivery** activas
- **$425.75** en wallets de usuarios
- **11 ratings** de calidad
- **8 mensajes** de chat realistas

## 🧪 Testing con Datos Reales

Los datos de la semilla están diseñados para testing completo:

### API Endpoints Listos para Probar
- `GET /api/user` - Lista todos los usuarios
- `GET /api/driver` - Lista conductores disponibles
- `GET /api/ride` - Historial de rides
- `GET /api/user/wallet` - Saldos de wallet
- `GET /api/promo/active` - Promociones activas

### Real-Time Features
- **WebSocket**: Conecta con `/uber-realtime`
- **Driver Tracking**: IDs de drivers: 1, 2, 3
- **Ride Tracking**: Ride IDs: 1, 2, 3
- **Emergency**: Funciona con user IDs existentes

### Usuarios de Prueba
```
John Doe: user_2abc123def456ghi789jkl012
Jane Smith: user_2bcd234efg567hij890klm123
Mike Johnson: user_2cde345fgh678ijk901lmn234
```

## ⚠️ Notas Importantes

1. **Environment Variables**: Asegúrate de tener `DATABASE_URL` configurado
2. **Prisma Generate**: Ejecuta `npx prisma generate` antes del seed
3. **Database Connection**: La DB debe estar corriendo y accesible
4. **Data Conflicts**: Si usas `db:seed` en una DB con datos existentes, puede haber conflictos de IDs únicos

## 🔄 Flujo de Trabajo Recomendado

```bash
# 1. Asegurarse de que la DB esté corriendo
# 2. Ejecutar migraciones si es necesario
npx prisma migrate dev

# 3. Generar cliente de Prisma
npx prisma generate

# 4. Ejecutar semilla
npm run db:seed:fresh

# 5. Iniciar aplicación
npm run start:dev
```

## 🎯 Próximos Pasos

Después del seeding, puedes:

1. **Probar APIs** con los datos existentes
2. **Crear nuevos usuarios** a través de la app
3. **Simular rides** usando los conductores existentes
4. **Testing de real-time** con WebSocket
5. **Probar payments** con los wallets poblados

¡Tu base de datos está lista para desarrollo y testing! 🚀
