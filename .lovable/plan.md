# Quotes customers can tailor

Let customers pick between alternatives and tick on extras, then lock the quote to what they chose.

## What the customer sees

A shareable link (`/quote/Q-2041`) opens a clean, branded quote page — no login, no sidebar:

- **Core work** — the fixed lines, always included.
- **Choose an option** — where you offered alternatives (e.g. Boiler A vs Boiler B), radio buttons with the price difference shown next to each ("+£240"). One must be picked.
- **Optional extras** — tick boxes (e.g. extra radiator, 5-year warranty), each with its own price.
- A **live total** that updates as they tick, plus notes and terms.
- **Accept quote** button with a name field for sign-off, or **Ask a question**.

On accept, the quote locks to their selection: only the chosen option and ticked extras remain as line items, the total becomes the quote value, and the job/invoice that follows uses that figure.

## What you see in the builder

Each line item gets a **type** setting:

- **Included** (default, today's behaviour)
- **Choice** — belongs to a choice group. You name the group ("Boiler") and add 2+ alternatives; the cheapest is marked as the default so the quote total has a baseline.
- **Optional extra** — with a "pre-ticked by default" toggle.

Grouped lines are shown nested under a group header in the builder, with an "Add alternative" button. Totals in the builder reflect the current defaults, and a small note says "Customer can change this".

On the quotes list and in the internal preview:
- A "Customer choices" badge on any quote with options.
- Once accepted, a panel showing exactly what they picked, when, and the name they signed with.
- A **Copy customer link** action next to Send.

## Technical notes

- `QuoteLineItem` gains `kind?: "included" | "choice" | "optional"`, `groupId?`, `groupLabel?`, `defaultSelected?`. Existing items with no `kind` behave as included, so current quotes and invoices are unaffected.
- `Quote` gains `selection?: { chosen: Record<groupId, itemId>; extras: string[]; acceptedBy?: string; acceptedAt?: string }`.
- `src/lib/quoteUtils.ts` gets `resolveItems(quote, selection)` returning the effective line list; `totals()` then runs on that list. Every consumer (builder, preview, invoice conversion, quote value) reads through it, so one place decides what counts.
- New public page `src/pages/PublicQuote.tsx` at `/quote/:id`, outside `AppLayout`, reading via `findQuote` from `quotesStore`. Accepting writes the selection back with `updateQuote` and reuses the existing `acceptQuote` lifecycle helper so the job/invoice value follows the locked total.
- Because quotes live in browser storage (mock data), the link only resolves in the same browser — it demonstrates the customer experience rather than sending to a real customer.
- Builder changes in `QuoteBuilderDialog.tsx`; internal preview and selection summary in `QuotePreviewDialog.tsx`; list badge and copy-link action in `src/pages/Quotes.tsx`.
