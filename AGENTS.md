# Project notes
- Organic Social is isolated under `/social` with React session state and pure scheduling/validation helpers; simulated posts and replies never write to real networks or legacy social stores.
- Meta Ads is isolated under `/meta-ads` with shared pure mock helpers and React session state; never connect its simulated actions to real advertising services or existing Google Ads stores.
- Business identity is stored separately from email drafts and read by email rendering; logo overrides use the existing src field, and required footer content uses existing footer fields so email schemas remain unchanged.
- All email text inputs share a caret-aware merge-field picker; unresolved tokens are decorated only in canvas rendering, never in saved content.

- Email editing uses a shared full-screen presentation shell; campaign content returns to its existing schedule/save flow, while automation editing only updates its existing subject/template fields so presentation changes do not introduce a new persistence model.

- The office schedule lives in `src/components/schedule/` (ScheduleView + DayView) and is used only by the `/schedule` page. The pipeline page has no schedule view — it deep-links into jobs via `/pipeline?job=<id>`.
- Travel time and smart-drop slotting come from `src/lib/travel.ts` (postcode-district heuristic, no map APIs). Dropping a job lands it in the first free slot with driving room; booking from the job card goes through `src/lib/booking.ts` (bookVisit/moveVisit/cancelVisit/suggestSlots), which wraps travel.ts so the card and schedule use the same slot rules.
- The schedule is board-blind: "unscheduled" means any job with no booked visits, regardless of stage name or pipeline, so renamed/custom boards always show up.
- Office-side field signals (live visit status, follow-ups to rebook, survey quotes ready to send) are derived in `src/lib/fieldLive.ts` from field records — never stored separately, so the schedule and field app cannot disagree.
- A shared visit is several `JobAssignment`s with the same job, date and start (optional `teamId` marks team bookings); schedule edits move the whole crew, Shift-drag moves one person. Teams live in `src/lib/teamsStore.ts`.
- The job-card booking dialog uses responsive desktop/mobile layouts in `BookingSchedulePreview` for an in-place day preview from the same job assignments; selecting a time only updates the booking form, so previewing never creates a visit.

- Email merge field catalog, trigger availability and record resolution live in one shared module; editor-only fallbacks use token syntax and preserve existing schemas. Resolve against existing stores and explicit event context, never invented secure links or unrelated records.
- WhatsApp is a mockup module at `/whatsapp` (Inbox, Campaigns, Templates, Results; components in `src/components/whatsapp/`): templates, conversations, consent and campaigns live in `src/lib/whatsappStore.ts` (localStorage) with no Meta calls, so the UI can be demoed before a real connection exists.
- WhatsApp audience selection uses a shared pure selector over merged contact records and extras; campaign counts come from matched records and consent checks, not segment scaling, so filters and recipient counts stay consistent.
