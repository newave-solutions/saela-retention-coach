import { useMemo, useState, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Check,
  ChevronDown,
  ChevronUp,
  FileText,
  History,
  MapPin,
  Plus,
  Save,
  Send,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import {
  agreementFrom,
  contractValue,
  lineSubtotal,
  money,
  pricingTotal,
  validateSubscription,
  type PricingLine,
  type SimulatedAccount,
  type SubscriptionRecord,
} from "@/lib/account-workspace";
import { saveWorkspace } from "@/lib/workspace.functions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

type Props = { sessionId: string; initialAccount: SimulatedAccount };

const TAB_LABELS = [
  "Overview",
  "Info",
  "Subscription",
  "Leads",
  "Billing",
  "Notes",
  "Documents",
  "Appointments",
  "Invoices",
  "Properties",
  "Conditions",
  "Equipment",
  "Admin",
] as const;

const TECHNICIANS = ["Unassigned", "Tawny Butler", "Marcus Reyes", "Dana Whitfield", "Luis Ortega"];

function numberValue(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function PricingEditor({
  title,
  lines,
  onChange,
}: {
  title: string;
  lines: PricingLine[];
  onChange: (lines: PricingLine[]) => void;
}) {
  const [open, setOpen] = useState(true);
  const update = (id: string, patch: Partial<PricingLine>) =>
    onChange(lines.map((line) => (line.id === id ? { ...line, ...patch } : line)));
  const add = () =>
    onChange([
      ...lines,
      {
        id: crypto.randomUUID(),
        item: "Additional item",
        quantity: 1,
        productionPrice: 0,
        chargePrice: 0,
        discountType: "none",
        discountAmount: 0,
        taxable: false,
      },
    ]);

  return (
    <section className="border border-border bg-card">
      <button
        type="button"
        className="flex w-full items-center justify-between px-4 py-3 text-left"
        onClick={() => setOpen(!open)}
      >
        <span className="font-semibold">{title}</span>
        <span className="flex items-center gap-3 text-sm">
          <strong>{money(pricingTotal(lines))}</strong>
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </span>
      </button>
      {open ? (
        <div className="border-t border-border p-4">
          <div className="hidden grid-cols-[minmax(180px,2fr)_70px_repeat(3,minmax(105px,1fr))_100px_42px] gap-2 pb-2 text-xs font-semibold uppercase text-muted-foreground lg:grid">
            <span>Item</span>
            <span>Qty</span>
            <span>Production</span>
            <span>Charge</span>
            <span>Discount</span>
            <span>Taxable</span>
            <span />
          </div>
          <div className="space-y-3">
            {lines.map((line) => (
              <div
                key={line.id}
                className="grid gap-2 border-t border-border pt-3 first:border-0 first:pt-0 lg:grid-cols-[minmax(180px,2fr)_70px_repeat(3,minmax(105px,1fr))_100px_42px]"
              >
                <Input
                  aria-label={`${title} item`}
                  value={line.item}
                  onChange={(event) => update(line.id, { item: event.target.value })}
                />
                <Input
                  aria-label="Quantity"
                  type="number"
                  min="0"
                  value={line.quantity}
                  onChange={(event) =>
                    update(line.id, { quantity: numberValue(event.target.value) })
                  }
                />
                <Input
                  aria-label="Production price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={line.productionPrice}
                  onChange={(event) =>
                    update(line.id, { productionPrice: numberValue(event.target.value) })
                  }
                />
                <Input
                  aria-label="Charge price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={line.chargePrice}
                  onChange={(event) =>
                    update(line.id, { chargePrice: numberValue(event.target.value) })
                  }
                />
                <div className="flex gap-1">
                  <Select
                    value={line.discountType}
                    onValueChange={(value: PricingLine["discountType"]) =>
                      update(line.id, { discountType: value })
                    }
                  >
                    <SelectTrigger aria-label="Discount type" className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="fixed">$</SelectItem>
                      <SelectItem value="percent">%</SelectItem>
                    </SelectContent>
                  </Select>
                  {line.discountType !== "none" ? (
                    <Input
                      aria-label="Discount amount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={line.discountAmount}
                      onChange={(event) =>
                        update(line.id, { discountAmount: numberValue(event.target.value) })
                      }
                    />
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    aria-label="Taxable"
                    checked={line.taxable}
                    onCheckedChange={(checked) => update(line.id, { taxable: checked })}
                  />
                  <span className="text-xs text-muted-foreground">
                    {line.taxable ? "On" : "Off"}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Remove item"
                  onClick={() => onChange(lines.filter((item) => item.id !== line.id))}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <div className="text-sm text-muted-foreground lg:col-span-7">
                  Line total:{" "}
                  <span className="font-semibold text-foreground">{money(lineSubtotal(line))}</span>
                </div>
              </div>
            ))}
          </div>
          <Button type="button" variant="outline" size="sm" className="mt-4" onClick={add}>
            <Plus className="h-4 w-4" /> Add item
          </Button>
        </div>
      ) : null}
    </section>
  );
}

export function AccountWorkspace({ sessionId, initialAccount }: Props) {
  const saveRemote = useServerFn(saveWorkspace);
  const [account, setAccount] = useState(initialAccount);
  const [savedSnapshot, setSavedSnapshot] = useState(JSON.stringify(initialAccount.subscription));
  const [activeTab, setActiveTab] = useState("Overview");
  const [saving, setSaving] = useState(false);
  const [agreementOpen, setAgreementOpen] = useState(false);
  const [agreementPreview, setAgreementPreview] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [editingAppt, setEditingAppt] = useState<{
    id: string;
    date: string;
    technician: string;
  } | null>(null);
  const dirty = JSON.stringify(account.subscription) !== savedSnapshot;
  const errors = useMemo(() => validateSubscription(account.subscription), [account.subscription]);

  const updateSubscription = (patch: Partial<SubscriptionRecord>) =>
    setAccount((current) => ({ ...current, subscription: { ...current.subscription, ...patch } }));
  const persist = async (
    next: SimulatedAccount,
    event: {
      type: "subscription_saved" | "agreement_generated" | "agreement_sent" | "appointment_updated";
      target: string;
      summary: string;
    },
  ) => {
    setSaving(true);
    try {
      const result = await saveRemote({ data: { sessionId, account: next, event } });
      setAccount(result.account);
      setSavedSnapshot(JSON.stringify(result.account.subscription));
      return result.account;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The account could not be saved.");
      return null;
    } finally {
      setSaving(false);
    }
  };

  const saveSubscription = async () => {
    if (errors.length) {
      toast.error(errors[0]);
      return;
    }
    const saved = await persist(account, {
      type: "subscription_saved",
      target: account.subscription.id,
      summary: `Saved ${money(pricingTotal(account.subscription.initialLines))} initial and ${money(pricingTotal(account.subscription.recurringLines))} recurring pricing.`,
    });
    if (saved) toast.success("Subscription saved. Agreement terms are now available.");
  };

  const generateAgreement = async () => {
    if (dirty) {
      toast.error("Save the Subscription tab before generating an agreement.");
      return;
    }
    const terms = agreementFrom(account);
    const document = {
      id: crypto.randomUUID(),
      title: `${terms.serviceType} Agreement`,
      createdAt: new Date().toISOString().slice(0, 10),
      status: "draft" as const,
      subscriptionId: account.subscription.id,
      terms,
    };
    const next = { ...account, documents: [document, ...account.documents] };
    const saved = await persist(next, {
      type: "agreement_generated",
      target: document.id,
      summary: `Generated a ${terms.agreementMonths}-month agreement from saved subscription terms.`,
    });
    if (saved) {
      setAgreementOpen(false);
      setAgreementPreview(true);
      toast.success("Practice agreement generated.");
    }
  };

  const saveAppointment = async () => {
    if (!editingAppt) return;
    if (dirty) {
      toast.error("Save the Subscription tab before editing appointments.");
      return;
    }
    const next = {
      ...account,
      appointments: account.appointments.map((a) =>
        a.id === editingAppt.id
          ? { ...a, date: editingAppt.date, technician: editingAppt.technician }
          : a,
      ),
    };
    const saved = await persist(next, {
      type: "appointment_updated",
      target: editingAppt.id,
      summary: `Rescheduled appointment to ${editingAppt.date} with ${editingAppt.technician}.`,
    });
    if (saved) {
      setEditingAppt(null);
      toast.success("Appointment updated.");
    }
  };

  const sendAgreement = async () => {
    const document = account.documents.find((item) => item.status === "draft");
    if (!document) return;
    const next = {
      ...account,
      documents: account.documents.map((item) =>
        item.id === document.id ? { ...item, status: "sent_simulation" as const } : item,
      ),
    };
    const saved = await persist(next, {
      type: "agreement_sent",
      target: document.id,
      summary: "Simulated sending the generated agreement to the customer.",
    });
    if (saved) {
      setAgreementPreview(false);
      toast.success("Agreement sent in simulation only. Nothing was delivered.");
    }
  };

  return (
    <div className="flex min-h-0 flex-1 justify-center bg-muted p-0 sm:p-3">
      <div className="flex min-h-0 w-full max-w-[1000px] flex-1 flex-col overflow-hidden rounded-[2px] bg-card text-[13px] shadow-md">
        <div className="flex h-6 shrink-0 items-center justify-between bg-fr-title px-2 text-[12px] font-semibold text-fr-title-foreground">
          <span className="truncate">
            Customer #{account.customerNumber} — {account.customerName}
          </span>
          <button
            type="button"
            aria-label="Close customer card"
            className="px-1 leading-none"
            onClick={() => toast("The customer card stays open during the call.")}
          >
            ×
          </button>
        </div>
        <header className="shrink-0 border-b border-border bg-card">
          <div className="flex flex-wrap items-stretch justify-between">
            <div className="flex min-w-0 flex-1 items-center gap-4 px-4 py-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-primary text-sm font-bold text-primary-foreground">
                {account.customerName
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <h2 className="font-sans text-lg font-semibold leading-none">
                    {account.customerName}
                  </h2>
                  <button type="button" className="text-xs font-semibold text-ring hover:underline">
                    #{account.customerNumber}
                  </button>
                  <Badge
                    variant={account.status === "active" ? "default" : "secondary"}
                    className="h-5 rounded-sm capitalize"
                  >
                    {account.status.replaceAll("_", " ")}
                  </Badge>
                </div>
                <p className="mt-1.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  {account.serviceAddress}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 divide-x divide-border border-l border-border bg-muted/30">
              <div className="min-w-28 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase text-muted-foreground">Phone</p>
                <p className="mt-1 font-medium text-ring">{account.phone}</p>
              </div>
              <div className="min-w-28 px-4 py-3 text-right">
                <p className="text-[10px] font-semibold uppercase text-muted-foreground">Balance</p>
                <p className="mt-1 font-semibold">{money(account.balance)}</p>
              </div>
            </div>
          </div>
        </header>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="overflow-x-auto border-b border-border bg-secondary">
            <TabsList className="h-10 w-max rounded-none bg-transparent p-0">
              {TAB_LABELS.map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className="h-9 rounded-none border-x border-transparent px-2.5 text-[12px] font-semibold data-[state=active]:border-border data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-none"
                >
                  {tab}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
            <TabsContent value="Overview" className="mt-0">
              <div className="grid gap-3 lg:grid-cols-[1fr_260px]">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                    {[
                      ["Customer Since", account.customerSince],
                      ["Last Completed", account.lastCompleted],
                      ["Next Service", account.nextService],
                      ["Balance", money(account.balance)],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="overflow-hidden rounded border border-border bg-card"
                      >
                        <div className="h-1 bg-fr-link" />
                        <div className="px-2 py-1.5">
                          <p className="text-[11px] uppercase text-muted-foreground">{label}</p>
                          <p className="text-[13px] text-fr-ink">{value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <FrSection title="Account Information">
                    <FrRows
                      rows={[
                        ["Customer", account.customerName],
                        [
                          "Customer #",
                          <span key="n" className="text-fr-link">
                            {account.customerNumber}
                          </span>,
                        ],
                        [
                          "Phone",
                          <span key="p" className="text-fr-link">
                            {account.phone}
                          </span>,
                        ],
                        [
                          "Email",
                          <span key="e" className="text-fr-link">
                            {account.email}
                          </span>,
                        ],
                        [
                          "Status",
                          <span key="s" className="capitalize">
                            {account.status.replaceAll("_", " ")}
                          </span>,
                        ],
                      ]}
                    />
                  </FrSection>
                  <FrSection title="Billing Information">
                    <FrRows
                      rows={[
                        ["Billing address", account.serviceAddress],
                        ["Autopay", "Credit card on file"],
                        ["Balance", money(account.balance)],
                      ]}
                    />
                  </FrSection>
                  <FrSection title="Property Information">
                    <FrRows
                      rows={[
                        ["Service address", account.serviceAddress],
                        ["Region", account.subscription.routingRegion],
                        ["Last service note", account.recentServiceNote],
                      ]}
                    />
                  </FrSection>
                </div>
                <aside className="space-y-3">
                  <FrSection title="Account Summary">
                    <FrRows
                      rows={[
                        ["Program", account.subscription.program],
                        ["Initial", money(pricingTotal(account.subscription.initialLines))],
                        ["Recurring", money(pricingTotal(account.subscription.recurringLines))],
                        ["Contract value", money(contractValue(account.subscription))],
                        [
                          "Agreement",
                          <span key="a" className="capitalize">
                            {account.subscription.agreementState.replaceAll("_", " ")}
                          </span>,
                        ],
                        ["Completed", account.completedServices],
                      ]}
                    />
                  </FrSection>
                  <FrSection title="Actions">
                    <div className="grid grid-cols-3 gap-1">
                      {["Email", "SMS", "Add Task"].map((label) => (
                        <Button
                          key={label}
                          size="sm"
                          variant="outline"
                          className="h-7 rounded-[2px] text-[11px]"
                          onClick={() => toast.success(`${label} simulated. Nothing was sent.`)}
                        >
                          {label}
                        </Button>
                      ))}
                    </div>
                  </FrSection>
                  <FrSection title="Access History">
                    {account.events.length ? (
                      <ul className="space-y-1 text-[11px] text-fr-ink">
                        {account.events
                          .slice(-5)
                          .reverse()
                          .map((e) => (
                            <li key={e.id}>
                              {new Date(e.at).toLocaleTimeString()} — {e.summary}
                            </li>
                          ))}
                      </ul>
                    ) : (
                      <p className="text-[11px] text-muted-foreground">Opened this call.</p>
                    )}
                  </FrSection>
                </aside>
              </div>
            </TabsContent>

            <TabsContent value="Info" className="mt-0">
              <div className="grid gap-5 md:grid-cols-2">
                <section>
                  <h3 className="font-semibold">Contact</h3>
                  <dl className="mt-3 space-y-3 text-sm">
                    <div>
                      <dt className="text-muted-foreground">Phone</dt>
                      <dd>{account.phone}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Email</dt>
                      <dd>{account.email}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Service address</dt>
                      <dd>{account.serviceAddress}</dd>
                    </div>
                  </dl>
                </section>
                <section>
                  <h3 className="font-semibold">Communication</h3>
                  <p className="mt-3 text-sm">Text before arrival · 30-minute call ahead</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Use these details to verify the caller before making account changes.
                  </p>
                </section>
              </div>
            </TabsContent>

            <TabsContent value="Subscription" className="mt-0 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{account.subscription.program}</h3>
                  <p className="text-sm text-muted-foreground">
                    {account.subscription.id} · account-wide pricing and service terms
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {dirty ? (
                    <Badge variant="secondary">Unsaved changes</Badge>
                  ) : (
                    <Badge variant="outline">
                      <Check className="mr-1 h-3 w-3" />
                      Saved
                    </Badge>
                  )}
                  <Button
                    size="sm"
                    onClick={() => void saveSubscription()}
                    disabled={saving || !dirty}
                  >
                    <Save className="h-4 w-4" /> Save subscription
                  </Button>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <Label htmlFor="program">Service type</Label>
                  <Input
                    id="program"
                    className="mt-1"
                    value={account.subscription.program}
                    onChange={(event) => updateSubscription({ program: event.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="effective">Effective date</Label>
                  <Input
                    id="effective"
                    className="mt-1"
                    type="date"
                    value={account.subscription.effectiveDate}
                    onChange={(event) => updateSubscription({ effectiveDate: event.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="length">Agreement length</Label>
                  <Input
                    id="length"
                    className="mt-1"
                    type="number"
                    min="1"
                    value={account.subscription.agreementMonths}
                    onChange={(event) =>
                      updateSubscription({ agreementMonths: numberValue(event.target.value) })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="services">Recurring services</Label>
                  <Input
                    id="services"
                    className="mt-1"
                    type="number"
                    min="1"
                    value={account.subscription.committedServices}
                    onChange={(event) =>
                      updateSubscription({ committedServices: numberValue(event.target.value) })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="frequency">Frequency in weeks</Label>
                  <Input
                    id="frequency"
                    className="mt-1"
                    type="number"
                    min="1"
                    value={account.subscription.frequencyWeeks}
                    onChange={(event) =>
                      updateSubscription({ frequencyWeeks: numberValue(event.target.value) })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="increase">Yearly increase %</Label>
                  <Input
                    id="increase"
                    className="mt-1"
                    type="number"
                    min="0"
                    step="0.1"
                    value={account.subscription.yearlyIncreasePercent}
                    onChange={(event) =>
                      updateSubscription({ yearlyIncreasePercent: numberValue(event.target.value) })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="region">Routing region</Label>
                  <Input
                    id="region"
                    className="mt-1"
                    value={account.subscription.routingRegion}
                    onChange={(event) => updateSubscription({ routingRegion: event.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="call-ahead">Call ahead</Label>
                  <Input
                    id="call-ahead"
                    className="mt-1"
                    value={account.subscription.callAhead}
                    onChange={(event) => updateSubscription({ callAhead: event.target.value })}
                  />
                </div>
              </div>
              <PricingEditor
                title="Initial items and charges"
                lines={account.subscription.initialLines}
                onChange={(initialLines) => updateSubscription({ initialLines })}
              />
              <PricingEditor
                title="Recurring items and charges"
                lines={account.subscription.recurringLines}
                onChange={(recurringLines) => updateSubscription({ recurringLines })}
              />
              <div className="grid gap-px border border-border bg-border sm:grid-cols-3">
                <div className="bg-card p-4">
                  <p className="text-xs uppercase text-muted-foreground">Initial total</p>
                  <p className="mt-1 text-xl font-semibold">
                    {money(pricingTotal(account.subscription.initialLines))}
                  </p>
                </div>
                <div className="bg-card p-4">
                  <p className="text-xs uppercase text-muted-foreground">Recurring charge</p>
                  <p className="mt-1 text-xl font-semibold">
                    {money(pricingTotal(account.subscription.recurringLines))}
                  </p>
                </div>
                <div className="bg-card p-4">
                  <p className="text-xs uppercase text-muted-foreground">Agreement value</p>
                  <p className="mt-1 text-xl font-semibold">
                    {money(contractValue(account.subscription))}
                  </p>
                </div>
              </div>
              {errors.length ? (
                <p className="text-sm text-destructive">{errors.join(" ")}</p>
              ) : null}
            </TabsContent>

            <TabsContent value="Notes" className="mt-0 space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline">
                  All
                </Button>
                <Button size="sm" variant="ghost">
                  General
                </Button>
                <Button size="sm" variant="ghost">
                  Scheduling
                </Button>
                <Button size="sm" variant="ghost">
                  Retention
                </Button>
              </div>
              <div className="space-y-3">
                {account.notes.map((note) => (
                  <article key={note.id} className="border-l-2 border-border pl-4">
                    <div className="flex justify-between gap-3 text-xs text-muted-foreground">
                      <span>{note.category}</span>
                      <span>{note.createdAt}</span>
                    </div>
                    <p className="mt-1 text-sm">{note.body}</p>
                  </article>
                ))}
              </div>
              <div className="border-t border-border pt-4">
                <Label htmlFor="note">Add practice note</Label>
                <Textarea
                  id="note"
                  className="mt-2"
                  value={newNote}
                  onChange={(event) => setNewNote(event.target.value)}
                />
                <Button
                  className="mt-2"
                  size="sm"
                  disabled={!newNote.trim()}
                  onClick={() => {
                    setAccount((current) => ({
                      ...current,
                      notes: [
                        {
                          id: crypto.randomUUID(),
                          category: "Practice note",
                          createdAt: new Date().toISOString().slice(0, 10),
                          body: newNote.trim(),
                        },
                        ...current.notes,
                      ],
                    }));
                    setNewNote("");
                    toast.success("Practice note added locally.");
                  }}
                >
                  Add note
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="Documents" className="mt-0 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold">Customer documents</h3>
                  <p className="text-sm text-muted-foreground">
                    Agreements are generated from the saved Subscription tab.
                  </p>
                </div>
                <Button onClick={() => setAgreementOpen(true)}>
                  <Plus className="h-4 w-4" /> New agreement
                </Button>
              </div>
              {dirty ? (
                <div className="border-l-2 border-warning bg-warning/10 px-4 py-3 text-sm">
                  Subscription changes are unsaved. Save them before creating an agreement.
                </div>
              ) : null}
              <div className="divide-y divide-border border-y border-border">
                {account.documents.map((document) => (
                  <button
                    type="button"
                    key={document.id}
                    className="flex w-full items-center gap-3 py-3 text-left"
                    onClick={() => {
                      if (document.terms) setAgreementPreview(true);
                    }}
                  >
                    <FileText className="h-5 w-5 text-primary" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{document.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {document.createdAt} · {document.status.replaceAll("_", " ")}
                      </span>
                    </span>
                    <Badge variant="outline">{document.subscriptionId}</Badge>
                  </button>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="Appointments" className="mt-0">
              <FrTable
                head={["Date", "Status", "Service", "Technician", "Details", ""]}
                rows={account.appointments.map((item) => [
                  item.date,
                  <span key="s" className="capitalize">
                    {item.status}
                  </span>,
                  item.service,
                  item.technician,
                  <span key="d" className="text-muted-foreground">
                    {item.details}
                  </span>,
                  item.status === "scheduled" ? (
                    <button
                      key="e"
                      type="button"
                      className="font-semibold text-fr-link hover:underline"
                      onClick={() =>
                        setEditingAppt({
                          id: item.id,
                          date: item.date,
                          technician: item.technician,
                        })
                      }
                    >
                      Edit
                    </button>
                  ) : (
                    ""
                  ),
                ])}
              />
            </TabsContent>

            <TabsContent value="Leads" className="mt-0">
              <FrTable
                head={["Created", "Lead", "Source", "Status", "Assigned"]}
                rows={[
                  [account.customerSince, "Protection Program", "Door to door", "Won", "Sales rep"],
                  ["—", "Perimeter Plus Mosquito", "Referral", "Open", "Unassigned"],
                ]}
              />
            </TabsContent>

            <TabsContent value="Billing" className="mt-0 grid gap-3 md:grid-cols-2">
              <FrSection title="Billing Information">
                <FrRows
                  rows={[
                    ["Billing name", account.customerName],
                    ["Billing address", account.serviceAddress],
                    ["Billing email", account.email],
                    ["Autopay", "Credit card on file"],
                  ]}
                />
              </FrSection>
              <FrSection title="Payment Method">
                <FrRows
                  rows={[
                    ["Card", "Visa •••• 4821"],
                    ["Expires", "08/28"],
                    ["Balance", money(account.balance)],
                    ["Terms", "Due upon service"],
                  ]}
                />
              </FrSection>
            </TabsContent>

            <TabsContent value="Properties" className="mt-0">
              <FrTable
                head={["Property", "Type", "Sq ft", "Lot", "Notes"]}
                rows={[
                  [account.serviceAddress, "Single family", "2,140", "0.21 ac", "Side gate sticks"],
                ]}
              />
            </TabsContent>

            <TabsContent value="Conditions" className="mt-0">
              <FrTable
                head={["Date", "Condition", "Location", "Severity", "Reported by"]}
                rows={[
                  [account.lastCompleted, "Spider webbing", "Eaves", "Moderate", "Tawny Butler"],
                  [
                    account.lastCompleted,
                    "Conducive moisture",
                    "Downspouts",
                    "Low",
                    "Tawny Butler",
                  ],
                ]}
              />
            </TabsContent>

            <TabsContent value="Equipment" className="mt-0">
              <FrTable
                head={["Device", "Location", "Installed", "Last checked", "Status"]}
                rows={[
                  [
                    "Bait station #1",
                    "Garage exterior",
                    account.customerSince,
                    account.lastCompleted,
                    "Active",
                  ],
                  [
                    "Bait station #2",
                    "Back fence",
                    account.customerSince,
                    account.lastCompleted,
                    "Active",
                  ],
                ]}
              />
            </TabsContent>

            <TabsContent value="Invoices" className="mt-0">
              <div className="mb-5 flex items-end justify-between border-b border-border pb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Current balance</p>
                  <p className="text-2xl font-semibold">{money(account.balance)}</p>
                </div>
                <Badge variant="outline">Account current</Badge>
              </div>
              <div className="divide-y divide-border">
                {account.invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="grid grid-cols-[110px_1fr_auto_auto] items-center gap-3 py-3 text-sm"
                  >
                    <span>{invoice.date}</span>
                    <span>{invoice.service}</span>
                    <strong>{money(invoice.amount)}</strong>
                    <Badge variant="outline">{invoice.status}</Badge>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="Admin" className="mt-0">
              <h3 className="font-semibold">Account access history</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Practice-only record activity for this call.
              </p>
              <div className="mt-4 divide-y divide-border">
                {account.events.length ? (
                  account.events
                    .slice()
                    .reverse()
                    .map((event) => (
                      <div key={event.id} className="flex gap-3 py-3">
                        <History className="mt-0.5 h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{event.summary}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(event.at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))
                ) : (
                  <p className="py-6 text-sm text-muted-foreground">No account changes yet.</p>
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>
        <div className="flex h-10 shrink-0 items-center justify-end gap-2 border-t border-border bg-fr-pane px-4">
          <Button
            size="sm"
            className="h-7 rounded-[2px] text-[12px]"
            disabled={saving}
            onClick={() =>
              activeTab === "Subscription"
                ? void saveSubscription()
                : toast("Practice only — nothing to save on this tab.")
            }
          >
            Save
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 rounded-[2px] text-[12px]"
            onClick={() => toast("The customer card stays open during the call.")}
          >
            Close
          </Button>
        </div>

        <Dialog open={agreementOpen} onOpenChange={setAgreementOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New agreement</DialogTitle>
              <DialogDescription>
                Select the saved subscription that should populate this practice agreement.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <button
                type="button"
                className="flex w-full items-center gap-3 border border-primary bg-primary/10 p-3 text-left"
              >
                <Check className="h-4 w-4 text-primary" />
                <span className="flex-1">
                  <strong className="block">{account.subscription.program}</strong>
                  <span className="text-xs text-muted-foreground">
                    {account.subscription.id} ·{" "}
                    {money(pricingTotal(account.subscription.recurringLines))} recurring
                  </span>
                </span>
              </button>
              {account.previousSubscriptions.map((subscription) => (
                <div
                  key={subscription.id}
                  className="flex items-center gap-3 border border-border p-3 opacity-60"
                >
                  <History className="h-4 w-4" />
                  <span className="flex-1 text-sm">
                    {subscription.program} · ended {subscription.endedAt}
                  </span>
                  <Badge variant="outline">Prior</Badge>
                </div>
              ))}
            </div>
            {dirty ? (
              <p className="text-sm text-destructive">
                Save the Subscription tab before continuing.
              </p>
            ) : null}
            <DialogFooter>
              <Button variant="outline" onClick={() => setAgreementOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => void generateAgreement()}
                disabled={dirty || saving || Boolean(errors.length)}
              >
                <FileText className="h-4 w-4" /> Generate agreement
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={agreementPreview} onOpenChange={setAgreementPreview}>
          <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Residential Service Agreement</DialogTitle>
              <DialogDescription>
                Practice document generated from the saved subscription.
              </DialogDescription>
            </DialogHeader>
            {(() => {
              const terms = account.documents.find((item) => item.terms)?.terms;
              if (!terms)
                return (
                  <p className="text-sm text-muted-foreground">
                    No generated agreement is available.
                  </p>
                );
              return (
                <div className="space-y-5 border border-border bg-card p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xl font-semibold">Saela</p>
                      <p className="text-sm text-muted-foreground">Residential Service Agreement</p>
                    </div>
                    <Badge variant="outline">Practice only</Badge>
                  </div>
                  <dl className="grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-muted-foreground">Customer</dt>
                      <dd>{account.customerName}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Effective date</dt>
                      <dd>{terms.effectiveDate}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Service</dt>
                      <dd>{terms.serviceType}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Term</dt>
                      <dd>{terms.agreementMonths} months</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Initial charge</dt>
                      <dd>{money(terms.initialTotal)}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Recurring charge</dt>
                      <dd>
                        {money(terms.recurringTotal)} every {terms.frequencyWeeks} weeks
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Committed services</dt>
                      <dd>{terms.committedServices}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Agreement value</dt>
                      <dd>{money(terms.contractValue)}</dd>
                    </div>
                  </dl>
                  <div>
                    <p className="text-sm font-medium">Service address</p>
                    <p className="text-sm text-muted-foreground">{terms.serviceAddress}</p>
                  </div>
                  <p className="border-t border-border pt-4 text-xs text-muted-foreground">
                    This document is a training simulation. It is not a binding agreement and is not
                    sent to a customer.
                  </p>
                </div>
              );
            })()}
            <DialogFooter>
              <Button variant="outline" onClick={() => setAgreementPreview(false)}>
                Close
              </Button>
              <Button
                onClick={() => void sendAgreement()}
                disabled={saving || !account.documents.some((item) => item.status === "draft")}
              >
                <Send className="h-4 w-4" /> Simulate send
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={Boolean(editingAppt)} onOpenChange={(open) => !open && setEditingAppt(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit appointment</DialogTitle>
              <DialogDescription>Practice only — change the technician or date.</DialogDescription>
            </DialogHeader>
            {editingAppt ? (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="appt-date">Date</Label>
                  <Input
                    id="appt-date"
                    type="date"
                    className="mt-1"
                    value={editingAppt.date}
                    onChange={(e) => setEditingAppt({ ...editingAppt, date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="appt-tech">Technician</Label>
                  <Select
                    value={editingAppt.technician}
                    onValueChange={(technician) => setEditingAppt({ ...editingAppt, technician })}
                  >
                    <SelectTrigger id="appt-tech" className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from(new Set([editingAppt.technician, ...TECHNICIANS])).map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : null}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingAppt(null)}>
                Cancel
              </Button>
              <Button
                onClick={() => void saveAppointment()}
                disabled={saving || !editingAppt?.date}
              >
                <Save className="h-4 w-4" /> Save appointment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function FrSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-[2px] border border-border">
      <h3 className="bg-fr-pane px-2 py-1 text-[12px] font-semibold text-fr-ink">{title}</h3>
      <div className="p-2">{children}</div>
    </section>
  );
}

function FrRows({ rows }: { rows: Array<[string, ReactNode]> }) {
  return (
    <dl className="grid grid-cols-[120px_1fr] gap-x-3 gap-y-1 text-[12px]">
      {rows.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-muted-foreground">{k}</dt>
          <dd className="text-fr-ink">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function FrTable({ head, rows }: { head: string[]; rows: Array<Array<ReactNode>> }) {
  return (
    <div className="overflow-x-auto rounded-[2px] border border-border">
      <table className="w-full text-[12px]">
        <thead className="bg-fr-pane text-left text-fr-ink">
          <tr>
            {head.map((h) => (
              <th key={h} className="px-2 py-1 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j} className="px-2 py-1 text-fr-ink">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
