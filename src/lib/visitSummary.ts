import { FIELD_CHECKLIST, formatMinutes, timeOnSiteMinutes, type FieldRecord } from "@/lib/fieldStore";

export interface VisitSummaryInput {
  customer: string;
  service: string;
  address: string;
  workerName: string;
  companyName?: string;
  record: FieldRecord;
}

function dateLine(record: FieldRecord) {
  const iso = record.stamps.arrived ?? record.stamps.finished ?? record.updatedAt;
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
}

/** The plain-English "job story" the customer receives after sign-off. */
export function buildVisitSummary({
  customer,
  service,
  address,
  workerName,
  companyName = "your team",
  record,
}: VisitSummaryInput): string {
  const lines: string[] = [];
  const first = customer.split(" ")[0];
  lines.push(`Hi ${first},`);
  lines.push("");
  lines.push(`Thanks for having us out${dateLine(record) ? ` on ${dateLine(record)}` : ""}. Here's what we did at ${address}.`);
  lines.push("");
  lines.push(`Job: ${service}`);
  lines.push(`Attended by: ${workerName}`);

  const mins = timeOnSiteMinutes(record);
  if (mins) lines.push(`Time on site: ${formatMinutes(mins)}`);

  if (record.workDone.trim()) {
    lines.push("");
    lines.push("What we did:");
    record.workDone
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .forEach((l) => lines.push(`• ${l}`));
  }

  if (record.partsUsed.trim()) {
    lines.push("");
    lines.push(`Parts and materials: ${record.partsUsed.split("\n").map((l) => l.trim()).filter(Boolean).join(", ")}`);
  }

  const ticked = FIELD_CHECKLIST.filter((c) => record.checklist[c.id]);
  if (ticked.length) {
    lines.push("");
    lines.push("Checks completed:");
    ticked.forEach((c) => lines.push(`• ${c.label}`));
  }

  const photos = record.photos.length;
  if (photos) {
    lines.push("");
    lines.push(`We took ${photos} ${photos === 1 ? "photo" : "photos"} of the work for your records.`);
  }

  if (record.extraWorkNote.trim()) {
    lines.push("");
    lines.push(`We also spotted: ${record.extraWorkNote.trim()}`);
    if (record.extraWorkValue) lines.push(`Rough cost to put right: £${record.extraWorkValue}`);
  }

  if (record.payment) {
    lines.push("");
    lines.push(`Paid on the day: £${record.payment.amount.toFixed(2)} by ${paymentLabel(record.payment.method)}.`);
  }

  if (record.followUp?.date) {
    lines.push("");
    lines.push(
      `Next visit booked for ${new Date(record.followUp.date).toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })}${record.followUp.note ? ` — ${record.followUp.note}` : ""}.`,
    );
  }

  lines.push("");
  lines.push(`Any questions, just give us a shout.`);
  lines.push(companyName);

  return lines.join("\n");
}

export function paymentLabel(method: string) {
  return (
    {
      card: "card",
      cash: "cash",
      bank: "bank transfer",
      link: "payment link",
    }[method] ?? method
  );
}
