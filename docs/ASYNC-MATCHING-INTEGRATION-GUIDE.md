# 🚀 Guía de Integración: Sistema de Matching Asíncrono

## 📋 Resumen

Esta guía explica cómo integrar el nuevo sistema de **matching asíncrono** que soluciona el problema fundamental del endpoint síncrono `match-best-driver`.

## 🎯 Problema Solucionado

### ❌ **Problema Anterior (Síncrono)**
```typescript
// Usuario ejecuta búsqueda
POST /rides/flow/client/match-best-driver

// Sistema busca UNA vez y responde inmediatamente
// Si no hay conductores → Error 404
// Si hay conductores → Respuesta con datos (potencialmente obsoletos)
```

**Problemas:**
- ✅ Estado obsoleto inmediato
- ✅ Esperas frustrantes para usuarios
- ✅ No detecta conductores que se conectan después
- ✅ Race conditions en alta concurrencia

### ✅ **Solución Nueva (Asíncrono)**
```typescript
// Usuario inicia búsqueda continua
POST /rides/flow/client/transport/async-search/start

// Sistema mantiene búsqueda activa por N minutos
// Notifica via WebSocket cuando encuentra conductor
// Detecta conductores que se conectan después
// Usuario confirma cuando está listo
```

## 🏗️ Arquitectura del Sistema

### **Componentes Principales**

#### 1. **AsyncMatchingService**
```typescript
@Injectable()
export class AsyncMatchingService {
  // Gestiona sesiones de búsqueda activas
  private searchSessions: Map<string, SearchSession> = new Map();

  // Búsqueda periódica inteligente
  private startPeriodicSearch(session: SearchSession);

  // Notificaciones WebSocket
  private notifyWebSocket(session, eventType, data);
}
```

#### 2. **DriverEventsService**
```typescript
@Injectable()
export class DriverEventsService {
  // Sistema de eventos para conductores
  emitDriverOnline(event: DriverOnlineEvent);

  // Suscripción a eventos
  onDriverOnline(callback);
}
```

#### 3. **WebSocket Gateway Extendido**
```typescript
// Nuevos eventos de matching
socket.on('matching-event', (data) => {
  // { type: 'driver-found', searchId: '...', data: {...} }
});
```

## 📡 API Endpoints

### **1. Iniciar Búsqueda Asíncrona**
```http
POST /rides/flow/client/transport/async-search/start
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "lat": 4.6097,
  "lng": -74.0817,
  "tierId": 1,
  "vehicleTypeId": 2,
  "radiusKm": 5,
  "maxWaitTime": 300,
  "priority": "normal",
  "websocketRoom": "user-123"
}
```

**Respuesta Exitosa:**
```json
{
  "data": {
    "searchId": "search-123e4567-e89b-12d3-a456-426614174000",
    "status": "searching",
    "message": "Buscando el mejor conductor disponible...",
    "searchCriteria": {
      "lat": 4.6097,
      "lng": -74.0817,
      "tierId": 1,
      "vehicleTypeId": 2,
      "radiusKm": 5,
      "maxWaitTime": 300,
      "priority": "normal"
    },
    "timeRemaining": 300,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### **2. Consultar Estado de Búsqueda**
```http
GET /rides/flow/client/transport/async-search/:searchId/status
Authorization: Bearer <jwt-token>
```

**Respuesta:**
```json
{
  "data": {
    "searchId": "search-123e4567-e89b-12d3-a456-426614174000",
    "status": "found",
    "message": "¡Conductor encontrado! Confirma para continuar.",
    "matchedDriver": {
      "driverId": 42,
      "firstName": "Carlos",
      "lastName": "Rodriguez",
      "rating": 4.8,
      "matchScore": 85.5,
      "location": {
        "distance": 1.2,
        "estimatedArrival": 8
      }
    },
    "timeRemaining": 245
  }
}
```

### **3. Cancelar Búsqueda**
```http
POST /rides/flow/client/transport/async-search/cancel
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "searchId": "search-123e4567-e89b-12d3-a456-426614174000"
}
```

### **4. Confirmar Conductor Encontrado**
```http
POST /rides/flow/client/transport/async-search/confirm-driver
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "searchId": "search-123e4567-e89b-12d3-a456-426614174000",
  "driverId": 42,
  "notes": "Por favor llegue rápido, tengo prisa"
}
```

## 🔌 Integración WebSocket

### **Conexión al WebSocket**
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000/uber-realtime', {
  auth: {
    token: 'your-jwt-token'
  }
});

// Unirse a sala de usuario para notificaciones
socket.emit('join-user-room', { userId: 123 });
```

