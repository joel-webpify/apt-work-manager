import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "app_info",
  title: "App info",
  description:
    "Describes the ServiceCRM app and the modules available: CRM (contacts, jobs & pipeline, quotes & invoices, forms), Marketing (Google Business, social organic/paid, email, Google Ads), Automations (workflows, sequences), and Analytics.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => {
    const info = {
      name: "ServiceCRM",
      modules: {
        crm: ["contacts", "jobs & pipeline", "quotes & invoices", "forms"],
        marketing: [
          "google business profile",
          "social organic",
          "social paid",
          "email",
          "google ads",
        ],
        automations: ["workflows", "sequences"],
        analytics: ["reporting", "tracking"],
      },
      note: "Data is currently held in the browser; wire tools to Cloud tables to expose real records over MCP.",
    };
    return {
      content: [{ type: "text", text: JSON.stringify(info, null, 2) }],
      structuredContent: info,
    };
  },
});
