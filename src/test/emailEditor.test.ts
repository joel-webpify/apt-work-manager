import { describe, expect, it } from "vitest";
import { subjectNeedsLengthWarning } from "@/lib/emailEditor";

describe("email subject length warning", () => {
  it("warns above 60 characters, but not at 60", () => {
    expect(subjectNeedsLengthWarning("a".repeat(60))).toBe(false);
    expect(subjectNeedsLengthWarning("a".repeat(61))).toBe(true);
  });
});