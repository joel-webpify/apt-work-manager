import type { Job } from "@/data/mockData";

/** One step in a job's plan. The first unticked step is the job's next step. */
export type PlanStep = NonNullable<Job["milestones"]>[number];

const clearLegacy = { nextAction: undefined, nextActionDue: undefined, nextActionOwner: undefined } as const;

const newId = () => `ms-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

/**
 * The job's plan. Any older "next step" that isn't in the list yet is folded in
 * at the front of the outstanding steps, so nothing is lost.
 */
export function planSteps(job: Job): PlanStep[] {
  const list = job.milestones ?? [];
  const legacy = job.nextAction?.trim();
  if (!legacy) return list;
  if (list.some((s) => !s.done && s.label === legacy)) return list;
  const step: PlanStep = {
    id: "ms-legacy-next",
    label: legacy,
    done: false,
    due: job.nextActionDue,
    owner: job.nextActionOwner,
  };
  const at = list.findIndex((s) => !s.done);
  if (at < 0) return [...list, step];
  return [...list.slice(0, at), step, ...list.slice(at)];
}

/** The one thing to do next: the first step not ticked off. */
export function nextStep(job: Job): PlanStep | undefined {
  return planSteps(job).find((s) => !s.done);
}

export function planProgress(job: Job) {
  const steps = planSteps(job);
  const done = steps.filter((s) => s.done).length;
  return { steps, done, total: steps.length, pct: steps.length ? (done / steps.length) * 100 : 0 };
}

/** Every change to the plan goes through here so old fields get tidied away. */
function patch(steps: PlanStep[]): Partial<Job> {
  return { milestones: steps, ...clearLegacy };
}

export function writeSteps(steps: PlanStep[]): Partial<Job> {
  return patch(steps);
}

/** Add, change or clear the next step (the first unticked one). */
export function setNextStep(job: Job, label: string, due?: string, owner?: string): Partial<Job> {
  const steps = planSteps(job);
  const at = steps.findIndex((s) => !s.done);
  const text = label.trim();
  if (!text) {
    return patch(at < 0 ? steps : steps.filter((_, i) => i !== at));
  }
  if (at < 0) return patch([...steps, { id: newId(), label: text, done: false, due, owner }]);
  return patch(steps.map((s, i) => (i === at ? { ...s, label: text, due, owner } : s)));
}

/** Put someone's name against the next step, creating one if there isn't one. */
export function assignNextStep(job: Job, employeeId?: string): Partial<Job> {
  const steps = planSteps(job);
  const at = steps.findIndex((s) => !s.done);
  if (at < 0) return patch([...steps, { id: newId(), label: "Follow up", done: false, owner: employeeId }]);
  return patch(steps.map((s, i) => (i === at ? { ...s, owner: employeeId } : s)));
}

export function updateStep(job: Job, id: string, change: Partial<PlanStep>): Partial<Job> {
  return patch(planSteps(job).map((s) => (s.id === id ? { ...s, ...change } : s)));
}

export function toggleStep(job: Job, id: string): Partial<Job> {
  return patch(planSteps(job).map((s) => (s.id === id ? { ...s, done: !s.done } : s)));
}

export function removeStep(job: Job, id: string): Partial<Job> {
  return patch(planSteps(job).filter((s) => s.id !== id));
}

export function addStep(job: Job, label: string): Partial<Job> {
  const text = label.trim();
  if (!text) return {};
  return patch([...planSteps(job), { id: newId(), label: text, done: false }]);
}

/** Move a step to a new position in the list. */
export function reorderSteps(job: Job, fromId: string, toId: string): Partial<Job> {
  const steps = planSteps(job);
  const from = steps.findIndex((s) => s.id === fromId);
  const to = steps.findIndex((s) => s.id === toId);
  if (from < 0 || to < 0 || from === to) return {};
  const next = [...steps];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return patch(next);
}

export function applyPlanPreset(labels: string[]): Partial<Job> {
  return patch(labels.map((label, i) => ({ id: `ms-${Date.now()}-${i}`, label, done: false })));
}
