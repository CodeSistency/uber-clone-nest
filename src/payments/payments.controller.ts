import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
  Param,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiResponse,
  ApiParam,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaymentsService } from './payments.service';
import {
  GenerateReferenceDto,
  InitiateMultiplePaymentsDto,
  ConfirmPartialPaymentDto,
  PaymentGroupStatusDto,
} from './dto/generate-reference.dto';
import { ConfirmReferenceDto } from './dto/confirm-reference.dto';
import { PaymentReference } from './entities/payment-reference.entity';

@ApiTags('payments-venezuelan')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('generate-reference')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '🚗 Generar referencia bancaria para pago',
    description: `
    **SISTEMA DE PAGOS VENEZOLANO**

    Genera una referencia bancaria única para realizar pagos de servicios.

    **Proceso:**
    1. Se valida el servicio y usuario
    2. Se genera referencia única de 20 dígitos
    3. Se registra en base de datos con expiración de 24 horas
    4. Se notifica al usuario con instrucciones

    **Referencia generada:**
    - 20 dígitos numéricos únicos
    - Expira en 24 horas
    - Vinculada al usuario y servicio específico
    `,
  })
  @ApiResponse({
    status: 201,
    description: 'Referencia generada exitosamente',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        referenceNumber: { type: 'string', example: '12345678901234567890' },
        bankCode: { type: 'string', example: '0102' },
        amount: { type: 'number', example: 25.5 },
        currency: { type: 'string', example: 'VES' },
        serviceType: { type: 'string', example: 'ride' },
        serviceId: { type: 'number', example: 123 },
        status: { type: 'string', example: 'pending' },
        expiresAt: { type: 'string', format: 'date-time' },
        createdAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Token JWT inválido',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
  async generateReference(@Body() dto: GenerateReferenceDto, @Req() req: any) {
    const reference = await this.paymentsService.generateBankReference({
      ...dto,
      userId: req.user.id,
    });

    // Incluir instrucciones de pago en la respuesta
    return {
      ...reference,
      instructions: this.paymentsService.getPaymentInstructions(
        dto.paymentMethod || 'transfer',
        reference.referenceNumber,
      ),
    };
  }

  @Post('confirm-reference')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '✅ Confirmar pago realizado con referencia bancaria',
    description: `
    **CONFIRMACIÓN DE PAGO VENEZOLANO**

    Valida que el pago realizado con la referencia bancaria fue procesado correctamente.

    **Proceso:**
    1. Se valida que la referencia pertenece al usuario
    2. Se verifica que no haya expirado
    3. Se consulta al banco correspondiente
    4. Si es confirmado, se actualiza el estado del servicio
    5. Se registra la transacción bancaria

    **Tiempo de procesamiento:**
    - Bancos venezolanos: 1-5 minutos
    - Simulación desarrollo: inmediato
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Pago confirmado exitosamente',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Pago confirmado exitosamente' },
        reference: {
          type: 'object',
          properties: {
            referenceNumber: {
              type: 'string',
              example: '12345678901234567890',
            },
            amount: { type: 'number', example: 25.5 },
            status: { type: 'string', example: 'confirmed' },
          },
        },
        transaction: {
          type: 'object',
          properties: {
            transactionId: { type: 'string', example: 'BV-1725979200000' },
            amount: { type: 'number', example: 25.5 },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Pago no confirmado aún',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Pago no encontrado o en proceso' },
        reference: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'pending' },
          },
        },
      },
    },
  })
  async confirmReference(@Body() dto: ConfirmReferenceDto, @Req() req: any) {
    return this.paymentsService.confirmBankReference(dto, req.user.id);
  }

  @Get('reference/:referenceNumber')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '📋 Consultar estado de referencia bancaria',
    description: `
    Consulta el estado actual de una referencia bancaria específica.

    **Información devuelta:**
    - Estado actual (pending/confirmed/expired/failed)
    - Fecha de creación y expiración
    - Información del banco y monto
    - Fecha de confirmación (si aplica)
    `,
  })
  @ApiParam({
    name: 'referenceNumber',
    description: 'Número de referencia bancaria de 20 dígitos',
    example: '12345678901234567890',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Estado de referencia obtenido exitosamente',
    type: PaymentReference,
  })
  @ApiNotFoundResponse({
    description: 'Referencia no encontrada',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Referencia no encontrada' },
      },
    },
  })
  async getReferenceStatus(
    @Param('referenceNumber') referenceNumber: string,
    @Req() req: any,
  ) {
    return this.paymentsService.getReferenceStatus(
      referenceNumber,
      req.user.id,
    );
  }

  @Get('user-references')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '📋 Listar referencias bancarias del usuario',
    description: `
    Obtiene todas las referencias bancarias generadas por el usuario actual.

    **Información incluida:**
    - Todas las referencias (pendientes, confirmadas, expiradas)
    - Ordenadas por fecha de creación (más recientes primero)
    - Información completa de cada referencia
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de referencias obtenida exitosamente',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          referenceNumber: { type: 'string', example: '12345678901234567890' },
          amount: { type: 'number', example: 25.5 },
          status: { type: 'string', example: 'confirmed' },
          serviceType: { type: 'string', example: 'ride' },
          expiresAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  async getUserReferences(@Req() req: any) {
    return this.paymentsService.getUserPaymentReferences(req.user.id);
  }

  @Get('supported-banks')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '🏦 Obtener lista de bancos soportados',
    description: `
    Lista todos los bancos venezolanos disponibles para pagos.

    **Bancos incluidos:**
    - 0102: Banco de Venezuela
    - 0105: Banco Mercantil
    - 0196: BNC
    - 0108: Banco Provincial

    **Métodos por banco:**
    - Transferencias bancarias
    - Pago móvil (según disponibilidad)
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de bancos obtenida exitosamente',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          code: { type: 'string', example: '0102' },
          name: { type: 'string', example: 'Banco de Venezuela' },
          methods: {
            type: 'array',
            items: { type: 'string', example: 'transfer' },
            example: ['transfer', 'pago_movil'],
          },
        },
      },
    },
  })
  async getSupportedBanks() {
    return this.paymentsService.getSupportedBanks();
  }

  // =========================================
  // MULTIPLE PAYMENT METHODS ENDPOINTS
  // =========================================

  @Post('initiate-multiple')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '🎯 Iniciar pagos múltiples',
    description: `
    **SISTEMA DE PAGOS MÚLTIPLES VENEZOLANO**

    Permite al usuario dividir el pago de un servicio en diferentes métodos de pago.

    **Ejemplos de uso:**
    - Parte en transferencia bancaria, parte en pago móvil
    - Parte en efectivo, parte en Zelle
    - Combinaciones personalizadas según preferencia del usuario

    **Proceso:**
    1. Se valida que la suma de pagos parciales = total
    2. Se genera un grupo de pagos con UUID único
    3. Se crean referencias para pagos electrónicos
    4. Se registra monto en efectivo (sin referencia)
    5. Grupo expira en 24 horas

    **Estados del grupo:**
    - \`incomplete\`: Pagos pendientes
    - \`complete\`: Todos los pagos confirmados
    - \`cancelled\`: Grupo cancelado por usuario
    - \`expired\`: Tiempo límite excedido
    `,
  })
  @ApiResponse({
    status: 201,
    description: 'Grupo de pagos múltiples creado exitosamente',
    schema: {
      type: 'object',
      properties: {
        groupId: { type: 'string', example: 'cm1n8x9p40000abcdefghijk' },
        totalAmount: { type: 'number', example: 75.5 },
        electronicPayments: { type: 'number', example: 2 },
        cashAmount: { type: 'number', example: 20.0 },
        references: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              referenceNumber: {
                type: 'string',
                example: '12345678901234567890',
              },
              amount: { type: 'number', example: 25.0 },
              method: { type: 'string', example: 'transfer' },
            },
          },
        },
        expiresAt: { type: 'string', format: 'date-time' },
        instructions: {
          type: 'string',
          example: 'Realiza los pagos electrónicos...',
        },
      },
    },
  })
  async initiateMultiplePayments(
    @Body() dto: InitiateMultiplePaymentsDto,
    @Req() req: any,
  ) {
    return this.paymentsService.initiateMultiplePayments({
      ...dto,
      userId: req.user.id,
    });
  }

  @Post('confirm-partial')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '✅ Confirmar pago parcial',
    description: `
    **CONFIRMACIÓN DE PAGO PARCIAL**

    Confirma un pago individual dentro de un grupo de pagos múltiples.

    **Proceso:**
    1. Se valida que la referencia pertenece al usuario
    2. Se valida que pertenece a un grupo de pagos múltiples
    3. Se confirma el pago con el banco correspondiente
    4. Se actualiza el progreso del grupo
    5. Si es el último pago, se completa el grupo

    **Actualización automática:**
    - Grupo se marca como 'complete' cuando todos los pagos son confirmados
    - Servicio correspondiente se actualiza cuando grupo está completo
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Pago parcial confirmado exitosamente',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        groupId: { type: 'string', example: 'cm1n8x9p40000abcdefghijk' },
        isPartial: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Pago confirmado exitosamente' },
      },
    },
  })
  async confirmPartialPayment(
    @Body() dto: ConfirmPartialPaymentDto,
    @Req() req: any,
  ) {
    return this.paymentsService.confirmPartialPayment(dto, req.user.id);
  }

  @Get('group-status/:groupId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '📊 Consultar estado de grupo de pagos',
    description: `
    **ESTADO DE GRUPO DE PAGOS MÚLTIPLES**

    Obtiene información detallada sobre el progreso de un grupo de pagos múltiples.

    **Información incluida:**
    - Estado general del grupo (incomplete/complete/cancelled/expired)
    - Monto total vs pagado vs pendiente
    - Estadísticas de confirmación por método
    - Detalles de cada pago individual
    - Fechas de expiración y completado

    **Útil para:**
    - Mostrar progreso al usuario en la app
    - Depuración de pagos pendientes
    - Historial de transacciones múltiples
    `,
  })
  @ApiParam({
    name: 'groupId',
    description: 'ID del grupo de pagos (UUID)',
    example: 'cm1n8x9p40000abcdefghijk',
  })
  @ApiResponse({
    status: 200,
    description: 'Estado del grupo obtenido exitosamente',
    schema: {
      type: 'object',
      properties: {
        groupId: { type: 'string', example: 'cm1n8x9p40000abcdefghijk' },
        totalAmount: { type: 'number', example: 75.5 },
        paidAmount: { type: 'number', example: 55.5 },
        remainingAmount: { type: 'number', example: 20.0 },
        status: { type: 'string', example: 'incomplete' },
        statistics: {
          type: 'object',
          properties: {
            totalReferences: { type: 'number', example: 3 },
            confirmedReferences: { type: 'number', example: 2 },
            pendingReferences: { type: 'number', example: 1 },
            confirmationRate: { type: 'number', example: 66.67 },
          },
        },
        payments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              referenceNumber: {
                type: 'string',
                example: '12345678901234567890',
              },
              amount: { type: 'number', example: 25.0 },
              method: { type: 'string', example: 'transfer' },
              status: { type: 'string', example: 'confirmed' },
            },
          },
        },
      },
    },
  })
  async getPaymentGroupStatus(
    @Param('groupId') groupId: string,
    @Req() req: any,
  ) {
    return this.paymentsService.getPaymentGroupStatus({ groupId }, req.user.id);
  }

  @Post('cancel-group/:groupId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '🚫 Cancelar grupo de pagos',
    description: `
    **CANCELACIÓN DE GRUPO DE PAGOS MÚLTIPLES**

    Cancela un grupo de pagos múltiples pendiente.

    **Acciones realizadas:**
    1. Se valida que el grupo pertenece al usuario
    2. Se valida que no esté completado
    3. Se marcan todas las referencias pendientes como 'expired'
    4. Se actualiza el estado del grupo a 'cancelled'
    5. Se libera cualquier bloqueo en el servicio

    **No se puede cancelar:**
    - Grupos ya completados
    - Grupos de otros usuarios
    `,
  })
  @ApiParam({
    name: 'groupId',
    description: 'ID del grupo de pagos a cancelar',
    example: 'cm1n8x9p40000abcdefghijk',
  })
  @ApiResponse({
    status: 200,
    description: 'Grupo de pagos cancelado exitosamente',
    schema: {
      type: 'object',
      properties: {
        groupId: { type: 'string', example: 'cm1n8x9p40000abcdefghijk' },
        status: { type: 'string', example: 'cancelled' },
        message: {
          type: 'string',
          example: 'Grupo de pagos cancelado exitosamente',
        },
      },
    },
  })
  async cancelPaymentGroup(@Param('groupId') groupId: string, @Req() req: any) {
    return this.paymentsService.cancelPaymentGroup(groupId, req.user.id);
  }
}
