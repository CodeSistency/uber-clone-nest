import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RidesFlowService } from './rides-flow.service';
import { CreateParcelDto, ProofOfDeliveryDto } from './dto/parcel-flow.dtos';

@ApiTags('parcel-flow-client')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('rides/flow/client/parcel')
export class ParcelClientController {
  constructor(private readonly flow: RidesFlowService) {}

  @Post('create')
  @ApiOperation({ summary: 'Create a parcel shipment' })
  async create(@Body() body: CreateParcelDto, @Req() req: any) {
    const parcel = await this.flow.createParcel(Number(req.user.id), body);
    return { data: parcel };
  }

  @Post(':id/join')
  @ApiOperation({ summary: 'Join parcel tracking room (WS helper)' })
  async join(@Param('id') id: string, @Req() req: any) {
    return { ok: true, room: `parcel-${id}`, userId: req.user.id };
  }

  @Get(':id/status')
  @ApiOperation({ summary: 'Get parcel status' })
  async status(@Param('id') id: string) {
    const p = await this.flow.getParcelStatus(Number(id));
    return { data: p };
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel parcel shipment' })
  async cancel(@Param('id') id: string, @Body() body: { reason?: string }) {
    return this.flow.cancelParcel(Number(id), body?.reason);
  }
}


