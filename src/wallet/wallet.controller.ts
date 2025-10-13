import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Req,
  UseGuards,
  Param,
  ParseIntPipe,
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
  ApiParam,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  WalletRateLimitGuard,
  WalletRateLimit,
} from './guards/wallet-rate-limit.guard';
import { WalletService } from './wallet.service';
import { Wallet } from '@prisma/client';
import { AddFundsDto } from './dto/add-funds.dto';
import { TransferFundsDto } from './dto/transfer-funds.dto';
import { BlockWalletDto } from './dto/block-wallet.dto';
import { UnblockWalletDto } from './dto/unblock-wallet.dto';
import { AdjustBalanceDto } from './dto/adjust-balance.dto';

@ApiTags('wallet')
@Controller('api/user/wallet')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  @ApiOperation({
    summary: 'Obtener balance y historial de wallet',
    description: `
      **WALLET DEL USUARIO**
      
      Obtiene el balance actual y historial de transacciones de la wallet del usuario autenticado.
      
      **Información incluida:**
      - Balance actual de la wallet
      - Historial completo de transacciones
      - Información de la wallet (fechas, estado)
      
      **Autenticación requerida:** JWT Token
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Wallet obtenida exitosamente',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            wallet: {
              type: 'object',
              properties: {
                id: { type: 'number', example: 1 },
                userId: { type: 'number', example: 1 },
                balance: { type: 'number', example: 125.5 },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
              },
            },
            transactions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 1 },
                  amount: { type: 'number', example: 50.0 },
                  transactionType: { type: 'string', example: 'credit' },
                  description: { type: 'string', example: 'Wallet top-up' },
                  createdAt: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Token JWT inválido' })
  @ApiNotFoundResponse({ description: 'Wallet no encontrada' })
  async getUserWallet(@Req() req: any): Promise<{ data: any }> {
    const result = await this.walletService.getUserWallet(req.user.id);
    return { data: result };
  }

  @Get('balance')
  @UseGuards(WalletRateLimitGuard)
  @WalletRateLimit('balance')
  @ApiOperation({
    summary: 'Obtener balance actual de wallet',
    description:
      'Obtiene únicamente el balance actual de la wallet del usuario',
  })
  @ApiResponse({
    status: 200,
    description: 'Balance obtenido exitosamente',
    schema: {
      type: 'object',
      properties: {
        balance: { type: 'number', example: 125.5 },
        currency: { type: 'string', example: 'USD' },
        lastUpdated: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Token JWT inválido' })
  async getWalletBalance(@Req() req: any) {
    return this.walletService.getWalletBalance(req.user.id);
  }

  @Get('transactions')
  @UseGuards(WalletRateLimitGuard)
  @WalletRateLimit('transactions')
  @ApiOperation({
    summary: 'Obtener historial de transacciones',
    description: 'Obtiene historial paginado de transacciones de la wallet',
  })
  @ApiQuery({
    name: 'page',
    description: 'Número de página',
    example: 1,
    required: false,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Elementos por página',
    example: 10,
    required: false,
  })
  @ApiQuery({
    name: 'type',
    description: 'Tipo de transacción',
    enum: ['credit', 'debit', 'all'],
    required: false,
  })
  @ApiQuery({
    name: 'startDate',
    description: 'Fecha de inicio (YYYY-MM-DD)',
    example: '2024-01-01',
    required: false,
  })
  @ApiQuery({
    name: 'endDate',
    description: 'Fecha de fin (YYYY-MM-DD)',
    example: '2024-12-31',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Historial obtenido exitosamente',
    schema: {
      type: 'object',
      properties: {
        transactions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              amount: { type: 'number', example: 50.0 },
              transactionType: { type: 'string', example: 'credit' },
              description: { type: 'string', example: 'Wallet top-up' },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 10 },
            total: { type: 'number', example: 25 },
            totalPages: { type: 'number', example: 3 },
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Token JWT inválido' })
  async getTransactionHistory(
    @Req() req: any,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('type') type?: 'credit' | 'debit' | 'all',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.walletService.getTransactionHistory(req.user.id, {
      page,
      limit,
      type,
      startDate,
      endDate,
    });
  }

  @Post('add-funds')
  @UseGuards(WalletRateLimitGuard)
  @WalletRateLimit('addFunds')
  @ApiOperation({
    summary: 'Agregar fondos a la wallet',
    description:
      'Agrega dinero a la wallet del usuario autenticado y crea un registro de transacción',
  })
  @ApiBody({
    type: AddFundsDto,
    description: 'Detalles de la adición de fondos',
  })
  @ApiResponse({
    status: 201,
    description: 'Fondos agregados exitosamente',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        wallet: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            userId: { type: 'number', example: 1 },
            balance: { type: 'number', example: 175.5 },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        transaction: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            amount: { type: 'number', example: 50.0 },
            transactionType: { type: 'string', example: 'credit' },
            description: { type: 'string', example: 'Wallet top-up' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Datos inválidos o límites excedidos' })
  @ApiUnauthorizedResponse({ description: 'Token JWT inválido' })
  @HttpCode(HttpStatus.CREATED)
  async addFunds(@Body() addFundsDto: AddFundsDto, @Req() req: any) {
    return this.walletService.addFunds(addFundsDto, req.user.id, req.ip);
  }

  @Post('transfer')
  @UseGuards(WalletRateLimitGuard)
  @WalletRateLimit('transfer')
  @ApiOperation({
    summary: 'Transferir fondos a otro usuario',
    description: 'Transfiere fondos de la wallet del usuario a otro usuario',
  })
  @ApiBody({
    type: TransferFundsDto,
    description: 'Detalles de la transferencia',
  })
  @ApiResponse({
    status: 200,
    description: 'Transferencia realizada exitosamente',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        transactionId: { type: 'string', example: 'TXN-123456' },
        fromBalance: { type: 'number', example: 100.0 },
        toBalance: { type: 'number', example: 200.0 },
        message: { type: 'string', example: 'Transferencia exitosa' },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Datos inválidos o fondos insuficientes',
  })
  @ApiUnauthorizedResponse({ description: 'Token JWT inválido' })
  async transferFunds(@Body() dto: TransferFundsDto, @Req() req: any) {
    return this.walletService.transferFunds(
      {
        ...dto,
        fromUserId: req.user.id,
      },
      req.ip,
    );
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Obtener estadísticas de wallet',
    description: 'Obtiene estadísticas detalladas de la wallet del usuario',
  })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas obtenidas exitosamente',
    schema: {
      type: 'object',
      properties: {
        totalTransactions: { type: 'number', example: 25 },
        totalCredits: { type: 'number', example: 500.0 },
        totalDebits: { type: 'number', example: 375.0 },
        averageTransaction: { type: 'number', example: 20.0 },
        monthlyStats: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              month: { type: 'string', example: '2024-01' },
              credits: { type: 'number', example: 100.0 },
              debits: { type: 'number', example: 75.0 },
              net: { type: 'number', example: 25.0 },
            },
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Token JWT inválido' })
  async getWalletStats(@Req() req: any) {
    return this.walletService.getWalletStats(req.user.id);
  }

  @Get('limits')
  @ApiOperation({
    summary: 'Obtener límites de transacción',
    description: 'Obtiene los límites de transacción del usuario',
  })
  @ApiResponse({
    status: 200,
    description: 'Límites obtenidos exitosamente',
    schema: {
      type: 'object',
      properties: {
        dailyLimit: { type: 'number', example: 1000 },
        singleTransactionLimit: { type: 'number', example: 500 },
        transferLimit: { type: 'number', example: 200 },
        usedToday: { type: 'number', example: 150 },
        remainingToday: { type: 'number', example: 850 },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Token JWT inválido' })
  async getWalletLimits(@Req() req: any) {
    return this.walletService.getWalletLimits(req.user.id);
  }

  @Post('validate')
  @UseGuards(WalletRateLimitGuard)
  @WalletRateLimit('validate')
  @ApiOperation({
    summary: 'Validar operación de wallet',
    description:
      'Valida si una operación de wallet es posible antes de ejecutarla',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        operation: {
          type: 'string',
          enum: ['add_funds', 'transfer', 'deduct'],
        },
        amount: { type: 'number', example: 50.0 },
        toUserEmail: { type: 'string', example: 'usuario@example.com' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Validación completada',
    schema: {
      type: 'object',
      properties: {
        valid: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Operación válida' },
        limits: {
          type: 'object',
          properties: {
            dailyLimit: { type: 'number', example: 1000 },
            remainingToday: { type: 'number', example: 850 },
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Token JWT inválido' })
  async validateOperation(@Body() body: any, @Req() req: any) {
    return this.walletService.validateOperation(req.user.id, body);
  }
}
