export enum TrialDurationEnum {
    FIFTEEN_DAYS = '15-DAYS',
    ONE_MONTH = '1-MONTH',
    TWO_MONTH = '2-MONTH',
    THREE_MONTH = '3-MONTH',
  }

  export interface ICustomerDetails {
    stripeCustomerId?: string;
    stripePaymentMethodId?: string;
    cardBrand?: string;
    cardCountry?: string,
    cardLast4?: string;
    cardExpMonth?: number;
    cardExpYear?: number;
  }

  export enum BillingCycle {
    DAILY = 'DAILY',
    MONTHLY = 'MONTHLY',
    YEARLY = 'YEARLY',
  }

  export enum InvoiceItemNames {
    PLAN= 'Plan: ',
    INCLUDED_USER_QUOTA = 'Included User Quota',
    EXTRA_USERS = 'Extra Users',
    MONTHLY_ACTIVE_USERS = 'Monthly Active Users',
    NEW_USERS_ADDED = 'New Users Added',
    USERS_DELETED = 'Users Deleted',
  }

  export interface IStripeTransactionData{
    orderId: string;
    transactionId: string;
    stripeSubscriptionId?: string;
    total: number,
    allowedUsers?: number
  }

  export enum PAYMENT_TYPE {
    SUBSCRIPTION = 'SUBSCRIPTION',
    DIRECT_PAYMENT = 'DIRECT_PAYMENT',
    SUBSCRIPTION_PAYMENY_MANUALLY = 'SUBSCRIPTION_PAYMENY_MANUALLY'
  }