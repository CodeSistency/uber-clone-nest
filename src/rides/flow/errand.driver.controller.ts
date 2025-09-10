import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { DriverGuard } from '../../drivers/guards/driver.guard';
import { RidesFlowService } from './rides-flow.service';
import { IdempotencyService } from '../../common/services/idempotency.service';
import { ErrandShoppingUpdateDto } from './dto/errand-flow.dtos';

@ApiTags('errand-flow-driver')
@UseGuards(JwtAuthGuard)
@Controller('rides/flow/driver/errand')
export class ErrandDriverController {
  constructor(
    private readonly flow: RidesFlowService,
    private readonly idemp: IdempotencyService,
  ) {}

  @Post(':id/accept')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Conductor acepta encargo',
    description: `
    **IMPORTANTE:** Solo conductores registrados pueden usar este endpoint.
    **NOTA PARA DESARROLLADORES:** Agregar @UseGuards(DriverGuard) después de implementar la validación de conductores.

    **¿Qué hace?**
    - Asigna el encargo al conductor autenticado
    - Cambia el status del encargo a 'accepted'
    - Notifica al cliente que el encargo fue aceptado

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
    const e = await this.flow.driverAcceptErrand(Number(id), Number(req.user.id));
    if (key) this.idemp.set(key, 200, e);
    return { data: e };
  }

  @Post(':id/update-shopping')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Conductor actualiza costos de compras',
    description: `
    **IMPORTANTE:** Solo conductores registrados pueden usar este endpoint.
    **NOTA PARA DESARROLLADORES:** Agregar @UseGuards(DriverGuard) después de implementar la validación de conductores.

    **¿Qué hace?**
    - Permite al conductor actualizar costos de compras realizadas
    - Actualiza notas adicionales sobre el encargo
    - Mantiene registro de gastos para facturación
    `
  })
  async updateShopping(
    @Param('id') id: string,
    @Body() body: ErrandShoppingUpdateDto,
    @Req() req: any,
  ) {
    const e = await this.flow.updateErrandShopping(Number(id), Number(req.user.id), body);
    return { data: e };
  }

  @Post(':id/start')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Conductor inicia entrega de encargo',
    description: `
    **IMPORTANTE:** Solo conductores registrados pueden usar este endpoint.
    **NOTA PARA DESARROLLADORES:** Agregar @UseGuards(DriverGuard) después de implementar la validación de conductores.

    **¿Qué hace?**
    - Marca el inicio de la entrega del encargo
    - Cambia el status del encargo a 'in_progress'
    - Inicia el seguimiento del tiempo de entrega
    `
  })
  async start(@Param('id') id: string, @Req() req: any) {
    const e = await this.flow.driverStartErrand(Number(id), Number(req.user.id));
    return { data: e };
  }

  @Post(':id/complete')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Conductor completa encargo',
    description: `
    **IMPORTANTE:** Solo conductores registrados pueden usar este endpoint.
    **NOTA PARA DESARROLLADORES:** Agregar @UseGuards(DriverGuard) después de implementar la validación de conductores.

    **¿Qué hace?**
    - Marca la finalización exitosa del encargo
    - Cambia el status del encargo a 'completed'
    - Procesa el pago correspondiente
    - Libera al conductor para nuevos encargos

    **Idempotencia:**
    - Envía header \`Idempotency-Key\` para evitar duplicados
    - TTL de 5 minutos para la misma key
    `
  })
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


