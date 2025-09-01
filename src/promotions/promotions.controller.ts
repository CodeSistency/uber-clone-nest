import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { PromotionsService } from './promotions.service';
import { Promotion } from '@prisma/client';
import { ApplyPromoDto } from './dto/apply-promo.dto';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';

@ApiTags('promotions')
@Controller('api/promo')
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Post('apply')
  @ApiOperation({ summary: 'Apply a promo code and calculate the discount' })
  @ApiBody({ type: ApplyPromoDto })
  @ApiResponse({
    status: 200,
    description: 'Returns discount details',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            promoCode: { type: 'string' },
            discountAmount: { type: 'number' },
            discountPercentage: { type: 'number' },
            originalAmount: { type: 'number' },
            finalAmount: { type: 'number' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Missing fields or invalid promo code' })
  @ApiResponse({ status: 500, description: 'Database error' })
  async applyPromo(@Body() applyPromoDto: ApplyPromoDto): Promise<{ data: any }> {
    const result = await this.promotionsService.applyPromo(applyPromoDto);
    return { data: result };
  }

  @Get('active')
  @ApiOperation({ summary: 'Get all active promotions' })
  @ApiResponse({ status: 200, description: 'Returns active promotions' })
  async getActivePromotions(): Promise<Promotion[]> {
    return this.promotionsService.getActivePromotions();
  }

  @Post()
  @ApiOperation({ summary: 'Create a new promotion' })
  @ApiBody({ type: CreatePromotionDto })
  @ApiResponse({ status: 201, description: 'Promotion created successfully' })
  async createPromotion(@Body() createPromotionDto: CreatePromotionDto): Promise<Promotion> {
    return this.promotionsService.createPromotion(createPromotionDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a promotion' })
  @ApiParam({ name: 'id', description: 'Promotion ID' })
  @ApiBody({ type: UpdatePromotionDto })
  @ApiResponse({ status: 200, description: 'Promotion updated successfully' })
  async updatePromotion(@Param('id') id: string, @Body() updatePromotionDto: UpdatePromotionDto): Promise<Promotion> {
    return this.promotionsService.updatePromotion(Number(id), updatePromotionDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a promotion' })
  @ApiParam({ name: 'id', description: 'Promotion ID' })
  @ApiResponse({ status: 200, description: 'Promotion deleted successfully' })
  async deletePromotion(@Param('id') id: string): Promise<Promotion> {
    return this.promotionsService.deletePromotion(Number(id));
  }
}
