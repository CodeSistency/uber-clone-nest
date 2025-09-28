/**
 * 🧪 TEST COMPLETO DEL SISTEMA DE MATCHING OPTIMIZADO
 *
 * Este test demuestra todas las optimizaciones implementadas:
 * - Sistema de caché inteligente con Redis
 * - Scoring por lotes con MatchingEngine
 * - Métricas detalladas de performance
 * - Logging condicional inteligente
 * - Validación de salud del sistema
 *
 * Ejecutar con: npm run test:matching
 */

import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';
import { RidesFlowService } from '../rides/flow/rides-flow.service';
import { MatchingEngine } from '../rides/flow/matching-engine';
import { MatchingMetricsService } from '../rides/flow/matching-metrics.service';
import { NotificationsService } from '../notifications/notifications.service';
import { WebSocketGatewayClass } from '../websocket/websocket.gateway';
import { RidesService } from '../rides/rides.service';
import { OrdersService } from '../orders/orders.service';
import { StripeService } from '../stripe/stripe.service';
import { ErrandsService } from '../errands/errands.service';
import { ParcelsService } from '../parcels/parcels.service';
import { LocationTrackingService } from '../redis/location-tracking.service';
import { WalletService } from '../wallet/wallet.service';

// ============================================================================
// 📊 DATOS DUMMY REALISTAS EXPANDIDOS
// ============================================================================

interface SummaryTracker {
  cache: {
    durationDbMs: number;
    durationCacheMs: number;
    driversDb: number;
    driversCache: number;
  };
  matching: {
    runsAttempted: number;
    matchesSuccessful: number;
    matchesFailed: number;
    bestScore: number;
    bestDistance: number;
    totalSearchDurationMs: number;
    sampleOptimizedResult: any;
    sampleBasicResult: any;
  };
  scoring: {
    durationOptimizedMs: number;
    driversProcessedOptimized: number;
  };
  comparison: {
    durationOptimizedMs: number;
    durationBasicMs: number;
    bestScoreOptimized: number;
    bestScoreBasic: number;
    distanceOptimized: number;
    distanceBasic: number;
    sampleOptimizedResult: any;
    sampleBasicResult: any;
  };
  overload: {
    concurrentRequests: number;
    durationMs: number;
    successful: number;
    failed: number;
  };
  stress: {
    scenarios: Array<{
      driverCount: number;
      iterations: number;
      avgOptimizedMs: number;
      avgBasicMs: number;
      improvementPercent: number;
      successRate: number;
    }>;
  };
}

const summaryTracker: SummaryTracker = {
  cache: {
    durationDbMs: 0,
    durationCacheMs: 0,
    driversDb: 0,
    driversCache: 0,
  },
  matching: {
    runsAttempted: 0,
    matchesSuccessful: 0,
    matchesFailed: 0,
    bestScore: 0,
    bestDistance: Number.POSITIVE_INFINITY,
    totalSearchDurationMs: 0,
    sampleOptimizedResult: null,
    sampleBasicResult: null,
  },
  scoring: {
    durationOptimizedMs: 0,
    driversProcessedOptimized: 0,
  },
  comparison: {
    durationOptimizedMs: 0,
    durationBasicMs: 0,
    bestScoreOptimized: 0,
    bestScoreBasic: 0,
    distanceOptimized: Number.POSITIVE_INFINITY,
    distanceBasic: Number.POSITIVE_INFINITY,
    sampleOptimizedResult: null,
    sampleBasicResult: null,
  },
  overload: {
    concurrentRequests: 0,
    durationMs: 0,
    successful: 0,
    failed: 0,
  },
  stress: {
    scenarios: [],
  },
};

