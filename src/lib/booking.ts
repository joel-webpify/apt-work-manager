import { employees as allEmployees, type Employee, type Job, type JobAssignment } from "@/data/mockData";
import { findSmartSlot, findTeamSlot, travelMinutes } from "@/lib/travel";

/** One visit = every assignment on the same job, date and start. */
export interface Visit {
  key: string;
  date: string;
  start: string;
  duration: number;
  teamId?: string;
  employeeIds: string[];
}

export function visitsOf(job: Job): Visit[] {
  const map = new Map<string, Visit>();
  for (const a of job.assignments ?? []) {
    const key = `${a.date}|${a.start}`;
    const v = map.get(key);
    if (v) v.employeeIds.push(a.employeeId);
    else map.set(key, { key, date: a.date, start: a.start, duration: a.duration, teamId: a.teamId, employeeIds: [a.employeeId] });
  }
  return [...map.values()].sort((x, y) => x.key.localeCompare(y.key));
}

const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

export function worksOn(e: Employee, dateISO: string) {
  const day = new Date(`${dateISO}T00:00:00`).getDay();
  return e.workingDays.includes(day) && !e.daysOff.includes(dateISO);
}

/** People who would clash or are off if booked at this time. */
export function bookingWarnings(opts: {
  jobs: Job[];
  jobId: string;
  employeeIds: string[];
  date: string;
  start: string;
  duration: number;
  ignoreKey?: string;
  employees?: Employee[];
}): string[] {
  const list = opts.employees ?? allEmployees;
  const out: string[] = [];
  const s = toMin(opts.start);
  const e = s + opts.duration * 60;
  for (const id of opts.employeeIds) {
    const emp = list.find((x) => x.id === id);
    if (!emp) continue;
    const first = emp.name.split(" ")[0];
    if (!worksOn(emp, opts.date)) {
      out.push(`${first} is off that day`);
      continue;
    }
    const clash = opts.jobs.some((j) =>
      (j.assignments ?? []).some((a) => {
        if (a.employeeId !== id || a.date !== opts.date) return false;
        if (j.id === opts.jobId && `${a.date}|${a.start}` === opts.ignoreKey) return false;
        const as = toMin(a.start);
        return as < e && as + a.duration * 60 > s;
      }),
    );
    if (clash) out.push(`${first} already has a visit then`);
  }
  return out;
}

export function bookVisit(job: Job, v: { employeeIds: string[]; date: string; start: string; duration: number; teamId?: string }): Job {
  const add: JobAssignment[] = v.employeeIds.map((employeeId) => ({
    employeeId,
    date: v.date,
    start: v.start,
    duration: v.duration,
    ...(v.teamId ? { teamId: v.teamId } : {}),
  }));
  return { ...job, assignments: [...(job.assignments ?? []), ...add] };
}

export function cancelVisit(job: Job, visitKey: string, scope: "visit" | { employeeId: string }): Job {
  return {
    ...job,
    assignments: (job.assignments ?? []).filter((a) => {
      if (`${a.date}|${a.start}` !== visitKey) return true;
      return scope !== "visit" && a.employeeId !== scope.employeeId;
    }),
  };
}

export function moveVisit(job: Job, visitKey: string, patch: { date?: string; start?: string; duration?: number }): Job {
  return {
    ...job,
    assignments: (job.assignments ?? []).map((a) => (`${a.date}|${a.start}` === visitKey ? { ...a, ...patch } : a)),
  };
}

export interface SlotSuggestion {
  date: string;
  start: string;
  driveMins: number;
}

function addDaysISO(iso: string, n: number) {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Earliest free slots (with driving room) for everyone on the visit, over the next few days. */
export function suggestSlots(opts: {
  job: Job;
  jobs: Job[];
  employeeIds: string[];
  fromISO: string;
  duration: number;
  days?: number;
  limit?: number;
  employees?: Employee[];
}): SlotSuggestion[] {
  const list = opts.employees ?? allEmployees;
  const members = opts.employeeIds.map((id) => list.find((e) => e.id === id)).filter(Boolean) as Employee[];
  if (!members.length) return [];
  // Ignore this job's own bookings so suggestions are about everyone else's work.
  const others = opts.jobs.map((j) => (j.id === opts.job.id ? { ...j, assignments: [] } : j));
  const all = others.some((j) => j.id === opts.job.id) ? others : [...others, { ...opts.job, assignments: [] }];
  const out: SlotSuggestion[] = [];
  for (let i = 0; i < (opts.days ?? 7) && out.length < (opts.limit ?? 3); i++) {
    const date = addDaysISO(opts.fromISO, i);
    if (!members.every((m) => worksOn(m, date))) continue;
    const slot =
      members.length === 1
        ? findSmartSlot({ employee: members[0], dateISO: date, duration: opts.duration, jobs: all, movingJobId: opts.job.id })
        : findTeamSlot({ members, dateISO: date, duration: opts.duration, jobs: all, movingJobId: opts.job.id });
    if (slot.pastWorkday) continue;
    // Drive from whatever comes just before, for the first person.
    const before = all
      .flatMap((j) => (j.assignments ?? []).map((a) => ({ j, a })))
      .filter((x) => x.a.employeeId === members[0].id && x.a.date === date && toMin(x.a.start) < toMin(slot.start))
      .sort((x, y) => toMin(y.a.start) - toMin(x.a.start))[0];
    out.push({ date, start: slot.start, driveMins: before ? travelMinutes(before.j.address, opts.job.address) : 0 });
  }
  return out;
}
