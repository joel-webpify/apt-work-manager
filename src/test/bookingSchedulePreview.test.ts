import { describe, expect, it } from "vitest";
import { minutesFromTime, timeFromMinutes } from "@/components/pipeline/BookingSchedulePreview";

describe("booking schedule time helpers", () => {
  it("places quarter-hour selections at the selected time", () => {
    expect(minutesFromTime("09:15")).toBe(555);
    expect(timeFromMinutes(555)).toBe("09:15");
  });

  it("shows the proposed visit end time across an afternoon hour", () => {
    expect(timeFromMinutes(minutesFromTime("15:30") + 90)).toBe("17:00");
  });
});