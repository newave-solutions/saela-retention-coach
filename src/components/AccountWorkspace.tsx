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
      <Button
        type="button"
        variant="ghost"
        className="fr-pricing-heading flex w-full items-center justify-between text-left"
        onClick={() => setOpen(!open)}
      >
        <span className="font-semibold">{title}</span>
        <span className="flex items-center gap-3 text-sm">
          <strong>{money(pricingTotal(lines))}</strong>
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </span>
      </Button>
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
  const [subscriptionUi, setSubscriptionUi] = useState({
    salesRep: "V-Ikaika Morningstar_3467",
    salesRep2: "",
    salesRep3: "",
    acquisition: "Door to Door",
    subSource: "",
    soldAt: "07/26/2025 9:21 pm",
    expirationDate: "",
    poNumber: "",
    notes: "",
    duration: "Standard Duration",
    seasonal: "Year-Round Service",
    initialFollowup: "28 Days",
    customDate: "",
    routingRegion: "No Region Assigned",
    preferredTech: "Jarrett Barclay",
    billingAccount: initialAccount.customerName,
    autopayProfile: "Primary card •••• 4821",
  });
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
    <div className="fr-desktop flex min-h-0 flex-1 justify-center p-0 sm:p-3">
      <div className="fr-workspace flex min-h-0 w-full max-w-[1000px] flex-1 flex-col overflow-hidden rounded-[2px] border border-border bg-card">
        <div className="fr-titlebar flex h-7 shrink-0 items-center justify-between bg-fr-title px-2 text-fr-title-foreground">
          <span className="truncate">
            <span className="mr-2 text-[12px] italic">[{account.customerNumber}]</span>
            <strong>{account.customerName}</strong>
            <span className="ml-1 text-[12px] italic">
              1 {account.status === "active" ? "Active" : "Inactive"} Subscription
            </span>
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Close customer card"
            className="fr-title-close h-5 w-5 leading-none"
            onClick={() => toast("The customer card stays open during the call.")}
          >
            ×
          </Button>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="overflow-x-auto border-b border-border bg-secondary">
            <TabsList className="fr-tabs h-7 w-max rounded-none bg-transparent p-0">
              {TAB_LABELS.map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className="h-7 rounded-none border-x border-transparent px-2 text-[11px] font-normal data-[state=active]:text-fr-link data-[state=active]:shadow-none"
                >
                  {tab}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          <div className="fr-tab-body min-h-0 flex-1 overflow-y-auto p-2 sm:p-3">
            <TabsContent value="Overview" className="mt-0">
              <div className="mb-4 flex flex-wrap items-baseline">
                <h2 className="mr-6 text-xl font-normal text-fr-link">Account Overview</h2>
                <span className="text-xs italic text-muted-foreground">
                  {account.serviceAddress}
                </span>
              </div>
              <div className="fr-overview grid md:grid-cols-[minmax(0,1fr)_230px]">
                <div className="space-y-3">
                  <div className="fr-overview-metrics grid grid-cols-2 sm:grid-cols-3">
                    {[
                      ["Customer Since", account.customerSince],
                      ["Completed Services", `${account.completedServices} Subscription Services`],
                      [
                        "Contract Remaining",
                        account.subscription.agreementState.replaceAll("_", " "),
                      ],
                      ["Last Completed", account.lastCompleted],
                      ["Next Service", account.nextService],
                      ["Recent Service", account.recentServiceNote],
                      ["Account Balance", money(account.balance)],
                      ["Initial Charge", money(pricingTotal(account.subscription.initialLines))],
                      [
                        "Recurring Charge",
                        money(pricingTotal(account.subscription.recurringLines)),
                      ],
                    ].map(([label, value]) => (
                      <div key={label} className="fr-metric">
                        <p className="text-[11px] text-muted-foreground">{label}</p>
                        <p className="fr-metric-value text-fr-link">{value}</p>
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
              <div className="fr-info-grid grid md:grid-cols-2">
                <FrSection title="Account Information">
                  <FrRows
                    rows={[
                      ["Customer", account.customerName],
                      ["Customer #", account.customerNumber],
                      ["Phone", account.phone],
                      ["Email", account.email],
                      ["Service address", account.serviceAddress],
                      ["Status", account.status.replaceAll("_", " ")],
                    ]}
                  />
                </FrSection>
                <FrSection title="Communication Preferences">
                  <FrRows
                    rows={[
                      ["Arrival notice", "Text before arrival"],
                      ["Call ahead", account.subscription.callAhead],
                      ["Routing region", account.subscription.routingRegion],
                    ]}
                  />
                </FrSection>
              </div>
            </TabsContent>

            <TabsContent value="Subscription" className="fr-subscription mt-0">
              <div className="fr-subscription-head flex flex-wrap items-center justify-between border-b border-border bg-card px-2 py-2">
                <div>
                  <h3 className="text-[15.84px] font-normal text-fr-link">
                    {account.subscription.program}
                  </h3>
                  <p className="text-[12px] text-muted-foreground">
                    {account.subscription.id} · {money(contractValue(account.subscription))}{" "}
                    Contract Value (Including Initial Service)
                  </p>
                </div>
                <div className="flex items-center">
                  {dirty ? (
                    <Badge variant="secondary" className="mr-2">
                      Unsaved changes
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="mr-2">
                      <Check className="mr-1 h-3 w-3" />
                      Saved
                    </Badge>
                  )}
                </div>
              </div>
              <div className="fr-subscription-columns grid lg:grid-cols-3">
                <FrSubscriptionSection title="Sales Information">
                  <FrSelectField
                    label="Sales Rep"
                    value={subscriptionUi.salesRep}
                    options={["V-Ikaika Morningstar_3467", "Unassigned"]}
                    onChange={(salesRep) => setSubscriptionUi((v) => ({ ...v, salesRep }))}
                  />
                  <FrSelectField
                    label="Sales Rep 2"
                    value={subscriptionUi.salesRep2}
                    placeholder="Select Sales Rep"
                    options={["Unassigned", "Maya Robinson"]}
                    onChange={(salesRep2) => setSubscriptionUi((v) => ({ ...v, salesRep2 }))}
                  />
                  <FrSelectField
                    label="Sales Rep 3"
                    value={subscriptionUi.salesRep3}
                    placeholder="Select Sales Rep"
                    options={["Unassigned", "Jordan Lee"]}
                    onChange={(salesRep3) => setSubscriptionUi((v) => ({ ...v, salesRep3 }))}
                  />
                  <FrSelectField
                    label="Acquisition"
                    value={subscriptionUi.acquisition}
                    options={["Door to Door", "Inbound", "Referral"]}
                    onChange={(acquisition) => setSubscriptionUi((v) => ({ ...v, acquisition }))}
                  />
                  <FrSelectField
                    label="Sub-Source"
                    value={subscriptionUi.subSource}
                    placeholder="Select Sub-Source"
                    options={["Existing Customer", "Web Lead"]}
                    onChange={(subSource) => setSubscriptionUi((v) => ({ ...v, subSource }))}
                  />
                  <FrInputField
                    label="Sold Date and Time"
                    value={subscriptionUi.soldAt}
                    onChange={(soldAt) => setSubscriptionUi((v) => ({ ...v, soldAt }))}
                  />
                  <FrSelectField
                    label="Contract Length"
                    value={`${account.subscription.agreementMonths} months`}
                    options={["12 months", "18 months", "24 months"]}
                    onChange={(value) =>
                      updateSubscription({ agreementMonths: numberValue(value) })
                    }
                  />
                  <FrInputField
                    label="Expiration Date"
                    type="date"
                    value={subscriptionUi.expirationDate}
                    onChange={(expirationDate) =>
                      setSubscriptionUi((v) => ({ ...v, expirationDate }))
                    }
                  />
                  <FrInputField
                    label="PO No."
                    value={subscriptionUi.poNumber}
                    onChange={(poNumber) => setSubscriptionUi((v) => ({ ...v, poNumber }))}
                  />
                  <Label htmlFor="subscription-notes" className="fr-sub-label">
                    Subscription Notes
                  </Label>
                  <Textarea
                    id="subscription-notes"
                    className="fr-sub-notes"
                    placeholder="Enter Subscription Specific Notes here..."
                    value={subscriptionUi.notes}
                    onChange={(event) =>
                      setSubscriptionUi((v) => ({ ...v, notes: event.target.value }))
                    }
                  />
                </FrSubscriptionSection>

                <FrSubscriptionSection title="Recurring Services">
                  <FrSelectField
                    label="Service Type"
                    value={account.subscription.program}
                    options={["Protection Program", "Perimeter Plus Mosquito", "Rodent Yard Guard"]}
                    onChange={(program) => updateSubscription({ program })}
                  />
                  <FrSelectField
                    label="Frequency"
                    value={`Every ${account.subscription.frequencyWeeks} Weeks`}
                    options={["Every 8 Weeks", "Every 10 Weeks", "Every 12 Weeks"]}
                    onChange={(value) => updateSubscription({ frequencyWeeks: numberValue(value) })}
                  />
                  <FrSelectField
                    label="Duration"
                    value={subscriptionUi.duration}
                    options={["Standard Duration", "Extended Duration"]}
                    onChange={(duration) => setSubscriptionUi((v) => ({ ...v, duration }))}
                  />
                  <FrSelectField
                    label="Call Ahead"
                    value={account.subscription.callAhead}
                    options={["No call ahead", "15 minutes", "30 minutes", "60 minutes"]}
                    onChange={(callAhead) => updateSubscription({ callAhead })}
                  />
                  <FrSelectField
                    label="Seasonal"
                    value={subscriptionUi.seasonal}
                    options={["Year-Round Service", "Seasonal Service"]}
                    onChange={(seasonal) => setSubscriptionUi((v) => ({ ...v, seasonal }))}
                  />
                  <FrInputField
                    label="Effective Date"
                    type="date"
                    value={account.subscription.effectiveDate}
                    onChange={(effectiveDate) => updateSubscription({ effectiveDate })}
                  />
                  <FrInputField
                    label="Yearly Increase %"
                    type="number"
                    value={String(account.subscription.yearlyIncreasePercent)}
                    onChange={(value) =>
                      updateSubscription({ yearlyIncreasePercent: numberValue(value) })
                    }
                  />
                  <FrInputField
                    label="Recurring Services"
                    type="number"
                    value={String(account.subscription.committedServices)}
                    onChange={(value) =>
                      updateSubscription({ committedServices: numberValue(value) })
                    }
                  />
                </FrSubscriptionSection>

                <FrSubscriptionSection title="Scheduling Options">
                  <FrSelectField
                    label="Initial Followup"
                    value={subscriptionUi.initialFollowup}
                    options={["14 Days", "21 Days", "28 Days"]}
                    onChange={(initialFollowup) =>
                      setSubscriptionUi((v) => ({ ...v, initialFollowup }))
                    }
                  />
                  <FrInputField
                    label="Custom Date"
                    type="date"
                    value={subscriptionUi.customDate}
                    onChange={(customDate) => setSubscriptionUi((v) => ({ ...v, customDate }))}
                  />
                  <FrSelectField
                    label="Routing Region"
                    value={subscriptionUi.routingRegion}
                    options={["No Region Assigned", "Denver South", "Denver North"]}
                    onChange={(routingRegion) =>
                      setSubscriptionUi((v) => ({ ...v, routingRegion }))
                    }
                  />
                  <FrSelectField
                    label="Preferred Tech"
                    value={subscriptionUi.preferredTech}
                    options={["Jarrett Barclay", "Tawny Butler", "Any qualified technician"]}
                    onChange={(preferredTech) =>
                      setSubscriptionUi((v) => ({ ...v, preferredTech }))
                    }
                  />
                  <div className="fr-event-grid">
                    <p className="fr-sub-label">Event Schedule</p>
                    <FrTable
                      head={["Event", "Date", "Status"]}
                      rows={account.appointments.map((item, index) => [
                        index === 0 ? "Initial" : "Recurring",
                        item.date,
                        <span key={item.id} className="capitalize">
                          {item.status}
                        </span>,
                      ])}
                    />
                  </div>
                </FrSubscriptionSection>
              </div>
              <div className="fr-subscription-bottom grid lg:grid-cols-[250px_minmax(0,1fr)]">
                <FrSubscriptionSection title="Billing Options">
                  <FrInputField
                    label="Billing Account"
                    value={subscriptionUi.billingAccount}
                    onChange={(billingAccount) =>
                      setSubscriptionUi((v) => ({ ...v, billingAccount }))
                    }
                  />
                  <FrSelectField
                    label="Auto-pay Profile"
                    value={subscriptionUi.autopayProfile}
                    options={["Primary card •••• 4821", "No Auto-pay Profile"]}
                    onChange={(autopayProfile) =>
                      setSubscriptionUi((v) => ({ ...v, autopayProfile }))
                    }
                  />
                </FrSubscriptionSection>
                <section className="fr-invoices">
                  <h3 className="fr-subsection-title">Invoices</h3>
                  <PricingEditor
                    title="Initial"
                    lines={account.subscription.initialLines}
                    onChange={(initialLines) => updateSubscription({ initialLines })}
                  />
                  <PricingEditor
                    title="Recurring"
                    lines={account.subscription.recurringLines}
                    onChange={(recurringLines) => updateSubscription({ recurringLines })}
                  />
                  <div className="fr-invoice-totals grid grid-cols-3">
                    <div>
                      <span>Initial Subtotal</span>
                      <strong>{money(pricingTotal(account.subscription.initialLines))}</strong>
                    </div>
                    <div>
                      <span>Recurring Subtotal</span>
                      <strong>{money(pricingTotal(account.subscription.recurringLines))}</strong>
                    </div>
                    <div>
                      <span>Contract Value</span>
                      <strong>{money(contractValue(account.subscription))}</strong>
                    </div>
                  </div>
                </section>
              </div>
              {errors.length ? (
                <p className="px-2 py-1 text-sm text-destructive">{errors.join(" ")}</p>
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
        <div className="fr-footer flex h-10 shrink-0 items-center justify-end border-t border-border bg-fr-pane px-3">
          {activeTab === "Subscription" ? (
            <>
              <Button
                size="sm"
                variant="outline"
                className="h-7 rounded-[2px] text-[12px]"
                onClick={() => toast.success("Scheduling opened in simulation only.")}
              >
                Schedule
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 rounded-[2px] text-[12px]"
                onClick={() => toast.success("Transfer simulated. No account was transferred.")}
              >
                Transfer
              </Button>
            </>
          ) : null}
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
          <DialogContent className="fr-workspace fr-modal">
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
          <DialogContent className="fr-workspace fr-modal max-h-[88vh] max-w-2xl overflow-y-auto">
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
          <DialogContent className="fr-workspace fr-modal max-w-md">
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
    <section className="fr-section">
      <h3 className="fr-section-title px-2 py-1 text-[12px] font-semibold">{title}</h3>
      <div className="p-2">{children}</div>
    </section>
  );
}

function FrRows({ rows }: { rows: Array<[string, ReactNode]> }) {
  return (
    <dl className="fr-rows grid grid-cols-[110px_minmax(0,1fr)] text-[12px]">
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

function FrSubscriptionSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="fr-subsection">
      <h3 className="fr-subsection-title">{title}</h3>
      <div className="fr-subsection-body">{children}</div>
    </section>
  );
}

function FrInputField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  const id = `fr-${label.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-")}`;
  return (
    <div className="fr-sub-field">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function FrSelectField({
  label,
  value,
  options,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const id = `fr-${label.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-")}`;
  return (
    <div className="fr-sub-field">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
