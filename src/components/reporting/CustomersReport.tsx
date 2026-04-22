import { useMemo, useState } from "react";
import {
  contacts,
  jobs,
  stageColors,
  type Contact,
  type LifecycleState,
  type ContactType,
  type Job,
  type PipelineStage,
} from "@/data/mockData";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Pill } from "@/components/layout/PageShell";
import { X } from "lucide-react";

type Segment = "All" | ContactType;

const lifecycleColors: Record<LifecycleState, string> = {
  Customer: "hsl(var(--success))",
  Lead: "hsl(var(--info))",
  Lapsed: "hsl(var(--warning))",
};

const segmentLabel: Record<Segment, string> = {
  All: "All customers",
  Residential: "Residential",
  Commercial: "Commercial",
};

export function CustomersReport() {
  const [segment, setSegment] = useState<Segment>("All");
  const [openContactId, setOpenContactId] = useState<string | null>(null);

  const m = useMemo(() => computeMetrics(segment), [segment]);
  const openContact = openContactId ? contacts.find((c) => c.id === openContactId) ?? null : null;

  return (
    <div className="space-y-4">
      {/* Segment toggle */}
      <div className="flex items-center justify-between">
        <SegmentToggle value={segment} onChange={setSegment} />
        <span className="text-xs text-muted-foreground">
          Showing <span className="text-foreground font-medium">{segmentLabel[segment]}</span> · {m.scopeContactCount} contacts
        </span>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-4 gap-3">
        <Kpi label="Total customers" value={m.totalCustomers.toString()} sub={`${m.scopeContactCount} contacts in segment`} />
        <Kpi label="Average LTV" value={`£${formatNum(m.avgLtv)}`} sub="Total spend ÷ paying customers" />
        <Kpi
          label="Top customer LTV"
          value={`£${m.topLtv.value.toLocaleString()}`}
          sub={m.topLtv.name}
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
        <Kpi
          label={segment === "Commercial" ? "Total revenue" : "Commercial revenue share"}
          value={
            segment === "All"
              ? `${m.commercialShare.toFixed(0)}%`
              : `£${m.totalRevenue.toLocaleString()}`
          }
          sub={
            segment === "All"
              ? `£${m.commercialRevenue.toLocaleString()} of £${m.totalRevenue.toLocaleString()}`
              : "Lifetime spend in this segment"
          }
        />
        <Kpi label="New leads (active)" value={m.leadCount.toString()} sub="In pipeline, not yet won" />
      </div>

      {/* LTV distribution + Lifecycle donut */}
      <div className="grid grid-cols-3 gap-3">
        <div className="border-hairline rounded-lg bg-card p-5 col-span-2">
          <div className="text-sm font-medium mb-1">LTV distribution</div>
          <div className="text-xs text-muted-foreground mb-4">
            Customer count by lifetime spend bucket — {segmentLabel[segment]}
          </div>
          <LtvHistogram buckets={m.ltvBuckets} />
        </div>
        <div className="border-hairline rounded-lg bg-card p-5">
          <div className="text-sm font-medium mb-1">Lifecycle mix</div>
          <div className="text-xs text-muted-foreground mb-4">Share of contacts by state</div>
          <LifecycleDonut data={m.lifecycleMix} total={m.scopeContactCount} />
        </div>
      </div>

      {/* Source breakdown + Residential vs Commercial (only on All) */}
      <div className={`grid ${segment === "All" ? "grid-cols-2" : "grid-cols-1"} gap-3`}>
        <div className="border-hairline rounded-lg bg-card p-5">
          <div className="text-sm font-medium mb-1">Revenue by acquisition source</div>
          <div className="text-xs text-muted-foreground mb-4">
            Lifetime spend grouped by lead source — {segmentLabel[segment]}
          </div>
          <SourceBars data={m.revenueBySource} />
        </div>
        {segment === "All" && (
          <div className="border-hairline rounded-lg bg-card p-5">
            <div className="text-sm font-medium mb-1">Residential vs Commercial</div>
            <div className="text-xs text-muted-foreground mb-4">Customers and revenue by contact type</div>
            <TypeBreakdown data={m.byType} />
          </div>
        )}
      </div>

      {/* Top customers table — clickable */}
      <div className="border-hairline rounded-lg bg-card">
        <div className="px-4 h-11 flex items-center border-b-hairline">
          <span className="text-sm font-medium">Top customers by LTV</span>
          <span className="ml-2 text-xs text-muted-foreground">— click a row to view history</span>
        </div>
        <div className="px-4 h-9 grid grid-cols-[2fr_1fr_1fr_80px_100px] items-center gap-3 border-b-hairline text-xs text-muted-foreground">
          <span>Customer</span>
          <span>Type</span>
          <span>Source</span>
          <span className="text-right">Jobs</span>
          <span className="text-right">LTV</span>
        </div>
        {m.topCustomers.length === 0 ? (
          <div className="px-4 py-8 text-sm text-muted-foreground text-center">
            No customers in this segment yet
          </div>
        ) : (
          m.topCustomers.map((c) => (
            <button
              key={c.id}
              onClick={() => setOpenContactId(c.id)}
              className="w-full text-left px-4 h-11 grid grid-cols-[2fr_1fr_1fr_80px_100px] items-center gap-3 border-b-hairline last:border-b-0 text-sm hover:bg-surface-hover transition-colors"
            >
              <span className="truncate font-medium">{c.name}</span>
              <span className="text-muted-foreground text-xs">{c.type}</span>
              <span className="text-muted-foreground text-xs truncate">{c.source}</span>
              <span className="text-right tabular-nums">{c.jobsCount}</span>
              <span className="text-right tabular-nums font-medium">£{c.totalSpend.toLocaleString()}</span>
            </button>
          ))
        )}
      </div>

      <Sheet open={!!openContact} onOpenChange={(o) => !o && setOpenContactId(null)}>
        <SheetContent className="p-0 w-full sm:max-w-2xl flex flex-col">
          {openContact && <CustomerDrawer contact={openContact} onClose={() => setOpenContactId(null)} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

/* -------------------- Segment toggle -------------------- */

function SegmentToggle({ value, onChange }: { value: Segment; onChange: (v: Segment) => void }) {
  const options: Segment[] = ["All", "Residential", "Commercial"];
  return (
    <div className="inline-flex border-hairline rounded-md p-0.5 bg-card">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`h-7 px-3 text-xs rounded transition-colors ${
            value === opt
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {opt === "All" ? "All" : opt}
        </button>
      ))}
    </div>
  );
}

/* -------------------- Metrics -------------------- */

function computeMetrics(segment: Segment) {
  const scope = segment === "All" ? contacts : contacts.filter((c) => c.type === segment);
  const scopeContactCount = scope.length;

  const customers = scope.filter((c) => c.lifecycle === "Customer");
  const lapsed = scope.filter((c) => c.lifecycle === "Lapsed");
  const leads = scope.filter((c) => c.lifecycle === "Lead");
  const everCustomers = customers.length + lapsed.length;

  const totalRevenue = scope.reduce((s, c) => s + c.totalSpend, 0);
  const payingCustomers = scope.filter((c) => c.totalSpend > 0);
  const avgLtv = payingCustomers.length ? totalRevenue / payingCustomers.length : 0;

  const topLtvContact = [...scope].sort((a, b) => b.totalSpend - a.totalSpend)[0];
  const topLtv = { name: topLtvContact?.name ?? "—", value: topLtvContact?.totalSpend ?? 0 };

  const churnRate = everCustomers ? (lapsed.length / everCustomers) * 100 : 0;

  const jobsByContact = new Map<string, number>();
  jobs.forEach((j) => jobsByContact.set(j.contactId, (jobsByContact.get(j.contactId) ?? 0) + 1));
  const totalJobsForCustomers = customers.reduce((s, c) => s + (jobsByContact.get(c.id) ?? 0), 0);
  const avgJobsPerCustomer = customers.length ? totalJobsForCustomers / customers.length : 0;
  const repeatCustomers = customers.filter((c) => (jobsByContact.get(c.id) ?? 0) >= 2).length;
  const repeatRate = customers.length ? (repeatCustomers / customers.length) * 100 : 0;

  // Commercial share is always relative to entire CRM (used only on "All" view)
  const allRevenue = contacts.reduce((s, c) => s + c.totalSpend, 0);
  const commercialRevenue = contacts.filter((c) => c.type === "Commercial").reduce((s, c) => s + c.totalSpend, 0);
  const commercialShare = allRevenue ? (commercialRevenue / allRevenue) * 100 : 0;

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
    count: scope.filter((c) => c.totalSpend >= r.min && c.totalSpend <= r.max).length,
  }));

  const lifecycleMix: { state: LifecycleState; count: number }[] = [
    { state: "Customer", count: customers.length },
    { state: "Lead", count: leads.length },
    { state: "Lapsed", count: lapsed.length },
  ];

  const sourceMap = new Map<string, { revenue: number; count: number }>();
  scope.forEach((c) => {
    const cur = sourceMap.get(c.source) ?? { revenue: 0, count: 0 };
    sourceMap.set(c.source, { revenue: cur.revenue + c.totalSpend, count: cur.count + 1 });
  });
  const revenueBySource = Array.from(sourceMap.entries())
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.revenue - a.revenue);

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

  const topCustomers = [...scope]
    .filter((c) => c.totalSpend > 0)
    .sort((a, b) => b.totalSpend - a.totalSpend)
    .slice(0, 5)
    .map((c) => ({ ...c, jobsCount: jobsByContact.get(c.id) ?? 0 }));

  return {
    scopeContactCount,
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

/* -------------------- Customer drawer -------------------- */

function CustomerDrawer({ contact, onClose }: { contact: Contact; onClose: () => void }) {
  const customerJobs = useMemo(
    () => jobs.filter((j) => j.contactId === contact.id),
    [contact.id],
  );

  // Service mix
  const serviceMix = useMemo(() => {
    const map = new Map<string, { count: number; revenue: number }>();
    customerJobs.forEach((j) => {
      const key = serviceCategory(j.service);
      const cur = map.get(key) ?? { count: 0, revenue: 0 };
      map.set(key, { count: cur.count + 1, revenue: cur.revenue + j.value });
    });
    return Array.from(map.entries())
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [customerJobs]);

  const totalJobsValue = customerJobs.reduce((s, j) => s + j.value, 0);
  const wonValue = customerJobs
    .filter((j) => j.stage === "Paid" || j.stage === "Invoiced" || j.stage === "Completed")
    .reduce((s, j) => s + j.value, 0);

  // Sort jobs into a timeline (stage progression order)
  const stageOrder: PipelineStage[] = [
    "Paid",
    "Invoiced",
    "Completed",
    "In progress",
    "Job booked",
    "Quote sent",
    "New enquiry",
  ];
  const timeline = [...customerJobs].sort(
    (a, b) => stageOrder.indexOf(a.stage) - stageOrder.indexOf(b.stage),
  );

  return (
    <>
      <div className="px-6 h-16 border-b-hairline flex items-center justify-between shrink-0">
        <div className="min-w-0">
          <div className="text-base font-medium truncate">{contact.name}</div>
          <div className="text-xs text-muted-foreground mt-0.5 truncate">
            {contact.type} · {contact.lifecycle} · {contact.source} · {contact.postcode}
          </div>
        </div>
        <button
          onClick={onClose}
          className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-surface-hover text-muted-foreground shrink-0"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Customer KPIs */}
        <div className="grid grid-cols-4 gap-4 pb-5 border-b-hairline">
          <DrawerStat label="Lifetime value" value={`£${contact.totalSpend.toLocaleString()}`} />
          <DrawerStat label="Total jobs" value={customerJobs.length.toString()} />
          <DrawerStat label="Won revenue" value={`£${wonValue.toLocaleString()}`} />
          <DrawerStat label="Pipeline value" value={`£${(totalJobsValue - wonValue).toLocaleString()}`} />
        </div>

        {/* Service mix */}
        <div>
          <div className="text-sm font-medium mb-1">Service mix</div>
          <div className="text-xs text-muted-foreground mb-3">Associated service types and revenue</div>
          {serviceMix.length === 0 ? (
            <div className="border-hairline rounded-lg bg-card p-6 text-sm text-muted-foreground text-center">
              No jobs recorded for this customer
            </div>
          ) : (
            <ServiceMix data={serviceMix} />
          )}
        </div>

        {/* Timeline */}
        <div>
          <div className="text-sm font-medium mb-1">Job history timeline</div>
          <div className="text-xs text-muted-foreground mb-3">
            Ordered from completed → in pipeline ({timeline.length} {timeline.length === 1 ? "job" : "jobs"})
          </div>
          {timeline.length === 0 ? (
            <div className="border-hairline rounded-lg bg-card p-6 text-sm text-muted-foreground text-center">
              No job history yet
            </div>
          ) : (
            <Timeline jobs={timeline} />
          )}
        </div>

        {contact.notes && (
          <div className="border-hairline rounded-lg bg-card p-4">
            <div className="text-xs text-muted-foreground mb-1">Notes</div>
            <div className="text-sm">{contact.notes}</div>
          </div>
        )}
      </div>
    </>
  );
}

function ServiceMix({ data }: { data: { name: string; count: number; revenue: number }[] }) {
  const max = Math.max(...data.map((d) => d.revenue), 1);
  return (
    <div className="space-y-3">
      {data.map((d) => (
        <div key={d.name} className="space-y-1.5">
          <div className="flex justify-between text-sm">
            <span>
              {d.name} <span className="text-muted-foreground text-xs">· {d.count} {d.count === 1 ? "job" : "jobs"}</span>
            </span>
            <span className="font-medium tabular-nums">£{d.revenue.toLocaleString()}</span>
          </div>
          <div className="h-1.5 bg-surface rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-primary/80"
              style={{ width: `${(d.revenue / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function Timeline({ jobs: jobList }: { jobs: Job[] }) {
  return (
    <div className="relative pl-5">
      <div className="absolute left-1.5 top-1 bottom-1 w-px bg-border" />
      <div className="space-y-4">
        {jobList.map((j) => (
          <div key={j.id} className="relative">
            <span
              className="absolute -left-[18px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-background"
              style={{ backgroundColor: stageColors[j.stage] }}
            />
            <div className="border-hairline rounded-lg bg-card p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{j.service}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 truncate">{j.address}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-medium tabular-nums">£{j.value.toLocaleString()}</div>
                  <div className="mt-1">
                    <Pill tone={j.stage === "Paid" || j.stage === "Completed" ? "success" : "info"}>
                      {j.stage}
                    </Pill>
                  </div>
                </div>
              </div>
              {j.notes && (
                <div className="text-xs text-muted-foreground mt-2 border-t-hairline pt-2">{j.notes}</div>
              )}
              <div className="text-xs text-muted-foreground mt-2 tabular-nums">
                {j.daysInStage} {j.daysInStage === 1 ? "day" : "days"} in {j.stage}
                {j.invoiceId && <> · {j.invoiceId}</>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DrawerStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-medium tabular-nums mt-0.5">{value}</div>
    </div>
  );
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
  if (data.length === 0) {
    return <div className="text-sm text-muted-foreground">No source data in this segment.</div>;
  }
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

/* -------------------- Helpers -------------------- */

function formatNum(n: number): string {
  return Math.round(n).toLocaleString();
}

function serviceCategory(service: string): string {
  // Service strings look like "Plumbing — leak repair" — group by the part before the dash
  const idx = service.indexOf("—");
  return (idx > -1 ? service.slice(0, idx) : service).trim();
}
