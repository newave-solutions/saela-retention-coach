# Fix "Continue with Google" and three follow-up improvements

## Part 1 — Make Google sign-in work reliably

The sign-in page code already calls the managed Google helper, so the error most likely comes from the backend side (Google login not switched on, or the setup files being out of date). There's no recorded error in the preview right now, so the first step is to reproduce it.

1. **Reproduce** — click "Continue with Google" in a test browser and record the exact error message.
2. **Re-apply the managed Google setup** — switch Google sign-in on again through Lovable Cloud and regenerate its setup files. This fixes the "Unsupported provider" / "provider not enabled" errors. Also confirm email/password sign-in is on, since the page offers both.
3. **Keep the page you were going to** — if you were sent to sign in from another page (for example, connecting an outside app), remember that page before going to Google and return you there afterwards. Right now that destination gets lost.
4. **Clearer fallback** — if Google fails (you close the popup, it's blocked, or there's a network error), show a plain message and keep the email form ready, instead of a raw error. The button stops showing "Opening Google..." straight away.
5. **Verify** — load the sign-in page in a test browser, click Google and confirm the popup/redirect starts without errors. Also check that email sign-in still works.

## Part 2 — Three suggested improvements (proposed only, not built in this plan)

1. **One shared sign-in guard** — each call page checks sign-in and role in its own way. A shared protected area would send signed-out users to sign-in (and bring them back afterwards) in the same way everywhere, and remove repeated code.
2. **Faster first sound on calls** — play the customer's voice as it streams in and prepare the first line while the call screen loads. This cuts the pause after the agent speaks and makes calls feel more real.
3. **Manager view of team results** — a CEM-only page showing each CES agent's scores, save rates and common weak spots (for example GEOC ownership or how terms are explained). This supports coaching and fits the two-level CES/CEM setup.

## Technical details
- Run `supabase--configure_social_auth` with `["google"]` and `supabase--enable_email_auth`; don't edit `src/integrations/lovable` by hand.
- `src/routes/auth.tsx`: save the sanitized `next` in sessionStorage before calling `lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin })`; after the session loads, read it, clear it, and navigate there. Reset `busy` in every branch and map error messages to friendly text.
- Playwright check on `/auth`, plus console and network logs.
