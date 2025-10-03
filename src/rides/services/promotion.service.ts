import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PricingCacheService } from './pricing-cache.service';

export interface PromotionValidation {
  isValid: boolean;
  promotion?: {
    id: number;
    code: string;
    discountPercentage?: number;
    discountAmount?: number;
    expiryDate?: Date;
  };
  discount: number;
  discountType: 'percentage' | 'fixed';
  error?: string;
}

@Injectable()
export class PromotionService {
  private readonly logger = new Logger(PromotionService.name);

  constructor(
    private prisma: PrismaService,
    private cacheService: PricingCacheService,
  ) {}

  /**
   * Validate and calculate discount for a promotional code
   */
  async validateAndCalculateDiscount(
    promoCode: string,
    baseAmount: number,
    userId?: number,
  ): Promise<PromotionValidation> {
    try {
      // Check cache first
      const cached = await this.cacheService.getPromotion(promoCode);
      let promotion = cached?.promotion;

      if (!cached) {
        // Find the promotion in database
        promotion = await this.prisma.promotion.findUnique({
          where: { promoCode: promoCode.toUpperCase() },
        });

        // Cache the promotion data (even if not found)
        await this.cacheService.setPromotion(promoCode, { promotion });
      }

      if (!promotion) {
        return {
          isValid: false,
          discount: 0,
          discountType: 'fixed',
          error: 'Promotional code not found',
        };
      }

      // Check if promotion is active
      if (!promotion.isActive) {
        return {
          isValid: false,
          discount: 0,
          discountType: 'fixed',
          error: 'Promotional code is inactive',
        };
      }

      // Check expiry date
      if (promotion.expiryDate && promotion.expiryDate < new Date()) {
        return {
          isValid: false,
          discount: 0,
          discountType: 'fixed',
          error: 'Promotional code has expired',
        };
      }

      // Calculate discount
      let discount = 0;
      let discountType: 'percentage' | 'fixed' = 'fixed';

      if (promotion.discountPercentage) {
        discount = baseAmount * Number(promotion.discountPercentage);
        discountType = 'percentage';
      } else if (promotion.discountAmount) {
        discount = Number(promotion.discountAmount);
        discountType = 'fixed';
      }

      // Ensure discount doesn't exceed base amount
      discount = Math.min(discount, baseAmount);

      const result = {
        isValid: true,
        promotion: {
          id: promotion.id,
          code: promotion.promoCode,
          discountPercentage: promotion.discountPercentage ? Number(promotion.discountPercentage) : undefined,
          discountAmount: promotion.discountAmount ? Number(promotion.discountAmount) : undefined,
          expiryDate: promotion.expiryDate || undefined,
        },
        discount: Math.round(discount * 100) / 100, // Round to 2 decimal places
        discountType,
      };

      // Cache the validation result
      await this.cacheService.setPromotion(promoCode, { promotion, validation: result });

      return result;
    } catch (error) {
      this.logger.error(`Error validating promo code ${promoCode}:`, error);
      return {
        isValid: false,
        discount: 0,
        discountType: 'fixed',
        error: 'Error validating promotional code',
      };
    }
  }

  /**
   * Get promotion details by code
   */
  async getPromotionByCode(promoCode: string) {
    return this.prisma.promotion.findUnique({
      where: { promoCode: promoCode.toUpperCase() },
    });
  }

  /**
   * Check if promotion can be used by user (future enhancement)
   */
  async canUserUsePromotion(userId: number, promotionId: number): Promise<boolean> {
    // Future: Implement usage limits, user-specific restrictions, etc.
    // For now, always allow
    return true;
  }

  /**
   * Record promotion usage (future enhancement for analytics)
   */
  async recordPromotionUsage(
    promotionId: number,
    userId: number,
    discountAmount: number,
    serviceType: string = 'ride',
  ): Promise<void> {
    // Future: Log promotion usage for analytics
    this.logger.log(`Promotion ${promotionId} used by user ${userId} for ${discountAmount} discount`);
  }
}
