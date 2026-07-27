import { getInvoices } from "./invoicesStore";
import { getJobs } from "./jobsStore";
import { getQuotes } from "./quotesStore";
import { totals } from "./quoteUtils";
import type { Job } from "@/data/mockData";

export type Confidence = "confirmed" | "expected" | "at-risk";

export interface CashFlowItem {
  id: string;
  kind: "invoice" | "job" | "quote";
  label: string;
  sub: string;
  amount: number;
  confidence: Confidence;
  /** In-app route to open the underlying record. */
  link: string;
  date: Date;
}

export interface CashFlowWeek {
  start: Date;
  label: string;
  confirmed: number;
  expected: number;
  atRisk: number;
  total: number;
  items: CashFlowItem[];
}

export interface CashFlowForecastData {
  weeks: CashFlowWeek[];
  totalConfirmed: number;
  totalExpected: number;
  totalAtRisk: number;
  total: number;
  peak: CashFlowWeek | null;
  overdueValue: number;
}

const DAY = 86400000;

export function startOfWeek(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = (x.getDay() + 6) % 7; // Monday = 0
  x.setDate(x.getDate() - day);
  return x;
}

function weekLabel(d: Date): string {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/** Deterministic pseudo "expected payment date" for a job with no invoice yet. */
function jobExpectedDate(job: Job, now: Date): Date {
  const stageLag: Record<string, number> = {
    "Job booked": 21,
    "In progress": 14,
    Completed: 10,
    Invoiced: 7,
  };
  const base = stageLag[job.stage] ?? 28;
  // Older jobs in stage are closer to being paid, floored at 3 days out.
  const lag = Math.max(3, base - Math.min(job.daysInStage, base - 3));
  return new Date(now.getTime() + lag * DAY);
}

function invoiceTotal(items: Parameters<typeof totals>[0]): number {
  return Math.round(totals(items).total);
}

export function buildCashFlowForecast(weeksCount: number, now: Date = new Date()): CashFlowForecastData {
  const first = startOfWeek(now);
  const weeks: CashFlowWeek[] = Array.from({ length: weeksCount }, (_, i) => {
    const start = new Date(first.getTime() + i * 7 * DAY);
    return { start, label: weekLabel(start), confirmed: 0, expected: 0, atRisk: 0, total: 0, items: [] };
  });
  const horizonEnd = new Date(first.getTime() + weeksCount * 7 * DAY);

  const place = (item: CashFlowItem) => {
    // Anything already due lands in the current week so it stays actionable.
    const target = item.date < first ? first : item.date;
    if (target >= horizonEnd) return;
    const idx = Math.min(
      weeks.length - 1,
      Math.max(0, Math.round((startOfWeek(target).getTime() - first.getTime()) / (7 * DAY))),
    );
    const w = weeks[idx];
    w.items.push(item);
    if (item.confidence === "confirmed") w.confirmed += item.amount;
    else if (item.confidence === "expected") w.expected += item.amount;
    else w.atRisk += item.amount;
    w.total += item.amount;
  };

  let overdueValue = 0;

  // 1. Issued invoices awaiting payment.
  const invoices = getInvoices();
  const invoicedJobIds = new Set<string>();
  invoices.forEach((inv) => {
    if (inv.jobId) invoicedJobIds.add(inv.jobId);
    if (inv.status === "Paid" || inv.status === "Void") return;
    const amount = invoiceTotal(inv.items);
    if (!amount) return;
    const due = new Date(inv.dueDate || inv.issueDate);
    const isOverdue = inv.status === "Overdue" || (inv.status === "Sent" && due < now);
    if (isOverdue) overdueValue += amount;
    place({
      id: inv.id,
      kind: "invoice",
      label: `${inv.number} · ${inv.customer}`,
      sub:
        inv.status === "Draft"
          ? "Draft invoice — not sent yet"
          : isOverdue
            ? `Overdue since ${due.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`
            : `Due ${due.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`,
      amount: isOverdue ? Math.round(amount * 0.85) : amount,
      confidence: inv.status === "Draft" ? "expected" : isOverdue ? "at-risk" : "confirmed",
      link: "/quotes?tab=invoices",
      date: due,
    });
  });

  // 2. Won work not yet invoiced.
  getJobs().forEach((job) => {
    if (invoicedJobIds.has(job.id) || job.invoiceId) return;
    if (!["Job booked", "In progress", "Completed", "Invoiced"].includes(job.stage)) return;
    if (!job.value) return;
    place({
      id: job.id,
      kind: "job",
      label: `${job.customer} · ${job.service}`,
      sub: `${job.stage} — not invoiced yet`,
      amount: job.value,
      confidence: "expected",
      link: "/pipeline",
      date: jobExpectedDate(job, now),
    });
  });

  // 3. Open quotes, weighted by a typical acceptance rate.
  getQuotes().forEach((q) => {
    if (q.status !== "Sent") return;
    const amount = Math.round(invoiceTotal(q.items) * 0.45);
    if (!amount) return;
    const valid = new Date(q.validUntil || q.issueDate);
    place({
      id: q.id,
      kind: "quote",
      label: `${q.number} · ${q.customer}`,
      sub: "Open quote — weighted at 45% win rate",
      amount,
      confidence: "at-risk",
      link: "/quotes",
      date: valid,
    });
  });

  weeks.forEach((w) => w.items.sort((a, b) => b.amount - a.amount));

  const totalConfirmed = weeks.reduce((s, w) => s + w.confirmed, 0);
  const totalExpected = weeks.reduce((s, w) => s + w.expected, 0);
  const totalAtRisk = weeks.reduce((s, w) => s + w.atRisk, 0);
  const peak = weeks.reduce<CashFlowWeek | null>((best, w) => (!best || w.total > best.total ? w : best), null);

  return {
    weeks,
    totalConfirmed,
    totalExpected,
    totalAtRisk,
    total: totalConfirmed + totalExpected + totalAtRisk,
    peak: peak && peak.total > 0 ? peak : null,
    overdueValue,
  };
}

export interface LeadVelocity {
  thisWeek: number;
  lastWeek: number;
  changePct: number | null;
  history: number[];
}

/**
 * Week-over-week change in new enquiries. Enquiry age is derived from
 * `daysInStage` so the series is stable across renders.
 */
export function buildLeadVelocity(weeks = 8, now: Date = new Date()): LeadVelocity {
  const buckets = new Array(weeks).fill(0) as number[];
  getJobs().forEach((job) => {
    // Age of the enquiry: time in the current stage plus a stage-based offset.
    const stageOffset: Record<string, number> = {
      "New enquiry": 0,
      "Quote sent": 4,
      "Job booked": 9,
      "In progress": 14,
      Completed: 20,
      Invoiced: 25,
      Paid: 30,
    };
    const ageDays = job.daysInStage + (stageOffset[job.stage] ?? 0);
    const weekIdx = Math.floor(ageDays / 7);
    if (weekIdx < weeks) buckets[weekIdx] += 1;
  });

  const thisWeek = buckets[0];
  const lastWeek = buckets[1];
  const changePct = lastWeek > 0 ? ((thisWeek - lastWeek) / lastWeek) * 100 : thisWeek > 0 ? 100 : null;

  return {
    thisWeek,
    lastWeek,
    changePct,
    // Oldest → newest for the sparkline.
    history: [...buckets].reverse(),
  };
}

export interface LeadDay {
  date: Date;
  /** Mon, Tue… */
  weekday: string;
  count: number;
  value: number;
  isToday: boolean;
  isWeekend: boolean;
}

/**
 * Daily split of new enquiries, oldest → newest. Uses the same synthetic
 * enquiry age as `buildLeadVelocity` so both views agree.
 */
export function buildLeadDays(days = 14, now: Date = new Date()): LeadDay[] {
  const stageOffset: Record<string, number> = {
    "New enquiry": 0,
    "Quote sent": 4,
    "Job booked": 9,
    "In progress": 14,
    Completed: 20,
    Invoiced: 25,
    Paid: 30,
  };

  const counts = new Array(days).fill(0) as number[];
  const values = new Array(days).fill(0) as number[];
  getJobs().forEach((job) => {
    const ageDays = job.daysInStage + (stageOffset[job.stage] ?? 0);
    if (ageDays < days) {
      counts[ageDays] += 1;
      values[ageDays] += job.value ?? 0;
    }
  });

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const out: LeadDay[] = [];
  for (let back = days - 1; back >= 0; back--) {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - back);
    out.push({
      date: d,
      weekday: weekdays[d.getDay()],
      count: counts[back],
      value: values[back],
      isToday: back === 0,
      isWeekend: d.getDay() === 0 || d.getDay() === 6,
    });
  }
  return out;
}

