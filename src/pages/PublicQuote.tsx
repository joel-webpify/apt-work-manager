import { useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { CheckCircle2, ChevronLeft, Loader2, MessageCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { findQuote, useQuotes } from "@/lib/quotesStore";
import { acceptQuote } from "@/lib/lifecycle";
import { updateQuote } from "@/lib/quotesStore";
import { normEmail, quoteEmail, usePortalSession } from "@/lib/portalSession";
import type { QuoteSelection } from "@/data/mockData";

import {
  choiceGroups,
  defaultSelection,
  fmt,
  fmtDate,
  includedItems,
  lineTotal,
  optionalItems,
  resolveItems,
  totals,
} from "@/lib/quoteUtils";

/**
 * The page a customer opens from a quote link. No login, no app chrome.
 * They pick between alternatives, tick extras and accept — which locks the
 * quote to exactly what they chose.
 */
export default function PublicQuote() {
  const { id } = useParams();
  useQuotes(); // re-render when the quote is updated
  const quote = id ? findQuote(id) : undefined;

  const [sel, setSel] = useState<QuoteSelection>(() =>
    quote ? quote.selection ?? defaultSelection(quote.items) : { chosen: {}, extras: [] },
  );
  const [name, setName] = useState("");
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);

  const groups = useMemo(() => (quote ? choiceGroups(quote.items) : []), [quote]);
  const extras = useMemo(() => (quote ? optionalItems(quote.items) : []), [quote]);
  const core = useMemo(() => (quote ? includedItems(quote.items) : []), [quote]);
  const t = useMemo(
    () => totals(quote ? resolveItems(quote.items, sel) : []),
    [quote, sel],
  );

  if (!quote) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 text-center">
        <div>
          <h1 className="text-lg font-medium mb-1">Quote not found</h1>
          <p className="text-sm text-muted-foreground">
            This link may have expired. Please contact us for a new one.
          </p>
        </div>
      </div>
    );
  }

  const locked = !!quote.selection?.acceptedAt;
  const shown = locked ? quote.selection! : sel;
  const finalItems = resolveItems(quote.items, shown);
  const finalTotals = totals(finalItems);

  const accept = () => {
    if (!name.trim()) {
      toast({ title: "Please add your name", description: "We need a name for the sign-off." });
      return;
    }
    updateQuote(quote.id, {
      items: finalItems,
      selection: { ...sel, acceptedBy: name.trim(), acceptedAt: new Date().toISOString() },
    });
    acceptQuote(quote.id);
    toast({
      title: "Thank you — quote accepted",
      description: `${quote.number} for ${fmt(t.total)}. We'll be in touch to book you in.`,
    });
  };

  const ask = () => {
    if (!question.trim()) return;
    setAsking(true);
    setTimeout(() => {
      setAsking(false);
      setQuestion("");
      toast({ title: "Question sent", description: "We'll get back to you shortly." });
    }, 500);
  };

  return (
    <div className="min-h-screen bg-surface py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Brand header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-base font-medium">S</span>
            </div>
            <div>
              <div className="font-medium">ServiceCRM Trades Ltd</div>
              <div className="text-xs text-muted-foreground">
                hello@servicecrm.co.uk · 0117 000 0000
              </div>
            </div>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <div className="text-sm font-medium text-foreground">{quote.number}</div>
            Valid until {fmtDate(quote.validUntil)}
          </div>
        </div>

        <div className="bg-card border-hairline rounded-xl overflow-hidden">
          <div className="p-6 border-b-hairline">
            <h1 className="text-xl font-medium tracking-tight">
              Your quote{locked ? "" : " — choose what you'd like"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Prepared for {quote.customer} on {fmtDate(quote.issueDate)}.
            </p>
          </div>

          {locked ? (
            <div className="p-6 space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-[hsl(var(--success))]" />
                Accepted by {quote.selection?.acceptedBy} — thank you.
              </div>
              {finalItems.map((li) => (
                <Row key={li.id} label={li.name} sub={li.description} price={lineTotal(li)} qty={li.qty} unit={li.unit} />
              ))}
              <div className="flex justify-between text-base font-medium border-t-hairline pt-3">
                <span>Total</span>
                <span className="tabular-nums">{fmt(finalTotals.total)}</span>
              </div>
            </div>
          ) : (
            <>
              {core.length > 0 && (
                <Section title="The work">
                  {core.map((li) => (
                    <Row
                      key={li.id}
                      label={li.name}
                      sub={li.description}
                      price={lineTotal(li)}
                      qty={li.qty}
                      unit={li.unit}
                    />
                  ))}
                </Section>
              )}

              {groups.map((g) => {
                const cheapest = Math.min(...g.options.map(lineTotal));
                return (
                  <Section key={g.id} title={g.label || "Choose an option"} hint="Pick one">
                    {g.options.map((o) => {
                      const active = shown.chosen?.[g.id] === o.id;
                      const diff = lineTotal(o) - cheapest;
                      return (
                        <button
                          key={o.id}
                          type="button"
                          onClick={() =>
                            setSel((s) => ({ ...s, chosen: { ...s.chosen, [g.id]: o.id } }))
                          }
                          className={`w-full text-left rounded-lg border p-3 flex items-start gap-3 transition-colors ${
                            active
                              ? "border-primary bg-primary/5"
                              : "border-border hover:bg-surface-hover"
                          }`}
                        >
                          <span
                            className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                              active ? "border-primary" : "border-muted-foreground/40"
                            }`}
                          >
                            {active && <span className="w-2 h-2 rounded-full bg-primary" />}
                          </span>
                          <span className="flex-1 min-w-0">
                            <span className="block text-sm font-medium">
                              {o.name || "Option"}
                            </span>
                            {o.description && (
                              <span className="block text-xs text-muted-foreground mt-0.5">
                                {o.description}
                              </span>
                            )}
                          </span>
                          <span className="text-sm tabular-nums text-right shrink-0">
                            {fmt(lineTotal(o))}
                            {diff > 0 && (
                              <span className="block text-xs text-muted-foreground">
                                +{fmt(diff)}
                              </span>
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </Section>
                );
              })}

              {extras.length > 0 && (
                <Section title="Optional extras" hint="Tick anything you'd like adding">
                  {extras.map((li) => {
                    const on = shown.extras?.includes(li.id);
                    return (
                      <button
                        key={li.id}
                        type="button"
                        onClick={() =>
                          setSel((s) => ({
                            ...s,
                            extras: s.extras.includes(li.id)
                              ? s.extras.filter((x) => x !== li.id)
                              : [...s.extras, li.id],
                          }))
                        }
                        className={`w-full text-left rounded-lg border p-3 flex items-start gap-3 transition-colors ${
                          on ? "border-primary bg-primary/5" : "border-border hover:bg-surface-hover"
                        }`}
                      >
                        <span
                          className={`mt-0.5 w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0 ${
                            on ? "border-primary bg-primary" : "border-muted-foreground/40"
                          }`}
                        >
                          {on && <CheckCircle2 className="w-3 h-3 text-primary-foreground" />}
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm font-medium">{li.name || "Extra"}</span>
                          {li.description && (
                            <span className="block text-xs text-muted-foreground mt-0.5">
                              {li.description}
                            </span>
                          )}
                        </span>
                        <span className="text-sm tabular-nums shrink-0">
                          +{fmt(lineTotal(li))}
                        </span>
                      </button>
                    );
                  })}
                </Section>
              )}

              {/* Live total */}
              <div className="p-6 border-t-hairline bg-surface/40">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="tabular-nums">{fmt(t.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground mt-1">
                  <span>VAT</span>
                  <span className="tabular-nums">{fmt(t.tax)}</span>
                </div>
                <div className="flex justify-between text-lg font-medium border-t-hairline pt-2 mt-2">
                  <span>Your total</span>
                  <span className="tabular-nums">{fmt(t.total)}</span>
                </div>

                <div className="mt-4 flex flex-col sm:flex-row gap-2">
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="sm:max-w-[14rem]"
                  />
                  <button
                    type="button"
                    onClick={accept}
                    className="h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium inline-flex items-center justify-center gap-2 hover:opacity-90"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Accept quote — {fmt(t.total)}
                  </button>
                </div>
              </div>
            </>
          )}

          {(quote.notes || quote.terms) && (
            <div className="p-6 border-t-hairline text-sm space-y-3">
              {quote.notes && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Notes</div>
                  <p className="whitespace-pre-wrap">{quote.notes}</p>
                </div>
              )}
              {quote.terms && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Terms</div>
                  <p className="whitespace-pre-wrap">{quote.terms}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Ask a question */}
        <div className="mt-4 bg-card border-hairline rounded-xl p-5">
          <div className="flex items-center gap-2 text-sm font-medium mb-2">
            <MessageCircle className="w-4 h-4 text-muted-foreground" /> Not sure about something?
          </div>
          <Textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={2}
            placeholder="Ask us anything about this quote"
          />
          <button
            type="button"
            onClick={ask}
            disabled={asking || !question.trim()}
            className="mt-2 h-9 px-3 rounded-md border-hairline text-sm inline-flex items-center gap-2 hover:bg-surface-hover disabled:opacity-50"
          >
            {asking && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Send question
          </button>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-6">
          ServiceCRM Trades Ltd · 12 Park St, Bristol BS1 5HX
        </p>
      </div>
    </div>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="p-6 border-b-hairline space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">{title}</h2>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function Row({
  label,
  sub,
  price,
  qty,
  unit,
}: {
  label: string;
  sub?: string;
  price: number;
  qty: number;
  unit: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm py-1.5">
      <div className="min-w-0">
        <div className="font-medium">{label || "Item"}</div>
        <div className="text-xs text-muted-foreground mt-0.5">
          {qty} {unit}
          {sub ? ` · ${sub}` : ""}
        </div>
      </div>
      <div className="tabular-nums shrink-0">{fmt(price)}</div>
    </div>
  );
}
