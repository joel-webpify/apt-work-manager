# Dashboard: replace Needs attention with a sales funnel card

## Goal
Replace the "Needs attention" card on the dashboard with a statistics card showing this month's sales funnel, while keeping the rest of the at-a-glance dashboard as it is.

## What will change

### Replace the Needs attention card with "This month" funnel
The left card in the main row becomes a sales funnel showing how work moved through the business this month:

- **New leads** — enquiries received this month
- **Quotes sent** — with a % of leads step (how many became quotes)
- **Jobs won** — quotes accepted this month, with a % win step
- **Paid** — money collected this month (GBP)

Visual: four steps with descending bars (a clean funnel look, not alert-style), each step showing its figure, its label, and the conversion percentage from the previous step. Steps link to the relevant view (leads → reporting marketing, quotes → quotes, won → reporting pipeline, paid → reporting revenue). Quiet "not enough data yet" text for steps with no activity this month — no alarm styling, and no fabricated trends.

- The header keeps a short plain-English subtitle (e.g. "How enquiries became money this month").
- The Mine/Everyone switch is dropped — the funnel is business-wide.
- A small "Full reports" link opens `/reporting`.

### Everything else stays
- The five status cards, This week schedule card, Latest reviews, active jobs line and team row are untouched.
- Same palette, typography, tokens and navigation.

## Technical details
- Edit `src/pages/Dashboard.tsx` only.
- Data already available: `leads` (receivedAt, ownerId), `useQuotes()` (issueDate, status, docTotals), `useInvoices()` (issueDate, paidDate, invoiceTotals). No new data source.
- This month = current calendar month, matching the existing Cash card logic.
- Semantic design tokens only; no colour or typography changes.

## Verification
- Desktop, the current preview size, and phone width: no overflow, no page errors.
- Funnel figures match the mock data (e.g. paid amount matches the Cash card this month).
- All four steps navigate to the right views.
