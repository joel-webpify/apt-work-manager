# Schedule: its own page, smart drop with travel time, and a proper day view

## What we're building

The schedule moves out of the pipeline into its own page in the side menu, and gets three upgrades the user picked:

1. **Smart drop with travel time** — dropping a job lands it in the next free slot (after existing jobs plus a sensible driving gap), instead of stacking everything at the person's start time.
2. **A proper day view** — an hour-by-hour timeline of how each person's day actually flows: job blocks, travel blocks between jobs, gaps, and anything overlapping.
3. **Survey vs work marked everywhere** — the same survey/work distinction the field app already uses, shown on the office schedule so the office sees that a morning is quotes-visit work, not actual jobs.

Plus one quiet fix: the schedule currently only recognises fixed stage names ("Job booked", etc.), so jobs on renamed or custom boards never show up as unscheduled. It becomes board-blind: any job with no booked visit appears as unscheduled, whatever its stage or pipeline.

## Page layout

```text
/schedule
+--------------------------------------------------------------+
| Week view  | Day view          (toggle)        Mon 5 May – Sun 11 May |
| < prev  This week  next >        Fullscreen                  |
+--------------------------------------------------------------+
| WEEK: staff rows x 7 day columns (today's grid, kept as-is,  |
| now showing every pipeline's jobs + survey/work markers)     |
|                                                              |
| DAY: employee timeline, hour rows 07:00-18:00                |
|   blocks positioned by start time and duration               |
|   shaded travel blocks between jobs, gaps visible            |
|   person picker + day picker on top                          |
+--------------------------------------------------------------+
| Unscheduled sidebar (drag me) — all pipelines, no stage rules|
+--------------------------------------------------------------+
```

- Sidebar: new item "Schedule" in the CRM group (icon CalendarDays). Route `/schedule` in App.tsx.
- Pipeline page: the "Schedule" view toggle is removed (board and list stay); nothing else on that page changes.
- The unscheduled sidebar, capacity bars, trade filter, staff drawer, drag-and-drop and edit/resize chips are all kept — moved to the new page, not rebuilt.

## Smart drop + travel time

- New helper `src/lib/travel.ts`: estimates driving minutes between two job addresses using the postcode district (e.g. BS9 to BS1). Same district → short hop, neighbouring Bristol districts → medium, different town / outside the person's area → longer. No external map APIs, no keys — it's an estimate, and the plan is to show it as a shaded "travel" block the user can see and work around.
- Dropping a job into a day: start it at the first slot where the person is free *and* there's travel room after the previous job. If the day's working hours fill up, drop it at the first gap and flag it; the user can drag or edit as today.
- The day view draws the travel gaps as light shaded blocks between consecutive jobs.

## Day view

- Pick a person (or "everyone") and a day; each staff row shows an hour ruler with job blocks sized by duration.
- Colour coding carries the survey/work distinction: survey blocks in one tint with a survey marker, work blocks in the normal colour — same vocabulary as the field app's Visit badges.
- Clicking a block opens the job, exactly like the week view.
- Off days stay shaded; overlapping jobs keep the conflict ring from today's grid.

## Visit kinds on the schedule

- Week-grid chips and day-view blocks both show survey/work markers using the existing `visitTypeFor` logic, so nothing new needs to be set per job — the sales pipeline reads as surveys, everything else as work, and a job's own setting wins when present.
- The trade filter row stays; no new filters beyond the existing ones.

## Technical notes

- New page `src/pages/Schedule.tsx`; extract the week grid, chips, unscheduled sidebar and staff drawer from `src/components/pipeline/ScheduleView.tsx` into `src/components/schedule/` so the pipeline page and the new page don't carry duplicates.
- Travel estimation is a pure function over the existing postcode fields on jobs and staff service areas — no external service, works offline.
- Unscheduled rule becomes: any job with no booked visits shows as unscheduled, regardless of stage or pipeline. Completed/lost jobs that already have visits keep their bookings.
- Demo-week anchoring stays as today (the sample data lives in a fixed week) so the page is alive with data; no behaviour change for the user.
- No palette, typography, or data-model changes; everything stays browser-local as the rest of the app is.

## Verification

- Drag a job onto a busy day: it lands in the first free slot with travel room, not at 08:00 on top of another job.
- Day view shows travel blocks and gaps; switching between week and day keeps the same data.
- Jobs from renamed/custom boards appear in the unscheduled list.
- Survey/work markers visible on both week chips and day blocks.
- Desktop, the current preview size, and phone: no overflow, no console errors; the pipeline page still works without the schedule tab.
