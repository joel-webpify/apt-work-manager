import { useMemo, useState } from "react";
import { Mail, MousePointerClick, FileText, Briefcase, TrendingUp, TrendingDown, Calendar, Send, X, CheckCircle2, AlertTriangle, Lightbulb, ArrowRight } from "lucide-react";
import { Pill } from "@/components/layout/PageShell";
import { Sheet, SheetContent } from "@/components/ui/sheet";

// Email-marketing-specific synthetic dataset built from existing campaigns,
// extended with the funnel metrics that matter most for email performance.
type CampaignStatus = "Sent" | "Scheduled" | "Draft";

interface EmailCampaign {
  id: string;
  name: string;
  segment: string;
  status: CampaignStatus;
  sendDate: string;
  sent: number;
  delivered: number;
  opens: number;
  clicks: number;
  formSubmits: number;
  jobsBooked: number;
  revenue: number;
  unsubscribes: number;
  bounces: number;
  type: "Promo" | "Reminder" | "Win-back" | "Newsletter";
}

const emailCampaigns: EmailCampaign[] = [
  {
    id: "ec1",
    name: "Spring window cleaning offer",
    segment: "Residential — Bristol BS",
    status: "Sent",
    sendDate: "08 Apr 2026",
    sent: 1240,
    delivered: 1218,
    opens: 515,
    clicks: 83,
    formSubmits: 31,
    jobsBooked: 14,
    revenue: 2180,
    unsubscribes: 4,
    bounces: 22,
    type: "Promo",
  },
  {
    id: "ec2",
    name: "Lapsed customer win-back",
    segment: "No job in 12+ months",
    status: "Sent",
    sendDate: "01 Apr 2026",
    sent: 312,
    delivered: 305,
    opens: 168,
    clicks: 41,
    formSubmits: 18,
    jobsBooked: 9,
    revenue: 890,
    unsubscribes: 2,
    bounces: 7,
    type: "Win-back",
  },
  {
    id: "ec3",
    name: "Annual electrical safety reminder",
    segment: "Past electrical customers",
    status: "Sent",
    sendDate: "24 Mar 2026",
    sent: 184,
    delivered: 182,
    opens: 102,
    clicks: 28,
    formSubmits: 12,
    jobsBooked: 7,
    revenue: 1340,
    unsubscribes: 1,
    bounces: 2,
    type: "Reminder",
  },
  {
    id: "ec4",
    name: "March newsletter — local jobs",
    segment: "All subscribers",
    status: "Sent",
    sendDate: "15 Mar 2026",
    sent: 1580,
    delivered: 1551,
    opens: 412,
    clicks: 38,
    formSubmits: 9,
    jobsBooked: 3,
    revenue: 410,
    unsubscribes: 11,
    bounces: 29,
    type: "Newsletter",
  },
  {
    id: "ec5",
    name: "Artificial grass — early summer",
    segment: "Past quote, no booking",
    status: "Scheduled",
    sendDate: "24 Apr 2026",
    sent: 0, delivered: 0, opens: 0, clicks: 0, formSubmits: 0, jobsBooked: 0, revenue: 0, unsubscribes: 0, bounces: 0,
    type: "Promo",
  },
];

const sent = emailCampaigns.filter((c) => c.status === "Sent");

function pct(num: number, den: number) {
  return den > 0 ? (num / den) * 100 : 0;
}

function fmtPct(v: number, digits = 1) {
  return `${v.toFixed(digits)}%`;
}

function fmtCurrency(v: number) {
  return `£${v.toLocaleString()}`;
}

const totals = sent.reduce(
  (a, c) => ({
    sent: a.sent + c.sent,
    delivered: a.delivered + c.delivered,
    opens: a.opens + c.opens,
    clicks: a.clicks + c.clicks,
    formSubmits: a.formSubmits + c.formSubmits,
    jobsBooked: a.jobsBooked + c.jobsBooked,
    revenue: a.revenue + c.revenue,
    unsubscribes: a.unsubscribes + c.unsubscribes,
    bounces: a.bounces + c.bounces,
  }),
  { sent: 0, delivered: 0, opens: 0, clicks: 0, formSubmits: 0, jobsBooked: 0, revenue: 0, unsubscribes: 0, bounces: 0 },
);

