import { useMemo, useState, useCallback, type DragEvent } from "react";
import { ChevronLeft, ChevronRight, AlertTriangle, MapPin, Clock, Users, X, Plus, Calendar as CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { employees, type Employee, type Job, type JobAssignment, type Trade } from "@/data/mockData";
import { Btn, StatusDot } from "@/components/layout/PageShell";

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

interface DragPayload {
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
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date(2026, 4, 4)));
  const [tradeFilter, setTradeFilter] = useState<Trade | "All">("All");
  const [drag, setDrag] = useState<DragPayload | null>(null);
  const [dragOverCell, setDragOverCell] = useState<string | null>(null);
  const [employeeDrawer, setEmployeeDrawer] = useState<Employee | null>(null);

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

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

  // Unscheduled jobs that should be schedule-able (booked / in progress / completed without time)
  const unscheduled = useMemo(() => {
    return jobs.filter(
      (j) =>
        (j.stage === "Job booked" || j.stage === "Quote sent" || j.stage === "New enquiry" || j.stage === "In progress") &&
        (!j.assignments || j.assignments.length === 0),
    );
  }, [jobs]);

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

  const onCellDrop = (e: DragEvent, employeeId: string, dateISO: string) => {
    e.preventDefault();
    setDragOverCell(null);
    if (!drag) return;
    const job = jobs.find((j) => j.id === drag.jobId);
    if (!job) return;
    const employee = employees.find((emp) => emp.id === employeeId);
    if (!employee) return;

    const duration = job.estimatedHours && job.estimatedHours > 0 ? job.estimatedHours : 2;

    // Default start = workStart (or 08:00)
    const startTime = employee.workStart || "08:00";

    // Validate
    const warnings = validateAssignment(job, employee, dateISO, startTime, duration, jobs, drag);
    if (warnings.blocking) {
      toast({ title: "Can't assign", description: warnings.blocking });
      return;
    }
    if (warnings.warning) {
      toast({ title: "Heads up", description: warnings.warning });
    }

    // Update job: remove old assignment if moving, then add new
    onUpdateJob(job.id, (curr) => {
      const next = (curr.assignments ?? []).filter(
        (a) => !(drag.fromEmployeeId && a.employeeId === drag.fromEmployeeId && a.date === drag.fromDate && a.start === drag.fromStart),
      );
      next.push({ employeeId, date: dateISO, start: startTime, duration });
      const stage = curr.stage === "New enquiry" || curr.stage === "Quote sent" ? "Job booked" : curr.stage;
      return { ...curr, assignments: next, stage };
    });
  };

  const removeAssignment = (jobId: string, a: JobAssignment) => {
    onUpdateJob(jobId, (curr) => ({
      ...curr,
      assignments: (curr.assignments ?? []).filter(
        (x) => !(x.employeeId === a.employeeId && x.date === a.date && x.start === a.start),
      ),
    }));
  };

  const goToday = useCallback(() => setWeekStart(startOfWeek(new Date(2026, 4, 4))), []);
  const todayISO = fmtISO(new Date(2026, 4, 4));

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
    <div className="flex-1 overflow-auto px-8 py-6">
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

        <div className="ml-auto text-xs text-muted-foreground inline-flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" />
          {visibleEmployees.length} staff · {unscheduled.length} unscheduled
        </div>
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 280px" }}>
        {/* Schedule grid */}
        <div className="border-hairline rounded-lg overflow-hidden bg-card">
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
                        />
                      ))}
                    </div>
                  );
                })}
              </div>
            );
          })}
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
              <span>Drag a job onto an employee/day to schedule. Conflicts are highlighted.</span>
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
function ScheduledChip({
  row,
  color,
  conflict,
  onClick,
  onRemove,
  onDragStart,
  onDragEnd,
}: {
  row: AssignmentRow;
  color: string;
  conflict: boolean;
  onClick: () => void;
  onRemove: () => void;
  onDragStart: (e: DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
}) {
  const start = row.assignment.start;
  const endMins = timeToMinutes(start) + row.assignment.duration * 60;
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={`group relative cursor-grab active:cursor-grabbing rounded-md border-hairline bg-background px-1.5 py-1 hover:bg-surface-hover transition-colors ${
        conflict ? "ring-1 ring-[hsl(var(--destructive))]" : ""
      }`}
      style={{ borderLeft: `2px solid hsl(${color})` }}
      title={`${row.job.customer} · ${start}–${minutesToTime(endMins)}`}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="text-[10px] font-medium tabular-nums text-muted-foreground">
          {start}
        </span>
        {conflict && (
          <AlertTriangle className="w-3 h-3 text-[hsl(var(--destructive))] shrink-0" />
        )}
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
      <div className="text-[11px] font-medium leading-tight truncate">{row.job.customer}</div>
      <div className="text-[10px] text-muted-foreground leading-tight truncate">{row.job.service}</div>
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
          <div className="text-xs font-medium truncate">{job.customer}</div>
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
