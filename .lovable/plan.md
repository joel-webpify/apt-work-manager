# Two pipelines: Sales and Installation

Today there is one board with a single set of stages. This adds a second board for installation work, with a clear handover step, so you can see selling and delivering as separate processes without losing the job's history.

## How it will work

- Tabs above the board: **Sales**, **Installation**, **All jobs**.
- Every job belongs to one pipeline at a time. Its stage is a stage of that pipeline.
- On a won sales job (last sales stage) a **Send to installation** button appears — on the card and in the job panel. Pressing it moves the same job to the first installation stage and logs a line in the job's timeline ("Handed over to installation"). Nothing moves until you press it.
- A job can be sent back with **Return to sales** if it was handed over too early.
- **All jobs** is a list showing customer, value, which pipeline the job is in, its stage, and days sitting there — so you can see the whole journey in one place.
- Each board keeps what it has now: drag between stages, search, sort, schedule view, job panel, milestones.
- Stage settings (rename, colour, add, remove, reorder) become per pipeline, so sales stages and installation stages are edited separately.

## Starting stages

- Sales: New enquiry, Quote sent, Won (existing "Job booked", "In progress", "Completed", "Invoiced", "Paid" move to installation — see below).
- Installation: To schedule, Booked in, In progress, Completed, Invoiced, Paid.

Existing demo jobs are placed automatically: anything up to "Quote sent" stays in sales, everything from "Job booked" onward starts in the installation pipeline at the matching stage. All existing jobs keep their stage names, so nothing looks lost.

## Technical notes

- `src/lib/stagesStore.ts`: reshape state to `pipelines: { id, name, stages: Stage[] }[]` with a stored version key and a one-time migration from the current flat stage list; keep `resolveStageName` and colour helpers, add `pipelineForStage(name)` and per-pipeline accessors. New localStorage key so old data migrates cleanly instead of clashing.
- `src/data/mockData.ts`: add `pipelineId?: "sales" | "install"` to `Job`, plus seed pipeline definitions; keep `PipelineStage` union intact to avoid touching unrelated files.
- `src/lib/jobsStore.ts`: unchanged storage; jobs gain the optional field. Add a read-time default that derives `pipelineId` from the job's stage when absent.
- `src/pages/Pipeline.tsx`: pipeline tab state (persisted in the URL as `?pipeline=sales|install|all`), filter jobs by pipeline, render stage columns from the active pipeline, add handover/return actions calling `updateJob` with the target pipeline's first stage plus a timeline entry, and add the All jobs table.
- `src/components/pipeline/ManageStagesDialog.tsx`: scope editing to the active pipeline and allow renaming the pipeline itself.
- `src/components/pipeline/NewJobDialog.tsx`: pick which pipeline the new job starts in (defaults to the active tab).
- `ScheduleView` and the field app read jobs by stage; they keep working since stage names are unchanged.

Out of scope: creating a third pipeline from the UI, per-pipeline reporting, automations triggering on handover.
