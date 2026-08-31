import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Navigation, Clock, MapPin, CalendarDays } from "lucide-react";
import { employees, type Job, type JobAssignment } from "@/data/mockData";
import { useJobs } from "@/lib/jobsStore";
import { useFieldRecords, useFieldUser, fieldStatusLabel, emptyRecord } from "@/lib/fieldStore";
import { openMaps, routeUrl } from "@/lib/mapLinks";

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
function addDays(iso: string, n: number) {
  const d = parseISO(iso);
  d.setDate(d.getDate() + n);
  return fmtISO(d);
}
function humanDate(iso: string) {
  const today = fmtISO(new Date());
  if (iso === today) return "Today";
  if (iso === addDays(today, 1)) return "Tomorrow";
  if (iso === addDays(today, -1)) return "Yesterday";
  return parseISO(iso).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" });
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

export default function MyDay() {
  const [jobs] = useJobs();
  const [userId] = useFieldUser();
  const records = useFieldRecords();
  const me = employees.find((e) => e.id === userId) ?? employees[0];

  const myStops = useMemo(() => {
    const rows: Stop[] = [];
    jobs.forEach((j) =>
      (j.assignments ?? []).forEach((a) => {
        if (a.employeeId === userId) rows.push({ job: j, assignment: a });
      }),
    );
    return rows;
  }, [jobs, userId]);

  // Default to today, or the closest day this worker actually has work on.
  const initialDate = useMemo(() => {
    const today = fmtISO(new Date());
    if (myStops.some((s) => s.assignment.date === today)) return today;
    const dates = [...new Set(myStops.map((s) => s.assignment.date))].sort();
    const upcoming = dates.find((d) => d >= today);
    return upcoming ?? dates[dates.length - 1] ?? today;
  }, [myStops]);

  const [date, setDate] = useState(initialDate);

  const dayStops = useMemo(
    () =>
      myStops
        .filter((s) => s.assignment.date === date)
        .sort((a, b) => a.assignment.start.localeCompare(b.assignment.start)),
    [myStops, date],
  );

  const totalHours = dayStops.reduce((sum, s) => sum + s.assignment.duration, 0);

  return (
    <div className="flex-1">
      {/* date strip */}
      <div className="px-4 py-3 border-b-hairline flex items-center gap-2">
        <button
          type="button"
          onClick={() => setDate((d) => addDays(d, -1))}
          aria-label="Previous day"
          className="w-10 h-10 rounded-lg border-hairline flex items-center justify-center hover:bg-surface-hover"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 text-center">
          <div className="text-base font-medium leading-tight">{humanDate(date)}</div>
          <div className="text-[11px] text-muted-foreground">
            {parseISO(date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setDate((d) => addDays(d, 1))}
          aria-label="Next day"
          className="w-10 h-10 rounded-lg border-hairline flex items-center justify-center hover:bg-surface-hover"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* summary + route */}
      <div className="px-4 py-3 flex items-center justify-between gap-3 border-b-hairline">
        <div className="text-xs text-muted-foreground">
          {dayStops.length === 0
            ? "Nothing booked in"
            : `${dayStops.length} ${dayStops.length === 1 ? "job" : "jobs"} · ${totalHours}h of work`}
        </div>
        <button
          type="button"
          disabled={dayStops.length === 0}
          onClick={() => openMaps(routeUrl(dayStops.map((s) => s.job.address)))}
          className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium inline-flex items-center gap-1.5 disabled:opacity-40"
        >
          <Navigation className="w-4 h-4" /> Route for the day
        </button>
      </div>

      {/* jobs */}
      <div className="p-4 space-y-3">
        {dayStops.length === 0 && (
          <div className="border-hairline rounded-lg p-6 text-center">
            <CalendarDays className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm font-medium">No jobs on this day</p>
            <p className="text-xs text-muted-foreground mt-1">
              {myStops.length > 0
                ? "Use the arrows to find your next booked day."
                : `Nothing is booked in for ${me.name} yet.`}
            </p>
          </div>
        )}

        {dayStops.map(({ job, assignment }) => {
          const rec = records[`${job.id}::${userId}`] ?? emptyRecord();
          const photoCount = rec.photos.length;
          return (
            <Link
              key={`${job.id}-${assignment.start}`}
              to={`/field/job/${job.id}`}
              className="block border-hairline rounded-xl p-4 hover:bg-surface-hover transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold tabular-nums">
                    {assignment.start} – {endTime(assignment.start, assignment.duration)}
                  </div>
                  <div className="text-base font-medium mt-0.5 truncate">{job.customer}</div>
                  <div className="text-sm text-muted-foreground truncate">{job.service}</div>
                </div>
                <span
                  className={`shrink-0 h-6 px-2 rounded-full text-[11px] font-medium inline-flex items-center ${
                    rec.status === "finished"
                      ? "bg-[hsl(var(--success)/0.12)] text-[hsl(var(--success))]"
                      : rec.status === "not-started"
                        ? "bg-surface text-muted-foreground"
                        : "bg-primary/10 text-primary"
                  }`}
                >
                  {fieldStatusLabel[rec.status]}
                </span>
              </div>

              <div className="mt-3 flex items-start gap-1.5 text-xs text-muted-foreground">
                <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span className="flex-1">{job.address}</span>
              </div>
              <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> {assignment.duration}h booked
                </span>
                {photoCount > 0 && <span>{photoCount} photo{photoCount === 1 ? "" : "s"}</span>}
                {job.milestones?.length ? (
                  <span>
                    {job.milestones.filter((m) => m.done).length}/{job.milestones.length} steps
                  </span>
                ) : null}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
