import { addJob, updateJob, findJob, getJobs } from "./jobsStore";
import { addInvoice, updateInvoice, findInvoice, findInvoiceByJob, getInvoices } from "./invoicesStore";
import { updateQuote, findQuote, getQuotes } from "./quotesStore";
import { contacts, type Job, type Invoice } from "@/data/mockData";
import { totals } from "./quoteUtils";

const today = () => new Date().toISOString().slice(0, 10);
const niceDate = () =>
  new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short" });

export interface LifecycleResult {
  type: "job-created" | "job-updated" | "invoice-drafted" | "invoice-sent" | "payment-recorded";
  jobId?: string;
  invoiceId?: string;
  message: string;
}

/** Quote accepted → create or reactivate the linked job in "Job booked". */
export function acceptQuote(quoteId: string): LifecycleResult | null {
  const q = findQuote(quoteId);
  if (!q) return null;
  updateQuote(quoteId, { status: "Accepted" });

  if (q.jobId && findJob(q.jobId)) {
    updateJob(q.jobId, { stage: "Job booked", daysInStage: 0 });
    return {
      type: "job-updated",
      jobId: q.jobId,
      message: `Quote ${q.number} accepted — job moved to "Job booked".`,
    };
  }

  const total = totals(q.items).total;
  const contact = q.contactId ? contacts.find((c) => c.id === q.contactId) : undefined;
  const job: Job = {
    id: `j-q-${quoteId}-${Date.now()}`,
    contactId: q.contactId ?? "manual",
    customer: q.customer,
    service: q.items[0]?.name ?? "Service",
    value: total,
    stage: "Job booked",
    daysInStage: 0,
    address: contact?.postcode ?? "",
    notes: `Auto-created from accepted quote ${q.number}.`,
    quoteValue: total,
    estimatedHours: 2,
    assignments: [],
    timeline: [
      { type: "note", text: `Quote ${q.number} accepted`, date: niceDate() },
    ],
  };
  addJob(job);
  updateQuote(quoteId, { jobId: job.id });
  return {
    type: "job-created",
    jobId: job.id,
    message: `Quote ${q.number} accepted — new job created in "Job booked".`,
  };
}

/** Job marked complete → auto-draft an invoice (from linked quote if any). */
export function completeJob(jobId: string): LifecycleResult | null {
  const job = findJob(jobId);
  if (!job) return null;

  if (job.invoiceId) {
    const existing = findInvoice(job.invoiceId);
    if (existing) {
      return {
        type: "invoice-drafted",
        jobId,
        invoiceId: existing.id,
        message: `Job marked complete — invoice ${existing.number} already drafted.`,
      };
    }
  }
  const alreadyByJob = findInvoiceByJob(jobId);
  if (alreadyByJob) {
    updateJob(jobId, { invoiceId: alreadyByJob.id });
    return {
      type: "invoice-drafted",
      jobId,
      invoiceId: alreadyByJob.id,
      message: `Job marked complete — linked to existing invoice ${alreadyByJob.number}.`,
    };
  }

  const quote = getQuotes().find((q) => q.jobId === jobId);
  const items = quote
    ? quote.items.map((li) => ({ ...li, id: `il-${Math.random().toString(36).slice(2, 8)}` }))
    : [
        {
          id: `il-${Math.random().toString(36).slice(2, 8)}`,
          name: job.service,
          qty: 1,
          unit: "each" as const,
          unitPrice: job.value,
          taxRate: 20,
        },
      ];
  const number = `INV-${1100 + getInvoices().length}`;
  const inv: Invoice = {
    id: number,
    number,
    quoteId: quote?.id,
    jobId,
    contactId: job.contactId,
    customer: job.customer,
    status: "Draft",
    issueDate: today(),
    dueDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    items,
    notes: `Auto-drafted on job completion.`,
  };
  addInvoice(inv);
  updateJob(jobId, {
    invoiceId: number,
    timeline: [
      ...(job.timeline ?? []),
      { type: "note", text: `Invoice ${number} drafted`, date: niceDate() },
    ],
  });
  return {
    type: "invoice-drafted",
    jobId,
    invoiceId: number,
    message: `Job complete — invoice ${number} auto-drafted for £${inv.items
      .reduce((s, i) => s + i.qty * i.unitPrice * (1 + i.taxRate / 100), 0)
      .toFixed(2)}.`,
  };
}

/** Invoice sent → move job to "Invoiced". */
export function sendInvoice(invoiceId: string): LifecycleResult | null {
  const inv = findInvoice(invoiceId);
  if (!inv) return null;
  updateInvoice(invoiceId, { status: "Sent" });
  if (inv.jobId) {
    const job = findJob(inv.jobId);
    if (job) {
      updateJob(inv.jobId, {
        stage: "Invoiced",
        daysInStage: 0,
        timeline: [
          ...(job.timeline ?? []),
          { type: "email", text: `Invoice ${inv.number} sent`, date: niceDate() },
        ],
      });
    }
  }
  return {
    type: "invoice-sent",
    invoiceId,
    jobId: inv.jobId,
    message: `Invoice ${inv.number} marked as sent.`,
  };
}

/** Payment recorded → mark invoice paid and move job to "Paid". */
export function recordPayment(
  invoiceId: string,
  opts?: { method?: string; date?: string },
): LifecycleResult | null {
  const inv = findInvoice(invoiceId);
  if (!inv) return null;
  const date = opts?.date ?? today();
  updateInvoice(invoiceId, {
    status: "Paid",
    paidDate: date,
    notes: opts?.method
      ? `${inv.notes ? inv.notes + "\n" : ""}Paid via ${opts.method}.`
      : inv.notes,
  });
  if (inv.jobId) {
    const job = findJob(inv.jobId);
    if (job) {
      updateJob(inv.jobId, {
        stage: "Paid",
        daysInStage: 0,
        timeline: [
          ...(job.timeline ?? []),
          { type: "note", text: `Payment received${opts?.method ? ` (${opts.method})` : ""}`, date: niceDate() },
        ],
      });
    }
  }
  return {
    type: "payment-recorded",
    invoiceId,
    jobId: inv.jobId,
    message: `Payment recorded for ${inv.number}${opts?.method ? ` via ${opts.method}` : ""}.`,
  };
}

/** Called when a job's stage changes via the pipeline UI. Returns automation effects. */
export function onJobStageChange(jobId: string, newStage: string): LifecycleResult | null {
  const job = findJob(jobId) ?? getJobs().find((j) => j.id === jobId);
  if (!job) return null;

  if (newStage === "Completed") {
    return completeJob(jobId);
  }
  if (newStage === "Invoiced") {
    let invoiceId = job.invoiceId;
    if (!invoiceId) {
      const drafted = completeJob(jobId);
      invoiceId = drafted?.invoiceId;
    }
    if (invoiceId) {
      const inv = findInvoice(invoiceId);
      if (inv && inv.status === "Draft") return sendInvoice(invoiceId);
    }
    return null;
  }
  if (newStage === "Paid") {
    let invoiceId = job.invoiceId;
    if (!invoiceId) {
      const drafted = completeJob(jobId);
      invoiceId = drafted?.invoiceId;
    }
    if (invoiceId) {
      const inv = findInvoice(invoiceId);
      if (inv && inv.status !== "Paid") return recordPayment(invoiceId);
    }
    return null;
  }
  return null;
}
