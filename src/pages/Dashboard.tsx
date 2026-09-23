import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  Clock3,
  Mail,
  Plus,
  PoundSterling,
  UserPlus,
  UserRoundX,
} from "lucide-react";
import { PageBody, Btn, StatusDot } from "@/components/layout/PageShell";
import NewJobDialog from "@/components/pipeline/NewJobDialog";
import { EditContactDialog } from "@/components/contacts/EditContactDialog";
import { contacts as seedContacts, employees, type Job } from "@/data/mockData";
import { addJob, useJobs } from "@/lib/jobsStore";
import { useQuotes } from "@/lib/quotesStore";
import { useInvoices } from "@/lib/invoicesStore";
import { docTotals, totals as invoiceTotals } from "@/lib/quoteUtils";
import { nextStep } from "@/lib/jobPlan";
import { useCostReporting } from "@/lib/costReporting";
import { colorToCss, pipelineIdForStage, resolveStageName, useStages } from "@/lib/stagesStore";
import { applyExtrasTo, mergeWithMock, useContactExtras, useImportedContacts } from "@/lib/contactsStore";

const money = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
});

const todayIso = () => new Date().toISOString().slice(0, 10);

function jobPipelineId(job: Job) {
  return job.pipelineId ?? pipelineIdForStage(resolveStageName(job.stage));
}

function CardTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xs font-semibold uppercase text-muted-foreground">{children}</h2>;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [jobs] = useJobs();
  const [quotes] = useQuotes();
  const [invoices] = useInvoices();
  const { pipelines } = useStages();
  const { totals: costTotals } = useCostReporting(jobs);
  const importedContacts = useImportedContacts();
  const contactExtras = useContactExtras();
  const contacts = useMemo(
    () => applyExtrasTo(mergeWithMock(seedContacts, importedContacts), contactExtras),
    [importedContacts, contactExtras],
  );
  const [newJobOpen, setNewJobOpen] = useState(false);
  const [newContactOpen, setNewContactOpen] = useState(false);

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

  const sourceCounts = useMemo(() => {
    const map = new Map<string, number>();
    contacts.forEach((contact) => map.set(contact.source || "Unknown", (map.get(contact.source || "Unknown") ?? 0) + 1));
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  }, [contacts]);

  const recentActivity = useMemo(
    () =>
      jobs
        .flatMap((job) => job.timeline.map((item) => ({ ...item, job })))
        .slice(0, 4),
    [jobs],
  );

  const firstPipelineId = pipelines[0]?.id ?? "sales";

  return (
    <>
      <header className="shrink-0 border-b-hairline px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-[22px] font-medium leading-none">Dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">What needs your attention today</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Btn onClick={() => setNewJobOpen(true)}><Plus className="h-3.5 w-3.5" /> New job</Btn>
            <Btn onClick={() => setNewContactOpen(true)}><UserPlus className="h-3.5 w-3.5" /> New contact</Btn>
            <Btn variant="primary" onClick={() => navigate("/marketing/email")}><Mail className="h-3.5 w-3.5" /> Send campaign</Btn>
          </div>
        </div>
      </header>

      <PageBody>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
          <section className="border-hairline flex min-h-52 flex-col rounded-lg bg-card p-5 lg:col-span-2">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <CardTitle>Today&apos;s work</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
                </p>
              </div>
              <Btn variant="ghost" className="h-7" onClick={() => navigate("/field")}>
                Schedule <ArrowRight className="h-3 w-3" />
              </Btn>
            </div>
            {todaysWork.length ? (
              <div className="space-y-2">
                {todaysWork.slice(0, 3).map(({ job, assignment }) => {
                  const employee = employees.find((person) => person.id === assignment.employeeId);
                  return (
                    <button
                      key={`${job.id}-${assignment.employeeId}-${assignment.start}`}
                      className="border-hairline flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-surface-hover"
                      onClick={() => navigate(`/field/job/${job.id}`)}
                    >
                      <span className="flex h-9 w-12 shrink-0 items-center justify-center rounded-md bg-primary/10 text-sm font-semibold text-primary">
                        {assignment.start}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{job.customer}</span>
                        <span className="block truncate text-xs text-muted-foreground">{job.service}</span>
                      </span>
                      <span className="hidden text-xs text-muted-foreground sm:block">{employee?.name ?? "Unassigned"}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-1 items-center gap-3 rounded-md bg-surface px-4 py-5">
                <CalendarDays className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">No work booked for today</p>
                  <p className="text-xs text-muted-foreground">Open the schedule to plan the next visit.</p>
                </div>
              </div>
            )}
          </section>

          <button className="border-hairline rounded-lg bg-card p-5 text-left transition-colors hover:bg-surface-hover" onClick={() => navigate("/reporting?tab=revenue")}>
            <CardTitle>Revenue this month</CardTitle>
            <p className="mt-5 text-3xl font-semibold tabular-nums">{money.format(monthlyRevenue)}</p>
            <p className="mt-2 text-xs text-muted-foreground">Paid invoices</p>
          </button>

          <button className="rounded-lg border border-destructive/20 bg-destructive/5 p-5 text-left transition-colors hover:bg-destructive/10" onClick={() => navigate("/pipeline?attention=1")}>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>Overdue actions</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </div>
            <p className="mt-5 text-3xl font-semibold tabular-nums text-destructive">{overdue.length}</p>
            <p className="mt-2 text-xs text-muted-foreground">{overdue.length ? "Need following up" : "Nothing overdue"}</p>
          </button>

          <section className="border-hairline rounded-lg bg-card p-5 lg:col-span-2 lg:row-span-2">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <CardTitle>Pipeline summary</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">{jobs.length} jobs across {pipelines.length} boards</p>
              </div>
              <Btn variant="ghost" className="h-7" onClick={() => navigate(`/pipeline?pipeline=${firstPipelineId}`)}>
                Open boards <ArrowRight className="h-3 w-3" />
              </Btn>
            </div>
            <div className="space-y-5">
              {pipelineSummaries.map(({ pipeline, boardJobs, stages }) => {
                const max = Math.max(...stages.map((stage) => stage.count), 1);
                return (
                  <div key={pipeline.id}>
                    <button className="mb-2 flex w-full items-center justify-between text-left" onClick={() => navigate(`/pipeline?pipeline=${pipeline.id}`)}>
                      <span className="flex items-center gap-2 text-sm font-medium">
                        <StatusDot color={colorToCss(pipeline.color ?? "215 16% 47%")} /> {pipeline.name}
                      </span>
                      <span className="text-xs text-muted-foreground">{boardJobs.length} jobs</span>
                    </button>
                    <div className="space-y-2">
                      {stages.filter((stage) => stage.count > 0).slice(0, 4).map((stage) => (
                        <div key={stage.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1">
                          <span className="truncate text-xs text-muted-foreground">{stage.name}</span>
                          <span className="text-xs font-medium tabular-nums">{stage.count} · {money.format(stage.value)}</span>
                          <div className="col-span-2 h-1.5 overflow-hidden rounded-full bg-surface">
                            <div className="h-full rounded-full" style={{ width: `${(stage.count / max) * 100}%`, backgroundColor: colorToCss(stage.color) }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <button className="border-hairline rounded-lg bg-card p-5 text-center transition-colors hover:bg-surface-hover" onClick={() => navigate("/reporting?tab=pipeline")}>
            <CardTitle>Conversion</CardTitle>
            <p className="mt-4 text-4xl font-semibold tabular-nums">{conversion}%</p>
            <div className="mx-auto mt-3 h-1 w-12 rounded-full bg-primary" />
            <p className="mt-3 text-xs text-muted-foreground">Decided quotes won</p>
          </button>

          <button className="border-hairline rounded-lg bg-card p-5 text-left transition-colors hover:bg-surface-hover" onClick={() => navigate("/quotes")}>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>Quotes to follow up</CardTitle>
              <Clock3 className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="mt-4 text-3xl font-semibold tabular-nums">{openQuotes.length}</p>
            <p className="mt-2 text-xs text-muted-foreground">{money.format(quoteValue)} awaiting a decision</p>
          </button>

          <button className="rounded-lg border border-warning/20 bg-warning/5 p-5 text-left transition-colors hover:bg-warning/10" onClick={() => navigate("/pipeline?pipeline=all")}>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>Unassigned jobs</CardTitle>
              <UserRoundX className="h-4 w-4 text-warning" />
            </div>
            <p className="mt-4 text-3xl font-semibold tabular-nums">{unassigned.length}</p>
            <p className="mt-2 text-xs text-muted-foreground">{unassigned.length ? "Ready to assign" : "Everyone has an owner"}</p>
          </button>

          <button className="border-hairline rounded-lg bg-card p-5 text-left transition-colors hover:bg-surface-hover" onClick={() => navigate("/reporting?tab=revenue")}>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>Expected profit</CardTitle>
              <PoundSterling className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-4 text-3xl font-semibold tabular-nums">{money.format(costTotals.profit)}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Based on {costTotals.costedCount} costed {costTotals.costedCount === 1 ? "job" : "jobs"}
            </p>
          </button>

          <section className="border-hairline rounded-lg bg-card p-5 lg:col-span-2">
            <div className="mb-4 flex items-center justify-between gap-3">
              <CardTitle>Recent activity</CardTitle>
              <Btn variant="ghost" className="h-7" onClick={() => navigate("/pipeline?pipeline=all")}>View all <ArrowRight className="h-3 w-3" /></Btn>
            </div>
            <div className="space-y-3">
              {recentActivity.length ? recentActivity.map((item, index) => (
                <button key={`${item.job.id}-${index}`} className="flex w-full items-center gap-3 text-left" onClick={() => navigate(`/pipeline?pipeline=${jobPipelineId(item.job)}`)}>
                  <StatusDot color={item.type === "email" ? "hsl(var(--primary))" : "hsl(var(--success))"} />
                  <span className="min-w-0 flex-1 truncate text-sm">{item.text}</span>
                  <span className="hidden text-xs text-muted-foreground sm:block">{item.job.customer}</span>
                  <span className="text-xs text-muted-foreground">{item.date}</span>
                </button>
              )) : <p className="text-sm text-muted-foreground">No activity recorded yet.</p>}
            </div>
          </section>

          <section className="rounded-lg bg-foreground p-5 text-background">
            <CardTitle>Lead sources</CardTitle>
            <div className="mt-4 space-y-2.5">
              {sourceCounts.map((source) => (
                <div key={source.name} className="flex items-center justify-between gap-3 text-xs">
                  <span className="truncate opacity-70">{source.name}</span>
                  <span className="font-medium tabular-nums">{source.count}</span>
                </div>
              ))}
            </div>
          </section>

          <button className="border-hairline rounded-lg bg-card p-5 text-left transition-colors hover:bg-surface-hover" onClick={() => navigate("/quotes")}>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>Open quote value</CardTitle>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="mt-4 text-2xl font-semibold tabular-nums">{money.format(quoteValue)}</p>
            <p className="mt-2 text-xs text-muted-foreground">Across {openQuotes.length} sent quotes</p>
          </button>
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