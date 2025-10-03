import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { AppConfigService } from '../config/config.service';
import { firstValueFrom } from 'rxjs';
import { DollarApiResponse, ExchangeRateDto } from './dto/exchange-rate.dto';

@Injectable()
export class ExchangeRatesService {
  private readonly logger = new Logger(ExchangeRatesService.name);
  private readonly apiUrl = 'https://ve.dolarapi.com/v1/dolares/oficial';

  constructor(
    private httpService: HttpService,
    private prisma: PrismaService,
    private configService: AppConfigService,
  ) {}

  /**
   * Método principal para obtener precio del dólar desde API ve.dolarapi.com
   */
  async fetchDollarRate(): Promise<ExchangeRateDto> {
    try {
      this.logger.log('🌐 Fetching dollar rate from ve.dolarapi.com...');

      const response = await firstValueFrom(
        this.httpService.get<DollarApiResponse>(this.apiUrl, {
          timeout: 10000, // 10 segundos timeout
        })
      );

      const data = response.data as DollarApiResponse;

      this.logger.log(`🔍 Raw API response:`, JSON.stringify(data, null, 2));

      // Crear DTO con la información de la API
      // Usar promedio como precio principal, o venta/compra si existen
      const rate = data.promedio || data.venta || data.compra || 0;

      if (rate === 0) {
        this.logger.warn(`⚠️ Warning: Rate is 0. API data: promedio=${data.promedio}, venta=${data.venta}, compra=${data.compra}`);
      }

      const exchangeRateDto: ExchangeRateDto = {
        currency: 'USD', // La API siempre devuelve precios en USD
        rate: rate,
        compra: data.compra,
        venta: data.venta,
        source: 've.dolarapi.com',
        casa: data.fuente, // Cambiar casa por fuente
        fechaActualizacion: data.fechaActualizacion,
      };

      this.logger.log(`✅ Dollar rate fetched successfully: ${exchangeRateDto.rate} VES (Fuente: ${exchangeRateDto.casa}, Promedio: ${data.promedio})`);

      return exchangeRateDto;
    } catch (error) {
      this.logger.error('❌ Error fetching dollar rate from ve.dolarapi.com:', error);
      throw new Error(`Failed to fetch exchange rate: ${error.message}`);
    }
  }

  /**
   * Guardar el precio en la base de datos
   */
  async saveExchangeRate(exchangeRateDto: ExchangeRateDto): Promise<any> {
    try {
      // Verificar si ya existe un registro con la misma fecha de actualización
      // para evitar duplicados
      if (exchangeRateDto.fechaActualizacion) {
        const existing = await this.prisma.exchangeRate.findFirst({
          where: {
            fechaActualizacion: exchangeRateDto.fechaActualizacion,
            casa: exchangeRateDto.casa,
          },
        });

        if (existing) {
          this.logger.log('⚠️ Exchange rate already exists for this timestamp, skipping...');
          return existing;
        }
      }

      const exchangeRate = await this.prisma.exchangeRate.create({
        data: {
          currency: exchangeRateDto.currency,
          rate: exchangeRateDto.rate,
          compra: exchangeRateDto.compra,
          venta: exchangeRateDto.venta,
          source: exchangeRateDto.source,
          casa: exchangeRateDto.casa,
          fechaActualizacion: exchangeRateDto.fechaActualizacion ?
            new Date(exchangeRateDto.fechaActualizacion) : new Date(),
        },
      });

      this.logger.log(`💱 Exchange rate saved: ${exchangeRate.rate} VES (Casa: ${exchangeRate.casa})`);
      return exchangeRate;
    } catch (error) {
      this.logger.error('❌ Error saving exchange rate:', error);
      throw error;
    }
  }

  /**
   * Obtener el precio más reciente del dólar
   */
  async getLatestExchangeRate(): Promise<any> {
    try {
      const latestRate = await this.prisma.exchangeRate.findFirst({
        where: { currency: 'USD' },
        orderBy: { createdAt: 'desc' },
      });

      if (!latestRate) {
        // Si no hay datos, intentar obtenerlos de la API
        this.logger.warn('⚠️ No exchange rate data in database, fetching from API...');
        const freshData = await this.fetchDollarRate();
        return await this.saveExchangeRate(freshData);
      }

      return latestRate;
    } catch (error) {
      this.logger.error('❌ Error getting latest exchange rate:', error);
      throw error;
    }
  }

