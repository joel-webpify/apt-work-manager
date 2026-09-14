# Costs, labour and profit in Reports

Reports currently only talk about money coming in. Now that jobs carry materials at cost, catalogue services and logged hours, the same numbers can show what you actually keep — and what to expect from the work still in the pipeline.

Only real figures count. A job with nothing recorded is left out of the profit numbers and counted in a "still to be costed" note, so nothing is invented.

## Revenue tab

- **Two new headline tiles** beside the existing four: **Costs so far** and **Profit** (with margin underneath).
- **A costed-work strip** under the tiles: how many won jobs have costs recorded, how many don't, and the total value still uncosted — so you know how much of the picture is real.
- **Profit split card** replacing nothing, added under the month chart: materials, work from the catalogue or logged time, and what's left as profit, as one stacked bar with figures.
- **Margin column** added to the existing breakdowns:
  - Revenue by service — each row gains cost and margin
  - Where your work comes from (by area) — margin per area
  - Customers who spend the most — margin per customer
- **Expected profit** added to the month chart footer: the forecast revenue carried at the margin your costed jobs actually achieve, so the forecast is money kept, not just money in.

## Pipeline tab

The pipeline value tiles gain an **expected profit** line: open work valued at your achieved margin, so a busy pipeline that isn't profitable is visible early.

## Overview tab

The business tiles gain **profit** and **margin** next to revenue, both linking through to the Revenue tab.

## Job costs card

Small addition only: a one-line comparison against your average margin ("6 points below your usual 34%"), so a thin job stands out while you're looking at it.

## Technical notes

- New `src/lib/costReporting.ts`: reads `getMaterials` per job from `materialsStore`, logged minutes via `fieldStore`'s `timeOnSiteMinutes`, labour rate from `surveysStore`, and the job's quote total, then reuses `jobCosts` and `getLabourSource` per job so the report agrees exactly with `JobCostsCard`. Exports `jobCostRows(jobs)`, `costTotals(rows)` (revenue, materials, labour, cost, profit, margin, costedCount, uncostedCount, uncostedValue) and `groupCosts(rows, keyFn)` for service/area/customer rollups. A `useCostReporting()` hook subscribes to the materials store so figures refresh live.
- `RevenueReport.tsx`: consume the hook; add the two tiles, the costed-work strip, the profit split bar; extend the service/area/customer rows with cost and margin; add expected profit to the chart footer using `costTotals().margin`.
- `PipelineReport.tsx`: add an expected-profit sub-line to the value tiles from the same margin.
- `OverviewReport.tsx`: add profit/margin tiles.
- `JobCostsCard.tsx`: one comparison line against the portfolio margin.
- Existing revenue derivations, ranges and layout stay as they are. Still local/mock data, no backend change.
