import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Json } from "@/integrations/supabase/types";
import {
  contractValue,
  pricingTotal,
  validateSubscription,
  type SimulatedAccount,
} from "./account-workspace";

type SaveWorkspaceInput = {
  sessionId: string;
  account: SimulatedAccount;
  event: {
    type: "subscription_saved" | "agreement_generated" | "agreement_sent";
    target: string;
    summary: string;
  };
};

export const saveWorkspace = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: SaveWorkspaceInput) => input)
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("training_sessions")
      .select("scenario, status")
      .eq("id", data.sessionId)
      .single();
    if (error) throw new Error(error.message);
    if (row.status !== "active") throw new Error("This practice call has already ended.");

    const current = row.scenario as unknown as Record<string, unknown>;
    const stored = current["simulatedAccount"] as SimulatedAccount | undefined;
    if (!stored) throw new Error("This call does not have a training account.");
    if (stored.customerNumber !== data.account.customerNumber) throw new Error("Account mismatch.");
    if (data.account.version !== stored.version)
      throw new Error("The account changed. Reload it before saving.");

    const errors = validateSubscription(data.account.subscription);
    if (errors.length) throw new Error(errors[0]);

    const updated: SimulatedAccount = {
      ...data.account,
      version: data.account.version + 1,
      subscription: {
        ...data.account.subscription,
        initialLines: data.account.subscription.initialLines.map((line) => ({
          ...line,
          taxable: false,
        })),
        recurringLines: data.account.subscription.recurringLines.map((line) => ({
          ...line,
          taxable: false,
        })),
      },
      invoices: data.account.invoices.map((invoice) =>
        invoice.status === "projected"
          ? { ...invoice, amount: pricingTotal(data.account.subscription.recurringLines) }
          : invoice,
      ),
      events: [...stored.events, { id: crypto.randomUUID(), at: Date.now(), ...data.event }],
    };

    const nextScenario = { ...current, simulatedAccount: updated } as unknown as Json;
    const { error: saveError } = await context.supabase
      .from("training_sessions")
      .update({ scenario: nextScenario })
      .eq("id", data.sessionId);
    if (saveError) throw new Error(saveError.message);

    return {
      account: updated,
      totals: {
        initial: pricingTotal(updated.subscription.initialLines),
        recurring: pricingTotal(updated.subscription.recurringLines),
        contract: contractValue(updated.subscription),
      },
    };
  });
