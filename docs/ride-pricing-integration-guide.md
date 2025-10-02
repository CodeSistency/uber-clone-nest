# 🚗 Guía de Integración de Precios de Viajes

## 📋 Resumen

Esta guía documenta cómo integrar el cálculo de precios de viajes en aplicaciones cliente, incluyendo la integración con Google Maps para obtener distancias y tiempos reales.

## 🎯 Endpoints para Cálculo de Precios

### 1. Obtener Tiers Disponibles

**Endpoint:** `GET /api/rides/flow/client/transport/tiers`

**Descripción:** Obtiene todos los niveles de servicio (tiers) organizados por tipo de vehículo.

**Respuesta:**
```json
{
  "data": {
    "car": [
      {
        "id": 1,
        "name": "Economy",
        "baseFare": 2.5,
        "perMinuteRate": 0.25,
        "perMileRate": 1.25,
        "vehicleTypeId": 1,
        "vehicleTypeName": "Carro"
      }
    ],
    "motorcycle": [
      {
        "id": 1,
        "name": "Economy",
        "baseFare": 1.5,
        "perMinuteRate": 0.15,
        "perMileRate": 0.8,
        "vehicleTypeId": 2,
        "vehicleTypeName": "Moto"
      }
    ]
  }
}
```

### 2. Calcular Precio Estimado

**Endpoint:** `GET /api/rides/estimate`

**Parámetros de Query:**
- `tierId` (number): ID del nivel de servicio
- `minutes` (number): Tiempo estimado en minutos
- `miles` (number): Distancia en millas

**Ejemplo:**
```
GET /api/rides/estimate?tierId=1&minutes=25&miles=15
```

**Respuesta:**
```json
{
  "data": {
    "tier": "Economy",
    "baseFare": 2.5,
    "perMinuteRate": 0.25,
    "perMileRate": 1.25,
    "estimatedMinutes": 25,
    "estimatedMiles": 15,
    "totalFare": 22.5
  }
}
```

### 3. Crear Viaje

**Endpoint:** `POST /api/rides/flow/client/transport/define-ride`

**Headers:**
```
Authorization: Bearer {jwt-token}
Content-Type: application/json
```

**Body:**
```json
{
  "originAddress": "Calle 123 #45-67, Bogotá, Colombia",
  "originLat": 4.6097,
  "originLng": -74.0817,
  "destinationAddress": "Carrera 7 #23-45, Medellín, Colombia",
  "destinationLat": 6.2518,
  "destinationLng": -75.5636,
  "minutes": 25,
  "tierId": 1,
  "vehicleTypeId": 1
}
```

**Respuesta:**
```json
{
  "data": {
    "rideId": 123,
    "originAddress": "Calle 123 #45-67, Bogotá, Colombia",
    "destinationAddress": "Carrera 7 #23-45, Medellín, Colombia",
    "status": "pending",
    "farePrice": 0,
    "userId": 456
  }
}
```

### 4. Confirmar Pago (Calcula precio final)

**Endpoint:** `POST /api/rides/flow/client/transport/{rideId}/confirm-payment`

**Body:**
```json
{
  "method": "transfer",
  "bankCode": "0102"
}
```

## 🗺️ Integración con Google Maps

### Configuración Inicial

