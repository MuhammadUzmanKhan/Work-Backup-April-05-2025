import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Stripe from "stripe";
import { CreateCustomerDto } from "./dto/createCustomer.dto";
import { CreateSubscriptionDto } from "./dto/createSubscription.dto";
import * as moment from 'moment';
@Injectable()
export class StripeSubscriptionService {
  private stripe: Stripe;

  constructor(private configService: ConfigService) {
    this.stripe = new Stripe(
      this.configService.get<string>("STRIPE_SECRET_KEY"),
      {
        apiVersion: "2024-06-20",
      }
    );
  }

  async findCustomerByEmail(email: string): Promise<Stripe.Customer | null> {
    const customers = await this.stripe.customers.list({ email, limit: 1 });
    return customers.data.length > 0 ? customers.data[0] : null;
  }

  async findSubscription(
    customerId: string,
    productId: string
  ): Promise<Stripe.Subscription | null> {
    const subscriptions = await this.stripe.subscriptions.list({
      customer: customerId,
      status: "active",
    });
    const subscription = subscriptions.data.find((sub: any) =>
      sub.items.data.some((item: any) => item.plan.product === productId)
    );
    return subscription || null;
  }

  async createCustomer(
    createCustomerDto: CreateCustomerDto
  ): Promise<Stripe.Customer> {
    const { email, paymentMethod } = createCustomerDto;
    let customer = await this.findCustomerByEmail(email);

    if (customer) {
      return customer;
    }

    customer = await this.stripe.customers.create({
      email,
      payment_method: paymentMethod,
      invoice_settings: {
        default_payment_method: paymentMethod,
      },
    });

    return customer;
  }

  async createSubscription(
    createSubscriptionDto: CreateSubscriptionDto
  ): Promise<Stripe.Subscription> {
    const { customerId, productId, maxUsers } = createSubscriptionDto;
    let subscription = await this.findSubscription(customerId, productId);
    if (subscription) {
      console.log("subscription is............", subscription);
      return subscription;
    }
    const tomorrow = moment().add(1, "day");
    console.log("tomorrow......", tomorrow)
    // Convert to Unix timestamp (seconds since epoch)
    const trialEndTimestamp = tomorrow.unix();
    console.log("timestampends.....", trialEndTimestamp)
    subscription = await this.stripe.subscriptions.create({
      customer: customerId,
      items: Array.from({ length: maxUsers }, () => ({
        price_data: {
          currency: "usd",
          product: productId,
          unit_amount: 500, // Amount in cents (e.g., $5.00 per user)
          recurring: {
            interval: "day", // Monthly subscription interval
          },
        },
      })),
      trial_end: trialEndTimestamp, // Set trial end to the end of current month
      payment_settings: {
        payment_method_types: ["card"],
        save_default_payment_method: "on_subscription",
      },
      expand: ["latest_invoice.payment_intent"],
    });
    return subscription;
  }
}
