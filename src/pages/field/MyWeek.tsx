import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Clock, CheckCircle2, PoundSterling, Camera } from "lucide-react";
import { employees, type Job, type JobAssignment } from "@/data/mockData";
import { useJobs } from "@/lib/jobsStore";
import { useFieldRecords, useFieldUser } from "@/lib/fieldStore";

function pad(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}
function fmtISO(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function mondayOf(d: Date) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function endTime(start: string, hours: number) {
  const [h, m] = start.split(":").map(Number);
  const total = h * 60 + m + Math.round(hours * 60);
  return `${pad(Math.floor(total / 60) % 24)}:${pad(total % 60)}`;
}

interface Stop {
  job: Job;
  assignment: JobAssignment;
}

export default function MyWeek() {
  const [jobs] = useJobs();
  const [userId] = useFieldUser();
  const records = useFieldRecords();
  const me = employees.find((e) => e.id === userId) ?? employees[0];

  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()));

  const myStops = useMemo(() => {
    const rows: Stop[] = [];
    jobs.forEach((j) =>
      (j.assignments ?? []).forEach((a) => {
        if (a.employeeId === userId) rows.push({ job: j, assignment: a });
      }),
    );
    return rows;
  }, [jobs, userId]);

  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(weekStart, i);
      const iso = fmtISO(date);
      const stops = myStops
        .filter((s) => s.assignment.date === iso)
        .sort((a, b) => a.assignment.start.localeCompare(b.assignment.start));
      return {
        date,
        iso,
        stops,
        hours: stops.reduce((sum, s) => sum + s.assignment.duration, 0),
        done: stops.filter((s) => records[`${s.job.id}::${userId}`]?.lockedAt).length,
        isToday: iso === fmtISO(new Date()),
      };
    });
  }, [weekStart, myStops, records, userId]);

  const totalJobs = days.reduce((s, d) => s + d.stops.length, 0);
  const totalHours = days.reduce((s, d) => s + d.hours, 0);
  const totalDone = days.reduce((s, d) => s + d.done, 0);
  const busiest = days.reduce((best, d) => (d.hours > best.hours ? d : best), days[0]);
  const maxHours = Math.max(1, ...days.map((d) => d.hours));

  const weekTotals = useMemo(() => {
    let paid = 0;
    let photos = 0;
    days.forEach((d) =>
      d.stops.forEach((s) => {
        const r = records[`${s.job.id}::${userId}`];
        if (!r) return;
        paid += r.payment?.amount ?? 0;
        photos += r.photos.length;
      }),
    );
    return { paid, photos };
  }, [days, records, userId]);

  const rangeLabel = `${weekStart.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${addDays(
    weekStart,
    6,
  ).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`;
  const isThisWeek = fmtISO(weekStart) === fmtISO(mondayOf(new Date()));

  return (
    <div className="flex-1">
      <div className="px-4 py-3 border-b-hairline flex items-center gap-2">
        <button
          type="button"
          onClick={() => setWeekStart((w) => addDays(w, -7))}
          aria-label="Previous week"
          className="w-10 h-10 rounded-lg border-hairline flex items-center justify-center hover:bg-surface-hover"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 text-center">
          <div className="text-base font-medium leading-tight">{isThisWeek ? "This week" : rangeLabel}</div>
          <div className="text-[11px] text-muted-foreground">
            {isThisWeek ? rangeLabel : `Week of ${weekStart.toLocaleDateString("en-GB", { month: "long" })}`}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setWeekStart((w) => addDays(w, 7))}
          aria-label="Next week"
          className="w-10 h-10 rounded-lg border-hairline flex items-center justify-center hover:bg-surface-hover"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="px-4 py-3 border-b-hairline text-xs text-muted-foreground">
        {totalJobs === 0
          ? `Nothing booked in for ${me.name.split(" ")[0]} this week.`
          : `${totalJobs} ${totalJobs === 1 ? "job" : "jobs"} · ${totalHours}h booked${
              totalDone ? ` · ${totalDone} signed off` : ""
            }${busiest.hours > 0 ? ` · busiest day ${busiest.date.toLocaleDateString("en-GB", { weekday: "long" })}` : ""}`}
      </div>

      {/* hours per day bar strip */}
      <div className="px-4 pt-4">
        <div className="flex items-end gap-1.5 h-24">
          {days.map((d) => (
            <div key={d.iso} className="flex-1 flex flex-col items-center gap-1">
              <div className="flex-1 w-full flex items-end">
                <div
                  className={`w-full rounded-t-md ${d.isToday ? "bg-primary" : d.hours ? "bg-primary/30" : "bg-surface"}`}
                  style={{ height: `${d.hours ? Math.max(8, (d.hours / maxHours) * 100) : 4}%` }}
                  title={`${d.hours}h`}
                />
              </div>
              <div className={`text-[10px] ${d.isToday ? "text-primary font-semibold" : "text-muted-foreground"}`}>
                {d.date.toLocaleDateString("en-GB", { weekday: "short" }).slice(0, 3)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 grid grid-cols-3 gap-2">
        <Tile icon={<Clock className="w-4 h-4" />} label="Hours booked" value={`${totalHours}h`} />
        <Tile icon={<CheckCircle2 className="w-4 h-4" />} label="Signed off" value={String(totalDone)} />
        <Tile icon={<PoundSterling className="w-4 h-4" />} label="Taken on site" value={`£${weekTotals.paid.toFixed(0)}`} />
      </div>

      <div className="px-4 pb-6 space-y-3">
        {days.map((d) => (
          <div key={d.iso} className={`rounded-xl border-hairline ${d.isToday ? "ring-1 ring-primary/40" : ""}`}>
            <div className="px-3.5 py-2.5 flex items-center justify-between gap-2 border-b-hairline">
              <div className="text-sm font-semibold">
                {d.date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" })}
                {d.isToday && <span className="ml-2 text-[11px] font-medium text-primary">Today</span>}
              </div>
              <div className="text-[11px] text-muted-foreground shrink-0">
                {d.stops.length === 0 ? "Free" : `${d.stops.length} · ${d.hours}h`}
              </div>
            </div>
            {d.stops.length === 0 ? (
              <div className="px-3.5 py-3 text-xs text-muted-foreground">Nothing booked in.</div>
            ) : (
              <ul className="divide-y divide-border">
                {d.stops.map((s) => {
                  const rec = records[`${s.job.id}::${userId}`];
                  return (
                    <li key={`${s.job.id}-${s.assignment.start}`}>
                      <Link
                        to={`/field/job/${s.job.id}`}
                        className="flex items-center gap-3 px-3.5 py-2.5 hover:bg-surface-hover"
                      >
                        <span className="text-xs font-semibold tabular-nums w-[86px] shrink-0">
                          {s.assignment.start}–{endTime(s.assignment.start, s.assignment.duration)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium truncate">{s.job.customer}</span>
                          <span className="block text-xs text-muted-foreground truncate">{s.job.service}</span>
                        </span>
                        {rec?.lockedAt ? (
                          <CheckCircle2 className="w-4 h-4 text-[hsl(var(--success))] shrink-0" />
                        ) : rec?.photos.length ? (
                          <Camera className="w-4 h-4 text-muted-foreground shrink-0" />
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Tile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border-hairline p-3">
      <div className="text-muted-foreground">{icon}</div>
      <div className="text-lg font-semibold mt-1 tabular-nums">{value}</div>
      <div className="text-[11px] text-muted-foreground leading-tight">{label}</div>
    </div>
  );
}
