# FieldRoutes-style account simulator specification

## Product intent

Add a realistic, non-production customer-account workspace to the existing CES and CEM voice calls. The simulated account opens automatically when the call connects, so the agent must listen, verify, investigate, update the account, and speak with the customer at the same time.

This should reproduce the workflow and information density shown in the supplied references without connecting to FieldRoutes, using real customer data, charging money, changing live schedules, or sending messages. All names, account numbers, addresses, payments, documents, and actions are generated training data.

## Experience structure

### Live-call layout

- Desktop-first split workspace: a compact persistent call rail and a larger customer-account workspace.
- The call rail keeps the customer name, timer, audio activity, microphone state, typed-response fallback, and end-call control visible while any account tab is open.
- The customer workspace opens to the account supplied by the incoming call. Do not make the agent search for the caller first unless a scenario specifically tests account matching.
- Header: customer number, customer name, account/subscription status, and close control.
- Primary tabs: **Overview, Info, Subscription, Notes, Documents, Appointments, Invoices, Admin**. Keep secondary FieldRoutes tabs visible but disabled or clearly outside the current exercise only when needed for fidelity.
- Persistent actions: **Schedule**, **Transfer**, **Save**, and **Close**. Save appears only for tabs with editable drafts.
- A bottom checkout strip communicates that the trainee currently owns the simulated account. It prevents conflicting simulated edits and releases when the call ends.
- At narrower widths, keep the call rail docked above the account workspace and make the tabs horizontally scrollable. Do not shrink the dense workspace until labels become unreadable.

### Visual direction

- Match the references' operational density: compact tab bar, restrained white/gray work area, dark green navigation and action bars, blue linked values, green successful financial states, amber service warnings, and red account alerts.
- Preserve this app's semantic tokens and accessibility standards rather than copying FieldRoutes assets or proprietary page code.
- Use compact rows and section bars, not decorative cards. The interface should feel like an operations system, not a marketing dashboard.
- All controls require keyboard focus, readable labels, confirmation states, and sufficient contrast. Destructive changes require a confirmation step.

## Canonical simulated account

Every generated call receives one `SimulatedAccount` object. All tabs read from it, and all successful actions update it through explicit commands rather than maintaining isolated tab state.

Required account groups:

- Identity: customer number, first/last name, phone, email, service and billing addresses, preferred contact channels, linked properties.
- Status: active, out of agreement, frozen, cancelled, and checkout owner.
- Service history: customer since, completed service counts, last service, next service, recent reservices, pest concerns, technician comments, products used.
- Subscription: program, active state, contract start/end or remaining term, recurring frequency, billing frequency, current and production price, initial price, scheduling region, preferred technician/day/time, call-ahead setting, seasonal setting, source/sales fields.
- Billing: balance, aging, invoices, payments, coupons/credits, billing profile, autopay state.
- Notes: categorized notes, author, timestamp, related action, internal follow-up tasks.
- Documents: current agreement, prior agreements, service notifications, signatures, delivery status.
- Appointments: completed, scheduled, cancelled, and reservice visits with dates, windows, status, technician, instructions, and covered work.
- Audit history: every simulated view, edit, save, send, schedule, transfer, freeze/unfreeze, and status change.

The account data must agree with the spoken scenario. A caller discussing a $129.99 service, an expired agreement, a recent spider reservice, or a gate restriction must show those same facts in the relevant tabs.

## Tab specifications

### 1. Overview

Purpose: give the agent a fast operational picture before asking questions.

- Customer since, completed subscription/reservice/other service counts, remaining agreement days, last completed service, next scheduled service, recent reservices, balance, account age, and receivables aging.
- Values link to the relevant tab or record.
- No edits here; it is a derived summary that refreshes after saves elsewhere.

### 2. Info

Purpose: identity verification and contact/access accuracy.

- Editable name, phone, email, service address, billing-address choice, customer type/source, contact preferences, and additional contacts.
- Map is a static simulated location preview; it never sends data to a mapping provider.
- Verification telemetry records which required fields the agent opened or confirmed during the call.
- Saving changed contact data adds an audit event and a system note. Unsaved navigation prompts the agent to save or discard.

### 3. Subscription — primary workspace

Purpose: source of truth for ongoing service and the highest-value practice area.

