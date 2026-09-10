import type { Job } from "@/data/mockData";
import { updateJob } from "@/lib/jobsStore";
import type { FieldRecord } from "@/lib/fieldStore";

/**
 * Two very different days out: going to look at a job and price it up (a survey),
 * or turning up to actually do the work.
 */
export type VisitType = "survey" | "work";

export const visitTypeLabel: Record<VisitType, string> = {
  survey: "Survey visit",
  work: "Work",
};

export const visitTypeBlurb: Record<VisitType, string> = {
  survey: "Look at the job, take measurements and photos, then price it up.",
  work: "Do the work, log materials and get it signed off.",
};

/** A job carries its own type; otherwise a sales job is a survey and everything else is work. */
export function visitTypeFor(job: Pick<Job, "visitType" | "pipelineId" | "service">): VisitType {
  if (job.visitType) return job.visitType;
  const pipeline = job.pipelineId ?? "sales";
  if (pipeline === "sales") return "survey";
  const service = (job.service ?? "").toLowerCase();
  if (service.includes("survey") || service.includes("quote") || service.includes("estimate")) return "survey";
  return "work";
}

export function setVisitType(jobId: string, type: VisitType) {
  updateJob(jobId, { visitType: type });
}

/** What still needs doing before this kind of visit can be signed off. */
export function visitGaps(record: FieldRecord, type: VisitType): { id: string; label: string }[] {
  if (type === "work") return [];
  const gaps: { id: string; label: string }[] = [];
  if (record.photos.length === 0) gaps.push({ id: "photos", label: "No photos of the site" });
  const answers = record.survey?.answers ?? {};
  if (Object.keys(answers).length === 0) gaps.push({ id: "survey", label: "Survey questions not filled in" });
  return gaps;
}
