import { useMemo, useState, useEffect } from "react";
import { Btn } from "@/components/layout/PageShell";
import {
  Plus,
  Trash2,
  FileText,
  Package,
  ImageOff,
  ListChecks,
  CheckCircle2,
  GitBranch,
  ChevronDown,
  ChevronRight,
  ArrowRightLeft,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  products as seedProducts,
  contacts as seedContacts,
  type Quote,
  type QuoteLineItem,
  type QuoteStatus,
  type ProductUnit,
  type QuoteLineKind,
  type Product,
} from "@/data/mockData";
import {
  useImportedContacts,
  useContactExtras,
  applyExtrasTo,
  mergeWithMock,
} from "@/lib/contactsStore";
import { ProductPickerDialog } from "./ProductPickerDialog";
import { fmt, lineKind, resolveItems, totals, hasCustomerChoices, lineTotal } from "@/lib/quoteUtils";


const statuses: QuoteStatus[] = ["Draft", "Sent", "Accepted", "Declined", "Expired"];
const units: ProductUnit[] = ["each", "hour", "day", "sqm", "m", "visit"];

const newId = () => `li-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

const blankItem = (): QuoteLineItem => ({
  id: newId(),
  name: "",
  qty: 1,
  unit: "each",
  unitPrice: 0,
  taxRate: 20,
});

const emptyQuote = (): Quote => ({
  id: "",
  number: "",
  customer: "",
  status: "Draft",
  issueDate: new Date().toISOString().slice(0, 10),
  validUntil: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
  items: [blankItem()],
});

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: Quote | null;
  onSave: (q: Quote) => void;
  mode: "quote" | "invoice";
}

export function QuoteBuilderDialog({ open, onOpenChange, initial, onSave, mode }: Props) {
  const [draft, setDraft] = useState<Quote>(() => initial ?? emptyQuote());
  const [pickerOpen, setPickerOpen] = useState(false);
  /** Where catalogue picks should land: "included" | "optional" | group id */
  const [pickerTarget, setPickerTarget] = useState<string>("included");
  const [openLines, setOpenLines] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (open) {
      setDraft(initial ?? emptyQuote());
      setOpenLines({});
    }
  }, [open, initial]);

  const t = useMemo(() => totals(resolveItems(draft.items, draft.selection)), [draft]);
  const tailored = hasCustomerChoices(draft.items);

  const updateItem = (id: string, patch: Partial<QuoteLineItem>) =>
    setDraft((d) => ({
      ...d,
      items: d.items.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    }));

  const removeItem = (id: string) =>
    setDraft((d) => ({ ...d, items: d.items.filter((i) => i.id !== id) }));

  const isBlank = (i: QuoteLineItem) => !i.name.trim() && !i.productId && !i.unitPrice;

  /** Add empty lines into a section. target: "included" | "optional" | group id */
  const addLine = (target: string) => {
    const item: QuoteLineItem = { ...blankItem() };
    if (target === "optional") {
      item.kind = "optional";
      item.defaultSelected = false;
    } else if (target !== "included") {
      item.kind = "choice";
      item.groupId = target;
      item.defaultSelected = false;
    }
    setDraft((d) => ({ ...d, items: [...d.items, item] }));
    setOpenLines((o) => ({ ...o, [item.id]: true }));
  };

  const lineFromProduct = (p: Product, target: string): QuoteLineItem => {
    const base: QuoteLineItem = {
      ...blankItem(),
      productId: p.id,
      name: p.name,
      description: p.description,
      unit: p.unit,
      unitPrice: p.price,
      taxRate: p.taxRate,
      imageUrl: p.imageUrl,
    };
    if (target === "optional") return { ...base, kind: "optional", defaultSelected: false };
    if (target !== "included")
      return { ...base, kind: "choice", groupId: target, defaultSelected: false };
    return base;
  };

  const addFromCatalogue = (picked: Product[]) =>
    setDraft((d) => {
      const lines = picked.map((p) => lineFromProduct(p, pickerTarget));
      const kept = d.items.filter((i) => !isBlank(i));
      return { ...d, items: [...kept, ...lines] };
    });

  const openPicker = (target: string) => {
    setPickerTarget(target);
    setPickerOpen(true);
  };

  const pickProduct = (lineId: string, productId: string) => {
    const p = seedProducts.find((x) => x.id === productId);
    if (!p) return;
    updateItem(lineId, {
      productId: p.id,
      name: p.name,
      description: p.description,
      unit: p.unit,
      unitPrice: p.price,
      taxRate: p.taxRate,
      imageUrl: p.imageUrl,
    });
  };

  /** Add a new "customer picks one" group with two blank options. */
  const addChoiceGroup = () => {
    const gid = `g-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
    const a: QuoteLineItem = {
      ...blankItem(),
      kind: "choice",
      groupId: gid,
      groupLabel: "",
      defaultSelected: true,
    };
    const b: QuoteLineItem = {
      ...blankItem(),
      kind: "choice",
      groupId: gid,
      groupLabel: "",
      defaultSelected: false,
    };
    setDraft((d) => ({ ...d, items: [...d.items.filter((i) => !isBlank(i)), a, b] }));
    setOpenLines((o) => ({ ...o, [a.id]: true, [b.id]: true }));
  };

  const setGroupLabel = (groupId: string, label: string) =>
    setDraft((d) => ({
      ...d,
      items: d.items.map((i) =>
        (i.groupId ?? i.id) === groupId && lineKind(i) === "choice"
          ? { ...i, groupLabel: label }
          : i,
      ),
    }));

  const removeGroup = (groupId: string) =>
    setDraft((d) => ({
      ...d,
      items: d.items.filter((i) => !(lineKind(i) === "choice" && (i.groupId ?? i.id) === groupId)),
    }));

  const setDefault = (li: QuoteLineItem) => {
    const gid = li.groupId ?? li.id;
    setDraft((d) => ({
      ...d,
      items: d.items.map((i) =>
        (i.groupId ?? i.id) === gid && lineKind(i) === "choice"
          ? { ...i, defaultSelected: i.id === li.id }
          : i,
      ),
    }));
  };

  /** Move a line between sections. */
  const moveLine = (li: QuoteLineItem, target: string) => {
    if (target === "included") {
      updateItem(li.id, {
        kind: "included",
        groupId: undefined,
        groupLabel: undefined,
        defaultSelected: undefined,
      });
    } else if (target === "optional") {
      updateItem(li.id, {
        kind: "optional",
        groupId: undefined,
        groupLabel: undefined,
        defaultSelected: false,
      });
    } else {
      const label = draft.items.find(
        (i) => lineKind(i) === "choice" && (i.groupId ?? i.id) === target,
      )?.groupLabel;
      updateItem(li.id, {
        kind: "choice",
        groupId: target,
        groupLabel: label ?? "",
        defaultSelected: false,
      });
    }
  };

  const groups = useMemo(() => {
    const out: { id: string; label: string; options: QuoteLineItem[] }[] = [];
    draft.items.forEach((li) => {
      if (lineKind(li) !== "choice") return;
      const id = li.groupId ?? li.id;
      let g = out.find((x) => x.id === id);
      if (!g) {
        g = { id, label: li.groupLabel ?? "", options: [] };
        out.push(g);
      }
      if (!g.label && li.groupLabel) g.label = li.groupLabel;
      g.options.push(li);
    });
    return out;
  }, [draft.items]);

  const importedContacts = useImportedContacts();
  const contactExtras = useContactExtras();

  const included = draft.items.filter((i) => lineKind(i) === "included");
  const optional = draft.items.filter((i) => lineKind(i) === "optional");


  const contactList = useMemo(
    () =>
      mergeWithMock(seedContacts, applyExtrasTo(importedContacts, contactExtras)).sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
    [importedContacts, contactExtras],
  );
  const picked = contactList.find(
    (c) => c.id === draft.contactId || (!draft.contactId && c.name === draft.customer),
  );
  const pickedContactId = draft.contactId && picked ? picked.id : "__manual";
  const pickedEmail = picked?.email;


  const moveOptions = [
    { value: "included", label: "Always included" },
    ...groups.map((g, idx) => ({
      value: g.id,
      label: `Choice: ${g.label || `Option set ${idx + 1}`}`,
    })),
    { value: "optional", label: "Optional extra" },
  ];

  const save = () => {
    if (!draft.customer.trim()) return;
    const items = draft.items.filter((i) => !isBlank(i));
    const number =
      draft.number ||
      (mode === "quote"
        ? `Q-${2044 + Math.floor(Math.random() * 100)}`
        : `INV-${1043 + Math.floor(Math.random() * 100)}`);
    onSave({ ...draft, items: items.length ? items : draft.items, number, id: draft.id || number });
    onOpenChange(false);
  };

  const label = mode === "quote" ? "quote" : "invoice";

  const LineCard = ({ li, currentTarget }: { li: QuoteLineItem; currentTarget: string }) => {
    const expanded = openLines[li.id] ?? false;
    return (
      <div className="rounded-lg border-hairline bg-background">
        <div className="flex items-start gap-3 p-2.5">
          <div className="w-12 h-12 shrink-0 rounded-md overflow-hidden border-hairline bg-surface flex items-center justify-center">
            {li.imageUrl ? (
              <img
                src={li.imageUrl}
                alt={li.name || "Product photo"}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            ) : (
              <ImageOff className="w-3.5 h-3.5 text-muted-foreground opacity-60" />
            )}
          </div>

          <div className="flex-1 min-w-0 space-y-2">
            <Input
              value={li.name}
              onChange={(e) => updateItem(li.id, { name: e.target.value })}
              placeholder="What is it? e.g. New combi boiler"
              className="h-9"
            />
            <div className="flex flex-wrap items-end gap-2">
              <div className="w-16">
                <span className="block text-[11px] text-muted-foreground mb-0.5">Qty</span>
                <Input
                  type="number"
                  value={li.qty}
                  onChange={(e) => updateItem(li.id, { qty: Number(e.target.value) || 0 })}
                  className="h-8 text-xs text-right"
                />
              </div>
              <div className="w-24">
                <span className="block text-[11px] text-muted-foreground mb-0.5">Per</span>
                <Select
                  value={li.unit}
                  onValueChange={(v: ProductUnit) => updateItem(li.id, { unit: v })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((u) => (
                      <SelectItem key={u} value={u}>
                        {u}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-24">
                <span className="block text-[11px] text-muted-foreground mb-0.5">Price</span>
                <Input
                  type="number"
                  step="0.01"
                  value={li.unitPrice}
                  onChange={(e) => updateItem(li.id, { unitPrice: Number(e.target.value) || 0 })}
                  className="h-8 text-xs text-right"
                />
              </div>
              <div className="w-20">
                <span className="block text-[11px] text-muted-foreground mb-0.5">VAT %</span>
                <Input
                  type="number"
                  value={li.taxRate}
                  onChange={(e) => updateItem(li.id, { taxRate: Number(e.target.value) || 0 })}
                  className="h-8 text-xs text-right"
                />
              </div>
              <div className="ml-auto text-right">
                <span className="block text-[11px] text-muted-foreground mb-0.5">Line total</span>
                <span className="text-sm font-medium tabular-nums">{fmt(lineTotal(li))}</span>
              </div>
            </div>

            {expanded && (
              <div className="space-y-2 pt-1">
                <div>
                  <span className="block text-[11px] text-muted-foreground mb-0.5">
                    Pick from your catalogue
                  </span>
                  <Select value={li.productId ?? ""} onValueChange={(v) => pickProduct(li.id, v)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Choose a saved item" />
                    </SelectTrigger>
                    <SelectContent>
                      {seedProducts
                        .filter((p) => p.active)
                        .map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <Textarea
                  value={li.description ?? ""}
                  onChange={(e) => updateItem(li.id, { description: e.target.value })}
                  rows={2}
                  placeholder="Extra detail the customer will read (optional)"
                  className="text-xs"
                />
                <Input
                  value={li.imageUrl ?? ""}
                  onChange={(e) => updateItem(li.id, { imageUrl: e.target.value })}
                  placeholder="Photo link (optional)"
                  className="h-8 text-xs"
                />
                {mode === "quote" && (
                  <div className="flex items-center gap-2">
                    <ArrowRightLeft className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-[11px] text-muted-foreground">Move to</span>
                    <Select value={currentTarget} onValueChange={(v) => moveLine(li, v)}>
                      <SelectTrigger className="h-8 text-xs w-56">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {moveOptions.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setOpenLines((o) => ({ ...o, [li.id]: !expanded }))}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                {expanded ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
                {expanded ? "Fewer details" : "More details"}
              </button>
              {lineKind(li) === "optional" && (
                <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    className="accent-[hsl(var(--primary))]"
                    checked={!!li.defaultSelected}
                    onChange={(e) => updateItem(li.id, { defaultSelected: e.target.checked })}
                  />
                  Ticked by default
                </label>
              )}
              {lineKind(li) === "choice" && (
                <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <input
                    type="radio"
                    className="accent-[hsl(var(--primary))]"
                    checked={!!li.defaultSelected}
                    onChange={() => setDefault(li)}
                  />
                  Shown first
                </label>
              )}
            </div>
          </div>

          <button
            onClick={() => removeItem(li.id)}
            className="h-8 w-8 shrink-0 inline-flex items-center justify-center rounded-md hover:bg-surface-hover text-muted-foreground"
            aria-label="Remove line"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  };

  const SectionActions = ({ target }: { target: string }) => (
    <div className="flex items-center gap-2">
      <Btn onClick={() => openPicker(target)} className="h-7 text-xs">
        <Package className="w-3.5 h-3.5" /> From catalogue
      </Btn>
      <Btn onClick={() => addLine(target)} className="h-7 text-xs">
        <Plus className="w-3.5 h-3.5" /> Add line
      </Btn>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            {initial ? `Edit ${label}` : `New ${label}`}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-1">
          {/* Step 1 — who it's for */}
          <section className="space-y-3">
            <h3 className="text-sm font-medium">1. Who is it for?</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Customer</Label>
                <Select
                  value={pickedContactId}
                  onValueChange={(v) => {
                    if (v === "__manual") {
                      setDraft({ ...draft, contactId: undefined, customer: "" });
                      return;
                    }
                    const c = contactList.find((x) => x.id === v);
                    if (c) setDraft({ ...draft, contactId: c.id, customer: c.name });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pick a customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {contactList.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                        {c.email ? ` · ${c.email}` : ""}
                      </SelectItem>
                    ))}
                    <SelectItem value="__manual">Type a name instead…</SelectItem>
                  </SelectContent>
                </Select>
                {!draft.contactId && (
                  <Input
                    value={draft.customer}
                    onChange={(e) => setDraft({ ...draft, customer: e.target.value, contactId: undefined })}
                    placeholder="Customer name"
                  />
                )}
                {pickedEmail ? (
                  <p className="text-xs text-muted-foreground">
                    Quote link signs in with {pickedEmail}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Pick a saved customer so you can test the customer sign-in.
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={draft.status}
                  onValueChange={(v: QuoteStatus) => setDraft({ ...draft, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Issue date</Label>
                <Input
                  type="date"
                  value={draft.issueDate}
                  onChange={(e) => setDraft({ ...draft, issueDate: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{mode === "quote" ? "Valid until" : "Due date"}</Label>
                <Input
                  type="date"
                  value={draft.validUntil}
                  onChange={(e) => setDraft({ ...draft, validUntil: e.target.value })}
                />
              </div>
            </div>
          </section>

          {/* Step 2 — the work */}
          <section className="space-y-3">
            <h3 className="text-sm font-medium">2. What is in the price?</h3>

            <div className="rounded-lg border-hairline bg-surface/40 p-3 space-y-2.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">Always included</div>
                    <div className="text-xs text-muted-foreground">
                      Everything the customer gets, no matter what they pick.
                    </div>
                  </div>
                </div>
                <SectionActions target="included" />
              </div>
              {included.length === 0 ? (
                <p className="text-xs text-muted-foreground">No lines yet.</p>
              ) : (
                <div className="space-y-2">
                  {included.map((li) => (
                    <LineCard key={li.id} li={li} currentTarget="included" />
                  ))}
                </div>
              )}
            </div>

            {mode === "quote" && (
              <>
                {groups.map((g, idx) => (
                  <div key={g.id} className="rounded-lg border-hairline bg-surface/40 p-3 space-y-2.5">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="flex items-start gap-2">
                        <GitBranch className="w-4 h-4 mt-0.5 text-muted-foreground" />
                        <div className="space-y-1">
                          <div className="text-sm font-medium">
                            Customer picks one of these
                          </div>
                          <Input
                            value={g.label}
                            onChange={(e) => setGroupLabel(g.id, e.target.value)}
                            placeholder={`Name this choice, e.g. Boiler (set ${idx + 1})`}
                            className="h-8 text-xs w-64"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <SectionActions target={g.id} />
                        <button
                          type="button"
                          onClick={() => removeGroup(g.id)}
                          className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-surface-hover text-muted-foreground"
                          aria-label="Remove this choice"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {g.options.map((li) => (
                        <LineCard key={li.id} li={li} currentTarget={g.id} />
                      ))}
                    </div>
                  </div>
                ))}

                <div className="rounded-lg border-hairline bg-surface/40 p-3 space-y-2.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <ListChecks className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">Optional extras</div>
                        <div className="text-xs text-muted-foreground">
                          Add-ons the customer can tick on or off.
                        </div>
                      </div>
                    </div>
                    <SectionActions target="optional" />
                  </div>
                  {optional.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No extras yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {optional.map((li) => (
                        <LineCard key={li.id} li={li} currentTarget="optional" />
                      ))}
                    </div>
                  )}
                </div>

                <Btn onClick={addChoiceGroup}>
                  <Plus className="w-3.5 h-3.5" /> Add a choice for the customer
                </Btn>
              </>
            )}
          </section>

          {/* Step 3 — totals & notes */}
          <section className="space-y-3">
            <h3 className="text-sm font-medium">3. Check the price</h3>
            <div className="flex justify-end">
              <div className="w-64 space-y-1.5 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="tabular-nums">{fmt(t.subtotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>VAT</span>
                  <span className="tabular-nums">{fmt(t.tax)}</span>
                </div>
                <div className="flex justify-between font-medium border-t-hairline pt-1.5">
                  <span>Total</span>
                  <span className="tabular-nums">{fmt(t.total)}</span>
                </div>
                {tailored && (
                  <div className="text-xs text-muted-foreground">
                    Based on your defaults — the customer can change this.
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea
                value={draft.notes ?? ""}
                onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                rows={2}
                placeholder="Anything else the customer should know"
              />
            </div>
          </section>
        </div>

        <DialogFooter>
          <Btn onClick={() => onOpenChange(false)}>Cancel</Btn>
          <Btn variant="primary" onClick={save}>
            {initial ? "Save changes" : `Create ${label}`}
          </Btn>
        </DialogFooter>
      </DialogContent>

      <ProductPickerDialog open={pickerOpen} onOpenChange={setPickerOpen} onAdd={addFromCatalogue} />
    </Dialog>
  );
}