// Trend series: last 6 weeks of email activity (synthetic but consistent)
const weeklyTrend = [
  { wk: "W11", opens: 32, clicks: 5.2, jobs: 2 },
  { wk: "W12", opens: 36, clicks: 5.9, jobs: 3 },
  { wk: "W13", opens: 41, clicks: 6.4, jobs: 4 },
  { wk: "W14", opens: 39, clicks: 6.1, jobs: 5 },
  { wk: "W15", opens: 44, clicks: 7.2, jobs: 7 },
  { wk: "W16", opens: 47, clicks: 7.8, jobs: 9 },
];

// Best send-time heatmap (open-rate %) — 4 day buckets x 4 time buckets
const sendTimes = [
  { day: "Mon", slots: [22, 31, 38, 26] },
  { day: "Tue", slots: [28, 41, 44, 30] },
  { day: "Wed", slots: [30, 39, 42, 28] },
  { day: "Thu", slots: [27, 36, 40, 31] },
  { day: "Fri", slots: [21, 29, 33, 24] },
  { day: "Sat", slots: [18, 24, 22, 17] },
  { day: "Sun", slots: [16, 21, 19, 15] },
];
const timeBuckets = ["6–10am", "10am–2pm", "2–6pm", "6–10pm"];

// Subject-line tests
const subjectTests = [
  { subject: "Your spring window clean — 15% off this month", opens: 47.2, clicks: 8.9, winner: true },
  { subject: "Time for a sparkle? Spring offers inside", opens: 38.4, clicks: 6.1, winner: false },
  { subject: "Don't miss your annual safety check", opens: 55.4, clicks: 15.2, winner: true },
  { subject: "Reminder: book your electrical safety check", opens: 42.1, clicks: 9.4, winner: false },
];

