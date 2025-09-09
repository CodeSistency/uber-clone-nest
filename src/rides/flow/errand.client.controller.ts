import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RidesFlowService } from './rides-flow.service';
import { CreateErrandDto } from './dto/errand-flow.dtos';

@ApiTags('errand-flow-client')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('rides/flow/client/errand')
export class ErrandClientController {
  constructor(private readonly flow: RidesFlowService) {}

  @Post('create')
  @ApiOperation({ summary: 'Create an errand request' })
  async create(@Body() body: CreateErrandDto, @Req() req: any) {
    const errand = await this.flow.createErrand(Number(req.user.id), body);
    return { data: errand };
  }

  @Post(':id/join')
  @ApiOperation({ summary: 'Join errand tracking room (WS helper)' })
  async join(@Param('id') id: string, @Req() req: any) {
    return { ok: true, room: `errand-${id}`, userId: req.user.id };
  }

  @Get(':id/status')
  @ApiOperation({ summary: 'Get errand status' })
  async status(@Param('id') id: string) {
    const e = await this.flow.getErrandStatus(Number(id));
    return { data: e };
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel errand' })
  async cancel(@Param('id') id: string, @Body() body: { reason?: string }) {
    return this.flow.cancelErrand(Number(id), body?.reason);
  }
}


