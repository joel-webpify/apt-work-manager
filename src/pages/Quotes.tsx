import { useMemo, useState } from "react";
import { PageHeader, PageBody, Btn, Pill } from "@/components/layout/PageShell";
import {
  Plus,
  Search,
  FileText,
  Receipt,
  PoundSterling,
  Clock,
  CheckCircle2,
  AlertCircle,
  Send,
  ThumbsUp,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  quoteStatusTones,
  invoiceStatusTones,
  type Quote,
  type Invoice,
  type QuoteStatus,
  type InvoiceStatus,
} from "@/data/mockData";
import {
  totals,
  fmt,
  fmtDate,
  docTotals,
  resolveItems,
  hasCustomerChoices,
} from "@/lib/quoteUtils";
import { QuoteBuilderDialog } from "@/components/quotes/QuoteBuilderDialog";
import { QuotePreviewDialog } from "@/components/quotes/QuotePreviewDialog";
import { toast } from "@/hooks/use-toast";
import { useQuotes, addQuote, updateQuote } from "@/lib/quotesStore";
import { useInvoices, addInvoice, updateInvoice } from "@/lib/invoicesStore";
import { acceptQuote, sendInvoice, recordPayment } from "@/lib/lifecycle";

type Tab = "quotes" | "invoices";

const quoteStatuses: (QuoteStatus | "All")[] = ["All", "Draft", "Sent", "Accepted", "Declined", "Expired"];
const invoiceStatuses: (InvoiceStatus | "All")[] = ["All", "Draft", "Sent", "Paid", "Overdue", "Void"];

