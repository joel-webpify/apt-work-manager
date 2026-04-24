import { useMemo, useState, type DragEvent, type MouseEvent } from "react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { PageHeader, Btn, StatusDot, Pill } from "@/components/layout/PageShell";
import { Plus, X, Phone, Mail, MapPin, LayoutGrid, List, Search, ArrowUpDown, AlertCircle, MessageSquare, BarChart3, StickyNote } from "lucide-react";
import { jobs as initialJobs, stages, stageColors, type Job, type PipelineStage } from "@/data/mockData";

type View = "board" | "list";
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

  const handleQuickAction = (e: MouseEvent, job: Job, channel: "sms" | "email") => {
    e.stopPropagation();
    toast({
      title: channel === "sms" ? "SMS composer opened" : "Email composer opened",
      description: `${channel === "sms" ? "Texting" : "Emailing"} ${job.customer} about "${job.service}".`,
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
              <th className="text-left font-medium text-muted-foreground text-xs uppercase tracking-wide px-3 h-9">Address</th>
              <th className="text-left font-medium text-muted-foreground text-xs uppercase tracking-wide px-3 h-9">Invoice</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  No jobs match these filters.
                </td>
              </tr>
            ) : (
              filtered.map((job) => {
                const stuck = job.daysInStage >= stuckThresholds[job.stage];
                return (
                  <tr
                    key={job.id}
                    onClick={() => onSelect(job)}
                    className="border-b-hairline last:border-0 hover:bg-surface-hover cursor-pointer transition-colors"
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
                    <td className="px-3 py-3 text-muted-foreground truncate max-w-[260px]">{job.address}</td>
                    <td className="px-3 py-3 text-muted-foreground tabular-nums">{job.invoiceId ?? "—"}</td>
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
