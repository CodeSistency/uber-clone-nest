import { Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { DriverGuard } from '../../drivers/guards/driver.guard';
import { RidesFlowService } from './rides-flow.service';
import { IdempotencyService } from '../../common/services/idempotency.service';

@ApiTags('delivery-flow-driver')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, DriverGuard)
@Controller('rides/flow/driver/delivery')
export class DeliveryDriverController {
  constructor(
    private readonly flow: RidesFlowService,
    private readonly idemp: IdempotencyService,
  ) {}

  @Post(':orderId/accept')
  @ApiOperation({ summary: 'Driver accepts a delivery order' })
  async accept(@Param('orderId') orderId: string, @Req() req: any) {
    const key = req.headers['idempotency-key'] as string | undefined;
    if (key) {
      const cached = this.idemp.get(key);
      if (cached) return { data: cached.value };
    }
    const order = await this.flow.driverAcceptDelivery(Number(orderId), Number(req.user.id));
    if (key) this.idemp.set(key, 200, order);
    return { data: order };
  }

  @Get('available')
  @ApiOperation({ summary: 'List available delivery orders for drivers' })
  async available() {
    const orders = await this.flow['ordersService'].getAvailableOrdersForDelivery();
    return { data: orders };
  }

  @Post(':orderId/pickup')
  @ApiOperation({ summary: 'Driver marks order as picked up' })
  async pickup(@Param('orderId') orderId: string, @Req() req: any) {
    const key = req.headers['idempotency-key'] as string | undefined;
    if (key) {
      const cached = this.idemp.get(key);
      if (cached) return { data: cached.value };
    }
    const order = await this.flow.driverPickupDelivery(Number(orderId), Number(req.user.id));
    if (key) this.idemp.set(key, 200, order);
    return { data: order };
  }

  @Post(':orderId/deliver')
  @ApiOperation({ summary: 'Driver marks order as delivered' })
  async deliver(@Param('orderId') orderId: string, @Req() req: any) {
    const key = req.headers['idempotency-key'] as string | undefined;
    if (key) {
      const cached = this.idemp.get(key);
      if (cached) return { data: cached.value };
    }
    const order = await this.flow.driverDeliverDelivery(Number(orderId), Number(req.user.id));
    if (key) this.idemp.set(key, 200, order);
    return { data: order };
  }
}


