export type Plan = {
  id: string;
  stripeProductId: string;
  index: number;
  name: string;
  description: string;
  basePrice: string;
  maxUsers: number | null;
  includedUsers: number | null;
  extraUserPrice: number | null;
  isTrial: boolean;
  trialDuration: string;
  features: { name: string; available: boolean }[];
};

export type BillingDetailType = {
  subscriptionId: string;
  billingCycle: string;
  nextBillingDate: string;
  nextExpectedAmount: string;
  paidAmount: string;
  isActive: boolean;
  plan: string;
  basePrice: number;
  cardBrand: string;
  cardLast4: string;
  cardExpMonth: string;
  cardExpYear: string;
  activeUsers: number;
  isTrial: boolean;
}