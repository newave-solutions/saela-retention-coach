export type DiscountType = "none" | "fixed" | "percent";

export type PricingLine = {
  id: string;
  item: string;
  quantity: number;
  productionPrice: number;
  chargePrice: number;
  discountType: DiscountType;
  discountAmount: number;
  taxable: boolean;
};

export type SubscriptionRecord = {
  id: string;
  program: string;
  active: boolean;
  agreementState: "in_agreement" | "out_of_agreement" | "frozen";
  effectiveDate: string;
  agreementMonths: number;
  committedServices: number;
  frequencyWeeks: number;
  yearlyIncreasePercent: number;
  routingRegion: string;
  preferredTechnician: string;
  preferredDay: string;
  preferredTime: string;
  callAhead: string;
  initialLines: PricingLine[];
  recurringLines: PricingLine[];
  tags: string[];
};

export type WorkspaceDocument = {
  id: string;
  title: string;
  createdAt: string;
  status: "current" | "prior" | "draft" | "sent_simulation";
  subscriptionId: string;
  terms?: AgreementTerms;
};

export type AgreementTerms = {
  serviceType: string;
  serviceAddress: string;
  effectiveDate: string;
  agreementMonths: number;
  committedServices: number;
  frequencyWeeks: number;
  initialTotal: number;
  recurringTotal: number;
  contractValue: number;
  yearlyIncreasePercent: number;
  initialLines: PricingLine[];
  recurringLines: PricingLine[];
};

export type WorkspaceEvent = {
  id: string;
  at: number;
  type: "tab_viewed" | "subscription_saved" | "agreement_generated" | "agreement_sent";
  target: string;
  summary: string;
};

export type SimulatedAccount = {
  version: number;
  customerNumber: string;
  customerName: string;
  phone: string;
  email: string;
  serviceAddress: string;
  customerSince: string;
  status: "active" | "out_of_agreement" | "frozen" | "cancelled";
  balance: number;
  accountAgeDays: number;
  completedServices: number;
  reserviceCount: number;
  lastCompleted: string;
  nextService: string;
  recentServiceNote: string;
  subscription: SubscriptionRecord;
  previousSubscriptions: Array<{ id: string; program: string; endedAt: string }>;
  documents: WorkspaceDocument[];
  notes: Array<{ id: string; category: string; createdAt: string; body: string }>;
  appointments: Array<{
    id: string;
    service: string;
    date: string;
    status: "serviced" | "scheduled" | "cancelled";
    technician: string;
    details: string;
  }>;
  invoices: Array<{
    id: string;
    date: string;
    service: string;
    amount: number;
    status: "paid" | "projected";
  }>;
  events: WorkspaceEvent[];
};

export function money(value: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

export function lineSubtotal(line: PricingLine): number {
  const base = Math.max(0, line.quantity) * Math.max(0, line.chargePrice);
  const discount =
    line.discountType === "percent"
      ? base * (Math.min(100, Math.max(0, line.discountAmount)) / 100)
      : line.discountType === "fixed"
        ? Math.max(0, line.discountAmount)
        : 0;
  return Math.round(Math.max(0, base - discount) * 100) / 100;
}

export function pricingTotal(lines: PricingLine[]): number {
  return Math.round(lines.reduce((sum, line) => sum + lineSubtotal(line), 0) * 100) / 100;
}

export function contractValue(subscription: SubscriptionRecord): number {
  return (
    Math.round(
      (pricingTotal(subscription.initialLines) +
        pricingTotal(subscription.recurringLines) * subscription.committedServices) *
        100,
    ) / 100
  );
}

export function agreementFrom(account: SimulatedAccount): AgreementTerms {
  const subscription = account.subscription;
  return {
    serviceType: subscription.program,
    serviceAddress: account.serviceAddress,
    effectiveDate: subscription.effectiveDate,
    agreementMonths: subscription.agreementMonths,
    committedServices: subscription.committedServices,
    frequencyWeeks: subscription.frequencyWeeks,
    initialTotal: pricingTotal(subscription.initialLines),
    recurringTotal: pricingTotal(subscription.recurringLines),
    contractValue: contractValue(subscription),
    yearlyIncreasePercent: subscription.yearlyIncreasePercent,
    initialLines: subscription.initialLines,
    recurringLines: subscription.recurringLines,
  };
}

export function validateSubscription(subscription: SubscriptionRecord): string[] {
  const errors: string[] = [];
  if (!subscription.program.trim()) errors.push("Service type is required.");
  if (!subscription.effectiveDate) errors.push("Effective date is required.");
  if (subscription.agreementMonths < 1) errors.push("Agreement length must be at least one month.");
  if (subscription.committedServices < 1)
    errors.push("At least one recurring service is required.");
  if (subscription.frequencyWeeks < 1) errors.push("Service frequency is required.");
  for (const line of [...subscription.initialLines, ...subscription.recurringLines]) {
    if (!line.item.trim()) errors.push("Every pricing line needs an item.");
    if (line.quantity < 0 || line.productionPrice < 0 || line.chargePrice < 0) {
      errors.push("Pricing values cannot be negative.");
    }
  }
  return Array.from(new Set(errors));
}
