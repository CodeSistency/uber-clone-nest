import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { DriverGuard } from '../../drivers/guards/driver.guard';
import { RidesFlowService } from './rides-flow.service';
import { IdempotencyService } from '../../common/services/idempotency.service';
import { ProofOfDeliveryDto } from './dto/parcel-flow.dtos';

@ApiTags('parcel-flow-driver')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, DriverGuard)
@Controller('rides/flow/driver/parcel')
export class ParcelDriverController {
  constructor(
    private readonly flow: RidesFlowService,
    private readonly idemp: IdempotencyService,
  ) {}

  @Post(':id/accept')
  @ApiOperation({ summary: 'Driver accepts parcel' })
  async accept(@Param('id') id: string, @Req() req: any) {
    const key = req.headers['idempotency-key'] as string | undefined;
    if (key) {
      const cached = this.idemp.get(key);
      if (cached) return { data: cached.value };
    }
    const p = await this.flow.driverAcceptParcel(Number(id), Number(req.user.id));
    if (key) this.idemp.set(key, 200, p);
    return { data: p };
  }

  @Post(':id/pickup')
  @ApiOperation({ summary: 'Driver picks up parcel' })
  async pickup(@Param('id') id: string, @Req() req: any) {
    const key = req.headers['idempotency-key'] as string | undefined;
    if (key) {
      const cached = this.idemp.get(key);
      if (cached) return { data: cached.value };
    }
    const p = await this.flow.driverPickupParcel(Number(id), Number(req.user.id));
    if (key) this.idemp.set(key, 200, p);
    return { data: p };
  }

  @Post(':id/deliver')
  @ApiOperation({ summary: 'Driver delivers parcel with proof' })
  async deliver(
    @Param('id') id: string,
    @Req() req: any,
    @Body() body: ProofOfDeliveryDto,
  ) {
    const key = req.headers['idempotency-key'] as string | undefined;
    if (key) {
      const cached = this.idemp.get(key);
      if (cached) return { data: cached.value };
    }
    const p = await this.flow.driverDeliverParcel(Number(id), Number(req.user.id), body);
    if (key) this.idemp.set(key, 200, p);
    return { data: p };
  }
}


