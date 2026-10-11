# FieldRoutes customer card fidelity pass

Apply the uploaded DevTools measurements so the live-call customer account looks like the real FieldRoutes customer card.

## Card frame
- Present the account as a FieldRoutes-style dialog: white surface, 2px corners, light drop shadow, centered at up to about 1000px wide on large screens and full-width on narrow ones.
- Thin dark green title bar (FieldRoutes green) with white text: "Customer #<number> — <name>" and a close-style control that does nothing (training only).
- Light gray footer action bar (about 40px) with Save / Close style buttons; Save works on the Subscription tab, others are practice-only.
- Dense typography: 12–13px data, dark gray text, small uppercase gray field labels.

## Tabs (13, matching FieldRoutes order)
Overview, Info, Subscription, Leads, Billing, Notes, Documents, Appointments, Invoices, Properties, Conditions, Equipment, Admin.
- Existing 8 tabs keep their current content and behavior.
- New tabs (Leads, Billing, Properties, Conditions, Equipment) get realistic static demo rows so they look populated; no new logic.

## Overview layout
- Two columns. Left: Account, Billing and Property info blocks plus a row of quarter-width summary boxes (Customer Since, Last Completed, Next Service, Balance), each with a thin colored top bar, small title, value below.
- Right sidebar: Account Summary (recurring price, initial price, contract value, status — updating instantly from saved subscription), quick action buttons (Email, SMS, Add Task — simulated toast only), and Access History.

## Appointments editing
- Clicking an upcoming appointment opens a small sub-dialog to change technician and date; saving updates the list (practice only, stored with the session account).

## Unchanged
Call controls strip, voice, grading, subscription math, agreement generation and simulated send, privacy of transcripts.

## Technical details
- Edits confined to `src/components/AccountWorkspace.tsx` (split into small subcomponents if it grows), plus FieldRoutes green / gray tokens in `src/styles.css`.
- Static demo data for new tabs generated in `account-workspace.server.ts` as optional fields (older sessions fall back to defaults).
- Appointment edits persist through the existing `saveWorkspace` call; add an `appointment_updated` event type.
- Update the FieldRoutes simulator memory to list all 13 tabs.
- Verify with Playwright at desktop and narrow widths through Take the call → each tab → subscription save → agreement.
