# Dashboard redesign: modern at-a-glance grid

## Goal
Replace the static overview with the selected modern bento dashboard, keeping the current clear-blue colour scheme, Outfit/Figtree typography, left menu and plain-English labels.

## What will change

### 1. Action-led first view
- Keep **New job**, **New contact** and **Send campaign** in the header and connect them to their existing flows.
- Lead with **Today’s work**, showing the next scheduled visits, times, assignees and a link to the full field schedule.
- Add two small attention cards:
  - **Overdue actions** from unfinished job-plan steps past their due date.
  - **Unassigned jobs** from work with no assigned person, linking to the relevant jobs.

### 2. Useful business totals
- Replace fixed example figures with values from the current jobs and quotes.
- Show **revenue**, **open quotes**, **conversion**, and **expected profit** where recorded costs make that possible.
- Clearly label incomplete cost coverage rather than estimating missing costs.

### 3. Flexible pipeline summary
- Use the app’s current flexible pipeline boards instead of the old fixed stage list.
- Show the most useful stages with job counts and values, with a clear route into the selected board.
- Keep the card compact enough that the rest of the daily picture remains visible.

### 4. Follow-ups and activity
- Add **Quotes to follow up**, prioritising sent quotes that have waited longest.
- Keep a compact **Recent activity** list using actual job events and status changes available in the current browser data.
- Keep **Lead sources** as a small supporting card rather than the main focus.

### 5. Layout and behaviour
- Match the selected composition: a four-column bento grid on desktop, with Today’s work and Pipeline receiving the most space.
- Stack cards into a clear single-column order on smaller screens, with attention items before reporting totals.
- Use the existing design tokens and shared buttons; no new colour or typography system.
- Make actionable cards open the relevant job, quote, pipeline or schedule view.

## Technical details
- Update the existing dashboard page only, with small dashboard-specific helpers if needed.
- Read jobs and quotes through their live browser stores so changes elsewhere appear immediately.
- Read flexible pipeline definitions through the current pipeline store.
- Reuse the existing cost-reporting calculations for profit and cost coverage.
- Avoid adding new backend storage or changing business logic elsewhere.

## Verification
- Check desktop and phone layouts for overflow, clipping and readable priority order.
- Confirm dashboard totals react to locally added or updated jobs and quotes.
- Confirm every dashboard action and drill-in opens the intended screen.
