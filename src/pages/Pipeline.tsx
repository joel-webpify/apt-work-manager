import { useMemo, useState, type DragEvent } from "react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { PageHeader, Btn, StatusDot, Pill } from "@/components/layout/PageShell";
import { Plus, X, Phone, Mail, MapPin, LayoutGrid, List, Search, ArrowUpDown, AlertCircle, MessageSquare, BarChart3, StickyNote, CalendarDays, Clock, Users } from "lucide-react";
import { jobs as initialJobs, stages, stageColors, employees, type Job, type PipelineStage } from "@/data/mockData";
import ScheduleView from "@/components/pipeline/ScheduleView";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Channel = "sms" | "email";
interface MessageTemplate {
  id: string;
  label: string;
  description: string;
  stages?: PipelineStage[];
  build: (job: Job) => { subject?: string; body: string };
}

const smsTemplates: MessageTemplate[] = [
  {
    id: "quote-followup",
    label: "Quote follow-up",
    description: "Nudge after a quote was sent",
    stages: ["Quote sent"],
    build: (j) => ({
      body: `Hi ${j.customer.split(" ")[0]}, just checking in on the quote we sent for ${j.service} (£${j.value}). Happy to answer any questions — shall we get it booked in?`,
    }),
  },
  {
    id: "booking-confirm",
    label: "Booking confirmation",
    description: "Confirm date and arrival window",
    stages: ["Job booked"],
    build: (j) => ({
      body: `Hi ${j.customer.split(" ")[0]}, confirming your ${j.service} booking. We'll arrive within a 30-min window and call ahead. Reply STOP to opt out.`,
    }),
  },
  {
    id: "on-the-way",
    label: "On the way",
    description: "Let them know you're heading over",
    stages: ["Job booked", "In progress"],
    build: (j) => ({
      body: `Hi ${j.customer.split(" ")[0]}, we're on our way for the ${j.service} job. ETA approx 20 minutes.`,
    }),
  },
  {
    id: "payment-reminder",
    label: "Payment reminder",
    description: "Friendly nudge on an unpaid invoice",
    stages: ["Invoiced"],
    build: (j) => ({
      body: `Hi ${j.customer.split(" ")[0]}, a quick reminder that invoice ${j.invoiceId ?? "(pending)"} for £${j.value} is due. Let us know if you need bank details again.`,
    }),
  },
  {
    id: "review-request",
    label: "Review request",
    description: "Ask for a Google review after payment",
    stages: ["Paid", "Completed"],
    build: (j) => ({
      body: `Hi ${j.customer.split(" ")[0]}, thanks for choosing us for your ${j.service}! If you have 30 seconds, a Google review would mean the world: [link]`,
    }),
  },
];

