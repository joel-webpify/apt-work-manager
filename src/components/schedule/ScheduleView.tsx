import { useMemo, useState, useCallback, useEffect, useRef, type DragEvent } from "react";
import { ChevronLeft, ChevronRight, AlertTriangle, MapPin, Clock, Users, X, Calendar as CalendarIcon, Maximize2, Minimize2, Pencil, Check, ClipboardList, Wrench, Radio, FileText, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { employees, type Employee, type Job, type JobAssignment, type Trade } from "@/data/mockData";
import { Btn, StatusDot } from "@/components/layout/PageShell";
import { findSmartSlot } from "@/lib/travel";
import { visitTypeFor } from "@/lib/visitTypes";
import { useFieldRecords } from "@/lib/fieldStore";
import { useQuotes } from "@/lib/quotesStore";
import { liveLabel, liveStateFor, pendingFollowUps, quotesReadyToSend, type LiveState } from "@/lib/fieldLive";
import DayView from "@/components/schedule/DayView";

// ---------- date helpers (local, no deps) ----------
function pad(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}
function fmtISO(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function parseISO(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function startOfWeek(d: Date) {
  const x = new Date(d);
  const day = x.getDay(); // 0 Sun .. 6 Sat
  const diff = day === 0 ? -6 : 1 - day; // back to Monday
  x.setDate(x.getDate() + diff);
  x.setHours(0, 0, 0, 0);
  return x;
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
function minutesToTime(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${pad(h)}:${pad(m)}`;
}

// ---------- types ----------
interface AssignmentRow {
  job: Job;
  assignment: JobAssignment;
}

export interface DragPayload {
  jobId: string;
  fromEmployeeId?: string;
  fromDate?: string;
  fromStart?: string;
}

// ---------- component ----------
interface ScheduleViewProps {
  jobs: Job[];
  onUpdateJob: (jobId: string, updater: (j: Job) => Job) => void;
  onSelectJob: (j: Job) => void;
}

export default function ScheduleView({ jobs, onUpdateJob, onSelectJob }: ScheduleViewProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const fieldRecords = useFieldRecords();
  const [quotes] = useQuotes();
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date(2026, 4, 4)));
  const [tradeFilter, setTradeFilter] = useState<Trade | "All">("All");
  const [mode, setMode] = useState<"week" | "day">("week");
  const [drag, setDrag] = useState<DragPayload | null>(null);
  const [dragOverCell, setDragOverCell] = useState<string | null>(null);
  const [employeeDrawer, setEmployeeDrawer] = useState<Employee | null>(null);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullscreen]);

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const todayISO = fmtISO(new Date(2026, 4, 4));

  // Day view opens on a day that actually has work booked.
  const [dayIso, setDayIso] = useState<string>(() => {
    const withWork = weekDays
      .map((d) => fmtISO(d))
      .find((iso) =>
        jobs.some((j) => (j.assignments ?? []).some((a) => a.date === iso)),
      );
    return withWork ?? todayISO;
  });

  const visibleEmployees = useMemo(() => {
    if (tradeFilter === "All") return employees;
    return employees.filter((e) => e.trades.includes(tradeFilter));
  }, [tradeFilter]);

  // Build map: employeeId -> dateISO -> AssignmentRow[]
  const grid = useMemo(() => {
    const map = new Map<string, Map<string, AssignmentRow[]>>();
    for (const e of employees) map.set(e.id, new Map());
    for (const job of jobs) {
      for (const a of job.assignments ?? []) {
        const empMap = map.get(a.employeeId);
        if (!empMap) continue;
        const arr = empMap.get(a.date) ?? [];
        arr.push({ job, assignment: a });
        empMap.set(a.date, arr);
      }
    }
    // sort each cell by start time
    for (const empMap of map.values()) {
      for (const arr of empMap.values()) {
        arr.sort((a, b) => timeToMinutes(a.assignment.start) - timeToMinutes(b.assignment.start));
      }
    }
    return map;
  }, [jobs]);

  // Unscheduled: any job without a booked visit, whatever its stage or board.
  const unscheduled = useMemo(() => {
    return jobs.filter((j) => !j.assignments || j.assignments.length === 0);
  }, [jobs]);
  const followUps = useMemo(() => pendingFollowUps(jobs, fieldRecords), [jobs, fieldRecords]);
  const readyQuotes = useMemo(() => quotesReadyToSend(jobs, fieldRecords, quotes), [jobs, fieldRecords, quotes]);

  // ---------- DnD ----------
  const onJobDragStart = (e: DragEvent, payload: DragPayload) => {
    setDrag(payload);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", payload.jobId);
  };
  const onJobDragEnd = () => {
    setDrag(null);
    setDragOverCell(null);
  };
  const onCellDragOver = (e: DragEvent, key: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverCell !== key) setDragOverCell(key);
  };

  /** Drop a job on a person/day — lands in the first free slot with driving room. */
  const scheduleJobOn = useCallback(
    (jobId: string, employeeId: string, dateISO: string) => {
      const job = jobs.find((j) => j.id === jobId);
      if (!job) return;
      const employee = employees.find((emp) => emp.id === employeeId);
      if (!employee) return;

      const date = parseISO(dateISO);
      if (!employee.workingDays.includes(date.getDay()) || employee.daysOff.includes(dateISO)) {
        toast({
          title: "Can't assign",
          description: `${employee.name} is off on ${date.toLocaleDateString("en-GB", { weekday: "long" })}.`,
        });
        return;
      }

      const duration = job.estimatedHours && job.estimatedHours > 0 ? job.estimatedHours : 2;
      const slot = findSmartSlot({ employee, dateISO, duration, jobs, movingJobId: jobId });
      if (slot.pastWorkday) {
        toast({
          title: "Heads up",
          description: `${employee.name}'s day is full — this runs past their working hours.`,
        });
      }

      onUpdateJob(job.id, (curr) => {
        const from = drag;
        const next = (curr.assignments ?? []).filter(
          (a) =>
            !(from?.fromEmployeeId && a.employeeId === from.fromEmployeeId && a.date === from.fromDate && a.start === from.fromStart),
        );
        next.push({ employeeId, date: dateISO, start: slot.start, duration });
        return { ...curr, assignments: next };
      });
      setDrag(null);
      setDragOverCell(null);
    },
    [jobs, drag, onUpdateJob, toast],
  );

  const onCellDrop = (e: DragEvent, employeeId: string, dateISO: string) => {
    e.preventDefault();
    setDragOverCell(null);
    const jobId = drag?.jobId ?? e.dataTransfer.getData("text/plain");
    if (!jobId) return;
    scheduleJobOn(jobId, employeeId, dateISO);
  };

  const removeAssignment = (jobId: string, a: JobAssignment) => {
    onUpdateJob(jobId, (curr) => ({
      ...curr,
      assignments: (curr.assignments ?? []).filter(
        (x) => !(x.employeeId === a.employeeId && x.date === a.date && x.start === a.start),
      ),
    }));
  };

  const updateAssignment = (
    jobId: string,
    original: JobAssignment,
    patch: Partial<Pick<JobAssignment, "start" | "duration" | "date" | "employeeId">>,
  ) => {
    const job = jobs.find((j) => j.id === jobId);
    if (!job) return;
    const employee = employees.find((e) => e.id === (patch.employeeId ?? original.employeeId));
    if (!employee) return;
    const nextStart = patch.start ?? original.start;
    const nextDuration = patch.duration ?? original.duration;
    const nextDate = patch.date ?? original.date;
    const dragLike: DragPayload = {
      jobId,
      fromEmployeeId: original.employeeId,
      fromDate: original.date,
      fromStart: original.start,
    };
    const warn = validateAssignment(job, employee, nextDate, nextStart, nextDuration, jobs, dragLike);
    if (warn.blocking) {
      toast({ title: "Can't update", description: warn.blocking });
      return;
    }
    if (warn.warning) toast({ title: "Heads up", description: warn.warning });
    onUpdateJob(jobId, (curr) => ({
      ...curr,
      assignments: (curr.assignments ?? []).map((x) =>
        x.employeeId === original.employeeId && x.date === original.date && x.start === original.start
          ? { ...x, ...patch }
          : x,
      ),
    }));
  };

  const goToday = useCallback(() => setWeekStart(startOfWeek(new Date(2026, 4, 4))), []);

  // Workload per employee for the visible week
  const weekWorkload = (emp: Employee) => {
    const empMap = grid.get(emp.id);
    let booked = 0;
    let capacity = 0;
    for (const d of weekDays) {
      const iso = fmtISO(d);
      const dow = d.getDay();
      const isWorking = emp.workingDays.includes(dow) && !emp.daysOff.includes(iso);
      if (isWorking) capacity += emp.capacityHoursPerDay;
      const arr = empMap?.get(iso) ?? [];
      for (const r of arr) booked += r.assignment.duration;
    }
    return { booked, capacity };
  };

  return (
    <div className={fullscreen ? "fixed inset-0 z-50 bg-background overflow-auto px-8 py-6 animate-fade-in" : "flex-1 overflow-auto px-8 py-6"}>
      {/* Header / controls */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="inline-flex items-center gap-1 border-hairline rounded-md bg-background h-8 px-1">
          <button
            onClick={() => setWeekStart((d) => addDays(d, -7))}
            className="w-7 h-7 inline-flex items-center justify-center rounded hover:bg-surface-hover text-muted-foreground"
            aria-label="Previous week"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={goToday}
            className="px-2 h-7 text-xs font-medium rounded hover:bg-surface-hover"
          >
            This week
          </button>
          <button
            onClick={() => setWeekStart((d) => addDays(d, 7))}
            className="w-7 h-7 inline-flex items-center justify-center rounded hover:bg-surface-hover text-muted-foreground"
            aria-label="Next week"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="text-sm font-medium tabular-nums">
          {weekDays[0].toLocaleDateString("en-GB", { day: "numeric", month: "short" })} –{" "}
          {weekDays[6].toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
        </div>

        <div className="inline-flex items-center h-8 rounded-md border-hairline bg-background p-0.5 ml-1">
          <button
            onClick={() => setMode("week")}
            className={`h-7 px-2.5 rounded-[5px] text-xs font-medium inline-flex items-center gap-1.5 transition-colors ${
              mode === "week" ? "bg-surface-hover text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setMode("day")}
            className={`h-7 px-2.5 rounded-[5px] text-xs font-medium inline-flex items-center gap-1.5 transition-colors ${
              mode === "day" ? "bg-surface-hover text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Day
          </button>
        </div>

        <div className="flex items-center gap-1 ml-3">
          {(["All", "Plumbing", "Electrical", "Window cleaning", "Landscaping", "General"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTradeFilter(t)}
              className={`h-8 px-2.5 rounded-md text-xs font-medium transition-colors ${
                tradeFilter === t
                  ? "bg-surface-hover text-foreground border-hairline"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface-hover"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="ml-auto text-xs text-muted-foreground inline-flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            {visibleEmployees.length} staff · {unscheduled.length} unscheduled
          </span>
          <button
            onClick={() => setFullscreen((v) => !v)}
            className="h-8 px-2 inline-flex items-center gap-1.5 rounded-md border-hairline hover:bg-surface-hover text-foreground"
            aria-label={fullscreen ? "Exit fullscreen" : "Fullscreen"}
            title={fullscreen ? "Exit fullscreen (Esc)" : "Fullscreen"}
          >
            {fullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span className="text-xs font-medium">{fullscreen ? "Exit" : "Fullscreen"}</span>
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        {/* Schedule */}
        <div className="min-w-0 overflow-x-auto pb-2">
          {mode === "week" ? (
            <div className="border-hairline rounded-lg overflow-hidden bg-card min-w-[640px]">
              {/* Day header */}
              <div
                className="grid border-b-hairline bg-surface/40"
                style={{ gridTemplateColumns: "200px repeat(7, minmax(0, 1fr))" }}
              >
                <div className="px-3 h-10 flex items-center text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Employee
                </div>
                {weekDays.map((d) => {
                  const iso = fmtISO(d);
                  const isToday = iso === todayISO;
                  return (
                        <div
                          key={iso}
                      className={`px-2 h-10 flex flex-col items-center justify-center border-l-hairline ${
                        isToday ? "bg-primary/5" : ""
                      }`}
                    >
                      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        {DAY_LABELS[d.getDay() === 0 ? 6 : d.getDay() - 1]}
                      </div>
                      <div className={`text-sm font-medium tabular-nums ${isToday ? "text-primary" : ""}`}>
                        {d.getDate()}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Rows */}
              {visibleEmployees.map((emp) => {
                const { booked, capacity } = weekWorkload(emp);
                const pct = capacity > 0 ? Math.min(100, Math.round((booked / capacity) * 100)) : 0;
                const over = capacity > 0 && booked > capacity;
                return (
                  <div
                    key={emp.id}
                    className="grid border-b-hairline last:border-0"
                    style={{ gridTemplateColumns: "200px repeat(7, minmax(0, 1fr))" }}
                  >
                    {/* Employee column */}
                    <button
                      onClick={() => setEmployeeDrawer(emp)}
                      className="text-left px-3 py-2 border-r-hairline hover:bg-surface-hover transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-7 h-7 rounded-full inline-flex items-center justify-center text-[11px] font-medium text-white"
                          style={{ backgroundColor: `hsl(${emp.color})` }}
                        >
                          {emp.initials}
                        </span>
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{emp.name}</div>
                          <div className="text-[11px] text-muted-foreground truncate">{emp.role}</div>
                        </div>
                      </div>
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground tabular-nums mb-0.5">
                          <span>{booked.toFixed(1)}h / {capacity}h</span>
                          <span className={over ? "text-[hsl(var(--destructive))] font-medium" : ""}>{pct}%</span>
                        </div>
                        <div className="h-1 rounded-full bg-surface overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${Math.min(100, pct)}%`,
                              backgroundColor: over
                                ? "hsl(var(--destructive))"
                                : pct > 85
                                  ? "hsl(var(--warning))"
                                  : `hsl(${emp.color})`,
                            }}
                          />
                        </div>
                      </div>
                    </button>

                    {/* Day cells */}
                    {weekDays.map((d) => {
                      const iso = fmtISO(d);
                      const dow = d.getDay();
                      const isWorking = emp.workingDays.includes(dow) && !emp.daysOff.includes(iso);
                      const cellKey = `${emp.id}|${iso}`;
                      const items = grid.get(emp.id)?.get(iso) ?? [];
                      const isOver = dragOverCell === cellKey;

                      // detect overlaps within this cell
                      const overlapping = new Set<number>();
                      for (let i = 0; i < items.length; i++) {
                        const aStart = timeToMinutes(items[i].assignment.start);
                        const aEnd = aStart + items[i].assignment.duration * 60;
                        for (let j = i + 1; j < items.length; j++) {
                          const bStart = timeToMinutes(items[j].assignment.start);
                          const bEnd = bStart + items[j].assignment.duration * 60;
                          if (aStart < bEnd && bStart < aEnd) {
                            overlapping.add(i);
                            overlapping.add(j);
                          }
                        }
                      }

                      return (
                        <div
                          key={iso}
                          data-cell={`${emp.id}|${iso}`}
                          onDragOver={(e) => onCellDragOver(e, cellKey)}
                          onDragLeave={() => setDragOverCell((k) => (k === cellKey ? null : k))}
                          onDrop={(e) => onCellDrop(e, emp.id, iso)}
                          className={`min-h-[88px] border-l-hairline p-1.5 space-y-1 transition-colors ${
                            !isWorking ? "bg-surface/40" : ""
                          } ${isOver ? "bg-primary/10" : ""}`}
                        >
                          {!isWorking && items.length === 0 && (
                            <div className="text-[10px] text-muted-foreground/60 text-center pt-2">Off</div>
                          )}
                          {items.map((row, idx) => (
                            <ScheduledChip
                              key={`${row.job.id}-${row.assignment.start}`}
                              row={row}
                              color={emp.color}
                              conflict={overlapping.has(idx)}
                              onClick={() => onSelectJob(row.job)}
                              live={liveStateFor(fieldRecords, row.job.id, row.assignment)}
                              onRemove={() => removeAssignment(row.job.id, row.assignment)}
                              onDragStart={(e) =>
                                onJobDragStart(e, {
                                  jobId: row.job.id,
                                  fromEmployeeId: emp.id,
                                  fromDate: iso,
                                  fromStart: row.assignment.start,
                                })
                              }
                              onDragEnd={onJobDragEnd}
                              onEdit={(patch) => updateAssignment(row.job.id, row.assignment, patch)}
                            />
                          ))}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="border-hairline rounded-lg bg-card">
              <DayView
                employees={visibleEmployees}
                jobs={jobs}
                weekDays={weekDays}
                date={dayIso}
                onPickDate={setDayIso}
                onSelectJob={onSelectJob}
                onDropJob={scheduleJobOn}
                dragActive={drag?.jobId ?? null}
                onDragStateChange={(payload) => {
                  setDrag(payload);
                  setDragOverCell(null);
                }}
              />
            </div>
          )}
        </div>

        {/* Unscheduled sidebar */}
        <aside className="border-hairline rounded-lg bg-card flex flex-col max-h-[calc(100vh-220px)]">
          <div className="px-3 h-10 flex items-center justify-between border-b-hairline shrink-0">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Unscheduled
            </div>
            <span className="text-xs text-muted-foreground tabular-nums">{unscheduled.length}</span>
          </div>
          <div className="overflow-y-auto p-2 space-y-1.5">
            <SidebarGroup title="Quotes ready to send" count={readyQuotes.length}>
              {readyQuotes.map((q) => (
                <button
                  key={q.quoteId}
                  type="button"
                  onClick={() => navigate(`/quotes?quote=${q.quoteId}`)}
                  className="w-full text-left rounded-md border-hairline bg-background hover:bg-surface-hover p-2"
                >
                  <div className="text-xs font-medium truncate inline-flex items-center gap-1 max-w-full">
                    <FileText className="w-3 h-3 text-primary shrink-0" />
                    <span className="truncate">{q.job.customer}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">Survey done · draft {q.quoteId}</div>
                </button>
              ))}
            </SidebarGroup>
            <SidebarGroup title="Needs another visit" count={followUps.length}>
              {followUps.map((f) => (
                <div
                  key={f.job.id}
                  draggable
                  onDragStart={(e) => onJobDragStart(e, { jobId: f.job.id })}
                  onDragEnd={onJobDragEnd}
                  onClick={() => onSelectJob(f.job)}
                  className="cursor-grab rounded-md border-hairline bg-[hsl(var(--warning)/0.06)] hover:bg-surface-hover p-2"
                >
                  <div className="text-xs font-medium truncate inline-flex items-center gap-1 max-w-full">
                    <RotateCcw className="w-3 h-3 shrink-0" />
                    <span className="truncate">{f.job.customer}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {f.kind === "parts-needed" ? "Waiting on parts" : "Return visit"}
                    {f.note ? ` · ${f.note}` : ""}
                  </div>
                </div>
              ))}
            </SidebarGroup>
            {unscheduled.length === 0 ? (
              <div className="text-xs text-muted-foreground text-center py-6">
                Everything's scheduled. ✨
              </div>
            ) : (
              unscheduled.map((j) => (
                <UnscheduledCard
                  key={j.id}
                  job={j}
                  onClick={() => onSelectJob(j)}
                  onDragStart={(e) => onJobDragStart(e, { jobId: j.id })}
                  onDragEnd={onJobDragEnd}
                />
              ))
            )}
          </div>
          <div className="border-t-hairline p-2 shrink-0">
            <div className="text-[11px] text-muted-foreground flex items-start gap-1.5 px-1">
              <CalendarIcon className="w-3 h-3 mt-0.5 shrink-0" />
              <span>Drag a job onto an employee/day — it lands in their first free slot with driving room.</span>
            </div>
          </div>
        </aside>
      </div>

      {employeeDrawer && (
        <EmployeeDrawer
          employee={employeeDrawer}
          jobs={jobs}
          weekStart={weekStart}
          onClose={() => setEmployeeDrawer(null)}
          onSelectJob={(j) => {
            setEmployeeDrawer(null);
            onSelectJob(j);
          }}
        />
      )}
    </div>
  );
}

// ---------- chips & cards ----------
export function LivePill({ state }: { state: Exclude<LiveState, null> }) {
  const tone =
    state === "late"
      ? "bg-[hsl(var(--warning)/0.15)] text-foreground"
      : state === "signed-off"
        ? "bg-[hsl(var(--success)/0.12)] text-[hsl(var(--success))]"
        : "bg-primary/10 text-primary";
  return (
    <span data-live={state} className={`mt-0.5 inline-flex items-center gap-1 rounded px-1 text-[9px] font-medium ${tone}`}>
      <Radio className="w-2.5 h-2.5" /> {liveLabel[state]}
    </span>
  );
}

function SidebarGroup({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  if (count === 0) return null;
  return (
    <div className="space-y-1.5 pb-2 mb-1 border-b-hairline">
      <div className="px-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground flex justify-between">
        <span>{title}</span>
        <span className="tabular-nums">{count}</span>
      </div>
      {children}
    </div>
  );
}
function VisitMark({ type, className = "" }: { type: "survey" | "work"; className?: string }) {
  const Icon = type === "survey" ? ClipboardList : Wrench;
  return (
    <Icon
      className={`${type === "survey" ? "text-[hsl(var(--warning))]" : "text-primary"} ${className}`}
    />
  );
}

function ScheduledChip({
  row,
  color,
  conflict,
  onClick,
  onRemove,
  onDragStart,
  onDragEnd,
  onEdit,
  live,
}: {
  row: AssignmentRow;
  color: string;
  conflict: boolean;
  onClick: () => void;
  onRemove: () => void;
  onDragStart: (e: DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
  onEdit: (patch: { start?: string; duration?: number }) => void;
  live?: LiveState;
}) {
  const start = row.assignment.start;
  const duration = row.assignment.duration;
  const endMins = timeToMinutes(start) + duration * 60;
  const visitType = visitTypeFor(row.job);

  const [editing, setEditing] = useState(false);
  const [draftStart, setDraftStart] = useState(start);
  const [draftDuration, setDraftDuration] = useState(String(duration));
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Resize-by-drag state
  const resizeState = useRef<{ startY: number; startDuration: number } | null>(null);

  const beginEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDraftStart(start);
    setDraftDuration(String(duration));
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const commitEdit = () => {
    const dur = parseFloat(draftDuration);
    const patch: { start?: string; duration?: number } = {};
    if (draftStart && draftStart !== start) patch.start = draftStart;
    if (!Number.isNaN(dur) && dur > 0 && dur !== duration) patch.duration = dur;
    setEditing(false);
    if (patch.start || patch.duration) onEdit(patch);
  };

  const onResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resizeState.current = { startY: e.clientY, startDuration: duration };
    const onMove = (ev: MouseEvent) => {
      if (!resizeState.current) return;
      const deltaY = ev.clientY - resizeState.current.startY;
      // 16px per 30 minutes
      const stepHours = Math.round((deltaY / 16) * 2) / 4; // 0.25h increments
      const next = Math.max(0.25, resizeState.current.startDuration + stepHours);
      // visual hint via title; commit on mouseup
      (ev.target as HTMLElement)?.setAttribute?.("data-next", String(next));
    };
    const onUp = (ev: MouseEvent) => {
      if (!resizeState.current) return;
      const deltaY = ev.clientY - resizeState.current.startY;
      const stepHours = Math.round((deltaY / 16) * 2) / 4;
      const next = Math.max(0.25, Math.round((resizeState.current.startDuration + stepHours) * 4) / 4);
      resizeState.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      if (next !== duration) onEdit({ duration: next });
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  if (editing) {
    return (
      <div
        onClick={(e) => e.stopPropagation()}
        className="rounded-md border-hairline bg-background px-1.5 py-1 space-y-1"
        style={{ borderLeft: `2px solid hsl(${color})` }}
      >
        <div className="flex items-center gap-1">
          <input
            ref={inputRef}
            type="time"
            value={draftStart}
            onChange={(e) => setDraftStart(e.target.value)}
            className="flex-1 min-w-0 h-6 px-1 text-[10px] tabular-nums rounded border-hairline bg-background"
          />
          <input
            type="number"
            min={0.25}
            step={0.25}
            value={draftDuration}
            onChange={(e) => setDraftDuration(e.target.value)}
            className="w-12 h-6 px-1 text-[10px] tabular-nums rounded border-hairline bg-background"
            title="Hours"
          />
          <button
            onClick={commitEdit}
            className="w-5 h-5 inline-flex items-center justify-center rounded hover:bg-surface-hover text-foreground"
            aria-label="Save"
          >
            <Check className="w-3 h-3" />
          </button>
          <button
            onClick={() => setEditing(false)}
            className="w-5 h-5 inline-flex items-center justify-center rounded hover:bg-surface-hover text-muted-foreground"
            aria-label="Cancel"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
        <div className="text-[10px] text-muted-foreground truncate">{row.job.customer}</div>
      </div>
    );
  }

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      onDoubleClick={beginEdit}
      className={`group relative cursor-grab active:cursor-grabbing rounded-md border-hairline bg-background px-1.5 py-1 hover:bg-surface-hover transition-colors ${
        conflict ? "ring-1 ring-[hsl(var(--destructive))]" : ""
      } ${visitType === "survey" ? "bg-[hsl(var(--warning)/0.06)]" : ""}`}
      style={{ borderLeft: `2px solid hsl(${color})` }}
      title={`${row.job.customer} · ${start}–${minutesToTime(endMins)} (${duration}h) · double-click to edit`}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="text-[10px] font-medium tabular-nums text-muted-foreground">
          {start}–{minutesToTime(endMins)}
        </span>
        <div className="flex items-center gap-0.5">
          {conflict && (
            <AlertTriangle className="w-3 h-3 text-[hsl(var(--destructive))] shrink-0" />
          )}
          <button
            onClick={beginEdit}
            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground"
            aria-label="Edit time"
          >
            <Pencil className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground"
            aria-label="Remove assignment"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
      <div className="text-[11px] font-medium leading-tight truncate inline-flex items-center gap-1 max-w-full">
        <VisitMark type={visitType} className="w-2.5 h-2.5 shrink-0" />
        <span className="truncate">{row.job.customer}</span>
      </div>
      <div className="text-[10px] text-muted-foreground leading-tight truncate">{row.job.service}</div>
      {live && <LivePill state={live} />}
      {/* Resize handle */}
      <div
        onMouseDown={onResizeMouseDown}
        onClick={(e) => e.stopPropagation()}
        className="absolute left-0 right-0 bottom-0 h-1.5 cursor-ns-resize opacity-0 group-hover:opacity-100 bg-foreground/10 hover:bg-foreground/20 rounded-b-md"
        title="Drag to resize duration"
      />
    </div>
  );
}

function UnscheduledCard({
  job,
  onClick,
  onDragStart,
  onDragEnd,
}: {
  job: Job;
  onClick: () => void;
  onDragStart: (e: DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
}) {
  const visitType = visitTypeFor(job);
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className="cursor-grab active:cursor-grabbing rounded-md border-hairline bg-background hover:bg-surface-hover p-2 transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium truncate inline-flex items-center gap-1 max-w-full">
            <VisitMark type={visitType} className="w-2.5 h-2.5 shrink-0" />
            <span className="truncate">{job.customer}</span>
          </div>
          <div className="text-[11px] text-muted-foreground truncate">{job.service}</div>
        </div>
        <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
          {job.estimatedHours ?? 2}h
        </span>
      </div>
      <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground">
        {job.trade && (
          <span className="inline-flex items-center gap-1">
            <StatusDot color="hsl(var(--muted-foreground))" />
            {job.trade}
          </span>
        )}
        {job.postcode && (
          <span className="inline-flex items-center gap-0.5">
            <MapPin className="w-2.5 h-2.5" />
            {job.postcode}
          </span>
        )}
      </div>
    </div>
  );
}

// ---------- Employee drawer ----------
function EmployeeDrawer({
  employee,
  jobs,
  weekStart,
  onClose,
  onSelectJob,
}: {
  employee: Employee;
  jobs: Job[];
  weekStart: Date;
  onClose: () => void;
  onSelectJob: (j: Job) => void;
}) {
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const rows: { date: Date; items: AssignmentRow[] }[] = weekDays.map((d) => {
    const iso = fmtISO(d);
    const items: AssignmentRow[] = [];
    for (const job of jobs) {
      for (const a of job.assignments ?? []) {
        if (a.employeeId === employee.id && a.date === iso) items.push({ job, assignment: a });
      }
    }
    items.sort((a, b) => timeToMinutes(a.assignment.start) - timeToMinutes(b.assignment.start));
    return { date: d, items };
  });

  return (
    <>
      <div className="fixed inset-0 bg-black/25 z-40 animate-fade-in" onClick={onClose} />
      <aside className="fixed top-0 right-0 h-screen w-[420px] bg-background border-l-hairline z-50 flex flex-col animate-slide-in-right">
        <header className="h-14 px-5 flex items-center justify-between border-b-hairline shrink-0">
          <div className="flex items-center gap-2.5">
            <span
              className="w-9 h-9 rounded-full inline-flex items-center justify-center text-xs font-medium text-white"
              style={{ backgroundColor: `hsl(${employee.color})` }}
            >
              {employee.initials}
            </span>
            <div>
              <div className="text-sm font-medium leading-none">{employee.name}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{employee.role}</div>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-surface-hover">
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <div className="text-muted-foreground mb-0.5">Trades</div>
              <div className="font-medium">{employee.trades.join(", ")}</div>
            </div>
            <div>
              <div className="text-muted-foreground mb-0.5">Service area</div>
              <div className="font-medium">{employee.postcodes.join(", ")}</div>
            </div>
            <div>
              <div className="text-muted-foreground mb-0.5">Working hours</div>
              <div className="font-medium tabular-nums">{employee.workStart}–{employee.workEnd}</div>
            </div>
            <div>
              <div className="text-muted-foreground mb-0.5">Daily capacity</div>
              <div className="font-medium tabular-nums">{employee.capacityHoursPerDay}h</div>
            </div>
          </div>

          <div>
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              This week
            </div>
            <div className="space-y-3">
              {rows.map(({ date, items }) => {
                const total = items.reduce((s, r) => s + r.assignment.duration, 0);
                const dow = date.getDay();
                const isWorking = employee.workingDays.includes(dow) && !employee.daysOff.includes(fmtISO(date));
                return (
                  <div key={fmtISO(date)}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="text-xs font-medium">
                        {date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
                      </div>
                      <div className="text-[11px] text-muted-foreground tabular-nums">
                        {!isWorking ? "Off" : `${total}h booked`}
                      </div>
                    </div>
                    {items.length === 0 ? (
                      <div className="text-[11px] text-muted-foreground italic px-2 py-1.5 rounded border-hairline bg-surface/40">
                        Nothing scheduled
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {items.map((r) => {
                          const endMins = timeToMinutes(r.assignment.start) + r.assignment.duration * 60;
                          return (
                            <button
                              key={r.job.id + r.assignment.start}
                              onClick={() => onSelectJob(r.job)}
                              className="w-full text-left px-2 py-1.5 rounded border-hairline bg-card hover:bg-surface-hover transition-colors flex items-center gap-2"
                            >
                              <Clock className="w-3 h-3 text-muted-foreground shrink-0" />
                              <span className="text-[11px] tabular-nums text-muted-foreground w-20 shrink-0">
                                {r.assignment.start}–{minutesToTime(endMins)}
                              </span>
                              <span className="text-xs font-medium truncate flex-1">{r.job.customer}</span>
                              <span className="text-[11px] text-muted-foreground truncate hidden sm:inline">
                                {r.job.service}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

// ---------- validation ----------
function validateAssignment(
  job: Job,
  employee: Employee,
  dateISO: string,
  startTime: string,
  duration: number,
  jobs: Job[],
  drag: DragPayload | null,
): { blocking?: string; warning?: string } {
  const date = parseISO(dateISO);
  const dow = date.getDay();

  // Working day?
  if (!employee.workingDays.includes(dow) || employee.daysOff.includes(dateISO)) {
    return { blocking: `${employee.name} is off on ${date.toLocaleDateString("en-GB", { weekday: "long" })}.` };
  }

  // Overlap check
  const startMins = timeToMinutes(startTime);
  const endMins = startMins + duration * 60;
  for (const j of jobs) {
    for (const a of j.assignments ?? []) {
      if (a.employeeId !== employee.id || a.date !== dateISO) continue;
      // skip the one being moved
      if (
        drag?.fromEmployeeId === employee.id &&
        drag?.fromDate === dateISO &&
        drag?.fromStart === a.start &&
        j.id === drag?.jobId
      ) {
        continue;
      }
      const aStart = timeToMinutes(a.start);
      const aEnd = aStart + a.duration * 60;
      if (startMins < aEnd && aStart < endMins) {
        return {
          warning: `Overlaps with ${j.customer} (${a.start}). Assigned anyway — adjust the time on the job card.`,
        };
      }
    }
  }

  // Skill/area soft warnings
  const warnings: string[] = [];
  if (job.trade && !employee.trades.includes(job.trade)) {
    warnings.push(`${employee.name} isn't tagged for ${job.trade}.`);
  }
  if (job.postcode) {
    const prefix = job.postcode.replace(/\d.*/, "");
    if (!employee.postcodes.some((p) => prefix.startsWith(p))) {
      warnings.push(`Outside their service area (${employee.postcodes.join(", ")}).`);
    }
  }
  return warnings.length ? { warning: warnings.join(" ") } : {};
}
