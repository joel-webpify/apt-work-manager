# Products vs services in your catalogue

Right now every catalogue entry uses the same form, so a fitted radiator and an hour of labour ask for the same things. Add a simple toggle at the top of the form that switches between **Product** and **Service**, and show only the fields that make sense for each.

## The toggle

Two buttons at the top of the new/edit form:

- **Product** — something you supply (materials, parts, units)
- **Service** — work you do (visits, labour, hourly work)

Switching also sets sensible defaults: a product defaults to "per each", a service to "per hour".

## What each one shows

Shared by both: name, description, photo, trade, price, cost to you, tax %, active toggle.

Product only:
- Quantity in stock (optional)
- SKU / product code
- Supplier (optional, free text)

Service only:
- Unit is limited to hour, day, visit, sqm, m
- Typical time on site (optional, in hours) — helps size up jobs
- Whether materials are usually charged on top (yes/no note shown on quotes)

## In the list

- A small Product / Service label on each row
- Filter buttons above the list: All / Products / Services, alongside the existing trade filter
- Stock and SKU columns stay blank for services rather than showing dashes everywhere

## Elsewhere

The quote catalogue picker gets the same All / Products / Services filter, so picking "2 hours labour" versus "1 pump" is quicker.

## Technical notes

- Add `kind?: "product" | "service"` plus `supplier?`, `typicalHours?`, `materialsExtra?` to `Product` in `src/data/mockData.ts`; seed existing entries so labour/visit-style items are services. Treat a missing `kind` as product for older saved rows.
- `src/components/forms/ProductsTab.tsx`: toggle group in the dialog, conditional field blocks, kind filter state, kind badge column, grid column widths adjusted.
- `src/components/quotes/ProductPickerDialog.tsx`: add the kind filter next to the trade filter.
- No backend change; the catalogue stays in the existing mock/local data.
