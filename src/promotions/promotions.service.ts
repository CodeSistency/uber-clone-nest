import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Promotion, Prisma } from '@prisma/client';
import { ApplyPromoDto } from './dto/apply-promo.dto';

@Injectable()
export class PromotionsService {
  constructor(private prisma: PrismaService) {}

  async applyPromo(applyPromoDto: ApplyPromoDto): Promise<{
    promoCode: string;
    discountAmount: number;
    discountPercentage: number | null;
    originalAmount: number;
    finalAmount: number;
  }> {
    const { promoCode, rideAmount } = applyPromoDto;

    const promotion = await this.prisma.promotion.findUnique({
      where: { promoCode },
    });

    if (!promotion) {
      throw new Error('Invalid promo code');
    }

    if (!promotion.isActive) {
      throw new Error('Promo code is not active');
    }

    if (promotion.expiryDate && promotion.expiryDate < new Date()) {
      throw new Error('Promo code has expired');
    }

    let discountAmount = 0;

    if (promotion.discountPercentage) {
      discountAmount =
        (rideAmount * Number(promotion.discountPercentage)) / 100;
    } else if (promotion.discountAmount) {
      discountAmount = Number(promotion.discountAmount);
    }

    const finalAmount = rideAmount - discountAmount;

    return {
      promoCode: promotion.promoCode,
      discountAmount,
      discountPercentage: promotion.discountPercentage ? Number(promotion.discountPercentage) : null,
      originalAmount: rideAmount,
      finalAmount: Math.max(0, finalAmount), // Ensure final amount is not negative
    };
  }

  async getActivePromotions(): Promise<Promotion[]> {
    return this.prisma.promotion.findMany({
      where: {
        isActive: true,
        OR: [{ expiryDate: null }, { expiryDate: { gte: new Date() } }],
      },
    });
  }

  async createPromotion(data: Prisma.PromotionCreateInput): Promise<Promotion> {
    return this.prisma.promotion.create({
      data,
    });
  }

  async updatePromotion(
    id: number,
    data: Prisma.PromotionUpdateInput,
  ): Promise<Promotion> {
    return this.prisma.promotion.update({
      where: { id },
      data,
    });
  }

  async deletePromotion(id: number): Promise<Promotion> {
    return this.prisma.promotion.delete({
      where: { id },
    });
  }
}
