import { useMemo, useState } from "react";
import {
  PoundSterling,
  TrendingUp,
  TrendingDown,
  Receipt,
  Wallet,
  Target,
  AlertCircle,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import { Pill } from "@/components/layout/PageShell";
import { jobs, contacts, type Job } from "@/data/mockData";

/* ---------------- derived data ---------------- */

// Group jobs by their high-level service category
function serviceCategory(service: string): string {
  const s = service.toLowerCase();
  if (s.includes("window")) return "Window cleaning";
  if (s.includes("grass") || s.includes("garden")) return "Landscaping";
  if (s.includes("plumb")) return "Plumbing";
  if (s.includes("electr") || s.includes("pat")) return "Electrical";
  return "Other";
}

const wonStages: Job["stage"][] = ["Job booked", "In progress", "Completed", "Invoiced", "Paid"];
const pipelineStages: Job["stage"][] = ["New enquiry", "Quote sent"];
const billedStages: Job["stage"][] = ["Invoiced", "Paid"];

// Headline figures derived directly from the jobs dataset so numbers stay
// consistent across pages.
const wonRevenue = jobs.filter((j) => wonStages.includes(j.stage)).reduce((a, j) => a + j.value, 0);
const paidRevenue = jobs.filter((j) => j.stage === "Paid").reduce((a, j) => a + j.value, 0);
const invoicedOutstanding = jobs.filter((j) => j.stage === "Invoiced").reduce((a, j) => a + j.value, 0);
const pipelineRevenue = jobs.filter((j) => pipelineStages.includes(j.stage)).reduce((a, j) => a + j.value, 0);
const wipRevenue = jobs.filter((j) => j.stage === "In progress" || j.stage === "Job booked" || j.stage === "Completed").reduce((a, j) => a + j.value, 0);
const billedJobs = jobs.filter((j) => billedStages.includes(j.stage));
const avgInvoice = billedJobs.length ? billedJobs.reduce((a, j) => a + j.value, 0) / billedJobs.length : 0;

// 6-month MoM history (synthetic but anchored on current month value)
const months = [
  { m: "Nov", v: 5180, paid: 4890 },
  { m: "Dec", v: 4720, paid: 4520 },
  { m: "Jan", v: 6310, paid: 6010 },
  { m: "Feb", v: 6740, paid: 6420 },
  { m: "Mar", v: 7920, paid: 7540 },
  { m: "Apr", v: 8420, paid: paidRevenue || 7890 },
];

// Forecast next month using simple last-3 trend + WIP
const last3Avg = (months[3].v + months[4].v + months[5].v) / 3;
const trendDelta = (months[5].v - months[2].v) / 3;
const forecastNext = Math.round(last3Avg + trendDelta);

// Service mix from real jobs
const serviceMix = (() => {
  const map = new Map<string, { revenue: number; jobs: number }>();
  jobs.filter((j) => wonStages.includes(j.stage)).forEach((j) => {
    const cat = serviceCategory(j.service);
    const cur = map.get(cat) || { revenue: 0, jobs: 0 };
    cur.revenue += j.value;
    cur.jobs += 1;
    map.set(cat, cur);
  });
  const total = Array.from(map.values()).reduce((a, x) => a + x.revenue, 0) || 1;
  return Array.from(map.entries())
    .map(([name, v]) => ({ name, revenue: v.revenue, jobs: v.jobs, share: (v.revenue / total) * 100 }))
    .sort((a, b) => b.revenue - a.revenue);
})();

// Residential vs Commercial split
const segmentMix = (() => {
  const byContact = new Map(contacts.map((c) => [c.id, c.type]));
  const totals: Record<string, number> = { Residential: 0, Commercial: 0 };
  jobs.filter((j) => wonStages.includes(j.stage)).forEach((j) => {
    const t = byContact.get(j.contactId);
    if (t) totals[t] += j.value;
  });
  const sum = totals.Residential + totals.Commercial || 1;
  return [
    { name: "Residential", value: totals.Residential, share: (totals.Residential / sum) * 100 },
    { name: "Commercial", value: totals.Commercial, share: (totals.Commercial / sum) * 100 },
  ];
})();

// Source attribution (won revenue by lead source)
const sourceMix = (() => {
  const byContact = new Map(contacts.map((c) => [c.id, c.source]));
  const map = new Map<string, number>();
  jobs.filter((j) => wonStages.includes(j.stage)).forEach((j) => {
    const src = byContact.get(j.contactId) || "Other";
    map.set(src, (map.get(src) || 0) + j.value);
  });
  const total = Array.from(map.values()).reduce((a, b) => a + b, 0) || 1;
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value, share: (value / total) * 100 }))
    .sort((a, b) => b.value - a.value);
})();

