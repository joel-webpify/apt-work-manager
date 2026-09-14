import { useState } from "react";
import { Package, Plus, Trash2 } from "lucide-react";
import { products, type ProductKind, type ProductUnit } from "@/data/mockData";
import {
  addMaterial,
  materialKind,
  materialsCharge,
  materialsCost,
  removeMaterial,
  updateMaterial,
  useMaterials,
} from "@/lib/materialsStore";
import { fmt } from "@/lib/quoteUtils";

const units: ProductUnit[] = ["each", "hour", "day", "sqm", "m", "visit"];
const kindOf = (p: { kind?: ProductKind }): ProductKind => p.kind ?? "product";

export default function MaterialsList({
  jobId,
  addedBy,
  readOnly,
  compact,
  kind,
}: {
  jobId: string;
  addedBy?: string;
  readOnly?: boolean;
  compact?: boolean;
  /** Show only products or only services. Leave out for everything. */
  kind?: ProductKind;
}) {
  const all = useMaterials(jobId);
  const list = kind ? all.filter((m) => materialKind(m) === kind) : all;
  const [picking, setPicking] = useState(false);
  const [pickKind, setPickKind] = useState<ProductKind | "all">(kind ?? "all");
  const cost = materialsCost(list);
  const charge = materialsCharge(list);

  const catalogue = products.filter(
    (p) => p.active && (pickKind === "all" || kindOf(p) === pickKind),
  );
  const noun = kind === "service" ? "Work" : kind === "product" ? "Materials" : "Materials";

  return (
    <div className="space-y-3">
      {list.length === 0 && (
        <p className="text-xs text-muted-foreground">Nothing added yet. Add what you used so the job costs are right.</p>
      )}

      {list.map((m) => (
        <div key={m.id} className="rounded-lg border-hairline bg-surface p-3 space-y-2">
          <div className="flex items-start gap-2">
            <input
              value={m.name}
              readOnly={readOnly}
              onChange={(e) => updateMaterial(jobId, m.id, { name: e.target.value })}
              placeholder="What did you use?"
              className="h-9 flex-1 rounded-lg border-hairline bg-background px-2.5 text-sm font-medium"
            />
            {!readOnly && (
              <button
                type="button"
                onClick={() => removeMaterial(jobId, m.id)}
                className="w-9 h-9 rounded-lg border-hairline bg-background inline-flex items-center justify-center shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Field label="Quantity">
              <input
                value={m.qty}
                readOnly={readOnly}
                inputMode="decimal"
                onChange={(e) => updateMaterial(jobId, m.id, { qty: Number(e.target.value) || 0 })}
                className="h-9 w-full rounded-lg border-hairline bg-background px-2.5 text-sm"
              />
            </Field>
            <Field label="Unit">
              <select
                value={m.unit}
                disabled={readOnly}
                onChange={(e) => updateMaterial(jobId, m.id, { unit: e.target.value as ProductUnit })}
                className="h-9 w-full rounded-lg border-hairline bg-background px-2 text-sm"
              >
                {units.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Cost you paid £">
              <input
                value={m.cost}
                readOnly={readOnly}
                inputMode="decimal"
                onChange={(e) => updateMaterial(jobId, m.id, { cost: Number(e.target.value) || 0 })}
                className="h-9 w-full rounded-lg border-hairline bg-background px-2.5 text-sm"
              />
            </Field>
            <Field label="Customer pays £">
              <input
                value={m.price}
                readOnly={readOnly}
                inputMode="decimal"
                onChange={(e) => updateMaterial(jobId, m.id, { price: Number(e.target.value) || 0 })}
                className="h-9 w-full rounded-lg border-hairline bg-background px-2.5 text-sm"
              />
            </Field>
          </div>

          {!compact && (
            <div className="grid grid-cols-2 gap-2">
              <Field label="Supplier">
                <input
                  value={m.supplier ?? ""}
                  readOnly={readOnly}
                  onChange={(e) => updateMaterial(jobId, m.id, { supplier: e.target.value })}
                  className="h-9 w-full rounded-lg border-hairline bg-background px-2.5 text-sm"
                  placeholder="e.g. Screwfix"
                />
              </Field>
              <Field label="Note">
                <input
                  value={m.note ?? ""}
                  readOnly={readOnly}
                  onChange={(e) => updateMaterial(jobId, m.id, { note: e.target.value })}
                  className="h-9 w-full rounded-lg border-hairline bg-background px-2.5 text-sm"
                  placeholder="Anything to remember"
                />
              </Field>
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              type="button"
              disabled={readOnly}
              onClick={() => updateMaterial(jobId, m.id, { chargeable: !m.chargeable })}
              className={`h-8 px-2.5 rounded-lg text-[11px] font-medium border-hairline ${
                m.chargeable ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground"
              }`}
            >
              {m.chargeable ? "Charged to customer" : "Not charged"}
            </button>
            <span className="text-[11px] text-muted-foreground">
              Cost {fmt(m.qty * m.cost)} · Charge {m.chargeable ? fmt(m.qty * m.price) : "—"}
              {m.billedOn ? ` · on ${m.billedOn}` : ""}
            </span>
          </div>
        </div>
      ))}

      {!readOnly && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => addMaterial(jobId, { addedBy })}
            className="h-10 px-3 rounded-lg border-hairline bg-background text-sm font-medium inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add by hand
          </button>
          <button
            type="button"
            onClick={() => setPicking((v) => !v)}
            className="h-10 px-3 rounded-lg border-hairline bg-background text-sm font-medium inline-flex items-center gap-1.5"
          >
            <Package className="w-4 h-4" /> From the catalogue
          </button>
        </div>
      )}

      {picking && !readOnly && (
        <div className="rounded-lg border-hairline bg-surface p-2 max-h-64 overflow-auto space-y-1">
          {!kind && (
            <div className="flex gap-1 px-0.5 pb-1">
              {(["all", "product", "service"] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setPickKind(k)}
                  className={`h-7 px-2.5 rounded-lg text-[11px] font-medium border-hairline ${
                    pickKind === k
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground"
                  }`}
                >
                  {k === "all" ? "All" : k === "product" ? "Products" : "Services"}
                </button>
              ))}
            </div>
          )}
          {catalogue.length === 0 && (
            <p className="px-2.5 py-2 text-xs text-muted-foreground">Nothing in the catalogue for this.</p>
          )}
          {catalogue.map((p) => {
            const isService = kindOf(p) === "service";
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  addMaterial(jobId, {
                    productId: p.id,
                    kind: kindOf(p),
                    name: p.name,
                    qty: isService && p.typicalHours && p.unit === "hour" ? p.typicalHours : 1,
                    unit: p.unit,
                    price: p.price,
                    cost: p.cost ?? Math.round(p.price * 0.6 * 100) / 100,
                    taxRate: p.taxRate,
                    supplier: p.supplier,
                    addedBy,
                  });
                  setPicking(false);
                }}
                className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-surface-hover"
              >
                <p className="text-sm font-medium">{p.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {isService ? "Service" : "Product"} · {p.trade} · {fmt(p.price)} per {p.unit}
                </p>
              </button>
            );
          })}
        </div>
      )}

      {list.length > 0 && (
        <div className="flex items-center justify-between rounded-lg bg-surface px-3 py-2 text-xs">
          <span className="text-muted-foreground">{noun} cost</span>
          <span className="font-semibold">{fmt(cost)}</span>
          <span className="text-muted-foreground">Charged on</span>
          <span className="font-semibold">{fmt(charge)}</span>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] text-muted-foreground mb-1">{label}</span>
      {children}
    </label>
  );
}
