import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { WalletService } from '../wallet.service';
import { WalletMonitoringService } from '../services/wallet-monitoring.service';
import { WalletRateLimitService } from '../services/wallet-rate-limit.service';
import { BlockWalletDto } from '../dto/block-wallet.dto';
import { UnblockWalletDto } from '../dto/unblock-wallet.dto';
import { AdjustBalanceDto } from '../dto/adjust-balance.dto';

@ApiTags('admin-wallet')
@Controller('api/admin/wallet')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class WalletAdminController {
  constructor(
    private readonly walletService: WalletService,
    private readonly monitoringService: WalletMonitoringService,
    private readonly rateLimitService: WalletRateLimitService,
  ) {}

  @Get('stats')
  @ApiOperation({
    summary: 'Obtener estadísticas generales de wallets',
    description:
      'Obtiene estadísticas generales del sistema de wallets para administradores',
  })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas obtenidas exitosamente',
    schema: {
      type: 'object',
      properties: {
        totalWallets: { type: 'number', example: 1250 },
        totalBalance: { type: 'number', example: 125000.5 },
        blockedWallets: { type: 'number', example: 15 },
        lowBalanceWallets: { type: 'number', example: 45 },
        dailyTransactions: { type: 'number', example: 250 },
        monthlyTransactions: { type: 'number', example: 7500 },
        averageTransaction: { type: 'number', example: 25.75 },
        topUsers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              userId: { type: 'number', example: 1 },
              name: { type: 'string', example: 'Juan Pérez' },
              balance: { type: 'number', example: 500.0 },
              transactionCount: { type: 'number', example: 25 },
            },
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Token JWT inválido' })
  @ApiForbiddenResponse({
    description: 'Acceso denegado - Se requieren permisos de administrador',
  })
  async getWalletStats(@Req() req: any) {
    // TODO: Add admin role check
    return this.monitoringService.getGeneralStats();
  }

  @Get('health-check')
  @ApiOperation({
    summary: 'Verificar salud del sistema de wallets',
    description:
      'Realiza una verificación completa de la salud del sistema de wallets',
  })
  @ApiResponse({
    status: 200,
    description: 'Verificación completada',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'healthy' },
        checks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', example: 'Database Connection' },
              status: { type: 'string', example: 'ok' },
              message: { type: 'string', example: 'Connected successfully' },
            },
          },
        },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Token JWT inválido' })
  async healthCheck(@Req() req: any) {
    return this.monitoringService.performHealthCheck();
  }

  @Get('suspicious-activity')
  @ApiOperation({
    summary: 'Obtener reporte de actividad sospechosa',
    description:
      'Obtiene un reporte de usuarios con actividad sospechosa en wallets',
  })
  @ApiQuery({
    name: 'limit',
    description: 'Número máximo de resultados',
    example: 20,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Reporte obtenido exitosamente',
    schema: {
      type: 'object',
      properties: {
        suspiciousUsers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              userId: { type: 'number', example: 1 },
              name: { type: 'string', example: 'Juan Pérez' },
              email: { type: 'string', example: 'juan@example.com' },
              riskScore: { type: 'number', example: 85 },
              reasons: { type: 'array', items: { type: 'string' } },
              lastActivity: { type: 'string', format: 'date-time' },
            },
          },
        },
        totalSuspicious: { type: 'number', example: 5 },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Token JWT inválido' })
  async getSuspiciousActivity(
    @Query('limit') limit: number = 20,
    @Req() req: any,
  ) {
    return this.monitoringService.getSuspiciousActivityReport(limit);
  }

  @Get('user/:userId/health')
  @ApiOperation({
    summary: 'Obtener health score de un usuario',
    description:
      'Obtiene el health score y recomendaciones para un usuario específico',
  })
  @ApiResponse({
    status: 200,
    description: 'Health score obtenido exitosamente',
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'number', example: 1 },
        score: { type: 'number', example: 75 },
        factors: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        lastChecked: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Token JWT inválido' })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado' })
  async getUserHealthScore(@Query('userId') userId: number, @Req() req: any) {
    return this.monitoringService.getWalletHealthScore(userId);
  }

  @Post('block')
  @ApiOperation({
    summary: 'Bloquear wallet de usuario',
    description: 'Bloquea la wallet de un usuario por razones administrativas',
  })
  @ApiBody({
    type: BlockWalletDto,
    description: 'Datos para bloquear wallet',
  })
  @ApiResponse({
    status: 200,
    description: 'Wallet bloqueada exitosamente',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Wallet bloqueada exitosamente' },
        blockedAt: { type: 'string', format: 'date-time' },
        blockedBy: { type: 'number', example: 1 },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  @ApiUnauthorizedResponse({ description: 'Token JWT inválido' })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado' })
  @HttpCode(HttpStatus.OK)
  async blockWallet(@Body() dto: BlockWalletDto, @Req() req: any) {
    return this.walletService.blockWallet(dto, req.ip);
  }

  @Post('unblock')
  @ApiOperation({
    summary: 'Desbloquear wallet de usuario',
    description: 'Desbloquea la wallet de un usuario',
  })
  @ApiBody({
    type: UnblockWalletDto,
    description: 'Datos para desbloquear wallet',
  })
  @ApiResponse({
    status: 200,
    description: 'Wallet desbloqueada exitosamente',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Wallet desbloqueada exitosamente',
        },
        unblockedAt: { type: 'string', format: 'date-time' },
        unblockedBy: { type: 'number', example: 1 },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  @ApiUnauthorizedResponse({ description: 'Token JWT inválido' })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado' })
  @HttpCode(HttpStatus.OK)
  async unblockWallet(@Body() dto: UnblockWalletDto, @Req() req: any) {
    return this.walletService.unblockWallet(dto, req.ip);
  }

  @Post('adjust-balance')
  @ApiOperation({
    summary: 'Ajustar balance de wallet',
    description:
      'Ajusta el balance de la wallet de un usuario (solo administradores)',
  })
  @ApiBody({
    type: AdjustBalanceDto,
    description: 'Datos para ajustar balance',
  })
  @ApiResponse({
    status: 200,
    description: 'Balance ajustado exitosamente',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        wallet: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            userId: { type: 'number', example: 1 },
            balance: { type: 'number', example: 150.0 },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        transaction: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            amount: { type: 'number', example: 25.0 },
            description: { type: 'string', example: 'Ajuste administrativo' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  @ApiUnauthorizedResponse({ description: 'Token JWT inválido' })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado' })
  @HttpCode(HttpStatus.OK)
  async adjustBalance(@Body() dto: AdjustBalanceDto, @Req() req: any) {
    return this.walletService.adjustBalance(dto, req.ip);
  }

  @Get('rate-limits/:userId')
  @ApiOperation({
    summary: 'Obtener estado de rate limits de usuario',
    description:
      'Obtiene el estado actual de rate limits para un usuario específico',
  })
  @ApiResponse({
    status: 200,
    description: 'Estado de rate limits obtenido exitosamente',
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'number', example: 1 },
        operations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              operation: { type: 'string', example: 'addFunds' },
              attempts: { type: 'number', example: 3 },
              maxAttempts: { type: 'number', example: 5 },
              remaining: { type: 'number', example: 2 },
              resetTime: { type: 'string', format: 'date-time' },
              isBlocked: { type: 'boolean', example: false },
              blockExpiry: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Token JWT inválido' })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado' })
  async getUserRateLimits(@Query('userId') userId: number, @Req() req: any) {
    const operations = [
      'addFunds',
      'transfer',
      'validate',
      'balance',
      'transactions',
    ];
    const results = {};

    for (const operation of operations) {
      results[operation] = await this.rateLimitService.getRateLimitStatus(
        userId,
        operation,
      );
    }

    return {
      userId,
      operations: results,
    };
  }

  @Post('rate-limits/:userId/reset')
  @ApiOperation({
    summary: 'Resetear rate limits de usuario',
    description: 'Resetea todos los rate limits para un usuario específico',
  })
  @ApiResponse({
    status: 200,
    description: 'Rate limits reseteados exitosamente',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Rate limits reseteados exitosamente',
        },
        resetAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Token JWT inválido' })
  @HttpCode(HttpStatus.OK)
  async resetUserRateLimits(@Query('userId') userId: number, @Req() req: any) {
    const operations = [
      'addFunds',
      'transfer',
      'validate',
      'balance',
      'transactions',
    ];

    for (const operation of operations) {
      await this.rateLimitService.resetRateLimit(userId, operation);
    }

    return {
      success: true,
      message: 'Rate limits reseteados exitosamente',
      resetAt: new Date(),
    };
  }
}
