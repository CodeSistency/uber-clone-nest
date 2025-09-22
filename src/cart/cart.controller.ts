import { Body, Controller, Delete, Get, Post, Put, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CartService } from './cart.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { RemoveCartItemDto } from './dto/remove-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@ApiTags('cart')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('api/cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post('add-item')
  @ApiOperation({
    summary: 'Add item to cart',
    description: `
    Adds a product to the user's shopping cart.
    If the product already exists in the cart, the quantity will be increased.
    Creates a new cart if the user doesn't have one.
    `
  })
  async addItem(@Body() dto: AddCartItemDto, @Req() req: any) {
    const cart = await this.cartService.addItem(req.user.id, dto);
    return { data: cart };
  }

  @Get('summary')
  @ApiOperation({
    summary: 'Get cart summary',
    description: `
    Returns the current user's cart with all items, quantities, and total price.
    Includes product details and store information.
    `
  })
  async getSummary(@Req() req: any) {
    const summary = await this.cartService.getCartSummary(req.user.id);
    return { data: summary };
  }

  @Put('update-item')
  @ApiOperation({
    summary: 'Update cart item',
    description: `
    Updates the quantity and/or notes of an existing cart item.
    Validates stock availability before updating.
    `
  })
  async updateItem(@Body() dto: UpdateCartItemDto, @Req() req: any) {
    const cart = await this.cartService.updateItem(req.user.id, dto);
    return { data: cart };
  }

  @Delete('remove-item')
  @ApiOperation({
    summary: 'Remove item from cart',
    description: `
    Removes a specific product from the user's cart.
    If the product is not in the cart, returns an error.
    `
  })
  async removeItem(@Body() dto: RemoveCartItemDto, @Req() req: any) {
    const cart = await this.cartService.removeItem(req.user.id, dto);
    return { data: cart };
  }

  @Post('clear')
  @ApiOperation({
    summary: 'Clear cart',
    description: `
    Removes all items from the user's cart.
    This action cannot be undone.
    `
  })
  async clearCart(@Req() req: any) {
    const cart = await this.cartService.clearCart(req.user.id);
    return { data: cart };
  }

  @Get('count')
  @ApiOperation({
    summary: 'Get cart item count',
    description: `
    Returns the total number of items in the user's cart.
    Useful for displaying cart badge in the UI.
    `
  })
  async getItemCount(@Req() req: any) {
    const count = await this.cartService.getCartItemCount(req.user.id);
    return { data: { count } };
  }

  @Post('validate')
  @ApiOperation({
    summary: 'Validate cart for checkout',
    description: `
    Validates that all items in the cart are still available and in stock.
    Returns validation results with any issues found.
    `
  })
  async validateCart(@Req() req: any) {
    const validation = await this.cartService.validateCartForOrder(req.user.id);
    return { data: validation };
  }
}
