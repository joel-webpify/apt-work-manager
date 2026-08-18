# Field app for service workers

A phone-first area at `/field` where a worker signs in as themselves (picked from the team list), sees only their own jobs, and can actually run the job: photos, a job sheet with checklist and notes, customer signature, and one-tap directions.

## What the worker gets

**My day** (`/field`)
- Big date strip (yesterday / today / tomorrow, swipe-friendly), defaulting to today.
- Their jobs for that day as tall cards: time, duration, customer, service, address, status chip.
- Header shows the worker name with a switcher (mock "who am I" — no login), plus job count and total hours.
- "Route for the day" button: opens Google Maps with all of the day's stops in order, using the addresses. Falls back to Apple Maps on iOS.

**Job sheet** (`/field/job/:id`)
Single scrolling page, thumb-sized controls:
1. **Header** — customer, service, time window, status. Buttons: Navigate (opens maps for this address), Call customer (`tel:`).
2. **Status flow** — On my way → Arrived → Working → Finished. Each tap stamps a time and writes a line into the job timeline.
3. **Milestones** — the existing per-job milestone checklist, big tappable rows.
4. **Photos** — add photos (device camera/gallery), each with an optional caption and a Before / During / After label. Grid of thumbnails, tap to view full, delete.
5. **Job sheet / survey** — fixed structure: a standard on-site checklist (access ok, area protected, parts used, cleared up, customer happy), measurements/quantities as free rows, and a notes box for what was done and anything to quote later.
6. **Extra work spotted** — short note + rough value, flagged back to the office as a follow-up opportunity.
7. **Customer sign-off** — name + finger/mouse signature pad, saved with a timestamp.
8. Everything saves as you go, no Save button, and shows "Saved just now".

## Office side

- Job drawer in Jobs & pipeline gets a **Site visit** section: worker's photos, the completed job sheet, extra work spotted, signature and arrival/finish times — read-only.
- Sidebar gets a "Field app" link so the office can preview what workers see.

## Directions

No map keys or embedded map. Buttons build map deep links from the job address:
- Single job: `https://www.google.com/maps/dir/?api=1&destination=<address>`
- Whole day: same URL with ordered `waypoints` for the middle stops and the last job as the destination.
- On iOS/Safari, Apple Maps links are used instead.

## Technical notes

- New store `src/lib/fieldStore.ts`: per-job field record (status stamps, photos, checklist answers, measurements, notes, extra work, signature), persisted to localStorage in the same pattern as `jobsStore`/`gbpStore`. Photos stored as data URLs, downscaled on the client before saving so localStorage doesn't blow up.
- New `src/lib/mapLinks.ts` for the deep-link builders.
- New layout `src/components/field/FieldLayout.tsx` — max-width mobile column, sticky top bar, no desktop sidebar; routes `/field` and `/field/job/:id` sit outside `AppLayout` in `src/App.tsx`.
- New pages `src/pages/field/MyDay.tsx` and `src/pages/field/FieldJob.tsx`, plus components `PhotoGrid.tsx`, `JobSheetForm.tsx`, `SignaturePad.tsx` (canvas, pointer events), `StatusStepper.tsx`.
- Worker identity kept in a tiny `useFieldUser` hook backed by localStorage, seeded from `employees` in `src/data/mockData.ts`.
- Jobs and assignments come from the existing `jobsStore` / `assignments` data; status stamps and milestones write through `updateJob` so the office view stays in sync.
- Design uses existing semantic tokens and `PageShell` primitives, with larger tap targets for field use.
