# Book visits from the job card

## The idea
The office books visits where the conversation happens: on the job card. The Schedule page stays the overview for the whole team, and you can still drag and drop there. The Unscheduled list becomes a fallback for jobs nobody has booked yet. It stops being the only way to book.

## What you get on the job card
A new **Visits** section near the top of Overview:

1. **Booked visits list.** Each visit shows the date, time, length, survey or work marker, everyone on it (or the team name), and the live field status (On the way, On site, Signed off).
2. **Book a visit** button that opens a short form:
   - Survey or work, pre-filled from the board.
   - **Who:** one person, several people, or a team.
   - **When:** a day picker plus **Suggest time**, which finds the first free slot with driving room for everyone on the visit. You can also type a time yourself.
   - **How long:** pre-filled from the service's usual time on site.
   - A clash or day-off warning shows before you save, not afterwards.
3. **Next free slots.** Under the form, the 3 earliest options across the next 7 days. For example: "Tue 09:30, Window crew, 10 min drive". One tap books it.
4. **Edit, move or cancel** a visit from the card. Cancelling asks whether to remove one person or the whole visit, which closes the gap the teams work left open.
5. **Leave for the schedule.** If you don't book, the job keeps showing in the schedule's Unscheduled list, as it does today.

## Small linked improvements
- **Pipeline cards:** a booked or not-booked line ("Thu 14 · 09:30 · Window crew" or "Not booked"). A "Not booked" filter sits next to Needs attention.
- **Open in schedule:** a link on each visit that jumps to that day in the day view.
- **Return visits:** when a worker picks "Needs another visit", the card shows a **Book return visit** button with their note filled in.
- **Team sign-off:** a shared visit counts as done when the lead signs off. This was left open from the teams work.

## Not included
- No automatic stage moves when you book. The board stays under your control, as agreed earlier.
- No customer texts or emails. That's a later item.

## Technical details
- New shared module `src/lib/booking.ts` with `bookVisit`, `moveVisit`, `cancelVisit(scope: "person" | "visit")` and `suggestSlots(job, who, days)`. It wraps `findSmartSlot` and `findTeamSlot` from `travel.ts`. ScheduleView's drop, team drop and add-person handlers are refactored to call it, so the card and the schedule can't drift apart.
- New `src/components/pipeline/VisitsSection.tsx` and `BookVisitDialog.tsx`, used inside JobDrawer (Pipeline.tsx).
- Data model stays as it is: `JobAssignment` rows sharing job, date and start, with an optional `teamId`. The schedule rule doesn't change either: a job with no assignments is unscheduled.
- `fieldLive.ts` reports a shared visit as signed off once the team lead's record is locked, or anyone's record when the visit has no lead.
- `/schedule?date=YYYY-MM-DD&view=day` deep link.
- Record the "booking logic lives in booking.ts" rule in AGENTS.md.
- Vitest tests for `suggestSlots`: no overlap, travel gap respected, off days skipped, and a team slot works for all members.
- Playwright check: book from the card, check the job leaves Unscheduled and appears on the schedule, then cancel one person versus the whole visit. Desktop and phone sizes, no errors.
