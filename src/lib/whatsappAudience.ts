import type { Contact } from "@/data/mockData";
import type { ContactExtra } from "@/lib/contactsStore";

export const audienceSegments = [
  { name: "All contacts", group: "General" },
  { name: "Past customers", group: "General" },
  { name: "Residential", group: "General" },
  { name: "Commercial", group: "General" },
  { name: "Leads", group: "Customer status" },
  { name: "Lapsed customers", group: "Customer status" },
  { name: "Recent customers (last 90 days)", group: "Job history" },
  { name: "No job in the last 12 months", group: "Job history" },
  { name: "Never booked a job", group: "Job history" },
] as const;

export type AudienceFilters = {
  lifecycle: string; type: string; source: string; owner: string;
  postcode: string; tags: string[]; minSpend: string; maxSpend: string;
  lastJob: string; consent: string;
};
export const emptyAudienceFilters: AudienceFilters = {
  lifecycle: "any", type: "any", source: "any", owner: "any", postcode: "", tags: [],
  minSpend: "", maxSpend: "", lastJob: "any", consent: "any",
};

export function selectAudience(people: Contact[], extras: Record<string, ContactExtra>, consents: Record<string, string>, segment: string, filters: AudienceFilters, now = Date.now()) {
  return people.filter((c) => {
    const last = Date.parse(c.lastJob);
    const hasJob = Number.isFinite(last) && last <= now;
    const age = hasJob ? (now - last) / 864e5 : null;
    if (segment === "Past customers" && c.lifecycle === "Lead") return false;
    if (["Residential", "Commercial"].includes(segment) && c.type !== segment) return false;
    if (segment === "Leads" && c.lifecycle !== "Lead") return false;
    if (segment === "Lapsed customers" && c.lifecycle !== "Lapsed") return false;
    if (segment === "Recent customers (last 90 days)" && (age === null || age > 90)) return false;
    if (segment === "No job in the last 12 months" && (age === null || age < 365)) return false;
    if (segment === "Never booked a job" && hasJob) return false;
    if (filters.lifecycle !== "any" && c.lifecycle !== filters.lifecycle) return false;
    if (filters.type !== "any" && c.type !== filters.type) return false;
    if (filters.source !== "any" && c.source !== filters.source) return false;
    if (filters.owner !== "any" && (extras[c.id]?.assignedRepId ?? "unassigned") !== filters.owner) return false;
    const prefixes = filters.postcode.toUpperCase().split(",").map((v) => v.replace(/\s/g, "")).filter(Boolean);
    if (prefixes.length && !prefixes.some((v) => c.postcode.toUpperCase().replace(/\s/g, "").startsWith(v))) return false;
    if (filters.tags.length && !filters.tags.some((tag) => extras[c.id]?.tags?.includes(tag))) return false;
    if (filters.minSpend !== "" && c.totalSpend < Number(filters.minSpend)) return false;
    if (filters.maxSpend !== "" && c.totalSpend > Number(filters.maxSpend)) return false;
    if (filters.lastJob === "never" && hasJob) return false;
    if (filters.lastJob.startsWith("within:") && (age === null || age > Number(filters.lastJob.split(":")[1]))) return false;
    if (filters.lastJob.startsWith("over:") && (age === null || age < Number(filters.lastJob.split(":")[1]))) return false;
    if (filters.consent !== "any" && (consents[c.id] ?? "not_set") !== filters.consent) return false;
    return true;
  });
}