**Subscription selector and status**
- Support multiple subscriptions, with the selected plan's program, internal identifier, contract value, agreement state, and active toggle.
- Show sales/source fields, recurring service configuration, scheduling options, visit timeline, invoice terms, billing account, and autopay profile.

**Editable terms**
- Service type, recurring frequency, agreement duration, custom date, routing region, preferred technician, preferred day/time, call-ahead, seasonal setting, initial and recurring production/charge prices.
- Changes remain a draft until **Save**. This first version should make the pricing editor and its calculations correct before expanding into less important account controls.

**Working initial and recurring pricing editor**
- Both **Initial** and **Recurring** rows expand into editable line items rather than displaying summary amounts only.
- Each line item includes: item/service, quantity, production price, customer charge price, discount type and amount, taxable/non-taxable toggle, and calculated subtotal.
- Keep the tax setting available in the data model, but default this training version to non-taxable and do not add tax to displayed totals.
- Calculation order for each line: `base = quantity × customer charge price`; then apply a fixed-dollar or percentage discount; clamp the result at zero; subtotal equals the discounted amount. The production price remains visible for coaching and margin comparison but does not replace the customer charge in the subtotal.
- Initial and recurring totals are calculated separately. The displayed contract value uses the saved initial total plus the saved recurring total multiplied by the number of committed recurring services.
- Currency inputs accept two decimal places, totals round to the nearest cent, blank required values show an inline error, and negative quantities/prices are blocked.
- Any pricing input change immediately updates the expanded row, section total, and agreement preview. It does not become authoritative until the Subscription tab is saved.
- The saved recurring price becomes the amount used for future projected invoices; already posted invoices and payments do not change.
- The saved initial price/discount applies to the new agreement's first service only. A free initial service is represented as a 100% initial discount, not a zero production price.
- The simulator records the exact offer entered so post-call coaching can compare it with what the agent explained aloud.

**Account tags**
- Searchable multi-select with visible removable chips and an audit trail.
- Required tags:
  - `Subscription Saved from Cancel`
  - `Resign — {X} months`, where X is selected from the new agreement term
  - `Yearly Price Increase — {X}%`, where X is the disclosed annual percentage
- Also support scenario tags such as Pending Cancel, Switch Over, Paid in Full, Sales Rep Pay, Invalid Payment Method, and branch transfer.
- Tags are functional, not decorative: they drive overview alerts, coaching checks, follow-up tasks, and reporting outcomes.

**Propagation rules**
A saved subscription change updates the whole account in one atomic simulated transaction:

1. Subscription terms and agreement status update.
2. Initial, recurring, and contract-value totals recalculate from the saved line items.
3. Future appointment projections recalculate from the effective date and frequency; completed visits never change.
4. Future invoice projections update; posted invoices and completed payments never change.
5. The saved terms become the source used by **Documents → New Agreement**; saving the Subscription does not create or send an agreement by itself.
6. Relevant subscription tags are added or updated, never duplicated.
7. A structured system note and audit event record old value, new value, agent, simulated timestamp, and reason.
8. Overview totals, remaining term, next service, and status refresh immediately.
9. The customer AI receives the committed terms so it can accept, question, or reject what the agent says.

### 4. Notes

Purpose: teach concise, complete account documentation.

- Left filters for All Notes, Appointment, Billing, Cancel/Reinstatement, Convenience Payments, Customer Contacts, Customer Replies, General, Important System, Marketing, Red, SMS/Voice/Email, and System.
- Actions: Add Note, Add Task, Send Email, Send SMS, and Send Voice. Communications are simulated.
- Agent note template auto-suggests: contact reason, verified account, root issue, discovery, resolution, exact terms, customer response, and follow-up owner/date.
- Agent can edit the suggested note before saving. The system grades accuracy and missing material facts, not note length.
- System-generated entries cannot be edited.

### 5. Documents

Purpose: agreement review and simulated delivery.

