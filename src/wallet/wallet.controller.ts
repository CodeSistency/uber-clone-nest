import { Controller, Get, Post, Query, Body } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { Wallet } from '@prisma/client';
import { AddFundsDto } from './dto/add-funds.dto';

@ApiTags('wallet')
@Controller('api/user/wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  @ApiOperation({
    summary: 'Get user wallet balance and transaction history',
    description:
      'Retrieve the current wallet balance and complete transaction history for a user',
  })
  @ApiQuery({
    name: 'userId',
    description: 'The Clerk ID of the user',
    example: 'user_2abc123def456',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Returns wallet and transaction data',
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
                user_clerk_id: {
                  type: 'string',
                  example: 'user_2abc123def456',
                },
                balance: { type: 'number', example: 125.5 },
                currency: { type: 'string', example: 'USD' },
                created_at: { type: 'string', format: 'date-time' },
                updated_at: { type: 'string', format: 'date-time' },
              },
            },
            transactions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 1 },
                  wallet_id: { type: 'number', example: 1 },
                  amount: { type: 'number', example: 50.0 },
                  type: {
                    type: 'string',
                    example: 'credit',
                    enum: ['credit', 'debit'],
                  },
                  description: { type: 'string', example: 'Wallet top-up' },
                  created_at: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'User ID is missing' })
  @ApiResponse({ status: 404, description: 'Wallet not found' })
  @ApiResponse({ status: 500, description: 'Database error' })
  async getUserWallet(@Query('userId') userId: string): Promise<{ data: any }> {
    const result = await this.walletService.getUserWallet(parseInt(userId));
    return { data: result };
  }

  @Post()
  @ApiOperation({
    summary: "Add funds to a user's wallet",
    description: 'Add money to a user wallet and create a transaction record',
  })
  @ApiBody({
    type: AddFundsDto,
    description: 'Fund addition details',
  })
  @ApiResponse({
    status: 200,
    description: 'Funds added successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        user_clerk_id: { type: 'string', example: 'user_2abc123def456' },
        balance: { type: 'number', example: 175.5 },
        currency: { type: 'string', example: 'USD' },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Missing fields or invalid amount' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 500, description: 'Database error' })
  async addFunds(@Body() addFundsDto: AddFundsDto): Promise<Wallet> {
    return this.walletService.addFunds(addFundsDto);
  }
}
