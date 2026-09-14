# Streamline the opened job panel

## Direction

Use the selected **Essential overview focus** design with the clear-blue palette and friendly Outfit/Figtree typography. Keep the pipeline board cards compact; this change focuses on the opened job panel.

## New panel structure

- Give the panel a clearer header with customer, service, pipeline/stage controls and close action.
- Keep the next step directly beneath the header so the most important action is always visible.
- Replace the long single scroll with four focused tabs:
  - **Overview** — essential job information, milestone progress, recent note and site-visit status.
  - **Details** — editable trade, estimated hours, address, postcode and custom fields.
  - **Costs** — job value, quote status/value, materials, catalogue services, logged time, total cost, profit and margin.
  - **Activity** — notes and communication timeline.
- Preserve automatic handover controls and keep them visible near the stage controls when relevant.

## Remove repetition

- Remove the separate **Value** and **Quote** inputs from general job details.
- Show all money information only in the Costs tab, using the existing cost breakdown as the single source of truth.
- Keep estimated hours in Details because it describes planned work rather than financial performance.
- Replace repeated headings and large empty states with compact rows, counts and status summaries.

## Overview content

- Show customer and service as the main title area.
- Add a compact essential-information block for address, trade and estimated hours.
- Show milestone completion as a slim progress summary with the next incomplete milestone.
- Summarise site-visit readiness and the latest note without expanding the full content.
- Provide clear links into the relevant tab for full details rather than repeating them.

## Interaction and visual treatment

- Keep each tab’s state while the panel remains open.
- Use restrained blue emphasis for active tabs, next actions and editable links.
- Use subtle transitions for tab changes and expandable content, respecting reduced-motion settings.
- Keep all current editing, milestone, survey, materials, labour-source and communication behaviour working.
- Ensure the panel remains usable at narrower desktop widths without covering essential controls.

## Technical notes

- Refactor the job drawer in `src/pages/Pipeline.tsx` into small tab-content sections while reusing the existing editors and stores.
- Update `JobCostsCard` presentation only as needed to fit the dedicated Costs tab; retain its existing calculations and labour-source choice.
- Add the locked palette and typography as semantic global tokens rather than hardcoded component colours.
- Load Outfit and Figtree through the document head, not a CSS URL import.
- Verify tab navigation, editing, stage movement, milestones, cost totals and the panel at desktop and narrower widths.
