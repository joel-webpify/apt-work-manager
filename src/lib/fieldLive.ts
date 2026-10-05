import type { Job, JobAssignment, Quote } from "@/data/mockData";
import { recordKey, type FieldRecord } from "@/lib/fieldStore";

export type LiveState = "on-my-way" | "on-site" | "finished" | "signed-off" | "late" | null;

export const liveLabel: Record<Exclude<LiveState, null>, string> = {
  "on-my-way": "On the way",
  "on-site": "On site",
  finished: "Finishing up",
  "signed-off": "Signed off",
  late: "Not arrived",
};

/** What the office should see on a booked visit, from the worker's own taps. */
export function liveStateFor(
  records: Record<string, FieldRecord>,
  jobId: string,
  a: JobAssignment,
  now = new Date(),
): LiveState {
  const r = records[recordKey(jobId, a.employeeId)];
  if (r?.lockedAt) return "signed-off";
  if (r?.status === "finished") return "finished";
  if (r?.status === "working" || r?.status === "arrived") return "on-site";
  const [h, m] = a.start.split(":").map(Number);
  const due = new Date(`${a.date}T00:00:00`);
  due.setHours(h, m + 15, 0, 0);
  const late = now > due && now.getTime() - due.getTime() < 12 * 3600_000;
  if (r?.status === "on-my-way") return late ? "late" : "on-my-way";
  return late ? "late" : null;
}

export interface FollowUp {
  job: Job;
  kind: "return-visit" | "parts-needed";
  note: string;
}

/** Signed-off visits that asked for another trip and haven't been rebooked. */
export function pendingFollowUps(jobs: Job[], records: Record<string, FieldRecord>): FollowUp[] {
  const out: FollowUp[] = [];
  for (const job of jobs) {
    for (const a of job.assignments ?? []) {
      const r = records[recordKey(job.id, a.employeeId)];
      if (!r?.lockedAt || (r.outcome !== "return-visit" && r.outcome !== "parts-needed")) continue;
      const rebooked = (job.assignments ?? []).some((b) => b.date > a.date);
      if (rebooked) continue;
      out.push({ job, kind: r.outcome, note: r.outcomeNote || r.followUp?.note || "" });
      break;
    }
  }
  return out;
}

export interface QuoteReady {
  job: Job;
  quoteId: string;
}

/** Surveys signed off whose drafted quote hasn't gone to the customer yet. */
export function quotesReadyToSend(jobs: Job[], records: Record<string, FieldRecord>, quotes: Quote[]): QuoteReady[] {
  const out: QuoteReady[] = [];
  const seen = new Set<string>();
  for (const [key, r] of Object.entries(records)) {
    if (!r.lockedAt || !r.surveyQuoteId || seen.has(r.surveyQuoteId)) continue;
    const q = quotes.find((x) => x.id === r.surveyQuoteId);
    if (q && q.status !== "Draft") continue;
    const job = jobs.find((j) => j.id === key.split("::")[0]);
    if (!job) continue;
    seen.add(r.surveyQuoteId);
    out.push({ job, quoteId: r.surveyQuoteId });
  }
  return out;
}
