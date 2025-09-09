import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiBody } from '@nestjs/swagger';
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
  @ApiOperation({
    summary: 'Create an errand request',
    description: `
    Creates a new errand request where a driver performs personal tasks for the customer.

    **Flow:**
    1. Validates errand parameters and locations
    2. Creates errand request in memory with 'requested' status
    3. Notifies nearby drivers via WebSocket
    4. Driver can accept and perform shopping/deliveries
    5. Real-time updates on shopping progress and costs

    **Real-time Events:**
    - \`errand:created\` - Errand request created
    - \`errand:accepted\` - Driver accepts the errand
    - \`errand:shopping_update\` - Driver updates shopping costs
    - \`errand:started\` - Driver starts delivery back
    - \`errand:completed\` - Errand completed successfully
    `
  })
  @ApiBody({
    type: CreateErrandDto,
    examples: {
      'grocery_shopping': {
        summary: 'Grocery shopping errand',
        value: {
          description: 'Comprar víveres en el supermercado cercano y medicamentos en la farmacia',
          itemsList: '• 2 kg de arroz\n• 1 litro de leche\n• Pan integral\n• Jabón para platos\n• Paracetamol 500mg',
          pickupAddress: 'Centro Comercial Gran Estación, Local 123, Nivel 2',
          pickupLat: 4.6097,
          pickupLng: -74.0817,
          dropoffAddress: 'Casa del cliente, Calle 45 #123-45, Bogotá',
          dropoffLat: 4.6150,
          dropoffLng: -74.0750
        }
      },
      'pharmacy_pickup': {
        summary: 'Pharmacy and store errand',
        value: {
          description: 'Ir a la farmacia por medicamentos recetados y comprar algunos artículos personales',
          itemsList: '• Medicamento: Amoxicilina 500mg (receta adjunta)\n• Crema dental\n• Shampoo\n• Vitaminas',
          pickupAddress: 'Parque de la 93, Bogotá',
          pickupLat: 4.6584,
          pickupLng: -74.0548,
          dropoffAddress: 'Apartamento cliente, Carrera 11 #93-45',
          dropoffLat: 4.6610,
          dropoffLng: -74.0520
        }
      }
    }
  })
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