  /**
   * Obtener historial de precios
   */
  async getExchangeRateHistory(limit: number = 50): Promise<any[]> {
    return this.prisma.exchangeRate.findMany({
      where: { currency: 'USD' },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Job programado: Actualizar precio del dólar cada hora
   */
  @Cron('0 0 */1 * * *') // Cada hora a los 0 minutos
  async updateExchangeRateHourly() {
    try {
      this.logger.log('🚀 Starting scheduled job: Update exchange rate (hourly)');

      const exchangeRateData = await this.fetchDollarRate();
      const savedRate = await this.saveExchangeRate(exchangeRateData);

      this.logger.log(`✅ Exchange rate updated (hourly): ${savedRate.rate} VES`);
    } catch (error) {
      this.logger.error('❌ Error in updateExchangeRateHourly job:', error);
    }
  }

  /**
   * Job programado: Actualizar precio del dólar en horas específicas
   * 9 AM, 12 PM, 3 PM, 6 PM (horario comercial venezolano)
   */
  @Cron('0 0 9,12,15,18 * * *') // 9 AM, 12 PM, 3 PM, 6 PM
  async updateExchangeRateBusinessHours() {
    try {
      this.logger.log('🏢 Starting scheduled job: Update exchange rate (business hours)');

      const exchangeRateData = await this.fetchDollarRate();
      const savedRate = await this.saveExchangeRate(exchangeRateData);

      this.logger.log(`✅ Exchange rate updated (business hours): ${savedRate.rate} VES`);
    } catch (error) {
      this.logger.error('❌ Error in updateExchangeRateBusinessHours job:', error);
    }
  }

  /**
   * Método manual para actualizar (útil para testing y administración)
   */
  async updateExchangeRateManually(): Promise<any> {
    try {
      this.logger.log('🔄 Manual exchange rate update requested');

      const exchangeRateData = await this.fetchDollarRate();
      const savedRate = await this.saveExchangeRate(exchangeRateData);

      this.logger.log(`✅ Manual exchange rate update completed: ${savedRate.rate} VES`);

      return {
        success: true,
        data: savedRate,
        message: 'Exchange rate updated successfully',
      };
    } catch (error) {
      this.logger.error('❌ Error in manual update:', error);

      return {
        success: false,
        error: error.message,
        message: 'Failed to update exchange rate',
      };
    }
  }

  /**
   * Obtener estadísticas del dólar
   */
  async getExchangeRateStats(days: number = 7): Promise<any> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const rates = await this.prisma.exchangeRate.findMany({
        where: {
          currency: 'USD',
          createdAt: {
            gte: startDate,
          },
        },
        orderBy: { createdAt: 'asc' },
      });

      if (rates.length === 0) {
        return {
          count: 0,
          message: 'No data available for the specified period',
        };
      }

      const prices = rates.map(r => r.venta || r.rate);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
      const latestPrice = rates[rates.length - 1].venta || rates[rates.length - 1].rate;

      // Calcular variación
      const firstPrice = rates[0].venta || rates[0].rate;
      const variation = ((latestPrice - firstPrice) / firstPrice) * 100;

      return {
        period: `${days} days`,
        count: rates.length,
        latest: latestPrice,
        minimum: minPrice,
        maximum: maxPrice,
        average: Math.round(avgPrice * 100) / 100,
        variation: Math.round(variation * 100) / 100,
        trend: variation > 0 ? 'up' : variation < 0 ? 'down' : 'stable',
        data: rates.slice(-10), // Últimos 10 registros
      };
    } catch (error) {
      this.logger.error('❌ Error getting exchange rate stats:', error);
      throw error;
    }
  }

  /**
   * Limpiar todos los registros de exchange rates
   */
  async resetExchangeRates(): Promise<number> {
    try {
      const result = await this.prisma.exchangeRate.deleteMany({
        where: { currency: 'USD' },
      });

      this.logger.log(`🗑️ Deleted ${result.count} exchange rate records`);
      return result.count;
    } catch (error) {
      this.logger.error('❌ Error resetting exchange rates:', error);
      throw error;
    }
  }
}
