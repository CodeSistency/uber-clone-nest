import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { DriverGuard } from '../../drivers/guards/driver.guard';
import { RidesFlowService } from './rides-flow.service';
import { IdempotencyService } from '../../common/services/idempotency.service';
import { ProofOfDeliveryDto } from './dto/parcel-flow.dtos';

@ApiTags('parcel-flow-driver')
@UseGuards(JwtAuthGuard)
@Controller('rides/flow/driver/parcel')
export class ParcelDriverController {
  constructor(
    private readonly flow: RidesFlowService,
    private readonly idemp: IdempotencyService,
  ) {}

  @Post(':id/accept')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Conductor acepta envío de paquete',
    description: `
    **IMPORTANTE:** Solo conductores registrados pueden usar este endpoint.
    **NOTA PARA DESARROLLADORES:** Agregar @UseGuards(DriverGuard) después de implementar la validación de conductores.

    **¿Qué hace?**
    - Asigna el envío de paquete al conductor autenticado
    - Cambia el status del envío a 'accepted'
    - Notifica al cliente que el envío fue aceptado

    **Idempotencia:**
    - Envía header \`Idempotency-Key\` para evitar duplicados
    - TTL de 5 minutos para la misma key
    `
  })
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
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Conductor recoge el paquete',
    description: `
    **IMPORTANTE:** Solo conductores registrados pueden usar este endpoint.
    **NOTA PARA DESARROLLADORES:** Agregar @UseGuards(DriverGuard) después de implementar la validación de conductores.

    **¿Qué hace?**
    - Marca que el conductor ha recogido el paquete del origen
    - Cambia el status del envío a 'picked_up'
    - Inicia el transporte del paquete

    **Idempotencia:**
    - Envía header \`Idempotency-Key\` para evitar duplicados
    - TTL de 5 minutos para la misma key
    `
  })
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
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Conductor entrega el paquete',
    description: `
    **IMPORTANTE:** Solo conductores registrados pueden usar este endpoint.
    **NOTA PARA DESARROLLADORES:** Agregar @UseGuards(DriverGuard) después de implementar la validación de conductores.

    **¿Qué hace?**
    - Marca la entrega exitosa del paquete
    - Requiere proof of delivery (prueba de entrega)
    - Cambia el status del envío a 'delivered'
    - Procesa el pago correspondiente

    **Idempotencia:**
    - Envía header \`Idempotency-Key\` para evitar duplicados
    - TTL de 5 minutos para la misma key
    `
  })
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


