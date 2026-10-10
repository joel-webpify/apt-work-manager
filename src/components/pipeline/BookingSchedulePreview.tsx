import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ChevronLeft, ChevronRight, ClipboardList, Clock3, Route, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { employees, type Employee, type Job } from "@/data/mockData";
import { useIsMobile } from "@/hooks/use-mobile";
import { worksOn } from "@/lib/booking";
import { visitTypeFor } from "@/lib/visitTypes";
import { travelMinutes } from "@/lib/travel";

const SLOT_MINUTES = 15;
const WEEK_SLOT_MINUTES = 30;
const SLOT_HEIGHT = 12;

export const minutesFromTime = (time: string) => {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
};

export const timeFromMinutes = (value: number) =>
  `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;

export const toDateString = (value: Date) =>
  `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;

/** Monday-to-Sunday list of the ISO week containing the given date. */
export const weekDates = (date: string) => {
  const base = new Date(`${date}T12:00:00`);
  const monday = new Date(base);
  monday.setDate(base.getDate() - ((base.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + index);
    return toDateString(day);
  });
};

type ScheduleBlock = {
  job: Job;
  start: number;
  end: number;
};

type BusyInterval = { start: number; end: number };

const mergeIntervals = (intervals: BusyInterval[]) => {
  const sorted = [...intervals].sort((a, b) => a.start - b.start);
  const merged: BusyInterval[] = [];
  for (const interval of sorted) {
    const last = merged[merged.length - 1];
    if (last && interval.start <= last.end) last.end = Math.max(last.end, interval.end);
    else merged.push({ ...interval });
  }
  return merged;
};

function dayRange(selected: Employee[], blocks: ScheduleBlock[], start: string, duration: number) {
  const starts = [7 * 60, minutesFromTime(start), ...selected.map((person) => minutesFromTime(person.workStart)), ...blocks.map((block) => block.start)];
  const ends = [19 * 60, minutesFromTime(start) + duration * 60, ...selected.map((person) => minutesFromTime(person.workEnd)), ...blocks.map((block) => block.end)];
  return {
    from: Math.floor(Math.min(...starts) / 60) * 60,
    to: Math.ceil(Math.max(...ends) / 60) * 60,
  };
}

