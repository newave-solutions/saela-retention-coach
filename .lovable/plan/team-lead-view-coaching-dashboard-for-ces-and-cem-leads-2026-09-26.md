# Team Lead View — coaching dashboard for CES and CEM leads

## What changes for people
- **Agents (CES / CEM):** nothing changes. They keep their own role and call history.
- **Team leads:** you mark specific people as a CES lead or CEM lead. A lead gets a "Team" button and page. A CES lead sees every CES agent, and a CEM lead sees every CEM agent. Leads can't see the other seat.
- **Correction:** CEMs are coworkers of CES agents, not their managers. The words on the screens will say that.

## Team page (/team)
1. **Team overview:** total calls, team save or resolution rate, average score, and trend over the last 30 days compared with the 30 days before. Weakest skill across the team.
2. **Agent leaderboard:** one row per agent with calls, rate, average score, trend arrow, last active date and top weakness. Sortable. Agents who haven't practiced in 7+ days are flagged.
3. **Agent detail (/team/$agentId):**
   - Skill breakdown. CEM: GEOC (Gratitude, Empathy, Ownership, Clarity), negotiation, and the 3-attempt rule. CES: listening details caught, discovery, value-building, resign runway, wording and tone flags.
   - A score chart over time and recent calls that link to each scorecard.
   - Patterns that repeat, such as missed price-point questions, leading with discounts, or using the word "contract."
4. **GROW coaching plan** (made by AI from the agent's real calls, and can be refreshed):
   - **Goal:** 1–2 measurable targets, for example "GEOC Ownership avg 70 → 80 in 3 weeks."
   - **Reality:** the evidence, with quotes from the calls.
   - **Options:** 3 specific techniques or drills.
   - **Will:** next steps with owners and dates, plus a check-in date.
   - **Talking points for the next 1:1:** conversation openers, questions to ask, and how to praise what's going well.
   - **Practice with them:** one-click links that open a matching practice call (the same reason or call type, at the right difficulty) so the lead can walk the agent through it or assign it.
5. **Saved plans:** leads can save a plan and mark steps as done. Each check-in compares the target against the agent's current score, so progress is measurable.

## How leads get assigned
There's no screen for assigning leads. On request, I'll add people as leads from the backend by their email.

## Technical details
- Migration: `app_role` enum ('ces_lead','cem_lead'), a `user_roles` table with GRANTs and RLS, and a `has_role()` security-definer function. Additional SELECT policies on `training_sessions` and `profiles` let a lead read rows for users whose `profiles.position` matches the lead's seat (ces_lead reads ces, cem_lead reads cem), done through a security-definer helper so the check doesn't loop back on itself.
- `coaching_plans` table (lead_id, agent_id, track, grow jsonb, steps jsonb, targets jsonb, created_at). GRANTs are set, and RLS allows access only to the lead who owns the plan and has the matching role.
- `src/lib/team.functions.ts` with `requireSupabaseAuth`: `getMyLeadRole`, `getTeamOverview`, `getAgentDetail`, `generateGrowPlan` (Lovable AI Gateway, structured output that uses the Saela GEOC guide and the CES playbook as context), `saveCoachingPlan`, and `updatePlanStep`. Every function checks the lead role on the server.
- Routes: `src/routes/_authenticated/team.tsx` (layout) plus `team.index.tsx` and `team.$agentId.tsx`. Practice links use the existing `/call/new` and `/service/new` with preset search params. The role guard on those pages will let leads practice either seat's calls in their own track.
- Dashboard header: a "Team" button appears only for leads.
