import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { RateOrderDto } from './dto/rate-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DriverGuard } from '../drivers/guards/driver.guard';

@ApiTags('Orders')
@ApiBearerAuth('JWT-auth')
@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // ========== ENDPOINTS PARA CLIENTES ==========

  @Post()
  @ApiOperation({
    summary: 'Create new delivery order',
    description: 'Create a new delivery order from a store'
  })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid order data or store closed' })
  async createOrder(@Body() createOrderDto: CreateOrderDto, @Req() req) {
    const order = await this.ordersService.createOrder(createOrderDto, req.user.clerkId);
    return {
      data: order,
      message: 'Order created successfully'
    };
  }

  @Get()
  @ApiOperation({
    summary: 'Get user orders',
    description: 'Get all delivery orders for the current user'
  })
  @ApiQuery({ name: 'status', required: false, type: String, description: 'Filter by order status' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Maximum number of orders to return', example: 20 })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  async getUserOrders(
    @Query('status') status?: string,
    @Query('limit') limit: number = 20,
    @Req() req,
  ) {
    const orders = await this.ordersService.getUserOrders(req.user.clerkId, status, limit);
    return { data: orders };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get order details',
    description: 'Get detailed information about a specific order'
  })
  @ApiParam({ name: 'id', type: Number, description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Order details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getOrderDetails(@Param('id', ParseIntPipe) id: number, @Req() req) {
    const order = await this.ordersService.getOrderDetails(id, req.user.clerkId);
    return { data: order };
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancel order',
    description: 'Cancel a pending or confirmed order'
  })
  @ApiParam({ name: 'id', type: Number, description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Order cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Order cannot be cancelled' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async cancelOrder(@Param('id', ParseIntPipe) id: number, @Req() req) {
    const order = await this.ordersService.cancelOrder(id, req.user.clerkId);
    return {
      data: order,
      message: 'Order cancelled successfully'
    };
  }

  @Post(':id/rate')
  @ApiOperation({
    summary: 'Rate order and delivery',
    description: 'Rate the store and delivery service for a completed order'
  })
  @ApiParam({ name: 'id', type: Number, description: 'Order ID' })
  @ApiResponse({ status: 201, description: 'Order rated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid rating data' })
  @ApiResponse({ status: 404, description: 'Order not found or not eligible for rating' })
  async rateOrder(
    @Param('id', ParseIntPipe) id: number,
    @Body() ratingDto: RateOrderDto,
    @Req() req,
  ) {
    const ratings = await this.ordersService.rateOrder(id, ratingDto, req.user.clerkId);
    return {
      data: ratings,
      message: 'Order rated successfully'
    };
  }

  // ========== ENDPOINTS PARA CONDUCTORES ==========

  @Get('available')
  @UseGuards(DriverGuard)
  @ApiOperation({
    summary: 'Get available orders for delivery',
    description: 'Get delivery orders that are ready to be picked up by couriers'
  })
  @ApiResponse({ status: 200, description: 'Available orders retrieved successfully' })
  async getAvailableOrders(@Req() req) {
    const orders = await this.ordersService.getAvailableOrdersForDelivery();
    return { data: orders };
  }

  @Post(':id/accept')
  @UseGuards(DriverGuard)
  @ApiOperation({
    summary: 'Accept delivery order',
    description: 'Accept a delivery order for pickup and delivery'
  })
  @ApiParam({ name: 'id', type: Number, description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Order accepted successfully' })
  @ApiResponse({ status: 400, description: 'Order already assigned or not available' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async acceptOrder(@Param('id', ParseIntPipe) id: number, @Req() req) {
    const order = await this.ordersService.acceptOrderForDelivery(id, req.driver.id);
    return {
      data: order,
      message: 'Order accepted successfully'
    };
  }

  @Post(':id/pickup')
  @UseGuards(DriverGuard)
  @ApiOperation({
    summary: 'Mark order as picked up',
    description: 'Mark a delivery order as picked up from the store'
  })
  @ApiParam({ name: 'id', type: Number, description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Order marked as picked up' })
  @ApiResponse({ status: 404, description: 'Order not found or not assigned to you' })
  async pickupOrder(@Param('id', ParseIntPipe) id: number, @Req() req) {
    const order = await this.ordersService.markOrderPickedUp(id, req.driver.id);
    return {
      data: order,
      message: 'Order picked up successfully'
    };
  }

  @Post(':id/deliver')
  @UseGuards(DriverGuard)
  @ApiOperation({
    summary: 'Mark order as delivered',
    description: 'Mark a delivery order as successfully delivered to the customer'
  })
  @ApiParam({ name: 'id', type: Number, description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Order marked as delivered' })
  @ApiResponse({ status: 404, description: 'Order not found or not ready for delivery' })
  async deliverOrder(@Param('id', ParseIntPipe) id: number, @Req() req) {
    const order = await this.ordersService.markOrderDelivered(id, req.driver.id);
    return {
      data: order,
      message: 'Order delivered successfully'
    };
  }

  // ========== ENDPOINTS PARA TIENDAS ==========

  @Get('store/:storeId')
  @ApiOperation({
    summary: 'Get store orders',
    description: 'Get all orders for a specific store (for store owners)'
  })
  @ApiParam({ name: 'storeId', type: Number, description: 'Store ID' })
  @ApiQuery({ name: 'status', required: false, type: String, description: 'Filter by order status' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Maximum number of orders', example: 50 })
  @ApiResponse({ status: 200, description: 'Store orders retrieved successfully' })
  async getStoreOrders(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Query('status') status?: string,
    @Query('limit') limit: number = 50,
  ) {
    // TODO: Implement getStoreOrders method in service
    // This would require checking if the user is the store owner
    return { data: [], message: 'Not implemented yet' };
  }

  @Post('store/:storeId/:orderId/confirm')
  @ApiOperation({
    summary: 'Confirm order preparation',
    description: 'Mark an order as ready for pickup (for store owners)'
  })
  @ApiParam({ name: 'storeId', type: Number, description: 'Store ID' })
  @ApiParam({ name: 'orderId', type: Number, description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Order confirmed successfully' })
  async confirmOrder(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('orderId', ParseIntPipe) orderId: number,
  ) {
    // TODO: Implement confirmOrder method in service
    // This would update order status to 'confirmed' and notify couriers
    return { message: 'Not implemented yet' };
  }

  // ========== ENDPOINTS ANALYTICS ==========

  @Get('analytics/user')
  @ApiOperation({
    summary: 'Get user order analytics',
    description: 'Get analytics about user orders and spending'
  })
  @ApiQuery({ name: 'period', required: false, type: String, description: 'Time period (7d, 30d, 90d)', example: '30d' })
  @ApiResponse({ status: 200, description: 'User analytics retrieved successfully' })
  async getUserAnalytics(@Query('period') period: string = '30d', @Req() req) {
    // TODO: Implement user analytics
    return {
      data: {
        totalOrders: 0,
        totalSpent: 0,
        averageOrderValue: 0,
        favoriteStores: [],
        orderFrequency: 0,
      },
      message: 'Not implemented yet'
    };
  }

  @Get('analytics/driver')
  @UseGuards(DriverGuard)
  @ApiOperation({
    summary: 'Get driver delivery analytics',
    description: 'Get analytics about driver deliveries and earnings'
  })
  @ApiQuery({ name: 'period', required: false, type: String, description: 'Time period (7d, 30d, 90d)', example: '30d' })
  @ApiResponse({ status: 200, description: 'Driver analytics retrieved successfully' })
  async getDriverAnalytics(@Query('period') period: string = '30d', @Req() req) {
    // TODO: Implement driver analytics
    return {
      data: {
        totalDeliveries: 0,
        totalEarnings: 0,
        averageDeliveryTime: 0,
        customerRating: 0,
        acceptanceRate: 0,
      },
      message: 'Not implemented yet'
    };
  }
}