const emailTemplates: MessageTemplate[] = [
  {
    id: "quote-followup",
    label: "Quote follow-up",
    description: "Detailed nudge with quote recap",
    stages: ["Quote sent"],
    build: (j) => ({
      subject: `Following up on your ${j.service} quote`,
      body: `Hi ${j.customer.split(" ")[0]},\n\nJust circling back on the quote we sent for ${j.service} at £${j.value}. Let me know if anything in the scope needs adjusting, or if you'd like to lock in a date.\n\nThanks,\nThe team`,
    }),
  },
  {
    id: "booking-confirm",
    label: "Booking confirmation",
    description: "Confirm scheduled work in writing",
    stages: ["Job booked"],
    build: (j) => ({
      subject: `Booking confirmed — ${j.service}`,
      body: `Hi ${j.customer.split(" ")[0]},\n\nConfirming your booking for ${j.service} at ${j.address}. We'll be in touch the day before with an arrival window.\n\nThanks,\nThe team`,
    }),
  },
  {
    id: "job-complete",
    label: "Job complete summary",
    description: "Recap of work done",
    stages: ["Completed", "In progress"],
    build: (j) => ({
      subject: `${j.service} — work completed`,
      body: `Hi ${j.customer.split(" ")[0]},\n\nThe ${j.service} work is now complete. Your invoice will follow shortly. Please don't hesitate to reach out with any questions.\n\nThanks,\nThe team`,
    }),
  },
  {
    id: "invoice-send",
    label: "Send invoice",
    description: "Attach and deliver the invoice",
    stages: ["Completed", "Invoiced"],
    build: (j) => ({
      subject: `Invoice ${j.invoiceId ?? ""} for ${j.service}`.trim(),
      body: `Hi ${j.customer.split(" ")[0]},\n\nPlease find attached invoice ${j.invoiceId ?? "(pending)"} for £${j.value}, due within 14 days. Bank details are on the invoice.\n\nThanks,\nThe team`,
    }),
  },
  {
    id: "payment-reminder",
    label: "Payment reminder",
    description: "Polite chase on an unpaid invoice",
    stages: ["Invoiced"],
    build: (j) => ({
      subject: `Reminder: invoice ${j.invoiceId ?? ""} due`.trim(),
      body: `Hi ${j.customer.split(" ")[0]},\n\nA gentle reminder that invoice ${j.invoiceId ?? "(pending)"} for £${j.value} is now due. Please let us know once payment is on its way, or if you need anything resent.\n\nThanks,\nThe team`,
    }),
  },
  {
    id: "review-request",
    label: "Review request",
    description: "Ask for a review with link",
    stages: ["Paid"],
    build: (j) => ({
      subject: "How did we do?",
      body: `Hi ${j.customer.split(" ")[0]},\n\nThanks again for your custom on the ${j.service} job. If you have a moment, we'd really appreciate a quick Google review: [link]\n\nThanks,\nThe team`,
    }),
  },
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

const stageTones: Record<PipelineStage, "neutral" | "success" | "warning" | "danger" | "info"> = {
  "New enquiry": "info",
  "Quote sent": "warning",
  "Job booked": "info",
  "In progress": "warning",
  Completed: "success",
  Invoiced: "warning",
  Paid: "success",
};

const stuckThresholds: Record<PipelineStage, number> = {
  "New enquiry": 2,
  "Quote sent": 4,
  "Job booked": 7,
  "In progress": 5,
  Completed: 2,
  Invoiced: 14,
  Paid: 999,
};

export default function Pipeline() {
  const [jobList, setJobList] = useState<Job[]>(initialJobs);
  const [selected, setSelected] = useState<Job | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<PipelineStage | null>(null);
  const [view, setView] = useState<View>("board");

  const handleDragStart = (e: DragEvent<HTMLButtonElement>, jobId: string) => {
    setDraggingId(jobId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", jobId);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverStage(null);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>, stage: PipelineStage) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverStage !== stage) setDragOverStage(stage);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, stage: PipelineStage) => {
    e.preventDefault();
    const jobId = e.dataTransfer.getData("text/plain") || draggingId;
    if (!jobId) return;
    setJobList((prev) =>
      prev.map((j) =>
        j.id === jobId && j.stage !== stage
          ? { ...j, stage, daysInStage: 0 }
          : j
      )
    );
    setDraggingId(null);
    setDragOverStage(null);
  };

  return (
    <>
      <PageHeader
        title="Jobs & pipeline"
        description={view === "board" ? "Drag and track jobs through every stage" : "Detailed view of every job across all stages"}
        actions={
          <>
            <Link
              to="/reporting?tab=pipeline"
              className="h-8 px-2.5 rounded-md text-sm font-medium inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors"
            >
              <BarChart3 className="w-3.5 h-3.5" /> Analytics
            </Link>
            <ViewToggle view={view} onChange={setView} />
            <Btn variant="primary"><Plus className="w-3.5 h-3.5" /> New job</Btn>
          </>
        }
      />

      {view === "board" ? (
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <div className="flex gap-3 px-8 py-6 h-full min-w-max">
            {stages.map((stage) => {
              const stageJobs = jobList.filter((j) => j.stage === stage);
              const total = stageJobs.reduce((s, j) => s + j.value, 0);
              const isOver = dragOverStage === stage;
              return (
                <div
                  key={stage}
                  className="w-[260px] shrink-0 flex flex-col"
                  onDragOver={(e) => handleDragOver(e, stage)}
                  onDragLeave={() => setDragOverStage((s) => (s === stage ? null : s))}
                  onDrop={(e) => handleDrop(e, stage)}
                >
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <StatusDot color={stageColors[stage]} />
                    <span className="text-sm font-medium">{stage}</span>
                    <span className="text-xs text-muted-foreground">{stageJobs.length}</span>
                    <span className="ml-auto text-xs text-muted-foreground tabular-nums">£{total}</span>
                  </div>
                  <div
                    className={`flex-1 space-y-2 overflow-y-auto pb-4 rounded-lg transition-colors ${
                      isOver ? "bg-surface-hover" : ""
                    }`}
                  >
                    {stageJobs.map((job) => (
                      <button
                        key={job.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, job.id)}
                        onDragEnd={handleDragEnd}
                        onClick={() => setSelected(job)}
                        className={`w-full text-left bg-card border-hairline rounded-lg p-3 hover:bg-surface-hover transition-all relative overflow-hidden cursor-grab active:cursor-grabbing ${
                          draggingId === job.id ? "opacity-40" : ""
                        }`}
                        style={{ boxShadow: "none" }}
                      >
                        <div
                          className="absolute left-0 top-0 bottom-0 w-0.5"
                          style={{ backgroundColor: stageColors[stage] }}
                        />
                        <div className="text-sm font-medium truncate">{job.customer}</div>
                        <div className="text-xs text-muted-foreground mt-0.5 truncate">{job.service}</div>
                        <div className="flex items-center justify-between mt-2.5">
                          <span className="text-sm font-medium tabular-nums">£{job.value}</span>
                          <span className="text-xs text-muted-foreground">{job.daysInStage}d</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <JobsListView jobs={jobList} onSelect={setSelected} />
      )}

      {selected && <JobDrawer job={selected} onClose={() => setSelected(null)} />}
    </>
  );
}

function ViewToggle({ view, onChange }: { view: View; onChange: (v: View) => void }) {
  return (
    <div className="inline-flex h-8 rounded-md border-hairline bg-background p-0.5">
      <button
        onClick={() => onChange("board")}
        className={`h-7 px-2.5 rounded-[5px] text-xs font-medium inline-flex items-center gap-1.5 transition-colors ${
          view === "board" ? "bg-surface-hover text-foreground" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <LayoutGrid className="w-3.5 h-3.5" /> Board
      </button>
      <button
        onClick={() => onChange("list")}
        className={`h-7 px-2.5 rounded-[5px] text-xs font-medium inline-flex items-center gap-1.5 transition-colors ${
          view === "list" ? "bg-surface-hover text-foreground" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <List className="w-3.5 h-3.5" /> List
      </button>
    </div>
  );
}

function getLastContact(job: Job): { type: "sms" | "email" | "note"; text: string; date: string } | null {
  if (!job.timeline || job.timeline.length === 0) return null;
  return job.timeline[job.timeline.length - 1];
}

const channelMeta: Record<"sms" | "email" | "note", { label: string; Icon: typeof Mail }> = {
  sms: { label: "SMS", Icon: MessageSquare },
  email: { label: "Email", Icon: Mail },
  note: { label: "Note", Icon: StickyNote },
};

function JobsListView({ jobs, onSelect }: { jobs: Job[]; onSelect: (j: Job) => void }) {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<PipelineStage | "All">("All");
  const [onlyStuck, setOnlyStuck] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("daysInStage");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const handleTemplateSend = (job: Job, channel: Channel, template: MessageTemplate) => {
    const built = template.build(job);
    toast({
      title: `${channel === "sms" ? "SMS" : "Email"} drafted: ${template.label}`,
      description:
        channel === "email" && built.subject
          ? `To ${job.customer} — "${built.subject}"`
          : `To ${job.customer} — ${built.body.slice(0, 80)}${built.body.length > 80 ? "…" : ""}`,
    });
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return jobs
      .filter((j) => (stageFilter === "All" ? true : j.stage === stageFilter))
      .filter((j) => (onlyStuck ? j.daysInStage >= stuckThresholds[j.stage] : true))
      .filter((j) =>
        q
          ? j.customer.toLowerCase().includes(q) ||
            j.service.toLowerCase().includes(q) ||
            j.address.toLowerCase().includes(q) ||
            (j.invoiceId ?? "").toLowerCase().includes(q)
          : true
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
  const stuckCount = filtered.filter((j) => j.daysInStage >= stuckThresholds[j.stage]).length;

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  return (
    <div className="flex-1 overflow-auto px-8 py-6">
      {/* Filter bar */}
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

        <div className="flex items-center gap-1 ml-1">
          <FilterChip active={stageFilter === "All"} onClick={() => setStageFilter("All")}>
            All <span className="text-muted-foreground ml-1">{jobs.length}</span>
          </FilterChip>
          {stages.map((s) => {
            const count = jobs.filter((j) => j.stage === s).length;
            return (
              <FilterChip key={s} active={stageFilter === s} onClick={() => setStageFilter(s)}>
                <StatusDot color={stageColors[s]} />
                <span className="ml-1.5">{s}</span>
                <span className="text-muted-foreground ml-1">{count}</span>
              </FilterChip>
            );
          })}
        </div>

        <button
          onClick={() => setOnlyStuck((v) => !v)}
          className={`h-8 px-2.5 rounded-md text-xs font-medium inline-flex items-center gap-1.5 border-hairline transition-colors ${
            onlyStuck ? "bg-[hsl(var(--destructive)/0.1)] text-[hsl(var(--destructive))]" : "bg-background text-muted-foreground hover:text-foreground"
          }`}
        >
          <AlertCircle className="w-3.5 h-3.5" /> Stuck only
        </button>

        <div className="ml-auto text-xs text-muted-foreground tabular-nums">
          {filtered.length} jobs · £{totalValue.toLocaleString()} total
          {stuckCount > 0 && (
            <span className="ml-2 text-[hsl(var(--destructive))]">· {stuckCount} stuck</span>
          )}
        </div>
      </div>

      {/* Table */}
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
                <td colSpan={8} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  No jobs match these filters.
                </td>
              </tr>
            ) : (
              filtered.map((job) => {
                const stuck = job.daysInStage >= stuckThresholds[job.stage];
                const last = getLastContact(job);
                const ChannelIcon = last ? channelMeta[last.type].Icon : null;
                return (
                  <tr
                    key={job.id}
                    onClick={() => onSelect(job)}
                    className="border-b-hairline last:border-0 hover:bg-surface-hover cursor-pointer transition-colors group"
                  >
                    <td className="px-3 py-3 font-medium">{job.customer}</td>
                    <td className="px-3 py-3 text-muted-foreground">{job.service}</td>
                    <td className="px-3 py-3">
                      <Pill tone={stageTones[job.stage]}>
                        <StatusDot color={stageColors[job.stage]} />
                        {job.stage}
                      </Pill>
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums font-medium">£{job.value.toLocaleString()}</td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      <span className={stuck ? "text-[hsl(var(--destructive))] font-medium" : "text-muted-foreground"}>
                        {job.daysInStage}d
                      </span>
                    </td>
                    <td className="px-3 py-3 max-w-[280px]">
                      {last && ChannelIcon ? (
                        <div className="flex items-start gap-2 min-w-0">
                          <ChannelIcon className="w-3.5 h-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                          <div className="min-w-0 flex-1">
                            <div className="text-foreground text-xs truncate">{last.text}</div>
                            <div className="text-[11px] text-muted-foreground mt-0.5">
                              {channelMeta[last.type].label} · {last.date}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">No contact yet</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-muted-foreground tabular-nums">{job.invoiceId ?? "—"}</td>
                    <td className="px-3 py-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                        <TemplateMenu
                          channel="sms"
                          job={job}
                          icon={<MessageSquare className="w-3.5 h-3.5" />}
                          label="Send SMS"
                          onSend={handleTemplateSend}
                        />
                        <TemplateMenu
                          channel="email"
                          job={job}
                          icon={<Mail className="w-3.5 h-3.5" />}
                          label="Send email"
                          onSend={handleTemplateSend}
                        />
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

function TemplateMenu({
  channel,
  job,
  icon,
  label,
  onSend,
}: {
  channel: Channel;
  job: Job;
  icon: React.ReactNode;
  label: string;
  onSend: (job: Job, channel: Channel, template: MessageTemplate) => void;
}) {
  const templates = channel === "sms" ? smsTemplates : emailTemplates;
  const ordered = sortTemplatesForJob(templates, job);
  const suggested = ordered.filter((t) => t.stages?.includes(job.stage));
  const others = ordered.filter((t) => !t.stages?.includes(job.stage));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          onClick={(e) => e.stopPropagation()}
          title={label}
          aria-label={label}
          className="w-7 h-7 rounded-md inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-background border-hairline transition-colors"
        >
          {icon}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-72"
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          {channel === "sms" ? "SMS templates" : "Email templates"}
        </DropdownMenuLabel>
        {suggested.length > 0 && (
          <>
            <DropdownMenuLabel className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium pt-0">
              Suggested for {job.stage}
            </DropdownMenuLabel>
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
    <button
      onClick={onClick}
      className={`h-8 px-2.5 rounded-md text-xs font-medium inline-flex items-center transition-colors ${
        active
          ? "bg-surface-hover text-foreground border-hairline"
          : "text-muted-foreground hover:text-foreground hover:bg-surface-hover"
      }`}
    >
      {children}
    </button>
  );
}

function SortableTh({
  label,
  col,
  sortKey,
  sortDir,
  onClick,
  align = "left",
}: {
  label: string;
  col: SortKey;
  sortKey: SortKey;
  sortDir: SortDir;
  onClick: (k: SortKey) => void;
  align?: "left" | "right";
}) {
  const active = sortKey === col;
  return (
    <th className={`font-medium text-muted-foreground text-xs uppercase tracking-wide px-3 h-9 ${align === "right" ? "text-right" : "text-left"}`}>
      <button
        onClick={() => onClick(col)}
        className={`inline-flex items-center gap-1 hover:text-foreground transition-colors ${active ? "text-foreground" : ""}`}
      >
        {label}
        <ArrowUpDown className={`w-3 h-3 ${active ? "opacity-100" : "opacity-40"}`} />
        {active && <span className="text-[10px] ml-0.5">{sortDir === "asc" ? "↑" : "↓"}</span>}
      </button>
    </th>
  );
}

function JobDrawer({ job, onClose }: { job: Job; onClose: () => void }) {
  return (
    <>
      <div className="fixed inset-0 bg-black/25 z-40 animate-fade-in" onClick={onClose} />
      <aside className="fixed top-0 right-0 h-screen w-[480px] bg-background border-l-hairline z-50 flex flex-col animate-slide-in-right">
        <header className="h-14 px-5 flex items-center justify-between border-b-hairline shrink-0">
          <div className="flex items-center gap-2">
            <StatusDot color={stageColors[job.stage]} />
            <span className="text-sm font-medium">{job.stage}</span>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-surface-hover">
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div>
            <h2 className="text-lg font-medium">{job.customer}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{job.service}</p>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground"><Phone className="w-3.5 h-3.5" /> 07700 900123</div>
            <div className="flex items-center gap-2 text-muted-foreground"><Mail className="w-3.5 h-3.5" /> contact@example.com</div>
            <div className="flex items-start gap-2 text-muted-foreground"><MapPin className="w-3.5 h-3.5 mt-0.5" /> {job.address}</div>
          </div>

          <Section title="Job notes">
            <p className="text-sm text-foreground">{job.notes || "No notes yet."}</p>
          </Section>

          <Section title="Photos">
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="aspect-square rounded-md bg-surface border-hairline" />
              ))}
            </div>
          </Section>

          <Section title="Quote & invoice">
            <div className="space-y-1.5 text-sm">
              <Row label="Quote value" value={`£${job.quoteValue}`} />
              <Row label="Invoice" value={job.invoiceId ?? "Not invoiced"} />
            </div>
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">{title}</div>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
