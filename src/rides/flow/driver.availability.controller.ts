import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { DriverGuard } from '../../drivers/guards/driver.guard';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('driver-availability')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, DriverGuard)
@Controller('rides/flow/driver')
export class DriverAvailabilityController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('availability')
  @ApiOperation({ summary: 'Set driver availability (online/offline)' })
  async setAvailability(@Body() body: { status: 'online' | 'offline' | 'busy' }, @Req() req: any) {
    const driver = await this.prisma.driver.update({
      where: { id: Number(req.user.id) },
      data: { status: body.status },
    });
    return { data: { id: driver.id, status: driver.status } };
  }

  @Get('availability')
  @ApiOperation({ summary: 'Get driver availability' })
  async getAvailability(@Req() req: any) {
    const driver = await this.prisma.driver.findUnique({
      where: { id: Number(req.user.id) },
      select: { id: true, status: true },
    });
    return { data: driver };
  }
}


