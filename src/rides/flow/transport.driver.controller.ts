import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { DriverGuard } from '../../drivers/guards/driver.guard';
import { RidesFlowService } from './rides-flow.service';
import { IdempotencyService } from '../../common/services/idempotency.service';

@ApiTags('rides-flow-driver')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, DriverGuard)
@Controller('rides/flow/driver/transport')
export class TransportDriverController {
  constructor(
    private readonly flow: RidesFlowService,
    private readonly idemp: IdempotencyService,
  ) {}

  @Post(':rideId/accept')
  @ApiOperation({ summary: 'Driver accepts a ride' })
  async accept(
    @Param('rideId') rideId: string,
    @Req() req: any,
  ) {
    // Idempotency
    const key = req.headers['idempotency-key'] as string | undefined;
    if (key) {
      const cached = this.idemp.get(key);
      if (cached) return { data: cached.value };
    }
    const ride = await this.flow.driverAcceptTransport(Number(rideId), Number(req.user.id), String(req.user.id));
    if (key) this.idemp.set(key, 200, ride);
    return { data: ride };
  }

  @Post(':rideId/arrived')
  @ApiOperation({ summary: 'Driver arrived at pickup' })
  async arrived(
    @Param('rideId') rideId: string,
    @Req() req: any,
  ) {
    return this.flow.driverArrivedTransport(Number(rideId), Number(req.user.id), String(req.user.id));
  }

  @Get('available')
  @ApiOperation({ summary: 'List available rides for drivers' })
  async available() {
    // Leverage RidesService through flow service
    const list = await (this.flow as any)['ridesService'].getAvailableRides();
    return { data: list };
  }

  @Post(':rideId/start')
  @ApiOperation({ summary: 'Driver starts the ride' })
  async start(
    @Param('rideId') rideId: string,
    @Req() req: any,
  ) {
    const key = req.headers['idempotency-key'] as string | undefined;
    if (key) {
      const cached = this.idemp.get(key);
      if (cached) return cached.value;
    }
    const res = await this.flow.driverStartTransport(Number(rideId), Number(req.user.id), String(req.user.id));
    if (key) this.idemp.set(key, 200, res);
    return res;
  }

  @Post(':rideId/complete')
  @ApiOperation({ summary: 'Driver completes the ride and confirms fare' })
  async complete(
    @Param('rideId') rideId: string,
    @Req() req: any,
    @Body() body: { fare: number },
  ) {
    const key = req.headers['idempotency-key'] as string | undefined;
    if (key) {
      const cached = this.idemp.get(key);
      if (cached) return { data: cached.value };
    }
    const ride = await this.flow.driverCompleteTransport(
      Number(rideId),
      Number(req.user.id),
      String(req.user.id),
      body.fare,
    );
    if (key) this.idemp.set(key, 200, ride);
    return { data: ride };
  }
}


