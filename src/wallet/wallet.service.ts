import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Wallet, WalletTransaction } from '@prisma/client';
import { AddFundsDto } from './dto/add-funds.dto';

@Injectable()
export class WalletService {
  constructor(private prisma: PrismaService) {}

  async getUserWallet(
    userId: string,
  ): Promise<{ wallet: Wallet; transactions: WalletTransaction[] } | null> {
    // Find or create wallet for user
    let wallet = await this.prisma.wallet.findUnique({
      where: { userClerkId: userId },
    });

    if (!wallet) {
      wallet = await this.prisma.wallet.create({
        data: { userClerkId: userId },
      });
    }

    // Get wallet transactions
    const transactions = await this.prisma.walletTransaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' },
    });

    return { wallet, transactions };
  }

  async addFunds(addFundsDto: AddFundsDto): Promise<Wallet> {
    const { userClerkId, amount, description } = addFundsDto;

    // Find or create wallet
    let wallet = await this.prisma.wallet.findUnique({
      where: { userClerkId },
    });

    if (!wallet) {
      wallet = await this.prisma.wallet.create({
        data: { userClerkId },
      });
    }

    // Create transaction
    await this.prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        amount,
        transactionType: 'credit',
        description,
      },
    });

    // Update wallet balance
    const updatedWallet = await this.prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: {
          increment: amount,
        },
      },
    });

    return updatedWallet;
  }

  async deductFunds(
    userClerkId: string,
    amount: number,
    description: string,
  ): Promise<Wallet> {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userClerkId },
    });

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    if (Number(wallet.balance) < amount) {
      throw new Error('Insufficient funds');
    }

    // Create transaction
    await this.prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        amount: -amount,
        transactionType: 'debit',
        description,
      },
    });

    // Update wallet balance
    const updatedWallet = await this.prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: {
          decrement: amount,
        },
      },
    });

    return updatedWallet;
  }
}
