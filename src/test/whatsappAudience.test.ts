import { describe, expect, it } from "vitest";
import type { Contact } from "@/data/mockData";
import { emptyAudienceFilters, selectAudience } from "@/lib/whatsappAudience";
import { audienceSplit } from "@/lib/whatsappStore";

const now = Date.parse("2026-10-26T12:00:00Z");
const people: Contact[] = [
  { id: "a", name: "A", type: "Residential", lifecycle: "Customer", phone: "07700 900201", email: "a@test.invalid", source: "Google Ads", lastJob: "2026-10-01", totalSpend: 840, postcode: "BS8 4QE" },
  { id: "b", name: "B", type: "Commercial", lifecycle: "Lapsed", phone: "07700 900202", email: "b@test.invalid", source: "Referral", lastJob: "2025-01-01", totalSpend: 2000, postcode: "BA1 1AA" },
  { id: "c", name: "C", type: "Residential", lifecycle: "Lead", phone: "07700 900203", email: "c@test.invalid", source: "Referral", lastJob: "—", totalSpend: 0, postcode: "GL1 1AA" },
];
const extras = { a: { tags: ["Service"], assignedRepId: "e1" }, b: { tags: ["VIP"] } };
const consents = { a: "all" as const, b: "utility" as const };
const select = (segment = "All contacts", filters = emptyAudienceFilters) => selectAudience(people, extras, consents, segment, filters, now).map((c) => c.id);

describe("WhatsApp audience targeting", () => {
  it("selects actual members of each customer segment", () => {
    expect(select("Past customers")).toEqual(["a", "b"]);
    expect(select("Residential")).toEqual(["a", "c"]);
    expect(select("Commercial")).toEqual(["b"]);
    expect(select("Leads")).toEqual(["c"]);
    expect(select("Lapsed customers")).toEqual(["b"]);
  });
  it("selects recent, inactive and never-booked contacts separately", () => {
    expect(select("Recent customers (last 90 days)")).toEqual(["a"]);
    expect(select("No job in the last 12 months")).toEqual(["b"]);
    expect(select("Never booked a job")).toEqual(["c"]);
  });
  it("combines source, owner, tags and spend filters", () => {
    expect(select("All contacts", { ...emptyAudienceFilters, source: "Google Ads", owner: "e1", tags: ["Service"], minSpend: "800", maxSpend: "900" })).toEqual(["a"]);
    expect(select("All contacts", { ...emptyAudienceFilters, minSpend: "900" })).toEqual(["b"]);
    expect(select("All contacts", { ...emptyAudienceFilters, owner: "unassigned" })).toEqual(["b", "c"]);
  });
  it("matches any selected tag and comma-separated postcode prefixes", () => {
    expect(select("All contacts", { ...emptyAudienceFilters, tags: ["Service", "VIP"], postcode: "bs, ba" })).toEqual(["a", "b"]);
  });
  it("filters job age without treating missing dates as old jobs", () => {
    expect(select("All contacts", { ...emptyAudienceFilters, lastJob: "over:365" })).toEqual(["b"]);
    expect(select("All contacts", { ...emptyAudienceFilters, lastJob: "within:30" })).toEqual(["a"]);
    expect(select("All contacts", { ...emptyAudienceFilters, lastJob: "never" })).toEqual(["c"]);
  });
  it("keeps consent eligibility separate from audience matching", () => {
    expect(select("All contacts", { ...emptyAudienceFilters, consent: "utility" })).toEqual(["b"]);
    expect(audienceSplit(people, consents, "MARKETING")).toEqual({ receive: 1, skipped: 2, reasons: { "No WhatsApp marketing consent": 2 } });
  });
});