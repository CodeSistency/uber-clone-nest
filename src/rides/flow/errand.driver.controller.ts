import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { DriverGuard } from '../../drivers/guards/driver.guard';
import { RidesFlowService } from './rides-flow.service';
import { IdempotencyService } from '../../common/services/idempotency.service';
import { ErrandShoppingUpdateDto } from './dto/errand-flow.dtos';

@ApiTags('errand-flow-driver')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, DriverGuard)
@Controller('rides/flow/driver/errand')
export class ErrandDriverController {
  constructor(
    private readonly flow: RidesFlowService,
    private readonly idemp: IdempotencyService,
  ) {}

  @Post(':id/accept')
  @ApiOperation({ summary: 'Driver accepts errand' })
  async accept(@Param('id') id: string, @Req() req: any) {
    const key = req.headers['idempotency-key'] as string | undefined;
    if (key) {
      const cached = this.idemp.get(key);
      if (cached) return { data: cached.value };
    }
    const e = await this.flow.driverAcceptErrand(Number(id), Number(req.user.id));
    if (key) this.idemp.set(key, 200, e);
    return { data: e };
  }

  @Post(':id/update-shopping')
  @ApiOperation({ summary: 'Driver updates shopping cost/notes' })
  async updateShopping(
    @Param('id') id: string,
    @Body() body: ErrandShoppingUpdateDto,
    @Req() req: any,
  ) {
    const e = await this.flow.updateErrandShopping(Number(id), Number(req.user.id), body);
    return { data: e };
  }

  @Post(':id/start')
  @ApiOperation({ summary: 'Driver starts errand delivery' })
  async start(@Param('id') id: string, @Req() req: any) {
    const e = await this.flow.driverStartErrand(Number(id), Number(req.user.id));
    return { data: e };
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Driver completes errand' })
  async complete(@Param('id') id: string, @Req() req: any) {
    const key = req.headers['idempotency-key'] as string | undefined;
    if (key) {
      const cached = this.idemp.get(key);
      if (cached) return { data: cached.value };
    }
    const e = await this.flow.driverCompleteErrand(Number(id), Number(req.user.id));
    if (key) this.idemp.set(key, 200, e);
    return { data: e };
  }
}