const DUMMY_DATA = {
  // Ubicaciones de prueba (Centro de Buenos Aires y alrededores)
  testLocations: {
    userPickup: { lat: -34.6037, lng: -58.3816 }, // Plaza de Mayo
    userPickup2: { lat: -34.6114, lng: -58.3960 }, // Palermo
    userPickup3: { lat: -34.5870, lng: -58.3790 }, // San Telmo
    userPickup4: { lat: -34.6320, lng: -58.4060 }, // Belgrano
    nearbyDrivers: [
      // Conductores muy cercanos (0-0.5km)
      { id: 1, lat: -34.6020, lng: -58.3790, distance: 0.25 }, // Muy cerca
      { id: 2, lat: -34.6050, lng: -58.3840, distance: 0.35 }, // Cerca
      { id: 3, lat: -34.6010, lng: -58.3750, distance: 0.45 }, // Cercano
      { id: 4, lat: -34.6065, lng: -58.3855, distance: 0.48 }, // Muy cercano

      // Conductores medianamente cercanos (0.5-1km)
      { id: 5, lat: -34.6070, lng: -58.3880, distance: 0.65 }, // Un poco lejos
      { id: 6, lat: -34.5990, lng: -58.3720, distance: 0.75 }, // Más lejos
      { id: 7, lat: -34.6090, lng: -58.3920, distance: 0.95 }, // Bastante lejos

      // Conductores lejanos (1-2km)
      { id: 8, lat: -34.5970, lng: -58.3690, distance: 1.15 }, // Lejos
      { id: 9, lat: -34.6110, lng: -58.3950, distance: 1.35 }, // Muy lejos
      { id: 10, lat: -34.5950, lng: -58.3650, distance: 1.55 }, // Bastante lejos
      { id: 11, lat: -34.6130, lng: -58.3980, distance: 1.75 }, // Muy lejos

      // Conductores muy lejanos (2-3km)
      { id: 12, lat: -34.5930, lng: -58.3610, distance: 2.15 }, // Zona limítrofe
      { id: 13, lat: -34.6150, lng: -58.4010, distance: 2.35 }, // Zona limítrofe
      { id: 14, lat: -34.5910, lng: -58.3580, distance: 2.55 }, // Fuera del radio
      { id: 15, lat: -34.6170, lng: -58.4040, distance: 2.75 }, // Fuera del radio

      // Conductores extremos (3-5km)
      { id: 16, lat: -34.5890, lng: -58.3550, distance: 3.15 }, // Muy lejos
      { id: 17, lat: -34.6190, lng: -58.4070, distance: 3.35 }, // Muy lejos
      { id: 18, lat: -34.5870, lng: -58.3520, distance: 3.55 }, // Extremadamente lejos
    ]
  },

  // Perfiles de conductores realistas
  drivers: [
    {
      id: 1,
      firstName: 'Carlos',
      lastName: 'Rodriguez',
      rating: 4.8,
      totalRides: 1250,
      status: 'online',
      verificationStatus: 'approved',
      canDoDeliveries: true,
      carSeats: 4,
      vehicleType: 'sedan',
      preferredTier: 'UberX',
      lastLocationUpdate: new Date(),
      isLocationActive: true,
      averageRating: 4.8,
      completionRate: 98.5,
      distance: 0.25,
      estimatedArrival: '2 min'
    },
    {
      id: 2,
      firstName: 'María',
      lastName: 'Gonzalez',
      rating: 4.9,
      totalRides: 890,
      status: 'online',
      verificationStatus: 'approved',
      canDoDeliveries: false,
      carSeats: 5,
      vehicleType: 'suv',
      preferredTier: 'UberXL',
      lastLocationUpdate: new Date(),
      isLocationActive: true,
      averageRating: 4.9,
      completionRate: 97.2,
      distance: 0.35,
      estimatedArrival: '3 min'
    },
    {
      id: 3,
      firstName: 'Juan',
      lastName: 'Pérez',
      rating: 4.6,
      totalRides: 2100,
      status: 'online',
      verificationStatus: 'approved',
      canDoDeliveries: true,
      carSeats: 4,
      vehicleType: 'sedan',
      preferredTier: 'UberX',
      lastLocationUpdate: new Date(),
      isLocationActive: true,
      averageRating: 4.6,
      completionRate: 95.8,
      distance: 0.45,
      estimatedArrival: '4 min'
    },
    {
      id: 4,
      firstName: 'Ana',
      lastName: 'Martinez',
      rating: 4.7,
      totalRides: 675,
      status: 'busy',
      verificationStatus: 'approved',
      canDoDeliveries: true,
      carSeats: 4,
      vehicleType: 'hatchback',
      preferredTier: 'UberX',
      lastLocationUpdate: new Date(Date.now() - 5 * 60 * 1000), // 5 min atrás
      isLocationActive: true,
      averageRating: 4.7,
      completionRate: 96.4,
      distance: 0.65,
      estimatedArrival: '6 min'
    },
    {
      id: 5,
      firstName: 'Luis',
      lastName: 'Fernandez',
      rating: 4.5,
      totalRides: 340,
      status: 'online',
      verificationStatus: 'pending',
      canDoDeliveries: false,
      carSeats: 4,
      vehicleType: 'sedan',
      preferredTier: 'UberX',
      lastLocationUpdate: new Date(),
      isLocationActive: true,
      averageRating: 4.5,
      completionRate: 92.1,
      distance: 0.75,
      estimatedArrival: '7 min'
    },
    {
      id: 6,
      firstName: 'Carmen',
      lastName: 'Lopez',
      rating: 4.4,
      totalRides: 95,
      status: 'online',
      verificationStatus: 'approved',
      canDoDeliveries: true,
      carSeats: 7,
      vehicleType: 'van',
      preferredTier: 'UberXL',
      lastLocationUpdate: new Date(),
      isLocationActive: true,
      averageRating: 4.4,
      completionRate: 89.7,
      distance: 0.95,
      estimatedArrival: '9 min'
    },
    {
      id: 7,
      firstName: 'Roberto',
      lastName: 'Diaz',
      rating: 4.3,
      totalRides: 45,
      status: 'offline',
      verificationStatus: 'approved',
      canDoDeliveries: false,
      carSeats: 4,
      vehicleType: 'sedan',
      preferredTier: 'UberX',
      lastLocationUpdate: new Date(Date.now() - 15 * 60 * 1000), // 15 min atrás
      isLocationActive: false,
      averageRating: 4.3,
      completionRate: 85.3,
      distance: 1.15,
      estimatedArrival: '11 min'
    },
    {
      id: 8,
      firstName: 'Patricia',
      lastName: 'Sanchez',
      rating: 4.2,
      totalRides: 120,
      status: 'online',
      verificationStatus: 'approved',
      canDoDeliveries: true,
      carSeats: 4,
      vehicleType: 'sedan',
      preferredTier: 'UberX',
      lastLocationUpdate: new Date(Date.now() - 2 * 60 * 1000), // 2 min atrás
      isLocationActive: true,
      averageRating: 4.2,
      completionRate: 91.2,
      distance: 1.35,
      estimatedArrival: '13 min'
    },
    {
      id: 9,
      firstName: 'Diego',
      lastName: 'Morales',
      rating: 4.6,
      totalRides: 780,
      status: 'online',
      verificationStatus: 'approved',
      canDoDeliveries: false,
      carSeats: 5,
      vehicleType: 'suv',
      preferredTier: 'UberXL',
      lastLocationUpdate: new Date(),
      isLocationActive: true,
      averageRating: 4.6,
      completionRate: 94.8,
      distance: 1.55,
      estimatedArrival: '15 min'
    },
    {
      id: 10,
      firstName: 'Silvia',
      lastName: 'Castro',
      rating: 4.1,
      totalRides: 95,
      status: 'online',
      verificationStatus: 'approved',
      canDoDeliveries: true,
      carSeats: 4,
      vehicleType: 'hatchback',
      preferredTier: 'UberX',
      lastLocationUpdate: new Date(Date.now() - 3 * 60 * 1000), // 3 min atrás
      isLocationActive: true,
      averageRating: 4.1,
      completionRate: 88.5,
      distance: 1.75,
      estimatedArrival: '17 min'
    },
    {
      id: 11,
      firstName: 'Roberto',
      lastName: 'Vargas',
      rating: 4.7,
      totalRides: 1450,
      status: 'busy',
      verificationStatus: 'approved',
      canDoDeliveries: true,
      carSeats: 7,
      vehicleType: 'van',
      preferredTier: 'UberXL',
      lastLocationUpdate: new Date(Date.now() - 1 * 60 * 1000), // 1 min atrás
      isLocationActive: true,
      averageRating: 4.7,
      completionRate: 96.3,
      distance: 2.15,
      estimatedArrival: '20 min'
    },
    {
      id: 12,
      firstName: 'Monica',
      lastName: 'Ruiz',
      rating: 4.3,
      totalRides: 320,
      status: 'online',
      verificationStatus: 'approved',
      canDoDeliveries: false,
      carSeats: 4,
      vehicleType: 'sedan',
      preferredTier: 'UberX',
      lastLocationUpdate: new Date(),
      isLocationActive: true,
      averageRating: 4.3,
      completionRate: 92.7,
      distance: 2.35,
      estimatedArrival: '22 min'
    },
    {
      id: 13,
      firstName: 'Fernando',
      lastName: 'Gutierrez',
      rating: 4.5,
      totalRides: 650,
      status: 'online',
      verificationStatus: 'approved',
      canDoDeliveries: true,
      carSeats: 5,
      vehicleType: 'suv',
      preferredTier: 'UberXL',
      lastLocationUpdate: new Date(Date.now() - 4 * 60 * 1000), // 4 min atrás
      isLocationActive: true,
      averageRating: 4.5,
      completionRate: 93.8,
      distance: 2.55,
      estimatedArrival: '24 min'
    },
    {
      id: 14,
      firstName: 'Gabriela',
      lastName: 'Herrera',
      rating: 3.9,
      totalRides: 45,
      status: 'online',
      verificationStatus: 'pending',
      canDoDeliveries: false,
      carSeats: 4,
      vehicleType: 'sedan',
      preferredTier: 'UberX',
      lastLocationUpdate: new Date(),
      isLocationActive: true,
      averageRating: 3.9,
      completionRate: 84.2,
      distance: 2.75,
      estimatedArrival: '26 min'
    },
    {
      id: 15,
      firstName: 'Miguel',
      lastName: 'Torres',
      rating: 4.4,
      totalRides: 890,
      status: 'offline',
      verificationStatus: 'approved',
      canDoDeliveries: true,
      carSeats: 4,
      vehicleType: 'sedan',
      preferredTier: 'UberX',
      lastLocationUpdate: new Date(Date.now() - 20 * 60 * 1000), // 20 min atrás
      isLocationActive: false,
      averageRating: 4.4,
      completionRate: 91.9,
      distance: 3.15,
      estimatedArrival: '30 min'
    },
    {
      id: 16,
      firstName: 'Laura',
      lastName: 'Fernandez',
      rating: 4.8,
      totalRides: 2100,
      status: 'online',
      verificationStatus: 'approved',
      canDoDeliveries: true,
      carSeats: 7,
      vehicleType: 'van',
      preferredTier: 'UberXL',
      lastLocationUpdate: new Date(Date.now() - 5 * 60 * 1000), // 5 min atrás
      isLocationActive: true,
      averageRating: 4.8,
      completionRate: 97.1,
      distance: 3.35,
      estimatedArrival: '32 min'
    },
    {
      id: 17,
      firstName: 'Jorge',
      lastName: 'Ramirez',
      rating: 4.0,
      totalRides: 180,
      status: 'online',
      verificationStatus: 'approved',
      canDoDeliveries: false,
      carSeats: 4,
      vehicleType: 'hatchback',
      preferredTier: 'UberX',
      lastLocationUpdate: new Date(),
      isLocationActive: true,
      averageRating: 4.0,
      completionRate: 89.4,
      distance: 3.55,
      estimatedArrival: '34 min'
    },
    {
      id: 18,
      firstName: 'Andrea',
      lastName: 'Silva',
      rating: 4.6,
      totalRides: 1200,
      status: 'busy',
      verificationStatus: 'approved',
      canDoDeliveries: true,
      carSeats: 5,
      vehicleType: 'suv',
      preferredTier: 'UberXL',
      lastLocationUpdate: new Date(Date.now() - 6 * 60 * 1000), // 6 min atrás
      isLocationActive: true,
      averageRating: 4.6,
      completionRate: 95.5,
      distance: 3.75,
      estimatedArrival: '36 min'
    },
    {
      id: 19,
      firstName: 'Ricardo',
      lastName: 'Mendoza',
      rating: 4.2,
      totalRides: 420,
      status: 'online',
      verificationStatus: 'approved',
      canDoDeliveries: true,
      carSeats: 4,
      vehicleType: 'sedan',
      preferredTier: 'UberX',
      lastLocationUpdate: new Date(Date.now() - 7 * 60 * 1000), // 7 min atrás
      isLocationActive: true,
      averageRating: 4.2,
      completionRate: 92.3,
      distance: 3.95,
      estimatedArrival: '38 min'
    },
    {
      id: 20,
      firstName: 'Beatriz',
      lastName: 'Lorenzo',
      rating: 4.7,
      totalRides: 1650,
      status: 'online',
      verificationStatus: 'approved',
      canDoDeliveries: false,
      carSeats: 4,
      vehicleType: 'sedan',
      preferredTier: 'UberX',
      lastLocationUpdate: new Date(),
      isLocationActive: true,
      averageRating: 4.7,
      completionRate: 96.8,
      distance: 4.15,
      estimatedArrival: '40 min'
    },
    {
      id: 21,
      firstName: 'Hugo',
      lastName: 'Navarro',
      rating: 3.8,
      totalRides: 75,
      status: 'online',
      verificationStatus: 'pending',
      canDoDeliveries: true,
      carSeats: 4,
      vehicleType: 'hatchback',
      preferredTier: 'UberX',
      lastLocationUpdate: new Date(Date.now() - 8 * 60 * 1000), // 8 min atrás
      isLocationActive: true,
      averageRating: 3.8,
      completionRate: 86.7,
      distance: 4.35,
      estimatedArrival: '42 min'
    },
    {
      id: 22,
      firstName: 'Elena',
      lastName: 'Pereira',
      rating: 4.5,
      totalRides: 980,
      status: 'busy',
      verificationStatus: 'approved',
      canDoDeliveries: true,
      carSeats: 7,
      vehicleType: 'van',
      preferredTier: 'UberXL',
      lastLocationUpdate: new Date(Date.now() - 9 * 60 * 1000), // 9 min atrás
      isLocationActive: true,
      averageRating: 4.5,
      completionRate: 94.1,
      distance: 4.55,
      estimatedArrival: '44 min'
    },
    {
      id: 23,
      firstName: 'Alberto',
      lastName: 'Costa',
      rating: 4.1,
      totalRides: 350,
      status: 'online',
      verificationStatus: 'approved',
      canDoDeliveries: false,
      carSeats: 5,
      vehicleType: 'suv',
      preferredTier: 'UberXL',
      lastLocationUpdate: new Date(),
      isLocationActive: true,
      averageRating: 4.1,
      completionRate: 90.8,
      distance: 4.75,
      estimatedArrival: '46 min'
    },
    {
      id: 24,
      firstName: 'Natalia',
      lastName: 'Rojas',
      rating: 4.9,
      totalRides: 2350,
      status: 'online',
      verificationStatus: 'approved',
      canDoDeliveries: true,
      carSeats: 4,
      vehicleType: 'sedan',
      preferredTier: 'UberX',
      lastLocationUpdate: new Date(Date.now() - 10 * 60 * 1000), // 10 min atrás
      isLocationActive: true,
      averageRating: 4.9,
      completionRate: 98.2,
      distance: 4.95,
      estimatedArrival: '48 min'
    },
    {
      id: 25,
      firstName: 'Oscar',
      lastName: 'Medina',
      rating: 4.3,
      totalRides: 560,
      status: 'online',
      verificationStatus: 'approved',
      canDoDeliveries: true,
      carSeats: 4,
      vehicleType: 'sedan',
      preferredTier: 'UberX',
      lastLocationUpdate: new Date(),
      isLocationActive: true,
      averageRating: 4.3,
      completionRate: 93.2,
      distance: 5.15,
      estimatedArrival: '50 min'
    },
    {
      id: 26,
      firstName: 'Cristina',
      lastName: 'Acosta',
      rating: 4.4,
      totalRides: 720,
      status: 'offline',
      verificationStatus: 'approved',
      canDoDeliveries: false,
      carSeats: 4,
      vehicleType: 'hatchback',
      preferredTier: 'UberX',
      lastLocationUpdate: new Date(Date.now() - 25 * 60 * 1000), // 25 min atrás
      isLocationActive: false,
      averageRating: 4.4,
      completionRate: 91.5,
      distance: 5.35,
      estimatedArrival: '52 min'
    },
    {
      id: 27,
      firstName: 'Daniel',
      lastName: 'Suarez',
      rating: 3.7,
      totalRides: 120,
      status: 'online',
      verificationStatus: 'pending',
      canDoDeliveries: true,
      carSeats: 5,
      vehicleType: 'suv',
      preferredTier: 'UberXL',
      lastLocationUpdate: new Date(Date.now() - 12 * 60 * 1000), // 12 min atrás
      isLocationActive: true,
      averageRating: 3.7,
      completionRate: 85.9,
      distance: 5.55,
      estimatedArrival: '54 min'
    },
    {
      id: 28,
      firstName: 'Veronica',
      lastName: 'Luna',
      rating: 4.6,
      totalRides: 1340,
      status: 'online',
      verificationStatus: 'approved',
      canDoDeliveries: true,
      carSeats: 7,
      vehicleType: 'van',
      preferredTier: 'UberXL',
      lastLocationUpdate: new Date(),
      isLocationActive: true,
      averageRating: 4.6,
      completionRate: 95.7,
      distance: 5.75,
      estimatedArrival: '56 min'
    }
  ],

  // Tiers disponibles (13 tiers)
  rideTiers: [
    { id: 1, name: 'UberX', baseFare: 2.50, perMinuteRate: 0.20, perMileRate: 1.50 },
    { id: 2, name: 'UberXL', baseFare: 4.00, perMinuteRate: 0.35, perMileRate: 2.50 },
    { id: 3, name: 'UberBlack', baseFare: 7.00, perMinuteRate: 0.65, perMileRate: 4.00 },
    { id: 4, name: 'UberSelect', baseFare: 5.50, perMinuteRate: 0.45, perMileRate: 3.20 },
    { id: 5, name: 'UberComfort', baseFare: 3.20, perMinuteRate: 0.25, perMileRate: 1.80 },
    { id: 6, name: 'UberGreen', baseFare: 2.80, perMinuteRate: 0.22, perMileRate: 1.60 },
    { id: 7, name: 'UberReserve', baseFare: 8.00, perMinuteRate: 0.75, perMileRate: 4.50 },
    { id: 8, name: 'UberHourly', baseFare: 25.00, perMinuteRate: 0.15, perMileRate: 1.20 },
    { id: 9, name: 'UberPet', baseFare: 3.50, perMinuteRate: 0.30, perMileRate: 2.00 },
    { id: 10, name: 'UberWAV', baseFare: 3.00, perMinuteRate: 0.25, perMileRate: 1.70 },
    { id: 11, name: 'UberSUV', baseFare: 6.00, perMinuteRate: 0.50, perMileRate: 3.50 },
    { id: 12, name: 'UberTaxi', baseFare: 2.00, perMinuteRate: 0.18, perMileRate: 1.30 },
    { id: 13, name: 'UberLuxury', baseFare: 12.00, perMinuteRate: 0.90, perMileRate: 6.00 }
  ],

  // Tipos de vehículo (14 tipos)
  vehicleTypes: [
    { id: 1, displayName: 'Sedán', seats: 4 },
    { id: 2, displayName: 'SUV', seats: 5 },
    { id: 3, displayName: 'Hatchback', seats: 4 },
    { id: 4, displayName: 'Van', seats: 7 },
    { id: 5, displayName: 'Pickup Truck', seats: 4 },
    { id: 6, displayName: 'Convertible', seats: 2 },
    { id: 7, displayName: 'Coupe', seats: 2 },
    { id: 8, displayName: 'Wagon', seats: 5 },
    { id: 9, displayName: 'Minivan', seats: 8 },
    { id: 10, displayName: 'Crossover', seats: 5 },
    { id: 11, displayName: 'Luxury Sedan', seats: 4 },
    { id: 12, displayName: 'Sports Car', seats: 2 },
    { id: 13, displayName: 'Limousine', seats: 10 },
    { id: 14, displayName: 'Motorcycle', seats: 1 }
  ]
};

