import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RidesFlowService } from './rides-flow.service';
import { ConfirmPaymentDto, DefineRideDto, RateRideFlowDto } from './dto/transport-flow.dtos';

@ApiTags('rides-flow-client')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('rides/flow/client/transport')
export class TransportClientController {
  constructor(private readonly flow: RidesFlowService) {}

  @Post('define-ride')
  @ApiOperation({ summary: 'Define transport ride (origin/destination) and create ride' })
  async defineRide(@Body() body: DefineRideDto, @Req() req: any) {
    const ride = await this.flow.defineTransportRide({
      userId: Number(req.user.id),
      origin: { address: body.originAddress, lat: body.originLat, lng: body.originLng },
      destination: { address: body.destinationAddress, lat: body.destinationLat, lng: body.destinationLng },
      minutes: body.minutes,
      tierId: body.tierId,
      vehicleTypeId: body.vehicleTypeId,
    });
    return { data: ride };
  }

  @Post(':rideId/select-vehicle')
  @ApiOperation({ summary: 'Select vehicle tier/type for an existing ride' })
  async selectVehicle(
    @Param('rideId') rideId: string,
    @Body() body: { tierId?: number; vehicleTypeId?: number },
  ) {
    const ride = await this.flow.selectTransportVehicle(Number(rideId), body.tierId, body.vehicleTypeId);
    return { data: ride };
  }

  @Post(':rideId/request-driver')
  @ApiOperation({ summary: 'Request driver matching for this ride (notify nearby drivers)' })
  async requestDriver(@Param('rideId') rideId: string) {
    return this.flow.requestTransportDriver(Number(rideId));
  }

  @Post(':rideId/confirm-payment')
  @ApiOperation({ summary: 'Confirm payment method for ride' })
  @ApiBody({ type: ConfirmPaymentDto })
  async confirmPayment(
    @Param('rideId') rideId: string,
    @Body() body: ConfirmPaymentDto,
  ) {
    const ride = await this.flow.confirmTransportPayment(Number(rideId), body.method, body.clientSecret);
    return { data: ride };
  }

  @Post(':rideId/join')
  @ApiOperation({ summary: 'Join real-time tracking for ride' })
  async joinRide(@Param('rideId') rideId: string, @Req() req: any) {
    // WS handled at gateway; REST endpoint is no-op helper
    return { ok: true, room: `ride-${rideId}`, userId: req.user.id };
  }

  @Get(':rideId/status')
  @ApiOperation({ summary: 'Get current status of a ride' })
  async getStatus(@Param('rideId') rideId: string) {
    const status = await this.flow.getTransportStatus(Number(rideId));
    return { data: status };
  }

  @Post(':rideId/cancel')
  @ApiOperation({ summary: 'Cancel the ride' })
  async cancel(@Param('rideId') rideId: string, @Body() body: { reason?: string }) {
    return this.flow.cancelTransport(Number(rideId), body?.reason);
  }

  @Post(':rideId/rate')
  @ApiOperation({ summary: 'Rate the completed ride' })
  async rate(
    @Param('rideId') rideId: string,
    @Body() body: RateRideFlowDto,
    @Req() req: any,
  ) {
    const rating = await this.flow.rateTransport(Number(rideId), { ...body, userId: String(req.user.id) });
    return { data: rating };
  }
}


