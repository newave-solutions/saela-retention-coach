// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { mcpPlugin } from "@lovable.dev/mcp-js/stacks/tanstack/vite";

// Deployment target resolution:
//  - Lovable Cloud: Lovable injects VITE_SUPABASE_* and pins the Cloudflare nitro preset.
//  - Vercel: nitro auto-detects the VERCEL env; VITE_SUPABASE_* fall back to SUPABASE_*
//    so the browser bundle points at the same Supabase / Lovable Cloud backend.
for (const key of ["URL", "PUBLISHABLE_KEY", "PROJECT_ID"]) {
  const viteKey = `VITE_SUPABASE_${key}`;
  const value = process.env[`SUPABASE_${key}`];
  if (!process.env[viteKey] && value) process.env[viteKey] = value;
}

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    plugins: [mcpPlugin()],
  },
});
