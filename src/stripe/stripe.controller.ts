import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { StripeService } from './stripe.service';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';

@ApiTags('stripe')
@Controller('api/stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  @Post('create')
  @ApiOperation({ summary: 'Create a Stripe payment intent' })
  @ApiBody({ type: CreatePaymentIntentDto })
  @ApiResponse({
    status: 200,
    description: 'Returns payment intent details',
    schema: {
      type: 'object',
      properties: {
        paymentIntent: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            client_secret: { type: 'string' },
            amount: { type: 'number' },
            currency: { type: 'string' },
            status: { type: 'string' }
          }
        },
        ephemeralKey: { type: 'object' },
        customer: { type: 'string' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Missing required fields' })
  async createPaymentIntent(@Body() createPaymentIntentDto: CreatePaymentIntentDto): Promise<any> {
    return this.stripeService.createPaymentIntent(createPaymentIntentDto);
  }

  @Post('pay')
  @ApiOperation({ summary: 'Confirm a Stripe payment' })
  @ApiBody({ type: ConfirmPaymentDto })
  @ApiResponse({ status: 200, description: 'Payment successful' })
  @ApiResponse({ status: 400, description: 'Missing required fields' })
  @ApiResponse({ status: 500, description: 'Stripe error' })
  async confirmPayment(@Body() confirmPaymentDto: ConfirmPaymentDto): Promise<any> {
    return this.stripeService.confirmPayment(confirmPaymentDto);
  }

  @Post('refund')
  @ApiOperation({ summary: 'Create a refund' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        paymentIntentId: { type: 'string', example: 'pi_...' },
        amount: { type: 'number', example: 15.75 }
      },
      required: ['paymentIntentId']
    }
  })
  @ApiResponse({ status: 200, description: 'Refund created successfully' })
  async createRefund(@Body() body: { paymentIntentId: string; amount?: number }): Promise<any> {
    const { paymentIntentId, amount } = body;
    return this.stripeService.createRefund(paymentIntentId, amount);
  }
}
