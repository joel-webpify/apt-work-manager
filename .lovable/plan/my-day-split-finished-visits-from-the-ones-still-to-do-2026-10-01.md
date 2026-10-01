# My day: split finished visits from the ones still to do

On the field app's My day page, a worker's finished visits and their remaining visits currently sit in one mixed list. Separate them so the day reads as "what's left" first and "what's done" underneath.

## What changes

- **Two sections on My day.** The day's jobs are split into "Still to do" and "Done". A visit counts as done when its wrap-up is signed off (locked); everything else stays in "Still to do".
- **Both visit kinds are covered.** The split applies to surveys and work alike — the existing Everything / Survey visits / Work filter chips keep working, and each filtered list is split the same way.
- **"Still to do" comes first**, in time order, looking exactly as the cards do today.
- **"Done" sits below under its own heading**, also in time order, with the signed-off tick chip the cards already show. Tapping a done card still opens the job sheet so the worker can look back at photos, notes or the signature.
- **The "You're on this now / Next up" card is untouched** — it only ever points at a live or upcoming visit, which is always in "Still to do".
- **Empty states stay sensible:** nothing booked → the existing "No jobs on this day" message; everything finished → "Still to do" shows a quiet "All done for today" line above the Done list.

## Technical notes

- Edit `src/pages/field/MyDay.tsx` only: split `dayStops` into `todo` / `done` arrays on the existing `lockedAt` check (already used for the "signed off" count), render two labelled groups, keep the kind filter and summary line as they are.
- No data-model, palette or typography changes; everything stays browser-local.

## Verification

- Phone-sized preview: a day with mixed visits shows Still to do above Done; signing off a visit moves its card from one section to the other; the filter chips re-split correctly; no console errors.
