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
  @ApiOperation({ summary: 'Get user wallet balance and transaction history' })
  @ApiQuery({ name: 'userId', description: 'The Clerk ID of the user' })
  @ApiResponse({
    status: 200,
    description: 'Returns wallet and transaction data',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            wallet: { type: 'object' },
            transactions: { type: 'array' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'User ID is missing' })
  @ApiResponse({ status: 500, description: 'Database error' })
  async getUserWallet(@Query('userId') userId: string): Promise<{ data: any }> {
    const result = await this.walletService.getUserWallet(userId);
    return { data: result };
  }

  @Post()
  @ApiOperation({ summary: "Add funds to a user's wallet" })
  @ApiBody({ type: AddFundsDto })
  @ApiResponse({ status: 200, description: 'Funds added successfully' })
  @ApiResponse({ status: 400, description: 'Missing fields' })
  @ApiResponse({ status: 500, description: 'Database error' })
  async addFunds(@Body() addFundsDto: AddFundsDto): Promise<Wallet> {
    return this.walletService.addFunds(addFundsDto);
  }
}
