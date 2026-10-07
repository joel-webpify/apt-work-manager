# Schedule: teams and more than one person per job

## What you get
1. **Teams (crews):** a new Settings tab, "Teams", where you set up named groups like "Install crew A: Marcus + Liam" with a colour and an optional lead. Each person can be in several teams.
2. **Drop a job on a team:** the schedule gets a "People / Teams" switch. In Teams mode each row is a team. Dropping a job on a team's day books every member at the same time. The time is the first slot where **all** members are free, with driving room.
3. **Add a helper to any job:** an "Add person" button on a booked visit, in the week and day views. It shows who's free at that time and suggests people with the right trade first. You can also remove one person without cancelling the visit for everyone.
4. **Shared visits look shared:** chips and day blocks show small avatars of everyone on the visit, so a two-person job reads as one job, not two separate ones. Moving or resizing the visit moves the whole crew. Holding a key while dragging moves one person only.
5. **Field app:** each worker on a shared visit sees "With: Liam, Marcus" on My day and on the job. Each person keeps their own photos and notes, as today. The visit counts as done for the office once the lead (or anyone, if there's no lead) signs off.

## Rules
- Capacity bars and clash warnings still count per person. A team booking flags anyone who'd overlap.
- If a team member is off that day, the drop still works for the others. You get a toast naming who was left off.
- Hours and costs count per person, so a 3-hour job with two people logs 6 labour hours.

## Technical notes
- Bookings are already one entry per person (`JobAssignment`). A shared visit is entries with the same job, date and start. Add an optional `visitId` to group them, and an optional `teamId` for where the booking came from. No other changes to how jobs are stored.
- New `src/lib/teamsStore.ts` (browser-local, same pattern as the other stores): `Team { id, name, color, memberIds, leadId? }`, `useTeams`, plus add, update and remove.
- `src/lib/travel.ts`: new `findTeamSlot` checks each member with `findSmartSlot` and takes the latest start that works for all of them.
- ScheduleView: rows switch between people and teams. Chip and day-block edits update every entry with the same `visitId`. The new `AddPersonPopover` reuses the free-slot check.
- `fieldLive.ts`: shared visits take their live status from the furthest-along member, and signed off follows the lead.
- Record the shared-visit rule in AGENTS.md.
- Check with Playwright: create a team, drop a job on it (both people booked at the same free time), add a helper to a visit, move a shared visit, and look at the field app as a team member. Desktop and phone, no errors.
