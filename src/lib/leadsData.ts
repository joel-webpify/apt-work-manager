import { contacts, employees } from "@/data/mockData";

/** A lead as received from any channel. Demo data, generated relative to today. */
export interface LeadRecord {
  id: string;
  name: string;
  receivedAt: string; // ISO datetime
  firstContactAt?: string; // ISO datetime — when someone first replied/called
  status: "Open" | "Spam" | "Dead Lead";
  ownerId: string;
}

// Leads per 7-day window, index 0 = the last 7 days.
const WEEKLY = [7, 11, 12, 10, 13, 11, 12];

function seeded(n: number) {
  const x = Math.sin(n * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

function build(): LeadRecord[] {
  const names = contacts.map((c) => c.name);
  const now = Date.now();
  const out: LeadRecord[] = [];
  let k = 0;
  WEEKLY.forEach((count, week) => {
    for (let i = 0; i < count; i++) {
      k++;
      const hoursAgo = week * 168 + Math.floor(seeded(k) * 160) + 2;
      const received = now - hoursAgo * 3600_000;
      const responseH = 1 + Math.floor(seeded(k + 100) * 6);
      // Two recent leads older than a day have not been contacted yet.
      const uncontacted = week === 0 && i < 2 && hoursAgo > 24;
      const status = seeded(k + 200) > 0.93 ? "Spam" : "Open";
      out.push({
        id: `L-${k}`,
        name: names[k % names.length],
        receivedAt: new Date(received).toISOString(),
        firstContactAt: uncontacted || hoursAgo < responseH ? undefined : new Date(received + responseH * 3600_000).toISOString(),
        status,
        ownerId: employees[k % employees.length].id,
      });
    }
  });
  // Make sure the two uncontacted leads are genuinely >24h old.
  out.slice(0, 2).forEach((l, i) => {
    l.receivedAt = new Date(now - (30 + i * 20) * 3600_000).toISOString();
    l.firstContactAt = undefined;
    l.status = "Open";
  });
  return out;
}

export const leads: LeadRecord[] = build();
