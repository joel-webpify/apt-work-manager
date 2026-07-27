import { useMemo, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  Target,
  Layers,
  Activity,
  ArrowRight,
  X,
  Filter,
} from "lucide-react";
import { Pill, StatusDot } from "@/components/layout/PageShell";
import { LeadVelocityCard } from "@/components/reporting/LeadVelocityCard";

import {
  jobs as allJobs,
  contacts,
  stages,
  stageColors,
  type Job,
  type PipelineStage,
} from "@/data/mockData";

/* ---------------- types & config ---------------- */

type Range = "30d" | "90d" | "YTD" | "12m";

// Stuck thresholds — how long a job sits before we flag it
const stuckThresholds: Record<PipelineStage, number> = {
  "New enquiry": 2,
  "Quote sent": 4,
  "Job booked": 7,
  "In progress": 5,
  Completed: 2,
  Invoiced: 14,
  Paid: 999,
};

// Funnel stages collapse the pipeline into the steps that matter for conversion
const funnelDef: { key: string; label: string; stages: PipelineStage[] }[] = [
  { key: "enquiry", label: "Enquiries", stages: ["New enquiry", "Quote sent", "Job booked", "In progress", "Completed", "Invoiced", "Paid"] },
  { key: "quoted", label: "Quoted", stages: ["Quote sent", "Job booked", "In progress", "Completed", "Invoiced", "Paid"] },
  { key: "booked", label: "Booked", stages: ["Job booked", "In progress", "Completed", "Invoiced", "Paid"] },
  { key: "completed", label: "Completed", stages: ["Completed", "Invoiced", "Paid"] },
  { key: "paid", label: "Paid", stages: ["Paid"] },
];

/* ---------------- helpers ---------------- */

const fmt = (n: number) => `£${n.toLocaleString()}`;
const pct = (n: number) => `${n.toFixed(1)}%`;


/* ---------------- main ---------------- */

