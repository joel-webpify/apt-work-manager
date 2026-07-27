## Goal

Make the system feel obvious to a non-technical service business (trades, installers, local services) without removing any capability. Navigation structure, routes and features stay exactly as they are. This is a language, defaults and progressive-disclosure pass.

## Principles

1. Name things the way a business owner talks: "enquiry", "job", "customer", "reminder" — not "lead object", "entity", "payload".
2. Every screen answers "what is this for?" in one line before it shows controls.
3. Show the 3 things people use every time; put the rest behind an "Advanced" disclosure that is closed by default.
4. Pick a good default instead of asking a question the user can't answer.

## Where to apply it

**Sidebar labels** (`src/components/layout/Sidebar.tsx`) — copy only, same order and links:
- "Social — Organic" / "Social — Paid" → "Social posts" / "Social ads"
- "Automations → Workflows / Sequences" → "Automations → Automations / Email follow-ups"
- "Tracking" → "Website tracking"
- Group heading "Analytics" → "Reports"

**Tracking** (`src/pages/Tracking.tsx`, `src/lib/trackingData.ts`)
- Show friendly event names in the UI with the technical key as small secondary text: "Visited a page" (`session_start`), "Saw a form" (`form_view`), "Started filling it in" (`form_start`), "Completed a field" (`field_complete`), "Sent the form" (`form_submit`).
- Install tab: lead with "Copy this snippet and paste it into your website before `</head>`" plus a one-line "Not sure? Send this to whoever manages your website" and a copy-to-email/copy-link action. Keep the code block, drop the surrounding technical explanation.
- Event catalog: describe each event in a sentence rather than a schema.

**Automations** (`src/pages/automations/WorkflowDetail.tsx`)
- Header the three parts as "When this happens" / "Only if" / "Then do this" instead of Trigger / Filters / Actions.
- Move `Webhook`, re-enrollment rules and goal settings into a closed "Advanced" section; keep email, wait, tag, task, job and stage actions up front.
- Default new automations to "run once per contact" so the user never has to reason about re-enrollment.

**Forms** (`src/pages/Forms.tsx`, `FieldMappingDialog.tsx`)
- "Field mapping" → "Where answers are saved", with one-line helper text and auto-matching applied by default so the dialog usually just needs confirming.

**Reporting** (`src/pages/Reporting.tsx` and report components)
- Expand abbreviations in labels: "WoW" → "vs last week", "View→submit" → "Filled in after seeing the form".
- Add a single plain-English takeaway line at the top of each report card (e.g. "Enquiries are up 12% on last week") so the numbers are interpreted for the user.
- Keep tab names as-is; rename the "Website" tab content headings to everyday terms ("Where visitors come from", "Most-visited pages", "Where people give up on the form").

**Global consistency**
- One vocabulary sheet applied everywhere: enquiry, customer, job, quote, invoice, automation, follow-up, form.
- Empty states get "what this is + one button" instead of a blank panel.
- Tooltips only for genuinely unavoidable terms (UTM, webhook).

## Technical notes

Changes are confined to presentation: label strings, helper copy, default values on new-record creation, and wrapping existing advanced controls in the existing collapsible primitive. Data models, stores (`workflowsStore`, `socialPostsStore`, `trackingData`), routes and business logic are untouched, so nothing breaks and no migration is needed. Technical event keys stay intact in the data layer and are still visible as secondary text where developers need them.

## Suggested order

1. Vocabulary pass across sidebar + page titles (fast, highest visible impact)
2. Tracking events + install tab
3. Automations builder wording + Advanced grouping + defaults
4. Reporting labels and takeaway lines
5. Forms mapping wording and auto-match default
