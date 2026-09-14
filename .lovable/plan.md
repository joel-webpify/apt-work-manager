# Job costs: materials, services and time in one place

Yes — the new product/service split feeds straight into the cost breakdown on an open job. Today that panel shows one lump of "materials cost" plus labour worked out from time logged. It doesn't know the difference between a fitted radiator and two hours of labour, and services picked from the catalogue land in the materials list.

## What the breakdown becomes

Three cost blocks instead of one:

- **Materials** — products used on site, at your cost price
- **Services** — labour, visits and callouts picked from the catalogue, at your cost per hour/visit/day
- **Time logged** — hours the worker actually recorded, at your labour rate

Then the summary tiles: job value, total cost, profit, margin — same as now, with total cost being the three blocks added up.

## Avoiding double counting

Logged time and catalogue services can describe the same work, so the panel offers a choice for the labour side:

- **Use time logged** (default) — recorded hours priced at your labour rate; catalogue services shown for reference but not added to the total
- **Use catalogue services** — priced service lines count, logged hours shown for reference

A single toggle at the top of the labour block, remembered per job. Whichever is unused is greyed with its value in brackets, so you can see the gap between what you planned and what actually happened.

## On site

When the worker adds something on a job, the picker now separates **Products** and **Services**. Picking a service defaults its quantity to its typical time on site (e.g. 1 pump, or 2 hours labour) and its unit to hours/visit/day rather than "each".

## Lists

Under the tiles, two short lists rather than one: materials used, and services used — each with quantity, your cost, and what the customer is charged. Chargeable items still carry through to billing exactly as they do now.

## Technical notes

- `src/lib/materialsStore.ts`: derive `kind` from the linked catalogue product (`kindOf`, missing → product) and store it on `JobMaterial` when added; split `materialsCost` into `productsCost` / `servicesCost`; extend `jobCosts` to return `products`, `services`, `loggedLabour` and accept a `labourSource: "time" | "services"`.
- `src/components/pipeline/JobCostsCard.tsx`: three cost blocks, labour-source toggle (persisted in localStorage keyed by job id), tiles recalculated from the chosen source, two `MaterialsList` sections filtered by kind.
- `src/components/field/MaterialsList.tsx`: kind filter tabs in the catalogue picker; service picks default qty from `typicalHours` and unit from the product.
- No backend change; still local/mock data.
