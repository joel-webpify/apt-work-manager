# Project notes

- The office schedule lives in `src/components/schedule/` (ScheduleView + DayView) and is used only by the `/schedule` page. The pipeline page has no schedule view — it deep-links into jobs via `/pipeline?job=<id>`.
- Travel time and smart-drop slotting come from `src/lib/travel.ts` (postcode-district heuristic, no map APIs). Dropping a job lands it in the first free slot with driving room; the pipeline page never schedules directly.
- The schedule is board-blind: "unscheduled" means any job with no booked visits, regardless of stage name or pipeline, so renamed/custom boards always show up.
- Office-side field signals (live visit status, follow-ups to rebook, survey quotes ready to send) are derived in `src/lib/fieldLive.ts` from field records — never stored separately, so the schedule and field app cannot disagree.