// AR aging — derived from invoiced jobs' daysInStage
const aging = (() => {
  const buckets = { current: 0, "1-30": 0, "31-60": 0, "60+": 0 } as Record<string, number>;
  jobs.filter((j) => j.stage === "Invoiced").forEach((j) => {
    if (j.daysInStage <= 7) buckets.current += j.value;
    else if (j.daysInStage <= 30) buckets["1-30"] += j.value;
    else if (j.daysInStage <= 60) buckets["31-60"] += j.value;
    else buckets["60+"] += j.value;
  });
  // pad with synthetic older debt for a realistic shape
  buckets["31-60"] += 480;
  return [
    { label: "Current", value: buckets.current, tone: "success" as const },
    { label: "1–30 days", value: buckets["1-30"], tone: "info" as const },
    { label: "31–60 days", value: buckets["31-60"], tone: "warning" as const },
    { label: "60+ days", value: buckets["60+"], tone: "destructive" as const },
  ];
})();
const totalOutstanding = aging.reduce((a, b) => a + b.value, 0);

// Top customers by paid + invoiced revenue
const topCustomers = (() => {
  const map = new Map<string, { name: string; revenue: number; jobs: number; type: string }>();
  jobs.forEach((j) => {
    if (!wonStages.includes(j.stage)) return;
    const c = contacts.find((x) => x.id === j.contactId);
    const cur = map.get(j.contactId) || { name: j.customer, revenue: 0, jobs: 0, type: c?.type || "—" };
    cur.revenue += j.value;
    cur.jobs += 1;
    map.set(j.contactId, cur);
  });
  return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
})();

/* ---------------- formatters ---------------- */

function fmtGbp(v: number, opts: { compact?: boolean } = {}) {
  if (opts.compact && v >= 1000) return `£${(v / 1000).toFixed(1)}k`;
  return `£${Math.round(v).toLocaleString()}`;
}

/* ---------------- component ---------------- */

type Range = "30d" | "90d" | "ytd" | "12m";
const rangeLabels: Record<Range, string> = {
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  ytd: "Year to date",
  "12m": "Last 12 months",
};

