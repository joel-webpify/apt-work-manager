import { useMemo, useState, useEffect } from "react";
import { Btn } from "@/components/layout/PageShell";
import { Plus, Trash2, FileText } from "lucide-react";
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
  type Quote,
  type QuoteLineItem,
  type QuoteStatus,
  type ProductUnit,
  type QuoteLineKind,
} from "@/data/mockData";
import { fmt, lineKind, resolveItems, totals, hasCustomerChoices } from "@/lib/quoteUtils";

const statuses: QuoteStatus[] = ["Draft", "Sent", "Accepted", "Declined", "Expired"];

const blankItem = (): QuoteLineItem => ({
  id: `li-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  name: "",
  qty: 1,
  unit: "each",
  unitPrice: 0,
  taxRate: 20,
});

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: Quote | null;
  onSave: (q: Quote) => void;
  mode: "quote" | "invoice";
}

export function QuoteBuilderDialog({ open, onOpenChange, initial, onSave, mode }: Props) {
  const [draft, setDraft] = useState<Quote>(() =>
    initial ?? {
      id: "",
      number: "",
      customer: "",
      status: "Draft",
      issueDate: new Date().toISOString().slice(0, 10),
      validUntil: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      items: [blankItem()],
    }
  );

  useEffect(() => {
    if (open) {
      setDraft(
        initial ?? {
          id: "",
          number: "",
          customer: "",
          status: "Draft",
          issueDate: new Date().toISOString().slice(0, 10),
          validUntil: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
          items: [blankItem()],
        }
      );
    }
  }, [open, initial]);

  const t = useMemo(() => totals(draft.items), [draft.items]);

  const addItem = () => setDraft((d) => ({ ...d, items: [...d.items, blankItem()] }));
  const removeItem = (id: string) =>
    setDraft((d) => ({ ...d, items: d.items.filter((i) => i.id !== id) }));
  const updateItem = (id: string, patch: Partial<QuoteLineItem>) =>
    setDraft((d) => ({
      ...d,
      items: d.items.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    }));

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
    });
  };

  const save = () => {
    if (!draft.customer.trim()) return;
    const number =
      draft.number ||
      (mode === "quote"
        ? `Q-${2044 + Math.floor(Math.random() * 100)}`
        : `INV-${1043 + Math.floor(Math.random() * 100)}`);
    onSave({ ...draft, number, id: draft.id || number });
    onOpenChange(false);
  };

  const label = mode === "quote" ? "quote" : "invoice";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            {initial ? `Edit ${label}` : `New ${label}`}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Customer</Label>
              <Input
                value={draft.customer}
                onChange={(e) => setDraft({ ...draft, customer: e.target.value })}
                placeholder="Customer name"
              />
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
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{mode === "quote" ? "Issue date" : "Issue date"}</Label>
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

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Line items</Label>
              <Btn onClick={addItem}>
                <Plus className="w-3.5 h-3.5" /> Add line
              </Btn>
            </div>
            <div className="border-hairline rounded-lg overflow-hidden">
              <div className="grid grid-cols-[2fr_0.7fr_0.7fr_0.9fr_0.6fr_0.9fr_auto] px-3 h-9 items-center text-xs text-muted-foreground font-medium border-b-hairline bg-surface/50">
                <div>Item</div>
                <div className="text-right">Qty</div>
                <div>Unit</div>
                <div className="text-right">Price</div>
                <div className="text-right">Tax</div>
                <div className="text-right">Total</div>
                <div></div>
              </div>
              {draft.items.map((li) => {
                const total = li.qty * li.unitPrice * (1 + li.taxRate / 100);
                return (
                  <div
                    key={li.id}
                    className="grid grid-cols-[2fr_0.7fr_0.7fr_0.9fr_0.6fr_0.9fr_auto] px-3 py-2 gap-1.5 items-start text-sm border-b-hairline last:border-b-0"
                  >
                    <div className="space-y-1">
                      <Select
                        value={li.productId ?? ""}
                        onValueChange={(v) => pickProduct(li.id, v)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Pick from catalogue" />
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
                      <Input
                        value={li.name}
                        onChange={(e) => updateItem(li.id, { name: e.target.value })}
                        placeholder="Description"
                        className="h-8 text-xs"
                      />
                      {mode === "quote" && (
                        <div className="flex flex-wrap items-center gap-1">
                          <Select
                            value={lineKind(li)}
                            onValueChange={(v: QuoteLineKind) => setKind(li, v)}
                          >
                            <SelectTrigger className="h-7 text-xs w-[9.5rem]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="included">Always included</SelectItem>
                              <SelectItem value="choice">Customer picks one</SelectItem>
                              <SelectItem value="optional">Optional extra</SelectItem>
                            </SelectContent>
                          </Select>
                          {lineKind(li) === "choice" && (
                            <Input
                              value={li.groupLabel ?? ""}
                              onChange={(e) =>
                                setGroupLabel(li.groupId ?? li.id, e.target.value)
                              }
                              placeholder="Choice name (e.g. Boiler)"
                              className="h-7 text-xs w-40"
                            />
                          )}
                          {lineKind(li) !== "included" && (
                            <label className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <input
                                type="checkbox"
                                className="accent-[hsl(var(--primary))]"
                                checked={!!li.defaultSelected}
                                onChange={(e) => setDefault(li, e.target.checked)}
                              />
                              {lineKind(li) === "choice" ? "Default" : "Pre-ticked"}
                            </label>
                          )}
                          {lineKind(li) === "choice" && (
                            <button
                              type="button"
                              onClick={() => addAlternative(li)}
                              className="h-7 px-2 rounded-md border-hairline text-xs hover:bg-surface-hover"
                            >
                              + Alternative
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    <Input
                      type="number"
                      value={li.qty}
                      onChange={(e) => updateItem(li.id, { qty: Number(e.target.value) || 0 })}
                      className="h-8 text-xs text-right"
                    />
                    <Select
                      value={li.unit}
                      onValueChange={(v: ProductUnit) => updateItem(li.id, { unit: v })}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(["each", "hour", "day", "sqm", "m", "visit"] as ProductUnit[]).map((u) => (
                          <SelectItem key={u} value={u}>
                            {u}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      step="0.01"
                      value={li.unitPrice}
                      onChange={(e) =>
                        updateItem(li.id, { unitPrice: Number(e.target.value) || 0 })
                      }
                      className="h-8 text-xs text-right"
                    />
                    <Input
                      type="number"
                      value={li.taxRate}
                      onChange={(e) =>
                        updateItem(li.id, { taxRate: Number(e.target.value) || 0 })
                      }
                      className="h-8 text-xs text-right"
                    />
                    <div className="h-8 inline-flex items-center justify-end text-xs tabular-nums font-medium">
                      {fmt(total)}
                    </div>
                    <button
                      onClick={() => removeItem(li.id)}
                      className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-surface-hover text-muted-foreground"
                      aria-label="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end">
            <div className="w-64 space-y-1.5 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="tabular-nums">{fmt(t.subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Tax</span>
                <span className="tabular-nums">{fmt(t.tax)}</span>
              </div>
              <div className="flex justify-between font-medium border-t-hairline pt-1.5">
                <span>Total</span>
                <span className="tabular-nums">{fmt(t.total)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea
              value={draft.notes ?? ""}
              onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
              rows={2}
              placeholder="Internal or customer-facing notes"
            />
          </div>
        </div>

        <DialogFooter>
          <Btn onClick={() => onOpenChange(false)}>Cancel</Btn>
          <Btn variant="primary" onClick={save}>
            {initial ? "Save changes" : `Create ${label}`}
          </Btn>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
