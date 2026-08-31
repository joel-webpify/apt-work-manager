# Field app: honest critique and the fixes worth making

The bones are good — My day, status stamps, photos, job sheet, extra work, signature, office sync. What's missing is the stuff that bites on a real van day: nothing enforces a complete job, there's no travel/timing sense, no way to say "couldn't get in", and a few technical soft spots that will fail quietly.

## The problems, ranked

**1. A job can be "Finished" with nothing filled in.**
Nothing checks photos, checks, notes or a signature. The office gets empty job sheets and finds out days later.

**2. Two workers on the same job overwrite each other.**
Field records are keyed by job id only, so a second person on the job edits the first person's sheet, photos and signature.

**3. No sense of time or travel.**
My day shows times and hours but no gaps between stops, no "you're running late", no travel hop between addresses, no per-stop navigate button (you have to open the job first).

**4. No "it didn't go to plan" path.**
No access, customer not in, needs a return visit, parts missing. Right now the only honest option is to leave the job untouched.

**5. Photos are fragile.**
Stored as data URLs in browser storage; when it fills up the save silently fails and the photo is lost. No upload feedback, no HEIC handling, no "photo required" prompt.

**6. Small but constant friction.**
Signature name is read out of the DOM rather than state. No time on site actually measured (only stamps). No "next job" link at the bottom of a job sheet. No offline indicator. The whole sheet stays editable after sign-off.

## What I'd build

### A. Finish properly (biggest win)
- Replace the free "Finished" tap with a **Wrap up** sheet: shows what's still missing (no after photo, checks unticked, no signature, no notes) and asks for a reason if the worker finishes anyway.
- Sign-off locks the sheet to read-only with a small "Reopen" for corrections; the office sees who reopened and when.
- Day-level "Day complete" summary on My day: jobs done, hours on site, extra work spotted.

### B. Outcomes, not just statuses
- Add an outcome to each visit: **Completed / Couldn't get access / Needs a return visit / Parts needed**, each with a short note.
- Anything other than Completed shows on the office job drawer as a flag, not buried in notes.

### C. Timing and travel on My day
- Timeline layout with gaps between stops ("45 min gap", "back-to-back").
- Per-card **Navigate** and **Call** buttons so the worker never has to open the job to leave.
- Running-late hint when the current time is past the start of a job still not started.
- Time on site measured from Arrived → Finished, shown on the card and sent to the office (feeds timesheets later).

### D. Photo reliability
- Show upload/compress progress and a clear error if storage is full, with a prompt to reduce quality rather than losing the shot.
- Prompt for at least one **After** photo before wrap up.
- Per-photo timestamps visible; group the grid by Before / During / After.

### E. Per-worker records
- Key field records by `jobId + employeeId` so each worker's sheet, photos and stamps are their own; the office view merges all workers on a job.
- Migrate existing single-key records to the first assigned worker on load, so nothing is lost.

### F. Field navigation
- Sticky bottom bar in the field app: **My day**, **Job** (current), **Me** (today's hours and jobs done).
- End of job sheet: "Next: 14:00 Mrs Hall" with a direct link.

## Technical notes

- `src/lib/fieldStore.ts`: change the record key to `${jobId}::${employeeId}`, add `outcome`, `outcomeNote`, `lockedAt`, `reopenedAt`, and a one-off migration of old keys. Add selectors for "all records for a job" used by the office view.
- New `src/components/field/WrapUpSheet.tsx` — completeness checks derived from the record, blocking-with-override behaviour.
- `src/pages/field/MyDay.tsx` — timeline with gap rows, per-card navigate/call, running-late state, day summary footer.
- `src/pages/field/FieldJob.tsx` — read-only mode after sign-off, outcome picker, next-job footer, time-on-site display.
- `src/components/field/PhotoGrid.tsx` — progress state, quota error handling, grouped by label.
- `src/components/field/FieldLayout.tsx` — bottom tab bar.
- `src/components/pipeline/SiteVisitSection.tsx` — multi-worker merge, outcome flags, time on site.
- `src/components/field/SignaturePad.tsx` / `SignOff` — lift the name into React state instead of `getElementById`.

Existing semantic tokens and mock data only; no backend changes.

## Suggested order

1. Per-worker records + migration (everything else depends on the key change)
2. Wrap up + outcomes + sign-off lock
3. My day timeline, travel gaps, per-card actions
4. Photo reliability
5. Bottom nav + next job
6. Office-side merge and flags
