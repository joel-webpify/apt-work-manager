import { useState } from "react";
import { PageHeader, PageBody, Btn, Pill } from "@/components/layout/PageShell";
import { Plus, Zap } from "lucide-react";
import { automations } from "@/data/mockData";
import { CampaignsTab } from "@/components/email/CampaignsTab";

export default function Email() {
  const [tab, setTab] = useState<"campaigns" | "automations">("campaigns");

  return (
    <>
      <PageHeader
        title="Email marketing"
        description="Send campaigns and run automated journeys"
        actions={
          tab === "automations" ? (
            <Btn variant="primary">
              <Plus className="w-3.5 h-3.5" /> New automation
            </Btn>
          ) : null
        }
      />
      <PageBody>
        <div className="flex border-b-hairline mb-4 -mt-2">
          {(["campaigns", "automations"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`h-9 px-3 text-sm capitalize border-b-2 -mb-px transition-colors ${
                tab === t ? "border-primary text-foreground font-medium" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "campaigns" ? (
          <CampaignsTab />
        ) : (
          <div className="space-y-2">
            {automations.map((a) => (
              <div key={a.id} className="border-hairline rounded-lg bg-card p-4 flex items-center gap-4">
                <div className="w-9 h-9 rounded-md bg-surface flex items-center justify-center">
                  <Zap className="w-4 h-4 text-muted-foreground" strokeWidth={1.75} />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{a.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Trigger: {a.trigger} · {a.steps} steps
                  </div>
                </div>
                <Pill tone={a.active ? "success" : "neutral"}>{a.active ? "On" : "Off"}</Pill>
                <button
                  className={`relative w-9 h-5 rounded-full transition-colors ${a.active ? "bg-primary" : "bg-surface border-hairline"}`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${a.active ? "translate-x-4" : "translate-x-0.5"}`}
                  />
                </button>
              </div>
            ))}
          </div>
        )}
      </PageBody>
    </>
  );
}
