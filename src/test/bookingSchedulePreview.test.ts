import { describe, expect, it } from "vitest";
import { minutesFromTime, timeFromMinutes, weekDates } from "@/components/pipeline/BookingSchedulePreview";

describe("booking schedule time helpers", () => {
  it("places quarter-hour selections at the selected time", () => {
    expect(minutesFromTime("09:15")).toBe(555);
    expect(timeFromMinutes(555)).toBe("09:15");
  });

  it("shows the proposed visit end time across an afternoon hour", () => {
    expect(timeFromMinutes(minutesFromTime("15:30") + 90)).toBe("17:00");
  });
});

describe("booking schedule week view", () => {
  it("builds a Monday-to-Sunday week around the selected date", () => {
    const days = weekDates("2026-10-10"); // Saturday
    expect(days).toHaveLength(7);
    expect(days[0]).toBe("2026-10-05"); // Monday
    expect(days[6]).toBe("2026-10-11"); // Sunday
    expect(days).toContain("2026-10-10");
  });

  it("keeps the week inside the same month when the date starts a new one", () => {
    const days = weekDates("2026-11-01"); // Sunday after a Saturday month-end
    expect(days[0]).toBe("2026-10-26");
    expect(days[6]).toBe("2026-11-01");
  });
});