### **Escuchar Eventos de Matching**
```javascript
socket.on('matching-event', (event) => {
  const { type, searchId, userId, data, timestamp } = event;

  switch (type) {
    case 'driver-found':
      console.log('¡Conductor encontrado!', data);
      // Mostrar conductor en UI
      showDriverFound(data);
      break;

    case 'search-timeout':
      console.log('Búsqueda expirada');
      // Mostrar mensaje de no encontrado
      showSearchTimeout();
      break;

    case 'search-cancelled':
      console.log('Búsqueda cancelada');
      // Limpiar UI de búsqueda
      clearSearchUI();
      break;
  }
});
```

## 📱 Ejemplo de Integración Frontend (React)

### **Hook Personalizado para Matching Asíncrono**
```typescript
// hooks/useAsyncDriverSearch.ts
import { useState, useEffect, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';

interface SearchState {
  searchId: string | null;
  status: 'idle' | 'searching' | 'found' | 'timeout' | 'cancelled';
  matchedDriver: any | null;
  timeRemaining: number;
  error: string | null;
}

export const useAsyncDriverSearch = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [searchState, setSearchState] = useState<SearchState>({
    searchId: null,
    status: 'idle',
    matchedDriver: null,
    timeRemaining: 0,
    error: null,
  });

  // Conectar al WebSocket
  useEffect(() => {
    const newSocket = io('http://localhost:3000/uber-realtime', {
      auth: { token: localStorage.getItem('authToken') }
    });

    newSocket.on('connect', () => {
      console.log('Connected to WebSocket');
      // Unirse a sala de usuario
      newSocket.emit('join-user-room', { userId: getCurrentUserId() });
    });

    // Escuchar eventos de matching
    newSocket.on('matching-event', (event) => {
      handleMatchingEvent(event);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const handleMatchingEvent = useCallback((event: any) => {
    const { type, searchId, data } = event;

    if (searchId !== searchState.searchId) return; // No es nuestra búsqueda

    switch (type) {
      case 'driver-found':
        setSearchState(prev => ({
          ...prev,
          status: 'found',
          matchedDriver: data,
        }));
        break;

      case 'search-timeout':
        setSearchState(prev => ({
          ...prev,
          status: 'timeout',
          timeRemaining: 0,
        }));
        break;

      case 'search-cancelled':
        setSearchState(prev => ({
          ...prev,
          status: 'cancelled',
          timeRemaining: 0,
        }));
        break;
    }
  }, [searchState.searchId]);

  // Iniciar búsqueda
  const startSearch = useCallback(async (searchParams: any) => {
    try {
      setSearchState(prev => ({ ...prev, status: 'searching', error: null }));

      const response = await fetch('/rides/flow/client/transport/async-search/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify(searchParams),
      });

      const result = await response.json();

      if (result.data) {
        setSearchState(prev => ({
          ...prev,
          searchId: result.data.searchId,
          timeRemaining: result.data.timeRemaining,
        }));
      }
    } catch (error) {
      setSearchState(prev => ({
        ...prev,
        status: 'idle',
        error: error.message,
      }));
    }
  }, []);

  // Cancelar búsqueda
  const cancelSearch = useCallback(async () => {
    if (!searchState.searchId) return;

    try {
      await fetch('/rides/flow/client/transport/async-search/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({ searchId: searchState.searchId }),
      });

      setSearchState({
        searchId: null,
        status: 'idle',
        matchedDriver: null,
        timeRemaining: 0,
        error: null,
      });
    } catch (error) {
      setSearchState(prev => ({
        ...prev,
        error: error.message,
      }));
    }
  }, [searchState.searchId]);

  // Confirmar conductor
  const confirmDriver = useCallback(async (driverId: number, notes?: string) => {
    if (!searchState.searchId) return;

    try {
      const response = await fetch('/rides/flow/client/transport/async-search/confirm-driver', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({
          searchId: searchState.searchId,
          driverId,
          notes,
        }),
      });

      const result = await response.json();

      // Aquí continuar con el flujo normal de crear ride
      // navigate to ride creation with confirmed driver

    } catch (error) {
      setSearchState(prev => ({
        ...prev,
        error: error.message,
      }));
    }
  }, [searchState.searchId]);

  return {
    searchState,
    startSearch,
    cancelSearch,
    confirmDriver,
  };
};
```

