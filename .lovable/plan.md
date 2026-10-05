# Field app + schedule: an honest review for a 15-person, €1.5M service business

## The short version
The worker's side of a visit is strong now: steps, photos, surveys, voice notes, signature, payment, extra work. The weak spot is the **loop between the office and the van**. Right now the schedule and the field app don't talk to each other. A business your size loses money in that gap, not inside a visit.

At ~€1.5M with ~10–12 people in the field, each worker is worth roughly €100–130k a year in revenue. One lost hour a day per worker costs about €15k each, or €150k+ across the team. That's how to judge each item below.

## What's already worth keeping
- Guided visit journey (Go, Arrive, Job, Wrap up, Done) with one big button at the bottom.
- Survey visits that feed draft quotes, and work visits that record materials and costs.
- Smart drop with travel time, a day view, and a schedule that works across every board.
- My day split into "Still to do" and "Done", with the next job and its drive time.

## Gaps, ranked by money
Each gap has a rough value for a 15-person team and the effort to build it (S, M or L).

### Tier 1: build these, they pay for themselves
1. **The office can't see what's happening in the field (high value, M).** The schedule never reads the workers' statuses. A dispatcher can't see "Daniel arrived 09:12, running 20 min late" without phoning him. Add live status on schedule blocks and chips (on the way, on site, finished, signed off) and a "running late" marker when nobody has arrived by the booked start time plus 15 minutes. This saves phone calls and lets the office warn customers before they complain.
2. **"Needs another visit" and "Waiting on parts" go nowhere (high value, S–M).** The worker can pick these outcomes, but nothing shows up for the office afterwards. Put these jobs back into the schedule's unscheduled list, tagged "Return visit" or "Waiting on parts", with the worker's note. Today these jobs leak out quietly, and unbooked return visits mean revenue you never collect.
3. **Survey done, but no quote sent (high value, S).** A survey that's signed off should show the office "Quote ready to send" with the drafted quote one tap away. Add a "Survey to quote" queue to the schedule sidebar, the dashboard and the job. Quote speed is the main thing that decides win rate in trades.
4. **No way to handle the day changing (medium–high value, M).** Sick days, emergencies and overruns are normal. Today the office has to move jobs one at a time. Add "Reshuffle the rest of this person's day", which re-runs smart drop from the current time, and "Hand to someone else", which suggests the free worker with the right trade who is nearest by travel time.

### Tier 2: strong improvements
5. **Customer "on my way" text with an arrival time (medium value, S).** It's a manual text today. Prefill it with the travel-time estimate ("about 25 min"), and let the office send it too. Fewer "can't get in" visits.
6. **Hours on the clock vs booked hours (medium value, S).** The Me tab already says it doubles as a timesheet. Add a weekly sheet in the office (booked vs on site vs travel, per person). That replaces paper timesheets and shows who is overbooked.
7. **Repeat visits (medium value, M).** Window cleaning, servicing and maintenance contracts are booked by hand. Add "Repeat every N weeks" to a booking, and smart drop places each one. This is recurring revenue you can't miss.
8. **Materials still needed (medium value, S).** When the outcome is "Waiting on parts", capture what's missing so the office can order it before booking the return visit.

### Tier 3: nice later
9. A route view of a worker's day on one map link (all stops in order).
10. Skills and certificates on staff (Gas Safe, NICEIC) so smart drop doesn't suggest someone who isn't qualified.
11. A wet-weather or "can't do today" button that hands the job back to the office.

## Not worth building yet
- Live GPS tracking. It's costly, raises privacy questions with staff, and status taps give 80% of the value.
- Full route optimisation with map services. The postcode estimate is good enough at this size.
- Everything above runs in the browser for now. **Real use across many phones needs the cloud foundation** (accounts, a shared database, sync) from the readiness review. Without it, the office and workers can't see each other's updates on different devices. Tier 1 #1 depends on this to be real outside a demo.

## Suggested order
1. Tier 1: items 1–3 (demo-able now, high sales value).
2. Cloud foundation, so items 1–4 work across real phones.
3. Tier 1 #4, then Tier 2.

## Technical notes
- Live status: ScheduleView/DayView read `useFieldRecords()` per assignment (`recordKey(jobId, employeeId)`); late = no `stamps.arrived` by start + 15 min.
- Follow-ups: the unscheduled rule extends to "has a signed-off record with outcome return-visit or parts-needed and no later assignment"; badge plus outcomeNote.
- Survey to quote: reuse the WrapUpSheet draft-quote link; list surveys that are signed off and whose quote is still draft.
- Reshuffle and hand off: reuse `findSmartSlot`/`travelMinutes` from `src/lib/travel.ts`, filter by trade.
- Repeats: an optional `repeat` rule on an assignment, expanded when the week renders.
