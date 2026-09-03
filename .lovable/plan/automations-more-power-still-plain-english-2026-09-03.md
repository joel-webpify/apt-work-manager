# Automations: more power, still plain English

Goal: make automations feel like a real workhorse — more things that can start them, more things they can do, ready-made recipes, and a way to check they work before switching them on.

## 1. Template gallery (biggest win)
Replace the "Coming next" placeholder on the Automations list with a **Start from a recipe** row of cards, e.g.:
- Chase a quote that has gone quiet (3 nudges)
- Ask for a Google review after a job is paid
- Missed call / new enquiry → text + email in 5 minutes
- Rebook annual service 11 months later
- Invoice overdue → reminder ladder (3, 7, 14 days)
- Win back customers quiet for 90 days

Picking one creates a fully built automation (trigger, filters, steps) and opens it, switched off, ready to tweak.

## 2. More ways an automation can start
Added triggers: appointment/visit booked, visit finished (field app), job won, job lost, review left with low rating (3 stars or less), photo/job sheet completed, extra work added on site, form abandoned part-way, contact replies to an email, payment received in part, recurring schedule (every week/month).

## 3. More things an automation can do
New steps:
- Send a text message (SMS)
- Send an internal reminder to the job owner
- Create or send a quote from a template
- Send an invoice / send a payment reminder
- Book or reschedule a visit
- Add contact to (or remove from) a segment/list
- Update a field on the contact or job (e.g. set source, set value)
- Add a note to the timeline
- Wait until a condition is true (e.g. wait until quote is accepted, max 7 days)
- Wait until a good time to send (business hours / specific weekday)
- Stop the automation (exit)
- Split test A/B (send half one email, half another)

## 4. Smarter conditions
- Condition groups with **all of / any of** instead of a flat AND list.
- More fields to filter on: job value, service type, area/postcode, contact labels, source/channel, days since last job, has an accepted quote, email opened/clicked.
- Per-step condition preview ("about 42 of your contacts match this right now" — estimated from existing mock data).

## 5. Safety and confidence
- **Test run**: pick a real contact/job and step through what would happen, no emails sent, shown as a timeline.
- **Quiet hours + limits**: don't send outside business hours; max one automated message per contact per day; auto-skip contacts who unsubscribed.
- **Re-enrolment rules** made explicit (once per contact / every time / once per job).
- Pre-activation checklist: warns about missing email content, empty steps, endless loops.

## 6. Better view of what happened
- Run history gets filters (all / worked / skipped / failed), a reason on each skipped run, and a per-step drop-off strip so you can see where people stop.
- Small stats header per automation: enrolled, finished, opened, clicked, jobs/revenue attributed.

## Technical notes
- Extend `src/lib/workflowsStore.ts`: new `WorkflowTrigger` / `WorkflowActionType` union members plus their meta labels, condition groups (`{ match: "all" | "any", conditions[] }`), settings block (quiet hours, throttle, re-enrolment), richer `WorkflowRun` (status incl. `skipped`, per-step log).
- New `src/lib/workflowTemplates.ts` with the recipe definitions; a `TemplateGallery` component rendered on `src/pages/automations/Workflows.tsx`.
- `src/pages/automations/WorkflowDetail.tsx`: extend the recursive step editor with the new step config panels, add tabs/sections for Settings, Test run, and Run history; keep the existing numbered "When this happens / Only if / Then do this" structure.
- New `src/components/automations/TestRunDialog.tsx` simulating a run against mock contacts/jobs from the existing stores.
- All behaviour stays front-end mock (localStorage) like today — no backend sending.

## Out of scope
Actually sending emails/SMS, visual drag canvas rewrite, and real attribution data.
