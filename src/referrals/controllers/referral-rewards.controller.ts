import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpStatus,
  Logger,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { ReferralRewardsService } from '../services/referral-rewards.service';
import { ReferralAnalyticsService } from '../services/referral-analytics.service';
import { ReferralTierDto } from '../dto/referral-tier.dto';
import { RewardCalculationDto } from '../dto/reward-calculation.dto';
import { RewardCalculationResponseDto } from '../dto/reward-calculation-response.dto';

@ApiTags('Referral Rewards')
@Controller('referral-rewards')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ReferralRewardsController {
  private readonly logger = new Logger(ReferralRewardsController.name);

  constructor(
    private readonly referralRewardsService: ReferralRewardsService,
    private readonly referralAnalyticsService: ReferralAnalyticsService,
  ) {}

  @Get('tiers')
  @ApiOperation({
    summary: 'Get available reward tiers',
    description: 'Returns all active reward tiers with their requirements and benefits',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Reward tiers retrieved successfully',
    type: [ReferralTierDto],
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
  })
  async getRewardTiers(): Promise<ReferralTierDto[]> {
    try {
      this.logger.log('Getting available reward tiers');
      const tiers = await this.referralRewardsService.getActiveRewardConfigurations();

      return tiers.map(tier => ({
        tier: tier.tier,
        minReferrals: tier.minReferrals,
        maxReferrals: tier.maxReferrals,
        rewardType: tier.rewardType,
        rewardAmount: tier.rewardAmount,
        conditions: tier.conditions,
        validityDays: tier.validityDays,
        isActive: tier.isActive,
      }));
    } catch (error) {
      this.logger.error('Error getting reward tiers:', error);
      throw error;
    }
  }

  @Get('my-tier')
  @ApiOperation({
    summary: 'Get my current reward tier',
    description: 'Returns the current reward tier of the authenticated user based on their referral performance',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Current tier retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        tier: {
          type: 'string',
          enum: ['BASIC', 'ADVANCED', 'VIP'],
          example: 'ADVANCED',
        },
        convertedReferrals: {
          type: 'number',
          example: 8,
        },
        nextTierRequirements: {
          type: 'object',
          nullable: true,
          properties: {
            tier: { type: 'string', example: 'VIP' },
            referralsNeeded: { type: 'number', example: 13 },
          },
        },
      },
    },
  })
  async getMyCurrentTier(@GetUser('id') userId: number): Promise<{
    tier: string;
    convertedReferrals: number;
    nextTierRequirements?: {
      tier: string;
      referralsNeeded: number;
    };
  }> {
    try {
      this.logger.log(`Getting current tier for user ${userId}`);

      const tier = await this.referralRewardsService.getUserCurrentTier(userId);
      const userStats = await this.referralAnalyticsService.getUserReferralStats(userId);

      let nextTierRequirements;
      if (tier === 'BASIC' && userStats.convertedReferrals < 6) {
        nextTierRequirements = {
          tier: 'ADVANCED',
          referralsNeeded: 6 - userStats.convertedReferrals,
        };
      } else if (tier === 'ADVANCED' && userStats.convertedReferrals < 21) {
        nextTierRequirements = {
          tier: 'VIP',
          referralsNeeded: 21 - userStats.convertedReferrals,
        };
      }

      return {
        tier,
        convertedReferrals: userStats.convertedReferrals,
        nextTierRequirements,
      };
    } catch (error) {
      this.logger.error(`Error getting current tier for user ${userId}:`, error);
      throw error;
    }
  }

  @Post('calculate')
  @ApiOperation({
    summary: 'Calculate potential rewards',
    description: 'Calculates potential rewards for a given number of referrals and tier',
  })
  @ApiBody({
    type: RewardCalculationDto,
    description: 'Parameters for reward calculation',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Rewards calculated successfully',
    type: RewardCalculationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid calculation parameters',
  })
  async calculateRewards(
    @GetUser('id') userId: number,
    @Body(ValidationPipe) dto: RewardCalculationDto,
  ): Promise<RewardCalculationResponseDto> {
    try {
      this.logger.log(`Calculating rewards for user ${userId} with ${dto.referralCount} referrals`);

      // Usar el tier especificado o determinar el tier actual del usuario
      const tier = dto.tier || await this.referralRewardsService.getUserCurrentTier(userId);

      // Obtener configuración del tier
      const tierConfig = await this.referralRewardsService.getActiveRewardConfigurations()
        .then(configs => configs.find(c => c.tier === tier));

      if (!tierConfig) {
        throw new Error(`Tier configuration not found for ${tier}`);
      }

      // Calcular recompensas basadas en el número de referidos
      const referrerReward = dto.referralCount * tierConfig.rewardAmount;
      const refereeReward = dto.referralCount * 10; // Base referee reward

      return {
        tier,
        referralCount: dto.referralCount,
        referrerReward,
        refereeReward,
        totalEarnings: referrerReward,
        conditions: tierConfig.conditions,
        validityDays: tierConfig.validityDays,
      };
    } catch (error) {
      this.logger.error(`Error calculating rewards for user ${userId}:`, error);
      throw error;
    }
  }
}