export default function Quotes() {
  const [tab, setTab] = useState<Tab>("quotes");
  const [quotes] = useQuotes();
  const [invoices] = useInvoices();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  const [builderOpen, setBuilderOpen] = useState(false);
  const [editing, setEditing] = useState<Quote | Invoice | null>(null);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewing, setPreviewing] = useState<Quote | Invoice | null>(null);


  const stats = useMemo(() => {
    const sent = quotes
      .filter((q) => q.status === "Sent")
      .reduce((s, q) => s + totals(q.items).total, 0);
    const accepted = quotes
      .filter((q) => q.status === "Accepted")
      .reduce((s, q) => s + totals(q.items).total, 0);
    const outstanding = invoices
      .filter((i) => i.status === "Sent" || i.status === "Overdue")
      .reduce((s, i) => s + totals(i.items).total, 0);
    const overdue = invoices
      .filter((i) => i.status === "Overdue")
      .reduce((s, i) => s + totals(i.items).total, 0);
    const paid = invoices
      .filter((i) => i.status === "Paid")
      .reduce((s, i) => s + totals(i.items).total, 0);
    return { sent, accepted, outstanding, overdue, paid };
  }, [quotes, invoices]);

  const filteredQuotes = quotes.filter((q) => {
    const sf = statusFilter === "All" || q.status === statusFilter;
    const ql = query.trim().toLowerCase();
    const sm =
      !ql ||
      q.number.toLowerCase().includes(ql) ||
      q.customer.toLowerCase().includes(ql);
    return sf && sm;
  });
  const filteredInvoices = invoices.filter((i) => {
    const sf = statusFilter === "All" || i.status === statusFilter;
    const ql = query.trim().toLowerCase();
    const sm =
      !ql ||
      i.number.toLowerCase().includes(ql) ||
      i.customer.toLowerCase().includes(ql);
    return sf && sm;
  });

  const openNew = () => {
    setEditing(null);
    setBuilderOpen(true);
  };
  const openEdit = (doc: Quote | Invoice) => {
    setEditing(doc);
    setBuilderOpen(true);
  };
  const openPreview = (doc: Quote | Invoice) => {
    setPreviewing(doc);
    setPreviewOpen(true);
  };

  const saveDoc = (doc: Quote) => {
    if (tab === "quotes") {
      const exists = quotes.some((q) => q.id === doc.id);
      if (exists) updateQuote(doc.id, doc);
      else addQuote(doc);
      toast({ title: editing ? "Quote updated" : "Quote created", description: doc.number });
    } else {
      const inv = doc as unknown as Invoice;
      const exists = invoices.some((i) => i.id === inv.id);
      if (exists) updateInvoice(inv.id, inv);
      else addInvoice(inv);
      toast({ title: editing ? "Invoice updated" : "Invoice created", description: inv.number });
    }
  };

  const handleAcceptQuote = (q: Quote) => {
    const r = acceptQuote(q.id);
    if (r) toast({ title: "Quote accepted", description: r.message });
  };

  const convertToInvoice = (q: Quote) => {
    const number = `INV-${1100 + invoices.length}`;
    const inv: Invoice = {
      id: number,
      number,
      quoteId: q.id,
      contactId: q.contactId,
      jobId: q.jobId,
      customer: q.customer,
      status: "Draft",
      issueDate: new Date().toISOString().slice(0, 10),
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      items: q.items.map((li) => ({ ...li, id: `il-${Math.random().toString(36).slice(2, 8)}` })),
    };
    addInvoice(inv);
    toast({ title: "Invoice created", description: `${number} from ${q.number}` });
    setTab("invoices");
  };

  const handleSendInvoice = (i: Invoice) => {
    const r = sendInvoice(i.id);
    if (r) toast({ title: "Invoice sent", description: r.message });
  };

  const markPaid = (i: Invoice) => {
    const r = recordPayment(i.id);
    if (r) toast({ title: "Payment recorded", description: r.message });
  };


  const statuses = tab === "quotes" ? quoteStatuses : invoiceStatuses;

  return (
    <>
      <PageHeader
        title="Quotes & invoices"
        description="Build quotes from your catalogue, send them, and track invoices to paid."
        actions={
          <Btn variant="primary" onClick={openNew}>
            <Plus className="w-3.5 h-3.5" /> New {tab === "quotes" ? "quote" : "invoice"}
          </Btn>
        }
      />
      <PageBody>
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <StatCard
            icon={<FileText className="w-4 h-4" />}
            label="Quotes sent"
            value={fmt(stats.sent)}
            sub={`${quotes.filter((q) => q.status === "Sent").length} awaiting reply`}
          />
          <StatCard
            icon={<CheckCircle2 className="w-4 h-4" />}
            label="Accepted (untaxed)"
            value={fmt(stats.accepted)}
            sub={`${quotes.filter((q) => q.status === "Accepted").length} ready to invoice`}
            tone="success"
          />
          <StatCard
            icon={<Clock className="w-4 h-4" />}
            label="Outstanding"
            value={fmt(stats.outstanding)}
            sub={`${invoices.filter((i) => i.status === "Sent" || i.status === "Overdue").length} unpaid invoices`}
            tone="warning"
          />
          <StatCard
            icon={<AlertCircle className="w-4 h-4" />}
            label="Overdue"
            value={fmt(stats.overdue)}
            sub={`${invoices.filter((i) => i.status === "Overdue").length} past due`}
            tone={stats.overdue > 0 ? "danger" : "neutral"}
          />
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b-hairline mb-4">
          {[
            { id: "quotes" as Tab, label: "Quotes", icon: FileText, count: quotes.length },
            { id: "invoices" as Tab, label: "Invoices", icon: Receipt, count: invoices.length },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setTab(t.id);
                setStatusFilter("All");
              }}
              className={`h-9 px-3 text-sm font-medium border-b-2 -mb-px transition-colors inline-flex items-center gap-1.5 ${
                tab === t.id
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
              <span className="text-xs text-muted-foreground tabular-nums">{t.count}</span>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${tab}`}
              className="h-8 pl-8 text-sm"
            />
          </div>
          <div className="flex items-center gap-1 ml-auto flex-wrap">
            {statuses.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`h-7 px-2.5 text-xs rounded-md font-medium transition-colors ${
                  statusFilter === s
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-surface-hover"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Tables */}
        {tab === "quotes" ? (
          <div className="border-hairline rounded-lg bg-card overflow-hidden">
            <div className="grid grid-cols-[1fr_2fr_1.2fr_1.2fr_1fr_0.8fr_auto] px-4 h-9 items-center text-xs text-muted-foreground font-medium border-b-hairline bg-surface/50">
              <div>Number</div>
              <div>Customer</div>
              <div>Issued</div>
              <div>Valid until</div>
              <div className="text-right">Total</div>
              <div>Status</div>
              <div></div>
            </div>
            {filteredQuotes.length === 0 && (
              <EmptyRow icon={<FileText className="w-5 h-5" />} text="No quotes match." />
            )}
            {filteredQuotes.map((q) => {
              const tot = totals(q.items).total;
              return (
                <div
                  key={q.id}
                  className="grid grid-cols-[1fr_2fr_1.2fr_1.2fr_1fr_0.8fr_auto] px-4 h-12 items-center text-sm border-b-hairline last:border-b-0 hover:bg-surface-hover transition-colors cursor-pointer"
                  onClick={() => openPreview(q)}
                >
                  <div className="font-medium tabular-nums">{q.number}</div>
                  <div className="truncate">{q.customer}</div>
                  <div className="text-muted-foreground text-xs">{fmtDate(q.issueDate)}</div>
                  <div className="text-muted-foreground text-xs">{fmtDate(q.validUntil)}</div>
                  <div className="text-right tabular-nums font-medium">{fmt(tot)}</div>
                  <div>
                    <Pill tone={quoteStatusTones[q.status]}>{q.status}</Pill>
                  </div>
                  <div
                    className="flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {(q.status === "Draft" || q.status === "Sent") && (
                      <Btn onClick={() => handleAcceptQuote(q)} title="Mark accepted — creates a job">
                        <ThumbsUp className="w-3.5 h-3.5" /> Accept
                      </Btn>
                    )}
                    {q.status === "Accepted" && (
                      <Btn onClick={() => convertToInvoice(q)}>
                        <Receipt className="w-3.5 h-3.5" /> Invoice
                      </Btn>
                    )}
                    <Btn onClick={() => openEdit(q)}>Edit</Btn>
                  </div>

                </div>
              );
            })}
          </div>
        ) : (
          <div className="border-hairline rounded-lg bg-card overflow-hidden">
            <div className="grid grid-cols-[1fr_2fr_1.2fr_1.2fr_1fr_0.8fr_auto] px-4 h-9 items-center text-xs text-muted-foreground font-medium border-b-hairline bg-surface/50">
              <div>Number</div>
              <div>Customer</div>
              <div>Issued</div>
              <div>Due</div>
              <div className="text-right">Total</div>
              <div>Status</div>
              <div></div>
            </div>
            {filteredInvoices.length === 0 && (
              <EmptyRow icon={<Receipt className="w-5 h-5" />} text="No invoices match." />
            )}
            {filteredInvoices.map((i) => {
              const tot = totals(i.items).total;
              const overdue = i.status === "Overdue";
              return (
                <div
                  key={i.id}
                  className="grid grid-cols-[1fr_2fr_1.2fr_1.2fr_1fr_0.8fr_auto] px-4 h-12 items-center text-sm border-b-hairline last:border-b-0 hover:bg-surface-hover transition-colors cursor-pointer"
                  onClick={() => openPreview(i)}
                >
                  <div className="font-medium tabular-nums">{i.number}</div>
                  <div className="truncate">{i.customer}</div>
                  <div className="text-muted-foreground text-xs">{fmtDate(i.issueDate)}</div>
                  <div
                    className={`text-xs ${overdue ? "text-[hsl(var(--destructive))] font-medium" : "text-muted-foreground"}`}
                  >
                    {fmtDate(i.dueDate)}
                  </div>
                  <div className="text-right tabular-nums font-medium">{fmt(tot)}</div>
                  <div>
                    <Pill tone={invoiceStatusTones[i.status]}>{i.status}</Pill>
                  </div>
                  <div
                    className="flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {i.status === "Draft" && (
                      <Btn onClick={() => handleSendInvoice(i)} title="Mark sent — moves job to Invoiced">
                        <Send className="w-3.5 h-3.5" /> Send
                      </Btn>
                    )}
                    {(i.status === "Sent" || i.status === "Overdue" || i.status === "Draft") && (
                      <Btn onClick={() => markPaid(i)} title="Record payment — moves job to Paid">
                        <PoundSterling className="w-3.5 h-3.5" /> Mark paid
                      </Btn>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </PageBody>

      <QuoteBuilderDialog
        open={builderOpen}
        onOpenChange={setBuilderOpen}
        initial={editing as Quote | null}
        onSave={saveDoc}
        mode={tab === "quotes" ? "quote" : "invoice"}
      />
      <QuotePreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        doc={previewing}
        mode={tab === "quotes" ? "quote" : "invoice"}
      />
    </>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  tone = "neutral",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  tone?: "neutral" | "success" | "warning" | "danger";
}) {
  const toneStyles = {
    neutral: "text-muted-foreground",
    success: "text-[hsl(var(--success))]",
    warning: "text-[hsl(var(--warning))]",
    danger: "text-[hsl(var(--destructive))]",
  };
  return (
    <div className="border-hairline rounded-lg bg-card p-4">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
        <span className={toneStyles[tone]}>{icon}</span>
        {label}
      </div>
      <div className="text-xl font-medium tabular-nums">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

function EmptyRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="px-4 py-10 text-center text-sm text-muted-foreground">
      <div className="mx-auto mb-2 opacity-60 w-fit">{icon}</div>
      {text}
    </div>
  );
}
