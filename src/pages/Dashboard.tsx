import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  Mail,
  Plus,
  UserPlus,
  UserRoundX,
} from "lucide-react";
import { PageBody, Btn, StatusDot } from "@/components/layout/PageShell";
import NewJobDialog from "@/components/pipeline/NewJobDialog";
import PipelineIcon from "@/components/pipeline/PipelineIcon";
import { EditContactDialog } from "@/components/contacts/EditContactDialog";
import { employees, type Job } from "@/data/mockData";
import { addJob, useJobs } from "@/lib/jobsStore";
import { useQuotes } from "@/lib/quotesStore";
import { useInvoices } from "@/lib/invoicesStore";
import { docTotals, totals as invoiceTotals } from "@/lib/quoteUtils";
import { nextStep } from "@/lib/jobPlan";
import { useCostReporting } from "@/lib/costReporting";
import { colorToCss, pipelineIdForStage, resolveStageName, useStages } from "@/lib/stagesStore";

const money = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
});

const todayIso = () => new Date().toISOString().slice(0, 10);

function jobPipelineId(job: Job) {
  return job.pipelineId ?? pipelineIdForStage(resolveStageName(job.stage));
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-base font-semibold">{children}</h2>;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [jobs] = useJobs();
  const [quotes] = useQuotes();
  const [invoices] = useInvoices();
  const { pipelines } = useStages();
  const { totals: costTotals } = useCostReporting(jobs);
  const [newJobOpen, setNewJobOpen] = useState(false);
  const [newContactOpen, setNewContactOpen] = useState(false);
  const [selectedPipelineId, setSelectedPipelineId] = useState(() => pipelines[0]?.id ?? "");

  const today = todayIso();
  const todaysWork = useMemo(
    () =>
      jobs
        .flatMap((job) =>
          (job.assignments ?? [])
            .filter((assignment) => assignment.date === today)
            .map((assignment) => ({ job, assignment })),
        )
        .sort((a, b) => a.assignment.start.localeCompare(b.assignment.start)),
    [jobs, today],
  );

  const overdue = useMemo(
    () =>
      jobs
        .map((job) => ({ job, step: nextStep(job) }))
        .filter(({ step }) => Boolean(step?.due && step.due < today)),
    [jobs, today],
  );
  const unassigned = jobs.filter(
    (job) => (job.assignments?.length ?? 0) === 0 && !["Completed", "Invoiced", "Paid"].includes(resolveStageName(job.stage)),
  );

  const openQuotes = quotes.filter((quote) => quote.status === "Sent");
  const quoteValue = openQuotes.reduce((sum, quote) => sum + docTotals(quote).total, 0);
  const decidedQuotes = quotes.filter((quote) => ["Accepted", "Declined"].includes(quote.status));
  const acceptedQuotes = decidedQuotes.filter((quote) => quote.status === "Accepted");
  const conversion = decidedQuotes.length ? Math.round((acceptedQuotes.length / decidedQuotes.length) * 100) : 0;

  const now = new Date();
  const monthlyRevenue = invoices
    .filter((invoice) => {
      const date = new Date(invoice.issueDate);
      return invoice.status === "Paid" && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    })
    .reduce((sum, invoice) => sum + invoiceTotals(invoice.items).total, 0);

  const pipelineSummaries = pipelines.map((pipeline) => {
    const boardJobs = jobs.filter((job) => jobPipelineId(job) === pipeline.id);
    const stages = pipeline.stages.map((stage) => {
      const stageJobs = boardJobs.filter((job) => resolveStageName(job.stage) === stage.name);
      return {
        ...stage,
        count: stageJobs.length,
        value: stageJobs.reduce((sum, job) => sum + job.value, 0),
      };
    });
    return { pipeline, boardJobs, stages };
  });

  const recentActivity = useMemo(
    () =>
      jobs
        .flatMap((job) => job.timeline.map((item) => ({ ...item, job })))
        .slice(0, 4),
    [jobs],
  );

  const firstPipelineId = pipelines[0]?.id ?? "sales";
  const selectedPipeline = pipelines.find((pipeline) => pipeline.id === selectedPipelineId) ?? pipelines[0];
  const selectedSummary = pipelineSummaries.find(({ pipeline }) => pipeline.id === selectedPipeline?.id);
  const selectedValue = selectedSummary?.boardJobs.reduce((sum, job) => sum + job.value, 0) ?? 0;
  const selectedMaxStage = Math.max(...(selectedSummary?.stages.map((stage) => stage.count) ?? [1]), 1);

  const metrics = [
    { label: "Revenue this month", value: money.format(monthlyRevenue), detail: "Paid invoices", href: "/reporting?tab=revenue" },
    { label: "Open quote value", value: money.format(quoteValue), detail: `${openQuotes.length} sent ${openQuotes.length === 1 ? "quote" : "quotes"}`, href: "/quotes" },
    { label: "Quote conversion", value: `${conversion}%`, detail: "Of decided quotes", href: "/reporting?tab=pipeline" },
    { label: "Expected profit", value: money.format(costTotals.profit), detail: `${costTotals.costedCount} costed ${costTotals.costedCount === 1 ? "job" : "jobs"}`, href: "/reporting?tab=revenue" },
  ];

  return (
    <>
      <header className="shrink-0 border-b-hairline px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-[26px] font-semibold leading-none">Dashboard</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">Your work and business at a glance</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Btn onClick={() => setNewJobOpen(true)}><Plus className="h-3.5 w-3.5" /> New job</Btn>
            <Btn onClick={() => setNewContactOpen(true)}><UserPlus className="h-3.5 w-3.5" /> New contact</Btn>
            <Btn variant="primary" onClick={() => navigate("/marketing/email")}><Mail className="h-3.5 w-3.5" /> Send campaign</Btn>
          </div>
        </div>
      </header>

      <PageBody>
        <div className="mx-auto max-w-[1440px] space-y-8">
          <section aria-label="Business pulse" className="border-y-hairline grid grid-cols-2 bg-card lg:grid-cols-4">
            {metrics.map((metric, index) => (
              <button
                key={metric.label}
                className={`group px-4 py-5 text-left transition-colors hover:bg-surface sm:px-6 ${index % 2 ? "border-l-hairline" : ""} ${index > 1 ? "border-t-hairline lg:border-t-0" : ""} ${index === 2 ? "lg:border-l-hairline" : ""}`}
                onClick={() => navigate(metric.href)}
              >
                <span className="text-xs font-medium text-muted-foreground">{metric.label}</span>
                <span className="mt-2 flex items-end justify-between gap-2">
                  <span className="text-2xl font-semibold tabular-nums sm:text-3xl">{metric.value}</span>
                  <ArrowRight className="mb-1 h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">{metric.detail}</span>
              </button>
            ))}
          </section>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.75fr)]">
            <section className="border-hairline min-h-[330px] rounded-lg bg-card p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3 border-b-hairline pb-5">
                <div>
                  <SectionTitle>Today&apos;s work</SectionTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
                  </p>
                </div>
                <Btn variant="ghost" className="h-8" onClick={() => navigate("/field")}>Full schedule <ArrowRight className="h-3 w-3" /></Btn>
              </div>
              {todaysWork.length ? (
                <div className="divide-y divide-border">
                  {todaysWork.slice(0, 5).map(({ job, assignment }) => {
                    const employee = employees.find((person) => person.id === assignment.employeeId);
                    return (
                      <button key={`${job.id}-${assignment.employeeId}-${assignment.start}`} className="group grid w-full grid-cols-[58px_minmax(0,1fr)] items-center gap-3 py-4 text-left sm:grid-cols-[58px_minmax(0,1fr)_auto]" onClick={() => navigate(`/field/job/${job.id}`)}>
                        <span className="text-base font-semibold tabular-nums text-primary">{assignment.start}</span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">{job.customer}</span>
                          <span className="block truncate text-xs text-muted-foreground">{job.service}</span>
                        </span>
                        <span className="col-start-2 flex items-center gap-2 text-xs text-muted-foreground sm:col-start-auto">
                          {employee?.name ?? "Unassigned"}<ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex min-h-56 items-center justify-center py-8 text-center">
                  <div>
                    <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-surface"><CalendarDays className="h-4 w-4 text-muted-foreground" /></span>
                    <p className="mt-3 text-sm font-medium">No visits booked for today</p>
                    <p className="mt-1 text-xs text-muted-foreground">Your team&apos;s scheduled work will appear here.</p>
                    <Btn variant="secondary" className="mt-4" onClick={() => navigate("/field")}>Open schedule</Btn>
                  </div>
                </div>
              )}
            </section>

            <section className="border-hairline rounded-lg bg-card p-5 sm:p-6">
              <div className="border-b-hairline pb-5">
                <SectionTitle>Work to organise</SectionTitle>
                <p className="mt-1 text-sm text-muted-foreground">Items waiting for a decision or owner</p>
              </div>
              <div className="divide-y divide-border">
                <button className="group flex w-full items-center gap-4 py-5 text-left" onClick={() => navigate("/pipeline?attention=1")}>
                  <span className="w-9 text-2xl font-semibold tabular-nums">{overdue.length}</span>
                  <span className="min-w-0 flex-1"><span className="block text-sm font-medium">Next steps past due</span><span className="block text-xs text-muted-foreground">Review job plans</span></span>
                  <Clock3 className="h-4 w-4 text-muted-foreground" />
                </button>
                <button className="group flex w-full items-center gap-4 py-5 text-left" onClick={() => navigate("/pipeline?pipeline=all")}>
                  <span className="w-9 text-2xl font-semibold tabular-nums">{unassigned.length}</span>
                  <span className="min-w-0 flex-1"><span className="block text-sm font-medium">Jobs without an owner</span><span className="block text-xs text-muted-foreground">Ready to assign</span></span>
                  <UserRoundX className="h-4 w-4 text-muted-foreground" />
                </button>
                <button className="group flex w-full items-center gap-4 py-5 text-left" onClick={() => navigate("/quotes")}>
                  <span className="w-9 text-2xl font-semibold tabular-nums">{openQuotes.length}</span>
                  <span className="min-w-0 flex-1"><span className="block text-sm font-medium">Quotes awaiting a decision</span><span className="block text-xs text-muted-foreground">{money.format(quoteValue)} open</span></span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            </section>
          </div>

          <section>
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <SectionTitle>Pipeline overview</SectionTitle>
                <p className="mt-1 text-sm text-muted-foreground">{jobs.length} jobs across {pipelines.length} boards</p>
              </div>
              <Btn variant="ghost" onClick={() => navigate("/pipeline?pipeline=all")}>Open all boards <ArrowRight className="h-3 w-3" /></Btn>
            </div>
            <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
              {pipelines.map((pipeline) => {
                const summary = pipelineSummaries.find((item) => item.pipeline.id === pipeline.id);
                const active = pipeline.id === selectedPipeline?.id;
                return (
                  <button key={pipeline.id} className={`flex shrink-0 items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${active ? "border-primary bg-primary/10 text-primary" : "border-border bg-card hover:bg-surface"}`} onClick={() => setSelectedPipelineId(pipeline.id)}>
                    <PipelineIcon icon={pipeline.icon} className="h-3.5 w-3.5" />
                    {pipeline.name}
                    <span className="text-xs opacity-70">{summary?.boardJobs.length ?? 0}</span>
                  </button>
                );
              })}
            </div>

            <div className="border-hairline grid overflow-hidden rounded-lg bg-card xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.6fr)]">
              <div className="p-5 sm:p-6 xl:border-r-hairline">
                {selectedPipeline && selectedSummary ? (
                  <>
                    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-surface text-primary"><PipelineIcon icon={selectedPipeline.icon} className="h-4 w-4" /></span>
                        <div><h3 className="font-semibold">{selectedPipeline.name}</h3><p className="text-xs text-muted-foreground">{selectedSummary.boardJobs.length} jobs · {money.format(selectedValue)}</p></div>
                      </div>
                      <Btn variant="secondary" onClick={() => navigate(`/pipeline?pipeline=${selectedPipeline.id}`)}>Open board <ArrowRight className="h-3 w-3" /></Btn>
                    </div>
                    <div className="space-y-4">
                      {selectedSummary.stages.map((stage) => (
                        <div key={stage.id} className="grid grid-cols-[minmax(100px,0.7fr)_minmax(120px,1.5fr)_auto] items-center gap-3">
                          <span className="truncate text-sm">{stage.name}</span>
                          <div className="h-2 overflow-hidden rounded-full bg-surface"><div className="h-full rounded-full" style={{ width: `${(stage.count / selectedMaxStage) * 100}%`, backgroundColor: colorToCss(stage.color) }} /></div>
                          <span className="w-24 text-right text-xs tabular-nums text-muted-foreground">{stage.count} · {money.format(stage.value)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : <p className="text-sm text-muted-foreground">No pipeline boards yet.</p>}
              </div>

              <div className="border-t-hairline p-5 sm:p-6 xl:border-t-0">
                <h3 className="text-sm font-semibold">All boards</h3>
                <div className="mt-3 max-h-64 divide-y divide-border overflow-y-auto">
                  {pipelineSummaries.map(({ pipeline, boardJobs }) => {
                    const value = boardJobs.reduce((sum, job) => sum + job.value, 0);
                    return (
                      <button key={pipeline.id} className="group flex w-full items-center gap-3 py-3 text-left" onClick={() => setSelectedPipelineId(pipeline.id)}>
                        <StatusDot color={colorToCss(pipeline.color ?? "215 16% 47%")} />
                        <span className="min-w-0 flex-1 truncate text-sm font-medium">{pipeline.name}</span>
                        <span className="text-right text-xs tabular-nums text-muted-foreground">{boardJobs.length} jobs<br />{money.format(value)}</span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          <section className="border-t-hairline pt-6">
            <div className="mb-4 flex items-center justify-between gap-3"><SectionTitle>Recent activity</SectionTitle><Btn variant="ghost" onClick={() => navigate("/pipeline?pipeline=all")}>View all <ArrowRight className="h-3 w-3" /></Btn></div>
            <div className="divide-y divide-border">
              {recentActivity.length ? recentActivity.map((item, index) => (
                <button key={`${item.job.id}-${index}`} className="group grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 py-3 text-left sm:grid-cols-[auto_minmax(0,1fr)_minmax(120px,0.35fr)_auto]" onClick={() => navigate(`/pipeline?pipeline=${jobPipelineId(item.job)}`)}>
                  <StatusDot color={item.type === "email" ? "hsl(var(--primary))" : "hsl(var(--success))"} />
                  <span className="truncate text-sm">{item.text}</span>
                  <span className="hidden truncate text-xs text-muted-foreground sm:block">{item.job.customer}</span>
                  <span className="text-xs text-muted-foreground">{item.date}</span>
                </button>
              )) : <p className="py-4 text-sm text-muted-foreground">No activity recorded yet.</p>}
            </div>
          </section>
        </div>
      </PageBody>

      <NewJobDialog
        open={newJobOpen}
        onOpenChange={setNewJobOpen}
        defaultPipelineId={firstPipelineId}
        onCreate={addJob}
      />
      <EditContactDialog contact={null} open={newContactOpen} onOpenChange={setNewContactOpen} mode="create" />
    </>
  );
}