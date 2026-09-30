# Field app: a guided journey instead of one long page

## What's wrong today
The job screen is one long scroll: header, visit-type toggle, status stepper, "talk me through it", photos, survey, sheet, materials, extra work, then wrap-up — all visible at once, whatever stage the worker is at. A worker standing in a driveway has to scroll past things that don't matter yet to find the one thing that does. My day and the job screen also don't hand over to each other well — you leave the job and have to find your place again.

## The new journey
The job screen shows **only what matters right now**, stage by stage, with one big button at the bottom.

```text
My day  ->  On my way  ->  Arrived  ->  Doing the job  ->  Wrap up  ->  Done / Next job
```

1. **Before you go** — customer, address, time, access notes and what the job is. Big "Directions" and "Call". Bottom button: "I'm on my way" (can send the customer a heads-up text).
2. **Arrived** — a short arrival check: "Before" photos prompt and access OK. Bottom button: "Start work".
3. **Doing the job** — for **work visits**: job plan steps, photos, materials used, notes (type, tap chips or talk). For **survey visits**: the survey questions, one section at a time with a progress bar. Everything else is collapsed behind "More" (extra work spotted, measurements).
4. **Wrap up** — the existing wrap-up sheet becomes a proper step-by-step: what's missing, "After" photo, outcome, signature, payment, review request, next visit. Each step one screen.
5. **Done** — a clear finish screen: summary of what went to the office and the customer, plus a big "Next job: 11:30 Riverside Cafe — 25 min drive" button that goes straight into step 1 of the next job.

## Smaller fixes along the way
- **Sticky bottom action bar** on the job screen with the one next thing to do — thumb-reachable, always the same place.
- **Stage tabs at the top** so a worker can jump back (e.g. add a forgotten photo) without losing their place.
- **My day opens on the right job** — whatever's in progress, or the next one up, with its drive time from `travel.ts`.
- **Visit type** toggle moved out of the header into "More" (it's rarely changed and easy to hit by mistake).
- **Worker switcher** moved to the Me tab (it's a demo control, not something a worker uses daily).
- Bigger tap targets and fewer small grey lines of help text; one short hint per step instead.

## What stays the same
All the existing pieces (photos, survey forms, materials, voice notes, signature, payment, wrap-up checks, offline saving) — they're rearranged into steps, not rebuilt. Office side, colours and fonts unchanged. Still stored on the phone.

## Technical notes
- `src/pages/field/FieldJob.tsx` becomes a stage router: derive current stage from `record.status` + `lockedAt`; render `JobStageBefore`, `JobStageArrived`, `JobStageWork` / `JobStageSurvey`, `WrapUpSheet` (steps), `JobStageDone` under `src/components/field/stages/`.
- New `src/components/field/JobActionBar.tsx` (sticky bottom primary action) and `StageTabs.tsx` (replaces `StatusStepper` visually; same `setStatus`).
- `WrapUpSheet.tsx` split into paged steps with a progress dot row; logic unchanged.
- Next-job lookup: helper in `src/lib/fieldStore.ts` using the worker's assignments for today, drive time from `travelMinutes`.
- `FieldLayout.tsx`: worker select moved to `MyStats.tsx` (Me tab).
- Verify with Playwright at phone 390x844: full journey on a work visit and a survey visit, no errors.
