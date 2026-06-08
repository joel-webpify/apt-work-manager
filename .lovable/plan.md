## Goal
Refresh the Contacts & Leads page (`/contacts`) using direction v2 — KPI cards, polished list, floating bulk action bar, and a redesigned tabbed contact panel. Pure UI/presentation work; no data model or store changes.

## What changes

### 1. Header KPI strip
Above the search/filter row, add 5 KPI tiles computed from the merged contacts list:
- Total contacts
- Leads (lifecycle = Lead)
- Customers (lifecycle = Customer)
- Lapsed (lifecycle = Lapsed)
- Lifetime value (sum of `totalSpend`, formatted £)

Style: rounded tile, hairline border, uppercase label, large tabular number. The LTV tile uses the primary accent.

### 2. Richer list rows
Replace the current dense grid with a proper `<table>`:
- Checkbox column (multi-select)
- Avatar (initials, deterministic color) + name + type subline
- Lifecycle pill (Customer / Lead / Lapsed)
- Tags column (Source + Type chips)
- Last activity (Last job date + service)
- Total spend (right-aligned, tabular)
- Hover row reveals quick actions: call (tel:), email (mailto:), new job (opens existing NewJobDialog prefilled with contact)
- Sortable columns: Name, Last activity, Total spend (click header to toggle asc/desc)

Selected rows get a subtle indigo tint + left accent border.

### 3. Floating bulk action bar
Appears centered at bottom when ≥1 row selected. Shows "N selected" + actions: Tag, Export CSV, Delete. Export downloads selected rows as CSV; Delete only removes imported contacts (mock contacts stay — they aren't user-owned). Tag opens a small popover to add a free-text tag stored alongside the contact (presentation only; stored in `contactsStore` extras map).

### 4. Polished empty state
When filtered list is empty: centered illustration block, headline, and two CTAs (Import CSV / New contact).

### 5. Redesigned contact side panel
Replace current panel with a wider (420px) panel:
- Header: large avatar tile, name, lifecycle subline, close button
- Quick action grid (4): Call, Email, Chat (placeholder), New Job (primary)
- Tabs: Overview / Jobs / Activity / Notes
  - Overview: contact info (phone, email, postcode, source, total spend)
  - Jobs: existing job history list (from `jobs` mock filtered by contactId)
  - Activity: timeline using mock events derived from jobs/quotes (Job completed, Quote accepted, Email sent, Note created) — purely visual, sourced from existing stores where possible
  - Notes: textarea (existing behavior)

## Files

- **edit** `src/pages/Contacts.tsx` — rewrite layout: KPI strip, sortable table with checkbox + avatars + hover actions, bulk bar, empty state, new tabbed panel
- **new** `src/components/contacts/ContactPanel.tsx` — extracted tabbed side panel
- **new** `src/components/contacts/ContactKpis.tsx` — KPI strip
- **new** `src/components/contacts/BulkActionsBar.tsx` — floating bottom bar
- **new** `src/lib/avatar.ts` — initials + deterministic color helper

## Out of scope
- No backend / Cloud migration
- No changes to lifecycle, quotes, invoices, jobs stores
- No changes to the left sidebar / app shell
- Tag persistence is local-only (presentation)
