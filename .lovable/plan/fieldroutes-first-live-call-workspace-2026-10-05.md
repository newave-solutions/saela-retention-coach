# FieldRoutes-first live call workspace

## Goal

Make the live retention and service call screens feel like the supplied FieldRoutes references, with the simulated customer account occupying the workspace. Remove the audio waveform, typed-response box, and other call-focused panels that compete with the account.

## Live call layout

- Keep **Take the call** as the required entry action on the existing incoming-call screen.
- After answering, open the matched simulated customer account across the full available screen.
- Replace the current left call panel with one compact call-control strip containing only:
  - current call state
  - call timer
  - **Talk / Mute**
  - **End call**
- Preserve the current one-press Talk behavior: the trainee enables the microphone once and the conversation continues automatically between turns.
- Remove the live waveform/audio visualization and typed-response fallback from both retention and CES service calls.
- Keep the conversation transcript completely absent from the live screen.

## FieldRoutes-style customer workspace

- Rework the account shell to closely match the supplied FieldRoutes screenshots: dense operational spacing, compact typography, table-like rows, restrained gray surfaces, dark green navigation/action areas, and blue linked values.
- Make the customer/account header the dominant first view, including customer number, contact and service-address details, account status, balance, and training-only identification.
- Match the reference tab hierarchy and proportions for **Overview, Info, Subscription, Notes, Documents, Appointments, Invoices, and Admin**.
- Remove decorative dashboard styling that does not appear in the references; use section bars, dividers, form rows, and data tables instead of presentation cards.
- Keep the existing simulated account data and make each tab look populated and operational rather than like a summary mockup.
- Preserve horizontal tab access and readable controls on narrower screens without introducing a separate call panel.

## Functional behavior to retain

- Keep Subscription as the source of truth for service terms, initial and recurring pricing, discounts, totals, and agreement values.
- Preserve saving subscription changes, validation, projected account updates, document generation from saved terms, agreement preview, and simulated delivery.
- Preserve Notes, Appointments, Invoices, and account activity currently available in the mock account.
- Keep all customer speech, hidden motives, and grading evidence server-side; this change does not expose transcripts.

## Cleanup and verification

- Remove the now-unused waveform and typed-call UI from the live routes and delete their unused presentation components if nothing else references them.
- Verify both retention and CES service call paths from **Take the call** through Talk/Mute, account navigation, subscription saving, agreement generation, and End call.
- Check the redesigned workspace at the current desktop size and a narrow viewport for clipped controls, overlapping text, tab access, and browser errors.

## Scope boundary

This pass changes the live-call presentation and FieldRoutes mockup fidelity. It does not change scenario generation, voice providers, grading formulas, permissions, or the underlying subscription/agreement business rules.
