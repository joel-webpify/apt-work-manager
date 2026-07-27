## Goal

Turn Reports from six loosely related dashboards into one coherent section: a single date range, an Overview that answers "how is the business doing", and marketing reporting that covers every channel — not just Google Ads and email.

## New tab structure

Combine where the story is shared, split where the channel deserves depth:

```text
Reports
  Overview     new — whole-business snapshot
  Revenue      existing (money in, forecast, service mix)
  Pipeline     existing (stages, velocity, stuck jobs)
  Marketing    combined channel hub + per-channel drill-down
  Website      existing web/form behaviour
  Customers    existing
```

Marketing becomes a hub with a channel switcher inside it:
`All channels · Google Ads & LSA · Social ads · Social posts · Google Business · Email`.
"All channels" is a comparison table + spend/leads chart; picking a channel swaps in that channel's detail view (the existing Google Ads and Email reports move in here unchanged in substance).

## Global date range

A range control lives in the page header next to the weekly-digest toggle: `Last 30 days · Last 90 days · Year to date · Last 12 months`. Selected range is held in Reports page state, passed to every report, and reflected in the URL alongside the tab so a view can be shared. Existing per-card range toggles are removed so nothing contradicts the header.

## Overview tab (new)

- Six headline tiles: revenue won, jobs booked, new leads, marketing spend, blended cost per lead, website visits — each with a "vs previous period" delta.
- Where leads came from: one bar/donut split across all channels.
- Channel scorecard: one row per channel — spend, leads, cost per lead, jobs won, revenue, return on spend — with the best and worst performer called out in plain English.
- Trend strip: leads and revenue over the selected range.
- Three plain-English takeaways generated from the data (e.g. "Google Business sent you the cheapest leads this period").

## Channel coverage to add

- **Google Ads + LSA** — existing report, moved under Marketing.
- **Social ads** — spend, impressions, clicks, leads, cost per lead, revenue by campaign; per-platform split.
- **Social posts (organic)** — posts published, reach, engagement rate, link clicks, best-performing posts; sourced from the existing social posts store where possible, topped up with mock metrics.
- **Google Business Profile** — profile views, searches, calls, direction requests, website clicks, new reviews and average rating, trend over the range.
- **Email** — existing report, moved under Marketing.

## Technical notes

- New `src/lib/reportingData.ts`: a `DateRange` type, a shared channel dataset (spend/leads/revenue per channel per period), and helper functions for period comparison so every tab derives numbers from one place instead of local mock arrays.
- New components: `ReportRangePicker`, `OverviewReport`, `MarketingHubReport`, `SocialAdsReport`, `SocialOrganicReport`, `GoogleBusinessReport`.
- `src/pages/Reporting.tsx` owns tab + range state, syncs both to search params, renders the range picker, and passes `range` down.
- Existing reports (`RevenueReport`, `PipelineReport`, `WebsiteReport`, `CustomersReport`, `GoogleAdsReport`, `EmailMarketingReport`) gain a `range` prop and drop their internal range toggles; their internals otherwise stay intact.
- All data remains front-end mock data, consistent with the rest of the app — no backend work in this step.
- Existing `/reporting?tab=google ads` and `?tab=marketing` links redirect to the Marketing tab with the right channel selected.
