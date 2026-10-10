import { CalendarDays, ChevronLeft, ChevronRight, ClipboardList, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { employees, type Job } from "@/data/mockData";
import { worksOn } from "@/lib/booking";
import { visitTypeFor } from "@/lib/visitTypes";
import { travelMinutes } from "@/lib/travel";

const minutes = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};
const timeOf = (n: number) => `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;

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
  const selected = employees.filter((e) => people.includes(e.id));
  const blocks = jobs.flatMap((j) => (j.assignments ?? []).map((a) => ({ job: j, assignment: a })))
    .filter(({ job: j, assignment: a }) => a.date === date && people.includes(a.employeeId)
      && !(j.id === job.id && `${a.date}|${a.start}` === ignoreKey))
    .sort((a, b) => minutes(a.assignment.start) - minutes(b.assignment.start));
  const from = Math.floor(Math.min(420, minutes(start), ...selected.map((e) => minutes(e.workStart)), ...blocks.map((b) => minutes(b.assignment.start))) / 60) * 60;
  const to = Math.ceil(Math.max(1140, minutes(start) + duration * 60, ...selected.map((e) => minutes(e.workEnd)), ...blocks.map((b) => minutes(b.assignment.start) + b.assignment.duration * 60)) / 60) * 60;
  const position = (s: number, length: number) => ({ left: `${(s - from) / (to - from) * 100}%`, width: `${length / (to - from) * 100}%` });
  const changeDay = (offset: number) => {
    const next = new Date(`${date}T12:00:00`);
    next.setDate(next.getDate() + offset);
    onDate(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-${String(next.getDate()).padStart(2, "0")}`);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="w-full" disabled={!people.length || !date}>
          <CalendarDays /> View schedule
        </Button>
      </PopoverTrigger>
      <PopoverContent align="center" className="w-[600px] max-w-[calc(100vw-2rem)] p-3" data-booking-schedule>
        <div className="flex items-center justify-between gap-2 mb-3">
          <h3 className="text-sm font-medium">Day schedule</h3>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Previous day" onClick={() => changeDay(-1)}><ChevronLeft /></Button>
            <Input aria-label="Schedule day" type="date" value={date} onChange={(e) => e.target.value && onDate(e.target.value)} className="h-8 w-36" />
            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Next day" onClick={() => changeDay(1)}><ChevronRight /></Button>
          </div>
        </div>
        <div className="overflow-auto max-h-[360px]">
          <div className="min-w-[520px]">
            <div className="relative h-6 ml-20 mr-4 text-[10px] text-muted-foreground">
              {Array.from({ length: (to - from) / 60 + 1 }, (_, i) => <span key={i} className="absolute -translate-x-1/2" style={{ left: `${i * 60 / (to - from) * 100}%` }}>{timeOf(from + i * 60)}</span>)}
            </div>
            {selected.map((person) => {
              const visits = blocks.filter((b) => b.assignment.employeeId === person.id);
              const off = !worksOn(person, date);
              return (
                <div key={person.id} className="flex gap-2 border-t border-border py-2">
                  <div className="w-[72px] shrink-0 pt-1 text-xs font-medium">{person.name.split(" ")[0]}<p className="text-[10px] font-normal text-muted-foreground">{off ? "Day off" : `${person.workStart}–${person.workEnd}`}</p></div>
                  <div className={`relative h-24 flex-1 mr-4 ${off ? "bg-muted" : "bg-background"}`}>
                    <div className="absolute inset-0 flex">
                      {Array.from({ length: (to - from) / 15 }, (_, i) => <Button key={i} variant="ghost" aria-label={`${person.name}: ${timeOf(from + i * 15)}`} className={`h-full flex-1 min-w-0 p-0 rounded-none ${i % 4 === 0 ? "border-l border-border" : ""}`} onClick={() => onStart(timeOf(from + i * 15))} />)}
                    </div>
                    {visits.map(({ job: booked, assignment: a }, i) => {
                      const survey = visitTypeFor(booked) === "survey";
                      const previous = visits[i - 1];
                      const drive = previous ? travelMinutes(previous.job.address, booked.address) : 0;
                      const previousEnd = previous ? minutes(previous.assignment.start) + previous.assignment.duration * 60 : 0;
                      return <div key={`${booked.id}|${a.start}`}>
                        {drive > 0 && <div className="absolute top-1 h-10 border border-dashed border-border bg-muted text-[9px] text-muted-foreground overflow-hidden pointer-events-none" style={position(previousEnd, Math.min(drive, Math.max(0, minutes(a.start) - previousEnd)))} title={`Estimated drive: ${drive} min`}>≈{drive}m</div>}
                        <div className={`absolute top-1 h-10 rounded border px-1 overflow-hidden pointer-events-none ${survey ? "bg-warning/10 border-warning/40" : "bg-surface border-border"}`} style={position(minutes(a.start), a.duration * 60)} title={`${booked.customer} · ${booked.service} · ${a.start}–${timeOf(minutes(a.start) + a.duration * 60)}`}>
                          <p className="flex items-center gap-1 text-[10px] font-medium truncate">{survey ? <ClipboardList className="w-3 h-3 shrink-0 text-warning" /> : <Wrench className="w-3 h-3 shrink-0" />}{booked.customer}</p>
                          <p className="text-[9px] text-muted-foreground truncate">{a.start} · {a.duration}h</p>
                        </div>
                      </div>;
                    })}
                    <div className="absolute top-14 h-9 rounded border border-dashed border-primary bg-primary/10 px-1 text-primary overflow-hidden pointer-events-none" style={position(minutes(start), duration * 60)}>
                      <p className="text-[10px] font-medium truncate">This visit</p><p className="text-[9px] truncate">{start} · {duration}h</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex flex-wrap gap-3 mt-2 text-[10px] text-muted-foreground">
          <span className="inline-flex items-center gap-1"><Wrench className="w-3 h-3" /> Work</span>
          <span className="inline-flex items-center gap-1"><ClipboardList className="w-3 h-3 text-warning" /> Survey</span>
          <span className="text-primary">This visit · {start}</span>
        </div>
      </PopoverContent>
    </Popover>
  );
}