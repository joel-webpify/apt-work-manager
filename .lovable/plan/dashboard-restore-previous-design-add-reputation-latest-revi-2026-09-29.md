# Dashboard: restore previous design, add reputation & latest reviews

## Goal
Bring back the dashboard design from just before the current one (the at-a-glance version with the status strip, "Needs attention" and "This week"), and extend it with a reputation area showing the Google rating and the latest reviews.

## What will change

### 1. Restore the previous dashboard
- Restore `src/pages/Dashboard.tsx` from the previous version in the file history (the at-a-glance design):
  - Header with **Dashboard** title and **New job**, **New contact**, **Send campaign** actions.
  - Five-card status strip: **Leads**, **Follow-up**, **Quotes**, **Cash**, **Reputation** — each with its coloured status dot, main figure, sub-line, and link to the relevant view.
  - **Needs attention** list (with the Mine / Everyone switch) next to **This week** schedule summary.
  - One-line active jobs summary with **Open boards** link.
  - Team row: unassigned jobs, weekly capacity, who is out today.
- No palette, typography, navigation, or backend changes.

### 2. Add reputation & latest reviews
- Keep the **Reputation** card in the status strip (rating, review count, new this month, unreplied count).
- Add a **Latest reviews** section below the main row:
  - Shows the 3–4 most recent Google reviews: reviewer name, star rating, how long ago, a short excerpt of the review text, and whether it has been replied to.
  - Unreplied reviews get a subtle "Reply" affordance; clicking a review (or the section header) opens the Google Business page (`/marketing/gbp`).
  - If Google Business is not connected, the section shows a quiet "Connect Google Business to see your reviews" state linking to the same page — no alert styling.

## Technical details
- Restore the file from git history (`git show b896646:src/pages/Dashboard.tsx`) as the base, then add the Latest reviews section.
- Reviews come from the existing `useGbp()` store (`gbp.reviews` with rating, text, daysAgo, reply) — no new data source.
- Semantic design tokens only; keep the existing shared controls.

## Verification
- Check the restored dashboard at desktop, the current preview size, and phone width: no overflow, no page errors.
- Confirm Latest reviews renders real review data, links to `/marketing/gbp`, and the not-connected state shows correctly.
- Confirm all restored links and quick actions still work.
