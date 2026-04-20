import { useState } from "react";
import { PageHeader, PageBody, Btn, Pill } from "@/components/layout/PageShell";
import { Plus, Zap } from "lucide-react";
import { campaigns, automations } from "@/data/mockData";

export default function Email() {
  const [tab, setTab] = useState<"campaigns" | "automations">("campaigns");

  return (
    <>
      <PageHeader
        title="Email marketing"
        description="Send campaigns and run automated journeys"
        actions={<Btn variant="primary"><Plus className="w-3.5 h-3.5" /> {tab === "campaigns" ? "New campaign" : "New automation"}</Btn>}
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
          <div className="border-hairline rounded-lg bg-card overflow-hidden">
            <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_0.8fr_0.8fr_0.6fr] px-4 h-9 items-center text-xs text-muted-foreground font-medium border-b-hairline bg-surface/50">
              <div>Campaign</div><div>Segment</div><div>Status</div><div>Send date</div><div className="text-right">Open</div><div className="text-right">Click</div><div className="text-right">Jobs</div>
            </div>
            {campaigns.map((c) => (
              <div key={c.id} className="grid grid-cols-[2fr_1.5fr_1fr_1fr_0.8fr_0.8fr_0.6fr] px-4 h-10 items-center text-sm border-b-hairline last:border-b-0 hover:bg-surface-hover transition-colors">
                <div className="font-medium truncate">{c.name}</div>
                <div className="text-muted-foreground truncate">{c.segment}</div>
                <div>
                  <Pill tone={c.status === "Sent" ? "success" : c.status === "Scheduled" ? "warning" : "neutral"}>
                    {c.status}
                  </Pill>
                </div>
                <div className="text-muted-foreground tabular-nums">{c.sendDate}</div>
                <div className="text-right tabular-nums">{c.openRate ? `${c.openRate}%` : "—"}</div>
                <div className="text-right tabular-nums">{c.clickRate ? `${c.clickRate}%` : "—"}</div>
                <div className="text-right tabular-nums font-medium">{c.jobs || "—"}</div>
              </div>
            ))}
          </div>
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
