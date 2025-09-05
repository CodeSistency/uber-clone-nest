import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ParseIntPipe
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DriverGuard } from '../drivers/guards/driver.guard';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create new order',
    description: 'Create a new delivery order from a store'
  })
  @ApiResponse({
    status: 201,
    description: 'Order created successfully'
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid order data'
  })
  async createOrder(
    @Body() createOrderDto: CreateOrderDto,
    @Req() req: any
  ) {
    return this.ordersService.createOrder(createOrderDto, req.user.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get user orders',
    description: 'Get all orders for the authenticated user'
  })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Returns user orders'
  })
  async getUserOrders(
    @Req() req: any,
    @Query('status') status?: string
  ) {
    return this.ordersService.getUserOrders(req.user.id, status);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get order details',
    description: 'Get detailed information about a specific order'
  })
  @ApiResponse({
    status: 200,
    description: 'Returns order details'
  })
  @ApiResponse({
    status: 404,
    description: 'Order not found'
  })
  async getOrderById(
    @Param('id', ParseIntPipe) orderId: number,
    @Req() req: any
  ) {
    return this.ordersService.getOrderById(orderId, req.user.id);
  }

  @Get('driver/available')
  @UseGuards(JwtAuthGuard, DriverGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get available orders for delivery',
    description: 'Get all pending orders available for drivers (driver only)'
  })
  @ApiResponse({
    status: 200,
    description: 'Returns available orders'
  })
  async getAvailableOrders() {
    return this.ordersService.getAvailableOrdersForDelivery();
  }

  @Post(':id/accept')
  @UseGuards(JwtAuthGuard, DriverGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Accept order for delivery',
    description: 'Driver accepts an order for delivery (driver only)'
  })
  @ApiResponse({
    status: 200,
    description: 'Order accepted successfully'
  })
  @ApiResponse({
    status: 400,
    description: 'Order already taken or driver not available'
  })
  async acceptOrder(
    @Param('id', ParseIntPipe) orderId: number,
    @Req() req: any
  ) {
    return this.ordersService.acceptOrderForDelivery(orderId, req.driver.id);
  }

  @Post(':id/pickup')
  @UseGuards(JwtAuthGuard, DriverGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Mark order as picked up',
    description: 'Driver marks order as picked up from store (driver only)'
  })
  @ApiResponse({
    status: 200,
    description: 'Order marked as picked up'
  })
  async markOrderPickedUp(
    @Param('id', ParseIntPipe) orderId: number,
    @Req() req: any
  ) {
    return this.ordersService.markOrderPickedUp(orderId, req.driver.id);
  }

  @Post(':id/deliver')
  @UseGuards(JwtAuthGuard, DriverGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Mark order as delivered',
    description: 'Driver marks order as delivered to customer (driver only)'
  })
  @ApiResponse({
    status: 200,
    description: 'Order marked as delivered'
  })
  async markOrderDelivered(
    @Param('id', ParseIntPipe) orderId: number,
    @Req() req: any
  ) {
    return this.ordersService.markOrderDelivered(orderId, req.driver.id);
  }
}