1. **Obtener API Key:**
   - Ve a [Google Cloud Console](https://console.cloud.google.com/)
   - Habilita "Distance Matrix API"
   - Crea una API Key con restricciones de dominio

2. **Configurar en tu aplicación:**
```javascript
const GOOGLE_MAPS_API_KEY = 'your-api-key-here';
```

### Distance Matrix API

**Endpoint:** `https://maps.googleapis.com/maps/api/distancematrix/json`

**Parámetros requeridos:**
- `origins`: Coordenadas de origen (lat,lng)
- `destinations`: Coordenadas de destino (lat,lng)
- `key`: Tu API Key
- `units`: `imperial` (para obtener millas)

**Ejemplo de llamada:**
```javascript
const originLat = 4.6097;
const originLng = -74.0817;
const destLat = 6.2518;
const destLng = -75.5636;

const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originLat},${originLng}&destinations=${destLat},${destLng}&key=${GOOGLE_MAPS_API_KEY}&units=imperial`;

const response = await fetch(url);
const data = await response.json();
```

**Respuesta de Google Maps:**
```json
{
  "destination_addresses": ["Carrera 7 #23-45, Medellín, Colombia"],
  "origin_addresses": ["Calle 123 #45-67, Bogotá, Colombia"],
  "rows": [
    {
      "elements": [
        {
          "distance": {
            "text": "244 mi",
            "value": 392725
          },
          "duration": {
            "text": "5 hours 0 mins",
            "value": 18000
          },
          "status": "OK"
        }
      ]
    }
  ],
  "status": "OK"
}
```

### Procesamiento de Datos

```javascript
// Extraer datos de la respuesta
const element = data.rows[0].elements[0];

// Convertir unidades para el endpoint de estimación
const distanceInMiles = element.distance.value * 0.000621371; // metros a millas
const durationInMinutes = Math.ceil(element.duration.value / 60); // segundos a minutos

console.log(`Distancia: ${distanceInMiles.toFixed(1)} millas`);
console.log(`Tiempo: ${durationInMinutes} minutos`);
```

## 🔄 Flujo Completo de Integración

### Paso 1: Configuración Inicial
```javascript
// Configurar API keys
const GOOGLE_MAPS_API_KEY = 'your-google-maps-key';
const API_BASE_URL = 'https://your-api-domain.com/api';
```

### Paso 2: Obtener Tiers Disponibles
```javascript
async function getAvailableTiers() {
  const response = await fetch(`${API_BASE_URL}/rides/flow/client/transport/tiers`);
  const data = await response.json();
  return data.data; // { car: [...], motorcycle: [...] }
}
```

### Paso 3: Usuario Selecciona Origen y Destino
```javascript
// En tu aplicación móvil/web
const origin = {
  lat: 4.6097,
  lng: -74.0817,
  address: "Calle 123, Bogotá"
};

const destination = {
  lat: 6.2518,
  lng: -75.5636,
  address: "Carrera 7, Medellín"
};
```

### Paso 4: Calcular Distancia y Tiempo con Google Maps
```javascript
async function calculateRoute(origin, destination) {
  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin.lat},${origin.lng}&destinations=${destination.lat},${destination.lng}&key=${GOOGLE_MAPS_API_KEY}&units=imperial`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.status !== 'OK') {
    throw new Error('Error calculating route');
  }

  const element = data.rows[0].elements[0];

  return {
    distanceMiles: element.distance.value * 0.000621371,
    durationMinutes: Math.ceil(element.duration.value / 60),
    rawData: element
  };
}
```

### Paso 5: Obtener Estimación de Precio
```javascript
async function getPriceEstimate(tierId, distanceMiles, durationMinutes) {
  const url = `${API_BASE_URL}/rides/estimate?tierId=${tierId}&minutes=${durationMinutes}&miles=${distanceMiles}`;

  const response = await fetch(url);
  const data = await response.json();

  return data.data; // { totalFare: 22.5, ... }
}
```

### Paso 6: Mostrar Precio al Usuario
```javascript
async function showPriceToUser(origin, destination, selectedTier) {
  try {
    // Calcular ruta con Google Maps
    const route = await calculateRoute(origin, destination);

    // Obtener estimación de precio
    const estimate = await getPriceEstimate(
      selectedTier.id,
      route.distanceMiles,
      route.durationMinutes
    );

    // Mostrar al usuario
    console.log(`Precio estimado: $${estimate.totalFare}`);
    console.log(`Distancia: ${route.distanceMiles.toFixed(1)} millas`);
    console.log(`Tiempo: ${route.durationMinutes} minutos`);

    return {
      route,
      estimate,
      tier: selectedTier
    };

  } catch (error) {
    console.error('Error calculating price:', error);
  }
}
```

### Paso 7: Usuario Confirma y Crea Viaje
```javascript
async function createRide(rideData, jwtToken) {
  const response = await fetch(`${API_BASE_URL}/rides/flow/client/transport/define-ride`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${jwtToken}`
    },
    body: JSON.stringify({
      originAddress: rideData.origin.address,
      originLat: rideData.origin.lat,
      originLng: rideData.origin.lng,
      destinationAddress: rideData.destination.address,
      destinationLat: rideData.destination.lat,
      destinationLng: rideData.destination.lng,
      minutes: rideData.route.durationMinutes,
      tierId: rideData.tier.id,
      vehicleTypeId: rideData.tier.vehicleTypeId
    })
  });

  const result = await response.json();
  return result.data; // { rideId: 123, ... }
}
```

### Paso 8: Confirmar Pago (Precio Final Calculado)
```javascript
async function confirmPayment(rideId, paymentMethod, jwtToken) {
  const response = await fetch(`${API_BASE_URL}/rides/flow/client/transport/${rideId}/confirm-payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${jwtToken}`
    },
    body: JSON.stringify({
      method: paymentMethod.method,
      bankCode: paymentMethod.bankCode
    })
  });

  const result = await response.json();
  return result.data; // Contiene precio final con multiplicadores
}
```

## 📱 Ejemplo de Implementación en Frontend

```javascript
// Componente React/Vue/Angular
class RideBooking {
  async bookRide() {
    try {
      // 1. Obtener tiers disponibles
      const tiers = await getAvailableTiers();

      // 2. Usuario selecciona origen/destino
      const origin = await getUserLocation();
      const destination = await selectDestination();

      // 3. Calcular ruta y precio
      const route = await calculateRoute(origin, destination);
      const estimate = await getPriceEstimate(1, route.distanceMiles, route.durationMinutes);

      // 4. Mostrar precio al usuario
      this.showPriceModal(estimate.totalFare);

      // 5. Usuario confirma
      if (await userConfirms()) {
        const ride = await createRide({
          origin,
          destination,
          route,
          tier: { id: 1, vehicleTypeId: 1 }
        }, jwtToken);

        // 6. Procesar pago
        const paymentResult = await confirmPayment(ride.rideId, {
          method: 'transfer',
          bankCode: '0102'
        }, jwtToken);

        this.showSuccessMessage(paymentResult);
      }

    } catch (error) {
      this.showErrorMessage(error.message);
    }
  }
}
```

## ⚠️ Consideraciones Importantes

### Google Maps API
- **Costo:** Distance Matrix API cobra por cada request
- **Límites:** Máximo 25 origenes × 25 destinos por request
- **Caching:** Implementa cache para rutas comunes
- **Error Handling:** Maneja errores de red y límites de API

### Estimaciones vs Precios Finales
- **Estimación:** Basada solo en distancia/tiempo/tier
- **Precio Final:** Incluye multiplicadores dinámicos (demanda, zona, hora pico)
- **Diferencia:** El precio final puede ser mayor que la estimación

### Unidades
- **Distancia:** Google Maps devuelve metros → convertir a millas (`× 0.000621371`)
- **Tiempo:** Google Maps devuelve segundos → convertir a minutos (`÷ 60`)

## 🔧 Configuración de API Keys

### Variables de Entorno
```bash
# .env
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
API_BASE_URL=https://your-api-domain.com/api
```

### Restricciones de API Key
- **HTTP referrer restrictions:** Para aplicaciones web
- **IP restrictions:** Para aplicaciones móviles/server-side
- **API restrictions:** Limitar a Distance Matrix API únicamente

## 🐛 Troubleshooting

### Errores Comunes
- `ZERO_RESULTS`: No se encontró ruta entre origen y destino
- `OVER_QUERY_LIMIT`: Superaste el límite de requests
- `REQUEST_DENIED`: API key inválida o restricciones incorrectas

### Optimizaciones
- **Cache rutas comunes** para reducir llamadas a Google Maps
- **Retry logic** para manejar errores temporales
- **Fallback estimates** cuando Google Maps no está disponible

---

**Nota:** Esta documentación asume que tienes acceso a las APIs del backend y Google Maps. Asegúrate de configurar correctamente las API keys y manejar errores apropiadamente.
