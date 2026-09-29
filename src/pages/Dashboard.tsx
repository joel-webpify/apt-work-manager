import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Check, Mail, Plus, UserPlus } from "lucide-react";
import { PageBody, Btn } from "@/components/layout/PageShell";
import NewJobDialog from "@/components/pipeline/NewJobDialog";
import { EditContactDialog } from "@/components/contacts/EditContactDialog";
import { employees, type Job } from "@/data/mockData";
import { addJob, useJobs } from "@/lib/jobsStore";
import { useQuotes } from "@/lib/quotesStore";
import { useInvoices } from "@/lib/invoicesStore";
import { useGbp } from "@/lib/gbpStore";
import { leads } from "@/lib/leadsData";
import { docTotals, totals as invoiceTotals } from "@/lib/quoteUtils";
import { nextStep } from "@/lib/jobPlan";
import { resolveStageName, useStages } from "@/lib/stagesStore";

const money = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 });
const DAY = 86_400_000;
const iso = (d: Date) => d.toISOString().slice(0, 10);
const daysSince = (date: string) => Math.floor((Date.now() - new Date(date).getTime()) / DAY);

type Tone = "green" | "amber" | "red" | "grey";
const toneColor: Record<Tone, string> = {
  green: "hsl(var(--success))",
  amber: "hsl(var(--warning))",
  red: "hsl(var(--destructive))",
  grey: "hsl(var(--muted-foreground) / 0.5)",
};
const toneRank: Record<Tone, number> = { red: 0, amber: 1, green: 2, grey: 3 };

// Demo: the signed-in person is the first team member, and is the owner.
const CURRENT_USER_ID = employees[0]?.id;
const IS_OWNER = true;
const MULTI_USER = employees.length >= 2;
const DONE_STAGES = ["Completed", "Invoiced", "Paid"];

const jobOwner = (job: Job) => job.assignments?.[0]?.employeeId;

