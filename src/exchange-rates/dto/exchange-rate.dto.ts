import { IsString, IsNumber, IsOptional, IsDateString } from 'class-validator';

// Respuesta de la API ve.dolarapi.com
export interface DollarApiResponse {
  fuente: string; // Fuente del precio (ej: "oficial")
  nombre: string; // Nombre completo
  compra: number | null; // Precio de compra (puede ser null)
  venta: number | null; // Precio de venta (puede ser null)
  promedio: number; // Precio promedio/promedio
  fechaActualizacion: string; // Fecha de actualización completa
}

// DTO para respuesta interna
export class ExchangeRateDto {
  @IsString()
  currency: string;

  @IsNumber()
  rate: number;

  @IsOptional()
  compra?: number | null; // Precio de compra (puede ser null)

  @IsOptional()
  venta?: number | null; // Precio de venta (puede ser null)

  @IsString()
  source: string;

  @IsString()
  @IsOptional()
  casa?: string; // Casa de cambio (fuente)

  @IsDateString()
  @IsOptional()
  fechaActualizacion?: string;
}

// DTO para respuesta de la API
export class ExchangeRateResponseDto {
  id: string;
  currency: string;
  rate: number;
  compra?: number | null;
  venta?: number | null;
  source: string;
  casa?: string;
  fechaActualizacion?: string;
  createdAt: Date;
  updatedAt: Date;
}

// DTO para configuración de actualización
export class UpdateConfigDto {
  @IsString()
  @IsOptional()
  schedule?: string; // Cron expression personalizada

  @IsNumber()
  @IsOptional()
  timeout?: number; // Timeout en ms
}
