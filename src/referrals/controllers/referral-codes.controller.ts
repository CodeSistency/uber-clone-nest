import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  HttpStatus,
  HttpCode,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { ReferralCodesService } from '../services/referral-codes.service';
import { ReferralCodeResponseDto } from '../dto/referral-code-response.dto';
import { ReferralCodeStatsDto } from '../dto/referral-code-stats.dto';

@ApiTags('Referral Codes')
@Controller('referral-codes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ReferralCodesController {
  private readonly logger = new Logger(ReferralCodesController.name);

  constructor(private readonly referralCodesService: ReferralCodesService) {}

  @Get('my-code')
  @ApiOperation({
    summary: 'Get my referral code',
    description: 'Returns the authenticated user\'s referral code, creating one if it doesn\'t exist',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Referral code retrieved successfully',
    type: ReferralCodeResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
  })
  async getMyReferralCode(@GetUser('id') userId: number): Promise<ReferralCodeResponseDto> {
    try {
      this.logger.log(`Getting referral code for user ${userId}`);
      const referralCode = await this.referralCodesService.getOrCreateUserReferralCode(userId);

      return {
        code: referralCode.code,
        isActive: referralCode.isActive,
        usageCount: referralCode.usageCount,
        maxUses: referralCode.maxUses,
        expiresAt: referralCode.expiresAt,
        createdAt: referralCode.createdAt,
        updatedAt: referralCode.updatedAt,
      };
    } catch (error) {
      this.logger.error(`Error getting referral code for user ${userId}:`, error);
      throw error;
    }
  }

  @Get(':code/stats')
  @ApiOperation({
    summary: 'Get referral code statistics',
    description: 'Returns public statistics for a referral code (usages, conversions, earnings)',
  })
  @ApiParam({
    name: 'code',
    description: 'The referral code to get statistics for',
    example: 'UBER123ABC',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Referral code statistics retrieved successfully',
    type: ReferralCodeStatsDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Referral code not found',
  })
  async getReferralCodeStats(@Param('code') code: string): Promise<ReferralCodeStatsDto> {
    try {
      this.logger.log(`Getting stats for referral code ${code}`);
      return await this.referralCodesService.getReferralCodeStats(code);
    } catch (error) {
      this.logger.error(`Error getting stats for referral code ${code}:`, error);
      throw error;
    }
  }

  @Post('regenerate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Regenerate referral code',
    description: 'Creates a new referral code for the authenticated user, deactivating the previous one',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'New referral code generated successfully',
    type: ReferralCodeResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
  })
  async regenerateReferralCode(@GetUser('id') userId: number): Promise<ReferralCodeResponseDto> {
    try {
      this.logger.log(`Regenerating referral code for user ${userId}`);
      const referralCode = await this.referralCodesService.regenerateUserReferralCode(userId);

      return {
        code: referralCode.code,
        isActive: referralCode.isActive,
        usageCount: referralCode.usageCount,
        maxUses: referralCode.maxUses,
        expiresAt: referralCode.expiresAt,
        createdAt: referralCode.createdAt,
        updatedAt: referralCode.updatedAt,
      };
    } catch (error) {
      this.logger.error(`Error regenerating referral code for user ${userId}:`, error);
      throw error;
    }
  }
}


