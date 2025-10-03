import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
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
import { RidesFlowService } from '../flow/rides-flow.service';
import { WebSocketGatewayClass } from '../../websocket/websocket.gateway';
import { DriverEventsService, DriverOnlineEvent } from '../../common/events/driver-events.service';

@Injectable()
export class AsyncMatchingService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AsyncMatchingService.name);
  private searchSessions: Map<string, SearchSession> = new Map();
  private searchIntervals: Map<string, NodeJS.Timeout> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  // Configuración por defecto
  private readonly config: AsyncMatchingConfig = {
    defaultMaxWaitTime: 300, // 5 minutos
    searchInterval: 10000,   // 10 segundos
    maxConcurrentSearches: 100,
    cleanupInterval: 60000,  // 1 minuto
    priorityWeights: {
      high: 3,     // 3x más frecuente
      normal: 1,   // frecuencia normal
      low: 0.5,    // 2x menos frecuente
    },
  };

  constructor(
    private readonly ridesFlowService: RidesFlowService,
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

    this.logger.log('AsyncMatchingService initialized with driver event listeners');
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
    criteria: Omit<SearchCriteria, 'searchId' | 'userId'>
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
      expiresAt: new Date(Date.now() + (criteria.maxWaitTime || this.config.defaultMaxWaitTime) * 1000),
      attempts: 0,
      searchInterval: this.calculateSearchInterval(criteria.priority || 'normal'),
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
      `🎯 [ASYNC] Started search ${searchId} for user ${userId} - Priority: ${session.priority}`
    );

    return this.formatSearchResult(session);
  }

  /**
   * Cancela una búsqueda activa
   */
  async cancelAsyncSearch(searchId: string, userId: number): Promise<AsyncSearchResult> {
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

    this.logger.log(`❌ [ASYNC] Cancelled search ${searchId} for user ${userId}`);

    return this.formatSearchResult(session);
  }

  /**
   * Obtiene el estado de una búsqueda
   */
  async getAsyncSearchStatus(searchId: string, userId: number): Promise<AsyncSearchResult> {
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
    notes?: string
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

    this.logger.log(`✅ [ASYNC] Confirmed driver ${driverId} for search ${searchId}`);

    return result;
  }

  /**
   * Maneja cuando un conductor se conecta online
   */
  private async handleDriverOnline(event: DriverOnlineEvent): Promise<void> {
    try {
      this.logger.debug(
        `🚗 [ASYNC] Driver ${event.driverId} came online at ${event.lat}, ${event.lng}`
      );

      await this.checkPendingSearchesForNewDriver(event.lat, event.lng);
    } catch (error) {
      this.logger.error(
        `Error handling driver online event for driver ${event.driverId}: ${error.message}`
      );
    }
  }

  /**
   * Busca conductores disponibles cuando un conductor se conecta
   * Este método será llamado desde el sistema de detección de conexiones
   */
  async checkPendingSearchesForNewDriver(driverLat: number, driverLng: number): Promise<void> {
    if (this.searchSessions.size === 0) return;

    const activeSearches = Array.from(this.searchSessions.values())
      .filter(session => session.status === SearchStatus.SEARCHING);

    if (activeSearches.length === 0) return;

    this.logger.debug(
      `🔍 [ASYNC] Checking ${activeSearches.length} pending searches for new driver at ${driverLat}, ${driverLng}`
    );

    for (const session of activeSearches) {
      try {
        // Calcular distancia entre conductor y búsqueda
        const distance = this.calculateDistance(
          session.criteria.lat,
          session.criteria.lng,
          driverLat,
          driverLng
        );

        // Si está dentro del radio, intentar matching
        if (distance <= (session.criteria.radiusKm || 5)) {
          this.logger.log(
            `🎯 [ASYNC] Driver came online within range of search ${session.searchId} (${distance.toFixed(1)}km)`
          );
          await this.attemptMatchingForSession(session);
        }
      } catch (error) {
        this.logger.warn(
          `Error checking search ${session.searchId} for new driver: ${error.message}`
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

      // Intentar encontrar conductor usando el método existente
      const matchResult = await this.ridesFlowService.findBestDriverMatch({
        lat: session.criteria.lat,
        lng: session.criteria.lng,
        tierId: session.criteria.tierId,
        vehicleTypeId: session.criteria.vehicleTypeId,
        radiusKm: session.criteria.radiusKm,
      });

      if (matchResult?.matchedDriver) {
        this.handleDriverFound(session, matchResult.matchedDriver);
      }

    } catch (error) {
      this.logger.warn(
        `Search attempt ${session.attempts} failed for ${session.searchId}: ${error.message}`
      );
    }
  }

  /**
   * Maneja cuando se encuentra un conductor
   */
  private async handleDriverFound(session: SearchSession, matchedDriver: any): Promise<void> {
    // Detener búsqueda periódica
    this.stopPeriodicSearch(session.searchId);

    // Actualizar sesión
    session.status = SearchStatus.FOUND;
    session.updatedAt = new Date();
    session.matchedDriver = this.formatMatchedDriver(matchedDriver, session.searchId);

    // Notificar via WebSocket
    this.notifyWebSocket(session, 'driver-found', session.matchedDriver);

    this.logger.log(
      `🎉 [ASYNC] Driver found for search ${session.searchId} - Score: ${session.matchedDriver?.matchScore}`
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
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Formatea resultado de matched driver
   */
  private formatMatchedDriver(matchedDriver: any, searchId: string): MatchedDriverInfo {
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
      Math.round((session.expiresAt.getTime() - Date.now()) / 1000)
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
      timeRemaining: session.status === SearchStatus.SEARCHING ? timeRemaining : undefined,
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
    return Array.from(this.searchSessions.values())
      .find(session =>
        session.userId === userId &&
        session.status === SearchStatus.SEARCHING
      );
  }

  /**
   * Intenta matching para una sesión específica
   */
  private async attemptMatchingForSession(session: SearchSession): Promise<void> {
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
    data?: any
  ): void {
    try {
      // Usar el método público del WebSocket gateway
      this.websocketGateway.sendMatchingEvent(
        eventType as 'driver-found' | 'search-timeout' | 'search-cancelled' | 'search-expired',
        session.searchId,
        session.userId,
        data
      );

      this.logger.debug(`📡 [WS] Sent ${eventType} for search ${session.searchId}`);
    } catch (error) {
      this.logger.warn(`Failed to send WebSocket notification: ${error.message}`);
    }
  }

  /**
   * Limpia sesiones expiradas
   */
  private cleanupExpiredSessions(): void {
    const now = Date.now();
    const expiredSessions: string[] = [];

    for (const [searchId, session] of this.searchSessions.entries()) {
      if (session.expiresAt.getTime() < now && session.status === SearchStatus.SEARCHING) {
        expiredSessions.push(searchId);
        this.stopPeriodicSearch(searchId);
      }
    }

    expiredSessions.forEach(searchId => {
      this.searchSessions.delete(searchId);
    });

    if (expiredSessions.length > 0) {
      this.logger.log(`🧹 Cleaned up ${expiredSessions.length} expired search sessions`);
    }
  }
}