- Left document list with type, date, time, and status; preview panel for the selected agreement or service proof.
- Actions: Upload Document, New Agreement, New Form, mark Primary Customer, and Email to Customer.
- **New Agreement** first shows the customer's current and previous subscriptions. The agent selects the applicable **Protection Program** subscription.
- Selecting it generates an agreement from the **saved** Subscription values: service type, service address, effective date, agreement length, service count/frequency, initial line items and total, recurring line items and total, discounts, and yearly percentage increase.
- The generated agreement is read-only with respect to commercial terms. If a value is wrong, the agent returns to Subscription, corrects and saves it, then regenerates the agreement. This prevents the Subscription and agreement from disagreeing.
- If Subscription has unsaved changes, **New Agreement** explains that they must be saved first. If required pricing, date, length, or service values are missing, agreement generation is blocked with links to those fields.
- Regenerating before simulated sending replaces the draft agreement; it does not create duplicate customer documents.
- Sending is simulated. It produces a short progress state followed by `Agreement sent — simulation only`, a timestamped delivery-status row, an audit event, and a note. It must never invoke email or SMS infrastructure.
- The document cannot be sent if required terms are blank or conflict with the saved subscription.

### 6. Appointments

Purpose: inspect service evidence and modify upcoming work.

- Left history grouped by service type/status/date.
- Detail view includes scheduled/completed information, technician, duration, branch/route, technician comments, customer-seen comments, signature, service indicator, treated areas/pests, and products used.
- Scheduled visits can be rescheduled or annotated; completed visits are immutable.
- **Schedule** supports regular service and stand-alone reservice, access instructions, date/window, contact preference, issue location, pests, and customer availability.
- Scheduling validates coverage, duplicate visits, current-month rules where relevant, and account status. Success updates the Overview and Subscription timeline and creates a note/audit event.

### 7. Invoices

Purpose: understand account balance, prior charges, coupons, and payment history.

- Left navigation for Account Summary, Account Balance Summary, New Invoice, and invoice history.
- Main area shows balance/aging, payment rows, invoice totals, service association, coupon/credit entries, and delivery history.
- Email, postal mail, and print are simulated confirmations only.
- Coupons require amount, reason, and related resolution. Authority violations block saving and explain the allowed next action, including escalation when appropriate.
- Financial projections created by a re-sign remain visually distinct from posted transactions.

### 8. Admin / access history

Purpose: expose account control and audit behavior without giving trainees unsafe powers.

- Show frozen/active status, activation date, access/check-out history, portal-login state, linked-customer movement, and removal controls.
- Keep these controls secondary in the first version. Detailed flag management and flag-driven behaviors are deferred until the Subscription-to-Agreement workflow is complete and calibrated.

## Core workflows and logic

### Incoming call and verification

1. Call starts and the matching account opens in Overview with a checked-out state.
2. The agent verifies an appropriate combination of customer number/name, phone/email, and service address.
3. The simulator records verification fields without displaying private call text.
4. Sensitive edits and document sending remain locked until minimum verification is complete.

### Reservice or reschedule

1. Inspect Overview and relevant appointment history.
2. Discover pest/location/access/timing details from the caller.
3. Create or modify the appointment.
4. Confirm date, time window, access instructions, covered cost, and next step aloud.
5. Save creates the appointment, overview update, note, and audit event.

### Cancellation save / CEM retention

1. Inspect subscription, service history, invoices, and notes.
2. Complete GEOC and three distinct non-financial retention attempts before concessions.
3. Apply only authorized pricing or discounts.
4. On success, retain/reactivate the subscription, save the agreed pricing and terms, add `Subscription Saved from Cancel`, create the note, and update reporting outcome.
5. On failure, preserve accurate cancellation/pending-cancel status and escalation requirements.

### Re-sign on an existing service

1. Available only for service-to-service customers with no current agreement.
2. Agent resolves the original issue and asks the customer's price point before quoting.
3. Agent configures at least four services, ongoing price, initial discount/free service only if needed, billing restart, agreement term, and yearly increase.
4. In Subscription, the agent expands Initial and Recurring pricing, enters the exact offered charges and discount, selects the agreement date/length/frequency, and saves.
5. The totals recalculate; add `Resign — {X} months` and `Yearly Price Increase — {X}%` from the saved terms.
6. In Documents, the agent chooses **New Agreement**, selects the Protection Program subscription, and generates the agreement from those saved values.
7. The agent previews and simulates sending it. Customer acceptance depends on convenience, value, clear disclosure, affordability, and the hidden scenario threshold—not simply clicking Send.

### Transfer

- Transfer opens a destination/reason dialog, records a warm-handoff summary, and changes the AI conversation only after confirmation.
- Sales transfers do not permit CES to quote a new product. Lead/CEM transfers retain the account context and unresolved task.

## Permissions and realism safeguards

