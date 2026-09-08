import { auth, defineMcp } from "@lovable.dev/mcp-js";

import listSessions from "./tools/list-sessions";
import getSession from "./tools/get-session";
import performanceSummary from "./tools/performance-summary";

const projectRef = import.meta.env["VITE_SUPABASE_PROJECT_ID"] ?? "project-ref-unset";

export default defineMcp({
  name: "retention-coach-ai",
  title: "Retention Coach AI",
  version: "0.1.0",
  instructions:
    "Tools for Retention Practice retention call training. Use `list_sessions` to find the signed-in agent's practice calls, `get_session` for a full scorecard with coaching and transcript, and `performance_summary` for save rate and category trends.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listSessions, getSession, performanceSummary],
});
