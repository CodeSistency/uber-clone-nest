import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(private configService: ConfigService) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');

    if (!stripeSecretKey) {
      console.warn('⚠️  STRIPE_SECRET_KEY not found. Stripe functionality will be disabled.');
      return;
    }

    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-08-27.basil',
    });
  }

  private checkStripeConfigured(): void {
    if (!this.stripe) {
      throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY in your environment variables.');
    }
  }

  async createPaymentIntent(createPaymentIntentDto: CreatePaymentIntentDto): Promise<any> {
    this.checkStripeConfigured();
    const { name, email, amount } = createPaymentIntentDto;

    // Create or retrieve customer
    const customers = await this.stripe.customers.list({
      email,
      limit: 1,
    });

    let customer: Stripe.Customer;
    if (customers.data.length > 0) {
      customer = customers.data[0];
    } else {
      customer = await this.stripe.customers.create({
        name,
        email,
      });
    }

    // Create ephemeral key for mobile apps
    const ephemeralKey = await this.stripe.ephemeralKeys.create(
      { customer: customer.id },
      { apiVersion: '2025-08-27.basil' }
    );

    // Create payment intent
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      customer: customer.id,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return {
      paymentIntent: {
        id: paymentIntent.id,
        client_secret: paymentIntent.client_secret,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
      },
      ephemeralKey: {
        id: ephemeralKey.id,
        secret: ephemeralKey.secret,
      },
      customer: customer.id,
    };
  }

  async confirmPayment(confirmPaymentDto: ConfirmPaymentDto): Promise<any> {
    this.checkStripeConfigured();
    const { payment_method_id, payment_intent_id, customer_id } = confirmPaymentDto;

    try {
      // Attach payment method to customer
      await this.stripe.paymentMethods.attach(payment_method_id, {
        customer: customer_id,
      });

      // Update payment intent with payment method
      const paymentIntent = await this.stripe.paymentIntents.update(
        payment_intent_id,
        {
          payment_method: payment_method_id,
        }
      );

      // Confirm the payment
      const confirmedPayment = await this.stripe.paymentIntents.confirm(payment_intent_id);

      return {
        success: true,
        paymentIntent: {
          id: confirmedPayment.id,
          status: confirmedPayment.status,
          amount: confirmedPayment.amount,
          currency: confirmedPayment.currency,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async createRefund(paymentIntentId: string, amount?: number): Promise<any> {
    this.checkStripeConfigured();
    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amount ? Math.round(amount * 100) : undefined,
      });

      return {
        success: true,
        refund: {
          id: refund.id,
          amount: refund.amount,
          currency: refund.currency,
          status: refund.status,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getPaymentStatus(paymentIntentId: string): Promise<any> {
    this.checkStripeConfigured();
    const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);

    return {
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      created: paymentIntent.created,
    };
  }
}