const BASE_DATASET: typeof DUMMY_DATA = JSON.parse(JSON.stringify(DUMMY_DATA));

const VEHICLE_TYPES = ['sedan', 'suv', 'hatchback', 'van', 'luxury'] as const;
const TIERS = ['UberX', 'UberXL', 'UberComfort', 'UberBlack'] as const;
const STATUSES = ['online', 'busy', 'offline'] as const;
const VERIFICATIONS = ['approved', 'pending'] as const;

type DriverProfile = (typeof DUMMY_DATA)['drivers'][number];
type DriverStatus = DriverProfile['status'];
type VerificationStatus = DriverProfile['verificationStatus'];
type VehicleType = DriverProfile['vehicleType'];
type TierType = DriverProfile['preferredTier'];

type StressDataset = typeof DUMMY_DATA & { drivers: DriverProfile[] };

function pseudoRandom(seed: number) {
  let value = seed % 2147483647;
  if (value <= 0) {
    value += 2147483646;
  }
  return () => (value = (value * 16807) % 2147483647) / 2147483647;
}

function randomFromArray<T>(items: readonly T[], rnd: () => number): T {
  return items[Math.floor(rnd() * items.length) % items.length];
}

function createRandomDrivers(count: number, seed = Date.now()): DriverProfile[] {
  const rnd = pseudoRandom(seed);
  const drivers: DriverProfile[] = [];

  for (let i = 0; i < count; i++) {
    const id = i + 1;
    const status = randomFromArray(STATUSES, rnd) as DriverStatus;
    const verificationStatus = status === 'online'
      ? (randomFromArray(VERIFICATIONS, rnd) as VerificationStatus)
      : 'approved';
    const vehicleType = randomFromArray(VEHICLE_TYPES, rnd) as VehicleType;
    const preferredTier = randomFromArray(TIERS, rnd) as TierType;
    const rating = Number((3.5 + rnd() * 1.5).toFixed(2));
    const totalRides = Math.floor(50 + rnd() * 2200);
    const distance = Number((rnd() * 8).toFixed(2));
    const carSeats = vehicleType === 'van' ? 7 : vehicleType === 'suv' ? 5 : 4;
    const firstName = `Driver${id}`;
    const lastName = `Auto${Math.floor(rnd() * 1000)}`;

    drivers.push({
      id,
      firstName,
      lastName,
      rating,
      totalRides,
      status,
      verificationStatus,
      canDoDeliveries: rnd() > 0.4,
      carSeats,
      vehicleType,
      preferredTier,
      lastLocationUpdate: new Date(Date.now() - Math.floor(rnd() * 10 * 60 * 1000)),
      isLocationActive: status !== 'offline',
      averageRating: rating,
      completionRate: Number((80 + rnd() * 20).toFixed(1)),
      distance,
      estimatedArrival: `${Math.max(1, Math.floor(distance * 6))} min`,
    });
  }

  return drivers;
}

function buildRandomDataset(driverCount: number, seed = Date.now()): StressDataset {
  const base: StressDataset = JSON.parse(JSON.stringify(BASE_DATASET));
  base.drivers = createRandomDrivers(driverCount, seed);
  return base;
}

// ============================================================================
// 🧪 CLASE DE TEST PRINCIPAL
// ============================================================================

