import { describe, it, expect } from "vitest";
import { suggestSlots, bookingWarnings, cancelVisit } from "@/lib/booking";
import type { Employee, Job } from "@/data/mockData";

const emp = (id: string, over: Partial<Employee> = {}): Employee => ({
  id, name: `${id} Test`, initials: id, role: "", color: "0 0% 50%", trades: ["General"], postcodes: ["BS"],
  workingDays: [1, 2, 3, 4, 5], workStart: "08:00", workEnd: "17:00", daysOff: [], capacityHoursPerDay: 8, phone: "", ...over,
});
const job = (id: string, address: string, assignments: Job["assignments"] = []): Job => ({
  id, contactId: "c", customer: id, service: "x", value: 0, stage: "New", daysInStage: 0, address, notes: "",
  quoteValue: 0, timeline: [], assignments,
} as unknown as Job);

const MON = "2026-05-04";

describe("suggestSlots", () => {
  it("does not overlap and leaves a travel gap after an existing visit", () => {
    const busy = job("a", "1 Road, BS8 1AA", [{ employeeId: "e1", date: MON, start: "08:00", duration: 2 }]);
    const target = job("b", "2 Road, BS1 2BB");
    const [first] = suggestSlots({ job: target, jobs: [busy, target], employeeIds: ["e1"], fromISO: MON, duration: 1, employees: [emp("e1")] });
    expect(first).toEqual({ date: MON, start: "10:25", driveMins: 25 });
  });
  it("skips off days", () => {
    const target = job("b", "BS1 2BB");
    const [first] = suggestSlots({ job: target, jobs: [target], employeeIds: ["e1"], fromISO: MON, duration: 1, employees: [emp("e1", { daysOff: [MON] })] });
    expect(first.date).toBe("2026-05-05");
  });
  it("finds a team slot that works for every member", () => {
    const busy = job("a", "BS1 1AA", [{ employeeId: "e2", date: MON, start: "08:00", duration: 3 }]);
    const target = job("b", "BS1 2BB");
    const [first] = suggestSlots({ job: target, jobs: [busy, target], employeeIds: ["e1", "e2"], fromISO: MON, duration: 1, employees: [emp("e1"), emp("e2")] });
    expect(first.start).toBe("11:10");
  });
});

describe("bookingWarnings + cancel", () => {
  it("flags a clash", () => {
    const busy = job("a", "BS1", [{ employeeId: "e1", date: MON, start: "09:00", duration: 2 }]);
    expect(bookingWarnings({ jobs: [busy], jobId: "b", employeeIds: ["e1"], date: MON, start: "10:00", duration: 1, employees: [emp("e1")] }))
      .toEqual(["e1 already has a visit then"]);
  });
  it("cancels one person or the whole visit", () => {
    const j = job("a", "BS1", [
      { employeeId: "e1", date: MON, start: "09:00", duration: 2 },
      { employeeId: "e2", date: MON, start: "09:00", duration: 2 },
    ]);
    expect(cancelVisit(j, `${MON}|09:00`, { employeeId: "e1" }).assignments).toHaveLength(1);
    expect(cancelVisit(j, `${MON}|09:00`, "visit").assignments).toHaveLength(0);
  });
});
