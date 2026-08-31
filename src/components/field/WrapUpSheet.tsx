import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Banknote,
  CalendarPlus,
  Check,
  Lock,
  PoundSterling,
  Send,
  Star,
} from "lucide-react";
import type { Contact, Job } from "@/data/mockData";
import {
  patchRecord,
  visitOutcomes,
  wrapUpGaps,
  type FieldRecord,
  type PaymentMethod,
  type VisitOutcome,
} from "@/lib/fieldStore";
import { addQuote } from "@/lib/quotesStore";
import { buildVisitSummary } from "@/lib/visitSummary";
import SignaturePad from "./SignaturePad";
import { useToast } from "@/hooks/use-toast";

const methods: { id: PaymentMethod; label: string }[] = [
  { id: "card", label: "Card" },
  { id: "cash", label: "Cash" },
  { id: "bank", label: "Bank transfer" },
  { id: "link", label: "Payment link" },
];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function WrapUpSheet({
  job,
  contact,
  record,
  employeeId,
  workerName,
  onClose,
}: {
  job: Job;
  contact?: Contact;
  record: FieldRecord;
  employeeId: string;
  workerName: string;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const gaps = wrapUpGaps(record);
  const [skipReason, setSkipReason] = useState(record.skipReason ?? "");
  const [amount, setAmount] = useState(String(record.payment?.amount ?? job.value ?? ""));
  const [method, setMethod] = useState<PaymentMethod>(record.payment?.method ?? "card");
  const [signName, setSignName] = useState(record.signature?.name ?? job.customer);
  const [followUpDate, setFollowUpDate] = useState(record.followUp?.date ?? "");
  const [followUpNote, setFollowUpNote] = useState(record.followUp?.note ?? "");

  const patch = (p: Partial<FieldRecord>) => patchRecord(job.id, employeeId, p);

  const summary = useMemo(
    () =>
      buildVisitSummary({
        customer: job.customer,
        service: job.service,
        address: job.address,
        workerName,
        record,
      }),
    [job, workerName, record],
  );

  const canFinish = Boolean(record.outcome) && (gaps.length === 0 || skipReason.trim().length > 0);

  const takePayment = () => {
    const value = Number(amount);
    if (!value || value <= 0) {
      toast({ title: "Enter how much was paid" });
      return;
    }
    patch({ payment: { method, amount: value, at: new Date().toISOString() } });
    toast({ title: "Payment recorded", description: `£${value.toFixed(2)} by ${method}` });
  };

  const raiseQuote = () => {
    if (!record.extraWorkNote.trim()) return;
    const value = Number(record.extraWorkValue) || 0;
    const id = `Q-F${Date.now().toString().slice(-5)}`;
    const issue = todayISO();
    const valid = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);
    addQuote({
      id,
      number: id,
      contactId: job.contactId,
      customer: job.customer,
      jobId: job.id,
      status: "Draft",
      issueDate: issue,
      validUntil: valid,
      items: [
        {
          id: `li-${Date.now()}`,
          name: "Extra work spotted on site",
          description: record.extraWorkNote.trim(),
          qty: 1,
          unit: "each",
          unitPrice: value,
          taxRate: 20,
        },
      ],
      notes: `Spotted by ${workerName} while on site at ${job.address}. ${record.photos.length} photo${
        record.photos.length === 1 ? "" : "s"
      } on the job.`,
    });
    patch({ extraWorkQuoteId: id });
    toast({ title: "Quote drafted", description: `${id} is waiting in the office.` });
  };

  const share = async () => {
    const data = { title: `${job.service} — what we did`, text: summary };
    try {
      if (navigator.share) {
        await navigator.share(data);
      } else {
        await navigator.clipboard.writeText(summary);
        toast({ title: "Summary copied", description: "Paste it into a text or email." });
      }
      patch({ summarySentAt: new Date().toISOString() });
    } catch {
      /* the worker cancelled the share sheet */
    }
  };

  const requestReview = () => {
    patch({ reviewRequestedAt: new Date().toISOString() });
    toast({ title: "Review request sent", description: `${job.customer} will get a Google review link.` });
  };

  const saveFollowUp = () => {
    if (!followUpDate) return;
    patch({ followUp: { date: followUpDate, note: followUpNote } });
    toast({ title: "Next visit pencilled in" });
  };

  const finish = () => {
    patch({ skipReason: skipReason.trim() || undefined, lockedAt: new Date().toISOString() });
    toast({ title: "Job sheet signed off", description: "The office has everything." });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
      <div className="mx-auto w-full max-w-[520px] pb-24">
        <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b-hairline h-14 px-4 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            aria-label="Back to the job sheet"
            className="w-9 h-9 -ml-1 rounded-lg flex items-center justify-center hover:bg-surface-hover"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate">Wrap up</div>
            <div className="text-[11px] text-muted-foreground truncate">
              {job.customer} · {job.service}
            </div>
          </div>
        </header>

        <div className="p-4 space-y-5">
          {/* 1. How did it go */}
          <Block step="1" title="How did it go?">
            <div className="grid grid-cols-2 gap-2">
              {visitOutcomes.map((o) => {
                const on = record.outcome === o.id;
                return (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => patch({ outcome: o.id as VisitOutcome })}
                    className={`rounded-lg border-hairline p-2.5 text-left ${
                      on ? "bg-primary text-primary-foreground" : "bg-surface hover:bg-surface-hover"
                    }`}
                  >
                    <div className="text-sm font-medium">{o.label}</div>
                    <div className={`text-[11px] mt-0.5 ${on ? "opacity-80" : "text-muted-foreground"}`}>{o.help}</div>
                  </button>
                );
              })}
            </div>
            {record.outcome && record.outcome !== "completed" && (
              <textarea
                value={record.outcomeNote ?? ""}
                onChange={(e) => patch({ outcomeNote: e.target.value })}
                rows={2}
                placeholder="What happened? The office sees this straight away."
                className="mt-2 w-full rounded-lg border-hairline bg-background px-2.5 py-2 text-sm resize-none"
              />
            )}
          </Block>

          {/* 2. Anything missing */}
          <Block step="2" title="Anything missing?">
            {gaps.length === 0 ? (
              <p className="text-sm inline-flex items-center gap-1.5 text-[hsl(var(--success))]">
                <Check className="w-4 h-4" /> Nothing missing — the sheet is complete.
              </p>
            ) : (
              <div className="space-y-2">
                <ul className="space-y-1">
                  {gaps.map((g) => (
                    <li key={g.id} className="text-sm inline-flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-[hsl(var(--warning))]" /> {g.label}
                    </li>
                  ))}
                </ul>
                <input
                  value={skipReason}
                  onChange={(e) => setSkipReason(e.target.value)}
                  placeholder="Why? e.g. customer had to leave"
                  className="h-10 w-full rounded-lg border-hairline bg-background px-2.5 text-sm"
                />
                <p className="text-[11px] text-muted-foreground">
                  You can still finish — just tell the office why, so nobody has to chase you.
                </p>
              </div>
            )}
          </Block>

          {/* 3. Get paid */}
          <Block step="3" title="Get paid before you leave">
            {record.payment ? (
              <p className="text-sm inline-flex items-center gap-1.5 text-[hsl(var(--success))]">
                <Check className="w-4 h-4" /> £{record.payment.amount.toFixed(2)} taken by {record.payment.method}.
              </p>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-1.5 flex-wrap">
                  {methods.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMethod(m.id)}
                      className={`h-9 px-3 rounded-full border-hairline text-xs font-medium ${
                        method === m.id ? "bg-primary text-primary-foreground" : "bg-surface hover:bg-surface-hover"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <PoundSterling className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      inputMode="decimal"
                      className="h-11 w-full rounded-lg border-hairline bg-background pl-8 pr-2.5 text-sm"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={takePayment}
                    className="h-11 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium inline-flex items-center gap-1.5"
                  >
                    <Banknote className="w-4 h-4" /> Record
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Pre-filled from the job value. Card links go live once a payment provider is switched on.
                </p>
              </div>
            )}
          </Block>

          {/* 4. Extra work → quote */}
          {record.extraWorkNote.trim() && (
            <Block step="4" title="Turn the extra work into a quote">
              <p className="text-sm">{record.extraWorkNote}</p>
              {record.extraWorkQuoteId ? (
                <p className="text-sm mt-2 inline-flex items-center gap-1.5 text-[hsl(var(--success))]">
                  <Check className="w-4 h-4" /> Draft quote {record.extraWorkQuoteId} is with the office.
                </p>
              ) : (
                <button
                  type="button"
                  onClick={raiseQuote}
                  className="mt-2 h-11 w-full rounded-lg border-hairline bg-surface hover:bg-surface-hover text-sm font-medium"
                >
                  Draft a quote for £{record.extraWorkValue || "0"}
                </button>
              )}
            </Block>
          )}

          {/* 5. Signature */}
          <Block step="5" title="Customer sign-off">
            {record.signature ? (
              <div>
                <img
                  src={record.signature.dataUrl}
                  alt={`Signature from ${record.signature.name}`}
                  className="w-full h-20 object-contain rounded-lg border-hairline bg-surface"
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  {record.signature.name} ·{" "}
                  {new Date(record.signature.at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  value={signName}
                  onChange={(e) => setSignName(e.target.value)}
                  placeholder="Who's signing?"
                  className="h-10 w-full rounded-lg border-hairline bg-background px-2.5 text-sm"
                />
                <SignaturePad
                  onSave={(dataUrl) =>
                    patch({ signature: { name: signName || job.customer, dataUrl, at: new Date().toISOString() } })
                  }
                />
              </div>
            )}
          </Block>

          {/* 6. Review + summary */}
          <Block step="6" title="While they're happy">
            <div className="space-y-2">
              <button
                type="button"
                onClick={requestReview}
                disabled={Boolean(record.reviewRequestedAt)}
                className="h-11 w-full rounded-lg border-hairline bg-surface hover:bg-surface-hover text-sm font-medium inline-flex items-center justify-center gap-1.5 disabled:opacity-60"
              >
                <Star className="w-4 h-4" />
                {record.reviewRequestedAt ? "Review request sent" : "Ask for a Google review"}
              </button>
              <button
                type="button"
                onClick={share}
                className="h-11 w-full rounded-lg border-hairline bg-surface hover:bg-surface-hover text-sm font-medium inline-flex items-center justify-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                {record.summarySentAt ? "Send the summary again" : "Send the customer a summary"}
              </button>
              <details className="rounded-lg border-hairline bg-surface p-2.5">
                <summary className="text-xs text-muted-foreground cursor-pointer">Preview what they'll get</summary>
                <pre className="mt-2 whitespace-pre-wrap text-xs font-sans">{summary}</pre>
              </details>
            </div>
          </Block>

          {/* 7. Next visit */}
          <Block step="7" title="Book the next visit">
            <div className="flex gap-2">
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="h-11 flex-1 rounded-lg border-hairline bg-background px-2.5 text-sm"
              />
              <button
                type="button"
                onClick={saveFollowUp}
                disabled={!followUpDate}
                className="h-11 px-4 rounded-lg border-hairline bg-surface hover:bg-surface-hover text-sm font-medium inline-flex items-center gap-1.5 disabled:opacity-40"
              >
                <CalendarPlus className="w-4 h-4" /> Save
              </button>
            </div>
            <input
              value={followUpNote}
              onChange={(e) => setFollowUpNote(e.target.value)}
              placeholder="What for? e.g. annual service"
              className="mt-2 h-10 w-full rounded-lg border-hairline bg-background px-2.5 text-sm"
            />
            {record.followUp?.date && (
              <p className="text-[11px] text-muted-foreground mt-1">
                Booked for {new Date(record.followUp.date).toLocaleDateString("en-GB")}.
              </p>
            )}
          </Block>
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t-hairline p-3">
          <div className="mx-auto w-full max-w-[520px]">
            <button
              type="button"
              onClick={finish}
              disabled={!canFinish}
              className="h-12 w-full rounded-lg bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-40"
            >
              <Lock className="w-4 h-4" />
              {record.outcome ? "Finish and lock the sheet" : "Pick how it went first"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Block({ step, title, children }: { step: string; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border-hairline p-3.5">
      <div className="flex items-center gap-2 mb-2.5">
        <span className="w-5 h-5 rounded-full bg-surface border-hairline text-[11px] font-semibold flex items-center justify-center">
          {step}
        </span>
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      {children}
    </section>
  );
}
