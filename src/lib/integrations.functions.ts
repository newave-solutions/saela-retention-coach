import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Coaching, Outcome, ScoreBreakdown } from "@/lib/scenarios";

const GATEWAY = "https://connector-gateway.lovable.dev";

function gatewayHeaders(connectorKeyName: "LINEAR_API_KEY" | "MICROSOFT_TEAMS_API_KEY") {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  if (!lovableKey) throw new Error("LOVABLE_API_KEY is not configured");
  const connectionKey = process.env[connectorKeyName];
  if (!connectionKey) throw new Error(`${connectorKeyName} is not configured`);
  return {
    Authorization: `Bearer ${lovableKey}`,
    "X-Connection-Api-Key": connectionKey,
    "Content-Type": "application/json",
  };
}

async function readOrThrow(response: Response, label: string) {
  if (!response.ok) {
    const body = await response.text();
    console.error(`${label} failed [${response.status}]: ${body}`);
    throw new Error(`${label} failed [${response.status}]: ${body}`);
  }
  return response.json() as Promise<any>;
}

type SessionRow = {
  id: string;
  scenario: {
    customerName?: string;
    reasonLabel?: string;
    difficultyLabel?: string;
    personalityLabel?: string;
    accountSummary?: string;
  } | null;
  outcome: Outcome | null;
  overall_score: number | null;
  scores: ScoreBreakdown | null;
  coaching: Coaching | null;
  duration_seconds: number | null;
};

async function loadSession(supabase: any, sessionId: string): Promise<SessionRow> {
  const { data, error } = await supabase
    .from("training_sessions")
    .select("id, scenario, outcome, overall_score, scores, coaching, duration_seconds")
    .eq("id", sessionId)
    .single();
  if (error) throw new Error(error.message);
  return data as SessionRow;
}

function outcomeLabel(outcome: Outcome | null) {
  if (outcome === "saved") return "Saved";
  if (outcome === "partial") return "Partially saved";
  if (outcome === "cancelled") return "Cancelled";
  return "Not graded";
}

/* ----------------------------- Microsoft Teams ---------------------------- */

export const listTeamsChannels = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const headers = gatewayHeaders("MICROSOFT_TEAMS_API_KEY");
    const teamsRes = await fetch(`${GATEWAY}/microsoft_teams/me/joinedTeams`, { headers });
    const teams = await readOrThrow(teamsRes, "Teams list");

    const items: { teamId: string; teamName: string; channelId: string; channelName: string }[] =
      [];
    for (const team of (teams.value ?? []).slice(0, 10)) {
      const chRes = await fetch(`${GATEWAY}/microsoft_teams/teams/${team.id}/channels`, {
        headers,
      });
      if (!chRes.ok) continue;
      const channels = await chRes.json();
      for (const channel of channels.value ?? []) {
        items.push({
          teamId: team.id,
          teamName: team.displayName,
          channelId: channel.id,
          channelName: channel.displayName,
        });
      }
    }
    return { items };
  });

export const postSessionToTeams = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { sessionId: string; teamId: string; channelId: string }) => {
    if (!input?.sessionId || !input?.teamId || !input?.channelId) {
      throw new Error("sessionId, teamId and channelId are required");
    }
    return input;
  })
  .handler(async ({ data, context }) => {
    const session = await loadSession(context.supabase, data.sessionId);
    const s = session.scenario ?? {};
    const c = session.coaching;

    const list = (title: string, items?: string[]) =>
      items?.length
        ? `<p><b>${title}</b></p><ul>${items.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>`
        : "";

    const content = [
      `<h3>Retention call debrief — ${escapeHtml(s.customerName ?? "Customer")}</h3>`,
      `<p><b>Reason:</b> ${escapeHtml(s.reasonLabel ?? "—")} · <b>Outcome:</b> ${outcomeLabel(
        session.outcome,
      )} · <b>Score:</b> ${session.overall_score ?? "—"}/100</p>`,
      session.scores
        ? `<p><b>GEOC breakdown:</b> gratitude ${session.scores.gratitude ?? 0}, empathy ${
            session.scores.empathy ?? 0
          }, ownership ${session.scores.ownership ?? 0}, clarity ${
            session.scores.clarity ?? 0
          }, negotiation ${session.scores.negotiation ?? 0}</p>`
        : "",
      c?.hiddenMotive ? `<p><b>Real reason:</b> ${escapeHtml(c.hiddenMotive)}</p>` : "",
      c?.summary ? `<p>${escapeHtml(c.summary)}</p>` : "",
      list("Did well", c?.didWell),
      list("Missed", c?.missed),
      list("Next time", c?.nextTime),
    ].join("");

    const res = await fetch(
      `${GATEWAY}/microsoft_teams/teams/${data.teamId}/channels/${data.channelId}/messages`,
      {
        method: "POST",
        headers: gatewayHeaders("MICROSOFT_TEAMS_API_KEY"),
        body: JSON.stringify({ body: { contentType: "html", content } }),
      },
    );
    const posted = await readOrThrow(res, "Teams message");
    return { messageId: posted.id as string };
  });

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/* --------------------------------- Linear --------------------------------- */

async function linearGraphql(query: string, variables?: Record<string, unknown>) {
  const res = await fetch(`${GATEWAY}/linear/graphql`, {
    method: "POST",
    headers: gatewayHeaders("LINEAR_API_KEY"),
    body: JSON.stringify({ query, variables }),
  });
  const json = await readOrThrow(res, "Linear request");
  if (json.errors?.length) {
    throw new Error(`Linear request failed: ${JSON.stringify(json.errors)}`);
  }
  return json.data;
}

export const listLinearTeams = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const data = await linearGraphql(`query { teams(first: 50) { nodes { id name } } }`);
    return { items: (data?.teams?.nodes ?? []) as { id: string; name: string }[] };
  });

export const createLinearFollowUps = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { sessionId: string; teamId: string }) => {
    if (!input?.sessionId || !input?.teamId) throw new Error("sessionId and teamId are required");
    return input;
  })
  .handler(async ({ data, context }) => {
    const session = await loadSession(context.supabase, data.sessionId);
    const c = session.coaching;
    const customer = session.scenario?.customerName ?? "Customer";
    const actions = (c?.nextTime ?? []).slice(0, 5);
    if (!actions.length) throw new Error("This call has no coaching actions to turn into issues.");

    const description = [
      `From a SaveLine retention roleplay with **${customer}**.`,
      `Reason: ${session.scenario?.reasonLabel ?? "—"} · Outcome: ${outcomeLabel(session.outcome)} · Score: ${
        session.overall_score ?? "—"
      }/100`,
      c?.hiddenMotive ? `\nReal reason behind the cancel: ${c.hiddenMotive}` : "",
      c?.missed?.length ? `\nMissed on the call:\n${c.missed.map((m) => `- ${m}`).join("\n")}` : "",
    ].join("\n");

    const created: { id: string; url: string; title: string }[] = [];
    for (const action of actions) {
      const result = await linearGraphql(
        `mutation Create($input: IssueCreateInput!) {
           issueCreate(input: $input) { issue { id url title } }
         }`,
        {
          input: {
            teamId: data.teamId,
            title: `Retention coaching: ${action.slice(0, 200)}`,
            description,
          },
        },
      );
      const issue = result?.issueCreate?.issue;
      if (issue) created.push(issue);
    }
    return { created };
  });
