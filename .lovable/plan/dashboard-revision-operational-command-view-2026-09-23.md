# Dashboard revision: operational command view

## Goal
Make the dashboard feel more considered and useful without changing the existing colours or Outfit/Figtree typography. Replace the equal-card grid with the selected command-centre hierarchy, using real job, quote, invoice and pipeline data only.

## What will change

### 1. Stronger dashboard structure
- Keep the existing **Dashboard** title and **New job**, **New contact**, and **Send campaign** actions.
- Replace the patchwork of similarly weighted cards with three clear levels:
  1. a dominant **Today’s work** area,
  2. a compact business pulse,
  3. supporting work queues and activity.
- Use fewer borders, more deliberate spacing, aligned rows, and restrained depth so the page feels polished rather than like a collection of tiles.

### 2. Today’s work as the main command area
- Show today’s scheduled visits as a timeline with time, customer, service, assigned worker, and a direct route to the job.
- Give the empty state useful context and a clear route to the schedule without making it look like a warning.
- Keep normal work needing organisation—overdue next steps, unassigned jobs, and quotes to follow up—in a compact **Work to organise** list.
- Do not add notifications, alerts, alert badges, or system-health language.

### 3. Compact business pulse
- Present **Revenue this month**, **Open quote value**, **Quote conversion**, and **Expected profit** in one disciplined metric strip instead of separate floating cards.
- Continue using current stored figures and clearly state profit coverage when some jobs have no recorded costs.
- Keep each figure linked to the relevant report or quote view.

### 4. Pipeline view that scales
- Replace the current all-boards-and-stages summary with a scalable **Pipeline overview**.
- Add a board selector that supports any number of pipelines and shows the chosen board’s stage distribution, job count, and value.
- Add a compact all-board comparison alongside it, showing one row per pipeline with total jobs and value rather than every stage for every board.
- Preserve each pipeline’s configured name, icon, and colour; clicking a board opens that pipeline.
- Ensure five or more boards remain readable through wrapping or horizontal scrolling rather than expanding the dashboard vertically without limit.

### 5. Supporting context
- Keep **Recent activity** as a concise ledger-style list.
- Remove the separate dark Lead sources card from the main operational view; lead-source analysis remains available in Reports.
- Avoid invented trends, comparisons, reach figures, or “live system” states that the current data cannot support.

## Technical details
- Revise the existing dashboard page and reuse the current job, quote, invoice, cost, contact and pipeline stores.
- Keep browser-local behaviour and all existing quick-action dialogs.
- Use semantic design tokens and the existing shared controls; no palette, typography, backend, or navigation changes.
- Maintain direct links into schedules, jobs, quotes, reports, and selected pipeline boards.

## Verification
- Test with the current two boards and with at least five configured boards.
- Check desktop, the current mid-size preview, and phone layouts for readable hierarchy, scrolling, clipping, and overflow.
- Confirm all totals still update from local data and every action opens the intended view.
- Confirm the dashboard contains no alert or system-health presentation.
