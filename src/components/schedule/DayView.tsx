import { useMemo, useState, type DragEvent } from "react";
import { ClipboardList, Wrench } from "lucide-react";
import type { Employee, Job } from "@/data/mockData";
import { travelMinutes } from "@/lib/travel";
import { visitTypeFor } from "@/lib/visitTypes";
import { LivePill, type DragPayload } from "@/components/schedule/ScheduleView";
import { useFieldRecords } from "@/lib/fieldStore";
import { liveStateFor } from "@/lib/fieldLive";

const DAY_START = 7 * 60; // 07:00
const DAY_END = 19 * 60; // 19:00
const RULER_PX = 44;
/** Timeline area below the header, in px. */
const INNER_PX = RULER_PX * 12 - 40;

function pad(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}
function fmtISO(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
function minutesToTime(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${pad(h)}:${pad(m)}`;
}
/** Turn a minute-of-day into a % position on the 07:00–19:00 ruler. */
function pct(mins: number) {
  return ((mins - DAY_START) / (DAY_END - DAY_START)) * 100;
}

interface Props {
  employees: Employee[];
  jobs: Job[];
  weekDays: Date[];
  date: string;
  onPickDate: (iso: string) => void;
  onSelectJob: (j: Job) => void;
  onDropJob: (jobId: string, employeeId: string, dateISO: string) => void;
  dragActive: string | null;
  onDragStateChange: (payload: DragPayload | null) => void;
}

interface Block {
  job: Job;
  startMins: number;
  endMins: number;
}

export default function DayView({
  employees,
  jobs,
  weekDays,
  date,
  onPickDate,
  onSelectJob,
  onDropJob,
  dragActive,
  onDragStateChange,
}: Props) {
  const fieldRecords = useFieldRecords();
  const [focus, setFocus] = useState<string>("all");
  const [overCol, setOverCol] = useState<string | null>(null);

  const shown = focus === "all" ? employees : employees.filter((e) => e.id === focus);
  const d = new Date(date + "T00:00:00");
  const dow = d.getDay();

  const perEmployee = useMemo(() => {
    return employees.map((emp) => {
      const isWorking = emp.workingDays.includes(dow) && !emp.daysOff.includes(date);
      const blocks: Block[] = [];
      for (const job of jobs) {
        for (const a of job.assignments ?? []) {
          if (a.employeeId === emp.id && a.date === date) {
            blocks.push({ job, startMins: timeToMinutes(a.start), endMins: timeToMinutes(a.start) + Math.round(a.duration * 60) });
          }
        }
      }
      blocks.sort((x, y) => x.startMins - y.startMins);
      // overlaps
      const overlapping = new Set<number>();
      for (let i = 0; i < blocks.length; i++) {
        for (let j = i + 1; j < blocks.length; j++) {
          if (blocks[i].startMins < blocks[j].endMins && blocks[j].startMins < blocks[i].endMins) {
            overlapping.add(i);
            overlapping.add(j);
          }
        }
      }
      // travel gaps between consecutive jobs
      const travels: { from: number; to: number; minutes: number }[] = [];
      for (let i = 1; i < blocks.length; i++) {
        const gap = blocks[i].startMins - blocks[i - 1].endMins;
        if (gap <= 0) continue;
        const minutes = travelMinutes(blocks[i - 1].job.address, blocks[i].job.address);
        const to = Math.min(blocks[i - 1].endMins + minutes, blocks[i].startMins);
        if (to > blocks[i - 1].endMins) travels.push({ from: blocks[i - 1].endMins, to, minutes });
      }
      return { emp, isWorking, blocks, overlapping, travels };
    });
  }, [employees, jobs, date, dow]);

  const onDragOver = (e: DragEvent, key: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (overCol !== key) setOverCol(key);
  };

  const onDrop = (e: DragEvent, employeeId: string) => {
    e.preventDefault();
    setOverCol(null);
    const jobId = dragActive ?? e.dataTransfer.getData("text/plain");
    if (!jobId) return;
    onDropJob(jobId, employeeId, date);
  };

  const startBlockDrag = (e: DragEvent, job: Job, empId: string, startMins: number) => {
    e.stopPropagation();
    const payload: DragPayload = {
      jobId: job.id,
      fromEmployeeId: empId,
      fromDate: date,
      fromStart: minutesToTime(startMins),
    };
    onDragStateChange(payload);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", job.id);
  };

  const endDrag = () => {
    onDragStateChange(null);
    setOverCol(null);
  };

  const hours = useMemo(() => {
    const out: { label: string; top: number }[] = [];
    for (let m = DAY_START; m <= DAY_END; m += 60) {
      out.push({ label: minutesToTime(m), top: pct(m) });
    }
    return out;
  }, []);

  return (
    <div className="animate-fade-in">
      {/* pickers */}
      <div className="px-3 py-2.5 border-b-hairline flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          {weekDays.map((wd) => {
            const iso = fmtISO(wd);
            const active = iso === date;
            const hasWork = jobs.some((j) => (j.assignments ?? []).some((a) => a.date === iso));
            return (
              <button
                key={iso}
                onClick={() => onPickDate(iso)}
                className={`h-7 min-w-9 px-2 rounded-md text-xs font-medium tabular-nums transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : hasWork
                      ? "text-foreground hover:bg-surface-hover"
                      : "text-muted-foreground hover:bg-surface-hover"
                }`}
              >
                {wd.toLocaleDateString("en-GB", { weekday: "short" }).slice(0, 3)} {wd.getDate()}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-1 ml-auto flex-wrap">
          <button
            onClick={() => setFocus("all")}
            className={`h-7 px-2.5 rounded-md text-xs font-medium transition-colors ${
              focus === "all"
                ? "bg-surface-hover text-foreground border-hairline"
                : "text-muted-foreground hover:text-foreground hover:bg-surface-hover"
            }`}
          >
            Everyone
          </button>
          {employees.map((emp) => (
            <button
              key={emp.id}
              onClick={() => setFocus(emp.id)}
              className={`h-7 px-2.5 rounded-md text-xs font-medium transition-colors inline-flex items-center gap-1.5 ${
                focus === emp.id
                  ? "bg-surface-hover text-foreground border-hairline"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface-hover"
              }`}
            >
              <span
                className="w-3.5 h-3.5 rounded-full inline-block"
                style={{ backgroundColor: `hsl(${emp.color})` }}
              />
              {emp.name.split(" ")[0]}
            </button>
          ))}
        </div>
      </div>

      {/* timeline */}
      <div className="overflow-x-auto">
        <div
          className="grid min-w-fit"
          style={{ gridTemplateColumns: `56px repeat(${shown.length}, minmax(150px, 1fr))` }}
        >
          {/* ruler */}
          <div className="relative" style={{ height: RULER_PX * 12 }}>
            <div className="absolute inset-x-0 top-0 h-10 border-b-hairline flex items-end px-2 pb-1 text-[10px] uppercase tracking-wide text-muted-foreground">
              Time
            </div>
            <div className="absolute inset-x-0 bottom-0" style={{ top: "40px" }}>
              {hours.map((h) => (
                <div
                  key={h.label}
                  className="absolute right-2 -translate-y-1/2 text-[10px] tabular-nums text-muted-foreground"
                  style={{ top: `${h.top}%` }}
                >
                  {h.label}
                </div>
              ))}
            </div>
          </div>

          {perEmployee.map(({ emp, isWorking, blocks, overlapping, travels }) => (
            <div
              key={emp.id}
              data-daycol={emp.id}
              onDragOver={(e) => onDragOver(e, emp.id)}
              onDragLeave={() => setOverCol((k) => (k === emp.id ? null : k))}
              onDrop={(e) => onDrop(e, emp.id)}
              className={`relative border-l-hairline transition-colors ${!isWorking ? "bg-surface/40" : ""} ${
                overCol === emp.id ? "bg-primary/10" : ""
              }`}
              style={{ height: RULER_PX * 12 }}
            >
              {/* header */}
              <div className="absolute inset-x-0 top-0 h-10 border-b-hairline px-2 flex items-center gap-1.5 z-10 bg-card">
                <span
                  className="w-5 h-5 rounded-full inline-flex items-center justify-center text-[9px] font-medium text-white shrink-0"
                  style={{ backgroundColor: `hsl(${emp.color})` }}
                >
                  {emp.initials}
                </span>
                <span className="text-xs font-medium truncate">{emp.name.split(" ")[0]}</span>
                {!isWorking && <span className="text-[10px] text-muted-foreground">· Off</span>}
              </div>

              {/* hour lines */}
              <div className="absolute inset-x-0 bottom-0" style={{ top: "40px" }}>
                {hours.slice(0, -1).map((h) => (
                  <div
                    key={h.label}
                    className="absolute inset-x-0 border-t border-border/40"
                    style={{ top: `${h.top}%` }}
                  />
                ))}

                {/* travel blocks */}
                {travels.map((t, i) => (
                  <div
                    key={`t${i}`}
                    className="absolute inset-x-1 rounded-md bg-surface/70 border border-dashed border-hairline flex items-start justify-center pt-0.5"
                    style={{ top: `${pct(t.from)}%`, height: `${pct(t.to) - pct(t.from)}%` }}
                    title={`≈${t.minutes} min drive`}
                  >
                    {(pct(t.to) - pct(t.from)) * (INNER_PX / 100) >= 14 && (
                      <span className="text-[9px] text-muted-foreground tabular-nums">≈{t.minutes}m</span>
                    )}
                  </div>
                ))}

                {/* job blocks */}
                {blocks.map((b, idx) => {
                  const visitType = visitTypeFor(b.job);
                  const Icon = visitType === "survey" ? ClipboardList : Wrench;
                  const top = pct(b.startMins);
                  const height = pct(b.endMins) - top;
                  return (
                    <div
                      key={`${b.job.id}-${b.startMins}`}
                      draggable
                      onDragStart={(e) => startBlockDrag(e, b.job, emp.id, b.startMins)}
                      onDragEnd={endDrag}
                      onClick={() => onSelectJob(b.job)}
                      className={`absolute inset-x-1 rounded-md border-hairline bg-background px-1.5 py-0.5 cursor-pointer hover:bg-surface-hover transition-colors overflow-hidden ${
                        overlapping.has(idx) ? "ring-1 ring-[hsl(var(--destructive))]" : ""
                      } ${visitType === "survey" ? "bg-[hsl(var(--warning)/0.08)]" : ""}`}
                      style={{
                        top: `${(top / 100) * INNER_PX}px`,
                        height: `${Math.max(18, (height / 100) * INNER_PX)}px`,
                      }}
                      title={`${b.job.customer} · ${minutesToTime(b.startMins)}–${minutesToTime(b.endMins)}`}
                    >
                      <div className="text-[9px] tabular-nums text-muted-foreground leading-tight">
                        {minutesToTime(b.startMins)}–{minutesToTime(b.endMins)}
                      </div>
                      <div className="text-[10px] font-medium leading-tight truncate inline-flex items-center gap-0.5 max-w-full">
                        <Icon
                          className={`w-2 h-2 shrink-0 ${
                            visitType === "survey" ? "text-[hsl(var(--warning))]" : "text-primary"
                          }`}
                        />
                        <span className="truncate">{b.job.customer}</span>
                      </div>
                      {(() => {
                        const st = liveStateFor(fieldRecords, b.job.id, {
                          employeeId: emp.id,
                          date,
                          start: minutesToTime(b.startMins),
                          duration: (b.endMins - b.startMins) / 60,
                        });
                        return st ? <LivePill state={st} /> : null;
                      })()}
                      {(() => {
                        const others = (b.job.assignments ?? []).filter(
                          (x) => x.date === date && x.start === minutesToTime(b.startMins) && x.employeeId !== emp.id,
                        );
                        if (!others.length) return null;
                        return (
                          <div className="flex items-center gap-0.5 mt-0.5">
                            {others.map((o) => {
                              const p = employees.find((e) => e.id === o.employeeId);
                              return p ? (
                                <span
                                  key={p.id}
                                  title={p.name}
                                  className="w-3.5 h-3.5 rounded-full text-[7px] font-medium text-white inline-flex items-center justify-center"
                                  style={{ backgroundColor: `hsl(${p.color})` }}
                                >
                                  {p.initials}
                                </span>
                              ) : null;
                            })}
                          </div>
                        );
                      })()}
                      {(height / 100) * INNER_PX > 40 && (
                        <div className="text-[9px] text-muted-foreground leading-tight truncate">
                          {b.job.service}
                        </div>
                      )}
                    </div>
                  );
                })}

                {blocks.length === 0 && isWorking && (
                  <div className="absolute inset-x-0 top-8 text-center text-[10px] text-muted-foreground/60">
                    Free
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