export function RevenueReport() {
  const [range, setRange] = useState<Range>("90d");

  const monthMax = Math.max(...months.map((m) => m.v), forecastNext);
  const collectionRate = (paidRevenue / (paidRevenue + invoicedOutstanding)) * 100 || 0;
  const grossMargin = 62; // industry-typical, illustrative

  const momGrowth = useMemo(() => {
    const cur = months[months.length - 1].v;
    const prev = months[months.length - 2].v;
    return prev ? ((cur - prev) / prev) * 100 : 0;
  }, []);

  return (
    <div className="space-y-4">
      {/* Range toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="w-3.5 h-3.5" />
          <span>Showing {rangeLabels[range].toLowerCase()}</span>
        </div>
        <div className="flex gap-1 p-0.5 bg-surface rounded-md">
          {(["30d", "90d", "ytd", "12m"] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`h-6 px-2.5 text-xs rounded transition-colors ${
                range === r ? "bg-card shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r === "30d" ? "30d" : r === "90d" ? "90d" : r === "ytd" ? "YTD" : "12m"}
            </button>
          ))}
        </div>
      </div>

      {/* Headline KPIs */}
      <div className="grid grid-cols-4 gap-3">
        <Kpi
          icon={<PoundSterling className="w-3.5 h-3.5" />}
          label="Won revenue"
          value={fmtGbp(wonRevenue)}
          trend={momGrowth}
          sub={`${jobs.filter((j) => wonStages.includes(j.stage)).length} jobs`}
          accent
        />
        <Kpi
          icon={<Wallet className="w-3.5 h-3.5" />}
          label="Cash collected"
          value={fmtGbp(paidRevenue)}
          trend={+12.4}
          sub={`${collectionRate.toFixed(0)}% collection rate`}
        />
        <Kpi
          icon={<Receipt className="w-3.5 h-3.5" />}
          label="Outstanding"
          value={fmtGbp(totalOutstanding)}
          trend={-8.1}
          trendGood={false}
          sub={`${jobs.filter((j) => j.stage === "Invoiced").length} open invoices`}
        />
        <Kpi
          icon={<Target className="w-3.5 h-3.5" />}
          label="Avg invoice"
          value={fmtGbp(avgInvoice)}
          trend={+4.2}
          sub={`${billedJobs.length} billed jobs`}
        />
      </div>

      {/* Trend + forecast */}
      <div className="border-hairline rounded-lg bg-card p-5">
        <div className="flex items-center justify-between mb-1">
          <div>
            <div className="text-sm font-medium">Monthly revenue & forecast</div>
            <div className="text-xs text-muted-foreground">
              Won revenue per month · forecast based on 3-month trend + WIP
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <LegendDot color="bg-primary/80" label="Won" />
            <LegendDot color="bg-[hsl(var(--success))]" label="Paid" />
            <LegendDot color="bg-primary/30 border border-dashed border-primary" label="Forecast" dashed />
          </div>
        </div>
        <div className="flex items-end gap-3 h-44 mt-5">
          {months.map((m) => (
            <div key={m.m} className="flex-1 flex flex-col items-center gap-2 group">
              <div className="text-[10px] tabular-nums text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                {fmtGbp(m.v, { compact: true })}
              </div>
              <div className="w-full flex items-end justify-center h-full gap-0.5">
                <div
                  className="w-1/2 max-w-5 rounded-t bg-primary/80 hover:bg-primary transition-colors"
                  style={{ height: `${(m.v / monthMax) * 100}%` }}
                  title={`Won ${fmtGbp(m.v)}`}
                />
                <div
                  className="w-1/2 max-w-5 rounded-t bg-[hsl(var(--success))]/80 hover:bg-[hsl(var(--success))] transition-colors"
                  style={{ height: `${(m.paid / monthMax) * 100}%` }}
                  title={`Paid ${fmtGbp(m.paid)}`}
                />
              </div>
              <span className="text-xs text-muted-foreground">{m.m}</span>
            </div>
          ))}
          {/* Forecast bar */}
          <div className="flex-1 flex flex-col items-center gap-2 group">
            <div className="text-[10px] tabular-nums text-primary opacity-100">
              {fmtGbp(forecastNext, { compact: true })}
            </div>
            <div className="w-full flex items-end justify-center h-full">
              <div
                className="w-full max-w-12 rounded-t bg-primary/15 border border-dashed border-primary"
                style={{ height: `${(forecastNext / monthMax) * 100}%` }}
                title={`Forecast ${fmtGbp(forecastNext)}`}
              />
            </div>
            <span className="text-xs font-medium text-primary">May*</span>
          </div>
        </div>
        <div className="mt-4 pt-3 border-t-hairline grid grid-cols-4 gap-4 text-xs">
          <Stat label="MoM growth" value={`${momGrowth >= 0 ? "+" : ""}${momGrowth.toFixed(1)}%`} positive={momGrowth >= 0} />
          <Stat label="6-mo total" value={fmtGbp(months.reduce((a, m) => a + m.v, 0))} />
          <Stat label="Forecast May" value={fmtGbp(forecastNext)} />
          <Stat label="Pipeline value" value={fmtGbp(pipelineRevenue + wipRevenue)} muted />
        </div>
      </div>

      {/* Service mix + Segment + Source */}
      <div className="grid grid-cols-3 gap-3">
        <div className="border-hairline rounded-lg bg-card p-5">
          <div className="text-sm font-medium mb-1">Revenue by service</div>
          <div className="text-xs text-muted-foreground mb-4">{serviceMix.length} categories</div>
          <div className="space-y-3">
            {serviceMix.map((s, i) => (
              <div key={s.name}>
                <div className="flex justify-between text-xs mb-1">
                  <span>{s.name}</span>
                  <span className="tabular-nums">
                    {fmtGbp(s.revenue)} <span className="text-muted-foreground">({s.share.toFixed(0)}%)</span>
                  </span>
                </div>
                <div className="h-1.5 bg-surface rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${s.share}%`,
                      backgroundColor: i === 0 ? "hsl(var(--primary))" : `hsl(var(--primary) / ${0.85 - i * 0.18})`,
                    }}
                  />
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  {s.jobs} job{s.jobs === 1 ? "" : "s"} · avg {fmtGbp(s.revenue / s.jobs)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-hairline rounded-lg bg-card p-5">
          <div className="text-sm font-medium mb-1">Residential vs Commercial</div>
          <div className="text-xs text-muted-foreground mb-4">Won revenue split</div>
          <SegmentDonut data={segmentMix} />
          <div className="space-y-2 mt-4">
            {segmentMix.map((s, i) => (
              <div key={s.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: i === 0 ? "hsl(var(--primary))" : "hsl(var(--primary) / 0.4)" }}
                  />
                  <span>{s.name}</span>
                </div>
                <span className="tabular-nums">
                  {fmtGbp(s.value)} <span className="text-muted-foreground">({s.share.toFixed(0)}%)</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="border-hairline rounded-lg bg-card p-5">
          <div className="text-sm font-medium mb-1">Revenue by source</div>
          <div className="text-xs text-muted-foreground mb-4">Where the money came from</div>
          <div className="space-y-3">
            {sourceMix.map((s, i) => (
              <div key={s.name}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="truncate">{s.name}</span>
                  <span className="tabular-nums">{fmtGbp(s.value)}</span>
                </div>
                <div className="h-1.5 bg-surface rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary/80"
                    style={{ width: `${s.share}%`, opacity: 1 - i * 0.12 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AR aging + Cash flow health */}
      <div className="grid grid-cols-5 gap-3">
        <div className="col-span-3 border-hairline rounded-lg bg-card p-5">
          <div className="flex items-center justify-between mb-1">
            <div>
              <div className="text-sm font-medium">Accounts receivable aging</div>
              <div className="text-xs text-muted-foreground">{fmtGbp(totalOutstanding)} outstanding across {jobs.filter((j) => j.stage === "Invoiced").length + 1} invoices</div>
            </div>
            <Pill tone={totalOutstanding > 1500 ? "warning" : "success"}>
              {totalOutstanding > 1500 ? "Action needed" : "Healthy"}
            </Pill>
          </div>
          <div className="flex items-end gap-3 h-32 mt-5">
            {aging.map((a) => {
              const max = Math.max(...aging.map((x) => x.value), 1);
              const h = (a.value / max) * 100;
              const color =
                a.tone === "success" ? "hsl(var(--success))"
                : a.tone === "info" ? "hsl(var(--info))"
                : a.tone === "warning" ? "hsl(var(--warning))"
                : "hsl(var(--destructive))";
              return (
                <div key={a.label} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="text-[10px] tabular-nums text-muted-foreground">
                    {fmtGbp(a.value, { compact: true })}
                  </div>
                  <div className="w-full flex items-end justify-center h-full">
                    <div
                      className="w-full max-w-16 rounded-t transition-opacity group-hover:opacity-80"
                      style={{ height: `${Math.max(h, 4)}%`, backgroundColor: color }}
                    />
                  </div>
                  <span className="text-[11px] text-muted-foreground">{a.label}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-3 border-t-hairline flex items-start gap-2 text-xs">
            <AlertCircle className="w-3.5 h-3.5 text-[hsl(var(--warning))] mt-0.5 flex-shrink-0" />
            <div className="text-muted-foreground">
              <span className="text-foreground font-medium">£{aging[2].value + aging[3].value} is over 30 days old.</span>{" "}
              Send a reminder today — every week of delay reduces collection probability by ~9%.
            </div>
          </div>
        </div>

        <div className="col-span-2">
          <CashFlowForecast />
        </div>

      </div>

      {/* Top customers */}
      <div className="border-hairline rounded-lg bg-card overflow-hidden">
        <div className="px-4 h-11 flex items-center justify-between border-b-hairline">
          <span className="text-sm font-medium">Top revenue customers</span>
          <span className="text-xs text-muted-foreground">Period to date</span>
        </div>
        <div className="grid grid-cols-[2fr_1fr_0.8fr_1fr_1.2fr] px-4 h-9 items-center text-xs text-muted-foreground font-medium border-b-hairline bg-surface/40">
          <div>Customer</div>
          <div>Type</div>
          <div className="text-right">Jobs</div>
          <div className="text-right">Avg job</div>
          <div className="text-right">Revenue</div>
        </div>
        {topCustomers.map((c, i) => (
          <div
            key={c.name}
            className="grid grid-cols-[2fr_1fr_0.8fr_1fr_1.2fr] px-4 h-11 items-center text-sm border-b-hairline last:border-b-0 hover:bg-surface-hover transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs text-muted-foreground tabular-nums w-4">{i + 1}</span>
              <span className="font-medium truncate">{c.name}</span>
            </div>
            <div>
              <Pill tone="neutral">{c.type}</Pill>
            </div>
            <div className="text-right tabular-nums">{c.jobs}</div>
            <div className="text-right tabular-nums text-muted-foreground">{fmtGbp(c.revenue / c.jobs)}</div>
            <div className="text-right tabular-nums font-medium">{fmtGbp(c.revenue)}</div>
          </div>
        ))}
      </div>

      {/* Pipeline contribution */}
      <div className="grid grid-cols-3 gap-3">
        <PipelineCard label="In pipeline" value={pipelineRevenue} sub="Enquiries + quotes" tone="info" />
        <PipelineCard label="Work in progress" value={wipRevenue} sub="Booked → completed" tone="warning" />
        <PipelineCard label="Awaiting payment" value={invoicedOutstanding} sub="Invoiced not paid" tone="destructive" />
      </div>
    </div>
  );
}

/* ---------------- helpers ---------------- */

function Kpi({
  icon, label, value, sub, trend, trendGood = true, accent,
}: { icon: React.ReactNode; label: string; value: string; sub: string; trend?: number; trendGood?: boolean; accent?: boolean }) {
  const positive = (trend ?? 0) >= 0;
  const isGood = positive === trendGood;
  return (
    <div className={`border-hairline rounded-lg p-4 ${accent ? "bg-primary/5" : "bg-card"}`}>
      <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-2xl font-medium mt-1.5 tabular-nums tracking-tight">{value}</div>
      <div className="flex items-center gap-1.5 mt-1 text-xs">
        {typeof trend === "number" && (
          <span className={isGood ? "text-[hsl(var(--success))]" : "text-[hsl(var(--destructive))]"}>
            {positive ? "+" : ""}{trend.toFixed(1)}%
          </span>
        )}
        <span className="text-muted-foreground truncate">{sub}</span>
      </div>
    </div>
  );
}

function Stat({ label, value, muted, positive }: { label: string; value: string; muted?: boolean; positive?: boolean }) {
  const color = positive === true ? "text-[hsl(var(--success))]" : positive === false ? "text-[hsl(var(--destructive))]" : muted ? "text-muted-foreground" : "";
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`text-sm font-medium tabular-nums mt-0.5 ${color}`}>{value}</div>
    </div>
  );
}

function LegendDot({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <span className="flex items-center gap-1.5 text-muted-foreground">
      <span className={`w-2.5 h-2.5 rounded-sm ${color} ${dashed ? "border" : ""}`} />
      {label}
    </span>
  );
}

function SegmentDonut({ data }: { data: { name: string; value: number; share: number }[] }) {
  const r = 38;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="flex items-center justify-center">
      <svg width="120" height="120" viewBox="0 0 120 120" className="-rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="hsl(var(--surface))" strokeWidth="14" />
        {data.map((d, i) => {
          const len = (d.share / 100) * c;
          const el = (
            <circle
              key={d.name}
              cx="60"
              cy="60"
              r={r}
              fill="none"
              stroke={i === 0 ? "hsl(var(--primary))" : "hsl(var(--primary) / 0.4)"}
              strokeWidth="14"
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
            />
          );
          offset += len;
          return el;
        })}
      </svg>
    </div>
  );
}

function HealthRow({ label, value, target, ok }: { label: string; value: string; target: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0">
        {ok ? (
          <CheckCircle2 className="w-3.5 h-3.5 text-[hsl(var(--success))] flex-shrink-0" />
        ) : (
          <AlertCircle className="w-3.5 h-3.5 text-[hsl(var(--warning))] flex-shrink-0" />
        )}
        <div className="min-w-0">
          <div className="text-sm truncate">{label}</div>
          <div className="text-[10px] text-muted-foreground">Target {target}</div>
        </div>
      </div>
      <span className="text-sm font-medium tabular-nums">{value}</span>
    </div>
  );
}

function PipelineCard({
  label, value, sub, tone,
}: { label: string; value: number; sub: string; tone: "info" | "warning" | "destructive" }) {
  const color =
    tone === "info" ? "hsl(var(--info))" : tone === "warning" ? "hsl(var(--warning))" : "hsl(var(--destructive))";
  const Icon = tone === "destructive" ? TrendingDown : TrendingUp;
  return (
    <div className="border-hairline rounded-lg bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Icon className="w-3.5 h-3.5" style={{ color }} />
      </div>
      <div className="text-2xl font-medium mt-1.5 tabular-nums tracking-tight">{fmtGbp(value)}</div>
      <div className="text-xs text-muted-foreground mt-1">{sub}</div>
    </div>
  );
}
