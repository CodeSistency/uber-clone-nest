import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RidesFlowService } from './rides-flow.service';
import { ConfirmDeliveryPaymentDto } from './dto/delivery-flow.dtos';
import { CreateOrderDto } from '../../orders/dto/create-order.dto';
import { PaymentsService } from '../../payments/payments.service';

@ApiTags('delivery-flow-client')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('rides/flow/client/delivery')
export class DeliveryClientController {
  constructor(
    private readonly flow: RidesFlowService,
    private readonly paymentsService: PaymentsService,
  ) {}

  @Post('create-order')
  @ApiOperation({
    summary: 'Create a delivery order',
    description: `
    Creates a new delivery order for food or products from a store.

    **Flow:**
    1. Validates order items and store availability
    2. Calculates delivery fee based on distance
    3. Creates order in database with 'pending' status
    4. Notifies nearby couriers via WebSocket
    5. Returns order ID for real-time tracking

    **Real-time Events:**
    - \`order:created\` - Order created successfully
    - \`order:accepted\` - Courier accepts the order
    - \`order:picked_up\` - Courier picked up the order
    - \`order:delivered\` - Order delivered to customer
    `,
  })
  @ApiBody({
    type: CreateOrderDto,
    examples: {
      pizza_delivery: {
        summary: 'Pizza delivery order',
        value: {
          storeId: 1,
          deliveryAddress: 'Carrera 7 #23-45, Apartamento 1201, Bogotá',
          deliveryLatitude: 4.6097,
          deliveryLongitude: -74.0817,
          items: [
            {
              productId: 1,
              quantity: 2,
              price: 25.0,
            },
            {
              productId: 2,
              quantity: 1,
              price: 8.5,
            },
          ],
          specialInstructions: 'Timbre 1201, por favor llamar antes de subir',
        },
      },
      grocery_delivery: {
        summary: 'Grocery items delivery',
        value: {
          storeId: 2,
          deliveryAddress: 'Calle 45 #123-67, Casa 45, Medellín',
          deliveryLatitude: 6.2518,
          deliveryLongitude: -75.5636,
          items: [
            {
              productId: 10,
              quantity: 1,
              price: 15.0,
            },
            {
              productId: 11,
              quantity: 3,
              price: 5.5,
            },
          ],
          specialInstructions: 'Dejar en portería si no contesto',
        },
      },
    },
  })
  async createOrder(@Body() body: CreateOrderDto, @Req() req: any) {
    const order = await this.flow.createDeliveryOrder(
      Number(req.user.id),
      body,
    );
    return { data: order };
  }

  @Post(':orderId/confirm-payment')
  @ApiOperation({
    summary: 'Confirmar pago de orden de delivery (Sistema Venezolano)',
    description: `
    **SISTEMA DE PAGOS VENEZOLANO**

    Este endpoint genera una referencia bancaria para el pago de la orden de delivery.
    El usuario debe realizar el pago externamente usando esta referencia.

    **Proceso:**
    1. Se valida la orden de delivery
    2. Se genera referencia bancaria única de 20 dígitos
    3. Se registra en base de datos con expiración de 24 horas
    4. Se notifica al usuario con instrucciones de pago

    **Métodos de pago soportados:**
    - \`transfer\`: Transferencia bancaria
    - \`pago_movil\`: Pago móvil
    - \`zelle\`: Zelle
    - \`bitcoin\`: Bitcoin
    - \`cash\`: Efectivo (sin referencia bancaria)
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Referencia bancaria generada exitosamente',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            orderId: { type: 'number', example: 123 },
            paymentStatus: { type: 'string', example: 'pending_reference' },
            reference: {
              type: 'object',
              properties: {
                referenceNumber: {
                  type: 'string',
                  example: '12345678901234567890',
                },
                bankCode: { type: 'string', example: '0102' },
                amount: { type: 'number', example: 35.5 },
                expiresAt: { type: 'string', format: 'date-time' },
                instructions: {
                  type: 'string',
                  example: 'Realice la transferencia...',
                },
              },
            },
          },
        },
      },
    },
  })
  async confirmPayment(
    @Param('orderId') orderId: string,
    @Body() body: ConfirmDeliveryPaymentDto,
    @Req() req: any,
  ) {
    // Obtener información de la orden para calcular el monto
    const order = await this.flow.getDeliveryStatus(Number(orderId));

    if (!order) {
      throw new Error('Orden no encontrada');
    }

    if (order.userId !== req.user.id) {
      throw new Error('Esta orden no pertenece al usuario actual');
    }

    // Para pagos en efectivo, no necesitamos generar referencia
    if (body.method === 'cash') {
      const updated = await this.flow.confirmDeliveryPayment(
        Number(orderId),
        body.method,
      );
      return { data: { ...updated, paymentMethod: 'cash' } };
    }

    // Generar referencia bancaria usando el servicio de pagos venezolano
    const reference = await this.paymentsService.generateBankReference({
      serviceType: 'delivery',
      serviceId: Number(orderId),
      amount: Number(order.totalPrice || 0),
      paymentMethod: body.method,
      bankCode: body.bankCode,
      userId: req.user.id,
    });

    return {
      data: {
        orderId: Number(orderId),
        paymentStatus: 'pending_reference',
        reference: reference,
        instructions: this.paymentsService.getPaymentInstructions(
          body.method,
          reference.referenceNumber,
        ),
      },
    };
  }

  @Post(':orderId/join')
  @ApiOperation({ summary: 'Join delivery tracking room (WS helper)' })
  async join(@Param('orderId') orderId: string, @Req() req: any) {
    return { ok: true, room: `order-${orderId}`, userId: req.user.id };
  }

  @Get(':orderId/status')
  @ApiOperation({ summary: 'Get current delivery order status' })
  async status(@Param('orderId') orderId: string) {
    const status = await this.flow.getDeliveryStatus(Number(orderId));
    return { data: status };
  }

  @Post(':orderId/cancel')
  @ApiOperation({ summary: 'Cancel delivery order' })
  async cancel(
    @Param('orderId') orderId: string,
    @Body() body: { reason?: string },
  ) {
    return this.flow.cancelDelivery(Number(orderId), body?.reason);
  }
}
