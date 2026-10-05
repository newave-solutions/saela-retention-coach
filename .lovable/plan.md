# FieldRoutes-style account simulator specification

## Product intent

Add a realistic, non-production customer-account workspace to the existing CES and CEM voice calls. The simulated account opens automatically when the call connects, so the agent must listen, verify, investigate, update the account, and speak with the customer at the same time.

This should reproduce the workflow and information density shown in the supplied references without connecting to FieldRoutes, using real customer data, charging money, changing live schedules, or sending messages. All names, account numbers, addresses, payments, documents, and actions are generated training data.

## Experience structure

### Live-call layout

- Desktop-first split workspace: a compact persistent call rail and a larger customer-account workspace.
- The call rail keeps the customer name, timer, audio activity, microphone state, typed-response fallback, and end-call control visible while any account tab is open.
- The customer workspace opens to the account supplied by the incoming call. Do not make the agent search for the caller first unless a scenario specifically tests account matching.
- Header: customer number, customer name, account/subscription status, linked-property indicator, warning flags, and close control.
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
- Status: active, out of agreement, pending cancel, frozen, cancelled, account alerts, checkout owner.
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
- Prominent alerts for linked properties, branch/route changes, open leads, pending cancellation, safety/access restrictions, and delinquency.
- Values link to the relevant tab or record.
- No edits here; it is a derived summary that refreshes after saves elsewhere.

### 2. Info

Purpose: identity verification and contact/access accuracy.

- Editable name, phone, email, service address, billing-address choice, customer type/source, contact preferences, additional contacts, and account flags.
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
- Changes remain a draft until **Save**. Validation compares them with CES/CEM authority and scenario eligibility.

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
2. Future appointment projections recalculate from the effective date and frequency; completed visits never change.
3. Future invoice projections update; posted invoices and completed payments never change.
4. A revised agreement document is created when term, recurring price, included service, or agreement duration changes.
5. Relevant tags are added or updated, never duplicated.
6. A structured system note and audit event record old value, new value, agent, simulated timestamp, and reason.
7. Overview totals, remaining term, next service, and status refresh immediately.
8. The customer AI receives the committed terms so it can accept, question, or reject what the agent says.

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
- **New Agreement** opens a re-sign wizard populated from the subscription draft: covered service, minimum obligation, frequency, initial amount, recurring amount, annual increase, service address, and customer contact.
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
- CES/CEM exercises normally treat destructive controls as read-only or route them through a simulated escalation.
- Freeze, move, remove, and edit-cancellation actions require scenario permission and confirmation; every attempt is audited.

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
4. On success, retain/reactivate the subscription, add `Subscription Saved from Cancel`, remove or resolve Pending Cancel, create the note, and update reporting outcome.
5. On failure, preserve accurate cancellation/pending-cancel status and escalation requirements.

### Re-sign on an existing service

1. Available only for service-to-service customers with no current agreement.
2. Agent resolves the original issue and asks the customer's price point before quoting.
3. Agent configures at least four services, ongoing price, initial discount/free service only if needed, billing restart, agreement term, and yearly increase.
4. Save validates role authority and spoken-versus-entered terms.
5. Add `Resign — {X} months` and `Yearly Price Increase — {X}%`; create the revised agreement.
6. Agent previews and simulates sending it. Customer acceptance depends on convenience, value, clear disclosure, affordability, and the hidden scenario threshold—not simply clicking Send.

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
- coupon attempted/applied
- transfer initiated/completed
- contradiction corrected; unauthorized action attempted

Grade outcomes from both the private conversation analysis and this action stream:

- Account verification completeness and timing
- Whether the agent inspected evidence relevant to the customer's issue
- Spoken details versus values entered into the account
- Correct subscription, price, cadence, term, annual increase, and tags
- Appropriate authority and escalation behavior
- Appointment/invoice/document consistency after changes
- Note completeness and accuracy
- Whether the customer understood and accepted the resolution
- Efficiency without rewarding blind speed; unnecessary tab-hopping is coaching context, not an automatic failure

Post-call feedback should show completed/missed workflow moments and account-state errors, never the transcript. Team leads can replay a sanitized action timeline and open targeted practice exercises.

## Technical design

- Extend each full scenario with a server-only `simulatedAccount`; expose only the account fields appropriate to the live workspace.
- Add a session workspace snapshot plus append-only action events. Prefer one canonical reducer/command layer so tab components cannot create contradictory state.
- Suggested command surface: `verifyAccount`, `saveCustomerInfo`, `saveSubscription`, `addAccountTag`, `scheduleAppointment`, `saveNote`, `createAgreement`, `simulateDocumentSend`, `applyCoupon`, `transferCall`, and `setAccountStatus`.
- Every command validates authentication, session ownership, active-call status, role authority, preconditions, and expected account version before saving.
- Use optimistic UI only for reversible drafts. Confirmed commands return the authoritative updated snapshot.
- Send a concise machine-readable account/action summary into the customer AI after each successful command; do not expose hidden motives or acceptance rules to the browser.
- Preserve the existing server-side transcript policy. The new action stream supplements grading but does not reveal call text.

## Delivery phases

1. **Foundation:** canonical account model, event stream, auto-open account, shell, Overview, Info, role permissions, and grading hooks.
2. **Core service work:** Subscription editor and tags, Appointments, Notes, propagation engine, CES workflows.
3. **Retention and re-sign:** authority validation, pending-cancel/save states, agreement wizard, simulated send, CEM workflows.
4. **Financial/history depth:** Invoices, Documents history, Admin/access history, linked properties, transfer flow.
5. **Calibration:** scripted end-to-end scenarios, team-lead action review, scoring calibration, accessibility, desktop and narrow-screen testing.

## Acceptance scenarios

- A CES receives a reschedule call, verifies the account, notices a gate instruction, moves the visit, confirms the window, and sees Overview/appointment history/note update together.
- A CES tries to re-sign an in-agreement account and is correctly blocked; an eligible out-of-agreement customer can receive a four-service offer after price-point discovery.
- A successful re-sign writes the duration and yearly-increase tags, updates recurring pricing and projected visits, creates an agreement, and records a simulated send without contacting anyone.
- A CEM saves a pending cancellation within authority; the save tag and account status propagate everywhere.
- A role-limit violation, mismatched spoken/entered price, missing annual-increase disclosure, or unsaved edit appears in post-call coaching.
- Refreshing or reopening an active practice session restores the same simulated account and action history.