function Dot({ tone }: { tone: Tone }) {
  return <span className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: toneColor[tone] }} />;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [jobs] = useJobs();
  const [quotes] = useQuotes();
  const [invoices] = useInvoices();
  const gbp = useGbp();
  const { pipelines } = useStages();
  const [newJobOpen, setNewJobOpen] = useState(false);
  const [newContactOpen, setNewContactOpen] = useState(false);
  const [scope, setScope] = useState<"mine" | "everyone">(IS_OWNER ? "everyone" : "mine");

  const mine = scope === "mine" && MULTI_USER;
  const today = iso(new Date());
  const now = Date.now();

  const scopedJobs = useMemo(() => (mine ? jobs.filter((j) => jobOwner(j) === CURRENT_USER_ID) : jobs), [jobs, mine]);
  const scopedLeads = useMemo(
    () => leads.filter((l) => l.status === "Open" && (!mine || l.ownerId === CURRENT_USER_ID)),
    [mine],
  );

  // ---------- Leads ----------
  const inWindow = (w: number) =>
    scopedLeads.filter((l) => {
      const age = now - new Date(l.receivedAt).getTime();
      return age >= w * 7 * DAY && age < (w + 1) * 7 * DAY;
    }).length;
  const leadsThisWeek = inWindow(0);
  const history = [1, 2, 3, 4, 5, 6].map(inWindow);
  const weeksWithData = history.filter((n) => n > 0).length;
  const historyTotal = history.reduce((a, b) => a + b, 0);
  const enoughLeadData = weeksWithData >= 4 && historyTotal >= 10;
  const normal = historyTotal / 6;
  const leadDelta = enoughLeadData && normal ? (leadsThisWeek - normal) / normal : 0;
  const leadTone: Tone = !enoughLeadData ? "grey" : leadDelta <= -0.5 ? "red" : leadDelta <= -0.25 ? "amber" : "green";

  // ---------- Follow-up ----------
  const notContacted = scopedLeads.filter((l) => !l.firstContactAt && now - new Date(l.receivedAt).getTime() > DAY);
  const responded = scopedLeads.filter((l) => l.firstContactAt);
  const avgResponseH = responded.length
    ? responded.reduce((s, l) => s + (new Date(l.firstContactAt!).getTime() - new Date(l.receivedAt).getTime()), 0) / responded.length / 3600_000
    : 0;
  const followTone: Tone = notContacted.length === 0 ? "green" : notContacted.length <= 2 ? "amber" : "red";

  // ---------- Quotes ----------
  const openQuotes = quotes.filter((q) => q.status === "Sent");
  const openValue = openQuotes.reduce((s, q) => s + docTotals(q).total, 0);
  const oldestWait = Math.max(0, ...openQuotes.map((q) => daysSince(q.issueDate)));
  const waitingQuotes = openQuotes.filter((q) => daysSince(q.issueDate) >= 7);
  const decided = quotes.filter((q) => ["Accepted", "Declined"].includes(q.status) && daysSince(q.issueDate) <= 90);
  const won = decided.filter((q) => q.status === "Accepted").length;
  const winText = decided.length >= 10
    ? `${Math.round((won / decided.length) * 100)}% win rate (90 days)`
    : decided.length ? `${won} of ${decided.length} won (90 days)` : "No decided quotes yet";
  const quoteTone: Tone = oldestWait >= 14 ? "red" : oldestWait >= 7 ? "amber" : "green";

  // ---------- Cash ----------
  const thisMonth = new Date();
  const paidThisMonth = invoices
    .filter((i) => {
      if (i.status !== "Paid") return false;
      const d = new Date(i.paidDate ?? i.issueDate);
      return d.getMonth() === thisMonth.getMonth() && d.getFullYear() === thisMonth.getFullYear();
    })
    .reduce((s, i) => s + invoiceTotals(i.items).total, 0);
  const overdueInvoices = invoices.filter((i) => (i.status === "Sent" || i.status === "Overdue") && i.dueDate < today);
  const overdueValue = overdueInvoices.reduce((s, i) => s + invoiceTotals(i.items).total, 0);
  const worstOverdue = Math.max(0, ...overdueInvoices.map((i) => daysSince(i.dueDate)));
  const cashTone: Tone = worstOverdue >= 14 ? "red" : overdueInvoices.length ? "amber" : "green";

  // ---------- Reputation ----------
  const reviews = gbp?.reviews ?? [];
  const gbpConnected = Boolean(gbp?.profile);
  const rating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const unreplied = reviews.filter((r) => !r.reply);
  const newThisMonth = reviews.filter((r) => r.daysAgo <= 30).length;
  const repTone: Tone = unreplied.some((r) => r.rating <= 3) ? "red" : unreplied.length ? "amber" : "green";

  // ---------- Needs attention ----------
  const overdueSteps = scopedJobs.filter((j) => {
    const s = nextStep(j);
    return Boolean(s?.due && s.due < today);
  });
  const unassigned = jobs.filter((j) => !j.assignments?.length && !DONE_STAGES.includes(resolveStageName(j.stage)));

  const attention = [
    { count: notContacted.length, title: "New leads not contacted", desc: "Waiting more than 24 hours", tone: followTone, href: "/contacts?filter=not-contacted" },
    { count: waitingQuotes.length, title: "Quotes waiting for a reply", desc: "Sent 7+ days ago", tone: quoteTone, href: "/quotes?status=Sent" },
    { count: overdueInvoices.length, title: "Overdue invoices", desc: `${money.format(overdueValue)} past due`, tone: cashTone, href: "/quotes?tab=invoices" },
    ...(MULTI_USER ? [{ count: unassigned.length, title: "Jobs without an owner", desc: "Ready to assign", tone: "amber" as Tone, href: "/pipeline?pipeline=all" }] : []),
    { count: overdueSteps.length, title: "Next steps past due", desc: "Review job plans", tone: "amber" as Tone, href: "/pipeline?attention=1" },
    ...(gbpConnected ? [{ count: unreplied.length, title: "Unreplied Google reviews", desc: "Replies help your ranking", tone: repTone, href: "/marketing/google-business" }] : []),
  ]
    .filter((r) => r.count > 0)
    .sort((a, b) => toneRank[a.tone] - toneRank[b.tone]);

  // ---------- This week ----------
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const date = iso(d);
    const visits = scopedJobs
      .flatMap((job) => (job.assignments ?? []).filter((a) => a.date === date && (!mine || a.employeeId === CURRENT_USER_ID)).map((a) => ({ job, a })))
      .sort((x, y) => x.a.start.localeCompare(y.a.start));
    return { date, d, visits };
  });
  const weekEmpty = week.every((w) => !w.visits.length);

  // ---------- Team ----------
  const outToday = employees.filter((e) => e.daysOff.includes(today) || !e.workingDays.includes(new Date().getDay()));
  const available = week.reduce(
    (s, w) => s + employees.filter((e) => e.workingDays.includes(w.d.getDay()) && !e.daysOff.includes(w.date)).reduce((t, e) => t + e.capacityHoursPerDay, 0),
    0,
  );
  const booked = jobs.flatMap((j) => j.assignments ?? []).filter((a) => week.some((w) => w.date === a.date)).reduce((s, a) => s + a.duration, 0);
  const hasAvailability = employees.some((e) => e.capacityHoursPerDay > 0);

  // ---------- Pipeline line ----------
  const active = jobs.filter((j) => !DONE_STAGES.includes(resolveStageName(j.stage)));
  const activeValue = active.reduce((s, j) => s + j.value, 0);

  const health = [
    {
      label: "Leads", value: String(leadsThisWeek), tone: leadTone, href: "/reporting?tab=marketing",
      sub: enoughLeadData ? `${leadDelta >= 0 ? "+" : ""}${Math.round(leadDelta * 100)}% vs normal` : "Not enough data yet",
    },
    { label: "Follow-up", value: String(notContacted.length), tone: followTone, href: "/contacts?filter=not-contacted", sub: `Avg first response: ${avgResponseH.toFixed(1)}h` },
    { label: "Quotes", value: `${money.format(openValue)} · ${openQuotes.length} open`, tone: quoteTone, href: "/reporting?tab=pipeline", sub: winText },
    { label: "Cash", value: money.format(paidThisMonth), tone: cashTone, href: "/reporting?tab=revenue", sub: overdueInvoices.length ? `${money.format(overdueValue)} overdue` : "Nothing overdue" },
    gbpConnected
      ? { label: "Reputation", value: `${rating.toFixed(1)}★ · ${reviews.length}`, tone: repTone, href: "/marketing/google-business", sub: `${newThisMonth} new this month · ${unreplied.length} unreplied` }
      : { label: "Reputation", value: "Connect Google Business", tone: "grey" as Tone, href: "/marketing/google-business", sub: "See your rating here" },
  ];

  return (
    <>
      <header className="shrink-0 border-b-hairline px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-[26px] font-semibold leading-none">Dashboard</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">Is the business OK, and what needs doing now</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Btn onClick={() => setNewJobOpen(true)}><Plus className="h-3.5 w-3.5" /> New job</Btn>
            <Btn onClick={() => setNewContactOpen(true)}><UserPlus className="h-3.5 w-3.5" /> New contact</Btn>
            <Btn variant="primary" onClick={() => navigate("/marketing/email")}><Mail className="h-3.5 w-3.5" /> Send campaign</Btn>
          </div>
        </div>
      </header>

      <PageBody>
        <div className="mx-auto max-w-[1440px] space-y-5">
          {/* Health strip */}
          <section aria-label="Business health" className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-1 lg:grid lg:grid-cols-5 lg:overflow-visible">
            {health.map((h) => (
              <button
                key={h.label}
                onClick={() => navigate(h.href)}
                className="group min-w-[200px] snap-start rounded-lg border-hairline bg-card p-4 text-left transition-colors hover:bg-surface lg:min-w-0"
              >
                <span className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">{h.label}</span>
                  <Dot tone={h.tone} />
                </span>
                <span className="mt-2 block truncate text-xl font-semibold tabular-nums">{h.value}</span>
                <span className="mt-1 block truncate text-xs text-muted-foreground">{h.sub}</span>
              </button>
            ))}
          </section>

          {/* Main row */}
          <div className="grid gap-5 lg:grid-cols-3">
            <section className="rounded-lg border-hairline bg-card p-5 lg:col-span-2">
              <div className="flex items-start justify-between gap-3 border-b-hairline pb-4">
                <div>
                  <h2 className="text-base font-semibold">Needs attention</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Things waiting on you or your team</p>
                </div>
                {MULTI_USER && (
                  <div className="flex rounded-md border-hairline p-0.5 text-xs">
                    {(["mine", "everyone"] as const).map((s) => (
                      <button key={s} onClick={() => setScope(s)} className={`rounded px-2.5 py-1 font-medium capitalize transition-colors ${scope === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-surface"}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {attention.length ? (
                <div className="divide-y divide-border">
                  {attention.map((r) => (
                    <button key={r.title} onClick={() => navigate(r.href)} className="group flex w-full items-center gap-4 py-3 text-left">
                      <Dot tone={r.tone} />
                      <span className="w-8 text-xl font-semibold tabular-nums">{r.count}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{r.title}</span>
                        <span className="block truncate text-xs text-muted-foreground">{r.desc}</span>
                      </span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-[hsl(var(--success))]" /> All caught up, nothing needs your attention.
                </p>
              )}
            </section>

            <section className="rounded-lg border-hairline bg-card p-5">
              <div className="flex items-center justify-between border-b-hairline pb-4">
                <h2 className="text-base font-semibold">This week</h2>
                <button className="flex items-center gap-1 text-xs font-medium text-primary" onClick={() => navigate("/field")}>Full schedule <ArrowRight className="h-3 w-3" /></button>
              </div>
              {weekEmpty ? (
                <button className="py-4 text-sm text-muted-foreground" onClick={() => navigate("/field")}>No visits booked this week · <span className="text-primary">Open schedule</span></button>
              ) : (
                <div className="pt-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Today</p>
                  {week[0].visits.length ? (
                    <div className="mt-1 divide-y divide-border">
                      {week[0].visits.slice(0, 4).map(({ job, a }) => (
                        <button key={`${job.id}-${a.employeeId}-${a.start}`} onClick={() => navigate(`/field/job/${job.id}`)} className="grid w-full grid-cols-[44px_minmax(0,1fr)] gap-2 py-2 text-left">
                          <span className="text-sm font-semibold tabular-nums text-primary">{a.start}</span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium">{job.customer}</span>
                            <span className="block truncate text-xs text-muted-foreground">{employees.find((e) => e.id === a.employeeId)?.name ?? "Unassigned"}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : <p className="py-2 text-sm text-muted-foreground/70">Free</p>}
                  <div className="mt-2 space-y-1.5 border-t-hairline pt-3">
                    {week.slice(1).map((w) => (
                      <div key={w.date} className={`flex justify-between text-sm ${w.visits.length ? "" : "text-muted-foreground/60"}`}>
                        <span>{w.d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric" })}</span>
                        <span className="tabular-nums">{w.visits.length ? `${w.visits.length} ${w.visits.length === 1 ? "visit" : "visits"}` : "Free"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>

          <button onClick={() => navigate("/pipeline?pipeline=all")} className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <span className="font-medium text-foreground">{active.length} active jobs</span> · {money.format(activeValue)}
            {pipelines.length > 1 && <> · {pipelines.length} boards</>} · <span className="text-primary">Open boards</span>
            <ArrowRight className="h-3 w-3 text-primary transition-transform group-hover:translate-x-0.5" />
          </button>

          {MULTI_USER && (
            <section aria-label="Team" className="flex flex-wrap gap-x-8 gap-y-2 rounded-lg border-hairline bg-card px-5 py-3 text-sm">
              <span><span className="text-muted-foreground">Unassigned jobs</span> <span className="ml-1 font-semibold tabular-nums">{unassigned.length}</span></span>
              {hasAvailability && available > 0 && (
                <span><span className="text-muted-foreground">Capacity this week</span> <span className="ml-1 font-semibold tabular-nums">{Math.round((booked / available) * 100)}%</span> <span className="text-xs text-muted-foreground">({Math.round(booked)}h / {Math.round(available)}h)</span></span>
              )}
              <span className="min-w-0"><span className="text-muted-foreground">Out today</span> <span className="ml-1 font-medium">{outToday.length ? outToday.map((e) => e.name.split(" ")[0]).join(", ") : "Everyone in"}</span></span>
            </section>
          )}
        </div>
      </PageBody>

      <NewJobDialog open={newJobOpen} onOpenChange={setNewJobOpen} defaultPipelineId={pipelines[0]?.id ?? "sales"} onCreate={addJob} />
      <EditContactDialog contact={null} open={newContactOpen} onOpenChange={setNewContactOpen} mode="create" />
    </>
  );
}
