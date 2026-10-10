import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarPlus, ClipboardList, Sparkles, Trash2, UserMinus, Wrench, CalendarDays, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { employees, type Job } from "@/data/mockData";
import { useJobs } from "@/lib/jobsStore";
import { useTeams } from "@/lib/teamsStore";
import { useFieldRecords } from "@/lib/fieldStore";
import { liveLabel, liveStateFor, pendingFollowUps } from "@/lib/fieldLive";
import { visitTypeFor } from "@/lib/visitTypes";
import BookingSchedulePreview from "./BookingSchedulePreview";
import { bookVisit, bookingWarnings, cancelVisit, moveVisit, suggestSlots, visitsOf, type Visit } from "@/lib/booking";

/** Demo "today" — the sample data lives in this week, same as the schedule. */
const TODAY = "2026-05-04";

const fmtDay = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });

export function visitSummary(job: Job): string | null {
  const v = visitsOf(job).find((x) => x.date >= TODAY) ?? visitsOf(job).at(-1);
  if (!v) return null;
  const who = v.teamId ? null : employees.find((e) => e.id === v.employeeIds[0])?.name.split(" ")[0];
  return `${fmtDay(v.date)} · ${v.start}${who ? ` · ${who}${v.employeeIds.length > 1 ? ` +${v.employeeIds.length - 1}` : ""}` : ""}`;
}

export default function VisitsSection({ job, onUpdate }: { job: Job; onUpdate: (patch: Partial<Job>) => void }) {
  const [jobs] = useJobs();
  const teams = useTeams();
  const records = useFieldRecords();
  const visits = visitsOf(job);
  const kind = visitTypeFor(job);
  const followUp = pendingFollowUps([job], records)[0];
  const [dialog, setDialog] = useState<{ edit?: Visit; note?: string } | null>(null);

  return (
    <div className="space-y-2" data-visits>
      {followUp && (
        <div className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-medium">{followUp.kind === "parts-needed" ? "Waiting on parts" : "Needs another visit"}</p>
            {followUp.note && <p className="text-xs text-muted-foreground">{followUp.note}</p>}
          </div>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setDialog({ note: followUp.note })}>
            Book return visit
          </Button>
        </div>
      )}

      {visits.length === 0 ? (
        <div className="rounded-lg border-hairline border-dashed bg-background p-4 text-center">
          <p className="text-sm text-muted-foreground">Not booked yet. It stays in the schedule's Unscheduled list until you book it.</p>
        </div>
      ) : (
        <div className="divide-y divide-border rounded-lg border-hairline bg-background">
          {visits.map((v) => {
            const team = teams.find((t) => t.id === v.teamId);
            const lead = team?.leadId && v.employeeIds.includes(team.leadId) ? team.leadId : v.employeeIds[0];
            const live = liveStateFor(records, job.id, { employeeId: lead, date: v.date, start: v.start, duration: v.duration });
            return (
              <div key={v.key} className="p-3 flex items-start gap-3" data-visit={v.key}>
                <div className="w-8 h-8 rounded-md bg-surface flex items-center justify-center shrink-0">
                  {kind === "survey" ? <ClipboardList className="w-4 h-4 text-warning" /> : <Wrench className="w-4 h-4 text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    {fmtDay(v.date)} · {v.start} · {v.duration}h
                    {live && <span className="ml-2 text-[11px] rounded-full bg-primary/10 text-primary px-1.5 py-0.5">{liveLabel[live]}</span>}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {team ? `${team.name}: ` : ""}
                    {v.employeeIds.map((id) => employees.find((e) => e.id === id)?.name.split(" ")[0]).join(", ")}
                  </p>
                  <div className="mt-1 flex gap-3 text-xs">
                    <button className="text-primary hover:underline" onClick={() => setDialog({ edit: v })}>Move</button>
                    <Link className="text-primary hover:underline inline-flex items-center gap-1" to={`/schedule?date=${v.date}&view=day`}>
                      <CalendarDays className="w-3 h-3" /> Open in schedule
                    </Link>
                  </div>
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Cancel visit">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-56 p-1">
                    {v.employeeIds.length > 1 &&
                      v.employeeIds.map((id) => (
                        <button
                          key={id}
                          className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-surface-hover"
                          onClick={() => onUpdate({ assignments: cancelVisit(job, v.key, { employeeId: id }).assignments })}
                        >
                          <UserMinus className="w-3.5 h-3.5" /> Remove {employees.find((e) => e.id === id)?.name.split(" ")[0]}
                        </button>
                      ))}
                    <button
                      className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-surface-hover text-destructive"
                      onClick={() => onUpdate({ assignments: cancelVisit(job, v.key, "visit").assignments })}
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Cancel whole visit
                    </button>
                  </PopoverContent>
                </Popover>
              </div>
            );
          })}
        </div>
      )}

      <Button variant="outline" size="sm" className="w-full gap-1.5" onClick={() => setDialog({})}>
        <CalendarPlus className="w-4 h-4" /> Book a visit
      </Button>

      {dialog && (
        <BookVisitDialog
          job={job}
          jobs={jobs}
          edit={dialog.edit}
          onClose={() => setDialog(null)}
          onSave={(next) => {
            onUpdate({ assignments: next.assignments });
            setDialog(null);
          }}
        />
      )}
    </div>
  );
}

