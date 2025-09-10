import { Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { DriverGuard } from '../../drivers/guards/driver.guard';
import { RidesFlowService } from './rides-flow.service';
import { IdempotencyService } from '../../common/services/idempotency.service';

@ApiTags('delivery-flow-driver')
@UseGuards(JwtAuthGuard)
@Controller('rides/flow/driver/delivery')
export class DeliveryDriverController {
  constructor(
    private readonly flow: RidesFlowService,
    private readonly idemp: IdempotencyService,
  ) {}

  @Post(':orderId/accept')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Conductor acepta orden de delivery',
    description: `
    **IMPORTANTE:** Solo conductores registrados pueden usar este endpoint.
    **NOTA PARA DESARROLLADORES:** Agregar @UseGuards(DriverGuard) después de implementar la validación de conductores.

    **¿Qué hace?**
    - Asigna la orden de delivery al conductor autenticado
    - Cambia el status de la orden a 'accepted'
    - Notifica al cliente que la orden fue aceptada

    **Idempotencia:**
    - Envía header \`Idempotency-Key\` para evitar duplicados
    - TTL de 5 minutos para la misma key
    `
  })
  async accept(@Param('orderId') orderId: string, @Req() req: any) {
    const key = req.headers['idempotency-key'] as string | undefined;
    if (key) {
      const cached = this.idemp.get(key);
      if (cached) return { data: cached.value };
    }
    const order = await this.flow.driverAcceptDelivery(Number(orderId), Number(req.user.id));
    if (key) this.idemp.set(key, 200, order);
    return { data: order };
  }

  @Get('available')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Ver órdenes de delivery disponibles',
    description: `
    **IMPORTANTE:** Solo conductores registrados pueden usar este endpoint.
    **NOTA PARA DESARROLLADORES:** Agregar @UseGuards(DriverGuard) después de implementar la validación de conductores.

    **¿Qué devuelve?**
    - Lista de órdenes de delivery pendientes de asignación
    - Información completa de cada orden (restaurante, cliente, productos, etc.)
    - Solo órdenes que coinciden con la ubicación del conductor

    **Uso típico:**
    - Conductor consulta órdenes disponibles
    - Selecciona una orden para aceptar
    - Usa el endpoint 'accept' con el orderId correspondiente
    `
  })
  async available() {
    const orders = await this.flow['ordersService'].getAvailableOrdersForDelivery();
    return { data: orders };
  }

  @Post(':orderId/pickup')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Conductor marca orden como recogida',
    description: `
    **IMPORTANTE:** Solo conductores registrados pueden usar este endpoint.
    **NOTA PARA DESARROLLADORES:** Agregar @UseGuards(DriverGuard) después de implementar la validación de conductores.

    **¿Qué hace?**
    - Marca que el conductor ha recogido la orden del restaurante
    - Cambia el status de la orden a 'picked_up'
    - Inicia la entrega al cliente

    **Idempotencia:**
    - Envía header \`Idempotency-Key\` para evitar duplicados
    - TTL de 5 minutos para la misma key
    `
  })
  async pickup(@Param('orderId') orderId: string, @Req() req: any) {
    const key = req.headers['idempotency-key'] as string | undefined;
    if (key) {
      const cached = this.idemp.get(key);
      if (cached) return { data: cached.value };
    }
    const order = await this.flow.driverPickupDelivery(Number(orderId), Number(req.user.id));
    if (key) this.idemp.set(key, 200, order);
    return { data: order };
  }

  @Post(':orderId/deliver')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Conductor marca orden como entregada',
    description: `
    **IMPORTANTE:** Solo conductores registrados pueden usar este endpoint.
    **NOTA PARA DESARROLLADORES:** Agregar @UseGuards(DriverGuard) después de implementar la validación de conductores.

    **¿Qué hace?**
    - Marca la entrega exitosa de la orden al cliente
    - Cambia el status de la orden a 'delivered'
    - Procesa el pago correspondiente
    - Libera al conductor para nuevas órdenes

    **Idempotencia:**
    - Envía header \`Idempotency-Key\` para evitar duplicados
    - TTL de 5 minutos para la misma key
    `
  })
  async deliver(@Param('orderId') orderId: string, @Req() req: any) {
    const key = req.headers['idempotency-key'] as string | undefined;
    if (key) {
      const cached = this.idemp.get(key);
      if (cached) return { data: cached.value };
    }
    const order = await this.flow.driverDeliverDelivery(Number(orderId), Number(req.user.id));
    if (key) this.idemp.set(key, 200, order);
    return { data: order };
  }
}


