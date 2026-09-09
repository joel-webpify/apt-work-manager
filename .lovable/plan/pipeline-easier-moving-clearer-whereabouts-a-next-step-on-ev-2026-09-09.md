# Pipeline: easier moving, clearer whereabouts, a next step on every job

Three changes, all on the jobs board.

## 1. Moving a job takes one tap

- Every card gets a **Move** menu: pick any stage in the current board, or pick a stage on the other board — one action, no dragging needed.
- The card also gets small **back / forward** arrows to nudge a job one stage either way.
- Dragging keeps working exactly as it does now.
- The same Move menu appears at the top of the job panel, so you never have to close the panel to move something.
- Every move writes a line in the job's history ("Moved to Quote sent").

## 2. Sales or installation, always obvious — and automatic

- Reaching the last sales stage (**Won**) now hands the job over to installation by itself, landing it in **To schedule**.
- A message appears with **Undo** so a wrong handover is one tap away; the handover line stays in the history either way.
- **Send to installation** and **Return to sales** stay as manual buttons, so you can still hand over early or pull a job back at any time.
- Each card shows a small badge — a handshake for sales, a spanner for installation — so on the *All jobs* list and in search results you can see instantly which side a job is on.
- The board tabs show the count per side, and a job moved by the automatic handover is highlighted briefly on the installation board so you can see it arrive.

## 3. A next step on every job

- Each job carries one **next step** (short text) and a **due date**.
- Shown on the card: today's steps in normal text, overdue in red, nothing set shows a quiet "Add next step".
- Editable from the card menu and from the job panel.
- A **Needs attention** filter on each board shows jobs that are overdue, have no next step, or have been sitting in a stage too long.
- Moving a job to a new stage clears the old step and prompts for a new one, so nothing goes stale.

## Technical notes

- `src/data/mockData.ts`: add `nextAction?: string` and `nextActionDue?: string` to `Job`.
- `src/pages/Pipeline.tsx`: extract a `MoveJobMenu` (dropdown listing stages grouped by pipeline, plus cross-pipeline entries) used by `JobCard` and the job drawer; add stage-step arrow buttons; add a `NextStepPopover` for editing the next step; extend `onlyStuck` into a `needsAttention` predicate (overdue OR missing next step OR `daysInStage >= stuckFor(stage)`).
- Auto handover: in the existing stage-change handler, when the target is `lastStageOf("sales")`, chain a move to `firstStageOf("install")` and fire a toast with an Undo action that restores the previous `{pipelineId, stage, daysInStage}` snapshot and drops the appended timeline entry.
- All moves funnel through one `moveJob(job, pipelineId, stage)` helper that sets `daysInStage: 0`, appends the timeline note, keeps `selected` in sync, and calls `onJobStageChange` from `src/lib/lifecycle.ts` exactly once.
- Recently-arrived highlight: transient id set in component state, no persistence.
- Storage stays `jobsStore` localStorage; no backend work.

Out of scope: reminders/notifications for due next steps, assigning the next step to a person, per-pipeline reporting.
