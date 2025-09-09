import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RidesFlowService } from './rides-flow.service';
import { ConfirmDeliveryPaymentDto } from './dto/delivery-flow.dtos';
import { CreateOrderDto } from '../../orders/dto/create-order.dto';

@ApiTags('delivery-flow-client')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('rides/flow/client/delivery')
export class DeliveryClientController {
  constructor(private readonly flow: RidesFlowService) {}

  @Post('create-order')
  @ApiOperation({ summary: 'Create a delivery order' })
  async createOrder(@Body() body: CreateOrderDto, @Req() req: any) {
    const order = await this.flow.createDeliveryOrder(Number(req.user.id), body);
    return { data: order };
  }

  @Post(':orderId/confirm-payment')
  @ApiOperation({ summary: 'Confirm delivery order payment method' })
  async confirmPayment(
    @Param('orderId') orderId: string,
    @Body() body: ConfirmDeliveryPaymentDto,
  ) {
    const order = await this.flow.confirmDeliveryPayment(Number(orderId), body.method);
    return { data: order };
  }

  @Post(':orderId/join')
  @ApiOperation({ summary: 'Join delivery tracking room (WS helper)' })
  async join(@Param('orderId') orderId: string, @Req() req: any) {
    return { ok: true, room: `order-${orderId}`, userId: req.user.id };
  }

  @Get(':orderId/status')
  @ApiOperation({ summary: 'Get current delivery order status' })
  async status(@Param('orderId') orderId: string) {
    const status = await this.flow.getDeliveryStatus(Number(orderId));
    return { data: status };
  }

  @Post(':orderId/cancel')
  @ApiOperation({ summary: 'Cancel delivery order' })
  async cancel(@Param('orderId') orderId: string, @Body() body: { reason?: string }) {
    return this.flow.cancelDelivery(Number(orderId), body?.reason);
  }
}


