import type { SimulatedAccount } from "./account-workspace";

function isoDay(offsetDays = 0): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

export function createSimulatedAccount(input: {
  customerName: string;
  outOfAgreement?: boolean;
  frozen?: boolean;
}): SimulatedAccount {
  const customerNumber = String(1_500_000 + Math.floor(Math.random() * 90_000));
  const [first = "Customer", last = "Account"] = input.customerName.split(" ");
  const status = input.frozen ? "frozen" : input.outOfAgreement ? "out_of_agreement" : "active";
  return {
    version: 1,
    customerNumber,
    customerName: input.customerName,
    phone: `(720) 555-${String(1000 + Math.floor(Math.random() * 8999))}`,
    email: `${first.toLowerCase()}.${last.toLowerCase()}@example.test`,
    serviceAddress: `${1100 + Math.floor(Math.random() * 7800)} Willow Ridge Dr, Denver, CO 80220`,
    customerSince: isoDay(-760),
    status,
    balance: 0,
    accountAgeDays: 760,
    completedServices: 11,
    reserviceCount: 2,
    lastCompleted: isoDay(-42),
    nextService: isoDay(35),
    recentServiceNote: "Exterior perimeter serviced; customer reported intermittent spider activity.",
    subscription: {
      id: `PP-${customerNumber}`,
      program: "Protection Program",
      active: !input.frozen,
      agreementState: input.frozen ? "frozen" : input.outOfAgreement ? "out_of_agreement" : "in_agreement",
      effectiveDate: isoDay(),
      agreementMonths: input.outOfAgreement ? 0 : 18,
      committedServices: input.outOfAgreement ? 4 : 6,
      frequencyWeeks: 12,
      yearlyIncreasePercent: 5,
      routingRegion: "Denver South",
      preferredTechnician: "Any qualified technician",
      preferredDay: "Any day",
      preferredTime: "Any time",
      callAhead: "30 minutes",
      initialLines: [
        {
          id: "initial-pp",
          item: "Protection Program — Initial",
          quantity: 1,
          productionPrice: 129.99,
          chargePrice: 129.99,
          discountType: "none",
          discountAmount: 0,
          taxable: false,
        },
      ],
      recurringLines: [
        {
          id: "recurring-pp",
          item: "Protection Program — Recurring",
          quantity: 1,
          productionPrice: 114.99,
          chargePrice: 129.99,
          discountType: "none",
          discountAmount: 0,
          taxable: false,
        },
      ],
      tags: input.outOfAgreement ? [] : ["Existing agreement"],
    },
    previousSubscriptions: [
      { id: `PP-${Number(customerNumber) - 84}`, program: "Protection Program", endedAt: isoDay(-365) },
    ],
    documents: [
      {
        id: `agreement-${customerNumber}-prior`,
        title: "Protection Program Agreement",
        createdAt: isoDay(-760),
        status: "prior",
        subscriptionId: `PP-${customerNumber}`,
      },
    ],
    notes: [
      {
        id: `note-${customerNumber}`,
        category: "General Notes",
        createdAt: isoDay(-18),
        body: "Customer requested text contact before arrival. Side gate sticks after rain.",
      },
    ],
    appointments: [
      {
        id: `appt-${customerNumber}-1`,
        service: "Protection Program",
        date: isoDay(-42),
        status: "serviced",
        technician: "Tawny Butler",
        details: "Exterior foundations, eaves, foliage, lawn, yard. Spiders and ants noted.",
      },
      {
        id: `appt-${customerNumber}-2`,
        service: "Protection Program",
        date: isoDay(35),
        status: "scheduled",
        technician: "Unassigned",
        details: "Regular recurring service; 30-minute call ahead.",
      },
    ],
    invoices: [
      { id: `inv-${customerNumber}-1`, date: isoDay(-42), service: "Protection Program", amount: 129.99, status: "paid" },
      { id: `inv-${customerNumber}-2`, date: isoDay(35), service: "Protection Program", amount: 129.99, status: "projected" },
    ],
    events: [],
  };
}