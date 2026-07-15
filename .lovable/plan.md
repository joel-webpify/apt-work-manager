## Goal

Restructure the sidebar into clear sections and stage the buildout of Marketing (with GBP + social + ads), Automations, richer segmentation, and deeper Jobs + Forms functionality.

## New sidebar structure

```text
Dashboard

CRM
  Contacts & leads
  Jobs & pipeline
  Quotes & invoices
  Forms

Marketing            (hub page with tabs)
  ├─ Google Business Profile
  ├─ Social — Organic
  ├─ Social — Paid
  ├─ Email
  └─ Google Ads

Automations
  Workflows          (cross-module visual builder)
  Sequences         (link into Email sequences)

Analytics
  Reporting
  Tracking

Settings
```

Sidebar groups are collapsible with section labels. Email keeps its own deep page (accessible from Marketing tab and from Automations > Sequences). Google Ads keeps its dedicated page under the Marketing tab.

## Phase 1 — Menu restructure (ship first)

- Rewrite `src/components/layout/Sidebar.tsx` to render grouped sections with labels + collapsible groups.
- Add routes and placeholder pages:
  - `/marketing` (hub with tabs: GBP, Social Organic, Social Paid, Email, Ads)
  - `/marketing/gbp`, `/marketing/social-organic`, `/marketing/social-paid` (new)
  - `/marketing/email` and `/marketing/ads` re-mount existing Email + Ads pages
  - `/automations` (workflows list + builder shell)
  - `/automations/sequences` (email sequences list)
- Update `src/App.tsx` routes; keep legacy `/email` and `/ads` as redirects so nothing breaks.
- Marketing hub uses a top tab bar so switching channels feels instant.

## Phase 2 — Marketing buildout

- **Google Business Profile**: profile completeness, recent reviews list + reply drafts, posts scheduler, insights snapshot (calls, direction requests, searches). Mock data.
- **Social Organic**: connected accounts (FB, IG, LinkedIn), post composer with multi-account targeting, content calendar (month view), scheduled/published/drafts tabs, engagement summary.
- **Social Paid**: campaigns list (Meta + LinkedIn), spend / CPC / CTR / conversions, creative library, audience presets. Mirrors structure of Google Ads page for consistency.
- Marketing hub landing tab shows a cross-channel overview (spend, reach, leads generated per channel).

## Phase 3 — Automations + segmentation

- **Workflows (standalone)**: visual builder with trigger nodes (form submitted, contact tag added, pipeline stage changed, quote sent/accepted, GBP review received) → action nodes (send email, add tag, create task, move stage, send SMS placeholder, wait/delay, branch on condition).
- **Sequences (in Email)**: linear multi-step email drips reachable both from Email module and from Automations > Sequences.
- **Segmentation**: rewrite segments to be activity-driven filters composed from contact fields + events (form submissions, quote status, pipeline stage, last email open, GBP review left, tag membership). Live preview count. Reuse segment picker in workflow triggers and email sends.

## Phase 4 — Jobs & Pipeline expansion

- Configurable stages per pipeline; multiple pipelines.
- Job detail: milestones (existing) + tasks, scheduling (assignee + date range), attachments, notes timeline, linked contact + quote.
- Board filters (assignee, stage age, value), list view alternative, quick-add job dialog.

## Phase 5 — Forms expansion

- Conditional logic (show/hide field based on prior answer).
- Notifications (email on submit, per-form recipients).
- Auto-actions on submit (create contact, add tag, trigger workflow, assign to pipeline stage).
- Embed snippet + share link, submission export.

## Technical notes

- Sidebar sections rendered from a typed config array `{ label, items: NavItem[] }[]`; group headers use muted uppercase text; groups collapsible via local state persisted in `localStorage`.
- Marketing hub is a layout route with `<Outlet />`; tabs are `NavLink`s to child routes.
- New pages start with mock data in `src/data/` following the pattern of `mockData.ts`; no backend work in Phase 1–2.
- Workflow builder in Phase 3 uses a simple node/edge JSON model; renderer can be a lightweight custom canvas (no new deps) — evaluate `reactflow` only if the builder gets complex.
- Segments become a shared component `<SegmentBuilder />` used in Contacts, Email, and Automations.
- No Lovable Cloud yet — call it out when we reach automations/segmentation that would benefit from persistence.

## Deliverable for this turn

If approved, I'll implement **Phase 1** end-to-end (grouped sidebar + Marketing hub with tab shell + Automations shell + route redirects), and stub the new Marketing/Automations pages with clean empty states so the structure is usable immediately. Phases 2–5 then land in follow-up turns.