function dateLabel(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

export default function BookingSchedulePreview({ job, jobs, people, date, start, duration, ignoreKey, onDate, onStart }: {
  job: Job;
  jobs: Job[];
  people: string[];
  date: string;
  start: string;
  duration: number;
  ignoreKey?: string;
  onDate: (date: string) => void;
  onStart: (start: string) => void;
}) {
  const isMobile = useIsMobile();
  const selected = employees.filter((employee) => people.includes(employee.id));
  const [view, setView] = useState<"day" | "week">("day");
  const [activePerson, setActivePerson] = useState(people[0] ?? "");

  useEffect(() => {
    if (!people.includes(activePerson)) setActivePerson(people[0] ?? "");
  }, [activePerson, people]);

  const allBlocks = useMemo(
    () => jobs
      .flatMap((bookedJob) => (bookedJob.assignments ?? []).map((assignment) => ({ bookedJob, assignment })))
      .filter(({ bookedJob, assignment }) => assignment.date === date && people.includes(assignment.employeeId)
        && !(bookedJob.id === job.id && `${assignment.date}|${assignment.start}` === ignoreKey))
      .map(({ bookedJob, assignment }) => ({
        employeeId: assignment.employeeId,
        job: bookedJob,
        start: minutesFromTime(assignment.start),
        end: minutesFromTime(assignment.start) + assignment.duration * 60,
      }))
      .sort((a, b) => a.start - b.start),
    [date, ignoreKey, job.id, jobs, people],
  );

  const days = useMemo(() => weekDates(date), [date]);

  const weekBusy = useMemo(() => {
    const map = new Map<string, BusyInterval[]>();
    for (const day of days) map.set(day, []);
    jobs
      .flatMap((bookedJob) => (bookedJob.assignments ?? []).map((assignment) => ({ bookedJob, assignment })))
      .filter(({ bookedJob, assignment }) => days.includes(assignment.date) && people.includes(assignment.employeeId)
        && !(bookedJob.id === job.id && `${assignment.date}|${assignment.start}` === ignoreKey))
      .forEach(({ assignment }) => {
        const list = map.get(assignment.date);
        if (!list) return;
        list.push({ start: minutesFromTime(assignment.start), end: minutesFromTime(assignment.start) + assignment.duration * 60 });
      });
    return map;
  }, [days, ignoreKey, job.id, jobs, people]);

  const proposedStart = minutesFromTime(start);
  const proposedEnd = proposedStart + duration * 60;

  const weekRange = useMemo(() => {
    const starts = [7 * 60];
    const ends = [19 * 60];
    for (const day of days) {
      for (const person of selected) {
        if (!worksOn(person, day)) continue;
        starts.push(minutesFromTime(person.workStart));
        ends.push(minutesFromTime(person.workEnd));
      }
      weekBusy.get(day)?.forEach((interval) => { starts.push(interval.start); ends.push(interval.end); });
    }
    if (days.includes(date)) {
      starts.push(proposedStart);
      ends.push(proposedEnd);
    }
    return {
      from: Math.floor(Math.min(...starts) / 60) * 60,
      to: Math.ceil(Math.max(...ends) / 60) * 60,
    };
  }, [date, days, proposedEnd, proposedStart, selected, weekBusy]);

  const { from, to } = view === "week" ? weekRange : dayRange(selected, allBlocks, start, duration);
  const totalMinutes = to - from;
  const timelineHeight = (totalMinutes / SLOT_MINUTES) * SLOT_HEIGHT;
  const shownPeople = view === "day" && isMobile ? selected.filter((person) => person.id === activePerson) : selected;
  const topFor = (value: number) => ((value - from) / SLOT_MINUTES) * SLOT_HEIGHT;
  const heightFor = (value: number) => Math.max(24, (value / SLOT_MINUTES) * SLOT_HEIGHT);

  const changeDay = (offset: number) => {
    const next = new Date(`${date}T12:00:00`);
    next.setDate(next.getDate() + offset);
    onDate(toDateString(next));
  };

  const pickWeekSlot = (day: string, slot: number) => {
    onDate(day);
    onStart(timeFromMinutes(slot));
  };

  if (!selected.length) {
    return (
      <div className="rounded-md border border-dashed border-border bg-surface/40 px-4 py-5 text-center">
        <Clock3 className="mx-auto mb-2 h-4 w-4 text-muted-foreground" />
        <p className="text-sm font-medium">Choose who is going</p>
        <p className="mt-1 text-xs text-muted-foreground">Their day schedule will appear here.</p>
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-md border border-border bg-background" data-booking-schedule>
      <div className="flex flex-col gap-3 border-b border-border bg-surface/40 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-sm font-medium">{view === "week" ? "Week overview" : "Day planner"}</h3>
          <p className="text-xs text-muted-foreground">{view === "week" ? "Tap a free slot to pick the day and time." : "Tap a free time to move this visit."}</p>
        </div>
        <div className="flex items-center gap-1">
          <div className="mr-1 flex rounded-md border border-border bg-surface/60 p-0.5" role="tablist" aria-label="Planner view">
            {(["day", "week"] as const).map((option) => (
              <Button
                key={option}
                type="button"
                variant={view === option ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-2.5 capitalize"
                role="tab"
                aria-selected={view === option}
                onClick={() => setView(option)}
              >
                {option}
              </Button>
            ))}
          </div>
          {view === "day" && (
            <>
              <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" aria-label="Previous day" onClick={() => changeDay(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <label className="relative min-w-0 flex-1 sm:flex-none">
                <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs font-medium sm:hidden">{dateLabel(date)}</span>
                <Input aria-label="Schedule day" type="date" value={date} onChange={(event) => event.target.value && onDate(event.target.value)} className="h-9 w-full text-transparent sm:w-36 sm:text-foreground" />
              </label>
              <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" aria-label="Next day" onClick={() => changeDay(1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {view === "day" && isMobile && selected.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto border-b border-border p-2" aria-label="People schedule">
          {selected.map((person) => (
            <Button
              key={person.id}
              type="button"
              variant={activePerson === person.id ? "secondary" : "ghost"}
              size="sm"
              className="h-9 shrink-0"
              aria-pressed={activePerson === person.id}
              onClick={() => setActivePerson(person.id)}
            >
              {person.name.split(" ")[0]}
            </Button>
          ))}
        </div>
      )}

      <div className="max-h-[46dvh] overflow-auto" data-planner-scroll>
        {view === "day" ? (
          <div className="grid min-w-0" style={{ gridTemplateColumns: `52px repeat(${shownPeople.length}, minmax(0, 1fr))` }}>
            <div className="sticky top-0 z-20 h-11 border-b border-border bg-background" />
            {shownPeople.map((person) => (
              <div key={person.id} className="sticky top-0 z-20 flex h-11 min-w-0 items-center border-b border-l border-border bg-background px-2">
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium">{person.name}</p>
                  <p className="truncate text-[10px] text-muted-foreground">{worksOn(person, date) ? `${person.workStart}–${person.workEnd}` : "Day off"}</p>
                </div>
              </div>
            ))}

            <div className="relative border-r border-border" style={{ height: timelineHeight }}>
              {Array.from({ length: totalMinutes / 60 + 1 }, (_, index) => (
                <span key={index} className="absolute right-2 -translate-y-1/2 text-[10px] tabular-nums text-muted-foreground" style={{ top: topFor(from + index * 60) }}>
                  {timeFromMinutes(from + index * 60)}
                </span>
              ))}
            </div>

            {shownPeople.map((person) => {
              const blocks = allBlocks.filter((block) => block.employeeId === person.id);
              const off = !worksOn(person, date);
              const conflict = off || proposedStart < minutesFromTime(person.workStart) || proposedEnd > minutesFromTime(person.workEnd)
                || blocks.some((block) => block.start < proposedEnd && proposedStart < block.end);
              return (
                <div key={person.id} className={`relative min-w-0 border-l border-border ${off ? "bg-surface/60" : "bg-background"}`} style={{ height: timelineHeight }}>
                  {Array.from({ length: totalMinutes / SLOT_MINUTES }, (_, index) => {
                    const slot = from + index * SLOT_MINUTES;
                    return (
                      <Button
                        key={slot}
                        type="button"
                        variant="ghost"
                        className={`absolute inset-x-0 h-3 min-w-0 rounded-none p-0 ${index % 4 === 0 ? "border-t border-border" : "border-t border-border/30"}`}
                        style={{ top: index * SLOT_HEIGHT }}
                        aria-label={`${person.name}: choose ${timeFromMinutes(slot)}`}
                        onClick={() => onStart(timeFromMinutes(slot))}
                      />
                    );
                  })}

                  {blocks.map((block, index) => {
                    const previous = blocks[index - 1];
                    const drive = previous ? travelMinutes(previous.job.address, block.job.address) : 0;
                    const availableDrive = previous ? Math.min(drive, Math.max(0, block.start - previous.end)) : 0;
                    const survey = visitTypeFor(block.job) === "survey";
                    const Icon = survey ? ClipboardList : Wrench;
                    return (
                      <div key={`${block.job.id}-${block.start}`}>
                        {availableDrive > 0 && (
                          <div className="pointer-events-none absolute inset-x-2 z-10 overflow-hidden rounded border border-dashed border-border bg-surface px-1 text-[9px] text-muted-foreground" style={{ top: topFor(previous.end), height: heightFor(availableDrive) }} title={`Estimated drive: ${drive} min`}>
                            <span className="inline-flex items-center gap-1"><Route className="h-2.5 w-2.5" /> ≈{drive}m</span>
                          </div>
                        )}
                        <div className={`pointer-events-none absolute inset-x-1.5 z-10 overflow-hidden rounded border px-1.5 py-1 ${survey ? "border-warning/40 bg-warning/10" : "border-border bg-surface"}`} style={{ top: topFor(block.start), height: heightFor(block.end - block.start) }} title={`${block.job.customer} · ${timeFromMinutes(block.start)}–${timeFromMinutes(block.end)}`}>
                          <p className="flex items-center gap-1 truncate text-[10px] font-medium"><Icon className={`h-3 w-3 shrink-0 ${survey ? "text-warning" : "text-primary"}`} />{block.job.customer}</p>
                          <p className="truncate text-[9px] text-muted-foreground">{timeFromMinutes(block.start)}–{timeFromMinutes(block.end)}</p>
                        </div>
                      </div>
                    );
                  })}

                  <div className={`pointer-events-none absolute inset-x-1 z-10 overflow-hidden rounded border-2 border-dashed px-1.5 py-1 ${conflict ? "border-destructive bg-destructive/10 text-destructive" : "border-primary bg-primary/10 text-primary"}`} style={{ top: topFor(proposedStart), height: heightFor(duration * 60) }} data-proposed-visit>
                    <p className="flex items-center gap-1 truncate text-[10px] font-semibold">
                      {conflict && <AlertTriangle className="h-3 w-3 shrink-0" />} This visit
                    </p>
                    <p className="truncate text-[9px]">{start}–{timeFromMinutes(proposedEnd)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="grid min-w-max" style={{ gridTemplateColumns: `48px repeat(${days.length}, minmax(72px, 1fr))` }} data-week-grid>
              <div className="sticky top-0 z-20 h-11 border-b border-border bg-background" />
              {days.map((day) => {
                const anyWorks = selected.some((person) => worksOn(person, day));
                return (
                  <div key={day} className={`sticky top-0 z-20 flex h-11 min-w-0 items-center justify-center border-b border-l border-border px-1 ${day === date ? "bg-surface" : "bg-background"}`}>
                    <div className="min-w-0 text-center">
                      <p className={`truncate text-[11px] font-semibold ${day === date ? "text-primary" : ""}`}>{new Date(`${day}T12:00:00`).toLocaleDateString("en-GB", { weekday: "short" })}</p>
                      <p className="truncate text-[10px] text-muted-foreground">{new Date(`${day}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</p>
                      {!anyWorks && <p className="text-[9px] text-muted-foreground">Off</p>}
                    </div>
                  </div>
                );
              })}

              <div className="relative border-r border-border" style={{ height: timelineHeight }}>
                {Array.from({ length: totalMinutes / 60 + 1 }, (_, index) => (
                  <span key={index} className="absolute right-1.5 -translate-y-1/2 text-[10px] tabular-nums text-muted-foreground" style={{ top: topFor(from + index * 60) }}>
                    {timeFromMinutes(from + index * 60)}
                  </span>
                ))}
              </div>

              {days.map((day) => {
                const merged = mergeIntervals(weekBusy.get(day) ?? []);
                const anyWorks = selected.some((person) => worksOn(person, day));
                const conflict = day === date && merged.some((interval) => interval.start < proposedEnd && proposedStart < interval.end);
                return (
                  <div key={day} className={`relative min-w-0 border-l border-border ${anyWorks ? "bg-background" : "bg-surface/60"}`} style={{ height: timelineHeight }}>
                    {Array.from({ length: totalMinutes / WEEK_SLOT_MINUTES }, (_, index) => {
                      const slot = from + index * WEEK_SLOT_MINUTES;
                      return (
                        <Button
                          key={slot}
                          type="button"
                          variant="ghost"
                          className={`absolute inset-x-0 h-6 min-w-0 rounded-none p-0 ${slot % 60 === 0 ? "border-t border-border" : "border-t border-border/20"}`}
                          style={{ top: (slot - from) / SLOT_MINUTES * SLOT_HEIGHT }}
                          aria-label={`${dateLabel(day)}: choose ${timeFromMinutes(slot)}`}
                          onClick={() => pickWeekSlot(day, slot)}
                        />
                      );
                    })}

                    {merged.map((interval) => (
                      <div key={`${day}-${interval.start}`} className="pointer-events-none absolute inset-x-1 z-10 overflow-hidden rounded border border-border bg-surface" style={{ top: topFor(interval.start), height: heightFor(interval.end - interval.start) }} title={`${dateLabel(day)} · booked ${timeFromMinutes(interval.start)}–${timeFromMinutes(interval.end)}`}>
                        <p className="truncate text-[9px] font-medium text-muted-foreground">Booked</p>
                        <p className="truncate text-[9px] text-muted-foreground">{timeFromMinutes(interval.start)}–{timeFromMinutes(interval.end)}</p>
                      </div>
                    ))}

                    {day === date && (
                      <div className={`pointer-events-none absolute inset-x-1 z-10 overflow-hidden rounded border-2 border-dashed px-1 py-0.5 ${conflict ? "border-destructive bg-destructive/10 text-destructive" : "border-primary bg-primary/10 text-primary"}`} style={{ top: topFor(proposedStart), height: heightFor(duration * 60) }} data-proposed-visit>
                        <p className="flex items-center gap-1 truncate text-[9px] font-semibold">
                          {conflict && <AlertTriangle className="h-2.5 w-2.5 shrink-0" />} This visit
                        </p>
                        <p className="truncate text-[9px]">{start}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border bg-surface/40 px-3 py-2 text-[10px] text-muted-foreground">
        {view === "day" ? (
          <>
            <span className="inline-flex items-center gap-1"><Wrench className="h-3 w-3 text-primary" /> Work</span>
            <span className="inline-flex items-center gap-1"><ClipboardList className="h-3 w-3 text-warning" /> Survey</span>
            <span className="inline-flex items-center gap-1"><Route className="h-3 w-3" /> Travel</span>
            <span className="font-medium text-primary">This visit · {start}</span>
          </>
        ) : (
          <>
            <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm border border-border bg-surface" /> Booked</span>
            <span className="font-medium text-primary">This visit · {dateLabel(date)}</span>
            <span>Tap a free slot to pick day and time</span>
          </>
        )}
      </div>
    </section>
  );
}
