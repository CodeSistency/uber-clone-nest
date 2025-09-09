import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RidesFlowService } from './rides-flow.service';
import { ConfirmRidePaymentDto, DefineRideDto, RateRideFlowDto } from './dto/transport-flow.dtos';

@ApiTags('rides-flow-client')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('rides/flow/client/transport')
export class TransportClientController {
  constructor(private readonly flow: RidesFlowService) {}

  @Post('define-ride')
  @ApiOperation({
    summary: 'Define transport ride (origin/destination) and create ride',
    description: `
    Creates a new transport ride request with origin and destination details.

    **Flow:**
    1. Validates ride parameters and user authentication
    2. Creates ride in database with 'pending' status
    3. Notifies nearby drivers via WebSocket
    4. Returns ride ID for real-time tracking

    **Real-time Events:**
    - \`ride:requested\` - Broadcast to nearby drivers
    - \`ride:accepted\` - When driver accepts the ride
    - \`ride:location\` - Live driver location updates
    `
  })
  @ApiBody({
    type: DefineRideDto,
    examples: {
      'city_ride': {
        summary: 'Basic city ride',
        value: {
          originAddress: 'Calle 123 #45-67, Bogotá, Colombia',
          originLat: 4.6097,
          originLng: -74.0817,
          destinationAddress: 'Carrera 7 #23-45, Medellín, Colombia',
          destinationLat: 6.2518,
          destinationLng: -75.5636,
          minutes: 25,
          tierId: 1
        }
      },
      'airport_pickup': {
        summary: 'Airport pickup with vehicle type',
        value: {
          originAddress: 'Aeropuerto El Dorado, Bogotá',
          originLat: 4.7016,
          originLng: -74.1469,
          destinationAddress: 'Hotel Casa Deco, Zona Rosa',
          destinationLat: 4.6584,
          destinationLng: -74.0548,
          minutes: 45,
          tierId: 2,
          vehicleTypeId: 1
        }
      }
    }
  })
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
  @ApiBody({ type: ConfirmRidePaymentDto })
  async confirmPayment(
    @Param('rideId') rideId: string,
    @Body() body: ConfirmRidePaymentDto,
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


