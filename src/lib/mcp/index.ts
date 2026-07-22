import { auth, defineMcp } from "@lovable.dev/mcp-js";
import whoamiTool from "./tools/whoami";
import appInfoTool from "./tools/app-info";

// The OAuth issuer must be the direct Supabase host, built from the project
// ref that Vite inlines at build time. Never derive it from SUPABASE_URL.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "servicecrm-mcp",
  title: "ServiceCRM",
  version: "0.1.0",
  instructions:
    "Tools for the ServiceCRM app. Use `whoami` to confirm the signed-in user and `app_info` to discover the app's modules.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [whoamiTool, appInfoTool],
});
