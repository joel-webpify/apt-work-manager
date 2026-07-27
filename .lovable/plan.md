## Goal

Replace the static "Revenue health" ratio card in Reporting → Revenue with an **interactive cash flow forecast**, topped by a **lead velocity** indicator as the forward-looking growth signal.

## What replaces it

The card sits in the right column (`col-span-2`) next to AR aging.

```text
┌──────────────────────────────┐
│ Cash flow forecast    [4w|8w]│
│ £6,120 expected in            │
│                               │
│ Lead velocity  +18% WoW  ▲    │
│ 13 new enquiries this week    │
│ ───────────────────────────── │
│ Week of 3 Aug   £1,840  ▓▓░   │
│   • INV-1104 Baker  £420  →   │
│   • Job booked Hall £600  →   │
│ Week of 10 Aug  £2,310  ▓▓▓░  │
│ ...                           │
│ ───────────────────────────── │
│ Net position end of period    │
└──────────────────────────────┘
```

### Cash flow forecast
- Buckets expected cash inflow by week for the next 4 or 8 weeks (toggle).
- Sources of expected inflow, derived from existing stores:
  - Sent/overdue invoices → expected on due date (overdue ones weighted by collection likelihood).
  - Jobs in "Completed"/"Invoiced" → expected on invoice due date.
  - Jobs in "Job booked"/"In progress" → expected value on scheduled date + payment lag.
  - Quotes in "Sent" → weighted by acceptance rate, shown as a lighter "at risk" portion of each bar.
- Each week row expands to list the individual invoices/jobs making up the amount, with confidence (confirmed vs expected).
- Footer shows total expected in over the window and the largest single week.

### Lead velocity
- Compact strip at the top: week-over-week % change in new enquiries (contacts/jobs created this week vs last), with direction arrow, colored via success/warning tokens, and a small 8-week sparkline.
- Tooltip/subline gives the raw counts so the % is readable.

### Interactivity
- 4w / 8w window toggle.
- Click a week row to expand its line items.
- Click a line item to open the linked invoice or job (navigates to `/quotes` or `/pipeline` with the record focused, matching how other reporting rows link out).
- Hovering a bar highlights the corresponding rows.

## Technical notes

- Edit `src/components/reporting/RevenueReport.tsx`: remove the "Revenue health" block and the now-unused `HealthRow` component; add a new `CashFlowForecast` component in `src/components/reporting/CashFlowForecast.tsx` to keep the file manageable.
- Data comes from the existing stores — `invoicesStore`, `jobsStore`, `quotesStore`, plus `contacts` from `mockData` for enquiry dates. No backend work; forecast math lives in a small pure helper (`src/lib/cashFlow.ts`) so it's testable.
- Where mock data lacks real dates (created-at for contacts, scheduled dates for some jobs), derive deterministic pseudo-dates from existing fields such as `daysInStage` rather than random values, so the chart is stable across renders.
- Styling reuses existing tokens and the `Pill` / bar patterns already in the report — no new colors, no new dependencies.

## Out of scope

The other Revenue tab cards (headline KPIs, MoM chart, service/segment/source mixes, AR aging, top customers) stay as-is.
