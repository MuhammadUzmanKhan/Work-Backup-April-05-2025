import { BadRequestException, HttpException, Injectable, InternalServerErrorException, MethodNotAllowedException, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Stripe from "stripe";
import { CreateCustomerDto } from "./dto/createCustomer.dto";
import { CreateSubscriptionDto } from "./dto/createSubscription.dto";
import { PaymentsService } from "../payments.service";
import { Users } from "src/common/models/users.model";
import { Workspaces } from "src/common/models/workspaces.model";
import { Subscriptions } from "src/common/models/subscription.model";
import { ICustomerDetails, PAYMENT_TYPE } from "src/types/payments";
import { SubscriptionDetails } from "src/common/models/subscription-details.model";
import { Request } from "express";
import * as moment from "moment";
import { updatePaymentMethodDto } from "./dto/updatePaymentMethod.dto";
@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(
    private configService: ConfigService,
    private readonly paymentService: PaymentsService,
  ) {
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
    const { name, email, paymentMethod } = createCustomerDto;
    let customer = await this.findCustomerByEmail(email);

    if (customer) {
      return customer;
    }

    customer = await this.stripe.customers.create({
      name,
      email,
      payment_method: paymentMethod,
      invoice_settings: {
        default_payment_method: paymentMethod,
      },
    });

    return customer;
  }

  async updatePaymentMethod(user: Users, data: updatePaymentMethodDto) {
    const { customerId, paymentMethodId } = data

    const workspace = await Workspaces.findByPk(user.companyId, {
      include: [
        {
          model: Subscriptions,
          include: [SubscriptionDetails]
        }
      ]
    })
    if (!workspace.subscription) throw new NotFoundException('Subscription not found!')

    const subscriptionId = workspace.subscription.stripeSubscriptionId

    try {
      await this.stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });
    } catch (error: any) {
      throw new MethodNotAllowedException(
        `Failed to attach the payment method to the customer: ${error.message}`
      );
    }

    // Update the payment method for the customer in Stripe
    await this.stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    await this.stripe.subscriptions.update(subscriptionId, {
      default_payment_method: paymentMethodId,
    });

    // Retrieve card details from the payment method
    const paymentMethod = await this.stripe.paymentMethods.retrieve(paymentMethodId);

    if (!paymentMethod || paymentMethod.card === undefined) {
      throw new MethodNotAllowedException('Failed to retrieve payment method details from Stripe.');
    }

    const { brand, country, last4, exp_month, exp_year } = paymentMethod.card;
    // Save customer and card details
    await this.saveCustomerDetails(workspace.subscription.id, {
      stripeCustomerId: customerId,
      stripePaymentMethodId: paymentMethodId,
      cardBrand: brand,
      cardCountry: country,
      cardLast4: last4,
      cardExpMonth: exp_month,
      cardExpYear: exp_year,
    });

    return { success: true, message: 'Payment method updated successfully.' }

  }

  async saveCustomerDetails(subscriptionId: string, customerDetails: ICustomerDetails) {
    let subscriptionDetails = await SubscriptionDetails.findOne({
      where: {
        subscriptionId
      }
    })

    if (!subscriptionDetails) {
      subscriptionDetails = await SubscriptionDetails.create({ subscriptionId })
    }

    return await subscriptionDetails.update(customerDetails)
  }

  async savePaymentMethod({ userId, stripeCustomerId, stripePaymentMethodId }: { userId: string, stripeCustomerId: string, stripePaymentMethodId: string }) {
    const user = await Users.findByPk(userId, {
      include: [
        {
          model: Workspaces,
          include: [
            {
              model: Subscriptions
            }
          ]
        }
      ]
    })
    if (!user) throw new NotFoundException('User not found!')

    if (!user.company.subscription) throw new NotFoundException('Subscription not found!')

    await this.saveCustomerDetails(user.company.subscription.id, { stripeCustomerId, stripePaymentMethodId })
  }

  async getCustomerDetails({ workspaceId }: { workspaceId: string }): Promise<{ paymentMethodId: string, customerId: string }> {
    const workspace = await Workspaces.findByPk(workspaceId, {
      include: [
        {
          model: Subscriptions,
          include: [SubscriptionDetails]
        }
      ]
    })
    if (!workspace) throw new NotFoundException('Workspace not found!')

    if (!workspace.subscription) throw new NotFoundException('Subscription not found!')
    if (!workspace.subscription.details) throw new NotFoundException('Subscription details not found!')

    const { stripeCustomerId, stripePaymentMethodId } = workspace.subscription.details
    return { customerId: stripeCustomerId, paymentMethodId: stripePaymentMethodId }
  }

  async createSubscription(userId: string, createSubscriptionDto: CreateSubscriptionDto): Promise<any> {
    const { customerId, paymentMethodId, planId } = createSubscriptionDto;

    const plan = await this.paymentService.getPaymentPlanById(planId);
    if (!plan) throw new NotFoundException('Plan not found!');

    const user = await Users.findOne({
      where: {
        id: userId
      },
      include: [{
        model: Workspaces,
        attributes: ['id'],
        include: [{
          model: Subscriptions,
        }]
      }]
    })

    const activeUsers = await Users.count({
      where: {
        companyId: user.companyId,
      }
    })

    const stripeProductId = plan.stripeProductId;

    // Fetch the price from Stripe for the given product
    const prices = await this.stripe.prices.list({
      product: stripeProductId,
    });

    if (!prices.data.length) {
      throw new MethodNotAllowedException('No prices found for the specified Stripe product');
    }

    const priceId = prices.data[0].id;
    
    try {
      // Attach the payment method to the customer
      await this.stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });

      // Set the payment method as the default for the customer
      await this.stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        }
      });

      // Create the subscription
      const subscription = await this.stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId, quantity: plan.maxUsers ? 1 : Math.max(activeUsers, plan.includedUsers) }],
        metadata: {
          userId: user.id,
          planId: plan.id,
          type: PAYMENT_TYPE.SUBSCRIPTION,
          allowedUsers: Math.max(activeUsers, plan.includedUsers)
        },
        payment_settings: {
          payment_method_types: ["card"],
          save_default_payment_method: "on_subscription",
        },
        currency: 'usd',
        payment_behavior: "default_incomplete",
        expand: ["latest_invoice.payment_intent"],
      });

      const latestInvoice = subscription.latest_invoice as Stripe.Invoice;
      const paymentIntent = latestInvoice.payment_intent as Stripe.PaymentIntent;

      // Confirm the payment intent
      const confirmedPaymentIntent = await this.stripe.paymentIntents.confirm(paymentIntent.id, {
        payment_method: paymentMethodId,
      });

      // Save card details and subscription data
      const card = (await this.stripe.paymentMethods.retrieve(paymentMethodId)).card;
      if (card) {
        let subscriptionId: string = user.company.subscription?.id
        if (!user.company.subscription?.id) {
          const subscription = await this.paymentService.createSubscription({
            workspaceId: user.companyId, planId: plan.id, isTrial: false
          })
          subscriptionId = subscription.id
        }

        await this.saveCustomerDetails(
          subscriptionId,
          {
            stripeCustomerId: customerId,
            cardBrand: card.brand,
            cardCountry: card.country,
            cardLast4: card.last4,
            cardExpMonth: card.exp_month,
            cardExpYear: card.exp_year,
          });
      }

      if (confirmedPaymentIntent.status === "succeeded") {
        // Save details for future payments
        await this.savePaymentMethod({
          userId,
          stripeCustomerId: customerId.toString(),
          stripePaymentMethodId: paymentMethodId.toString(),
        });

        // Activating the plan
        await this.paymentService.activatePlan({
          userId: user.id,
          planId: plan.id,
          stripeData: {
            orderId: confirmedPaymentIntent.invoice.toString(),
            stripeSubscriptionId: subscription.id,
            transactionId: confirmedPaymentIntent.id,
            total: confirmedPaymentIntent.amount / 100
          }
        })

        return { success: true };
      } else if (confirmedPaymentIntent.status === "requires_action") {
        return { success: false, clientSecret: confirmedPaymentIntent.client_secret, status: confirmedPaymentIntent.status };
      }

      return { success: false, message: 'Payment Failed! Please contact the support.' }
    } catch (error: any) {
      console.error("Error creating subscription: ", error);
      if (error instanceof HttpException) throw error
      throw new BadRequestException(error?.message || "Failed to create subscription");
    }
  }

  async cancelSubscription(user: Users): Promise<{ success: boolean; message: string }> {
    const subscription = await Subscriptions.findOne({
      where: { workspaceId: user.companyId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found.');
    }

    if (!subscription.stripeSubscriptionId) {
      console.warn(
        `No Stripe subscription ID found for workspace: ${user.companyId}. Skipping Stripe cancellation.`
      );
      return {
        success: false,
        message: 'No active subscription to cancel.',
      };
    }

    try {
      // Fetch the latest subscription details from Stripe
      const stripeSubscription = await this.stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);

      // Handle the `incomplete_expired` state
      if (stripeSubscription.status === 'incomplete_expired') {
        return {
          success: false,
          message: 'The subscription has already expired and cannot be canceled.',
        };
      }

      // Proceed with cancellation if the subscription is active or in another cancelable state
      await this.stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });

      // Update local database
      await Subscriptions.update(
        { nextBillingDate: null },
        { where: { id: subscription.id } },
      );

      return { success: true, message: 'Subscription cancelled successfully.' };
    } catch (error) {
      console.error('Error cancelling subscription:', error);

      if (error instanceof this.stripe.errors.StripeInvalidRequestError) {
        throw new BadRequestException(`Stripe error: ${error.message}`);
      }

      throw new InternalServerErrorException(
        'An error occurred while cancelling the subscription. Please try again later.',
      );
    }
  }

  async reactivateSubscription(user: Users): Promise<{ success: boolean; message: string }> {
    const subscription = await Subscriptions.findOne({
      where: { workspaceId: user.companyId },
    });

    if (!subscription) {
      throw new NotFoundException('No subscription found to reactivate.');
    }

    try {
      const stripeSubscription = await this.stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);

      if (stripeSubscription.cancel_at_period_end === false) {
        return {
          success: false,
          message: 'The subscription is not eligible for reactivation.',
        };
      }

      // Reactivate the subscription in Stripe
      await this.stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: false,
      });

      // Update the local database to reflect the reactivated state
      await Subscriptions.update(
        { nextBillingDate: subscription.currentPeriodEnd }, // Convert Unix timestamp to JS Date
        { where: { id: subscription.id } },
      );

      return { success: true, message: 'Subscription reactivated successfully.' };
    } catch (error) {
      console.error('Error reactivating subscription:', error);

      if (error instanceof this.stripe.errors.StripeInvalidRequestError) {
        if (error.message.includes("incomplete_expired")) {
          throw new BadRequestException("The subscription has already expired and cannot be reactivated.");
        }
      }

      throw new InternalServerErrorException(
        'An error occurred while reactivating the subscription. Please try again later.',
      );
    }
  }

  async makeCustomPayment(userId: string, amount: number) {

    const user = await Users.findByPk(userId, { include: [Workspaces] })

    // Retrieve saved customer details
    const { customerId, paymentMethodId } = await this.getCustomerDetails({ workspaceId: user.companyId });

    if (!customerId || !paymentMethodId) {
      throw new NotFoundException('Customer or payment method not found');
    }

    // Create a new PaymentIntent using saved customer and payment method
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      customer: customerId,
      payment_method: paymentMethodId,
      off_session: true, // Indicates the payment is made without user interaction
      confirm: true, // Confirms the payment immediately
      metadata: {
        userId,
        type: PAYMENT_TYPE.DIRECT_PAYMENT,
        purpose: 'Next payment',
      },
    });

    console.log({ paymentIntent });


    return paymentIntent;
  }

  async manualPayForPlan(user: Users) {
    const workspace = await Workspaces.findByPk(user.companyId, {
      include: [
        {
          model: Subscriptions,
          include: [
            {
              model: SubscriptionDetails,
            }
          ]
        }
      ]
    });

    if (!workspace || !workspace.subscription) {
      throw new NotFoundException("Subscription not found for the user's workspace.");
    }

    const subscription = workspace.subscription;

    if (!subscription.stripeSubscriptionId || !subscription.details.stripePaymentMethodId) {
      throw new BadRequestException("Subscription or payment method details are incomplete.");
    }

    try {
      // Retrieve the subscription details from Stripe
      const stripeSubscription = await this.stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);

      if (!stripeSubscription) {
        throw new NotFoundException("Stripe subscription not found.");
      }

      // Fetch the default payment method for the customer
      const customer = await this.stripe.customers.retrieve(stripeSubscription.customer as string) as Stripe.Customer;

      if (!customer.invoice_settings?.default_payment_method) {
        throw new BadRequestException("No default payment method found for the customer.");
      }

      const paymentMethodId = customer.invoice_settings.default_payment_method;

      // Create an invoice for the subscription
      const invoice = await this.stripe.invoices.create({
        customer: stripeSubscription.customer as string,
        subscription: subscription.stripeSubscriptionId,
        auto_advance: true, // Automatically finalize the invoice after it's created
      });

      // Pay the invoice using the default payment method
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: workspace.subscription.nextExpectedAmount * 100, // Cents to Dollars
        currency: invoice.currency,
        customer: stripeSubscription.customer as string,
        description: `Restat subscription monthly payment for '${workspace.name}' for the month of '${moment().format('MMMM')}'.`,
        payment_method: paymentMethodId.toString(),
        metadata: {
          ...stripeSubscription.metadata,
          userId: user.id,
          planId: workspace.subscription.planId,
          type: PAYMENT_TYPE.SUBSCRIPTION_PAYMENY_MANUALLY,
          stripeInvoiceNo: invoice.id,
        },
        off_session: true, // Attempt payment without customer interaction
        confirm: true,
      });


      if (paymentIntent.status === "succeeded") {
        return { success: true, message: "Subscription activated successfully. Thank you for subscribing!" };
      } else {
        return { success: false, message: "Payment requires additional action. Please contact support." };
      }
    } catch (error: any) {
      console.error("Error processing payment: ", error);
      if (error instanceof HttpException) throw error;
      throw new BadRequestException(error?.message || "Failed to process payment.");
    }
  }

  async paymentSuccessWebhook(req: Request) {
    const secret = this.configService.get<string>("STRIPE_ENDPOINT_SECRET");
    try {
      const payloadString = JSON.stringify(req.body, null, 2);
      const header = this.stripe.webhooks.generateTestHeaderString({
        payload: payloadString,
        secret,
      });
      const event = this.stripe.webhooks.constructEvent(payloadString, header, secret);
      console.log('------------------------- Event Type ---------------------------', event.type);

      if (event.type === 'invoice.payment_succeeded') {
        const invoice = event.data.object;
        console.log('--->>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>', invoice);

        const { planId, userId, type, allowedUsers } = invoice.subscription_details.metadata

        if (type === PAYMENT_TYPE.SUBSCRIPTION) {
          const {
            number: orderId, // Order ID
            charge: transactionId, // Transaction ID
            subscription: stripeSubscriptionId,
            customer: customerId, // Stripe Customer ID
            payment_intent: paymentIntentId, // PaymentIntent ID
            total
          } = invoice

          const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId?.toString());
          const paymentMethodId = paymentIntent.payment_method;

          // Save details for future payments
          await this.savePaymentMethod({
            userId,
            stripeCustomerId: customerId?.toString(),
            stripePaymentMethodId: paymentMethodId?.toString(),
          });

          // Activating the plan
          await this.paymentService.activatePlan({
            userId,
            planId,
            stripeData: {
              orderId,
              transactionId: transactionId?.toString(),
              stripeSubscriptionId: stripeSubscriptionId?.toString(),
              total: total / 100,
              allowedUsers: +allowedUsers,
            }
          })
        }

      } else if (event.type === 'payment_intent.succeeded') {
        const invoice = event.data.object;
        const {
          planId,
          userId,
          type,
          stripeInvoiceNo: orderId, // Order ID
          allowedUsers,
        } = invoice.metadata

        if (type === PAYMENT_TYPE.SUBSCRIPTION_PAYMENY_MANUALLY) {
          const {
            latest_charge: transactionId, // Transaction ID
            amount
          } = invoice

          // Activating the plan
          await this.paymentService.activatePlan({
            userId,
            planId,
            stripeData: {
              orderId,
              transactionId: transactionId?.toString(),
              total: amount / 100,
              allowedUsers: +allowedUsers
            }
          })
        }
      } else if (event.type === 'invoice.payment_failed') {
        console.log(event);
      }
    } catch (err: any) {
      console.error('Error Occurred in paymentSuccessWebhook', err);
      return;
    }
  }


}
