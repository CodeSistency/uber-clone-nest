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
  @ApiOperation({
    summary: 'Create a Stripe payment intent',
    description: 'Create a new payment intent for processing a ride payment through Stripe'
  })
  @ApiBody({
    type: CreatePaymentIntentDto,
    description: 'Customer information and payment amount'
  })
  @ApiResponse({
    status: 200,
    description: 'Payment intent created successfully',
    schema: {
      type: 'object',
      properties: {
        paymentIntent: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'pi_1N2B3C4D5E6F7G8H' },
            client_secret: {
              type: 'string',
              example: 'pi_1N2B3C4D5E6F7G8H_secret_ABC123DEF456',
              description: 'Secret key for client-side payment confirmation'
            },
            amount: { type: 'number', example: 1575, description: 'Amount in cents' },
            currency: { type: 'string', example: 'usd' },
            status: { type: 'string', example: 'requires_payment_method' }
          },
        },
        ephemeralKey: {
          type: 'object',
          description: 'Ephemeral key for secure client communication'
        },
        customer: {
          type: 'string',
          example: 'cus_1N2B3C4D5E6F7G8H',
          description: 'Stripe customer ID'
        },
        publishableKey: {
          type: 'string',
          example: 'pk_test_...',
          description: 'Stripe publishable key for client-side use'
        }
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Missing required fields or invalid payment amount'
  })
  @ApiResponse({
    status: 402,
    description: 'Payment required - amount too low or invalid currency'
  })
  @ApiResponse({ status: 500, description: 'Stripe service error' })
  async createPaymentIntent(
    @Body() createPaymentIntentDto: CreatePaymentIntentDto,
  ): Promise<any> {
    return this.stripeService.createPaymentIntent(createPaymentIntentDto);
  }

  @Post('pay')
  @ApiOperation({
    summary: 'Confirm a Stripe payment',
    description: 'Confirm and process a payment using Stripe payment method and intent'
  })
  @ApiBody({
    type: ConfirmPaymentDto,
    description: 'Stripe payment confirmation details'
  })
  @ApiResponse({
    status: 200,
    description: 'Payment confirmed and processed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        paymentIntent: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'pi_1N2B3C4D5E6F7G8H' },
            status: { type: 'string', example: 'succeeded' },
            amount: { type: 'number', example: 1575 },
            currency: { type: 'string', example: 'usd' },
            receipt_email: { type: 'string', example: 'john.doe@example.com' }
          }
        },
        charge: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'ch_1N2B3C4D5E6F7G8H' },
            amount: { type: 'number', example: 1575 },
            currency: { type: 'string', example: 'usd' },
            status: { type: 'string', example: 'succeeded' }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Missing required fields or invalid Stripe IDs'
  })
  @ApiResponse({
    status: 402,
    description: 'Payment failed - card declined or insufficient funds'
  })
  @ApiResponse({
    status: 409,
    description: 'Payment already processed or expired'
  })
  @ApiResponse({ status: 500, description: 'Stripe service error' })
  async confirmPayment(
    @Body() confirmPaymentDto: ConfirmPaymentDto,
  ): Promise<any> {
    return this.stripeService.confirmPayment(confirmPaymentDto);
  }

  @Post('refund')
  @ApiOperation({
    summary: 'Create a refund',
    description: 'Process a refund for a completed payment. Full or partial refunds are supported.'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        paymentIntentId: {
          type: 'string',
          example: 'pi_1N2B3C4D5E6F7G8H',
          description: 'Stripe payment intent ID to refund',
          pattern: '^pi_'
        },
        amount: {
          type: 'number',
          example: 15.75,
          description: 'Refund amount in dollars (optional - full refund if not specified)',
          minimum: 0.50,
          maximum: 999.99
        },
        reason: {
          type: 'string',
          example: 'requested_by_customer',
          description: 'Reason for the refund',
          enum: ['duplicate', 'fraudulent', 'requested_by_customer']
        }
      },
      required: ['paymentIntentId'],
    },
    description: 'Refund request details'
  })
  @ApiResponse({
    status: 200,
    description: 'Refund processed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        refund: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 're_1N2B3C4D5E6F7G8H' },
            amount: { type: 'number', example: 1575, description: 'Amount in cents' },
            currency: { type: 'string', example: 'usd' },
            status: { type: 'string', example: 'succeeded' },
            payment_intent: { type: 'string', example: 'pi_1N2B3C4D5E6F7G8H' },
            reason: { type: 'string', example: 'requested_by_customer' }
          }
        },
        charge: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'ch_1N2B3C4D5E6F7G8H' },
            amount_refunded: { type: 'number', example: 1575 }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Missing payment intent ID or invalid refund amount'
  })
  @ApiResponse({
    status: 402,
    description: 'Refund failed - insufficient funds or payment not eligible for refund'
  })
  @ApiResponse({
    status: 404,
    description: 'Payment intent not found'
  })
  @ApiResponse({
    status: 409,
    description: 'Refund already processed or payment not in refundable state'
  })
  @ApiResponse({ status: 500, description: 'Stripe service error' })
  async createRefund(
    @Body() body: { paymentIntentId: string; amount?: number },
  ): Promise<any> {
    const { paymentIntentId, amount } = body;
    return this.stripeService.createRefund(paymentIntentId, amount);
  }
}
