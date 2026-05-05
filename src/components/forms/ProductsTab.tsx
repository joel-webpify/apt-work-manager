import { useState } from "react";
import { Btn, Pill } from "@/components/layout/PageShell";
import { Plus, Pencil, Trash2, Search, Package } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import {
  products as seedProducts,
  type Product,
  type ProductUnit,
  type Trade,
} from "@/data/mockData";

const trades: Trade[] = [
  "Plumbing",
  "Electrical",
  "Window cleaning",
  "Landscaping",
  "General",
];
const units: ProductUnit[] = ["each", "hour", "day", "sqm", "m", "visit"];

const blank = (): Product => ({
  id: `p-${Date.now()}`,
  name: "",
  description: "",
  trade: "General",
  unit: "each",
  price: 0,
  taxRate: 20,
  sku: "",
  active: true,
});

export function ProductsTab() {
  const [items, setItems] = useState<Product[]>(seedProducts);
  const [query, setQuery] = useState("");
  const [tradeFilter, setTradeFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Product>(blank());
  const [editingId, setEditingId] = useState<string | null>(null);

  const filtered = items.filter((p) => {
    const q = query.trim().toLowerCase();
    const matchQ =
      !q ||
      p.name.toLowerCase().includes(q) ||
      (p.sku ?? "").toLowerCase().includes(q) ||
      (p.description ?? "").toLowerCase().includes(q);
    const matchT = tradeFilter === "all" || p.trade === tradeFilter;
    return matchQ && matchT;
  });

  const startNew = () => {
    setDraft(blank());
    setEditingId(null);
    setOpen(true);
  };
  const startEdit = (p: Product) => {
    setDraft({ ...p });
    setEditingId(p.id);
    setOpen(true);
  };
  const save = () => {
    if (!draft.name.trim()) return;
    if (editingId) {
      setItems((prev) => prev.map((p) => (p.id === editingId ? draft : p)));
    } else {
      setItems((prev) => [{ ...draft, id: `p-${Date.now()}` }, ...prev]);
    }
    setOpen(false);
  };
  const remove = (id: string) =>
    setItems((prev) => prev.filter((p) => p.id !== id));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products & services"
            className="h-8 pl-8 text-sm"
          />
        </div>
        <Select value={tradeFilter} onValueChange={setTradeFilter}>
          <SelectTrigger className="h-8 w-[180px] text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All trades</SelectItem>
            {trades.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex-1" />
        <Btn variant="primary" onClick={startNew}>
          <Plus className="w-3.5 h-3.5" /> New product
        </Btn>
      </div>

      <div className="border-hairline rounded-lg bg-card overflow-hidden">
        <div className="grid grid-cols-[2.4fr_1.2fr_0.8fr_1fr_0.8fr_0.6fr_auto] px-4 h-9 items-center text-xs text-muted-foreground font-medium border-b-hairline bg-surface/50">
          <div>Name</div>
          <div>Trade</div>
          <div>Unit</div>
          <div className="text-right">Price</div>
          <div className="text-right">Tax</div>
          <div>Status</div>
          <div></div>
        </div>
        {filtered.length === 0 && (
          <div className="px-4 py-10 text-center text-sm text-muted-foreground">
            <Package className="w-5 h-5 mx-auto mb-2 opacity-60" />
            No products match.
          </div>
        )}
        {filtered.map((p) => (
          <div
            key={p.id}
            className="grid grid-cols-[2.4fr_1.2fr_0.8fr_1fr_0.8fr_0.6fr_auto] px-4 h-12 items-center text-sm border-b-hairline last:border-b-0 hover:bg-surface-hover transition-colors"
          >
            <div className="min-w-0">
              <div className="font-medium truncate">{p.name}</div>
              {p.sku && (
                <div className="text-xs text-muted-foreground tabular-nums">
                  {p.sku}
                </div>
              )}
            </div>
            <div className="text-muted-foreground">{p.trade}</div>
            <div className="text-muted-foreground">/ {p.unit}</div>
            <div className="text-right tabular-nums font-medium">
              £{p.price.toFixed(2)}
            </div>
            <div className="text-right text-muted-foreground tabular-nums">
              {p.taxRate}%
            </div>
            <div>
              {p.active ? (
                <Pill tone="success">Active</Pill>
              ) : (
                <Pill tone="neutral">Off</Pill>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => startEdit(p)}
                className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-surface-hover text-muted-foreground"
                aria-label="Edit"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => remove(p.id)}
                className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-surface-hover text-muted-foreground"
                aria-label="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit product" : "New product or service"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="p-name">Name</Label>
              <Input
                id="p-name"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="e.g. Window cleaning — standard visit"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-desc">Description</Label>
              <Textarea
                id="p-desc"
                value={draft.description ?? ""}
                onChange={(e) =>
                  setDraft({ ...draft, description: e.target.value })
                }
                rows={2}
                placeholder="Shown on quotes & invoices"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Trade</Label>
                <Select
                  value={draft.trade}
                  onValueChange={(v: Trade) => setDraft({ ...draft, trade: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {trades.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Unit</Label>
                <Select
                  value={draft.unit}
                  onValueChange={(v: ProductUnit) =>
                    setDraft({ ...draft, unit: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((u) => (
                      <SelectItem key={u} value={u}>
                        per {u}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="p-price">Price (£)</Label>
                <Input
                  id="p-price"
                  type="number"
                  step="0.01"
                  value={draft.price}
                  onChange={(e) =>
                    setDraft({ ...draft, price: Number(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-tax">Tax %</Label>
                <Input
                  id="p-tax"
                  type="number"
                  value={draft.taxRate}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      taxRate: Number(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-sku">SKU</Label>
                <Input
                  id="p-sku"
                  value={draft.sku ?? ""}
                  onChange={(e) => setDraft({ ...draft, sku: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center justify-between pt-1">
              <Label htmlFor="p-active" className="text-sm">
                Active — available for quotes
              </Label>
              <Switch
                id="p-active"
                checked={draft.active}
                onCheckedChange={(v) => setDraft({ ...draft, active: v })}
              />
            </div>
          </div>
          <DialogFooter>
            <Btn onClick={() => setOpen(false)}>Cancel</Btn>
            <Btn variant="primary" onClick={save}>
              {editingId ? "Save changes" : "Create product"}
            </Btn>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
