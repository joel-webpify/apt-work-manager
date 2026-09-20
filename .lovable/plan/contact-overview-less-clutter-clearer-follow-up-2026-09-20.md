# Contact overview: less clutter, clearer follow-up

## What will change

### Header and quick actions
- Keep the existing avatar, name, lifecycle/type controls, and header structure.
- Use four actions: **Email**, **Call**, **Chat**, and **New Project**.
- Email and Call use the contact’s saved details; Chat shows a disabled-state tooltip when no SMS-capable number is available.
- Make the Residential/Commercial control visibly editable with a clearer border and chevron.
- Replace the empty tag dash with **No tags yet**, while keeping tag creation available.

### Action strip
Add one compact row between the quick actions and the tabs:

`Score 55/100 · Owner Unassigned · Next action None set`

- **Score** opens a small popover with the factor breakdown rather than occupying a permanent card.
- Build score factors from recorded contact activity such as a submitted quote or completed job, so the explanation matches the number shown.
- **Owner** opens an employee picker using the existing team list.
- **Next action** opens a compact editor for its note and optional due date.

### Overview tab
Replace the current loose field list with an **Overview** section showing only:
- Phone
- Email, truncated when needed, with a copy button and confirmation
- Last activity as relative time plus full date and time
- Total spend

Last activity will use the newest dated activity actually recorded for the contact across jobs and quotes. Generated demo timeline events will not be treated as genuine activity.

Add **More details**, collapsed by default, containing:
- Location
- Record source
- Lead since
- Last job in pipeline

Keep products purchased below this disclosure when products exist. Do not show a separate Traffic channel row.

### Traffic attribution
- Add the existing-style attribution summary once, below the contact details, with no duplicate source row elsewhere.
- Sanitize displayed attribution so localhost, loopback IPs, preview hosts, and other internal/test origins appear as **Direct / unknown** rather than leaking technical values.
- Add a tooltip to **TAGGED** explaining whether the source was manually assigned or automatically captured.
- Because contacts are currently browser-only and the Cloud database has no contact tables, this pass can harden the displayed demo data but cannot audit a separate production attribution store.

### Consent and email automations
- Add an inline-editable **Marketing consent** row with **Opted in**, **Opted out**, and **Not set**.
- Add an **Email Automations** section using the existing active automations.
- Keep the empty copy: “This contact has not been enrolled in any automations yet.” and add **Browse automations →**.
- Add an enrollment picker in the panel. Enrollment is blocked unless consent is **Opted in**, with a clear inline reason and a direct way to set consent.
- Show enrolled automations with a remove action; this records demo enrollment only and does not execute sends.

## Data and behavior
- Extend the browser-saved contact metadata with owner, next-action note/date, marketing consent, automation enrollment IDs, and attribution tagging mode.
- Keep all new values in the existing contact browser storage, as requested; no backend migration.
- Ensure inline edits immediately refresh the open panel instead of displaying the stale contact passed in when it was opened.
- Keep imported and seeded contacts compatible when the new optional fields are absent.

## Verification
- Check the panel at narrow and desktop widths for truncation and above-the-fold density.
- Verify score popover, owner and next-action editing, copy email, More details, consent states, enrollment blocking/success/removal, tooltips, and all four quick actions.
- Confirm internal attribution values never render and existing Contacts search, tags, jobs, activity, notes, and edit dialog still work.