### **Componente React de Búsqueda**
```tsx
// components/DriverSearch.tsx
import React, { useState } from 'react';
import { useAsyncDriverSearch } from '../hooks/useAsyncDriverSearch';

export const DriverSearch: React.FC = () => {
  const { searchState, startSearch, cancelSearch, confirmDriver } = useAsyncDriverSearch();
  const [searchParams, setSearchParams] = useState({
    lat: 4.6097,
    lng: -74.0817,
    tierId: 1,
    radiusKm: 5,
    maxWaitTime: 300,
  });

  const handleStartSearch = () => {
    startSearch(searchParams);
  };

  const handleConfirmDriver = () => {
    if (searchState.matchedDriver) {
      confirmDriver(searchState.matchedDriver.driverId);
    }
  };

  return (
    <div className="driver-search">
      {searchState.status === 'idle' && (
        <div className="search-form">
          <h3>Buscar Conductor</h3>
          <button onClick={handleStartSearch}>
            🚀 Iniciar Búsqueda Continua
          </button>
        </div>
      )}

      {searchState.status === 'searching' && (
        <div className="searching">
          <div className="spinner"></div>
          <p>{searchState.message}</p>
          <p>Tiempo restante: {Math.round(searchState.timeRemaining / 60)} minutos</p>
          <button onClick={cancelSearch}>Cancelar Búsqueda</button>
        </div>
      )}

      {searchState.status === 'found' && searchState.matchedDriver && (
        <div className="driver-found">
          <h3>¡Conductor Encontrado!</h3>
          <div className="driver-info">
            <img src={searchState.matchedDriver.profileImageUrl} alt="Driver" />
            <h4>{searchState.matchedDriver.firstName} {searchState.matchedDriver.lastName}</h4>
            <p>⭐ {searchState.matchedDriver.rating}</p>
            <p>📍 {searchState.matchedDriver.location.distance}km - {searchState.matchedDriver.location.estimatedArrival}min</p>
            <p>🎯 Score: {searchState.matchedDriver.matchScore}</p>
          </div>
          <div className="actions">
            <button onClick={handleConfirmDriver}>✅ Confirmar Conductor</button>
            <button onClick={cancelSearch}>🔄 Buscar Otro</button>
          </div>
        </div>
      )}

      {searchState.status === 'timeout' && (
        <div className="timeout">
          <h3>⏰ Búsqueda Expirada</h3>
          <p>No se encontraron conductores disponibles en tu área.</p>
          <button onClick={handleStartSearch}>🔄 Intentar de Nuevo</button>
        </div>
      )}

      {searchState.error && (
        <div className="error">
          <p>❌ Error: {searchState.error}</p>
        </div>
      )}
    </div>
  );
};
```

## ⚙️ Configuración del Sistema

### **Variables de Entorno**
```bash
# Async Matching Configuration
ASYNC_MATCHING_MAX_CONCURRENT_SEARCHES=100
ASYNC_MATCHING_DEFAULT_MAX_WAIT_TIME=300
ASYNC_MATCHING_SEARCH_INTERVAL=10000
ASYNC_MATCHING_CLEANUP_INTERVAL=60000
```

