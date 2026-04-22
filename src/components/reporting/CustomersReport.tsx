import { useMemo } from "react";
import { contacts, jobs, type Contact, type LifecycleState, type ContactType } from "@/data/mockData";

const lifecycleColors: Record<LifecycleState, string> = {
  Customer: "hsl(var(--success))",
  Lead: "hsl(var(--info))",
  Lapsed: "hsl(var(--warning))",
};

export function CustomersReport() {
  const m = useMemo(() => computeMetrics(), []);

  return (
    <div className="space-y-4">
      {/* KPI tiles */}
      <div className="grid grid-cols-4 gap-3">
        <Kpi label="Total customers" value={m.totalCustomers.toString()} sub={`${m.totalContacts} contacts in CRM`} />
        <Kpi label="Average LTV" value={`£${m.avgLtv.toLocaleString()}`} sub="Total spend ÷ paying customers" />
        <Kpi
          label="Top customer LTV"
          value={`£${m.topLtv.value.toLocaleString()}`}
          sub={m.topLtv.name}
          subTone="muted"
        />
        <Kpi
          label="Churn rate"
          value={`${m.churnRate.toFixed(0)}%`}
          sub={`${m.lapsedCount} lapsed of ${m.everCustomers} ever-customers`}
          subTone={m.churnRate > 25 ? "danger" : "muted"}
        />
      </div>

      <div className="grid grid-cols-4 gap-3">
        <Kpi label="Repeat-purchase rate" value={`${m.repeatRate.toFixed(0)}%`} sub={`${m.repeatCustomers} of ${m.totalCustomers} have ≥2 jobs`} />
        <Kpi label="Avg jobs per customer" value={m.avgJobsPerCustomer.toFixed(1)} sub="Lifetime jobs ÷ customers" />
        <Kpi label="Commercial revenue share" value={`${m.commercialShare.toFixed(0)}%`} sub={`£${m.commercialRevenue.toLocaleString()} of £${m.totalRevenue.toLocaleString()}`} />
        <Kpi label="New leads (active)" value={m.leadCount.toString()} sub="In pipeline, not yet won" />
      </div>

      {/* LTV distribution + Lifecycle donut */}
      <div className="grid grid-cols-3 gap-3">
        <div className="border-hairline rounded-lg bg-card p-5 col-span-2">
          <div className="text-sm font-medium mb-1">LTV distribution</div>
          <div className="text-xs text-muted-foreground mb-4">Customer count by lifetime spend bucket</div>
          <LtvHistogram buckets={m.ltvBuckets} />
        </div>
        <div className="border-hairline rounded-lg bg-card p-5">
          <div className="text-sm font-medium mb-1">Lifecycle mix</div>
          <div className="text-xs text-muted-foreground mb-4">Share of contacts by state</div>
          <LifecycleDonut data={m.lifecycleMix} total={m.totalContacts} />
        </div>
      </div>

      {/* Source breakdown + Residential vs Commercial */}
      <div className="grid grid-cols-2 gap-3">
        <div className="border-hairline rounded-lg bg-card p-5">
          <div className="text-sm font-medium mb-1">Revenue by acquisition source</div>
          <div className="text-xs text-muted-foreground mb-4">Lifetime spend grouped by lead source</div>
          <SourceBars data={m.revenueBySource} />
        </div>
        <div className="border-hairline rounded-lg bg-card p-5">
          <div className="text-sm font-medium mb-1">Residential vs Commercial</div>
          <div className="text-xs text-muted-foreground mb-4">Customers and revenue by contact type</div>
          <TypeBreakdown data={m.byType} />
        </div>
      </div>

      {/* Top customers table */}
      <div className="border-hairline rounded-lg bg-card">
        <div className="px-4 h-11 flex items-center border-b-hairline">
          <span className="text-sm font-medium">Top customers by LTV</span>
        </div>
        <div className="px-4 h-9 grid grid-cols-[2fr_1fr_1fr_80px_100px] items-center gap-3 border-b-hairline text-xs text-muted-foreground">
          <span>Customer</span>
          <span>Type</span>
          <span>Source</span>
          <span className="text-right">Jobs</span>
          <span className="text-right">LTV</span>
        </div>
        {m.topCustomers.map((c) => (
          <div
            key={c.id}
            className="px-4 h-11 grid grid-cols-[2fr_1fr_1fr_80px_100px] items-center gap-3 border-b-hairline last:border-b-0 text-sm"
          >
            <span className="truncate font-medium">{c.name}</span>
            <span className="text-muted-foreground text-xs">{c.type}</span>
            <span className="text-muted-foreground text-xs truncate">{c.source}</span>
            <span className="text-right tabular-nums">{c.jobsCount}</span>
            <span className="text-right tabular-nums font-medium">£{c.totalSpend.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------- Metrics -------------------- */

function computeMetrics() {
  const totalContacts = contacts.length;
  const customers = contacts.filter((c) => c.lifecycle === "Customer");
  const lapsed = contacts.filter((c) => c.lifecycle === "Lapsed");
  const leads = contacts.filter((c) => c.lifecycle === "Lead");
  const everCustomers = customers.length + lapsed.length;

  const totalRevenue = contacts.reduce((s, c) => s + c.totalSpend, 0);
  const payingCustomers = contacts.filter((c) => c.totalSpend > 0);
  const avgLtv = payingCustomers.length ? totalRevenue / payingCustomers.length : 0;

  const topLtvContact = [...contacts].sort((a, b) => b.totalSpend - a.totalSpend)[0];
  const topLtv = { name: topLtvContact?.name ?? "—", value: topLtvContact?.totalSpend ?? 0 };

  const churnRate = everCustomers ? (lapsed.length / everCustomers) * 100 : 0;

  // Jobs per customer
  const jobsByContact = new Map<string, number>();
  jobs.forEach((j) => jobsByContact.set(j.contactId, (jobsByContact.get(j.contactId) ?? 0) + 1));
  const totalJobsForCustomers = customers.reduce((s, c) => s + (jobsByContact.get(c.id) ?? 0), 0);
  const avgJobsPerCustomer = customers.length ? totalJobsForCustomers / customers.length : 0;
  const repeatCustomers = customers.filter((c) => (jobsByContact.get(c.id) ?? 0) >= 2).length;
  const repeatRate = customers.length ? (repeatCustomers / customers.length) * 100 : 0;

  // Commercial revenue share
  const commercialRevenue = contacts.filter((c) => c.type === "Commercial").reduce((s, c) => s + c.totalSpend, 0);
  const commercialShare = totalRevenue ? (commercialRevenue / totalRevenue) * 100 : 0;

  // LTV buckets
  const ranges: { label: string; min: number; max: number }[] = [
    { label: "£0", min: 0, max: 0 },
    { label: "£1–500", min: 1, max: 500 },
    { label: "£501–1k", min: 501, max: 1000 },
    { label: "£1k–2.5k", min: 1001, max: 2500 },
    { label: "£2.5k+", min: 2501, max: Infinity },
  ];
  const ltvBuckets = ranges.map((r) => ({
    label: r.label,
    count: contacts.filter((c) => c.totalSpend >= r.min && c.totalSpend <= r.max).length,
  }));

  // Lifecycle mix
  const lifecycleMix: { state: LifecycleState; count: number }[] = [
    { state: "Customer", count: customers.length },
    { state: "Lead", count: leads.length },
    { state: "Lapsed", count: lapsed.length },
  ];

  // Revenue by source
  const sourceMap = new Map<string, { revenue: number; count: number }>();
  contacts.forEach((c) => {
    const cur = sourceMap.get(c.source) ?? { revenue: 0, count: 0 };
    sourceMap.set(c.source, { revenue: cur.revenue + c.totalSpend, count: cur.count + 1 });
  });
  const revenueBySource = Array.from(sourceMap.entries())
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.revenue - a.revenue);

  // By type
  const byType: { type: ContactType; customers: number; revenue: number }[] = [
    {
      type: "Residential",
      customers: contacts.filter((c) => c.type === "Residential").length,
      revenue: contacts.filter((c) => c.type === "Residential").reduce((s, c) => s + c.totalSpend, 0),
    },
    {
      type: "Commercial",
      customers: contacts.filter((c) => c.type === "Commercial").length,
      revenue: commercialRevenue,
    },
  ];

  // Top customers (with job counts)
  const topCustomers = [...contacts]
    .filter((c) => c.totalSpend > 0)
    .sort((a, b) => b.totalSpend - a.totalSpend)
    .slice(0, 5)
    .map((c) => ({ ...c, jobsCount: jobsByContact.get(c.id) ?? 0 }));

  return {
    totalContacts,
    totalCustomers: customers.length,
    leadCount: leads.length,
    lapsedCount: lapsed.length,
    everCustomers,
    totalRevenue,
    avgLtv,
    topLtv,
    churnRate,
    repeatCustomers,
    repeatRate,
    avgJobsPerCustomer,
    commercialRevenue,
    commercialShare,
    ltvBuckets,
    lifecycleMix,
    revenueBySource,
    byType,
    topCustomers,
  };
}

/* -------------------- Charts -------------------- */

function LtvHistogram({ buckets }: { buckets: { label: string; count: number }[] }) {
  const max = Math.max(...buckets.map((b) => b.count), 1);
  return (
    <div>
      <div className="flex items-end gap-3 h-40">
        {buckets.map((b) => (
          <div key={b.label} className="flex-1 flex flex-col items-center gap-2">
            <div className="w-full flex items-end justify-center h-full">
              <div
                className="w-full max-w-12 rounded-t bg-primary/80 relative"
                style={{ height: b.count > 0 ? `${(b.count / max) * 100}%` : "2px" }}
              >
                {b.count > 0 && (
                  <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs tabular-nums text-muted-foreground">
                    {b.count}
                  </span>
                )}
              </div>
            </div>
            <span className="text-xs text-muted-foreground">{b.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LifecycleDonut({
  data,
  total,
}: {
  data: { state: LifecycleState; count: number }[];
  total: number;
}) {
  const filtered = data.filter((d) => d.count > 0);
  let cumulative = 0;
  const arcs = filtered.map((d) => {
    const value = total ? (d.count / total) * 100 : 0;
    const start = cumulative;
    cumulative += value;
    return { ...d, value, start, color: lifecycleColors[d.state] };
  });

  return (
    <div className="flex items-center gap-5">
      <svg width="120" height="120" viewBox="0 0 42 42">
        {arcs.map((s, i) => (
          <circle
            key={i}
            cx="21"
            cy="21"
            r="15.915"
            fill="transparent"
            stroke={s.color}
            strokeWidth="6"
            strokeDasharray={`${s.value} ${100 - s.value}`}
            strokeDashoffset={25 - s.start}
          />
        ))}
      </svg>
      <div className="space-y-2 text-sm flex-1">
        {data.map((d) => (
          <div key={d.state} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: lifecycleColors[d.state] }} />
            <span className="flex-1">{d.state}</span>
            <span className="font-medium tabular-nums">{d.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SourceBars({ data }: { data: { name: string; revenue: number; count: number }[] }) {
  const max = Math.max(...data.map((d) => d.revenue), 1);
  return (
    <div className="space-y-3">
      {data.map((d) => (
        <div key={d.name} className="space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="truncate">
              {d.name} <span className="text-muted-foreground text-xs">· {d.count}</span>
            </span>
            <span className="font-medium tabular-nums">£{d.revenue.toLocaleString()}</span>
          </div>
          <div className="h-1.5 bg-surface rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-primary/80"
              style={{ width: d.revenue > 0 ? `${(d.revenue / max) * 100}%` : "0%" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function TypeBreakdown({
  data,
}: {
  data: { type: ContactType; customers: number; revenue: number }[];
}) {
  const totalRev = data.reduce((s, d) => s + d.revenue, 0) || 1;
  const totalCust = data.reduce((s, d) => s + d.customers, 0) || 1;

  return (
    <div className="space-y-5">
      {data.map((d) => {
        const revPct = (d.revenue / totalRev) * 100;
        const custPct = (d.customers / totalCust) * 100;
        const color = d.type === "Commercial" ? "hsl(var(--info))" : "hsl(var(--primary))";
        return (
          <div key={d.type} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: color }} />
                {d.type}
              </span>
              <span className="text-muted-foreground text-xs tabular-nums">
                {d.customers} contacts · £{d.revenue.toLocaleString()}
              </span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-16">Customers</span>
                <div className="flex-1 h-1.5 bg-surface rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${custPct}%`, backgroundColor: color }} />
                </div>
                <span className="text-xs tabular-nums w-10 text-right">{custPct.toFixed(0)}%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-16">Revenue</span>
                <div className="flex-1 h-1.5 bg-surface rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${revPct}%`, backgroundColor: color }} />
                </div>
                <span className="text-xs tabular-nums w-10 text-right">{revPct.toFixed(0)}%</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Kpi({
  label,
  value,
  sub,
  subTone = "muted",
}: {
  label: string;
  value: string;
  sub: string;
  subTone?: "muted" | "danger" | "success";
}) {
  const subClass =
    subTone === "danger"
      ? "text-[hsl(var(--destructive))]"
      : subTone === "success"
      ? "text-[hsl(var(--success))]"
      : "text-muted-foreground";
  return (
    <div className="border-hairline rounded-lg bg-card p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-3xl font-medium mt-1.5 tabular-nums tracking-tight">{value}</div>
      <div className={`text-xs mt-1 truncate ${subClass}`}>{sub}</div>
    </div>
  );
}

// satisfy unused import lint by referencing Contact type indirectly
export type { Contact };
