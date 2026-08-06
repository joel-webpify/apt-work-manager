# Bring Service Flow's revenue sections into Reports → Revenue

Add two cards from the Service Flow project's revenue report into this project's Revenue tab, keeping the current plain-English wording and the shared date range.

## What gets added

A new row placed under "Revenue by service / Residential vs Commercial / Revenue by source", split 3/2:

**1. Revenue by area (left, wider)**
- Won revenue grouped by postcode district (BS8, BS1, BA2, …), top 6 shown as ranked bars.
- Sub-line: number of areas and total won revenue.
- Takeaway line: "BS8 is your strongest area with £X in won revenue."

**2. Repeat vs new customers (right)**
- One slim split bar showing repeat share vs one-off share.
- Two tiles: repeat revenue and one-off revenue, each with % of revenue and customer count.
- Two footer rows: average spend per repeat customer, average spend per one-off customer.

Repeat = a customer with more than one won job; one-off = exactly one.

## Wording

Card titles kept plain-English to match the rest of this project: "Where your work comes from (by area)" and "Repeat vs new customers", with the existing helper sentence "How much of your revenue comes from customers who booked more than once".

## Technical notes

- Single file change: `src/components/reporting/RevenueReport.tsx`.
- Data derives from the existing `jobs` and `contacts` mock data — `job.postcode` (falling back to the contact's postcode) and `contactId` grouping over the existing `wonStages` filter. No new data files or backend work.
- Adds small local helpers (`MiniRow`) and the `Repeat` / `MapPin` icons; reuses existing `Pill`, `fmtGbp`, and the hairline/card token classes so styling matches.
- Existing cards (KPIs, monthly trend, money owed, top customers, pipeline tiles) stay as they are.
