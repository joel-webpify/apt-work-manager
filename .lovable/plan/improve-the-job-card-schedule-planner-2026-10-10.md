# Improve the job-card schedule planner

## Goal
Make booking from a job card easier to read and operate without sending the user away from the job. Keep the same booking and travel rules, but present the day differently on desktop and mobile.

## Plan
1. **Reshape the booking window**
   - Give the booking window enough room for the planner on desktop while keeping it within the viewport.
   - Keep person/team selection, suggested slots, date, start time, duration, warnings, and final booking together in one clear flow.
   - Make the planner feel like part of the booking flow rather than a second small popup inside it.

2. **Build an adaptive day planner**
   - Desktop: show selected people side by side against one shared time ruler for quick comparison.
   - Mobile: stack one person at a time in a vertical day timeline with a simple person switcher, avoiding horizontal scrolling.
   - Show working hours, days off, existing work and survey visits, estimated travel gaps, and the proposed visit with clearer hierarchy.
   - Keep the selected date visible and provide previous/next-day controls.

3. **Make time selection clearer**
   - Let users tap an available point in the planner to update the proposed start time without creating a booking.
   - Clearly distinguish occupied time, travel time, free time, and “This visit.”
   - Surface conflicts and outside-working-hours warnings beside the proposed visit and retain the existing warning checks.

4. **Polish responsive behavior**
   - Use touch-sized controls, stable timeline dimensions, readable labels, and sticky booking actions where useful on small screens.
   - Ensure long customer, service, and employee names truncate or wrap without covering schedule blocks.
   - Respect the existing visual system and avoid adding new booking rules.

5. **Verify the complete flow**
   - Add focused tests for date/time changes and preview-only selection behavior.
   - Check creating and moving visits from a job card on desktop and phone sizes.
   - Confirm team bookings, survey/work markers, travel gaps, warnings, and the final saved visit remain correct.

## Technical notes
- Update the existing booking UI in `VisitsSection` and refactor `BookingSchedulePreview` into responsive desktop/mobile layouts.
- Continue using `src/lib/booking.ts` and `src/lib/travel.ts` as the shared source for availability, warnings, and travel estimates.
- Selecting a time in the planner changes only the form state; only the Book/Save action writes the visit.
