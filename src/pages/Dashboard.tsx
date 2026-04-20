import { PageHeader, PageBody, Btn, StatusDot } from "@/components/layout/PageShell";
import { Plus, UserPlus, Mail, ArrowUpRight } from "lucide-react";
import { jobs, stages, stageColors } from "@/data/mockData";

export default function Dashboard() {
  const cards = [
    { label: "Jobs this week", value: "12", delta: "+3 vs last week" },
    { label: "Revenue this month", value: "£8,420", delta: "+18% vs last month" },
    { label: "Open quotes", value: "6", delta: "£4,210 in pipeline" },
    { label: "Conversion rate", value: "42%", delta: "Quote → booking" },
  ];

  const stageCounts = stages.map((s) => ({
    stage: s,
    count: jobs.filter((j) => j.stage === s).length,
  }));

  const recent = jobs.slice(0, 5);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Overview of your business this week"
        actions={
          <>
            <Btn><Plus className="w-3.5 h-3.5" strokeWidth={2} /> New job</Btn>
            <Btn><UserPlus className="w-3.5 h-3.5" strokeWidth={2} /> New contact</Btn>
            <Btn variant="primary"><Mail className="w-3.5 h-3.5" strokeWidth={2} /> Send campaign</Btn>
          </>
        }
      />
      <PageBody>
        <div className="grid grid-cols-4 gap-3 mb-6">
          {cards.map((c) => (
            <div key={c.label} className="border-hairline rounded-lg p-4 bg-card">
              <div className="text-xs text-muted-foreground">{c.label}</div>
              <div className="text-2xl font-medium mt-1.5 tracking-tight">{c.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{c.delta}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2 border-hairline rounded-lg bg-card">
            <div className="px-4 h-11 flex items-center justify-between border-b-hairline">
              <span className="text-sm font-medium">Pipeline summary</span>
              <span className="text-xs text-muted-foreground">{jobs.length} active jobs</span>
            </div>
            <div className="p-4 space-y-2.5">
              {stageCounts.map((s) => (
                <div key={s.stage} className="flex items-center gap-3">
                  <StatusDot color={stageColors[s.stage]} />
                  <span className="text-sm flex-1">{s.stage}</span>
                  <span className="text-sm font-medium tabular-nums">{s.count}</span>
                  <div className="w-32 h-1 bg-surface rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(s.count / jobs.length) * 100}%`, backgroundColor: stageColors[s.stage] }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-hairline rounded-lg bg-card">
            <div className="px-4 h-11 flex items-center border-b-hairline">
              <span className="text-sm font-medium">Top lead source</span>
            </div>
            <div className="p-4">
              <div className="text-2xl font-medium tracking-tight">Google Ads</div>
              <div className="text-sm text-muted-foreground mt-1">14 leads this month</div>
              <div className="mt-4 space-y-2 text-sm">
                {[
                  { name: "Google Ads", count: 14 },
                  { name: "Referral", count: 9 },
                  { name: "Website form", count: 7 },
                  { name: "Local Service Ads", count: 5 },
                ].map((s) => (
                  <div key={s.name} className="flex justify-between">
                    <span className="text-muted-foreground">{s.name}</span>
                    <span className="font-medium tabular-nums">{s.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 border-hairline rounded-lg bg-card">
          <div className="px-4 h-11 flex items-center justify-between border-b-hairline">
            <span className="text-sm font-medium">Recent activity</span>
            <Btn variant="ghost" className="h-7">View all <ArrowUpRight className="w-3 h-3" /></Btn>
          </div>
          <div>
            {recent.map((j) => (
              <div key={j.id} className="px-4 h-10 flex items-center gap-3 border-b-hairline last:border-b-0 hover:bg-surface-hover transition-colors">
                <StatusDot color={stageColors[j.stage]} />
                <span className="text-sm font-medium w-48 truncate">{j.customer}</span>
                <span className="text-sm text-muted-foreground flex-1 truncate">{j.service}</span>
                <span className="text-xs text-muted-foreground">{j.stage}</span>
                <span className="text-sm font-medium tabular-nums w-20 text-right">£{j.value}</span>
              </div>
            ))}
          </div>
        </div>
      </PageBody>
    </>
  );
}
