import { employees, type Employee, type Job } from "@/data/mockData";

/**
 * Rough driving time between two addresses, worked out from the postcode.
 * Same district (BS9 → BS9) is a short hop, elsewhere in the same town is a
 * middle trip, and a different town (Bristol → Bath) is a proper drive.
 * No map APIs, no keys — it's an estimate the office can see and adjust around.
 */

interface District {
  town: string; // "BS"
  district: string; // "BS9"
}

function districtOf(address: string): District | null {
  const m = address.toUpperCase().match(/\b([A-Z]{1,2})\s*(\d{1,2})[A-Z]?\b/);
  if (!m) return null;
  return { town: m[1], district: `${m[1]}${m[2]}` };
}

/** Estimated driving minutes between two job addresses. */
export function travelMinutes(from: string, to: string): number {
  const a = districtOf(from || "");
  const b = districtOf(to || "");
  if (!a || !b) return 20;
  if (a.district === b.district) return 10;
  if (a.town === b.town) return 25;
  return 45;
}

function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
function minutesToTime(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h < 10 ? "0" : ""}${h}:${m < 10 ? "0" : ""}${m}`;
}

export interface SmartSlot {
  start: string;
  /** True when the job had to spill past the person's working hours. */
  pastWorkday: boolean;
}

/**
 * First slot in a person's day where the job fits *and* leaves sensible room
 * for driving in and out — instead of stacking everything at their start time.
 */
export function findSmartSlot(opts: {
  employee: Employee;
  dateISO: string;
  duration: number; // hours
  jobs: Job[];
  movingJobId?: string;
  /** Earliest start, in minutes after midnight. */
  notBefore?: number;
}): SmartSlot {
  const { employee, dateISO, duration, jobs, movingJobId, notBefore = 0 } = opts;
  const job = jobs.find((j) => j.id === movingJobId);
  const workStart = timeToMinutes(employee.workStart || "08:00");
  const workEnd = timeToMinutes(employee.workEnd || "17:00");

  const blocks = jobs
    .flatMap((j) => (j.assignments ?? []).map((a) => ({ job: j, a })))
    .filter(
      (x) =>
        x.a.employeeId === employee.id &&
        x.a.date === dateISO &&
        x.job.id !== movingJobId,
    )
    .sort((x, y) => timeToMinutes(x.a.start) - timeToMinutes(y.a.start));

  let cursor = Math.max(workStart, notBefore);
  let prev: { job: Job; end: number } | null = null;

  for (const { job: other, a } of blocks) {
    const startMins = timeToMinutes(a.start);
    const endMins = startMins + Math.round(a.duration * 60);

    // Try to slot in before this block, leaving room to drive on afterwards.
    const driveOut = travelMinutes(job?.address ?? "", other.address);
    if (cursor + duration * 60 + driveOut <= startMins) break;

    // Otherwise move past it, leaving room to have driven here.
    const driveIn = travelMinutes(prev?.job.address ?? other.address, job?.address ?? "");
    cursor = Math.max(cursor, endMins + driveIn);
    prev = { job: other, end: endMins };
  }

  if (prev) {
    cursor = Math.max(cursor, prev.end + travelMinutes(prev.job.address, job?.address ?? ""));
  }

  return { start: minutesToTime(cursor), pastWorkday: cursor + duration * 60 > workEnd };
}

/** First start that works for every person on a shared visit. */
export function findTeamSlot(opts: {
  members: Employee[];
  dateISO: string;
  duration: number;
  jobs: Job[];
  movingJobId?: string;
}): SmartSlot {
  let notBefore = 0;
  let result: SmartSlot = { start: "08:00", pastWorkday: false };
  for (let i = 0; i < 6; i++) {
    const slots = opts.members.map((employee) => findSmartSlot({ ...opts, employee, notBefore }));
    const latest = Math.max(...slots.map((s) => timeToMinutes(s.start)));
    result = { start: minutesToTime(latest), pastWorkday: slots.some((s) => s.pastWorkday) };
    if (latest === notBefore || slots.every((s) => timeToMinutes(s.start) === latest)) break;
    notBefore = latest;
  }
  return result;
}
