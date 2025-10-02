import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpStatus,
  HttpCode,
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
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { ReferralsService } from '../services/referrals.service';
import { ReferralAnalyticsService } from '../services/referral-analytics.service';
import { UseReferralCodeDto } from '../dto/use-referral-code.dto';
import { ReferralResponseDto } from '../dto/referral-response.dto';
import { ReferralStatsDto } from '../dto/referral-stats.dto';

@ApiTags('Referrals')
@Controller('referrals')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ReferralsController {
  private readonly logger = new Logger(ReferralsController.name);

  constructor(
    private readonly referralsService: ReferralsService,
    private readonly referralAnalyticsService: ReferralAnalyticsService,
  ) {}

  @Get('my-referrals')
  @ApiOperation({
    summary: 'Get my referrals',
    description:
      'Returns all referrals made by the authenticated user with detailed information',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Referrals retrieved successfully',
    type: [ReferralResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
  })
  async getMyReferrals(
    @GetUser('id') userId: number,
  ): Promise<ReferralResponseDto[]> {
    try {
      this.logger.log(`Getting referrals for user ${userId}`);
      const referrals = await this.referralsService.getUserReferrals(userId);

      return referrals.map((referral) => ({
        id: referral.id,
        referralCodeId: referral.referralCodeId,
        status: referral.status,
        rewardAmount: referral.rewardAmount
          ? Number(referral.rewardAmount)
          : undefined,
        rewardType: referral.rewardType ?? undefined,
        createdAt: referral.createdAt,
        convertedAt: referral.convertedAt ?? undefined,
        referee: {
          id: referral.referee.id,
          name: referral.referee.name,
          email: referral.referee.email,
          createdAt: referral.referee.createdAt,
        },
        transactions: referral.transactions.map((transaction) => ({
          id: transaction.id,
          amount: Number(transaction.amount),
          type: transaction.type,
          description: transaction.description ?? undefined,
          createdAt: transaction.createdAt,
        })),
      }));
    } catch (error) {
      this.logger.error(`Error getting referrals for user ${userId}:`, error);
      throw error;
    }
  }

  @Post('use-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Use referral code',
    description:
      'Applies a referral code during new user registration or account setup',
  })
  @ApiBody({
    type: UseReferralCodeDto,
    description: 'Referral code to apply',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Referral code applied successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Referral code applied successfully',
        },
        referral: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 123 },
            referrerId: { type: 'number', example: 456 },
            refereeId: { type: 'number', example: 789 },
            status: { type: 'string', example: 'pending' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid referral code or user cannot be referred',
  })
  async useReferralCode(
    @GetUser('id') userId: number,
    @Body(ValidationPipe) dto: UseReferralCodeDto,
  ): Promise<{
    success: boolean;
    message: string;
    referral?: {
      id: number;
      referrerId: number;
      refereeId: number;
      status: string;
    };
  }> {
    try {
      this.logger.log(
        `Applying referral code ${dto.referralCode} for user ${userId}`,
      );

      // Verificar que el usuario puede ser referido
      const canBeReferred =
        await this.referralsService.canUserBeReferred(userId);
      if (!canBeReferred) {
        return {
          success: false,
          message: 'User has already been referred or cannot be referred',
        };
      }

      const result = await this.referralsService.applyReferralCode(
        dto.referralCode,
        userId,
      );

      if (result.success && result.referral) {
        return {
          success: true,
          message: 'Referral code applied successfully',
          referral: {
            id: result.referral.id,
            referrerId: result.referral.referrerId,
            refereeId: result.referral.refereeId,
            status: result.referral.status,
          },
        };
      } else {
        return {
          success: false,
          message: result.error || 'Failed to apply referral code',
        };
      }
    } catch (error) {
      this.logger.error(
        `Error applying referral code for user ${userId}:`,
        error,
      );
      return {
        success: false,
        message: 'Internal error processing referral code',
      };
    }
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Get referral statistics',
    description:
      "Returns comprehensive statistics about the user's referral performance",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Referral statistics retrieved successfully',
    type: ReferralStatsDto,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
  })
  async getReferralStats(
    @GetUser('id') userId: number,
  ): Promise<ReferralStatsDto> {
    try {
      this.logger.log(`Getting referral stats for user ${userId}`);
      return await this.referralAnalyticsService.getUserReferralStats(userId);
    } catch (error) {
      this.logger.error(
        `Error getting referral stats for user ${userId}:`,
        error,
      );
      throw error;
    }
  }
}
