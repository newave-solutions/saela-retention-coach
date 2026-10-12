# FieldRoutes Subscription tab fidelity pass

Rebuild the existing Subscription tab as the next focused customer-card replica. Leave the Overview tab unchanged until its exact content is reviewed separately.

## Subscription layout

- Replace the current flat field grid with the FieldRoutes three-column layout inside the existing 1000px customer card.
- Use compact legacy styling already established for the workspace: Helvetica/Arial, 12–13.2px text, thin neutral borders, white panels, blue section hierarchy, and dense spacing.
- Keep the subscription heading and saved/unsaved state visible without consuming excessive vertical space.

### Sales Information

- Add compact controls for Sales Rep, Sales Rep 2, Sales Rep 3, Acquisition, Sub-Source, Sold Date and Time, Contract Length, Expiration Date, and PO No.
- Show `V-Ikaika Morningstar_3467`, `07/26/2025 9:21 pm`, and `18 months` as specified defaults.
- Add the subscription-specific notes area with the placeholder `Enter Subscription Specific Notes here...`.

### Recurring Services

- Add FieldRoutes-style dropdowns for Service Type, Frequency, Duration, Call Ahead, and Seasonal.
- Show the specified defaults: Protection Program, Every 12 Weeks, Standard Duration, and Year-Round Service.
- Keep agreement-critical values wired to the current subscription state so service type, term, frequency, and call-ahead changes continue to feed saved terms and generated agreements.

### Scheduling Options

- Add Initial Followup, Custom Date, Routing Region, and Preferred Tech controls with the specified defaults.
- Add a compact event schedule grid below them, using the simulated account’s existing serviced and upcoming appointments to show dates and statuses.

## Financial and action area

- Restyle the working initial and recurring pricing editors into a FieldRoutes invoice section with Initial and Recurring rows and Production, Charge, and Subtotal columns.
- Preserve working quantity, production price, charge price, discount, taxable toggle, calculated totals, validation, and agreement-value behavior.
- Add a lower-left Billing Options widget with Billing Account and Auto-pay Profile controls.
- Change the customer-card footer on the Subscription tab to `Schedule`, `Transfer`, `Close`, and `Save` in FieldRoutes order and styling.
- Save keeps its current real practice behavior; Schedule, Transfer, and Close provide simulation-only feedback and do not perform external actions.

## Scope and verification

- Keep all other tabs, live-call controls, voice behavior, agreement generation, and simulated sending unchanged.
- Do not alter the Overview tab in this pass.
- Do not add backend schema changes; new replica-only fields remain session-local presentation state, while existing subscription fields remain the source for saved terms and agreements.
- Verify at desktop and narrow widths that the three columns collapse cleanly, all controls remain readable, pricing totals update, Save persists agreement-critical edits, and Documents still generates an agreement from the saved subscription.

## Technical details

- Refactor the Subscription markup in `AccountWorkspace.tsx` into focused internal sections where useful, without changing the account workspace contract.
- Extend the scoped `.fr-workspace` styles in `src/styles.css` for the three-column form, event grid, invoice rows, billing widget, and Subscription-specific footer.
- Reuse the existing design-system controls and semantic FieldRoutes tokens; no raw component colors or unrelated global styling changes.
