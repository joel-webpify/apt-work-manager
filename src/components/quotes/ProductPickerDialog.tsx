import { useMemo, useState, useEffect } from "react";
import { Btn } from "@/components/layout/PageShell";
import { Search, Package, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
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
import { products as seedProducts, type Product } from "@/data/mockData";
import { fmt } from "@/lib/quoteUtils";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onAdd: (picked: Product[]) => void;
}

export function ProductPickerDialog({ open, onOpenChange, onAdd }: Props) {
  const [query, setQuery] = useState("");
  const [trade, setTrade] = useState("all");
  const [picked, setPicked] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setTrade("all");
      setPicked([]);
    }
  }, [open]);

  const catalogue = useMemo(() => seedProducts.filter((p) => p.active), []);
  const trades = useMemo(
    () => Array.from(new Set(catalogue.map((p) => p.trade))),
    [catalogue],
  );

  const filtered = catalogue.filter((p) => {
    const q = query.trim().toLowerCase();
    const matchQ =
      !q ||
      p.name.toLowerCase().includes(q) ||
      (p.sku ?? "").toLowerCase().includes(q) ||
      (p.description ?? "").toLowerCase().includes(q);
    return matchQ && (trade === "all" || p.trade === trade);
  });

  const toggle = (id: string) =>
    setPicked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const add = () => {
    const chosen = catalogue.filter((p) => picked.includes(p.id));
    if (chosen.length) onAdd(chosen);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-4 h-4" /> Add from your catalogue
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products & services"
              className="h-8 pl-8 text-sm"
            />
          </div>
          <Select value={trade} onValueChange={setTrade}>
            <SelectTrigger className="h-8 w-[170px] text-sm">
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
        </div>

        <div className="overflow-y-auto -mx-1 px-1 py-1">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Nothing matches that search.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {filtered.map((p) => {
                const on = picked.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggle(p.id)}
                    className={`text-left rounded-lg border overflow-hidden transition-colors ${
                      on ? "border-primary bg-primary/5" : "border-border hover:bg-surface-hover"
                    }`}
                  >
                    <div className="relative aspect-[4/3] bg-surface">
                      {p.imageUrl ? (
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <Package className="w-5 h-5 opacity-60" />
                        </div>
                      )}
                      {on && (
                        <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-3 h-3 text-primary-foreground" />
                        </span>
                      )}
                    </div>
                    <div className="p-2">
                      <div className="text-xs font-medium leading-snug line-clamp-2">
                        {p.name}
                      </div>
                      <div className="text-xs text-muted-foreground tabular-nums mt-0.5">
                        {fmt(p.price)} / {p.unit}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter>
          <Btn onClick={() => onOpenChange(false)}>Cancel</Btn>
          <Btn variant="primary" onClick={add}>
            Add {picked.length > 0 ? `${picked.length} ` : ""}
            {picked.length === 1 ? "line" : "lines"}
          </Btn>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
