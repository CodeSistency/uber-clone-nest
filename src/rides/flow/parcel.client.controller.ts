import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiBody } from '@nestjs/swagger';
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
  @ApiOperation({
    summary: 'Create a parcel shipment',
    description: `
    Creates a new parcel delivery request for packages and documents.

    **Flow:**
    1. Validates parcel parameters and addresses
    2. Creates parcel request in memory with 'requested' status
    3. Considers package type for special handling (fragile, electronics, etc.)
    4. Notifies nearby drivers via WebSocket
    5. Driver must provide proof of delivery (signature/photo)

    **Real-time Events:**
    - \`parcel:created\` - Parcel request created
    - \`parcel:accepted\` - Driver accepts the delivery
    - \`parcel:picked_up\` - Driver picked up the parcel
    - \`parcel:delivered\` - Parcel delivered with proof

    **Package Types:**
    - \`documents\` - Standard document delivery
    - \`electronics\` - Requires careful handling
    - \`fragile\` - Extra care for breakable items
    - \`other\` - General packages
    `,
  })
  @ApiBody({
    type: CreateParcelDto,
    examples: {
      document_delivery: {
        summary: 'Legal documents delivery',
        value: {
          pickupAddress: 'Notaría Primera, Calle 100 #15-30, Piso 5',
          pickupLat: 4.6097,
          pickupLng: -74.0817,
          dropoffAddress: 'Registro Civil, Carrera 7 #23-45',
          dropoffLat: 4.615,
          dropoffLng: -74.075,
          type: 'documents',
          description:
            'Contrato de compraventa y documentos de propiedad (5 páginas cada uno)',
        },
      },
      electronic_device: {
        summary: 'Electronic device delivery',
        value: {
          pickupAddress: 'Tienda de Electrónicos ABC, Centro Comercial Plaza',
          pickupLat: 4.6584,
          pickupLng: -74.0548,
          dropoffAddress: 'Casa del cliente, Calle 45 #123-67',
          dropoffLat: 4.661,
          dropoffLng: -74.052,
          type: 'electronics',
          description:
            'Laptop Dell XPS 13 con cargador original, mouse inalámbrico y maletín protector',
        },
      },
      fragile_package: {
        summary: 'Fragile item delivery',
        value: {
          pickupAddress: 'Cerámica Artesanal, Calle 50 #20-30',
          pickupLat: 4.7016,
          pickupLng: -74.1469,
          dropoffAddress: 'Restaurante cliente, Zona G',
          dropoffLat: 4.6584,
          dropoffLng: -74.0548,
          type: 'fragile',
          description:
            'Juego de vajilla de porcelana fina (24 piezas) - Manejar con extremo cuidado',
        },
      },
    },
  })
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