- CES: standard service changes, reservices, reschedules, notes, and eligible service-to-service re-signs within CES authority.
- CEM/retention: cancellation workflow and CEM retention authority; not managerial access to CES agents.
- Team lead: review simulator actions, errors, and coaching for agents in the lead's assigned seat; no automatic customer-account editing during review.
- Never use real customer records or identifiers. Display a persistent `Training simulation` label in the workspace and simulated-send confirmations.
- No external email, SMS, payment, map, scheduling, FieldRoutes, or e-signature calls.

## Action model and grading telemetry

Store an append-only action stream for each practice session:

- tab opened; record inspected; field verified
- draft field changed; validation failed; draft discarded; save completed
- tag added/removed
- appointment created/rescheduled
- note/task created
- agreement previewed/sent
- pricing line changed; discount attempted/applied; pricing totals saved
- transfer initiated/completed
- contradiction corrected; unauthorized action attempted

Grade outcomes from both the private conversation analysis and this action stream:

- Account verification completeness and timing
- Whether the agent inspected evidence relevant to the customer's issue
- Spoken details versus values entered into the account
- Correct subscription, initial and recurring line-item math, price, cadence, term, annual increase, and tags
- Appropriate authority and escalation behavior
- Subscription/invoice/agreement consistency after changes
- Note completeness and accuracy
- Whether the customer understood and accepted the resolution
- Efficiency without rewarding blind speed; unnecessary tab-hopping is coaching context, not an automatic failure

Post-call feedback should show completed/missed workflow moments and account-state errors, never the transcript. Team leads can replay a sanitized action timeline and open targeted practice exercises.

## Technical design

- Extend each full scenario with a server-only `simulatedAccount`; expose only the account fields appropriate to the live workspace.
- Add a session workspace snapshot plus append-only action events. Prefer one canonical reducer/command layer so tab components cannot create contradictory state.
- Suggested command surface: `verifyAccount`, `saveCustomerInfo`, `calculateSubscriptionPricing`, `saveSubscription`, `addAccountTag`, `scheduleAppointment`, `saveNote`, `generateAgreementFromSubscription`, `simulateDocumentSend`, `applyCoupon`, and `transferCall`.
- Every command validates authentication, session ownership, active-call status, role authority, preconditions, and expected account version before saving.
- Use optimistic UI only for reversible drafts. Confirmed commands return the authoritative updated snapshot.
- Send a concise machine-readable account/action summary into the customer AI after each successful command; do not expose hidden motives or acceptance rules to the browser.
- Preserve the existing server-side transcript policy. The new action stream supplements grading but does not reveal call text.

## Delivery phases

1. **Foundation:** canonical account model, event stream, auto-open account, shell, Overview, basic Info, role context, and grading hooks.
2. **Subscription and pricing core:** editable Initial/Recurring line items, deterministic non-tax totals, discounts, contract value, save behavior, subscription tags, and account-wide propagation.
3. **Re-sign agreement workflow:** subscription selection, agreement generation strictly from saved Subscription values, validation, preview, simulated send, and CES/CEM coaching checks.
4. **Core service work:** Appointments, Notes, reservice/reschedule workflows, and transfer flow.
5. **Financial/history depth:** Invoices, Documents history, Admin/access history, and linked properties. Account flags and flag-driven behavior remain deferred.
6. **Calibration:** scripted end-to-end scenarios, team-lead action review, scoring calibration, accessibility, desktop and narrow-screen testing.

## Acceptance scenarios

- A CES receives a reschedule call, verifies the account, notices a gate instruction, moves the visit, confirms the window, and sees Overview/appointment history/note update together.
- A CES tries to re-sign an in-agreement account and is correctly blocked; an eligible out-of-agreement customer can receive a four-service offer after price-point discovery.
- A successful re-sign correctly calculates initial and recurring totals, writes the duration and yearly-increase tags, updates projected invoices and visits, and records a simulated send without contacting anyone.
- An agreement cannot be generated from unsaved or incomplete Subscription terms; after saving, selecting Protection Program produces an agreement whose date, length, service, initial charge, recurring charge, discount, and yearly increase exactly match Subscription.
- A CEM saves a pending cancellation within authority; the save tag and account status propagate everywhere.
- A role-limit violation, mismatched spoken/entered price, missing annual-increase disclosure, or unsaved edit appears in post-call coaching.
- Refreshing or reopening an active practice session restores the same simulated account and action history.
