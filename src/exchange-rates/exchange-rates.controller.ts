import {
  Controller,
  Get,
  Post,
  Query,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ExchangeRatesService } from './exchange-rates.service';

@Controller('exchange-rates')
export class ExchangeRatesController {
  private readonly logger = new Logger(ExchangeRatesController.name);

  constructor(private readonly exchangeRatesService: ExchangeRatesService) {}

  /**
   * GET /exchange-rates/latest
   * Obtener el precio más reciente del dólar
   */
  @Get('latest')
  async getLatestExchangeRate() {
    try {
      const latestRate =
        await this.exchangeRatesService.getLatestExchangeRate();
      // Retornar solo los datos - el TransformInterceptor se encarga del formato ApiResponse
      return latestRate;
    } catch (error) {
      this.logger.error('Error getting latest exchange rate:', error);
      throw new HttpException(
        {
          message: 'Error retrieving latest exchange rate',
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          error: {
            code: 'EXCHANGE_RATE_ERROR',
            details: error.message,
          },
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * GET /exchange-rates/history
   * Obtener historial de precios del dólar
   */
  @Get('history')
  async getExchangeRateHistory(@Query('limit') limit?: string) {
    try {
      const limitNum = limit ? parseInt(limit, 10) : 50;

      if (limitNum < 1 || limitNum > 1000) {
        throw new HttpException(
          {
            message: 'Limit must be between 1 and 1000',
            error: {
              code: 'VALIDATION_ERROR',
              details: `Limit ${limitNum} is out of range (1-1000)`,
            },
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const history =
        await this.exchangeRatesService.getExchangeRateHistory(limitNum);
      // Retornar objeto con datos + metadata de paginación
      return {
        data: history,
        pagination: {
          page: 1,
          limit: limitNum,
          total: history.length,
          pages: 1,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error('Error getting exchange rate history:', error);
      throw new HttpException(
        {
          message: 'Error retrieving exchange rate history',
          error: {
            code: 'EXCHANGE_RATE_ERROR',
            details: error.message,
          },
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * GET /exchange-rates/stats
   * Obtener estadísticas del dólar
   */
  @Get('stats')
  async getExchangeRateStats(@Query('days') days?: string) {
    try {
      const daysNum = days ? parseInt(days, 10) : 7;

      if (daysNum < 1 || daysNum > 365) {
        throw new HttpException(
          {
            message: 'Days must be between 1 and 365',
            error: {
              code: 'VALIDATION_ERROR',
              details: `Days ${daysNum} is out of range (1-365)`,
            },
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const stats =
        await this.exchangeRatesService.getExchangeRateStats(daysNum);
      // Retornar solo los datos - TransformInterceptor agrega el wrapper ApiResponse
      return stats;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error('Error getting exchange rate stats:', error);
      throw new HttpException(
        {
          message: 'Error retrieving exchange rate statistics',
          error: {
            code: 'EXCHANGE_RATE_ERROR',
            details: error.message,
          },
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * POST /exchange-rates/update
   * Actualizar precio del dólar manualmente
   */
  @Post('update')
  async updateExchangeRateManually() {
    try {
      const result =
        await this.exchangeRatesService.updateExchangeRateManually();
      // Retornar solo los datos - TransformInterceptor agrega el wrapper ApiResponse
      return result;
    } catch (error) {
      this.logger.error('Error in manual exchange rate update:', error);
      throw new HttpException(
        {
          message: 'Error updating exchange rate manually',
          error: {
            code: 'EXCHANGE_RATE_UPDATE_ERROR',
            details: error.message,
          },
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * GET /exchange-rates/health
   * Verificar estado de la API externa
   */
  @Get('health')
  async checkApiHealth() {
    try {
      // Intentar obtener el precio más reciente
      const latestRate =
        await this.exchangeRatesService.getLatestExchangeRate();

      // Retornar datos de health - TransformInterceptor agrega el wrapper ApiResponse
      return {
        status: 'healthy',
        lastUpdate: latestRate.createdAt,
        apiUrl: 'https://ve.dolarapi.com/v1/dolares/oficial',
      };
    } catch (error) {
      this.logger.error('API health check failed:', error);
      // Para errores de health check, lanzamos HttpException con status 503
      throw new HttpException(
        {
          message: 'Exchange rates API is unhealthy',
          error: {
            code: 'HEALTH_CHECK_FAILED',
            details: error.message,
          },
        },
        503, // Service Unavailable
      );
    }
  }

  /**
   * GET /exchange-rates/test-fetch
   * Probar fetch directo de la API (sin guardar en BD)
   */
  @Get('test-fetch')
  async testFetch() {
    try {
      const data = await this.exchangeRatesService.fetchDollarRate();
      // Retornar solo los datos - TransformInterceptor agrega el wrapper ApiResponse
      return data;
    } catch (error) {
      this.logger.error('Test fetch failed:', error);
      throw new HttpException(
        {
          message: 'API fetch failed',
          error: {
            code: 'TEST_FETCH_FAILED',
            details: error.message,
          },
        },
        503, // Service Unavailable
      );
    }
  }

  /**
   * POST /exchange-rates/reset
   * Limpiar datos existentes y forzar nuevo fetch (endpoint público)
   */
  @Post('reset')
  async resetExchangeRates() {
    try {
      // Limpiar todos los registros existentes
      const deletedCount = await this.exchangeRatesService.resetExchangeRates();

      // Forzar un nuevo fetch
      const freshData = await this.exchangeRatesService.fetchDollarRate();
      const savedRate =
        await this.exchangeRatesService.saveExchangeRate(freshData);

      // Retornar datos del reset - TransformInterceptor agrega el wrapper ApiResponse
      return {
        deletedRecords: deletedCount,
        newData: savedRate,
      };
    } catch (error) {
      this.logger.error('Reset failed:', error);
      throw new HttpException(
        {
          message: 'Failed to reset exchange rates',
          error: {
            code: 'RESET_FAILED',
            details: error.message,
          },
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
