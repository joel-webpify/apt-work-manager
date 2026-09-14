# One job plan, and tidier cost rows

## 1. Milestones and the next step become one list

Today a job has a separate "next step" and a separate milestone checklist. They merge into a single **Job plan** list.

- One checklist of steps on the job. Each step can have a tick box, an optional date and an optional person.
- The **top unticked step is the next step**. It shows on the card and in the bar at the top of the open job, with the date and the person's initials, exactly as the next step does now.
- Ticking a step off automatically promotes the one below it, so the card always shows something current.
- Assign from either place: the small person button on the card, or on any row in the list.
- Presets stay ("Standard job", "Install", "Quick visit") for filling a plan in one tap, and steps can be added, renamed, reordered by dragging and deleted.
- Progress ("3 of 5 done") replaces the two separate summaries in the Overview tab, with the next step named underneath.
- Overdue steps stay red, and the **Needs attention** filter keeps working off the top unticked step.
- Moving a job to a new stage no longer wipes the plan: it just prompts for a next step if nothing is left unticked.

## 2. Costs: added lines fold away

In the Costs tab, "Materials used" and "Work done" currently show every line fully expanded with all its inputs.

- Once a line is added it collapses to a single row: name, quantity and unit, cost, and what the customer pays.
- An **Edit** control on the row opens the full fields; **Done** folds it back.
- A newly added line opens expanded so it can be filled in straight away.
- The two totals rows and the "How is the work priced?" choice stay as they are.

## Technical notes

- `src/data/mockData.ts`: extend `Job["milestones"]` entries with optional `due?: string` and `owner?: string`. Keep `nextAction`/`nextActionDue`/`nextActionOwner` on the type for existing stored jobs; on first read, migrate any existing next step into the front of the milestone list (helper in `src/pages/Pipeline.tsx` or a small `src/lib/jobPlan.ts`).
- New `src/lib/jobPlan.ts`: `planSteps(job)`, `nextStep(job)` (first `!done`), `dueState(step)`, `setStep`, `toggleStep`, `addStep`, `removeStep`, `reorderSteps`, `assignStep` — all returning a `Partial<Job>` patch for `updateJob`.
- `src/pages/Pipeline.tsx`: `BoardCard`, the all-jobs list, `NextStepEditor`, `AssignMenu`, the drawer header bar, the Overview progress block and `MilestonesSection` all read through `nextStep(job)`; `MilestonesSection` becomes `JobPlanSection` with per-row date/owner controls and drag reordering. `needsAttention` and the move snapshot switch from the three `nextAction*` fields to `milestones`.
- `src/components/field/MaterialsList.tsx`: add per-row `expanded` state (`Set<string>`), a collapsed summary row, and an Edit/Done toggle; new rows added via `addMaterial` start expanded. No change to `materialsStore` or cost maths.
- Storage stays localStorage; no backend work.