export function PipelineReport() {
  const [range, setRange] = useState<Range>("30d");
  const [drawer, setDrawer] = useState<{ title: string; subtitle: string; jobs: Job[] } | null>(null);

  // For now mock data is a single snapshot, so range is a presentation control
  // — wiring the toggle so the UX is real even if values don't change.
  const jobs = allJobs;

  const m = useMemo(() => {
    const total = jobs.length;
    const openStages: PipelineStage[] = ["New enquiry", "Quote sent", "Job booked", "In progress", "Completed", "Invoiced"];
    const open = jobs.filter((j) => openStages.includes(j.stage));
    const won = jobs.filter((j) => ["Job booked", "In progress", "Completed", "Invoiced", "Paid"].includes(j.stage));
    const lostable = jobs.filter((j) => ["Quote sent", "New enquiry"].includes(j.stage));

    const pipelineValue = open.reduce((a, j) => a + j.value, 0);
    const wonValue = won.reduce((a, j) => a + j.value, 0);
    const winRate = (jobs.filter((j) => j.stage !== "New enquiry").length > 0)
      ? (won.length / (won.length + lostable.length)) * 100
      : 0;
    const avgCycle = jobs.reduce((a, j) => a + j.daysInStage, 0) / Math.max(1, total);
    const stuck = jobs.filter((j) => j.daysInStage >= (stuckThresholds[j.stage] ?? 5) && j.stage !== "Paid");
    const avgDeal = won.length ? won.reduce((a, j) => a + j.value, 0) / won.length : 0;

    // Per-stage counts, value, avg days
    const byStage = stages.map((s) => {
      const list = jobs.filter((j) => j.stage === s);
      const value = list.reduce((a, j) => a + j.value, 0);
      const avgDays = list.length ? list.reduce((a, j) => a + j.daysInStage, 0) / list.length : 0;
      return { stage: s, count: list.length, value, avgDays, jobs: list };
    });

    // Funnel
    const funnel = funnelDef.map((f) => {
      const list = jobs.filter((j) => f.stages.includes(j.stage));
      return { ...f, count: list.length, value: list.reduce((a, j) => a + j.value, 0), jobs: list };
    });

    // Source attribution → revenue & conversion
    const sources = new Map<string, { enquiries: number; won: number; revenue: number }>();
    jobs.forEach((j) => {
      const c = contacts.find((c) => c.id === j.contactId);
      const src = c?.source ?? "Unknown";
      const cur = sources.get(src) ?? { enquiries: 0, won: 0, revenue: 0 };
      cur.enquiries += 1;
      if (["Job booked", "In progress", "Completed", "Invoiced", "Paid"].includes(j.stage)) {
        cur.won += 1;
        cur.revenue += j.value;
      }
      sources.set(src, cur);
    });
    const sourceList = Array.from(sources.entries())
      .map(([source, v]) => ({ source, ...v, conv: (v.won / v.enquiries) * 100 }))
      .sort((a, b) => b.revenue - a.revenue);

    return { total, pipelineValue, wonValue, winRate, avgCycle, stuck, avgDeal, byStage, funnel, sourceList };
  }, [jobs]);

  const openDrawerForStage = (s: PipelineStage) => {
    const list = m.byStage.find((x) => x.stage === s)?.jobs ?? [];
    setDrawer({ title: s, subtitle: `${list.length} jobs · ${fmt(list.reduce((a, j) => a + j.value, 0))} value`, jobs: list });
  };

  return (
    <div className="space-y-4">
      {/* Range toggle */}
      <div className="flex items-center justify-between -mt-1">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Activity className="w-3.5 h-3.5" /> Live pipeline metrics
        </div>
        <div className="inline-flex border-hairline rounded-md p-0.5 bg-card">
          {(["30d", "90d", "YTD", "12m"] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`h-7 px-2.5 text-xs rounded ${
                range === r ? "bg-surface-hover text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-4 gap-3">
        <Kpi
          icon={<Layers className="w-3.5 h-3.5" />}
          label="Pipeline value"
          value={fmt(m.pipelineValue)}
          sub={`${m.byStage.filter((s) => !["Paid"].includes(s.stage)).reduce((a, s) => a + s.count, 0)} open jobs`}
          trend={{ dir: "up", text: "+12.4% vs prev" }}
        />
        <Kpi
          icon={<Target className="w-3.5 h-3.5" />}
          label="Win rate"
          value={pct(m.winRate)}
          sub="Quote → booking"
          trend={{ dir: "up", text: "+3.1pp" }}
        />
        <Kpi
          icon={<Clock className="w-3.5 h-3.5" />}
          label="Avg cycle time"
          value={`${m.avgCycle.toFixed(1)}d`}
          sub="Enquiry → paid"
          trend={{ dir: "down", text: "−0.6d" }}
        />
        <Kpi
          icon={<AlertTriangle className="w-3.5 h-3.5" />}
          label="Stuck jobs"
          value={String(m.stuck.length)}
          sub={`${fmt(m.stuck.reduce((a, j) => a + j.value, 0))} at risk`}
          trend={{ dir: m.stuck.length > 3 ? "up" : "down", text: m.stuck.length > 3 ? "Needs attention" : "Healthy", warn: m.stuck.length > 3 }}
        />
      </div>

      {/* Funnel + Stage bar */}
      <div className="grid grid-cols-5 gap-3">
        <div className="col-span-3 border-hairline rounded-lg bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-medium">From enquiry to paid job</div>
            <span className="text-xs text-muted-foreground">Click a stage to view jobs</span>
          </div>
          <div className="space-y-2.5">
            {m.funnel.map((f, i) => {
              const max = m.funnel[0].count || 1;
              const conv = i === 0 ? 100 : (f.count / m.funnel[i - 1].count) * 100;
              return (
                <div key={f.key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-foreground font-medium">{f.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground tabular-nums">{fmt(f.value)}</span>
                      {i > 0 && (
                        <Pill tone={conv >= 70 ? "success" : conv >= 50 ? "warning" : "danger"}>
                          {conv.toFixed(0)}%
                        </Pill>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setDrawer({ title: f.label, subtitle: `${f.count} jobs · ${fmt(f.value)}`, jobs: f.jobs })}
                    className="block w-full h-7 bg-surface rounded relative overflow-hidden hover:bg-surface-hover transition-colors text-left"
                  >
                    <div
                      className="h-full rounded flex items-center px-2.5 text-xs font-medium text-primary-foreground"
                      style={{
                        width: `${(f.count / max) * 100}%`,
                        backgroundColor: i === m.funnel.length - 1 ? "hsl(var(--success))" : i >= 2 ? "hsl(var(--warning))" : "hsl(var(--info))",
                      }}
                    >
                      {f.count}
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="col-span-2 border-hairline rounded-lg bg-card p-5">
          <div className="text-sm font-medium mb-1">Value by stage</div>
          <div className="text-xs text-muted-foreground mb-4">Where your money is sitting</div>
          <div className="space-y-2">
            {m.byStage
              .filter((s) => s.stage !== "Paid")
              .map((s) => {
                const max = Math.max(...m.byStage.map((x) => x.value), 1);
                return (
                  <button
                    key={s.stage}
                    onClick={() => openDrawerForStage(s.stage)}
                    className="w-full text-left group"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <StatusDot color={stageColors[s.stage]} />
                      <span className="text-xs">{s.stage}</span>
                      <span className="ml-auto text-xs tabular-nums text-muted-foreground">{fmt(s.value)}</span>
                    </div>
                    <div className="h-1.5 bg-surface rounded overflow-hidden">
                      <div
                        className="h-full rounded transition-all group-hover:opacity-80"
                        style={{ width: `${(s.value / max) * 100}%`, backgroundColor: stageColors[s.stage] }}
                      />
                    </div>
                  </button>
                );
              })}
          </div>
        </div>
      </div>

      {/* Stage performance table */}
      <div className="border-hairline rounded-lg bg-card overflow-hidden">
        <div className="px-5 py-3.5 border-b-hairline flex items-center justify-between">
          <div className="text-sm font-medium">How long jobs sit at each stage</div>
          <span className="text-xs text-muted-foreground">Average days, and when that is too long</span>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-surface/50">
            <tr className="text-xs text-muted-foreground">
              <th className="text-left font-medium px-5 py-2.5">Stage</th>
              <th className="text-right font-medium px-3 py-2.5">Jobs</th>
              <th className="text-right font-medium px-3 py-2.5">Value</th>
              <th className="text-right font-medium px-3 py-2.5">Avg days</th>
              <th className="text-right font-medium px-3 py-2.5">Threshold</th>
              <th className="text-right font-medium px-5 py-2.5">Health</th>
            </tr>
          </thead>
          <tbody>
            {m.byStage.map((s) => {
              const threshold = stuckThresholds[s.stage];
              const ratio = s.avgDays / threshold;
              const tone: "success" | "warning" | "danger" = ratio < 0.7 ? "success" : ratio < 1 ? "warning" : "danger";
              const label = ratio < 0.7 ? "On track" : ratio < 1 ? "Watch" : "Bottleneck";
              return (
                <tr
                  key={s.stage}
                  onClick={() => openDrawerForStage(s.stage)}
                  className="border-t-hairline hover:bg-surface-hover cursor-pointer transition-colors"
                >
                  <td className="px-5 py-2.5">
                    <div className="flex items-center gap-2">
                      <StatusDot color={stageColors[s.stage]} />
                      <span>{s.stage}</span>
                    </div>
                  </td>
                  <td className="text-right tabular-nums px-3">{s.count}</td>
                  <td className="text-right tabular-nums px-3">{fmt(s.value)}</td>
                  <td className="text-right tabular-nums px-3">{s.avgDays.toFixed(1)}d</td>
                  <td className="text-right tabular-nums px-3 text-muted-foreground">{threshold}d</td>
                  <td className="text-right px-5">
                    <Pill tone={tone}>{label}</Pill>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Source attribution + Bottleneck */}
      <div className="grid grid-cols-5 gap-3">
        <div className="col-span-3 border-hairline rounded-lg bg-card p-5">
          <div className="text-sm font-medium mb-1">Source → revenue</div>
          <div className="text-xs text-muted-foreground mb-4">Which channels turn into paid work</div>
          <div className="space-y-3">
            {m.sourceList.map((s) => {
              const max = Math.max(...m.sourceList.map((x) => x.revenue), 1);
              return (
                <div key={s.source}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium">{s.source}</span>
                    <div className="flex items-center gap-3 text-muted-foreground tabular-nums">
                      <span>{s.enquiries} enquiries</span>
                      <span>·</span>
                      <span>{s.conv.toFixed(0)}% won</span>
                      <span>·</span>
                      <span className="text-foreground font-medium">{fmt(s.revenue)}</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-surface rounded overflow-hidden">
                    <div
                      className="h-full bg-primary rounded"
                      style={{ width: `${(s.revenue / max) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="col-span-2">
          <LeadVelocityCard />
        </div>

      </div>

      {/* Stuck jobs table */}
      <div className="border-hairline rounded-lg bg-card overflow-hidden">
        <div className="px-5 py-3.5 border-b-hairline flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-[hsl(var(--warning))]" />
            <span className="text-sm font-medium">Jobs that need chasing</span>
            <Pill tone="warning">{m.stuck.length}</Pill>
          </div>
          <button className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
            <Filter className="w-3 h-3" /> All stages
          </button>
        </div>
        {m.stuck.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No stuck jobs — pipeline is healthy.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface/50">
              <tr className="text-xs text-muted-foreground">
                <th className="text-left font-medium px-5 py-2.5">Customer</th>
                <th className="text-left font-medium px-3 py-2.5">Service</th>
                <th className="text-left font-medium px-3 py-2.5">Stage</th>
                <th className="text-right font-medium px-3 py-2.5">Value</th>
                <th className="text-right font-medium px-3 py-2.5">Days</th>
                <th className="text-right font-medium px-5 py-2.5">Action</th>
              </tr>
            </thead>
            <tbody>
              {m.stuck
                .sort((a, b) => b.daysInStage / stuckThresholds[b.stage] - a.daysInStage / stuckThresholds[a.stage])
                .map((j) => {
                  const over = j.daysInStage - stuckThresholds[j.stage];
                  return (
                    <tr
                      key={j.id}
                      onClick={() => setDrawer({ title: j.customer, subtitle: `${j.service} · ${j.stage}`, jobs: [j] })}
                      className="border-t-hairline hover:bg-surface-hover cursor-pointer transition-colors"
                    >
                      <td className="px-5 py-2.5 font-medium">{j.customer}</td>
                      <td className="px-3 text-muted-foreground truncate max-w-[200px]">{j.service}</td>
                      <td className="px-3">
                        <div className="flex items-center gap-1.5">
                          <StatusDot color={stageColors[j.stage]} />
                          <span className="text-xs">{j.stage}</span>
                        </div>
                      </td>
                      <td className="text-right tabular-nums px-3">{fmt(j.value)}</td>
                      <td className="text-right tabular-nums px-3">
                        <span className={over >= 3 ? "text-[hsl(var(--destructive))]" : "text-[hsl(var(--warning))]"}>
                          {j.daysInStage}d
                        </span>
                      </td>
                      <td className="text-right px-5">
                        <span className="text-xs text-primary inline-flex items-center gap-1">
                          {actionForStage(j.stage)} <ArrowRight className="w-3 h-3" />
                        </span>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        )}
      </div>

      {drawer && <JobsDrawer {...drawer} onClose={() => setDrawer(null)} />}
    </div>
  );
}

/* ---------------- helpers / sub-components ---------------- */

function actionForStage(s: PipelineStage): string {
  switch (s) {
    case "New enquiry": return "Send quote";
    case "Quote sent": return "Follow up";
    case "Job booked": return "Confirm date";
    case "In progress": return "Update status";
    case "Completed": return "Send invoice";
    case "Invoiced": return "Chase payment";
    default: return "Review";
  }
}

function Kpi({
  icon,
  label,
  value,
  sub,
  trend,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  trend: { dir: "up" | "down"; text: string; warn?: boolean };
}) {
  const TrendIcon = trend.dir === "up" ? TrendingUp : TrendingDown;
  const tone = trend.warn ? "text-[hsl(var(--destructive))]" : trend.dir === "up" ? "text-[hsl(var(--success))]" : "text-[hsl(var(--success))]";
  return (
    <div className="border-hairline rounded-lg bg-card p-4">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-2xl font-medium tabular-nums mt-2 tracking-tight">{value}</div>
      <div className="flex items-center justify-between mt-1">
        <span className="text-xs text-muted-foreground">{sub}</span>
        <span className={`text-xs inline-flex items-center gap-0.5 ${tone}`}>
          <TrendIcon className="w-3 h-3" /> {trend.text}
        </span>
      </div>
    </div>
  );
}

function JobsDrawer({
  title,
  subtitle,
  jobs,
  onClose,
}: {
  title: string;
  subtitle: string;
  jobs: Job[];
  onClose: () => void;
}) {
  const total = jobs.reduce((a, j) => a + j.value, 0);
  return (
    <>
      <div className="fixed inset-0 bg-black/25 z-40 animate-fade-in" onClick={onClose} />
      <aside className="fixed top-0 right-0 h-screen w-[480px] bg-background border-l-hairline z-50 flex flex-col animate-slide-in-right">
        <header className="h-14 px-5 flex items-center justify-between border-b-hairline shrink-0">
          <div>
            <div className="text-sm font-medium">{title}</div>
            <div className="text-xs text-muted-foreground">{subtitle}</div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-surface-hover">
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="border-hairline rounded-md p-3">
              <div className="text-xs text-muted-foreground">Jobs</div>
              <div className="text-lg font-medium tabular-nums">{jobs.length}</div>
            </div>
            <div className="border-hairline rounded-md p-3">
              <div className="text-xs text-muted-foreground">Value</div>
              <div className="text-lg font-medium tabular-nums">{fmt(total)}</div>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            {jobs.map((j) => {
              const threshold = stuckThresholds[j.stage] ?? 5;
              const stuck = j.daysInStage >= threshold && j.stage !== "Paid";
              return (
                <div key={j.id} className="border-hairline rounded-md p-3 hover:bg-surface-hover transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{j.customer}</div>
                      <div className="text-xs text-muted-foreground truncate mt-0.5">{j.service}</div>
                    </div>
                    <div className="text-sm font-medium tabular-nums">{fmt(j.value)}</div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-1.5">
                      <StatusDot color={stageColors[j.stage]} />
                      <span className="text-xs">{j.stage}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className={`text-xs ${stuck ? "text-[hsl(var(--destructive))]" : "text-muted-foreground"}`}>
                      {j.daysInStage}d in stage
                    </span>
                    {stuck && (
                      <Pill tone="warning">{actionForStage(j.stage)}</Pill>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </aside>
    </>
  );
}
