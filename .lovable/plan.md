# Field app: fewer taps, more money out of every visit

Right now the field app records a job. That's table stakes. The version worth building does two things instead: it makes the visit almost effortless for the worker, and it turns every visit into revenue — payment, a review, and the next job — before the van leaves the driveway.

The guiding rule: **never make a worker type a paragraph they could tap, pick, or say instead** — typing stays available everywhere, it's just no longer the only way.

## Part 1 — Make it effortless

**One live job screen.**
When a worker arrives, the app knows which job they're on. My day collapses into a single "current job" card with one big primary button that changes as the visit progresses: On my way → Arrived → Start work → Wrap up. No hunting through sections.

**Type or talk — the worker's choice.**
The text fields stay exactly where they are, and they get better: quick-pick chips above each box (common jobs, common parts, "cleared up", "customer happy") that drop wording straight in, plus a "tidy this up" action that turns rough notes into a clean sentence for the customer summary.
Next to the box sits a mic button as an alternative for anyone who'd rather talk than thumb-type. Say "replaced the two radiator valves, old ones were seized, cleared up, spotted the outside tap dripping" and the app fills work done, parts used, ticks the matching checks and drops the tap into "extra work spotted" — all landing in the same editable fields, never posted anywhere without the worker seeing it first. If dictation isn't available on the device, the fields simply work as they do today.

**Photos do the paperwork.**
Every photo is auto-labelled Before/During/After from where you are in the status flow, timestamped and geo-noted. No dropdowns.

**Nothing is a blank box.**
Checks, parts and measurements are suggested from the service type on the job (boiler service vs. fencing vs. garden clearance), so the sheet starts 80% filled.

## Part 2 — Make every visit pay

**Get paid before you leave.**
At wrap up, the worker can take payment on the spot — amount pre-filled from the job value, a payment link the customer taps on their own phone or a "paid by card/cash/bank transfer" record. Cash in the same day instead of chasing an invoice for three weeks.

**Extra work becomes a real quote, on site.**
"Spotted more work" stops being a note. The worker picks a service and a rough price, and the app produces a proper quote the customer can approve there and then, or that lands in the office's Quotes pipeline with photos already attached.

**Ask for the review at the best possible moment.**
Straight after the signature — while the customer is happy and standing there — one tap sends the review request. This feeds directly into the Google Business Profile module already in the app.

**The customer gets a job story, not silence.**
Sign-off generates a clean visit summary: before/after photos, what was done, parts used, who attended, signature. Sent by text/email automatically. It's proof of work, marketing content and a dispute-killer in one.

**Book the next visit while you're there.**
Servicing, follow-up, second fix — one tap proposes a return date and puts it in the schedule.

## Part 3 — Make it trustworthy

**Works with no signal.** Everything is written locally and marked "Waiting to send", with a clear banner. Nothing is ever lost because a barn had no bars.

**Finish means finished.** A wrap-up sheet shows what's missing (no after photo, no signature, no notes) and asks for a reason if the worker skips it. Sign-off locks the sheet.

**It didn't go to plan is a first-class option.** Couldn't get access / needs a return visit / parts needed — each with a note, flagged straight to the office instead of being buried.

**Each worker owns their own sheet.** Records are per worker per job, so two people on one job don't overwrite each other; the office view merges them.

**The worker sees what they earned.** A simple "Me" tab: jobs done this week, hours on site, extra work spotted, payments taken. Motivating, and it doubles as a timesheet.

## What the office gets out of it

Site visit section on the job shows: every worker's sheet merged, the visit outcome flag, time on site, payment taken, extra work with a draft quote ready to send, review request status, and the customer summary that went out. Extra work spotted across all jobs becomes a small "Opportunities from the field" list — the cheapest pipeline in the business.

## Technical notes

- `src/lib/fieldStore.ts`: key records by `${jobId}::${employeeId}` with a migration of existing keys; add `outcome`, `outcomeNote`, `payment`, `reviewRequest`, `followUp`, `lockedAt`, `syncState`. Selectors for all records on a job.
- `src/lib/fieldTemplates.ts`: service-type → suggested checks, parts and measurements.
- Voice: Web Speech API for dictation where available, with a typed fallback; parsing into fields via the Lovable AI gateway, returning a structured job sheet the worker confirms.
- `src/components/field/WrapUpSheet.tsx` — completeness checks, outcome, payment, signature, review request, follow-up booking, all in one guided sheet.
- `src/components/field/PaymentStep.tsx` — records payment method and amount, writes to `invoicesStore`. Card links are a placeholder until a payment provider is enabled.
- `src/lib/visitSummary.ts` + `src/components/field/VisitSummary.tsx` — the customer-facing job story, shareable via the Web Share API.
- Extra work → `quotesStore` draft with photos attached; surfaced in Quotes and a new office "Opportunities from the field" list.
- `src/pages/field/MyDay.tsx` — current-job card, timeline with travel gaps, per-card Navigate/Call, running-late hint, day summary.
- `src/components/field/FieldLayout.tsx` — bottom tabs (My day / Job / Me) and the offline banner.
- `src/components/pipeline/SiteVisitSection.tsx` — multi-worker merge, outcome flags, payment, review status.
- Existing semantic tokens and mock data; no schema changes unless we later move field records to the backend.

## Suggested order

1. Per-worker records + offline banner + wrap-up sheet with outcomes and lock
2. One live job screen and the day timeline
3. Voice-to-job-sheet plus service templates and auto-labelled photos
4. Payment on site, review request, customer visit summary
5. Extra work → quote, follow-up booking, "Opportunities from the field"
6. "Me" tab and office-side merge