function BookVisitDialog({
  job,
  jobs,
  edit,
  onClose,
  onSave,
}: {
  job: Job;
  jobs: Job[];
  edit?: Visit;
  onClose: () => void;
  onSave: (j: Job) => void;
}) {
  const teams = useTeams();
  const [teamId, setTeamId] = useState<string | undefined>(edit?.teamId);
  const [people, setPeople] = useState<string[]>(edit?.employeeIds ?? []);
  const [date, setDate] = useState(edit?.date ?? TODAY);
  const [start, setStart] = useState(edit?.start ?? "09:00");
  const [duration, setDuration] = useState(edit?.duration ?? job.estimatedHours ?? 2);

  const sorted = useMemo(
    () => [...employees].sort((a, b) => Number(!!job.trade && b.trades.includes(job.trade)) - Number(!!job.trade && a.trades.includes(job.trade))),
    [job.trade],
  );
  const suggestions = useMemo(
    () => (people.length ? suggestSlots({ job, jobs, employeeIds: people, fromISO: TODAY, duration }) : []),
    [job, jobs, people, duration],
  );
  const warnings = people.length
    ? bookingWarnings({ jobs, jobId: job.id, employeeIds: people, date, start, duration, ignoreKey: edit?.key })
    : [];

  const pickTeam = (id: string) => {
    const t = teams.find((x) => x.id === id);
    if (!t) return;
    setTeamId(t.id);
    setPeople(t.memberIds);
  };
  const toggle = (id: string) => {
    setTeamId(undefined);
    setPeople((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  };

  const save = (d = date, s = start) => {
    if (edit) {
      let next = cancelVisit(job, edit.key, "visit");
      next = bookVisit(next, { employeeIds: people, date: d, start: s, duration, teamId });
      onSave(next);
    } else onSave(bookVisit(job, { employeeIds: people, date: d, start: s, duration, teamId }));
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="h-[100dvh] max-h-[100dvh] w-full max-w-none gap-0 overflow-hidden p-0 sm:h-auto sm:max-h-[92dvh] sm:max-w-4xl sm:gap-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="border-b border-border px-4 py-4 pr-12 text-left sm:border-0 sm:p-0">{edit ? "Move visit" : "Book a visit"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto px-4 py-4 sm:px-0 sm:py-0">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">Who</p>
            {teams.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {teams.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => pickTeam(t.id)}
                    className={`h-7 px-2.5 rounded-full text-xs border ${teamId === t.id ? "border-primary bg-primary/10 text-primary" : "border-border"}`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-1.5">
              {sorted.map((e) => (
                <button
                  key={e.id}
                  data-person={e.id}
                  onClick={() => toggle(e.id)}
                  className={`h-7 px-2.5 rounded-full text-xs border ${people.includes(e.id) ? "border-primary bg-primary/10 text-primary" : "border-border"}`}
                >
                  {e.name.split(" ")[0]}
                  {job.trade && e.trades.includes(job.trade) ? " ·" + job.trade : ""}
                </button>
              ))}
            </div>
          </div>

          {suggestions.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5 inline-flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Next free slots
              </p>
              <div className="grid gap-1.5">
                {suggestions.map((s) => (
                  <button
                    key={s.date}
                    data-suggestion
                    onClick={() => save(s.date, s.start)}
                    className="flex items-center justify-between rounded-md border-hairline px-3 py-2 text-sm hover:bg-surface-hover text-left"
                  >
                    <span>{fmtDay(s.date)} · {s.start}</span>
                    <span className="text-xs text-muted-foreground">{s.driveMins ? `${s.driveMins} min drive` : "first of the day"}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2">
            <label className="text-xs text-muted-foreground">
              Day
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-9 mt-1" />
            </label>
            <label className="text-xs text-muted-foreground">
              Start
              <Input type="time" value={start} onChange={(e) => setStart(e.target.value)} className="h-9 mt-1" />
            </label>
            <label className="text-xs text-muted-foreground">
              Hours
              <Input type="number" min={0.5} step={0.5} value={duration} onChange={(e) => setDuration(Number(e.target.value) || 1)} className="h-9 mt-1" />
            </label>
          </div>
          {warnings.length > 0 && (
            <p className="text-xs text-warning">{warnings.join(" · ")}</p>
          )}
          <BookingSchedulePreview
            job={job} jobs={jobs} people={people} date={date} start={start} duration={duration}
            ignoreKey={edit?.key} onDate={setDate} onStart={setStart}
          />
        </div>

        <DialogFooter className="border-t border-border bg-background p-3 sm:border-0 sm:p-0">
          <Button variant="ghost" onClick={onClose}>Leave for the schedule</Button>
          <Button disabled={!people.length} onClick={() => save()}>{edit ? "Save" : "Book"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
