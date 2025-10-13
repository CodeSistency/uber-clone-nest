import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  SearchSession,
  SearchStatus,
  SearchCriteria,
  MatchedDriverInfo,
  AsyncSearchResult,
  MatchingWebSocketEvent,
  AsyncMatchingConfig,
} from '../flow/dto/async-matching.interfaces';
import { WebSocketGatewayClass } from '../../websocket/websocket.gateway';
import {
  DriverEventsService,
  DriverOnlineEvent,
} from '../../common/events/driver-events.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AsyncMatchingService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AsyncMatchingService.name);
  private searchSessions: Map<string, SearchSession> = new Map();
  private searchIntervals: Map<string, NodeJS.Timeout> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  // Configuración por defecto
  private readonly config: AsyncMatchingConfig = {
    defaultMaxWaitTime: 300, // 5 minutos
    searchInterval: 10000, // 10 segundos
    maxConcurrentSearches: 100,
    cleanupInterval: 60000, // 1 minuto
    priorityWeights: {
      high: 3, // 3x más frecuente
      normal: 1, // frecuencia normal
      low: 0.5, // 2x menos frecuente
    },
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly websocketGateway: WebSocketGatewayClass,
    private readonly driverEventsService: DriverEventsService,
  ) {}

  onModuleInit() {
    // Iniciar limpieza automática de sesiones expiradas
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredSessions();
    }, this.config.cleanupInterval);

    // Suscribirse a eventos de conductores que se conectan
    this.driverEventsService.onDriverOnline((event: DriverOnlineEvent) => {
      this.handleDriverOnline(event);
    });

    this.logger.log(
      'AsyncMatchingService initialized with driver event listeners',
    );
  }

  onModuleDestroy() {
    // Limpiar todos los intervalos
    for (const interval of this.searchIntervals.values()) {
      clearInterval(interval);
    }
    this.searchIntervals.clear();

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    this.logger.log('AsyncMatchingService destroyed');
  }

  /**
   * Inicia una nueva búsqueda asíncrona de conductor
   */
  async startAsyncDriverSearch(
    userId: number,
    criteria: Omit<SearchCriteria, 'searchId' | 'userId'>,
  ): Promise<AsyncSearchResult> {
    const searchId = uuidv4();

    // Verificar límite de búsquedas concurrentes
    if (this.searchSessions.size >= this.config.maxConcurrentSearches) {
      throw new Error('Maximum concurrent searches reached');
    }

    // Verificar si el usuario ya tiene una búsqueda activa
    const existingSearch = this.findActiveSearchByUser(userId);
    if (existingSearch) {
      throw new Error('User already has an active search');
    }

    // Crear nueva sesión de búsqueda
    const session: SearchSession = {
      searchId,
      userId,
      criteria: { ...criteria },
      status: SearchStatus.SEARCHING,
      createdAt: new Date(),
      updatedAt: new Date(),
      expiresAt: new Date(
        Date.now() +
          (criteria.maxWaitTime || this.config.defaultMaxWaitTime) * 1000,
      ),
      attempts: 0,
      searchInterval: this.calculateSearchInterval(
        criteria.priority || 'normal',
      ),
      maxWaitTime: criteria.maxWaitTime || this.config.defaultMaxWaitTime,
      priority: criteria.priority || 'normal',
      websocketRoom: criteria.websocketRoom || `user-${userId}`,
    };

    // Almacenar sesión
    this.searchSessions.set(searchId, session);

    // Iniciar búsqueda periódica
    this.startPeriodicSearch(session);

    // Log de inicio
    this.logger.log(
      `🎯 [ASYNC] Started search ${searchId} for user ${userId} - Priority: ${session.priority}`,
    );

    return this.formatSearchResult(session);
  }

  /**
   * Cancela una búsqueda activa
   */
  async cancelAsyncSearch(
    searchId: string,
    userId: number,
  ): Promise<AsyncSearchResult> {
    const session = this.searchSessions.get(searchId);

    if (!session) {
      throw new Error('Search session not found');
    }

    if (session.userId !== userId) {
      throw new Error('Unauthorized to cancel this search');
    }

    if (session.status !== SearchStatus.SEARCHING) {
      throw new Error('Search is not active');
    }

    // Detener búsqueda periódica
    this.stopPeriodicSearch(searchId);

    // Actualizar estado
    session.status = SearchStatus.CANCELLED;
    session.updatedAt = new Date();

    // Notificar via WebSocket
    this.notifyWebSocket(session, 'search-cancelled');

    // Remover de memoria (se limpiará automáticamente)
    this.searchSessions.delete(searchId);

    this.logger.log(
      `❌ [ASYNC] Cancelled search ${searchId} for user ${userId}`,
    );

    return this.formatSearchResult(session);
  }

  /**
   * Obtiene el estado de una búsqueda
   */
  async getAsyncSearchStatus(
    searchId: string,
    userId: number,
  ): Promise<AsyncSearchResult> {
    const session = this.searchSessions.get(searchId);

    if (!session) {
      throw new Error('Search session not found');
    }

    if (session.userId !== userId) {
      throw new Error('Unauthorized to view this search');
    }

    return this.formatSearchResult(session);
  }

  /**
   * Confirma un conductor encontrado en una búsqueda asíncrona
   */
  async confirmAsyncDriver(
    searchId: string,
    driverId: number,
    userId: number,
    notes?: string,
  ): Promise<any> {
    const session = this.searchSessions.get(searchId);

    if (!session) {
      throw new Error('Search session not found');
    }

    if (session.userId !== userId) {
      throw new Error('Unauthorized to confirm this driver');
    }

    if (session.status !== SearchStatus.FOUND) {
      throw new Error('No driver available to confirm');
    }

    if (!session.matchedDriver || session.matchedDriver.driverId !== driverId) {
      throw new Error('Driver not found in this search');
    }

    // Detener búsqueda
    this.stopPeriodicSearch(searchId);

    // Actualizar estado
    session.status = SearchStatus.COMPLETED;
    session.updatedAt = new Date();

    // Aquí se integraría con el flujo existente de confirmación de conductor
    // Por ahora, solo retornamos la información
    const result = {
      searchId,
      driverId,
      confirmedAt: new Date(),
      notes,
      driverInfo: session.matchedDriver,
    };

    // Remover sesión
    this.searchSessions.delete(searchId);

    this.logger.log(
      `✅ [ASYNC] Confirmed driver ${driverId} for search ${searchId}`,
    );

    return result;
  }

  /**
   * Maneja cuando un conductor se conecta online
   */
  private async handleDriverOnline(event: DriverOnlineEvent): Promise<void> {
    try {
      this.logger.debug(
        `🚗 [ASYNC] Driver ${event.driverId} came online at ${event.lat}, ${event.lng}`,
      );

      await this.checkPendingSearchesForNewDriver(event.lat, event.lng);
    } catch (error) {
      this.logger.error(
        `Error handling driver online event for driver ${event.driverId}: ${error.message}`,
      );
    }
  }

  /**
   * Busca conductores disponibles cuando un conductor se conecta
   * Este método será llamado desde el sistema de detección de conexiones
   */
  async checkPendingSearchesForNewDriver(
    driverLat: number,
    driverLng: number,
  ): Promise<void> {
    if (this.searchSessions.size === 0) return;

    const activeSearches = Array.from(this.searchSessions.values()).filter(
      (session) => session.status === SearchStatus.SEARCHING,
    );

    if (activeSearches.length === 0) return;

    this.logger.debug(
      `🔍 [ASYNC] Checking ${activeSearches.length} pending searches for new driver at ${driverLat}, ${driverLng}`,
    );

    for (const session of activeSearches) {
      try {
        // Calcular distancia entre conductor y búsqueda
        const distance = this.calculateDistance(
          session.criteria.lat,
          session.criteria.lng,
          driverLat,
          driverLng,
        );

        // Si está dentro del radio, intentar matching
        if (distance <= (session.criteria.radiusKm || 5)) {
          this.logger.log(
            `🎯 [ASYNC] Driver came online within range of search ${session.searchId} (${distance.toFixed(1)}km)`,
          );
          await this.attemptMatchingForSession(session);
        }
      } catch (error) {
        this.logger.warn(
          `Error checking search ${session.searchId} for new driver: ${error.message}`,
        );
      }
    }
  }

  /**
   * Ejecuta una búsqueda periódica para una sesión
   */
  private async executeSearch(session: SearchSession): Promise<void> {
    try {
      session.attempts++;
      session.lastSearchAt = new Date();

      // Verificar si la búsqueda expiró
      if (Date.now() > session.expiresAt.getTime()) {
        this.handleSearchTimeout(session);
        return;
      }

      // Ejecutar búsqueda de conductor directamente
      const matchedDriver = await this.findBestDriverMatch(session.criteria);

      if (matchedDriver) {
        this.handleDriverFound(session, { matchedDriver });
      }
    } catch (error) {
      this.logger.warn(
        `Search attempt ${session.attempts} failed for ${session.searchId}: ${error.message}`,
      );
    }
  }

  /**
   * Maneja cuando se encuentra un conductor
   */
  private async handleDriverFound(
    session: SearchSession,
    matchedDriver: any,
  ): Promise<void> {
    // Detener búsqueda periódica
    this.stopPeriodicSearch(session.searchId);

    // Actualizar sesión
    session.status = SearchStatus.FOUND;
    session.updatedAt = new Date();
    session.matchedDriver = {
      ...matchedDriver.matchedDriver,
      searchId: session.searchId,
    };

    // Notificar via WebSocket
    this.notifyWebSocket(session, 'driver-found', session.matchedDriver);

    this.logger.log(
      `🎉 [ASYNC] Driver found for search ${session.searchId} - Score: ${session.matchedDriver?.matchScore}`,
    );
  }

  /**
   * Maneja timeout de búsqueda
   */
  private async handleSearchTimeout(session: SearchSession): Promise<void> {
    // Detener búsqueda periódica
    this.stopPeriodicSearch(session.searchId);

    // Actualizar estado
    session.status = SearchStatus.TIMEOUT;
    session.updatedAt = new Date();

    // Notificar via WebSocket
    this.notifyWebSocket(session, 'search-timeout');

    // Remover sesión después de un tiempo
    setTimeout(() => {
      this.searchSessions.delete(session.searchId);
    }, 300000); // 5 minutos para que el usuario pueda consultar el estado

    this.logger.log(`⏰ [ASYNC] Search timeout for ${session.searchId}`);
  }

  /**
   * Encuentra el mejor conductor disponible usando el algoritmo de matching
   */
  private async findBestDriverMatch(
    criteria: Omit<SearchCriteria, 'searchId' | 'userId'>,
  ): Promise<MatchedDriverInfo | null> {
    try {
      // 1. Obtener conductores candidatos con filtros básicos
      const driverFilters: any = {
        status: 'online' as const,
        verificationStatus: 'approved' as const,
      };

      // 2. Aplicar filtros de compatibilidad de vehículo
      if (criteria.tierId) {
        const vehicleTypeFilters = await this.buildVehicleTypeFilters(
          criteria.tierId,
          criteria.vehicleTypeId,
        );
        if (vehicleTypeFilters && vehicleTypeFilters.length > 0) {
          driverFilters.vehicles = {
            some: {
              vehicleTypeId: { in: vehicleTypeFilters },
              status: 'active',
              isDefault: true,
            },
          };
        }
      }

      // 3. Buscar conductores candidatos cercanos
      const candidateDrivers = await this.getAvailableDriversWithCache(
        driverFilters,
        criteria.radiusKm || 5,
        criteria.lat,
        criteria.lng,
      );

      if (candidateDrivers.length === 0) {
        return null;
      }

      // 4. Obtener información detallada de conductores
      const driverIds = candidateDrivers.map((d) => d.id);
      const detailedDrivers = await this.getDriverDetailsWithCache(driverIds);

      if (detailedDrivers.length === 0) {
        return null;
      }

      // 5. Calcular distancias
      const driversWithDistance =
        await this.calculateDistancesWithConcurrencyLimit(
          detailedDrivers,
          criteria.lat,
          criteria.lng,
          criteria.radiusKm || 5,
        );

      // 6. Calcular scores y seleccionar el mejor
      const scoredDrivers = await this.calculateDriversScores(
        driversWithDistance,
        criteria.lat,
        criteria.lng,
        criteria.radiusKm,
      );

      if (scoredDrivers.length === 0) {
        return null;
      }

      const bestDriver = scoredDrivers[0];

      // 7. Obtener información completa del conductor
      const driverDetails = await this.getDriverDetailedInfo(bestDriver.id);

      // 8. Calcular tiempo estimado de llegada
      const estimatedMinutes = Math.max(
        1,
        Math.round(((bestDriver.distance * 1000) / 30) * 60),
      );

      const result = this.formatMatchedDriverFromDetails(
        bestDriver,
        driverDetails,
        estimatedMinutes,
        criteria.tierId,
      );
      result.searchId = uuidv4(); // Generate a temporary search ID
      return result;
    } catch (error) {
      this.logger.error('Error in findBestDriverMatch:', error);
      return null;
    }
  }

  /**
   * Construye filtros de tipo de vehículo basados en tier y vehicleType
   */
  private async buildVehicleTypeFilters(
    tierId?: number,
    vehicleTypeId?: number,
  ) {
    if (!tierId && !vehicleTypeId) return null;

    const tierVehicleTypes = await this.prisma.tierVehicleType.findMany({
      where: {
        isActive: true,
        ...(tierId && { tierId }),
        ...(vehicleTypeId && { vehicleTypeId }),
      },
      select: { vehicleTypeId: true },
    });

    return tierVehicleTypes.map((tvt) => tvt.vehicleTypeId);
  }

  /**
   * Obtiene conductores disponibles con caché inteligente
   */
  private async getAvailableDriversWithCache(
    driverFilters: any,
    radiusKm: number,
    lat: number,
    lng: number,
  ) {
    // Simplified version - in production this would use Redis caching
    const drivers = await this.prisma.driver.findMany({
      where: driverFilters,
      include: {
        vehicles: {
          where: { isDefault: true, status: 'ACTIVE' },
          take: 1,
        },
      },
      take: 20, // Limit for performance
    });

    // Filter by distance (simplified - would use PostGIS in production)
    return drivers.filter((driver) => {
      if (!driver.currentLatitude || !driver.currentLongitude) return false;

      const distance = this.calculateDistance(
        lat,
        lng,
        Number(driver.currentLatitude),
        Number(driver.currentLongitude),
      );

      return distance <= radiusKm;
    });
  }

  /**
   * Obtiene detalles de conductores con caché
   */
  private async getDriverDetailsWithCache(driverIds: number[]) {
    // Simplified version - in production this would use Redis caching
    return await this.prisma.driver.findMany({
      where: {
        id: { in: driverIds },
        status: 'ONLINE',
        verificationStatus: 'APPROVED' as any,
      },
      include: {
        vehicles: {
          where: { isDefault: true, status: 'ACTIVE' },
          take: 1,
          include: { vehicleType: true },
        },
      },
    });
  }

  /**
   * Calcula distancias con control de concurrencia
   */
  private async calculateDistancesWithConcurrencyLimit(
    drivers: any[],
    userLat: number,
    userLng: number,
    radiusKm: number,
  ) {
    const results: any[] = [];

    for (const driver of drivers) {
      if (!driver.currentLatitude || !driver.currentLongitude) continue;

      const distance = this.calculateDistance(
        userLat,
        userLng,
        Number(driver.currentLatitude),
        Number(driver.currentLongitude),
      );

      if (distance <= radiusKm) {
        results.push({
          ...driver,
          distance,
        });
      }
    }

    return results;
  }

  /**
   * Calcula scores para conductores
   */
  private async calculateDriversScores(
    driversWithDistance: any[],
    userLat: number,
    userLng: number,
    radiusKm?: number,
  ) {
    const scoredDrivers: any[] = [];

    for (const driver of driversWithDistance) {
      const score = await this.calculateDriverScore(driver, userLat, userLng);
      scoredDrivers.push({
        ...driver,
        score,
      });
    }

    // Ordenar por score descendente
    return scoredDrivers.sort((a, b) => b.score - a.score);
  }

  /**
   * Inicia búsqueda periódica para una sesión
   */
  private startPeriodicSearch(session: SearchSession): void {
    const interval = setInterval(async () => {
      await this.executeSearch(session);
    }, session.searchInterval);

    this.searchIntervals.set(session.searchId, interval);

    // Ejecutar primera búsqueda inmediatamente
    setTimeout(() => this.executeSearch(session), 100);
  }

  /**
   * Detiene búsqueda periódica
   */
  private stopPeriodicSearch(searchId: string): void {
    const interval = this.searchIntervals.get(searchId);
    if (interval) {
      clearInterval(interval);
      this.searchIntervals.delete(searchId);
    }
  }

  /**
   * Calcula el intervalo de búsqueda basado en prioridad
   */
  private calculateSearchInterval(priority: 'low' | 'normal' | 'high'): number {
    const baseInterval = this.config.searchInterval;
    const weight = this.config.priorityWeights[priority];
    return Math.round(baseInterval / weight);
  }

  /**
   * Calcula distancia entre dos puntos (fórmula Haversine)
   */
  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Formatea resultado de matched driver desde detalles simplificados
   */
  private formatMatchedDriverFromDetails(
    bestDriver: any,
    driverDetails: any,
    estimatedMinutes: number,
    tierId?: number,
  ): MatchedDriverInfo {
    return {
      driverId: bestDriver.id,
      firstName: driverDetails.firstName,
      lastName: driverDetails.lastName,
      profileImageUrl: driverDetails.profileImageUrl,
      rating: driverDetails.rating || driverDetails.averageRating || 0,
      totalRides: driverDetails.totalRides || 0,
      vehicle: {
        carModel: driverDetails.vehicles?.[0]
          ? `${driverDetails.vehicles[0].make} ${driverDetails.vehicles[0].model}`
          : 'Unknown',
        licensePlate: driverDetails.vehicles?.[0]?.licensePlate || '',
        carSeats: driverDetails.vehicles?.[0]?.seatingCapacity || 0,
        vehicleType:
          driverDetails.vehicles?.[0]?.vehicleType?.displayName || null,
      },
      location: {
        distance: Math.round(bestDriver.distance * 100) / 100,
        estimatedArrival: estimatedMinutes,
        currentLocation: {
          lat: bestDriver.currentLatitude,
          lng: bestDriver.currentLongitude,
        },
      },
      pricing: {
        tierId: tierId || 1,
        tierName: 'Economy', // Simplified - would get from DB
        estimatedFare: 0, // Simplified - would calculate based on tier
      },
      matchScore: Math.round(bestDriver.score * 100) / 100,
      searchId: '', // Will be set by caller
    };
  }

  /**
   * Formatea resultado de matched driver
   */
  private formatMatchedDriver(
    matchedDriver: any,
    searchId: string,
  ): MatchedDriverInfo {
    return {
      driverId: matchedDriver.driver.driverId,
      firstName: matchedDriver.driver.firstName,
      lastName: matchedDriver.driver.lastName,
      profileImageUrl: matchedDriver.driver.profileImageUrl,
      rating: matchedDriver.driver.rating,
      totalRides: matchedDriver.driver.totalRides,
      vehicle: {
        carModel: matchedDriver.vehicle.carModel,
        licensePlate: matchedDriver.vehicle.licensePlate,
        carSeats: matchedDriver.vehicle.carSeats,
        vehicleType: matchedDriver.vehicle.vehicleType,
      },
      location: matchedDriver.location,
      pricing: matchedDriver.pricing,
      matchScore: matchedDriver.matchScore,
      searchId,
    };
  }

  /**
   * Formatea resultado de búsqueda para respuesta
   */
  private formatSearchResult(session: SearchSession): AsyncSearchResult {
    const timeRemaining = Math.max(
      0,
      Math.round((session.expiresAt.getTime() - Date.now()) / 1000),
    );

    return {
      searchId: session.searchId,
      status: session.status,
      message: this.getStatusMessage(session.status),
      matchedDriver: session.matchedDriver,
      searchCriteria: {
        lat: session.criteria.lat,
        lng: session.criteria.lng,
        tierId: session.criteria.tierId,
        vehicleTypeId: session.criteria.vehicleTypeId,
        radiusKm: session.criteria.radiusKm || 5,
        maxWaitTime: session.maxWaitTime,
        priority: session.priority,
      },
      timeRemaining:
        session.status === SearchStatus.SEARCHING ? timeRemaining : undefined,
      createdAt: session.createdAt,
    };
  }

  /**
   * Obtiene mensaje descriptivo del estado
   */
  private getStatusMessage(status: SearchStatus): string {
    switch (status) {
      case SearchStatus.SEARCHING:
        return 'Buscando el mejor conductor disponible...';
      case SearchStatus.FOUND:
        return '¡Conductor encontrado! Confirma para continuar.';
      case SearchStatus.TIMEOUT:
        return 'Búsqueda expirada. No se encontraron conductores disponibles.';
      case SearchStatus.CANCELLED:
        return 'Búsqueda cancelada por el usuario.';
      case SearchStatus.COMPLETED:
        return 'Conductor confirmado exitosamente.';
      default:
        return 'Estado desconocido';
    }
  }

  /**
   * Busca sesión activa de un usuario
   */
  private findActiveSearchByUser(userId: number): SearchSession | undefined {
    return Array.from(this.searchSessions.values()).find(
      (session) =>
        session.userId === userId && session.status === SearchStatus.SEARCHING,
    );
  }

  /**
   * Intenta matching para una sesión específica
   */
  private async attemptMatchingForSession(
    session: SearchSession,
  ): Promise<void> {
    // Este método se usaría cuando un conductor se conecta
    // Reutiliza la lógica de búsqueda periódica
    await this.executeSearch(session);
  }

  /**
   * Notifica via WebSocket usando el método público del gateway
   */
  private notifyWebSocket(
    session: SearchSession,
    eventType: MatchingWebSocketEvent['type'],
    data?: any,
  ): void {
    try {
      // Usar el método público del WebSocket gateway
      this.websocketGateway.sendMatchingEvent(
        eventType,
        session.searchId,
        session.userId,
        data,
      );

      this.logger.debug(
        `📡 [WS] Sent ${eventType} for search ${session.searchId}`,
      );
    } catch (error) {
      this.logger.warn(
        `Failed to send WebSocket notification: ${error.message}`,
      );
    }
  }

  /**
   * Limpia sesiones expiradas
   */
  private cleanupExpiredSessions(): void {
    const now = Date.now();
    const expiredSessions: string[] = [];

    for (const [searchId, session] of this.searchSessions.entries()) {
      if (
        session.expiresAt.getTime() < now &&
        session.status === SearchStatus.SEARCHING
      ) {
        expiredSessions.push(searchId);
        this.stopPeriodicSearch(searchId);
      }
    }

    expiredSessions.forEach((searchId) => {
      this.searchSessions.delete(searchId);
    });

    if (expiredSessions.length > 0) {
      this.logger.log(
        `🧹 Cleaned up ${expiredSessions.length} expired search sessions`,
      );
    }
  }

  /**
   * Obtiene información detallada de un conductor específico
   */
  private async getDriverDetailedInfo(driverId: number) {
    const driver = await this.prisma.driver.findUnique({
      where: { id: driverId },
      include: {
        vehicles: {
          where: { isDefault: true, status: 'ACTIVE' },
          take: 1,
          include: { vehicleType: true },
        },
        _count: {
          select: { rides: true },
        },
      },
    });

    if (!driver) return null;

    return {
      ...driver,
      totalRides: 0,
      averageRating: 4.5, // Simplified - would calculate from ratings table
    };
  }

  /**
   * Calcula el score de un conductor basado en múltiples factores
   */
  private async calculateDriverScore(
    driver: any,
    userLat: number,
    userLng: number,
  ): Promise<number> {
    // Simplified scoring algorithm - in production this would be more sophisticated
    const distance =
      driver.distance ||
      this.calculateDistance(
        userLat,
        userLng,
        driver.currentLatitude,
        driver.currentLongitude,
      );

    // Distance score (higher for closer drivers)
    const distanceScore = Math.max(0, 1 - distance / 10) * 40; // Max 40 points

    // Rating score (4.5 rating = 35 points, 5.0 rating = 35 points)
    const rating = driver.rating || driver.averageRating || 4.5;
    const ratingScore = (rating / 5.0) * 35; // Max 35 points

    // Estimated time score (faster arrival = higher score)
    const estimatedTime = Math.max(1, (distance * 60) / 30); // minutes at 30 km/h
    const timeScore = Math.max(0, 1 - estimatedTime / 30) * 25; // Max 25 points

    const totalScore = distanceScore + ratingScore + timeScore;

    return Math.round(totalScore * 100) / 100; // Round to 2 decimal places
  }
}