### **Configuración por Prioridad**
```typescript
// En AsyncMatchingService
private readonly config: AsyncMatchingConfig = {
  defaultMaxWaitTime: 300,     // 5 minutos
  searchInterval: 10000,       // 10 segundos base
  maxConcurrentSearches: 100,  // Máximo búsquedas simultáneas
  priorityWeights: {
    high: 3,     // 3x más frecuente (cada 3.3s)
    normal: 1,   // frecuencia normal (cada 10s)
    low: 0.5,    // 2x menos frecuente (cada 20s)
  },
};
```

## 🔍 Monitoreo y Debugging

### **Logs del Sistema**
```bash
# Ver búsquedas activas
tail -f logs/combined.log | grep "ASYNC"

# Ejemplo de logs:
# 🎯 [ASYNC] Started search abc-123 for user 42 - Priority: high
# 🟢 [LOCATION-TRACKING] Driver 55 came online at 4.6097, -74.0817
# 🎯 [ASYNC] Driver came online within range of search abc-123 (1.2km)
# 🎉 [ASYNC] Driver found for search abc-123 - Score: 87.3
# 📡 [WS] Sent driver-found to user-42
# ✅ [ASYNC] Confirmed driver 55 for search abc-123
```

### **Métricas Disponibles**
```typescript
// En AsyncMatchingService se pueden añadir métricas:
- active_searches: número de búsquedas activas
- search_success_rate: porcentaje de búsquedas exitosas
- average_matching_time: tiempo promedio para encontrar conductor
- driver_online_events: eventos de conductores conectándose
- websocket_notifications_sent: notificaciones enviadas
```

## 🧪 Testing del Sistema

### **Test Unitario**
```typescript
describe('AsyncMatchingService', () => {
  let service: AsyncMatchingService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [AsyncMatchingService],
    }).compile();

    service = module.get<AsyncMatchingService>(AsyncMatchingService);
  });

  it('should start async search', async () => {
    const result = await service.startAsyncDriverSearch(1, {
      lat: 4.6097,
      lng: -74.0817,
      maxWaitTime: 60,
    });

    expect(result.searchId).toBeDefined();
    expect(result.status).toBe('searching');
  });
});
```

### **Test de Integración WebSocket**
```typescript
describe('WebSocket Matching Events', () => {
  it('should receive driver-found event', (done) => {
    const socket = io('http://localhost:3000/uber-realtime');

    socket.on('matching-event', (event) => {
      expect(event.type).toBe('driver-found');
      expect(event.data).toHaveProperty('driverId');
      done();
    });

    // Trigger search and driver online event
    // ... test logic
  });
});
```

## 🚀 Próximos Pasos

### **Mejoras Planificadas**
1. **Machine Learning**: Predecir demanda y optimizar asignaciones
2. **Geofencing**: Asignaciones basadas en zonas dinámicas
3. **A/B Testing**: Comparar algoritmos de matching
4. **Analytics Dashboard**: Métricas en tiempo real
5. **Mobile Push**: Notificaciones push nativas

### **Escalabilidad**
- **Redis Cluster**: Para múltiples instancias
- **Database Sharding**: Por región geográfica
- **Load Balancing**: Distribución automática de búsquedas

## 🎯 Conclusión

El **sistema de matching asíncrono** representa una **evolución significativa** en la experiencia de usuario de la plataforma Uber Clone. Al solucionar el problema fundamental del estado obsoleto, proporciona:

- ✅ **Experiencia fluida**: Sin esperas frustrantes
- ✅ **Mayor éxito**: Detecta conductores que se conectan después
- ✅ **Escalabilidad**: Maneja mejor picos de demanda
- ✅ **Confiabilidad**: Elimina race conditions

Esta implementación establece un **nuevo estándar** para aplicaciones de ride-sharing, demostrando cómo la **arquitectura asíncrona** puede transformar completamente la experiencia del usuario. 🚀📱
