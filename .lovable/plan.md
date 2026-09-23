# Improving the forms

Four gaps in the forms area today, and what to do about each.

## 1. Forms don't stick around

Anything you build in the form builder lives only in the current screen — a refresh puts the demo forms back. Fix: save forms in the browser the same way jobs, contacts and boards already are, so your forms, questions, products, booking and design settings persist.

Also on each form card:
- Live / Paused switch (today every card just says "Live")
- Duplicate, so a new form can start from an existing one
- Delete, with a confirm step
- Search and a trade filter once there are more than a handful

## 2. The shared link opens nothing

The Embed box hands out a link and an embed snippet, but that address isn't a real page — so the link is dead. Fix: build a real public form page that opens from that link, with:
- Your form's colours, header style and questions
- Step-by-step flow, product choices, booking slot and instant quote where the form has them
- A thank-you screen after sending
- The sent answers appearing in Recent submissions, so the whole flow can be tested end to end

## 3. Questions could be smarter

Add to the builder:
- Show a question only when an earlier answer matches (for example only ask "How many radiators?" if they picked Heating)
- File / photo upload question, so customers can send pictures of the job
- Address and postcode question with tidier formatting
- Proper checks per question (real email, phone shape, number ranges, min/max length) with plain-English error messages
- Required-question warnings shown in the builder before a form goes live

## 4. Results per form

Each form gets its own results view: views, starts, sends, send rate, the question where people give up most, and which channels the visitors came from — reusing the tracking events already collected. A "Results" button on each form card opens it.

## After someone sends a form

Per form, a choice of what happens next: leave it in the list (today's behaviour), or create the enquiry automatically using that form's field mapping. Default stays as it is now so nothing changes unexpectedly.

## Technical notes

- New `src/lib/formsStore.ts`: `FormRecord` (builder form + tracking, design, status, autoCreateJob), localStorage key `forms-v1`, seeded from `mockData.forms` on first load, `useForms()` hook plus add/update/duplicate/remove/setStatus.
- New `src/lib/formSubmissionsStore.ts`: submissions seeded from `formSubmissions`, `addSubmission()` used by the public page; `Forms.tsx` reads from the store instead of the mock array.
- New route `/f/:formId` (public, outside the app shell) rendering a shared `PublicForm` component; `EmbedDialog` link/iframe URLs switch to that path via `shareLinks.ts` so they open correctly from preview and published hosts.
- `FormBuilderDialog`: `BuilderField` gains `showIf?: { fieldId, equals }`, `validation?`, and `FieldType` gains `"file"` and `"address"`; builder preview and the public page share one field renderer so they can't drift.
- New `FormResultsDialog` built on the existing tracking helpers (`form_view`, `form_start`, `field_complete`, `form_submit`, field drop-off) filtered by form id.
- Everything stays browser-local — no cloud storage, no real email sending.

## Order of work

1. Forms + submissions storage, card actions (status, duplicate, delete, search)
2. Public form page and working embed/share links
3. Conditional questions, upload/address types, validation
4. Per-form results view and the auto-create-enquiry setting
