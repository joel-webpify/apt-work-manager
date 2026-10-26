# WhatsApp as its own module (mockup)

WhatsApp moves from a tab inside Email marketing into its own sidebar item. It stays a mockup: sample data only, nothing is sent to Meta.

## Sidebar and pages
New "WhatsApp" item under Marketing with four tabs:
1. **Inbox** - customer replies grouped by contact, a 24-hour reply window ("free reply until 14:32"), quick replies, and links to the contact and job. Seeded with sample conversations.
2. **Campaigns** - list plus a step-by-step setup: audience (segment + filters such as last job, tags, postcode), template, filling in details per customer, schedule or send now, consent check showing who gets skipped and why, and an estimated cost.
3. **Templates** - list with status, category, language and last used. Opens the full-screen editor.
4. **Results** - sent, delivered, read, replied, failed and skipped, per campaign and per template, plus the most common skip reasons.

Settings → WhatsApp keeps only the connection card and links to the new module. The WhatsApp tab in Email marketing is removed.

## Full-screen template editor
Reuses the email editor shell (back arrow, name, autosave status, undo/redo, "Preview as" contact, Save).
- Left: building blocks for Header (none, text, image, document, video), Body, Footer, Buttons (quick reply, link, call; max 3 / per WhatsApp rules).
- Centre: phone preview with WhatsApp-style chat bubble, rendering real contact values.
- Right: category (Booking update / Marketing), language, and a mapping of variables to merge fields using the same Insert field picker as email (`{{1}}` = first_name, and so on).
- Live checks: body length (1024), variable rules (no variables next to each other, not at start/end), button limits. "Submit for review" sets the status to pending, and a demo toggle can approve it.

## Automations
The "Send a WhatsApp message" step shows the phone preview and the variable mapping, and links to "Edit template".

## Technical details
- New route `/whatsapp` and `src/pages/WhatsApp.tsx`; components in `src/components/whatsapp/` (Inbox, CampaignWizard, TemplatesList, TemplateEditor, Results, PhonePreview).
- `whatsappStore.ts` gets: richer `WaTemplate` (header, footer, buttons, varMap); conversations/messages with direction and timestamps; per-campaign stats; and a `validateTemplate()` function. Old saved templates are converted on load (key bumped to v2).
- TemplateEditor wraps `EmailEditorPage` and gets merge-field values from `emailMergeFields`.
- Tests for validateTemplate rules, the 24h window, and campaign skip counting.
- Update the project notes about the WhatsApp mockup.
