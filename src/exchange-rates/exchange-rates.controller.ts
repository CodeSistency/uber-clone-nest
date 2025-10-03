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
      const latestRate = await this.exchangeRatesService.getLatestExchangeRate();
      return {
        success: true,
        data: latestRate,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Error getting latest exchange rate:', error);
      throw new HttpException(
        {
          success: false,
          message: 'Error retrieving latest exchange rate',
          error: error.message,
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
          'Limit must be between 1 and 1000',
          HttpStatus.BAD_REQUEST,
        );
      }

      const history = await this.exchangeRatesService.getExchangeRateHistory(limitNum);
      return {
        success: true,
        data: history,
        count: history.length,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error('Error getting exchange rate history:', error);
      throw new HttpException(
        {
          success: false,
          message: 'Error retrieving exchange rate history',
          error: error.message,
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
          'Days must be between 1 and 365',
          HttpStatus.BAD_REQUEST,
        );
      }

      const stats = await this.exchangeRatesService.getExchangeRateStats(daysNum);
      return {
        success: true,
        data: stats,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error('Error getting exchange rate stats:', error);
      throw new HttpException(
        {
          success: false,
          message: 'Error retrieving exchange rate statistics',
          error: error.message,
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
      const result = await this.exchangeRatesService.updateExchangeRateManually();
      return result;
    } catch (error) {
      this.logger.error('Error in manual exchange rate update:', error);
      throw new HttpException(
        {
          success: false,
          message: 'Error updating exchange rate manually',
          error: error.message,
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
      const latestRate = await this.exchangeRatesService.getLatestExchangeRate();

      return {
        success: true,
        status: 'healthy',
        lastUpdate: latestRate.createdAt,
        apiUrl: 'https://ve.dolarapi.com/v1/dolares/oficial',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('API health check failed:', error);
      return {
        success: false,
        status: 'unhealthy',
        error: error.message,
        apiUrl: 'https://ve.dolarapi.com/v1/dolares/oficial',
        timestamp: new Date().toISOString(),
      };
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
      return {
        success: true,
        message: 'API fetch successful',
        data: data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Test fetch failed:', error);
      return {
        success: false,
        message: 'API fetch failed',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
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
      const savedRate = await this.exchangeRatesService.saveExchangeRate(freshData);

      return {
        success: true,
        message: 'Exchange rates reset and updated successfully',
        deletedRecords: deletedCount,
        newData: savedRate,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Reset failed:', error);
      return {
        success: false,
        message: 'Failed to reset exchange rates',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
