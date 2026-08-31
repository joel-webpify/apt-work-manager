import { Btn, Pill } from "@/components/layout/PageShell";
import { Download, Send, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  type Quote,
  type Invoice,
  quoteStatusTones,
  invoiceStatusTones,
} from "@/data/mockData";
import {
  totals,
  fmt,
  fmtDate,
  fmtDateTime,
  resolveItems,
  hasCustomerChoices,
  defaultSelection,
  choiceGroups,
  optionalItems,
} from "@/lib/quoteUtils";
import { toast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  doc: Quote | Invoice | null;
  mode: "quote" | "invoice";
}

export function QuotePreviewDialog({ open, onOpenChange, doc, mode }: Props) {
  if (!doc) return null;
  const isInvoice = mode === "invoice";
  const quote = isInvoice ? null : (doc as Quote);
  const selection = quote?.selection;
  const items = resolveItems(doc.items, selection);
  const t = totals(items);
  const tailored = !isInvoice && hasCustomerChoices(doc.items);
  const effective = selection ?? (quote ? defaultSelection(doc.items) : undefined);
  const tone = isInvoice
    ? invoiceStatusTones[(doc as Invoice).status]
    : quoteStatusTones[(doc as Quote).status];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        <div className="flex items-center justify-between px-5 h-12 border-b-hairline">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">{doc.number}</span>
            <Pill tone={tone}>{doc.status}</Pill>
          </div>
          <div className="flex items-center gap-2">
            <Btn onClick={() => toast({ title: "PDF download (mock)", description: `${doc.number}.pdf` })}>
              <Download className="w-3.5 h-3.5" /> PDF
            </Btn>
            <Btn variant="primary" onClick={() => toast({ title: `${isInvoice ? "Invoice" : "Quote"} sent`, description: `Sent to ${doc.customer}` })}>
              <Send className="w-3.5 h-3.5" /> Send
            </Btn>
            <button
              onClick={() => onOpenChange(false)}
              className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-surface-hover text-muted-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-8 bg-card">
          <div className="flex items-start justify-between mb-8">
            <div>
              <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center mb-3">
                <span className="text-primary-foreground text-base font-medium">S</span>
              </div>
              <div className="font-medium">ServiceCRM Trades Ltd</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                12 Park St, Bristol BS1 5HX<br />
                hello@servicecrm.co.uk · 0117 000 0000
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-medium tracking-tight">
                {isInvoice ? "Invoice" : "Quote"}
              </h2>
              <div className="text-sm text-muted-foreground mt-1">{doc.number}</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6 mb-8 text-sm">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Bill to</div>
              <div className="font-medium">{doc.customer}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Issue date</div>
              <div>{fmtDate(doc.issueDate)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">
                {isInvoice ? "Due date" : "Valid until"}
              </div>
              <div>
                {fmtDate(isInvoice ? (doc as Invoice).dueDate : (doc as Quote).validUntil)}
              </div>
            </div>
          </div>

          <div className="border-hairline rounded-lg overflow-hidden mb-6">
            <div className="grid grid-cols-[2.5fr_0.6fr_0.7fr_0.8fr_0.9fr] px-4 h-9 items-center text-xs text-muted-foreground font-medium border-b-hairline bg-surface/50">
              <div>Description</div>
              <div className="text-right">Qty</div>
              <div className="text-right">Unit</div>
              <div className="text-right">Price</div>
              <div className="text-right">Total</div>
            </div>
            {items.map((li) => (
              <div
                key={li.id}
                className="grid grid-cols-[2.5fr_0.6fr_0.7fr_0.8fr_0.9fr] px-4 py-2.5 items-start text-sm border-b-hairline last:border-b-0"
              >
                <div>
                  <div className="font-medium">{li.name}</div>
                  {li.description && (
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {li.description}
                    </div>
                  )}
                </div>
                <div className="text-right tabular-nums">{li.qty}</div>
                <div className="text-right text-muted-foreground">{li.unit}</div>
                <div className="text-right tabular-nums">{fmt(li.unitPrice)}</div>
                <div className="text-right tabular-nums font-medium">
                  {fmt(li.qty * li.unitPrice)}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end mb-6">
            <div className="w-72 space-y-1.5 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="tabular-nums">{fmt(t.subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Tax (VAT)</span>
                <span className="tabular-nums">{fmt(t.tax)}</span>
              </div>
              <div className="flex justify-between text-base font-medium border-t-hairline pt-2">
                <span>Total due</span>
                <span className="tabular-nums">{fmt(t.total)}</span>
              </div>
            </div>
          </div>

          {tailored && effective && (
            <div className="border-hairline rounded-lg p-4 mb-6 bg-surface/40 text-sm">
              <div className="font-medium mb-2">
                {selection?.acceptedAt
                  ? `What ${selection.acceptedBy || "the customer"} chose`
                  : "What the customer can choose"}
              </div>
              <div className="space-y-1.5">
                {choiceGroups(doc.items).map((g) => {
                  const pickedId = effective.chosen?.[g.id];
                  const picked = g.options.find((o) => o.id === pickedId);
                  return (
                    <div key={g.id} className="flex justify-between gap-3">
                      <span className="text-muted-foreground">{g.label}</span>
                      <span>
                        {picked?.name || "—"}
                        <span className="text-muted-foreground">
                          {" "}
                          ({g.options.length} options)
                        </span>
                      </span>
                    </div>
                  );
                })}
                {optionalItems(doc.items).map((li) => (
                  <div key={li.id} className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Extra — {li.name}</span>
                    <span>{effective.extras?.includes(li.id) ? "Added" : "Not added"}</span>
                  </div>
                ))}
              </div>
              {selection?.acceptedAt && (
                <div className="text-xs text-muted-foreground mt-2 border-t-hairline pt-2">
                  Signed off by {selection.acceptedBy} on {fmtDateTime(selection.acceptedAt)}.
                </div>
              )}
            </div>
          )}

          {doc.notes && (
            <div className="border-t-hairline pt-4 text-sm">
              <div className="text-xs text-muted-foreground mb-1">Notes</div>
              <p className="whitespace-pre-wrap">{doc.notes}</p>
            </div>
          )}
          {!isInvoice && (doc as Quote).terms && (
            <div className="border-t-hairline pt-4 mt-4 text-sm">
              <div className="text-xs text-muted-foreground mb-1">Terms</div>
              <p className="whitespace-pre-wrap">{(doc as Quote).terms}</p>
            </div>
          )}
          {(doc as Invoice).paidDate && (
            <div className="border-t-hairline pt-4 mt-4 text-sm">
              <span className="text-muted-foreground">Paid on </span>
              <span className="font-medium">{fmtDate((doc as Invoice).paidDate!)}</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
