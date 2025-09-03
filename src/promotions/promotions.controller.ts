import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
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
  @ApiOperation({
    summary: 'Apply a promo code and calculate the discount',
    description: 'Validate and apply a promotional code to calculate the discount on a ride fare'
  })
  @ApiBody({
    type: ApplyPromoDto,
    description: 'Promotion application details'
  })
  @ApiResponse({
    status: 200,
    description: 'Promotion applied successfully with discount calculation',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            promoCode: {
              type: 'string',
              example: 'WELCOME10',
              description: 'The applied promo code'
            },
            discountAmount: {
              type: 'number',
              example: 2.50,
              description: 'Calculated discount amount in dollars'
            },
            discountPercentage: {
              type: 'number',
              example: 10.0,
              description: 'Discount percentage applied'
            },
            originalAmount: {
              type: 'number',
              example: 25.0,
              description: 'Original ride amount before discount'
            },
            finalAmount: {
              type: 'number',
              example: 22.50,
              description: 'Final amount after discount'
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Missing fields, invalid promo code, or promo code expired',
  })
  @ApiResponse({
    status: 404,
    description: 'Promotion code not found'
  })
  @ApiResponse({ status: 500, description: 'Database error' })
  async applyPromo(
    @Body() applyPromoDto: ApplyPromoDto,
  ): Promise<{ data: any }> {
    const result = await this.promotionsService.applyPromo(applyPromoDto);
    return { data: result };
  }

  @Get('active')
  @ApiOperation({
    summary: 'Get all active promotions',
    description: 'Retrieve all currently active promotional codes that can be used by customers'
  })
  @ApiResponse({
    status: 200,
    description: 'Returns an array of active promotions',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          promoCode: { type: 'string', example: 'WELCOME10' },
          discountPercentage: { type: 'number', example: 10.0 },
          discountAmount: { type: 'number', example: null },
          expiryDate: { type: 'string', format: 'date', example: '2024-12-31' },
          isActive: { type: 'boolean', example: true },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' }
        }
      }
    }
  })
  @ApiResponse({ status: 500, description: 'Database error' })
  async getActivePromotions(): Promise<Promotion[]> {
    return this.promotionsService.getActivePromotions();
  }

  @Post()
  @ApiOperation({
    summary: 'Create a new promotion',
    description: 'Create a new promotional code for customers to use on rides'
  })
  @ApiBody({
    type: CreatePromotionDto,
    description: 'Promotion creation details'
  })
  @ApiResponse({
    status: 201,
    description: 'Promotion created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        promoCode: { type: 'string', example: 'WELCOME10' },
        discountPercentage: { type: 'number', example: 10.0 },
        discountAmount: { type: 'number', example: null },
        expiryDate: { type: 'string', format: 'date', example: '2024-12-31' },
        isActive: { type: 'boolean', example: true },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Missing required fields or invalid data'
  })
  @ApiResponse({
    status: 409,
    description: 'Promotion code already exists'
  })
  @ApiResponse({ status: 500, description: 'Database error' })
  async createPromotion(
    @Body() createPromotionDto: CreatePromotionDto,
  ): Promise<Promotion> {
    return this.promotionsService.createPromotion(createPromotionDto);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update a promotion',
    description: 'Update an existing promotion\'s details. Only provided fields will be updated.'
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier of the promotion',
    example: '1',
    type: Number
  })
  @ApiBody({
    type: UpdatePromotionDto,
    description: 'Fields to update in the promotion'
  })
  @ApiResponse({
    status: 200,
    description: 'Promotion updated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        promoCode: { type: 'string', example: 'UPDATED10' },
        discountPercentage: { type: 'number', example: 15.0 },
        discountAmount: { type: 'number', example: null },
        expiryDate: { type: 'string', format: 'date', example: '2024-12-31' },
        isActive: { type: 'boolean', example: true },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid data or promotion code already exists'
  })
  @ApiResponse({ status: 404, description: 'Promotion not found' })
  @ApiResponse({ status: 500, description: 'Database error' })
  async updatePromotion(
    @Param('id') id: string,
    @Body() updatePromotionDto: UpdatePromotionDto,
  ): Promise<Promotion> {
    return this.promotionsService.updatePromotion(
      Number(id),
      updatePromotionDto,
    );
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a promotion',
    description: 'Permanently delete a promotion. This action cannot be undone.'
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier of the promotion to delete',
    example: '1',
    type: Number
  })
  @ApiResponse({
    status: 200,
    description: 'Promotion deleted successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        promoCode: { type: 'string', example: 'WELCOME10' },
        discountPercentage: { type: 'number', example: 10.0 },
        discountAmount: { type: 'number', example: null },
        expiryDate: { type: 'string', format: 'date', example: '2024-12-31' },
        isActive: { type: 'boolean', example: false },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Promotion not found' })
  @ApiResponse({ status: 500, description: 'Database error' })
  async deletePromotion(@Param('id') id: string): Promise<Promotion> {
    return this.promotionsService.deletePromotion(Number(id));
  }
}
