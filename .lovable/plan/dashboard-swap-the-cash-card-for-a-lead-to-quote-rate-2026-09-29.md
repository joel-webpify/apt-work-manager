# Dashboard: swap the Cash card for a lead-to-quote rate

## Goal
Remove the Cash card from the top health strip and replace it with a card showing how many new leads turn into quotes sent.

## What will change

### New "Lead to quote" card
The fifth card in the health strip becomes:

- **Main figure:** the percentage of new leads that have had a quote sent — e.g. "25%".
- **Secondary line:** "3 of 12 leads · last 30 days", so the percentage is never on its own.
- Leads counted = received in the last 30 days, spam excluded.
- A lead counts as quoted when a quote exists for the same customer with an issue date after the lead arrived.
- Quiet "Not enough data yet" when fewer than 5 leads fall in the window — no alarm styling, no fabricated trends.
- Clicks through to Reporting → Marketing (same destination as the Leads card), where lead sources and conversions live.

### Everything else stays
- The other four cards (Leads, Follow-up, Quotes, Reputation) are untouched.
- The overdue-invoice figure is not lost — it already appears in the "Needs attention" list ("Overdue invoices").
- Same palette, typography and layout. Needs attention, This week and Latest reviews unchanged.

## Technical details
- Edit `src/pages/Dashboard.tsx` only.
- Data already loaded: `leads` (receivedAt, status) and `useQuotes()` (issueDate, customer, status). No new data source.
- The lead-to-quote match is by customer name against the demo data — fine for the prototype, but a real build should link leads to contacts/jobs so the match is exact (worth adding to the developer brief).
- Semantic design tokens only; no colour or typography changes.

## Verification
- Card figures match the sample data (count a few leads by hand).
- "Not enough data yet" state shows when the window is thin.
- Desktop, the current preview size, and phone width: no overflow, no page errors.
- The card opens Reporting → Marketing.
