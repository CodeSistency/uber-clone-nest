import { MatchBestDriverDto } from './transport-flow.dtos';

/**
 * Estados posibles de una sesión de búsqueda
 */
export enum SearchStatus {
  SEARCHING = 'searching', // Buscando activamente
  FOUND = 'found', // Conductor encontrado
  TIMEOUT = 'timeout', // Búsqueda expiró
  CANCELLED = 'cancelled', // Usuario canceló
  COMPLETED = 'completed', // Matching completado exitosamente
}

/**
 * Criterios de búsqueda extendidos
 */
export interface SearchCriteria extends MatchBestDriverDto {
  searchId: string; // ID único de la búsqueda
  userId: number; // ID del usuario que busca
  maxWaitTime?: number; // Tiempo máximo de espera (segundos)
  priority?: 'low' | 'normal' | 'high'; // Prioridad de la búsqueda
  websocketRoom?: string; // Sala WebSocket para notificaciones
}

/**
 * Información del conductor encontrado
 */
export interface MatchedDriverInfo {
  driverId: number;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
  rating: number;
  totalRides: number;
  vehicle: {
    carModel: string;
    licensePlate: string;
    carSeats: number;
    vehicleType: string;
  };
  location: {
    distance: number;
    estimatedArrival: number;
    currentLocation: { lat: number; lng: number };
  };
  pricing: {
    tierId: number;
    tierName: string;
    estimatedFare: number;
  };
  matchScore: number;
  searchId: string;
}

/**
 * Sesión de búsqueda activa
 */
export interface SearchSession {
  searchId: string; // ID único de la búsqueda
  userId: number; // ID del usuario
  criteria: Omit<SearchCriteria, 'searchId' | 'userId'>; // Criterios de búsqueda
  status: SearchStatus; // Estado actual
  createdAt: Date; // Fecha de creación
  updatedAt: Date; // Última actualización
  expiresAt: Date; // Fecha de expiración
  matchedDriver?: MatchedDriverInfo; // Conductor encontrado (si aplica)
  attempts: number; // Número de intentos de búsqueda
  lastSearchAt?: Date; // Última vez que se buscó
  searchInterval: number; // Intervalo entre búsquedas (ms)
  maxWaitTime: number; // Tiempo máximo de espera (segundos)
  priority: 'low' | 'normal' | 'high'; // Prioridad
  websocketRoom?: string; // Sala WebSocket para notificaciones
}

/**
 * Resultado de una búsqueda asíncrona
 */
export interface AsyncSearchResult {
  searchId: string;
  status: SearchStatus;
  message: string;
  matchedDriver?: MatchedDriverInfo;
  searchCriteria: {
    lat: number;
    lng: number;
    tierId?: number;
    vehicleTypeId?: number;
    radiusKm: number;
    maxWaitTime: number;
    priority: string;
  };
  timeRemaining?: number; // Segundos restantes
  createdAt: Date;
}

/**
 * Evento WebSocket para matching
 */
export interface MatchingWebSocketEvent {
  type:
    | 'driver-found'
    | 'search-timeout'
    | 'search-cancelled'
    | 'search-expired';
  searchId: string;
  userId: number;
  data?: MatchedDriverInfo | any;
  timestamp: Date;
}

/**
 * Configuración del sistema de matching asíncrono
 */
export interface AsyncMatchingConfig {
  defaultMaxWaitTime: number; // 300s = 5 minutos por defecto
  searchInterval: number; // 10000ms = 10 segundos entre búsquedas
  maxConcurrentSearches: number; // 100 búsquedas simultáneas máximo
  cleanupInterval: number; // 60000ms = 1 minuto para limpieza
  priorityWeights: {
    high: number; // 3x más frecuente
    normal: number; // 1x frecuencia normal
    low: number; // 0.5x menos frecuente
  };
}
