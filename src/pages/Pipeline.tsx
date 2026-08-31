import { useEffect, useMemo, useState, type DragEvent } from "react";
import { Link } from "react-router-dom";
import { useToast, toast as topToast } from "@/hooks/use-toast";
import { PageHeader, Btn, StatusDot, Pill } from "@/components/layout/PageShell";
import { Plus, X, Phone, Mail, MapPin, LayoutGrid, List, Search, ArrowUpDown, AlertCircle, BarChart3, StickyNote, CalendarDays, Clock, Users, Settings2, Columns3, Pencil, Check } from "lucide-react";
import { stages as seedStages, stageColors as seedStageColors, employees, type Job, type PipelineStage, type Trade } from "@/data/mockData";
import { useJobs } from "@/lib/jobsStore";
import { onJobStageChange } from "@/lib/lifecycle";
import { useStages, resolveStageName, colorToCss } from "@/lib/stagesStore";

import ScheduleView from "@/components/pipeline/ScheduleView";
import NewJobDialog from "@/components/pipeline/NewJobDialog";
import JobFieldInput from "@/components/pipeline/JobFieldInput";
import ManageJobFieldsDialog from "@/components/pipeline/ManageJobFieldsDialog";
import ManageStagesDialog from "@/components/pipeline/ManageStagesDialog";
import { useJobFieldSchema, formatFieldValue } from "@/lib/jobFields";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import SiteVisitSection from "@/components/pipeline/SiteVisitSection";
import FieldOpportunities from "@/components/pipeline/FieldOpportunities";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Channel = "email";
interface MessageTemplate {
  id: string;
  label: string;
  description: string;
  stages?: PipelineStage[];
  build: (job: Job) => { subject?: string; body: string };
}

const emailTemplates: MessageTemplate[] = [
  { id: "quote-followup", label: "Quote follow-up", description: "Detailed nudge with quote recap", stages: ["Quote sent"], build: (j) => ({ subject: `Following up on your ${j.service} quote`, body: `Hi ${j.customer.split(" ")[0]},\n\nJust circling back on the quote we sent for ${j.service} at £${j.value}. Let me know if anything in the scope needs adjusting, or if you'd like to lock in a date.\n\nThanks,\nThe team` }) },
  { id: "booking-confirm", label: "Booking confirmation", description: "Confirm scheduled work in writing", stages: ["Job booked"], build: (j) => ({ subject: `Booking confirmed — ${j.service}`, body: `Hi ${j.customer.split(" ")[0]},\n\nConfirming your booking for ${j.service} at ${j.address}. We'll be in touch the day before with an arrival window.\n\nThanks,\nThe team` }) },
  { id: "job-complete", label: "Job complete summary", description: "Recap of work done", stages: ["Completed", "In progress"], build: (j) => ({ subject: `${j.service} — work completed`, body: `Hi ${j.customer.split(" ")[0]},\n\nThe ${j.service} work is now complete. Your invoice will follow shortly. Please don't hesitate to reach out with any questions.\n\nThanks,\nThe team` }) },
  { id: "invoice-send", label: "Send invoice", description: "Attach and deliver the invoice", stages: ["Completed", "Invoiced"], build: (j) => ({ subject: `Invoice ${j.invoiceId ?? ""} for ${j.service}`.trim(), body: `Hi ${j.customer.split(" ")[0]},\n\nPlease find attached invoice ${j.invoiceId ?? "(pending)"} for £${j.value}, due within 14 days. Bank details are on the invoice.\n\nThanks,\nThe team` }) },
  { id: "payment-reminder", label: "Payment reminder", description: "Polite chase on an unpaid invoice", stages: ["Invoiced"], build: (j) => ({ subject: `Reminder: invoice ${j.invoiceId ?? ""} due`.trim(), body: `Hi ${j.customer.split(" ")[0]},\n\nA gentle reminder that invoice ${j.invoiceId ?? "(pending)"} for £${j.value} is now due. Please let us know once payment is on its way, or if you need anything resent.\n\nThanks,\nThe team` }) },
  { id: "review-request", label: "Review request", description: "Ask for a review with link", stages: ["Paid"], build: (j) => ({ subject: "How did we do?", body: `Hi ${j.customer.split(" ")[0]},\n\nThanks again for your custom on the ${j.service} job. If you have a moment, we'd really appreciate a quick Google review: [link]\n\nThanks,\nThe team` }) },
];

function sortTemplatesForJob(templates: MessageTemplate[], job: Job): MessageTemplate[] {
  return [...templates].sort((a, b) => {
    const aMatch = a.stages?.includes(job.stage) ? 0 : 1;
    const bMatch = b.stages?.includes(job.stage) ? 0 : 1;
    return aMatch - bMatch;
  });
}