export function EmailMarketingReport() {
  const [activeMetric, setActiveMetric] = useState<"opens" | "clicks" | "jobs">("opens");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const overallOpenRate = pct(totals.opens, totals.delivered);
  const overallClickRate = pct(totals.clicks, totals.delivered);
  const ctor = pct(totals.clicks, totals.opens); // click-to-open
  const submitRate = pct(totals.formSubmits, totals.clicks);
  const bookRate = pct(totals.jobsBooked, totals.formSubmits);
  const revenuePerEmail = totals.delivered ? totals.revenue / totals.delivered : 0;
  const unsubRate = pct(totals.unsubscribes, totals.delivered);
  const bounceRate = pct(totals.bounces, totals.sent);

  const ranked = useMemo(
    () =>
      [...sent]
        .map((c) => ({
          ...c,
          openRate: pct(c.opens, c.delivered),
          clickRate: pct(c.clicks, c.delivered),
          bookRate: pct(c.jobsBooked, c.formSubmits),
          revenuePerEmail: c.delivered ? c.revenue / c.delivered : 0,
        }))
        .sort((a, b) => b.revenue - a.revenue),
    [],
  );

  const best = ranked[0];
  const worst = [...ranked].sort((a, b) => a.openRate - b.openRate)[0];

  return (
    <div className="space-y-4">
      {/* Headline KPIs */}
      <div className="grid grid-cols-4 gap-3">
        <Kpi
          icon={<Mail className="w-3.5 h-3.5" />}
          label="Open rate"
          value={fmtPct(overallOpenRate)}
          sub={`${totals.opens.toLocaleString()} of ${totals.delivered.toLocaleString()} delivered`}
          trend={+3.2}
        />
        <Kpi
          icon={<MousePointerClick className="w-3.5 h-3.5" />}
          label="Click-to-open"
          value={fmtPct(ctor)}
          sub={`${totals.clicks} clicks`}
          trend={+1.4}
        />
        <Kpi
          icon={<FileText className="w-3.5 h-3.5" />}
          label="Form submits"
          value={totals.formSubmits.toString()}
          sub={`${fmtPct(submitRate)} of clicks`}
          trend={+5.1}
        />
        <Kpi
          icon={<Briefcase className="w-3.5 h-3.5" />}
          label="Jobs booked"
          value={totals.jobsBooked.toString()}
          sub={`${fmtCurrency(totals.revenue)} revenue`}
          trend={+12.3}
          accent
        />
      </div>

      {/* Funnel + Trend */}
      <div className="grid grid-cols-5 gap-3">
        <div className="col-span-2 border-hairline rounded-lg bg-card p-5">
          <div className="text-sm font-medium mb-1">Email engagement funnel</div>
          <div className="text-xs text-muted-foreground mb-4">
            From send to job booked · last {sent.length} campaigns
          </div>
          <FunnelStep label="Delivered" value={totals.delivered} of={totals.sent} />
          <FunnelStep label="Opened" value={totals.opens} of={totals.delivered} />
          <FunnelStep label="Clicked" value={totals.clicks} of={totals.delivered} />
          <FunnelStep label="Form submitted" value={totals.formSubmits} of={totals.delivered} />
          <FunnelStep label="Job booked" value={totals.jobsBooked} of={totals.delivered} highlight />
          <div className="mt-4 pt-3 border-t-hairline grid grid-cols-3 gap-2 text-xs">
            <Stat label="Revenue / email" value={`£${revenuePerEmail.toFixed(2)}`} />
            <Stat label="Submit → book" value={fmtPct(bookRate, 0)} />
            <Stat label="Unsub rate" value={fmtPct(unsubRate, 2)} muted />
          </div>
        </div>

        <div className="col-span-3 border-hairline rounded-lg bg-card p-5">
          <div className="flex items-center justify-between mb-1">
            <div>
              <div className="text-sm font-medium">Performance trend</div>
              <div className="text-xs text-muted-foreground">Last 6 weeks</div>
            </div>
            <div className="flex gap-1 p-0.5 bg-surface rounded-md">
              {(["opens", "clicks", "jobs"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setActiveMetric(m)}
                  className={`h-6 px-2.5 text-xs rounded capitalize transition-colors ${
                    activeMetric === m ? "bg-card shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {m === "opens" ? "Open %" : m === "clicks" ? "Click %" : "Jobs"}
                </button>
              ))}
            </div>
          </div>
          <TrendChart data={weeklyTrend} metric={activeMetric} />
        </div>
      </div>

      {/* Campaign performance table */}
      <div className="border-hairline rounded-lg bg-card overflow-hidden">
        <div className="px-4 h-11 flex items-center justify-between border-b-hairline">
          <span className="text-sm font-medium">Campaign performance · ranked by revenue</span>
          <span className="text-xs text-muted-foreground">{ranked.length} sent campaigns</span>
        </div>
        <div className="grid grid-cols-[2fr_1fr_0.7fr_0.7fr_0.7fr_0.7fr_0.8fr_0.9fr] px-4 h-9 items-center text-xs text-muted-foreground font-medium border-b-hairline bg-surface/40">
          <div>Campaign</div>
          <div>Type</div>
          <div className="text-right">Open</div>
          <div className="text-right">Click</div>
          <div className="text-right">Submits</div>
          <div className="text-right">Jobs</div>
          <div className="text-right">Book %</div>
          <div className="text-right">Revenue</div>
        </div>
        {ranked.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setSelectedId(c.id)}
            className="w-full text-left grid grid-cols-[2fr_1fr_0.7fr_0.7fr_0.7fr_0.7fr_0.8fr_0.9fr] px-4 h-11 items-center text-sm border-b-hairline last:border-b-0 hover:bg-surface-hover transition-colors focus:outline-none focus:bg-surface-hover"
          >
            <div className="min-w-0">
              <div className="font-medium truncate">{c.name}</div>
              <div className="text-xs text-muted-foreground truncate">{c.segment}</div>
            </div>
            <div>
              <Pill tone="neutral">{c.type}</Pill>
            </div>
            <div className="text-right tabular-nums">{fmtPct(c.openRate, 1)}</div>
            <div className="text-right tabular-nums">{fmtPct(c.clickRate, 1)}</div>
            <div className="text-right tabular-nums">{c.formSubmits}</div>
            <div className="text-right tabular-nums font-medium">{c.jobsBooked}</div>
            <div className="text-right tabular-nums">
              {c.formSubmits ? fmtPct(c.bookRate, 0) : "—"}
            </div>
            <div className="text-right tabular-nums font-medium">{fmtCurrency(c.revenue)}</div>
          </button>
        ))}
      </div>

      <CampaignInsightsDrawer
        campaign={selectedId ? ranked.find((c) => c.id === selectedId) ?? null : null}
        benchmarks={{
          openRate: overallOpenRate,
          clickRate: overallClickRate,
          ctor,
          submitRate,
          bookRate,
        }}
        onClose={() => setSelectedId(null)}
      />

      {/* What works / what doesn't */}
      <div className="grid grid-cols-2 gap-3">
        <div className="border-hairline rounded-lg bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-6 h-6 rounded-md bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </span>
            <span className="text-sm font-medium">What's working</span>
          </div>
          {best && (
            <div className="space-y-2.5">
              <div className="text-sm font-medium">{best.name}</div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <Stat label="Open" value={fmtPct(best.openRate, 1)} />
                <Stat label="Jobs" value={best.jobsBooked.toString()} />
                <Stat label="Revenue" value={fmtCurrency(best.revenue)} />
              </div>
              <div className="text-xs text-muted-foreground pt-1">
                {best.type === "Reminder"
                  ? "Reminder emails to past customers convert highest — keep cadence."
                  : best.type === "Win-back"
                  ? "Win-back is the strongest revenue-per-email channel."
                  : "Targeted segment + clear offer drives the best return."}
              </div>
            </div>
          )}
        </div>

        <div className="border-hairline rounded-lg bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-6 h-6 rounded-md bg-[hsl(var(--destructive))]/10 text-[hsl(var(--destructive))] flex items-center justify-center">
              <TrendingDown className="w-3.5 h-3.5" />
            </span>
            <span className="text-sm font-medium">Needs attention</span>
          </div>
          {worst && (
            <div className="space-y-2.5">
              <div className="text-sm font-medium">{worst.name}</div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <Stat label="Open" value={fmtPct(worst.openRate, 1)} muted />
                <Stat label="Click" value={fmtPct(worst.clickRate, 1)} muted />
                <Stat label="Unsubs" value={worst.unsubscribes.toString()} muted />
              </div>
              <div className="text-xs text-muted-foreground pt-1">
                Broad-segment newsletters underperform. Try splitting by trade or postcode.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Send-time heatmap + Subject-line tests */}
      <div className="grid grid-cols-5 gap-3">
        <div className="col-span-3 border-hairline rounded-lg bg-card p-5">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
            <div className="text-sm font-medium">Best time to send</div>
          </div>
          <div className="text-xs text-muted-foreground mb-4">Open rate by day & time slot</div>
          <div className="grid gap-1" style={{ gridTemplateColumns: "60px repeat(4, 1fr)" }}>
            <div />
            {timeBuckets.map((t) => (
              <div key={t} className="text-[10px] text-muted-foreground text-center">{t}</div>
            ))}
            {sendTimes.map((row) => (
              <FragmentRow key={row.day} day={row.day} slots={row.slots} />
            ))}
          </div>
          <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
            <span>Lower</span>
            <div className="flex-1 h-1.5 rounded-full bg-gradient-to-r from-primary/10 via-primary/40 to-primary" />
            <span>Higher</span>
          </div>
        </div>

        <div className="col-span-2 border-hairline rounded-lg bg-card p-5">
          <div className="flex items-center gap-2 mb-1">
            <Send className="w-3.5 h-3.5 text-muted-foreground" />
            <div className="text-sm font-medium">Subject-line A/B tests</div>
          </div>
          <div className="text-xs text-muted-foreground mb-3">Recent winners</div>
          <div className="space-y-3">
            {subjectTests.map((t, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center gap-2">
                  {t.winner && <Pill tone="success">Winner</Pill>}
                  <span className="text-sm truncate">{t.subject}</span>
                </div>
                <div className="flex gap-3 text-xs text-muted-foreground tabular-nums pl-0.5">
                  <span>Open {fmtPct(t.opens, 1)}</span>
                  <span>·</span>
                  <span>Click {fmtPct(t.clicks, 1)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Health row */}
      <div className="grid grid-cols-4 gap-3">
        <Health label="Bounce rate" value={fmtPct(bounceRate, 2)} ok={bounceRate < 2} target="<2%" />
        <Health label="Unsubscribe rate" value={fmtPct(unsubRate, 2)} ok={unsubRate < 0.5} target="<0.5%" />
        <Health label="List size" value={totals.sent.toLocaleString()} ok sub="active subscribers" />
        <Health label="Avg revenue / send" value={`£${revenuePerEmail.toFixed(2)}`} ok={revenuePerEmail > 1} target=">£1.00" />
      </div>
    </div>
  );
}

/* ---------------- helpers ---------------- */

function Kpi({
  icon, label, value, sub, trend, accent,
}: { icon: React.ReactNode; label: string; value: string; sub: string; trend?: number; accent?: boolean }) {
  return (
    <div className={`border-hairline rounded-lg p-4 ${accent ? "bg-primary/5" : "bg-card"}`}>
      <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-2xl font-medium mt-1.5 tabular-nums tracking-tight">{value}</div>
      <div className="flex items-center gap-1.5 mt-1 text-xs">
        {typeof trend === "number" && (
          <span className={trend >= 0 ? "text-[hsl(var(--success))]" : "text-[hsl(var(--destructive))]"}>
            {trend >= 0 ? "+" : ""}{trend.toFixed(1)}%
          </span>
        )}
        <span className="text-muted-foreground truncate">{sub}</span>
      </div>
    </div>
  );
}

function FunnelStep({ label, value, of, highlight }: { label: string; value: number; of: number; highlight?: boolean }) {
  const p = pct(value, of);
  return (
    <div className="mb-2 last:mb-0">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular-nums">
          {value.toLocaleString()} <span className="text-muted-foreground">({fmtPct(p, 1)})</span>
        </span>
      </div>
      <div className="h-2 bg-surface rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${highlight ? "bg-[hsl(var(--success))]" : "bg-primary/80"}`}
          style={{ width: `${Math.max(p, 2)}%` }}
        />
      </div>
    </div>
  );
}

function Stat({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`text-sm font-medium tabular-nums mt-0.5 ${muted ? "text-muted-foreground" : ""}`}>{value}</div>
    </div>
  );
}

function TrendChart({
  data, metric,
}: { data: typeof weeklyTrend; metric: "opens" | "clicks" | "jobs" }) {
  const values = data.map((d) => d[metric]);
  const max = Math.max(...values) * 1.15;
  return (
    <div>
      <div className="flex items-end gap-2 h-36 mt-2">
        {data.map((d) => {
          const v = d[metric];
          const h = (v / max) * 100;
          return (
            <div key={d.wk} className="flex-1 flex flex-col items-center gap-1.5 group">
              <div className="text-[10px] tabular-nums text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                {metric === "jobs" ? v : `${v}%`}
              </div>
              <div className="w-full flex items-end justify-center h-full">
                <div
                  className="w-full max-w-10 rounded-t bg-primary/80 hover:bg-primary transition-colors"
                  style={{ height: `${Math.max(h, 4)}%` }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground">{d.wk}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FragmentRow({ day, slots }: { day: string; slots: number[] }) {
  const max = 50;
  return (
    <>
      <div className="text-xs text-muted-foreground flex items-center">{day}</div>
      {slots.map((v, i) => {
        const intensity = Math.min(v / max, 1);
        return (
          <div
            key={i}
            className="h-9 rounded flex items-center justify-center text-[11px] font-medium tabular-nums"
            style={{
              backgroundColor: `hsl(var(--primary) / ${0.08 + intensity * 0.7})`,
              color: intensity > 0.55 ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground))",
            }}
            title={`${day} · ${v}% open rate`}
          >
            {v}
          </div>
        );
      })}
    </>
  );
}

function Health({ label, value, ok, target, sub }: { label: string; value: string; ok: boolean; target?: string; sub?: string }) {
  return (
    <div className="border-hairline rounded-lg bg-card p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="flex items-baseline gap-2 mt-1.5">
        <span className="text-xl font-medium tabular-nums tracking-tight">{value}</span>
        <span className={`w-1.5 h-1.5 rounded-full ${ok ? "bg-[hsl(var(--success))]" : "bg-[hsl(var(--warning))]"}`} />
      </div>
      <div className="text-xs text-muted-foreground mt-1">{target ? `Target ${target}` : sub}</div>
    </div>
  );
}

/* ---------------- insights drawer ---------------- */

type RankedCampaign = {
  id: string;
  name: string;
  segment: string;
  type: "Promo" | "Reminder" | "Win-back" | "Newsletter";
  sendDate: string;
  sent: number;
  delivered: number;
  opens: number;
  clicks: number;
  formSubmits: number;
  jobsBooked: number;
  revenue: number;
  unsubscribes: number;
  bounces: number;
  openRate: number;
  clickRate: number;
  bookRate: number;
  revenuePerEmail: number;
};

interface Benchmarks {
  openRate: number;
  clickRate: number;
  ctor: number;
  submitRate: number;
  bookRate: number;
}

type Verdict = "good" | "ok" | "poor";

interface StageInsight {
  key: string;
  label: string;
  value: string;
  benchmark: string;
  delta: number;
  verdict: Verdict;
  whatHappened: string;
  recommendation: string;
}

function buildInsights(c: RankedCampaign, b: Benchmarks): StageInsight[] {
  const deliverRate = pct(c.delivered, c.sent);
  const cBounceRate = pct(c.bounces, c.sent);
  const cOpenRate = c.openRate;
  const cClickRate = c.clickRate;
  const cCtor = pct(c.clicks, c.opens);
  const cSubmitRate = pct(c.formSubmits, c.clicks);
  const cBookRate = c.bookRate;
  const cUnsubRate = pct(c.unsubscribes, c.delivered);

  const verdict = (delta: number, goodAt = 2, poorAt = -2): Verdict =>
    delta >= goodAt ? "good" : delta <= poorAt ? "poor" : "ok";

  return [
    {
      key: "deliver",
      label: "Deliverability",
      value: fmtPct(deliverRate, 1),
      benchmark: `${fmtPct(cBounceRate, 2)} bounce`,
      delta: -cBounceRate,
      verdict: cBounceRate < 1 ? "good" : cBounceRate < 2.5 ? "ok" : "poor",
      whatHappened:
        cBounceRate < 1
          ? "List hygiene is strong — almost every email reached the inbox."
          : cBounceRate < 2.5
          ? "Bounce rate is acceptable but trending up. A few stale addresses are dragging delivery."
          : "Bounces are above the safe threshold and risk hurting sender reputation.",
      recommendation:
        cBounceRate < 1
          ? "Keep the current double-opt-in flow. No action needed."
          : "Run a list-clean: remove addresses that have hard-bounced once, and re-confirm any that haven't engaged in 12 months.",
    },
    {
      key: "open",
      label: "Open rate",
      value: fmtPct(cOpenRate, 1),
      benchmark: `vs ${fmtPct(b.openRate, 1)} avg`,
      delta: cOpenRate - b.openRate,
      verdict: verdict(cOpenRate - b.openRate, 3, -3),
      whatHappened:
        cOpenRate - b.openRate >= 3
          ? "Subject line and from-name resonated — opens well above your account average."
          : cOpenRate - b.openRate <= -3
          ? "Subject line under-performed. Most recipients scrolled past without opening."
          : "Opens are roughly in line with your norm — neither a win nor a miss.",
      recommendation:
        cOpenRate - b.openRate >= 3
          ? "Save this subject pattern as a template and re-test the angle on the next promo."
          : cOpenRate - b.openRate <= -3
          ? "A/B test a shorter subject (<45 chars) with a personal-feeling preview text. Try sending Tue 10am–2pm."
          : "Try one variable next time — a first-name token in the subject usually lifts opens 5–10%.",
    },
    {
      key: "click",
      label: "Click-through",
      value: fmtPct(cClickRate, 1),
      benchmark: `CTOR ${fmtPct(cCtor, 1)}`,
      delta: cClickRate - b.clickRate,
      verdict: verdict(cClickRate - b.clickRate, 1, -1),
      whatHappened:
        cCtor >= 18
          ? "Of those who opened, a high share clicked through — the offer and CTA are clearly aligned."
          : cCtor >= 10
          ? "Clicks are healthy but there's headroom. Some opens didn't find a reason to act."
          : "Most opens didn't click. The body content isn't pulling its weight.",
      recommendation:
        cCtor >= 18
          ? "Lock in the CTA placement and copy. Consider a follow-up to non-clickers with the same offer."
          : "Move the primary CTA above the fold, use a single button (not multiple links), and lead with the customer benefit not the service name.",
    },
    {
      key: "submit",
      label: "Form submits",
      value: `${c.formSubmits} (${fmtPct(cSubmitRate, 0)} of clicks)`,
      benchmark: `vs ${fmtPct(b.submitRate, 0)} avg`,
      delta: cSubmitRate - b.submitRate,
      verdict: verdict(cSubmitRate - b.submitRate, 5, -5),
      whatHappened:
        cSubmitRate >= 35
          ? "The landing page converted clickers into enquiries efficiently — message-match was strong."
          : cSubmitRate >= 20
          ? "Conversion is decent but a portion bounced from the landing page."
          : "Most clickers left without filling the form — the page or form is the bottleneck.",
      recommendation:
        cSubmitRate >= 35
          ? "Reuse this landing page layout for similar campaigns."
          : "Shorten the form to name + postcode + service, ensure the headline matches the email subject, and add a trust signal (reviews / years trading) above the form.",
    },
    {
      key: "book",
      label: "Booking",
      value: `${c.jobsBooked} jobs (${cBookRate ? fmtPct(cBookRate, 0) : "—"} of submits)`,
      benchmark: `vs ${fmtPct(b.bookRate, 0)} avg`,
      delta: cBookRate - b.bookRate,
      verdict: verdict(cBookRate - b.bookRate, 5, -5),
      whatHappened:
        cBookRate >= 50
          ? "Sales follow-up turned half of enquiries into jobs — a strong close rate."
          : cBookRate >= 30
          ? "Roughly a third of enquiries converted. Likely some leads went cold before contact."
          : c.formSubmits === 0
          ? "No enquiries reached the booking stage."
          : "Most enquiries didn't convert. Quote response time or fit is the issue.",
      recommendation:
        cBookRate >= 50
          ? "Document what the team did differently and replicate it in the playbook."
          : "Aim for first contact within 1 hour of submit, and send a follow-up email at 24h and 72h for non-responders.",
    },
    {
      key: "unsub",
      label: "List health",
      value: `${c.unsubscribes} unsubs (${fmtPct(cUnsubRate, 2)})`,
      benchmark: "Target <0.5%",
      delta: -cUnsubRate,
      verdict: cUnsubRate < 0.3 ? "good" : cUnsubRate < 0.6 ? "ok" : "poor",
      whatHappened:
        cUnsubRate < 0.3
          ? "Audience welcomed the message — minimal opt-outs."
          : cUnsubRate < 0.6
          ? "A handful unsubscribed, in the normal range for promo sends."
          : "Unsubscribes are elevated — the message likely reached the wrong segment or felt too pushy.",
      recommendation:
        cUnsubRate < 0.3
          ? "No action needed."
          : "Tighten the segment (exclude anyone who's received 2+ emails in the last 14 days) and soften the offer language.",
    },
  ];
}

function CampaignInsightsDrawer({
  campaign, benchmarks, onClose,
}: { campaign: RankedCampaign | null; benchmarks: Benchmarks; onClose: () => void }) {
  const insights = useMemo(
    () => (campaign ? buildInsights(campaign, benchmarks) : []),
    [campaign, benchmarks],
  );

  if (!campaign) return null;

  const wins = insights.filter((i) => i.verdict === "good");
  const issues = insights.filter((i) => i.verdict === "poor");

  return (
    <Sheet open={!!campaign} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-[560px] sm:max-w-[560px] p-0 overflow-y-auto">
        <div className="px-6 pt-6 pb-4 border-b-hairline sticky top-0 bg-background z-10">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <Pill tone="neutral">{campaign.type}</Pill>
                <span className="text-xs text-muted-foreground">{campaign.sendDate}</span>
              </div>
              <h2 className="text-lg font-medium leading-tight truncate">{campaign.name}</h2>
              <div className="text-xs text-muted-foreground mt-0.5 truncate">{campaign.segment}</div>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-md hover:bg-surface-hover flex items-center justify-center text-muted-foreground"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2 mt-4">
            <DrawerStat label="Sent" value={campaign.sent.toLocaleString()} />
            <DrawerStat label="Opens" value={fmtPct(campaign.openRate, 1)} />
            <DrawerStat label="Jobs" value={campaign.jobsBooked.toString()} />
            <DrawerStat label="Revenue" value={fmtCurrency(campaign.revenue)} accent />
          </div>
        </div>

        <div className="px-6 py-4 border-b-hairline">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-sm font-medium">Summary</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <SummaryCard
              tone="success"
              icon={<CheckCircle2 className="w-3.5 h-3.5" />}
              title={`${wins.length} stage${wins.length === 1 ? "" : "s"} above benchmark`}
              detail={wins.length ? wins.map((w) => w.label).join(" · ") : "Nothing materially outperformed this run."}
            />
            <SummaryCard
              tone="warning"
              icon={<AlertTriangle className="w-3.5 h-3.5" />}
              title={`${issues.length} stage${issues.length === 1 ? "" : "s"} need attention`}
              detail={issues.length ? issues.map((i) => i.label).join(" · ") : "No funnel stage is materially below benchmark."}
            />
          </div>
        </div>

        <div className="px-6 py-4">
          <div className="text-sm font-medium mb-3">Funnel breakdown</div>
          <div className="space-y-3">
            {insights.map((ins) => (
              <InsightCard key={ins.key} insight={ins} />
            ))}
          </div>
        </div>

        <div className="px-6 pb-6">
          <div className="border-hairline rounded-lg bg-surface/40 p-4">
            <div className="flex items-center gap-2 mb-3">
              <ArrowRight className="w-3.5 h-3.5 text-primary" />
              <span className="text-sm font-medium">Recommended next steps</span>
            </div>
            <ol className="space-y-2 text-sm">
              {(issues.length ? issues : insights.slice(0, 3)).map((ins, i) => (
                <li key={ins.key} className="flex gap-2.5">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">{ins.label}</div>
                    <div>{ins.recommendation}</div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function DrawerStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-md border-hairline p-2.5 ${accent ? "bg-primary/5" : "bg-surface/40"}`}>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-sm font-medium tabular-nums mt-0.5">{value}</div>
    </div>
  );
}

function SummaryCard({
  tone, icon, title, detail,
}: { tone: "success" | "warning"; icon: React.ReactNode; title: string; detail: string }) {
  const color =
    tone === "success"
      ? "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]"
      : "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]";
  return (
    <div className="border-hairline rounded-md p-3">
      <div className="flex items-center gap-2">
        <span className={`w-5 h-5 rounded-md flex items-center justify-center ${color}`}>{icon}</span>
        <span className="text-xs font-medium">{title}</span>
      </div>
      <div className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{detail}</div>
    </div>
  );
}

function InsightCard({ insight }: { insight: StageInsight }) {
  const toneClass =
    insight.verdict === "good"
      ? "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] border-[hsl(var(--success))]/20"
      : insight.verdict === "poor"
      ? "bg-[hsl(var(--destructive))]/10 text-[hsl(var(--destructive))] border-[hsl(var(--destructive))]/20"
      : "bg-surface text-muted-foreground border-transparent";
  const verdictLabel =
    insight.verdict === "good" ? "Above benchmark" : insight.verdict === "poor" ? "Below benchmark" : "On benchmark";

  return (
    <div className="border-hairline rounded-md p-3.5">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <div className="text-sm font-medium">{insight.label}</div>
          <div className="text-xs text-muted-foreground tabular-nums mt-0.5">
            {insight.value} <span className="opacity-60">· {insight.benchmark}</span>
          </div>
        </div>
        <span className={`text-[10px] font-medium uppercase tracking-wide rounded px-1.5 py-0.5 border ${toneClass}`}>
          {verdictLabel}
        </span>
      </div>
      <div className="text-xs text-foreground/80 leading-relaxed mb-2">{insight.whatHappened}</div>
      <div className="text-xs text-muted-foreground leading-relaxed flex gap-1.5">
        <ArrowRight className="w-3 h-3 mt-0.5 flex-shrink-0 text-primary" />
        <span>{insight.recommendation}</span>
      </div>
    </div>
  );
}