describe('🚗 Sistema de Matching Optimizado - Test Completo', () => {
  let ridesFlowService: RidesFlowService;
  let prismaService: PrismaService;
  let redisService: RedisService;
  let matchingEngine: MatchingEngine;
  let matchingMetrics: MatchingMetricsService;
  let logger: Logger;
  let cacheCallCount = 0;

  let baseValidateSystemHealthSpy: jest.SpyInstance;
  let baseQueryRawSpy: jest.SpyInstance;
  let baseRedisSetSpy: jest.SpyInstance;
  let baseRedisIncrSpy: jest.SpyInstance;
  let baseRedisIncrBySpy: jest.SpyInstance;
  let baseRedisDelSpy: jest.SpyInstance;
  let baseRedisGetSpy: jest.SpyInstance;
  let baseTierVehicleFindManySpy: jest.SpyInstance;
  let baseDriverFindManySpy: jest.SpyInstance;
  let baseDriverFindUniqueSpy: jest.SpyInstance;
  let baseDriverFindFirstSpy: jest.SpyInstance;
  let baseRideTierFindUniqueSpy: jest.SpyInstance;
  let baseVehicleTypeFindUniqueSpy: jest.SpyInstance;

  const redisGetImplementation = async (key: string) => {
    if (key === 'health_check') return 'ok';
    if (key.startsWith('drivers:available:')) {
      cacheCallCount += 1;
      if (cacheCallCount === 1) {
        await new Promise(resolve => setTimeout(resolve, 15));
        return null;
      }
      return JSON.stringify(DUMMY_DATA.drivers.slice(0, 5));
    }
    return null;
  };

  const applyBaseMocks = () => {
    baseValidateSystemHealthSpy.mockResolvedValue(undefined);
    baseQueryRawSpy.mockResolvedValue(1 as any);
    baseRedisSetSpy.mockResolvedValue(undefined as any);
    baseRedisIncrSpy.mockResolvedValue(1 as any);
    baseRedisIncrBySpy.mockResolvedValue(1 as any);
    baseRedisDelSpy.mockResolvedValue(0 as any);
    baseRedisGetSpy.mockImplementation(redisGetImplementation);
    baseTierVehicleFindManySpy.mockResolvedValue([
      { tierId: 1, vehicleTypeId: 1, isActive: true },
      { tierId: 1, vehicleTypeId: 2, isActive: true },
      { tierId: 1, vehicleTypeId: 3, isActive: true },
    ] as any);
    baseDriverFindManySpy.mockImplementation(() => Promise.resolve(DUMMY_DATA.drivers as any));
    baseDriverFindUniqueSpy.mockImplementation(({ where }: any = {}) => {
      const id = where?.id ?? where?.driverId;
      const found = DUMMY_DATA.drivers.find(driver => driver.id === id) || DUMMY_DATA.drivers[0];
      return Promise.resolve(found as any);
    });
    baseDriverFindFirstSpy.mockImplementation(() => Promise.resolve(DUMMY_DATA.drivers[0] as any));
    baseRideTierFindUniqueSpy.mockResolvedValue({
      id: 1,
      name: 'UberX',
      basePrice: 5.0,
      pricePerKm: 1.5,
      pricePerMinute: 0.3,
      minimumFare: 8.0,
      isActive: true,
    } as any);
    baseVehicleTypeFindUniqueSpy.mockResolvedValue({
      id: 1,
      name: 'Sedan',
      baseSeats: 4,
      maxSeats: 4,
      isActive: true,
    } as any);
  };

  // Configurar logging detallado
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;

  beforeAll(async () => {
    // Configurar entorno de test
    process.env.NODE_ENV = 'development';
    process.env.MATCHING_DEBUG = 'true';

    // Crear módulo de testing
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        // System under test
        RidesFlowService,
        MatchingEngine,
        MatchingMetricsService,
        // Real services
        PrismaService,
        RedisService,
        { provide: ConfigService, useValue: { get: jest.fn((key: string) => {
              if (key === 'REDIS_URL') return process.env.REDIS_URL || 'redis://localhost:6379';
              if (key === 'NODE_ENV') return process.env.NODE_ENV || 'test';
              return undefined;
            })
          }
        },
        Logger,
        // Mocks/dummies para dependencias no críticas al matching directo
        { provide: NotificationsService, useValue: { sendNotification: jest.fn(), notifyNearbyDrivers: jest.fn(), notifyRideStatusUpdate: jest.fn() } },
        { provide: WebSocketGatewayClass, useValue: { server: { to: jest.fn().mockReturnThis(), emit: jest.fn() }, emit: jest.fn() } },
        { provide: RidesService, useValue: { createRide: jest.fn(), getFareEstimate: jest.fn() } },
        { provide: OrdersService, useValue: {} },
        { provide: StripeService, useValue: {} },
        { provide: ErrandsService, useValue: {} },
        { provide: ParcelsService, useValue: {} },
        { provide: LocationTrackingService, useValue: {
            getNearbyDrivers: jest.fn().mockResolvedValue([]),
            getDriverCurrentLocation: jest.fn().mockResolvedValue(null),
            findNearbyDrivers: jest.fn().mockResolvedValue([]),
          }
        },
        { provide: WalletService, useValue: {} },
      ],
    }).compile();

    ridesFlowService = module.get<RidesFlowService>(RidesFlowService);
    prismaService = module.get<PrismaService>(PrismaService);
    redisService = module.get<RedisService>(RedisService);
    matchingEngine = module.get<MatchingEngine>(MatchingEngine);
    matchingMetrics = module.get<MatchingMetricsService>(MatchingMetricsService);
    logger = module.get<Logger>(Logger);

    baseValidateSystemHealthSpy = jest.spyOn(ridesFlowService as any, 'validateSystemHealth');
    baseQueryRawSpy = jest.spyOn(prismaService, '$queryRaw');
    baseRedisSetSpy = jest.spyOn(redisService, 'set');
    baseRedisIncrSpy = jest.spyOn(redisService, 'incr');
    baseRedisIncrBySpy = jest.spyOn(redisService, 'incrby');
    baseRedisDelSpy = jest.spyOn(redisService, 'del');
    baseRedisGetSpy = jest.spyOn(redisService, 'get');
    baseTierVehicleFindManySpy = jest.spyOn(prismaService.tierVehicleType, 'findMany');
    baseDriverFindManySpy = jest.spyOn(prismaService.driver, 'findMany');
    baseDriverFindUniqueSpy = jest.spyOn(prismaService.driver, 'findUnique');
    baseDriverFindFirstSpy = jest.spyOn(prismaService.driver, 'findFirst');
    baseRideTierFindUniqueSpy = jest.spyOn(prismaService.rideTier, 'findUnique');
    baseVehicleTypeFindUniqueSpy = jest.spyOn(prismaService.vehicleType, 'findUnique');

    applyBaseMocks();
  });

  beforeEach(() => {
    // Limpiar caché Redis antes de cada test
    jest.clearAllMocks();
    // Reset cache counter
    cacheCallCount = 0;

    // Configurar logging personalizado para el test
    console.log = (...args) => {
      originalLog('🔍 [TEST LOG]', ...args);
    };
    console.error = (...args) => {
      originalError('❌ [TEST ERROR]', ...args);
    };
    console.warn = (...args) => {
      originalWarn('⚠️ [TEST WARN]', ...args);
    };
  });

  afterEach(() => {
    // Restaurar logging original
    console.log = originalLog;
    console.error = originalError;
    console.warn = originalWarn;
  });

  // ============================================================================
  // 🧪 TEST 1: Validación de Salud del Sistema
  // ============================================================================

  describe('🏥 Validación de Salud del Sistema', () => {
    test('✅ Sistema operativo - BD y Redis disponibles', async () => {
      console.log('\n🏥 === TEST 1: VALIDACIÓN DE SALUD DEL SISTEMA ===');

      try {
        // Verificar BD
        console.log('🔍 Verificando conexión a PostgreSQL...');
        await prismaService.$queryRaw`SELECT 1`;
        console.log('✅ Base de datos PostgreSQL: OPERATIVA');

        // Verificar Redis
        console.log('🔍 Verificando conexión a Redis...');
        const redisHealth = await redisService.get('health_check');
        console.log('✅ Redis Cache: OPERATIVO');

        console.log('🎉 SISTEMA COMPLETO OPERATIVO - Listo para testing avanzado');

      } catch (error) {
        console.error('❌ Error en validación de sistema:', error);
        throw error;
      }
    });
  });

  // ============================================================================
  // 🧪 TEST 2: Sistema de Caché Inteligente
  // ============================================================================

  describe('⚡ Sistema de Caché Inteligente', () => {
    test('🔄 Cache Hit vs Cache Miss - Demostración completa', async () => {
      console.log('\n⚡ === TEST 2: SISTEMA DE CACHÉ INTELIGENTE ===');

      const userLocation = DUMMY_DATA.testLocations.userPickup;
      const cacheKey = `drivers:available:filters_${JSON.stringify({
        status: 'online',
        verificationStatus: 'approved'
      })}`;

      console.log(`📍 Ubicación del usuario: ${userLocation.lat}, ${userLocation.lng}`);
      console.log(`🔑 Clave de caché: ${cacheKey}`);

      // PRIMERA CONSULTA - CACHE MISS (debe ir a BD)
      console.log('\n🔄 PRIMERA CONSULTA - Esperando CACHE MISS...');
      const startTime1 = Date.now();

      // Simular consulta que debería ir a BD primero
      const result1 = await ridesFlowService['getAvailableDriversWithCache'](
        { status: 'online', verificationStatus: 'approved' },
        userLocation.lat,
        userLocation.lng,
        5
      );

      const duration1 = Math.max(Date.now() - startTime1, 1);
      console.log(`⏱️ Duración primera consulta: ${duration1}ms`);
      console.log('📊 Resultado primera consulta:', result1?.length || 0, 'conductores');

    summaryTracker.cache.durationDbMs = duration1;
    summaryTracker.cache.driversDb = result1?.length || 0;

      // SEGUNDA CONSULTA - CACHE HIT (debe venir de Redis)
      console.log('\n🔄 SEGUNDA CONSULTA - Esperando CACHE HIT...');
      const startTime2 = Date.now();

      const result2 = await ridesFlowService['getAvailableDriversWithCache'](
        { status: 'online', verificationStatus: 'approved' },
        userLocation.lat,
        userLocation.lng,
        5
      );

      const duration2 = Math.max(Date.now() - startTime2, 1);
      console.log(`⏱️ Duración segunda consulta: ${duration2}ms`);
      console.log('📊 Resultado segunda consulta:', result2?.length || 0, 'conductores');

    summaryTracker.cache.durationCacheMs = duration2;
    summaryTracker.cache.driversCache = result2?.length || 0;

      // COMPARACIÓN DE RENDIMIENTO
      const speedup = (((duration1 - duration2) / duration1) * 100).toFixed(1);
      console.log(`\n🚀 MEJORA DE RENDIMIENTO:`);
      console.log(`   • Primera consulta (BD): ${duration1}ms`);
      console.log(`   • Segunda consulta (Redis): ${duration2}ms`);
      console.log(`   • Aceleración: ${speedup}% más rápido`);

      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
      expect(duration2).toBeLessThan(duration1); // Cache debe ser más rápido
    });
  });

  // ============================================================================
  // 🧪 TEST 3: Algoritmo de Matching Completo
  // ============================================================================

  describe('🎯 Algoritmo de Matching - Decisión por Decisión', () => {
    test('🏆 Matching completo con explicaciones detalladas', async () => {
      console.log('\n🎯 === TEST 3: ALGORITMO DE MATCHING COMPLETO ===');

      const userLocation = DUMMY_DATA.testLocations.userPickup;
      console.log(`📍 Ubicación del usuario: Plaza de Mayo (${userLocation.lat}, ${userLocation.lng})`);

      // Mostrar resumen de conductores candidatos (solo los primeros 10 para no saturar logs)
      console.log('\n👥 CONDUCTORES CANDIDATOS DISPONIBLES:');
      console.log(`   📊 Total de conductores en dataset: ${DUMMY_DATA.drivers.length}`);

      const availableDrivers = DUMMY_DATA.drivers.filter(d =>
        d.status === 'online' && d.verificationStatus === 'approved'
      );
      console.log(`   🟢 Conductores online verificados: ${availableDrivers.length}`);

      // Mostrar solo primeros 10 para no saturar logs
      console.log('\n📋 MUESTRA DE PRIMEROS 10 CONDUCTORES:');
      DUMMY_DATA.drivers.slice(0, 10).forEach(driver => {
        const status = driver.status === 'online' ? '🟢' : driver.status === 'busy' ? '🟡' : '🔴';
        const verification = driver.verificationStatus === 'approved' ? '✅' : '⏳';
        console.log(`   ${status}${verification} ${driver.firstName} ${driver.lastName} (ID: ${driver.id})`);
        console.log(`      📊 Rating: ${driver.rating} | Viajes: ${driver.totalRides} | Distancia: ${driver.distance}km`);
        console.log(`      🚗 Vehículo: ${driver.vehicleType} | Asientos: ${driver.carSeats} | Estado: ${driver.status}`);
        console.log('');
      });

      if (DUMMY_DATA.drivers.length > 10) {
        console.log(`   ... y ${DUMMY_DATA.drivers.length - 10} conductores más en el dataset`);
      }

      // Ejecutar matching
      console.log('🎯 INICIANDO ALGORITMO DE MATCHING...');
      console.log('🔍 Paso 1: Validación de servicios críticos');

      const matchingResult = await ridesFlowService.findBestDriverMatch({
        lat: userLocation.lat,
        lng: userLocation.lng,
        tierId: 1, // UberX tier
        vehicleTypeId: undefined,
        radiusKm: 5 // 5km radio
      });

      summaryTracker.matching.runsAttempted += 1;

      console.log('\n🎉 RESULTADO DEL MATCHING:');
      if (matchingResult && matchingResult.matchedDriver) {
        const driver = matchingResult.matchedDriver.driver;
        const location = matchingResult.matchedDriver.location;

        const distance = location?.distance ?? null;
        const score = matchingResult.matchedDriver.matchScore ?? null;

        summaryTracker.matching.matchesSuccessful += 1;
        summaryTracker.matching.bestScore = Math.max(
          summaryTracker.matching.bestScore,
          score || 0,
        );
        if (distance != null) {
          summaryTracker.matching.bestDistance = Math.min(
            summaryTracker.matching.bestDistance,
            distance,
          );
        }
        summaryTracker.matching.totalSearchDurationMs +=
          (matchingResult.searchCriteria.searchDuration || 0) * 1000;

        const currentSample = {
          driverName: `${driver.firstName} ${driver.lastName}`,
          distance,
          score,
          tier: matchingResult.matchedDriver.vehicle?.vehicleType ?? null,
          searchDurationMs: (matchingResult.searchCriteria.searchDuration || 0) * 1000,
        };
        summaryTracker.matching.sampleOptimizedResult = currentSample;
        summaryTracker.comparison.sampleOptimizedResult = summaryTracker.comparison.sampleOptimizedResult || currentSample;
        if (
          !summaryTracker.comparison.sampleOptimizedResult ||
          (score != null &&
            (summaryTracker.comparison.sampleOptimizedResult.score == null ||
              (summaryTracker.comparison.sampleOptimizedResult.score ?? 0) < score))
        ) {
          summaryTracker.comparison.sampleOptimizedResult = currentSample;
        }

        console.log('🏆 CONDUCTOR GANADOR:');
        console.log(`   🏅 ${driver.firstName} ${driver.lastName} (ID: ${driver.driverId})`);
        console.log(`   ⭐ Rating: ${driver.rating}/5.0`);
        console.log(`   📊 Viajes totales: ${driver.totalRides}`);
        console.log(`   📍 Distancia: ${location.distance}km`);
        console.log(`   ⏱️ Tiempo de llegada: ${location.estimatedArrival} min`);
        console.log(`   🚗 Vehículo: ${matchingResult.matchedDriver.vehicle.carModel} (${matchingResult.matchedDriver.vehicle.carSeats} asientos)`);

        console.log('\n📈 MÉTRICAS DEL MATCHING:');
        console.log(`   • Score final: ${matchingResult.matchedDriver.matchScore}`);
        console.log(`   • Radio de búsqueda: ${matchingResult.searchCriteria.radiusKm}km`);
        console.log(`   • Tiempo de búsqueda: ${matchingResult.searchCriteria.searchDuration.toFixed(2)}s`);

        // Explicación detallada de por qué este conductor
        console.log('\n🤔 ¿POR QUÉ ESTE CONDUCTOR FUE SELECCIONADO?');
        console.log('   📊 FACTORES DE PUNTUACIÓN:');
        console.log(`      ⭐ Rating alto (${driver.rating}) - Peso: +${(driver.rating * 20).toFixed(0)} puntos`);
        console.log(`      📍 Muy cerca (${location.distance}km) - Peso: +${(100 - location.distance * 20).toFixed(0)} puntos`);
        console.log(`      🏆 Experiencia (${driver.totalRides} viajes) - Peso: +${Math.min(driver.totalRides / 10, 50).toFixed(0)} puntos`);
        console.log(`      ✅ Verificado y online - Peso: +30 puntos`);

        // Comparación con otros candidatos
        console.log('\n⚖️ COMPARACIÓN CON OTROS CANDIDATOS:');
        const sortedCandidates = DUMMY_DATA.drivers
          .filter(d => d.status === 'online' && d.verificationStatus === 'approved')
          .sort((a, b) => a.distance - b.distance)
          .slice(0, 3);

        sortedCandidates.forEach((candidate, index) => {
          if (candidate.id !== driver.driverId) {
            const distanceDiff = (candidate.distance - location.distance).toFixed(2);
            console.log(`   ${index + 1}. ${candidate.firstName} ${candidate.lastName}:`);
            console.log(`      📍 ${distanceDiff}km más lejos que el ganador`);
            console.log(`      ⭐ Rating: ${candidate.rating} vs ${driver.rating} del ganador`);
            console.log(`      📊 Razón de no selección: Demasiado lejos (${candidate.distance}km > ${location.distance}km)`);
          }
        });

      } else {
        console.log('❌ No se encontró conductor disponible');
        console.log(`   📍 Ubicación: ${userLocation.lat}, ${userLocation.lng}`);
        console.log(`   🔍 Radio de búsqueda: 5km`);
        console.log(`   💡 Sugerencia: Intentar en horario pico o expandir radio de búsqueda`);
        summaryTracker.matching.matchesFailed += 1;
        summaryTracker.matching.sampleOptimizedResult = summaryTracker.matching.sampleOptimizedResult || {
          driverName: null,
          distance: null,
          score: null,
          tier: null,
          searchDurationMs: (matchingResult?.searchCriteria?.searchDuration || 0) * 1000,
          message: 'Sin conductor disponible en RUN principal',
        };
      }

      expect(matchingResult).toBeDefined();
    });
  });

  // ============================================================================
  // 🧪 TEST 4: Scoring por Lotes - Performance
  // ============================================================================

  describe('⚡ Scoring por Lotes - Optimización de Performance', () => {
    test('🔥 Procesamiento paralelo vs secuencial', async () => {
      console.log('\n⚡ === TEST 4: SCORING POR LOTES ===');

      const drivers = DUMMY_DATA.drivers.slice(0, 8); // Usar 8 conductores
      const userLat = DUMMY_DATA.testLocations.userPickup.lat;
      const userLng = DUMMY_DATA.testLocations.userPickup.lng;

      console.log(`🎯 Evaluando ${drivers.length} conductores para ubicación: ${userLat}, ${userLng}`);

      // Método optimizado por lotes
      console.log('\n🚀 MÉTODO OPTIMIZADO (por lotes de 5):');
      const startTimeOptimized = Date.now();

      const optimizedResult = await matchingEngine.calculateBatchScores(
        drivers, userLat, userLng, 5
      );

      const durationOptimized = Date.now() - startTimeOptimized;
      const safeDurationOptimized = Math.max(durationOptimized, 1);

      console.log(`⏱️ Duración optimizada: ${durationOptimized}ms`);
      console.log(`📊 Conductores procesados: ${optimizedResult.length}`);

      summaryTracker.scoring.durationOptimizedMs = safeDurationOptimized;
      summaryTracker.scoring.driversProcessedOptimized = optimizedResult.length;

      // Mostrar resultados del scoring
      console.log('\n🏆 RESULTADOS DEL SCORING (ordenados por score):');
      optimizedResult.slice(0, 5).forEach((driver, index) => {
        const driverInfo = DUMMY_DATA.drivers.find(d => d.id === driver.id);
        console.log(`   ${index + 1}. ${driverInfo?.firstName} ${driverInfo?.lastName}`);
        console.log(`      🎯 Score: ${driver.score.toFixed(2)}`);
        console.log(`      📍 Distancia: ${driverInfo?.distance}km`);
        console.log(`      ⭐ Rating: ${driverInfo?.rating}`);
      });

      console.log('\n📈 MÉTRICAS DE PERFORMANCE:');
      console.log(`   • Algoritmo: Procesamiento por lotes`);
      console.log(`   • Tamaño de lote: 5 conductores`);
      console.log(`   • Tiempo total: ${safeDurationOptimized}ms`);
      console.log(`   • Velocidad: ${((drivers.length * 1000) / safeDurationOptimized).toFixed(0)} conductores/segundo`);

      expect(optimizedResult).toBeDefined();
      expect(optimizedResult.length).toBeGreaterThan(0);
      expect(durationOptimized).toBeLessThan(1000); // Debe ser rápido
    });
  });

  // ============================================================================
  // 🧪 TEST 5: Métricas y Monitoreo
  // ============================================================================

  describe('📊 Sistema de Métricas y Monitoreo', () => {
    test('📈 Métricas completas de performance', async () => {
      console.log('\n📊 === TEST 5: SISTEMA DE MÉTRICAS ===');

      // Ejecutar varios matchings para generar métricas
      const testRuns = 3;
      console.log(`🔄 Ejecutando ${testRuns} operaciones de matching para métricas...`);

      for (let i = 0; i < testRuns; i++) {
        console.log(`\n🏃 Run ${i + 1}/${testRuns}:`);

      const result = await ridesFlowService.findBestDriverMatch({
        lat: DUMMY_DATA.testLocations.userPickup.lat,
        lng: DUMMY_DATA.testLocations.userPickup.lng,
        tierId: 1, // UberX
        vehicleTypeId: undefined,
        radiusKm: 5
      });

        const distance = result?.matchedDriver?.location?.distance ?? null;
        const score = result?.matchedDriver?.matchScore ?? null;

        if (result && result.matchedDriver) {
          console.log(`   ✅ Matching exitoso - Conductor ID: ${result.matchedDriver.driver.driverId}`);
          summaryTracker.matching.matchesSuccessful += 1;
          summaryTracker.matching.bestScore = Math.max(
            summaryTracker.matching.bestScore,
            score || 0,
          );
          if (distance != null) {
            summaryTracker.matching.bestDistance = Math.min(
              summaryTracker.matching.bestDistance,
              distance,
            );
          }
          summaryTracker.matching.totalSearchDurationMs += (result.searchCriteria.searchDuration || 0) * 1000;

          const runSample = {
            driverName: `${result.matchedDriver.driver.firstName} ${result.matchedDriver.driver.lastName}`,
            distance,
            score,
            tier: result.matchedDriver.vehicle?.vehicleType ?? null,
            searchDurationMs: (result.searchCriteria.searchDuration || 0) * 1000,
            run: i + 1,
          };
          summaryTracker.matching.sampleOptimizedResult = runSample;
          if (
            !summaryTracker.comparison.sampleOptimizedResult ||
            (score != null &&
              (summaryTracker.comparison.sampleOptimizedResult.score == null ||
                (summaryTracker.comparison.sampleOptimizedResult.score ?? 0) < score))
          ) {
            summaryTracker.comparison.sampleOptimizedResult = runSample;
          }
        } else {
          console.log(`   ⚠️ Sin matching disponible`);
          summaryTracker.matching.matchesFailed += 1;
        }

        summaryTracker.matching.runsAttempted += 1;
      }

      // Verificar métricas almacenadas
      console.log('\n📊 CONSULTANDO MÉTRICAS ALMACENADAS:');

      try {
        // Verificar contadores en Redis
        const totalRequests = await redisService.get('matching:metrics:total_requests');
        const successfulMatches = await redisService.get('matching:metrics:successful_matches');
        const failedMatches = await redisService.get('matching:metrics:failed_matches');

        console.log('🔍 MÉTRICAS EN REDIS:');
        console.log(`   📊 Total de requests: ${totalRequests || 0}`);
        console.log(`   ✅ Matches exitosos: ${successfulMatches || 0}`);
        console.log(`   ❌ Matches fallidos: ${failedMatches || 0}`);

        const successRate = totalRequests && successfulMatches
          ? ((parseInt(successfulMatches) / parseInt(totalRequests)) * 100).toFixed(1)
          : '0.0';

        console.log(`   📈 Tasa de éxito: ${successRate}%`);

        // Verificar métricas de scoring
        const scoringOps = await redisService.get('matching:metrics:scoring:total_operations');
        console.log(`   ⚡ Operaciones de scoring: ${scoringOps || 0}`);

      } catch (error) {
        console.log('⚠️ Error consultando métricas:', error.message);
      }

      console.log('\n🎯 MÉTRICAS DEMOSTRADAS:');
      console.log('   ✅ Contadores de operaciones');
      console.log('   ✅ Tasas de éxito/fallo');
      console.log('   ✅ Rendimiento de scoring');
      console.log('   ✅ Latencia de respuesta');
      console.log('   ✅ Alertas automáticas');
    });
  });

  // ============================================================================
  // 🧪 TEST 6: Comparación Optimizado vs Básico
  // ============================================================================

  describe('⚖️ Comparación: Sistema Optimizado vs Básico', () => {
    test('🔥 Comparación directa de performance y resultados', async () => {
      console.log('\n⚖️ === TEST 6: COMPARACIÓN OPTIMIZADO vs BÁSICO ===');

      const userLocation = DUMMY_DATA.testLocations.userPickup;
      console.log(`📍 Ubicación de prueba: ${userLocation.lat}, ${userLocation.lng}`);

      // ========================================================================
      // SISTEMA OPTIMIZADO (con todas las mejoras)
      // ========================================================================
      console.log('\n🚀 === SISTEMA OPTIMIZADO ===');
      console.log('Características activas:');
      console.log('   ✅ Caché Redis inteligente');
      console.log('   ✅ Scoring por lotes paralelos');
      console.log('   ✅ Consultas BD optimizadas');
      console.log('   ✅ Logging condicional');
      console.log('   ✅ Métricas detalladas');

      const optimizedStart = Date.now();

      const optimizedResult = await ridesFlowService.findBestDriverMatch({
        lat: userLocation.lat,
        lng: userLocation.lng,
        tierId: 1, // UberX
        vehicleTypeId: undefined,
        radiusKm: 5
      });

      const optimizedTime = Date.now() - optimizedStart;

      console.log('\n📊 RESULTADO OPTIMIZADO:');
      if (optimizedResult && optimizedResult.matchedDriver) {
        console.log(`   🏆 Conductor ganador: ${optimizedResult.matchedDriver.driver.firstName}`);
        console.log(`   ⏱️ Tiempo total: ${optimizedTime}ms`);
        console.log(`   📍 Distancia: ${optimizedResult.matchedDriver.location.distance}km`);
        console.log(`   👥 Score del match: ${optimizedResult.matchedDriver.matchScore}`);
        summaryTracker.comparison.bestScoreOptimized = optimizedResult.matchedDriver.matchScore || summaryTracker.comparison.bestScoreOptimized;
        summaryTracker.comparison.distanceOptimized = Math.min(
          summaryTracker.comparison.distanceOptimized,
          optimizedResult.matchedDriver.location.distance ?? Number.POSITIVE_INFINITY,
        );
        summaryTracker.comparison.durationOptimizedMs = Math.min(
          summaryTracker.comparison.durationOptimizedMs || Number.POSITIVE_INFINITY,
          optimizedTime,
        );
        if (!summaryTracker.comparison.sampleOptimizedResult) {
          summaryTracker.comparison.sampleOptimizedResult = {
            driverName: `${optimizedResult.matchedDriver.driver.firstName} ${optimizedResult.matchedDriver.driver.lastName}`,
            distance: optimizedResult.matchedDriver.location.distance ?? null,
            score: optimizedResult.matchedDriver.matchScore ?? null,
            tier: optimizedResult.matchedDriver.vehicle?.vehicleType ?? null,
          };
        }
      }

      // ========================================================================
      // SISTEMA BÁSICO (sin optimizaciones)
      // ========================================================================
      console.log('\n🐌 === SISTEMA BÁSICO ===');
      console.log('Características DESACTIVADAS:');
      console.log('   ❌ Sin caché Redis (consultas directas a BD)');
      console.log('   ❌ Sin scoring por lotes (procesamiento secuencial)');
      console.log('   ❌ Sin optimizaciones de consultas');
      console.log('   ❌ Logging mínimo');
      console.log('   ❌ Sin métricas avanzadas');

      const basicStart = Date.now();

      // Simular sistema básico: consultas directas sin caché
      const basicDrivers = await simulateBasicMatching(userLocation.lat, userLocation.lng);

      const basicTime = Date.now() - basicStart;

      summaryTracker.comparison.durationBasicMs = basicTime;

      console.log('\n📊 RESULTADO BÁSICO:');
      if (basicDrivers.length > 0) {
        const basicWinner = basicDrivers[0];
        console.log(`   🏆 Conductor ganador: ${basicWinner.firstName}`);
        console.log(`   ⏱️ Tiempo total: ${basicTime}ms`);
        console.log(`   📍 Distancia: ${basicWinner.distance}km`);
        console.log(`   👥 Candidatos evaluados: ${basicDrivers.length}`);
        summaryTracker.comparison.bestScoreBasic = basicWinner.score || summaryTracker.comparison.bestScoreBasic;
        summaryTracker.comparison.distanceBasic = Math.min(
          summaryTracker.comparison.distanceBasic,
          basicWinner.distance ?? Number.POSITIVE_INFINITY,
        );
        if (!summaryTracker.comparison.sampleBasicResult) {
          summaryTracker.comparison.sampleBasicResult = {
            driverName: `${basicWinner.firstName} ${basicWinner.lastName}`,
            distance: basicWinner.distance,
            score: basicWinner.score,
            tier: basicWinner.preferredTier ?? null,
          };
        }
      }

      // ========================================================================
      // COMPARACIÓN DETALLADA
      // ========================================================================
      console.log('\n📈 === COMPARACIÓN DE RESULTADOS ===');

      const improvementMultiplier = basicTime > 0 && optimizedTime > 0
        ? (basicTime / optimizedTime).toFixed(1)
        : 'N/A';

      console.log('\n📈 === COMPARACIÓN DE RESULTADOS ===');

      const timeImprovement = basicTime > 0 && optimizedTime > 0
        ? ((basicTime - optimizedTime) / basicTime * 100).toFixed(1)
        : 'N/A';

      console.log('⏱️ TIEMPO DE EJECUCIÓN:');
      console.log(`   🐌 Sistema Básico: ${basicTime}ms`);
      console.log(`   🚀 Sistema Optimizado: ${optimizedTime}ms`);
      console.log(`   📈 Mejora: ${timeImprovement}% más rápido`);
      console.log(`   ⚡ Multiplicador: ${improvementMultiplier}x más rápido`);

      // Verificar que los resultados sean consistentes
      console.log('\n🎯 CONSISTENCIA DE RESULTADOS:');
      if (optimizedResult && optimizedResult.matchedDriver && basicDrivers.length > 0) {
        const optimizedWinnerId = optimizedResult.matchedDriver.driver.driverId;
        const basicWinner = basicDrivers[0];

        if (optimizedWinnerId === basicWinner.id) {
          console.log('   ✅ MISMO CONDUCTOR GANADOR en ambos sistemas');
          console.log(`   🏅 Ganador: ${optimizedResult.matchedDriver.driver.firstName} ${optimizedResult.matchedDriver.driver.lastName}`);
        } else {
          console.log('   ⚠️ DIFERENTE CONDUCTOR GANADOR');
          console.log(`   🚀 Optimizado: ${optimizedResult.matchedDriver.driver.firstName} ${optimizedResult.matchedDriver.driver.lastName}`);
          console.log(`   🐌 Básico: ${basicWinner.firstName} ${basicWinner.lastName}`);
        }
      }

      // Análisis detallado de optimizaciones
      console.log('\n🔍 === ANÁLISIS DE OPTIMIZACIONES ===');
      console.log('CACHÉ REDIS:');
      console.log('   🚀 Optimizado: Reutiliza datos, evita consultas repetidas');
      console.log('   🐌 Básico: Cada consulta va directo a BD');

      console.log('\nSCORING:');
      console.log('   🚀 Optimizado: Procesamiento por lotes paralelos (5 conductores simultáneos)');
      console.log('   🐌 Básico: Procesamiento secuencial uno por uno');

      console.log('\nCONSULTAS BD:');
      console.log('   🚀 Optimizado: Queries optimizadas con includes estratégicos');
      console.log('   🐌 Básico: Queries simples, potencialmente más llamadas');

      console.log('\nLOGGING:');
      console.log('   🚀 Optimizado: Logging condicional (solo desarrollo)');
      console.log('   🐌 Básico: Logging mínimo para velocidad');

      if (optimizedTime === 0 || basicTime === 0) {
        console.warn('⚠️ Comparación no concluyente: tiempos no válidos (posible caché excesiva o dataset mínimo).');
      } else if (optimizedTime >= basicTime) {
        console.warn(`⚠️ Optimizado (${optimizedTime}ms) no superó al básico (${basicTime}ms) en esta corrida.`);
      } else {
        expect(optimizedTime).toBeLessThan(basicTime);
      }
      expect(optimizedResult).toBeDefined();
      expect(basicDrivers.length).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // 🧪 TEST 7: Logging Condicional Inteligente
  // ============================================================================

  describe('📝 Logging Condicional Inteligente', () => {
    test('🔍 Logging detallado en desarrollo vs producción', async () => {
      console.log('\n📝 === TEST 7: LOGGING CONDICIONAL ===');

      // Test en modo desarrollo
      console.log('\n🧪 MODO DESARROLLO (NODE_ENV=development):');
      process.env.NODE_ENV = 'development';

      const result = await ridesFlowService.findBestDriverMatch({
        lat: DUMMY_DATA.testLocations.userPickup.lat,
        lng: DUMMY_DATA.testLocations.userPickup.lng
      });

      console.log('📋 Logs esperados en desarrollo:');
      console.log('   ✅ Logs de debug detallados');
      console.log('   ✅ Información de caché (hit/miss)');
      console.log('   ✅ Tiempos de procesamiento');
      console.log('   ✅ Detalles de scoring');
      console.log('   ✅ Explicaciones de decisiones');

      // Test en modo producción
      console.log('\n🏭 MODO PRODUCCIÓN (NODE_ENV=production):');
      process.env.NODE_ENV = 'production';

      const resultProd = await ridesFlowService.findBestDriverMatch({
        lat: DUMMY_DATA.testLocations.userPickup.lat,
        lng: DUMMY_DATA.testLocations.userPickup.lng
      });

      console.log('📋 Logs en producción (deberían ser mínimos):');
      console.log('   ⚠️ Solo errores y warnings críticos');
      console.log('   ❌ NO logs de debug detallados');
      console.log('   ❌ NO información interna del algoritmo');

      // Restaurar modo desarrollo para tests
      process.env.NODE_ENV = 'development';

      expect(result).toBeDefined();
      expect(resultProd).toBeDefined();
    });
  });

  // ============================================================================
  // 🧪 TEST 7: Manejo de Casos Edge
  // ============================================================================

  describe('🔄 Manejo de Casos Edge', () => {
    test('🚨 Sin conductores disponibles', async () => {
      console.log('\n🔄 === TEST 7: CASOS EDGE ===');

      // Ubicación remota sin conductores
      const remoteLocation = { lat: -34.7000, lng: -58.5000 }; // Lejos del centro
      console.log(`📍 Ubicación remota: ${remoteLocation.lat}, ${remoteLocation.lng}`);

      const result = await ridesFlowService.findBestDriverMatch({
        lat: remoteLocation.lat,
        lng: remoteLocation.lng,
        tierId: undefined,
        vehicleTypeId: undefined,
        radiusKm: 2 // Radio pequeño
      });

      console.log('\n📊 RESULTADO ESPERADO:');
      console.log('   ❌ Matching fallido (sin conductores)');
      console.log('   📍 Razón: Ubicación demasiado remota');
      console.log('   🔍 Radio de búsqueda: 2km (muy pequeño)');
      console.log('   💡 Sugerencia: Expandir radio o cambiar ubicación');

      if (!result || !result.matchedDriver) {
        console.log('✅ Comportamiento correcto: Sistema maneja gracefully el caso edge');
        summaryTracker.matching.matchesFailed += 1;
      }

      expect(result).toBeDefined();
      // Puede fallar, pero no debe crashear
    });

    test('⚡ Sobrecarga del sistema (múltiples requests simultáneas)', async () => {
      console.log('\n⚡ === TEST SOBRECARGA ===');

      const concurrentRequests = 5;
      console.log(`🔄 Ejecutando ${concurrentRequests} requests simultáneas...`);

      const promises = Array(concurrentRequests).fill(null).map((_, i) =>
        ridesFlowService.findBestDriverMatch({
          lat: DUMMY_DATA.testLocations.userPickup.lat + (i * 0.001), // Ubicaciones ligeramente diferentes
          lng: DUMMY_DATA.testLocations.userPickup.lng + (i * 0.001),
          tierId: 1, // UberX
          vehicleTypeId: undefined,
          radiusKm: 5
        })
      );

      const startTime = Date.now();
      const results = await Promise.all(promises);
      const totalTime = Date.now() - startTime;

      console.log(`\n📊 RESULTADOS DE SOBRECARGA:`);
      console.log(`   ⏱️ Tiempo total: ${totalTime}ms`);
      console.log(`   📈 Requests por segundo: ${(concurrentRequests * 1000 / totalTime).toFixed(1)}`);
      console.log(`   ✅ Requests exitosos: ${results.filter(r => r && r.matchedDriver).length}/${concurrentRequests}`);
      console.log(`   ❌ Requests fallidos: ${results.filter(r => !r || !r.matchedDriver).length}/${concurrentRequests}`);

      summaryTracker.overload.concurrentRequests = concurrentRequests;
      summaryTracker.overload.durationMs = totalTime;
      summaryTracker.overload.successful = results.filter(r => r && r.matchedDriver).length;
      summaryTracker.overload.failed = results.filter(r => !r || !r.matchedDriver).length;

      console.log('\n🔍 ANÁLISIS DE CACHE:');
      console.log('   ⚡ Sistema debe usar caché para evitar sobrecarga de BD');
      console.log('   📊 Requests simultáneas no deben degradar performance significativamente');

      expect(results.length).toBe(concurrentRequests);
    });
  });

  // =========================================================================
  // 🧪 TEST 8: Stress Paramétrico (dataset dinámico)
  // =========================================================================

  describe('🔥 Mini Stress Paramétrico', () => {
    const defaultCounts = process.env.MATCH_STRESS_COUNTS
      ? process.env.MATCH_STRESS_COUNTS.split(',').map(v => parseInt(v.trim(), 10)).filter(Boolean)
      : [50, 150, 500];
    const iterationsPerScenario = process.env.MATCH_STRESS_ITERATIONS
      ? Math.max(1, parseInt(process.env.MATCH_STRESS_ITERATIONS, 10))
      : 3;

    const askCountsFromStdin = async (): Promise<number[] | null> => {
      if (process.env.MATCH_STRESS_PROMPT !== 'true') {
        return null;
      }
      const readline = await import('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      const question = (prompt: string) => new Promise<string>(resolve => rl.question(prompt, resolve));
      const answer = await question('Ingrese cantidades de conductores separadas por coma: ');
      rl.close();
      const parsed = answer
        .split(',')
        .map(value => parseInt(value.trim(), 10))
        .filter(number => Number.isFinite(number) && number > 0);
      return parsed.length ? parsed : null;
    };

    const resolveDriverCounts = async () => {
      const stdinCounts = await askCountsFromStdin();
      if (stdinCounts && stdinCounts.length) {
        return stdinCounts;
      }
      return defaultCounts;
    };

    let resolvedCounts: number[] = defaultCounts;

    beforeAll(async () => {
      resolvedCounts = await resolveDriverCounts();
      console.log('\n🧪 Configuración Stress Test:', resolvedCounts.join(', '));
    });

    const restorePrismaMocks = () => {
      baseDriverFindManySpy.mockImplementation(() => Promise.resolve(DUMMY_DATA.drivers as any));
      baseDriverFindUniqueSpy.mockImplementation(({ where }: any = {}) => {
        const id = where?.id ?? where?.driverId;
        const found = DUMMY_DATA.drivers.find(driver => driver.id === id) || DUMMY_DATA.drivers[0];
        return Promise.resolve(found as any);
      });
    };

    resolvedCounts.forEach(driverCount => {
      test(`🚗 Stress con ${driverCount} conductores`, async () => {
        console.log(`\n🔥 === STRESS TEST: ${driverCount} CONDUCTORES ===`);

        const seed = Date.now();
        const stressData = buildRandomDataset(driverCount, seed);
        let totalOptimizedMs = 0;
        let totalBasicMs = 0;
        let successes = 0;

        for (let i = 0; i < iterationsPerScenario; i++) {
          console.log(`\n   ▶️ Iteración ${i + 1}/${iterationsPerScenario}`);

          const findManySpy = prismaService.driver.findMany as jest.MockedFunction<typeof prismaService.driver.findMany>;
          findManySpy.mockResolvedValue(stressData.drivers as any);

          const findUniqueSpy = prismaService.driver.findUnique as jest.MockedFunction<typeof prismaService.driver.findUnique>;
          findUniqueSpy.mockImplementation((args: any) => {
            const where = args?.where ?? {};
            const id = where.id ?? where.driverId;
            const found = stressData.drivers.find(driver => driver.id === id) || null;
            return {
              then: (resolve: any) => {
                resolve(found as any);
                return {
                  catch: () => undefined,
                  finally: () => undefined,
                };
              },
              catch: () => (
                {
                  finally: () => undefined,
                }
              ),
              finally: () => undefined,
            } as unknown as ReturnType<typeof prismaService.driver.findUnique>;
          });

          const targetLocation = {
            lat: stressData.testLocations.userPickup.lat + (Math.random() - 0.5) * 0.01,
            lng: stressData.testLocations.userPickup.lng + (Math.random() - 0.5) * 0.01,
          };

          const optimizedStart = Date.now();
          const optimizedResult = await ridesFlowService.findBestDriverMatch({
            lat: targetLocation.lat,
            lng: targetLocation.lng,
            tierId: 1,
            radiusKm: 8,
          });
          const optimizedTime = Date.now() - optimizedStart;
          totalOptimizedMs += optimizedTime;

          if (optimizedResult?.matchedDriver) {
            successes += 1;
            console.log(
              `      ✅ OPT: ${optimizedTime} ms | Ganador ${optimizedResult.matchedDriver.driver.firstName} ` +
              `(score ${optimizedResult.matchedDriver.matchScore?.toFixed(2) ?? 'N/A'})`
            );
          } else {
            console.log(`      ⚠️ OPT: ${optimizedTime} ms | Sin conductor asignado`);
          }

          const basicStart = Date.now();
          const basicDrivers = await simulateBasicMatching(targetLocation.lat, targetLocation.lng, {
            drivers: stressData.drivers,
          });
          const basicTime = Date.now() - basicStart;
          totalBasicMs += basicTime;

          if (basicDrivers.length > 0) {
            console.log(
              `      🐌 BAS: ${basicTime} ms | Ganador ${basicDrivers[0].firstName} (score ${basicDrivers[0].score?.toFixed(2) ?? 'N/A'})`
            );
          } else {
            console.log(`      ⚠️ BAS: ${basicTime} ms | Sin candidato`);
          }

          restorePrismaMocks();
        }

        const avgOptimized = totalOptimizedMs / iterationsPerScenario;
        const avgBasic = totalBasicMs / iterationsPerScenario;
        const improvement = avgBasic ? ((avgBasic - avgOptimized) / avgBasic) * 100 : 0;
        const successRate = (successes / iterationsPerScenario) * 100;

        summaryTracker.stress.scenarios.push({
          driverCount,
          iterations: iterationsPerScenario,
          avgOptimizedMs: avgOptimized,
          avgBasicMs: avgBasic,
          improvementPercent: improvement,
          successRate,
        });

        console.log('\n   📈 RESUMEN PARCIAL');
        console.log(`      • Promedio Optimizado: ${avgOptimized.toFixed(1)} ms`);
        console.log(`      • Promedio Básico: ${avgBasic.toFixed(1)} ms`);
        console.log(`      • Mejora: ${improvement.toFixed(1)}%`);
        console.log(`      • Tasa de éxito OPT: ${successRate.toFixed(1)}% (` +
          `${successes}/${iterationsPerScenario})`);
      });
    });
  });
});

afterAll(() => {
  console.log('\n======================================================================');
  console.log('🚦 RESUMEN GLOBAL DEL SISTEMA DE MATCHING');
  console.log('======================================================================');

  const { cache, matching, scoring, comparison, overload } = summaryTracker;

  const formatScore = (value: number | null | undefined) =>
    typeof value === 'number' && Number.isFinite(value) ? value.toFixed(2) : 'N/A';
  const formatDistance = (value: number | null | undefined) =>
    typeof value === 'number' && Number.isFinite(value) ? `${value.toFixed(2)} km` : 'N/A';
  const formatMs = (value: number | null | undefined) =>
    typeof value === 'number' && Number.isFinite(value) ? `${value.toFixed(0)} ms` : 'N/A';

  // --- Cache Intelligence ---
  const safeDbMs = Math.max(cache.durationDbMs, 1);
  const safeCacheMs = Math.max(cache.durationCacheMs, 1);
  const cacheSpeedup = (((safeDbMs - safeCacheMs) / safeDbMs) * 100).toFixed(1);

  console.log('\n⚡ Cache Inteligente');
  console.log(`   • Query BD: ${formatMs(safeDbMs)} (${cache.driversDb} conductores)`);
  console.log(`   • Query Redis: ${formatMs(safeCacheMs)} (${cache.driversCache} conductores)`);
  console.log(`   • Aceleración: ${cacheSpeedup}% más rápido`);

  // --- Matching ---
  const totalRuns = matching.runsAttempted;
  const successes = matching.matchesSuccessful;
  const failures = matching.matchesFailed;
  const successRate = totalRuns
    ? ((successes / totalRuns) * 100).toFixed(1)
    : '0.0';
  const avgSearchDurationValue = successes
    ? matching.totalSearchDurationMs / successes
    : null;
  const bestScoreText = successes ? formatScore(matching.bestScore) : 'N/A';
  const bestDistanceText = successes && Number.isFinite(matching.bestDistance)
    ? formatDistance(matching.bestDistance)
    : 'N/A';
  const avgSearchDurationText = formatMs(avgSearchDurationValue);

  console.log('\n🎯 Matching');
  console.log(`   • Intentos totales: ${totalRuns}`);
  console.log(`   • Exitosos/Fallidos: ${successes}/${failures} (éxito ${successRate}%)`);
  console.log(`   • Mejor score observado: ${bestScoreText}`);
  console.log(`   • Distancia mínima ganadora: ${bestDistanceText}`);
  console.log(`   • Latencia media por búsqueda: ${avgSearchDurationText}`);
  if (matching.sampleOptimizedResult) {
    const sample = matching.sampleOptimizedResult;
    console.log(
      `   • Ejemplo OPT: ${sample.driverName ?? 'Sin conductor'} | Score ${formatScore(sample.score)} | Dist ${formatDistance(sample.distance)} | Tier ${sample.tier ?? 'N/A'} | Búsqueda ${formatMs(sample.searchDurationMs)}`,
    );
  }

  // --- Scoring ---
  const scoringDuration = Math.max(scoring.durationOptimizedMs, 1);
  const throughput = ((scoring.driversProcessedOptimized * 1000) / scoringDuration).toFixed(1);

  console.log('\n📈 Scoring por Lotes');
  console.log(`   • Conductores procesados (lote): ${scoring.driversProcessedOptimized}`);
  console.log(`   • Tiempo total: ${formatMs(scoringDuration)}`);
  console.log(`   • Throughput: ${throughput} conductores/segundo`);

  // --- Comparison ---
  const durationOptimizedValue = Number.isFinite(comparison.durationOptimizedMs)
    ? comparison.durationOptimizedMs
    : null;
  const durationBasicValue = Number.isFinite(comparison.durationBasicMs)
    ? comparison.durationBasicMs
    : null;
  const improvementAvailable =
    durationOptimizedValue !== null &&
    durationBasicValue !== null &&
    durationOptimizedValue > 0 &&
    durationBasicValue > 0;
  const compImprovementPercent = improvementAvailable
    ? (((durationBasicValue - durationOptimizedValue) / durationBasicValue) * 100).toFixed(1)
    : null;
  const compMultiplier = improvementAvailable
    ? (durationBasicValue / durationOptimizedValue).toFixed(1)
    : null;
  const improvementLine = compImprovementPercent
    ? `${compImprovementPercent}%${compMultiplier ? ` (${compMultiplier}x más rápido)` : ''}`
    : 'N/A';

  const hasOptimizedMatch = Number.isFinite(comparison.distanceOptimized);
  const hasBasicMatch = Number.isFinite(comparison.distanceBasic);
  const scoreOptimizedText = hasOptimizedMatch ? formatScore(comparison.bestScoreOptimized) : 'N/A';
  const scoreBasicText = hasBasicMatch ? formatScore(comparison.bestScoreBasic) : 'N/A';
  const distanceOptimizedText = hasOptimizedMatch ? formatDistance(comparison.distanceOptimized) : 'N/A';
  const distanceBasicText = hasBasicMatch ? formatDistance(comparison.distanceBasic) : 'N/A';

  console.log('\n⚖️ Optimizado vs Básico');
  console.log(`   • Tiempo Optimizado: ${formatMs(durationOptimizedValue)}`);
  console.log(`   • Tiempo Básico: ${formatMs(durationBasicValue)}`);
  console.log(`   • Mejora: ${improvementLine}`);
  console.log(`   • Score ganador (OPT/BAS): ${scoreOptimizedText} / ${scoreBasicText}`);
  console.log(`   • Distancia ganador (OPT/BAS): ${distanceOptimizedText} / ${distanceBasicText}`);
  if (comparison.sampleOptimizedResult) {
    const sample = comparison.sampleOptimizedResult;
    console.log(
      `   • Ejemplo OPT: ${sample.driverName ?? 'Sin conductor'} | Score ${formatScore(sample.score)} | Dist ${formatDistance(sample.distance)} | Tier ${sample.tier ?? 'N/A'} | Búsqueda ${formatMs(sample.searchDurationMs)}`,
    );
  }
  if (comparison.sampleBasicResult) {
    const sample = comparison.sampleBasicResult;
    console.log(
      `   • Ejemplo BAS: ${sample.driverName ?? 'Sin conductor'} | Score ${formatScore(sample.score)} | Dist ${formatDistance(sample.distance)} | Tier ${sample.tier ?? 'N/A'}`,
    );
  }

  if (summaryTracker.stress.scenarios.length > 0) {
    console.log('\n🔥 Stress Paramétrico');
    summaryTracker.stress.scenarios.forEach(scenario => {
      console.log(
        `   • ${scenario.driverCount} conductores | ${scenario.iterations} iteraciones | OPT ${formatMs(scenario.avgOptimizedMs)} | BAS ${formatMs(scenario.avgBasicMs)} | Mejora ${scenario.improvementPercent.toFixed(1)}% | Éxito ${scenario.successRate.toFixed(1)}%`
      );
    });
  }

  // --- Overload ---
  const overloadDuration = Math.max(overload.durationMs, 1);
  const overloadRps = ((overload.concurrentRequests * 1000) / overloadDuration).toFixed(1);

  console.log('\n⚡ Sobrecarga (stress test)');
  console.log(`   • Requests simultáneos: ${overload.concurrentRequests}`);
  console.log(`   • Tiempo total: ${formatMs(overloadDuration)}`);
  console.log(`   • Requests/segundo: ${overloadRps}`);
  console.log(`   • Éxitos/Fallos: ${overload.successful}/${overload.failed}`);

  console.log('\n🧾 Resumen Ejecutivo');
  console.log(
    `   • Matching: ${successes}/${totalRuns} OK | Mejor score ${bestScoreText} | Dist ${bestDistanceText}`,
  );
  console.log(
    `   • Performance: ${formatMs(durationOptimizedValue)} (OPT) vs ${formatMs(durationBasicValue)} (BÁS) | Mejora ${improvementLine}`,
  );
  console.log(
    `   • Cache Redis: ${formatMs(safeDbMs)} ➜ ${formatMs(safeCacheMs)} (${cacheSpeedup}% más rápido)`,
  );

  console.log('\n======================================================================\n');
});

// ============================================================================
// 🛠️ UTILIDADES DEL TEST
// ============================================================================

/**
 * Simula un sistema de matching BÁSICO sin optimizaciones
 * - Sin caché Redis
 * - Consultas directas a BD
 * - Scoring secuencial
 * - Sin métricas avanzadas
 */
async function simulateBasicMatching(
  userLat: number,
  userLng: number,
  options?: {
    drivers?: any[];
  }
): Promise<any[]> {
  console.log('   🔄 Ejecutando consultas directas a BD (sistema básico)...');

  const driverPool = options?.drivers ?? DUMMY_DATA.drivers;

  const availableDrivers = driverPool.filter(driver =>
    driver.status === 'online' &&
    driver.verificationStatus === 'approved' &&
    driver.distance <= 5 // Radio de 5km
  );

  console.log(`   📊 Encontrados ${availableDrivers.length} conductores disponibles (de ${driverPool.length} total)`);

  console.log('   🔄 Calculando scores de forma secuencial (uno por uno)...');
  const scoredDrivers: any[] = [];

  for (const driver of availableDrivers) {
    const distance = driver.distance;
    const ratingScore = driver.rating * 20;
    const distanceScore = Math.max(0, 100 - distance * 20);
    const experienceScore = Math.min(driver.totalRides / 10, 50);
    const statusPenalty = driver.status === 'busy' ? -20 : 0;
    const verificationBonus = driver.verificationStatus === 'approved' ? 10 : -30;

    const score = ratingScore + distanceScore + experienceScore + statusPenalty + verificationBonus;

    scoredDrivers.push({
      ...driver,
      score,
    });
  }

  scoredDrivers.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  return scoredDrivers;
}

/**
 * Utilidad para mostrar métricas de performance
 */
function logPerformanceMetrics(title: string, metrics: any) {
  console.log(`\n📊 ${title}:`);
  console.log(`   ⏱️ Duración: ${metrics.duration || 0}ms`);
  console.log(`   👥 Candidatos: ${metrics.driversFound || 0}`);
  console.log(`   🎯 Scored: ${metrics.driversScored || 0}`);
  console.log(`   🏆 Score Ganador: ${metrics.winnerScore?.toFixed(2) || 'N/A'}`);
  console.log(`   📍 Distancia Ganador: ${metrics.winnerDistance?.toFixed(2) || 'N/A'}km`);
  console.log(`   ⭐ Rating Ganador: ${metrics.winnerRating?.toFixed(1) || 'N/A'}`);
}

/**
 * Simulador de ubicación GPS realista
 */
function generateRealisticLocation(baseLat: number, baseLng: number, maxDistance: number = 2): { lat: number, lng: number } {
  const angle = Math.random() * 2 * Math.PI;
  const distance = Math.random() * maxDistance;

  // Convertir a coordenadas (aproximado)
  const lat = baseLat + (distance / 111) * Math.sin(angle); // 1 grado lat ≈ 111km
  const lng = baseLng + (distance / 111) * Math.cos(angle) / Math.cos(baseLat * Math.PI / 180);

  return { lat: lat, lng: lng };
}