type View = "board" | "list" | "schedule";
type SortKey = "customer" | "service" | "stage" | "value" | "daysInStage";
type SortDir = "asc" | "desc";

const seedStageTones: Record<PipelineStage, "neutral" | "success" | "warning" | "danger" | "info"> = {
  "New enquiry": "info",
  "Quote sent": "warning",
  "Job booked": "info",
  "In progress": "warning",
  Completed: "success",
  Invoiced: "warning",
  Paid: "success",
};
const stageToneFor = (s: string) => seedStageTones[s as PipelineStage] ?? "neutral";

const seedStuckThresholds: Record<PipelineStage, number> = {
  "New enquiry": 2,
  "Quote sent": 4,
  "Job booked": 7,
  "In progress": 5,
  Completed: 2,
  Invoiced: 14,
  Paid: 999,
};
const stuckFor = (s: string) => seedStuckThresholds[s as PipelineStage] ?? 7;

export default function Pipeline() {
  const [jobListRaw, setJobListInternal] = useJobs();
  const { stages: stageDefs, stageNames, colorFor, renameStage: _r } = useStages();
  void _r;

  // Resolve any renamed stages on jobs at read time so seed jobs still slot into renamed columns.
  const jobList = useMemo(
    () => jobListRaw.map((j) => ({ ...j, stage: resolveStageName(j.stage) as PipelineStage })),
    [jobListRaw, stageDefs],
  );
  const setJobList = setJobListInternal;

  const [selected, setSelected] = useState<Job | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const [view, setView] = useState<View>("board");
  const [newJobOpen, setNewJobOpen] = useState(false);
  const [manageFieldsOpen, setManageFieldsOpen] = useState(false);
  const [manageStagesOpen, setManageStagesOpen] = useState(false);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [schema, setSchema] = useJobFieldSchema();
  const cardFields = schema.filter((f) => f.showOnCard);

  // Keep selected drawer in sync if the underlying job changes.
  useEffect(() => {
    if (!selected) return;
    const fresh = jobList.find((j) => j.id === selected.id);
    if (fresh && fresh !== selected) setSelected(fresh);
  }, [jobList, selected]);

  const handleDragStart = (e: DragEvent<HTMLDivElement>, jobId: string) => {
    setDraggingId(jobId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", jobId);
  };
  const handleDragEnd = () => { setDraggingId(null); setDragOverStage(null); };
  const handleDragOver = (e: DragEvent<HTMLDivElement>, stage: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverStage !== stage) setDragOverStage(stage);
  };
  const runLifecycle = (jobId: string, newStage: string) => {
    const r = onJobStageChange(jobId, newStage);
    if (r) topToast({ title: "Automatic update", description: r.message });
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, stage: string) => {
    e.preventDefault();
    const jobId = e.dataTransfer.getData("text/plain") || draggingId;
    if (!jobId) return;
    const prevJob = jobList.find((j) => j.id === jobId);
    setJobList((prev) =>
      prev.map((j) => (j.id === jobId && j.stage !== stage ? { ...j, stage: stage as PipelineStage, daysInStage: 0 } : j)),
    );
    setDraggingId(null);
    setDragOverStage(null);
    if (prevJob && prevJob.stage !== stage) runLifecycle(jobId, stage);
  };

  const handleStageRename = (oldName: string, newName: string) => {
    setJobList((prev) =>
      prev.map((j) => (j.stage === oldName ? { ...j, stage: newName as PipelineStage } : j)),
    );
  };

  const updateJob = (id: string, patch: Partial<Job>) => {
    const prevJob = jobList.find((j) => j.id === id);
    setJobList((prev) => prev.map((j) => (j.id === id ? { ...j, ...patch } : j)));
    if (patch.stage && prevJob && prevJob.stage !== patch.stage) runLifecycle(id, patch.stage);
  };


  return (
    <>
      <PageHeader
        title="Jobs & pipeline"
        description={view === "board" ? "Drag and track jobs through every stage" : view === "list" ? "Detailed view of every job across all stages" : "Schedule your team across the week — drag jobs onto employees"}
        actions={
          <>
            <Link
              to="/reporting?tab=pipeline"
              className="h-8 px-2.5 rounded-md text-sm font-medium inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors"
            >
              <BarChart3 className="w-3.5 h-3.5" /> Analytics
            </Link>
            <ViewToggle view={view} onChange={setView} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="h-8 px-2.5 rounded-md text-sm font-medium inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors border-hairline">
                  <Settings2 className="w-3.5 h-3.5" /> Settings
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                  Pipeline configuration
                </DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setManageStagesOpen(true)} className="cursor-pointer">
                  <Columns3 className="w-3.5 h-3.5 mr-2" /> Stages
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setManageFieldsOpen(true)} className="cursor-pointer">
                  <Settings2 className="w-3.5 h-3.5 mr-2" /> Fields
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Btn variant="primary" onClick={() => setNewJobOpen(true)}><Plus className="w-3.5 h-3.5" /> New job</Btn>
          </>
        }
      />

      {view === "board" && (
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <div className="flex gap-3 px-8 py-6 h-full min-w-max">
            {stageNames.map((stage) => {
              const stageJobs = jobList.filter((j) => j.stage === stage);
              const total = stageJobs.reduce((s, j) => s + j.value, 0);
              const isOver = dragOverStage === stage;
              const stageColor = colorToCss(colorFor(stage));
              return (
                <div
                  key={stage}
                  className="w-[260px] shrink-0 flex flex-col"
                  onDragOver={(e) => handleDragOver(e, stage)}
                  onDragLeave={() => setDragOverStage((s) => (s === stage ? null : s))}
                  onDrop={(e) => handleDrop(e, stage)}
                >
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <StatusDot color={stageColor} />
                    <span className="text-sm font-medium truncate">{stage}</span>
                    <span className="text-xs text-muted-foreground">{stageJobs.length}</span>
                    <span className="ml-auto text-xs text-muted-foreground tabular-nums">£{total}</span>
                  </div>
                  <div className={`flex-1 space-y-2 overflow-y-auto pb-4 rounded-lg transition-colors ${isOver ? "bg-surface-hover" : ""}`}>
                    {stageJobs.map((job) => (
                      <BoardCard
                        key={job.id}
                        job={job}
                        stageColor={stageColor}
                        cardFields={cardFields}
                        editing={editingCardId === job.id}
                        dragging={draggingId === job.id}
                        onStartEdit={() => setEditingCardId(job.id)}
                        onCancelEdit={() => setEditingCardId(null)}
                        onSaveEdit={(patch) => { updateJob(job.id, patch); setEditingCardId(null); }}
                        onSelect={() => setSelected(job)}
                        onDragStart={(e) => handleDragStart(e, job.id)}
                        onDragEnd={handleDragEnd}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {view === "list" && <JobsListView jobs={jobList} stageNames={stageNames} colorFor={colorFor} onSelect={setSelected} />}
      {view === "schedule" && (
        <ScheduleView
          jobs={jobList}
          onUpdateJob={(jobId, updater) =>
            setJobList((prev) => prev.map((j) => (j.id === jobId ? updater(j) : j)))
          }
          onSelectJob={setSelected}
        />
      )}

      {view === "list" && (
        <div className="px-6 pb-6">
          <FieldOpportunities />
        </div>
      )}



      {selected && (
        <JobDrawer
          job={selected}
          stageNames={stageNames}
          colorFor={colorFor}
          onClose={() => setSelected(null)}
          onUpdate={(patch) => {
            updateJob(selected.id, patch);
            setSelected((s) => (s ? { ...s, ...patch } : s));
          }}
        />
      )}
      <NewJobDialog
        open={newJobOpen}
        onOpenChange={setNewJobOpen}
        onCreate={(job) => setJobList((prev) => [job, ...prev])}
      />
      <ManageJobFieldsDialog
        open={manageFieldsOpen}
        onOpenChange={setManageFieldsOpen}
        schema={schema}
        onSave={setSchema}
      />
      <ManageStagesDialog
        open={manageStagesOpen}
        onOpenChange={setManageStagesOpen}
        onRename={handleStageRename}
      />
    </>
  );
}

function BoardCard({
  job,
  stageColor,
  cardFields,
  editing,
  dragging,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onSelect,
  onDragStart,
  onDragEnd,
}: {
  job: Job;
  stageColor: string;
  cardFields: ReturnType<typeof useJobFieldSchema>[0];
  editing: boolean;
  dragging: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: (patch: Partial<Job>) => void;
  onSelect: () => void;
  onDragStart: (e: DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
}) {
  const [customer, setCustomer] = useState(job.customer);
  const [service, setService] = useState(job.service);
  const [value, setValue] = useState<string>(String(job.value));

  useEffect(() => {
    if (editing) {
      setCustomer(job.customer);
      setService(job.service);
      setValue(String(job.value));
    }
  }, [editing, job.customer, job.service, job.value]);

  if (editing) {
    return (
      <div
        className="w-full text-left bg-card border-hairline rounded-lg p-3 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute left-0 top-0 bottom-0 w-0.5" style={{ backgroundColor: stageColor }} />
        <div className="space-y-1.5">
          <Input value={customer} onChange={(e) => setCustomer(e.target.value)} className="h-7 text-sm font-medium" placeholder="Customer" />
          <Input value={service} onChange={(e) => setService(e.target.value)} className="h-7 text-xs" placeholder="Service" />
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">£</span>
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="h-7 text-sm tabular-nums"
              type="number"
              inputMode="numeric"
            />
          </div>
          <div className="flex gap-1.5 pt-1">
            <Button size="sm" className="h-7 px-2 flex-1" onClick={() => onSaveEdit({ customer, service, value: parseFloat(value) || 0 })}>
              <Check className="w-3 h-3" /> Save
            </Button>
            <Button size="sm" variant="ghost" className="h-7 px-2" onClick={onCancelEdit}>
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onSelect}
      className={`group w-full text-left bg-card border-hairline rounded-lg p-3 hover:bg-surface-hover transition-all relative overflow-hidden cursor-grab active:cursor-grabbing ${dragging ? "opacity-40" : ""}`}
    >
      <div className="absolute left-0 top-0 bottom-0 w-0.5" style={{ backgroundColor: stageColor }} />
      <button
        onClick={(e) => { e.stopPropagation(); onStartEdit(); }}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-background"
        title="Quick edit"
        aria-label="Quick edit"
      >
        <Pencil className="w-3 h-3 text-muted-foreground" />
      </button>
      <div className="text-sm font-medium truncate pr-5">{job.customer}</div>
      <div className="text-xs text-muted-foreground mt-0.5 truncate">{job.service}</div>
      <div className="flex items-center justify-between mt-2.5">
        <span className="text-sm font-medium tabular-nums">£{job.value}</span>
        <span className="text-xs text-muted-foreground">{job.daysInStage}d</span>
      </div>
      {cardFields.length > 0 && cardFields.some((f) => job.customFields?.[f.id] !== undefined && job.customFields?.[f.id] !== "") && (
        <div className="flex flex-wrap gap-1 mt-2">
          {cardFields.map((f) => {
            const v = job.customFields?.[f.id];
            if (v === undefined || v === "" || v === false) return null;
            return (
              <span key={f.id} className="text-[10px] px-1.5 py-0.5 rounded bg-surface-hover text-muted-foreground">
                {f.label}: <span className="text-foreground">{formatFieldValue(f, v)}</span>
              </span>
            );
          })}
        </div>
      )}
      {job.milestones && job.milestones.length > 0 && (() => {
        const done = job.milestones.filter((m) => m.done).length;
        const total = job.milestones.length;
        const pct = total ? (done / total) * 100 : 0;
        const next = job.milestones.find((m) => !m.done);
        return (
          <div className="mt-2.5">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
              <span className="truncate pr-2">{next ? `Next: ${next.label}` : "All milestones complete"}</span>
              <span className="tabular-nums shrink-0">{done}/{total}</span>
            </div>
            <div className="h-1 rounded-full bg-surface-hover overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: stageColor }} />
            </div>
          </div>
        );
      })()}
      {job.assignments && job.assignments.length > 0 && (
        <div className="flex items-center gap-1 mt-2 pt-2 border-t-hairline">
          <Users className="w-3 h-3 text-muted-foreground" />
          <div className="flex -space-x-1">
            {job.assignments.slice(0, 3).map((a, i) => {
              const emp = employees.find((e) => e.id === a.employeeId);
              if (!emp) return null;
              return (
                <span
                  key={i}
                  title={emp.name}
                  className="w-4 h-4 rounded-full inline-flex items-center justify-center text-[8px] font-medium text-white border border-card"
                  style={{ backgroundColor: `hsl(${emp.color})` }}
                >
                  {emp.initials}
                </span>
              );
            })}
          </div>
          <span className="text-[10px] text-muted-foreground tabular-nums ml-auto inline-flex items-center gap-0.5">
            <Clock className="w-2.5 h-2.5" />
            {job.assignments[0].date.slice(5)}
          </span>
        </div>
      )}
    </div>
  );
}

function ViewToggle({ view, onChange }: { view: View; onChange: (v: View) => void }) {
  return (
    <div className="inline-flex h-8 rounded-md border-hairline bg-background p-0.5">
      <button onClick={() => onChange("board")} className={`h-7 px-2.5 rounded-[5px] text-xs font-medium inline-flex items-center gap-1.5 transition-colors ${view === "board" ? "bg-surface-hover text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
        <LayoutGrid className="w-3.5 h-3.5" /> Board
      </button>
      <button onClick={() => onChange("list")} className={`h-7 px-2.5 rounded-[5px] text-xs font-medium inline-flex items-center gap-1.5 transition-colors ${view === "list" ? "bg-surface-hover text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
        <List className="w-3.5 h-3.5" /> List
      </button>
      <button onClick={() => onChange("schedule")} className={`h-7 px-2.5 rounded-[5px] text-xs font-medium inline-flex items-center gap-1.5 transition-colors ${view === "schedule" ? "bg-surface-hover text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
        <CalendarDays className="w-3.5 h-3.5" /> Schedule
      </button>
    </div>
  );
}

function getLastContact(job: Job): { type: "email" | "note"; text: string; date: string } | null {
  if (!job.timeline || job.timeline.length === 0) return null;
  return job.timeline[job.timeline.length - 1];
}

const channelMeta: Record<"email" | "note", { label: string; Icon: typeof Mail }> = {
  email: { label: "Email", Icon: Mail },
  note: { label: "Note", Icon: StickyNote },
};

function JobsListView({
  jobs,
  stageNames,
  colorFor,
  onSelect,
}: {
  jobs: Job[];
  stageNames: string[];
  colorFor: (name: string) => string;
  onSelect: (j: Job) => void;
}) {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("All");
  const [onlyStuck, setOnlyStuck] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("daysInStage");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const handleTemplateSend = (job: Job, channel: Channel, template: MessageTemplate) => {
    const built = template.build(job);
    toast({
      title: `Email drafted: ${template.label}`,
      description: built.subject ? `To ${job.customer} — "${built.subject}"` : `To ${job.customer} — ${built.body.slice(0, 80)}${built.body.length > 80 ? "…" : ""}`,
    });
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return jobs
      .filter((j) => (stageFilter === "All" ? true : j.stage === stageFilter))
      .filter((j) => (onlyStuck ? j.daysInStage >= stuckFor(j.stage) : true))
      .filter((j) =>
        q
          ? j.customer.toLowerCase().includes(q) || j.service.toLowerCase().includes(q) || j.address.toLowerCase().includes(q) || (j.invoiceId ?? "").toLowerCase().includes(q)
          : true,
      )
      .sort((a, b) => {
        const dir = sortDir === "asc" ? 1 : -1;
        const av = a[sortKey];
        const bv = b[sortKey];
        if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
        return String(av).localeCompare(String(bv)) * dir;
      });
  }, [jobs, query, stageFilter, onlyStuck, sortKey, sortDir]);

  const totalValue = filtered.reduce((s, j) => s + j.value, 0);
  const stuckCount = filtered.filter((j) => j.daysInStage >= stuckFor(j.stage)).length;

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  return (
    <div className="flex-1 overflow-auto px-8 py-6">
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search customer, service, address…"
            className="h-8 w-72 pl-8 pr-3 text-sm rounded-md border-hairline bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-1 ml-1 flex-wrap">
          <FilterChip active={stageFilter === "All"} onClick={() => setStageFilter("All")}>
            All <span className="text-muted-foreground ml-1">{jobs.length}</span>
          </FilterChip>
          {stageNames.map((s) => {
            const count = jobs.filter((j) => j.stage === s).length;
            return (
              <FilterChip key={s} active={stageFilter === s} onClick={() => setStageFilter(s)}>
                <StatusDot color={colorToCss(colorFor(s))} />
                <span className="ml-1.5">{s}</span>
                <span className="text-muted-foreground ml-1">{count}</span>
              </FilterChip>
            );
          })}
        </div>

        <button
          onClick={() => setOnlyStuck((v) => !v)}
          className={`h-8 px-2.5 rounded-md text-xs font-medium inline-flex items-center gap-1.5 border-hairline transition-colors ${onlyStuck ? "bg-[hsl(var(--destructive)/0.1)] text-[hsl(var(--destructive))]" : "bg-background text-muted-foreground hover:text-foreground"}`}
        >
          <AlertCircle className="w-3.5 h-3.5" /> Stuck only
        </button>

        <div className="ml-auto text-xs text-muted-foreground tabular-nums">
          {filtered.length} jobs · £{totalValue.toLocaleString()} total
          {stuckCount > 0 && <span className="ml-2 text-[hsl(var(--destructive))]">· {stuckCount} stuck</span>}
        </div>
      </div>

      <div className="border-hairline rounded-lg overflow-hidden bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-hairline bg-surface/40">
              <SortableTh label="Customer" col="customer" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
              <SortableTh label="Service" col="service" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
              <SortableTh label="Stage" col="stage" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
              <SortableTh label="Value" col="value" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} align="right" />
              <SortableTh label="Days" col="daysInStage" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} align="right" />
              <th className="text-left font-medium text-muted-foreground text-xs uppercase tracking-wide px-3 h-9">Last contact</th>
              <th className="text-left font-medium text-muted-foreground text-xs uppercase tracking-wide px-3 h-9">Invoice</th>
              <th className="text-right font-medium text-muted-foreground text-xs uppercase tracking-wide px-3 h-9 w-px whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-sm text-muted-foreground">No jobs match these filters.</td>
              </tr>
            ) : (
              filtered.map((job) => {
                const stuck = job.daysInStage >= stuckFor(job.stage);
                const last = getLastContact(job);
                const ChannelIcon = last ? channelMeta[last.type].Icon : null;
                return (
                  <tr key={job.id} onClick={() => onSelect(job)} className="border-b-hairline last:border-0 hover:bg-surface-hover cursor-pointer transition-colors group">
                    <td className="px-3 py-3 font-medium">{job.customer}</td>
                    <td className="px-3 py-3 text-muted-foreground">{job.service}</td>
                    <td className="px-3 py-3">
                      <Pill tone={stageToneFor(job.stage)}>
                        <StatusDot color={colorToCss(colorFor(job.stage))} />
                        {job.stage}
                      </Pill>
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums font-medium">£{job.value.toLocaleString()}</td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      <span className={stuck ? "text-[hsl(var(--destructive))] font-medium" : "text-muted-foreground"}>{job.daysInStage}d</span>
                    </td>
                    <td className="px-3 py-3 max-w-[280px]">
                      {last && ChannelIcon ? (
                        <div className="flex items-start gap-2 min-w-0">
                          <ChannelIcon className="w-3.5 h-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                          <div className="min-w-0 flex-1">
                            <div className="text-foreground text-xs truncate">{last.text}</div>
                            <div className="text-[11px] text-muted-foreground mt-0.5">{channelMeta[last.type].label} · {last.date}</div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">No contact yet</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-muted-foreground tabular-nums">{job.invoiceId ?? "—"}</td>
                    <td className="px-3 py-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                        <TemplateMenu channel="email" job={job} icon={<Mail className="w-3.5 h-3.5" />} label="Send email" onSend={handleTemplateSend} />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TemplateMenu({ channel, job, icon, label, onSend }: { channel: Channel; job: Job; icon: React.ReactNode; label: string; onSend: (job: Job, channel: Channel, template: MessageTemplate) => void; }) {
  const ordered = sortTemplatesForJob(emailTemplates, job);
  const suggested = ordered.filter((t) => t.stages?.includes(job.stage));
  const others = ordered.filter((t) => !t.stages?.includes(job.stage));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button onClick={(e) => e.stopPropagation()} title={label} aria-label={label} className="w-7 h-7 rounded-md inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-background border-hairline transition-colors">
          {icon}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Email templates</DropdownMenuLabel>
        {suggested.length > 0 && (
          <>
            <DropdownMenuLabel className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium pt-0">Suggested for {job.stage}</DropdownMenuLabel>
            {suggested.map((t) => (
              <TemplateItem key={t.id} template={t} onSelect={() => onSend(job, channel, t)} />
            ))}
            {others.length > 0 && <DropdownMenuSeparator />}
          </>
        )}
        {others.map((t) => (
          <TemplateItem key={t.id} template={t} onSelect={() => onSend(job, channel, t)} />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TemplateItem({ template, onSelect }: { template: MessageTemplate; onSelect: () => void }) {
  return (
    <DropdownMenuItem onClick={onSelect} className="flex flex-col items-start gap-0.5 py-2 cursor-pointer">
      <div className="text-sm font-medium">{template.label}</div>
      <div className="text-xs text-muted-foreground">{template.description}</div>
    </DropdownMenuItem>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`h-8 px-2.5 rounded-md text-xs font-medium inline-flex items-center transition-colors ${active ? "bg-surface-hover text-foreground border-hairline" : "text-muted-foreground hover:text-foreground hover:bg-surface-hover"}`}>
      {children}
    </button>
  );
}

function SortableTh({ label, col, sortKey, sortDir, onClick, align = "left" }: { label: string; col: SortKey; sortKey: SortKey; sortDir: SortDir; onClick: (k: SortKey) => void; align?: "left" | "right"; }) {
  const active = sortKey === col;
  return (
    <th className={`font-medium text-muted-foreground text-xs uppercase tracking-wide px-3 h-9 ${align === "right" ? "text-right" : "text-left"}`}>
      <button onClick={() => onClick(col)} className={`inline-flex items-center gap-1 hover:text-foreground transition-colors ${active ? "text-foreground" : ""}`}>
        {label}
        <ArrowUpDown className={`w-3 h-3 ${active ? "opacity-100" : "opacity-40"}`} />
        {active && <span className="text-[10px] ml-0.5">{sortDir === "asc" ? "↑" : "↓"}</span>}
      </button>
    </th>
  );
}

const TRADES: Trade[] = ["Plumbing", "Electrical", "Window cleaning", "Landscaping", "General"];

function JobDrawer({
  job,
  stageNames,
  colorFor,
  onClose,
  onUpdate,
}: {
  job: Job;
  stageNames: string[];
  colorFor: (n: string) => string;
  onClose: () => void;
  onUpdate: (patch: Partial<Job>) => void;
}) {
  const [schema] = useJobFieldSchema();
  const setFieldValue = (fieldId: string, value: string | number | boolean) => {
    const next = { ...(job.customFields ?? {}), [fieldId]: value };
    onUpdate({ customFields: next });
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/25 z-40 animate-fade-in" onClick={onClose} />
      <aside className="fixed top-0 right-0 h-screen w-[480px] bg-background border-l-hairline z-50 flex flex-col animate-slide-in-right">
        <header className="h-14 px-5 flex items-center justify-between border-b-hairline shrink-0 gap-2">
          <Select value={job.stage} onValueChange={(v) => onUpdate({ stage: v as PipelineStage })}>
            <SelectTrigger className="h-8 w-auto border-hairline gap-2">
              <span className="inline-flex items-center gap-2">
                <StatusDot color={colorToCss(colorFor(job.stage))} />
                <SelectValue />
              </span>
            </SelectTrigger>
            <SelectContent>
              {stageNames.map((s) => (
                <SelectItem key={s} value={s}>
                  <span className="inline-flex items-center gap-2">
                    <StatusDot color={colorToCss(colorFor(s))} />
                    {s}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button onClick={onClose} className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-surface-hover">
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div className="space-y-2">
            <InlineEdit
              value={job.customer}
              onSave={(v) => onUpdate({ customer: v })}
              displayClassName="text-lg font-medium"
              inputClassName="h-9 text-lg font-medium"
              placeholder="Customer name"
            />
            <InlineEdit
              value={job.service}
              onSave={(v) => onUpdate({ service: v })}
              displayClassName="text-sm text-muted-foreground"
              placeholder="Service / job description"
            />
          </div>

          <Section title="Job details">
            <div className="space-y-2 text-sm">
              <FieldRow label="Trade">
                <Select value={job.trade ?? "General"} onValueChange={(v) => onUpdate({ trade: v as Trade })}>
                  <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TRADES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FieldRow>
              <FieldRow label="Value (£)">
                <Input
                  type="number"
                  value={job.value}
                  onChange={(e) => onUpdate({ value: parseFloat(e.target.value) || 0 })}
                  className="h-8 tabular-nums"
                />
              </FieldRow>
              <FieldRow label="Quote (£)">
                <Input
                  type="number"
                  value={job.quoteValue}
                  onChange={(e) => onUpdate({ quoteValue: parseFloat(e.target.value) || 0 })}
                  className="h-8 tabular-nums"
                />
              </FieldRow>
              <FieldRow label="Est. hours">
                <Input
                  type="number"
                  value={job.estimatedHours ?? 0}
                  onChange={(e) => onUpdate({ estimatedHours: parseFloat(e.target.value) || 0 })}
                  className="h-8 tabular-nums"
                />
              </FieldRow>
              <FieldRow label="Address">
                <Input value={job.address} onChange={(e) => onUpdate({ address: e.target.value })} className="h-8" />
              </FieldRow>
              <FieldRow label="Postcode">
                <Input value={job.postcode ?? ""} onChange={(e) => onUpdate({ postcode: e.target.value })} className="h-8" />
              </FieldRow>
            </div>
          </Section>

          <Section title="Job notes">
            <Textarea
              value={job.notes}
              onChange={(e) => onUpdate({ notes: e.target.value })}
              rows={3}
              placeholder="Add notes about this job…"
            />
          </Section>

          <MilestonesSection job={job} onUpdate={onUpdate} colorFor={colorFor} />

          {schema.length > 0 && (
            <Section title="Custom fields">
              <div className="space-y-2">
                {schema.map((f) => (
                  <div key={f.id} className="grid grid-cols-[120px_1fr] items-center gap-2 text-sm">
                    <span className="text-xs text-muted-foreground">{f.label}</span>
                    <JobFieldInput
                      field={f}
                      value={job.customFields?.[f.id]}
                      onChange={(v) => v !== undefined && setFieldValue(f.id, v as string | number | boolean)}
                    />
                  </div>
                ))}
              </div>
            </Section>
          )}

          <Section title="Site visit">
            <SiteVisitSection jobId={job.id} />
          </Section>


          <Section title="Communication">
            {job.timeline.length === 0 ? (
              <p className="text-sm text-muted-foreground">No messages yet.</p>
            ) : (
              <div className="space-y-2">
                {job.timeline.map((t, i) => (
                  <div key={i} className="flex gap-2.5 text-sm">
                    <span className="text-xs text-muted-foreground w-12 shrink-0 mt-0.5">{t.date}</span>
                    <span className="text-xs uppercase text-muted-foreground w-10 shrink-0 mt-0.5">{t.type}</span>
                    <span className="text-foreground">{t.text}</span>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>
      </aside>
    </>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[110px_1fr] items-center gap-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

function InlineEdit({
  value,
  onSave,
  displayClassName,
  inputClassName,
  placeholder,
}: {
  value: string;
  onSave: (v: string) => void;
  displayClassName?: string;
  inputClassName?: string;
  placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  useEffect(() => { setDraft(value); }, [value]);

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className={`block w-full text-left rounded px-1 -mx-1 hover:bg-surface-hover transition-colors ${displayClassName ?? ""}`}
        title="Click to edit"
      >
        {value || <span className="italic text-muted-foreground">{placeholder ?? "Click to edit"}</span>}
      </button>
    );
  }
  return (
    <Input
      autoFocus
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => { onSave(draft); setEditing(false); }}
      onKeyDown={(e) => {
        if (e.key === "Enter") { onSave(draft); setEditing(false); }
        if (e.key === "Escape") { setDraft(value); setEditing(false); }
      }}
      className={inputClassName}
      placeholder={placeholder}
    />
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">{title}</div>
      {children}
    </div>
  );
}

function MilestonesSection({
  job,
  onUpdate,
  colorFor,
}: {
  job: Job;
  onUpdate: (patch: Partial<Job>) => void;
  colorFor: (n: string) => string;
}) {
  const [draft, setDraft] = useState("");
  const milestones = job.milestones ?? [];
  const done = milestones.filter((m) => m.done).length;
  const total = milestones.length;
  const pct = total ? (done / total) * 100 : 0;
  const stageColor = colorToCss(colorFor(job.stage));

  const update = (next: NonNullable<Job["milestones"]>) => onUpdate({ milestones: next });
  const add = () => {
    const label = draft.trim();
    if (!label) return;
    update([...milestones, { id: `ms-${Date.now()}`, label, done: false }]);
    setDraft("");
  };
  const toggle = (id: string) => update(milestones.map((m) => (m.id === id ? { ...m, done: !m.done } : m)));
  const remove = (id: string) => update(milestones.filter((m) => m.id !== id));
  const applyPreset = (labels: string[]) => {
    update(labels.map((l, i) => ({ id: `ms-${Date.now()}-${i}`, label: l, done: false })));
  };

  return (
    <Section title="Milestones">
      {total > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>{done} of {total} complete</span>
            <span className="tabular-nums">{Math.round(pct)}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-surface-hover overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: stageColor }} />
          </div>
        </div>
      )}
      {milestones.length === 0 ? (
        <div className="text-xs text-muted-foreground mb-3">
          No milestones yet. Add steps to track progress, or pick a preset:
          <div className="flex flex-wrap gap-1.5 mt-2">
            <button onClick={() => applyPreset(["Site visit", "Quote sent", "Materials ordered", "Work scheduled", "Job complete"])} className="text-[11px] px-2 py-1 rounded border-hairline hover:bg-surface-hover">Standard job</button>
            <button onClick={() => applyPreset(["Survey", "Design approved", "Install day 1", "Install day 2", "Snagging"])} className="text-[11px] px-2 py-1 rounded border-hairline hover:bg-surface-hover">Install</button>
            <button onClick={() => applyPreset(["Arrived on site", "Work in progress", "Cleared up", "Customer sign-off"])} className="text-[11px] px-2 py-1 rounded border-hairline hover:bg-surface-hover">Quick visit</button>
          </div>
        </div>
      ) : (
        <ul className="space-y-1 mb-3">
          {milestones.map((m) => (
            <li key={m.id} className="group flex items-center gap-2 text-sm">
              <button
                onClick={() => toggle(m.id)}
                className={`w-4 h-4 rounded border-hairline flex items-center justify-center shrink-0 ${m.done ? "bg-foreground text-background" : "bg-background"}`}
                aria-label={m.done ? "Mark incomplete" : "Mark complete"}
              >
                {m.done && <Check className="w-3 h-3" strokeWidth={3} />}
              </button>
              <span className={`flex-1 ${m.done ? "line-through text-muted-foreground" : ""}`}>{m.label}</span>
              <button
                onClick={() => remove(m.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 rounded flex items-center justify-center hover:bg-surface-hover"
                aria-label="Remove milestone"
              >
                <X className="w-3 h-3 text-muted-foreground" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder="Add a milestone…"
          className="h-8"
        />
        <Button size="sm" variant="outline" className="h-8" onClick={add}>Add</Button>
      </div>
    </Section>
  );
}



// Re-export seed defaults so other modules can still import if needed.
export { seedStages, seedStageColors };
