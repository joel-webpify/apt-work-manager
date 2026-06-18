import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, ArrowUp, ArrowDown, GripVertical, Mail, Phone, Type, AlignLeft, ListChecks, Hash, Package, Search, CalendarClock, Calculator, ArrowLeft, ArrowRight, CornerDownLeft, Check, CircleDot, CheckSquare, ToggleLeft, Rows3, ChevronDown } from "lucide-react";
import { products as catalog, type Job, type Trade } from "@/data/mockData";
import { createContact } from "@/lib/contactsStore";
import { addJob } from "@/lib/jobsStore";
import { useToast } from "@/hooks/use-toast";

export type FieldType = "text" | "email" | "phone" | "textarea" | "select" | "number" | "radio" | "checkboxes" | "yesno" | "section";

export interface BuilderField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
}

export interface BuilderProduct {
  productId: string;
  quantitySelectable: boolean;
  minQty?: number;
  maxQty?: number;
  required?: boolean;
}

export interface BuilderBooking {
  enabled: boolean;
  mode: "date" | "datetime";
  label: string;
  required: boolean;
  /** Earliest bookable lead time in days from today */
  leadDays?: number;
}

export type BuilderLayout = "single" | "steps";

export interface BuilderForm {
  id: string;
  name: string;
  trade: string;
  description?: string;
  fields: BuilderField[];
  products?: BuilderProduct[];
  productMode?: boolean;
  booking?: BuilderBooking;
  layout?: BuilderLayout;
  /** Show an instant quote summary as the final step */
  quoteMode?: boolean;
}

const fieldTypeMeta: Record<FieldType, { label: string; icon: typeof Type }> = {
  text: { label: "Short text", icon: Type },
  email: { label: "Email", icon: Mail },
  phone: { label: "Phone", icon: Phone },
  textarea: { label: "Long text", icon: AlignLeft },
  select: { label: "Dropdown", icon: ListChecks },
  number: { label: "Number", icon: Hash },
  radio: { label: "Single choice", icon: CircleDot },
  checkboxes: { label: "Multi-select", icon: CheckSquare },
  yesno: { label: "Yes / No", icon: ToggleLeft },
  section: { label: "Section heading", icon: Rows3 },
};

const hasOptions = (t: FieldType) => t === "select" || t === "radio" || t === "checkboxes";

const newField = (type: FieldType): BuilderField => ({
  id: `f-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  type,
  label: fieldTypeMeta[type].label,
  placeholder: "",
  required: false,
  options: hasOptions(type) ? ["Option 1", "Option 2"] : undefined,
});

const defaultBooking = (): BuilderBooking => ({
  enabled: false,
  mode: "datetime",
  label: "Preferred date & time",
  required: true,
  leadDays: 1,
});

export function FormBuilderDialog({
  open,
  onOpenChange,
  initial,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: BuilderForm;
  onSave: (form: BuilderForm) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [trade, setTrade] = useState(initial?.trade ?? "General");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [fields, setFields] = useState<BuilderField[]>(
    initial?.fields ?? [
      { id: "f-name", type: "text", label: "Full name", required: true },
      { id: "f-email", type: "email", label: "Email", required: true },
      { id: "f-phone", type: "phone", label: "Phone", required: false },
      { id: "f-msg", type: "textarea", label: "How can we help?", required: false },
    ],
  );
  const [products, setProducts] = useState<BuilderProduct[]>(initial?.products ?? []);
  const [productMode, setProductMode] = useState<boolean>(initial?.productMode ?? (initial?.products?.length ?? 0) > 0);
  const [booking, setBooking] = useState<BuilderBooking>(initial?.booking ?? defaultBooking());
  const [layout, setLayout] = useState<BuilderLayout>(initial?.layout ?? "single");
  const [quoteMode, setQuoteMode] = useState<boolean>(initial?.quoteMode ?? false);
  const [pickerQuery, setPickerQuery] = useState("");
  const [previewQty, setPreviewQty] = useState<Record<string, number>>({});
  const [previewStep, setPreviewStep] = useState(0);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [bookingValue, setBookingValue] = useState<string>("");
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const update = (id: string, patch: Partial<BuilderField>) =>
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  const remove = (id: string) => setFields((prev) => prev.filter((f) => f.id !== id));
  const move = (id: string, dir: -1 | 1) =>
    setFields((prev) => {
      const i = prev.findIndex((f) => f.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const reorder = (sourceId: string, targetId: string) =>
    setFields((prev) => {
      const from = prev.findIndex((f) => f.id === sourceId);
      const to = prev.findIndex((f) => f.id === targetId);
      if (from < 0 || to < 0 || from === to) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });

  const addProduct = (productId: string) => {
    if (products.some((p) => p.productId === productId)) return;
    setProducts((prev) => [...prev, { productId, quantitySelectable: true, minQty: 1 }]);
    if (!productMode) setProductMode(true);
  };
  const updateProduct = (productId: string, patch: Partial<BuilderProduct>) =>
    setProducts((prev) => prev.map((p) => (p.productId === productId ? { ...p, ...patch } : p)));
  const removeProduct = (productId: string) =>
    setProducts((prev) => prev.filter((p) => p.productId !== productId));

  const availableProducts = useMemo(() => {
    const chosen = new Set(products.map((p) => p.productId));
    const q = pickerQuery.trim().toLowerCase();
    return catalog
      .filter((p) => p.active && !chosen.has(p.id))
      .filter((p) => !q || p.name.toLowerCase().includes(q) || (p.sku ?? "").toLowerCase().includes(q));
  }, [products, pickerQuery]);

  const selectedItems = useMemo(
    () =>
      products
        .map((bp) => {
          const item = catalog.find((c) => c.id === bp.productId);
          if (!item) return null;
          const qty = previewQty[bp.productId] ?? 0;
          return { bp, item, qty, line: qty * item.price };
        })
        .filter((x): x is NonNullable<typeof x> => !!x),
    [products, previewQty],
  );

  const previewTotal = selectedItems.reduce((s, x) => s + x.line, 0);

  // Typeform-style: one field per step in wizard mode. Plus products/booking/quote.
  type StepDef = { key: string; label: string; kind: "field" | "products" | "booking" | "quote"; field?: BuilderField };
  const steps = useMemo<StepDef[]>(() => {
    const s: StepDef[] = fields.filter((f) => f.type !== "section").map((f) => ({ key: `field-${f.id}`, label: f.label, kind: "field", field: f }));
    if (products.length) s.push({ key: "products", label: "Choose products", kind: "products" });
    if (booking.enabled) s.push({ key: "booking", label: booking.label || "Pick a time", kind: "booking" });
    if (quoteMode) s.push({ key: "quote", label: "Your quote", kind: "quote" });
    return s;
  }, [fields, products.length, booking.enabled, booking.label, quoteMode]);

  const isStepped = layout === "steps" && steps.length > 1;
  const safeStepIdx = Math.min(previewStep, Math.max(0, steps.length - 1));
  const currentStep = isStepped ? steps[safeStepIdx] : null;

  const minBookingDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + (booking.leadDays ?? 0));
    return d.toISOString().slice(0, booking.mode === "datetime" ? 16 : 10);
  }, [booking.leadDays, booking.mode]);

  const handlePreviewSubmit = () => {
    const get = (label: string) => {
      const f = fields.find((x) => x.label.toLowerCase() === label.toLowerCase());
      return f ? (fieldValues[f.id] ?? "").trim() : "";
    };
    const emailField = fields.find((f) => f.type === "email");
    const nameField = fields.find((f) => /name/i.test(f.label));
    const phoneField = fields.find((f) => f.type === "phone");
    const email = (emailField ? fieldValues[emailField.id] : "") || `lead+${Date.now()}@example.com`;
    const name = (nameField ? fieldValues[nameField.id] : "") || get("full name") || email.split("@")[0];
    const phone = phoneField ? fieldValues[phoneField.id] ?? "" : "";

    const contactId = createContact({
      name,
      email,
      phone,
      source: `Form: ${trade}`,
      lifecycle: "Lead",
      notes: `Submitted via "${name || "form"}"${bookingValue ? ` · Requested slot ${bookingValue}` : ""}.`,
    });

    const lineItems = selectedItems.filter((x) => x.qty > 0);
    const service = lineItems.length
      ? lineItems.map((x) => `${x.item.name} × ${x.qty}`).join(", ")
      : trade !== "General" ? `${trade} enquiry` : "Form enquiry";
    const value = Math.round(previewTotal);

    const tradeForJob: Trade = (["Plumbing", "Electrical", "Window cleaning", "Landscaping"] as Trade[]).includes(trade as Trade)
      ? (trade as Trade)
      : "General";

    const nowIso = new Date().toISOString().slice(0, 16).replace("T", " ");
    const job: Job = {
      id: `j-form-${Date.now()}`,
      contactId,
      customer: name,
      service,
      trade: tradeForJob,
      value,
      stage: "Quote sent",
      daysInStage: 0,
      address: "",
      notes: `Draft quote from form submission${quoteMode ? ` (instant quote £${value.toFixed(2)})` : ""}.${bookingValue ? ` Preferred slot: ${bookingValue}.` : ""}`,
      quoteValue: value,
      estimatedHours: 1,
      assignments: [],
      timeline: [
        { type: "note", text: `Form submission — draft quote created${bookingValue ? ` for ${bookingValue}` : ""}.`, date: nowIso },
      ],
    };
    addJob(job);

    toast({
      title: "Lead saved · Draft quote created",
      description: `${name} added as a lead${bookingValue ? `, slot ${bookingValue}` : ""}. Find the draft in Pipeline → Quote sent.`,
    });
    setSubmitted(true);
  };



  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      id: initial?.id ?? `form-${Date.now()}`,
      name: name.trim(),
      trade,
      description: description.trim() || undefined,
      fields,
      products: products.length ? products : undefined,
      productMode: products.length ? productMode : false,
      booking: booking.enabled ? booking : undefined,
      layout,
      quoteMode,
    });
    onOpenChange(false);
  };

  const submitLabel = quoteMode
    ? "Get my quote"
    : booking.enabled
      ? "Book now"
      : products.length
        ? "Place order"
        : "Submit";

  const setFieldValue = (id: string, v: string) =>
    setFieldValues((prev) => ({ ...prev, [id]: v }));

  // Renders one field as a full Typeform-style screen
  const renderFieldHero = (f: BuilderField, idx: number, total: number) => {
    const inputType =
      f.type === "number" ? "number" : f.type === "email" ? "email" : f.type === "phone" ? "tel" : "text";
    const value = fieldValues[f.id] ?? "";
    return (
      <div className="space-y-5">
        <div className="text-[11px] tracking-wide uppercase text-muted-foreground">
          Question {idx + 1} of {total}
        </div>
        <h2 className="text-2xl font-medium leading-snug">
          {f.label || "Untitled question"}
          {f.required && <span className="text-destructive ml-1">*</span>}
        </h2>
        {f.placeholder && <p className="text-sm text-muted-foreground">{f.placeholder}</p>}
        <div className="pt-1">
          {f.type === "textarea" ? (
            <Textarea
              autoFocus
              value={value}
              onChange={(e) => setFieldValue(f.id, e.target.value)}
              placeholder="Type your answer…"
              rows={4}
              className="text-base border-0 border-b rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary"
            />
          ) : f.type === "select" || f.type === "radio" ? (
            <div className="space-y-2">
              {(f.options ?? []).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setFieldValue(f.id, opt)}
                  className={`w-full text-left px-4 py-3 rounded-md border-hairline text-sm transition-colors ${
                    value === opt ? "bg-primary/10 border-primary text-foreground" : "hover:bg-surface-hover"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          ) : f.type === "yesno" ? (
            <div className="grid grid-cols-2 gap-2">
              {["Yes", "No"].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setFieldValue(f.id, opt)}
                  className={`px-4 py-3 rounded-md border-hairline text-sm transition-colors ${
                    value === opt ? "bg-primary/10 border-primary text-foreground" : "hover:bg-surface-hover"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          ) : f.type === "checkboxes" ? (
            <div className="space-y-2">
              {(f.options ?? []).map((opt) => {
                const set = new Set(value ? value.split("||") : []);
                const checked = set.has(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      if (checked) set.delete(opt); else set.add(opt);
                      setFieldValue(f.id, Array.from(set).join("||"));
                    }}
                    className={`w-full text-left px-4 py-3 rounded-md border-hairline text-sm transition-colors flex items-center gap-3 ${
                      checked ? "bg-primary/10 border-primary text-foreground" : "hover:bg-surface-hover"
                    }`}
                  >
                    <span className={`w-4 h-4 rounded border flex items-center justify-center ${checked ? "bg-primary border-primary text-primary-foreground" : "border-input"}`}>
                      {checked && <Check className="w-3 h-3" />}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>
          ) : (
            <Input
              autoFocus
              type={inputType}
              value={value}
              onChange={(e) => setFieldValue(f.id, e.target.value)}
              placeholder="Type your answer…"
              className="h-12 text-lg border-0 border-b rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary"
            />
          )}
        </div>
        <p className="text-[11px] text-muted-foreground inline-flex items-center gap-1.5">
          press <kbd className="px-1.5 py-0.5 rounded bg-surface border-hairline text-[10px]">Enter ↵</kbd> to continue
        </p>
      </div>
    );
  };

  const renderFieldInput = (f: BuilderField) => {
    if (f.type === "textarea") {
      return (
        <Textarea
          placeholder={f.placeholder}
          rows={3}
          value={fieldValues[f.id] ?? ""}
          onChange={(e) => setFieldValue(f.id, e.target.value)}
        />
      );
    }
    if (f.type === "select") {
      return (
        <Select value={fieldValues[f.id] ?? ""} onValueChange={(v) => setFieldValue(f.id, v)}>
          <SelectTrigger><SelectValue placeholder={f.placeholder || "Select..."} /></SelectTrigger>
          <SelectContent>
            {(f.options ?? []).map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
          </SelectContent>
        </Select>
      );
    }
    if (f.type === "radio") {
      return (
        <div className="space-y-1.5">
          {(f.options ?? []).map((o) => (
            <label key={o} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name={f.id}
                checked={(fieldValues[f.id] ?? "") === o}
                onChange={() => setFieldValue(f.id, o)}
              />
              {o}
            </label>
          ))}
        </div>
      );
    }
    if (f.type === "yesno") {
      return (
        <div className="flex gap-2">
          {["Yes", "No"].map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => setFieldValue(f.id, o)}
              className={`flex-1 h-9 rounded-md border-hairline text-sm transition-colors ${
                (fieldValues[f.id] ?? "") === o ? "bg-primary/10 border-primary" : "hover:bg-surface-hover"
              }`}
            >
              {o}
            </button>
          ))}
        </div>
      );
    }
    if (f.type === "checkboxes") {
      return (
        <div className="space-y-1.5">
          {(f.options ?? []).map((o) => {
            const set = new Set((fieldValues[f.id] ?? "") ? (fieldValues[f.id] ?? "").split("||") : []);
            const checked = set.has(o);
            return (
              <label key={o} className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={checked}
                  onCheckedChange={(v) => {
                    if (v) set.add(o); else set.delete(o);
                    setFieldValue(f.id, Array.from(set).join("||"));
                  }}
                />
                {o}
              </label>
            );
          })}
        </div>
      );
    }
    return (
      <Input
        type={f.type === "number" ? "number" : f.type === "email" ? "email" : f.type === "phone" ? "tel" : "text"}
        placeholder={f.placeholder}
        value={fieldValues[f.id] ?? ""}
        onChange={(e) => setFieldValue(f.id, e.target.value)}
      />
    );
  };

  const renderFieldRow = (f: BuilderField) => (
    <div key={f.id} className="space-y-1.5">
      <Label className="text-xs">
        {f.label} {f.required && <span className="text-destructive">*</span>}
      </Label>
      {renderFieldInput(f)}
    </div>
  );

  // Group fields into sections for the single-page layout
  const fieldGroups = useMemo(() => {
    const groups: { id: string; label: string | null; fields: BuilderField[] }[] = [
      { id: "__top", label: null, fields: [] },
    ];
    for (const f of fields) {
      if (f.type === "section") {
        groups.push({ id: f.id, label: f.label || "Section", fields: [] });
      } else {
        groups[groups.length - 1].fields.push(f);
      }
    }
    return groups.filter((g) => g.fields.length > 0 || g.label !== null);
  }, [fields]);

  const renderDetails = () => (
    <div className="space-y-3">
      {fieldGroups.map((g) => {
        if (g.label === null) {
          return (
            <div key={g.id} className="space-y-3">
              {g.fields.map(renderFieldRow)}
            </div>
          );
        }
        const collapsed = !!collapsedSections[g.id];
        return (
          <div key={g.id} className="border-hairline rounded-md overflow-hidden">
            <button
              type="button"
              onClick={() => setCollapsedSections((p) => ({ ...p, [g.id]: !p[g.id] }))}
              className="w-full flex items-center justify-between px-3 h-9 bg-surface/60 hover:bg-surface-hover transition-colors"
            >
              <span className="text-xs font-medium">{g.label}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${collapsed ? "-rotate-90" : ""}`} />
            </button>
            {!collapsed && (
              <div className="p-3 space-y-3">
                {g.fields.map(renderFieldRow)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const renderProducts = () =>
    products.length > 0 && (
      <div className="space-y-2">
        <Label className="text-xs">
          Choose products {productMode && <span className="text-destructive">*</span>}
        </Label>
        <div className="space-y-1.5">
          {selectedItems.map(({ bp, item, qty }) => (
            <div key={bp.productId} className="flex items-center gap-2 border-hairline rounded-md px-2.5 py-2">
              <Checkbox
                checked={qty > 0}
                onCheckedChange={(v) =>
                  setPreviewQty((p) => ({ ...p, [bp.productId]: v ? Math.max(1, bp.minQty ?? 1) : 0 }))
                }
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm truncate">{item.name}</div>
                <div className="text-xs text-muted-foreground tabular-nums">£{item.price.toFixed(2)} / {item.unit}</div>
              </div>
              {bp.quantitySelectable && qty > 0 && (
                <Input
                  type="number"
                  min={bp.minQty ?? 0}
                  max={bp.maxQty}
                  value={qty}
                  onChange={(e) =>
                    setPreviewQty((p) => ({ ...p, [bp.productId]: Math.max(0, Number(e.target.value) || 0) }))
                  }
                  className="h-7 w-16 text-xs"
                />
              )}
              <div className="text-xs tabular-nums w-16 text-right">£{(qty * item.price).toFixed(2)}</div>
            </div>
          ))}
        </div>
        {!quoteMode && (
          <div className="flex items-center justify-between pt-1 text-sm">
            <span className="text-muted-foreground">Total</span>
            <span className="font-medium tabular-nums">£{previewTotal.toFixed(2)}</span>
          </div>
        )}
      </div>
    );

  const renderBooking = () =>
    booking.enabled && (
      <div className="space-y-1.5">
        <Label className="text-xs">
          {booking.label} {booking.required && <span className="text-destructive">*</span>}
        </Label>
        <Input
          type={booking.mode === "datetime" ? "datetime-local" : "date"}
          min={minBookingDate}
          value={bookingValue}
          onChange={(e) => setBookingValue(e.target.value)}
        />
        {booking.leadDays ? (
          <p className="text-[11px] text-muted-foreground">Earliest available: {(booking.leadDays)} day(s) from today.</p>
        ) : null}
      </div>
    );


  const renderQuote = () => (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Calculator className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium">Instant quote</span>
      </div>
      <div className="border-hairline rounded-md divide-y divide-border">
        {selectedItems.filter((x) => x.qty > 0).length === 0 ? (
          <div className="p-3 text-xs text-muted-foreground text-center">Select products to see your quote.</div>
        ) : (
          selectedItems
            .filter((x) => x.qty > 0)
            .map(({ bp, item, qty, line }) => (
              <div key={bp.productId} className="px-3 py-2 flex items-center justify-between text-sm">
                <span className="truncate">{item.name} <span className="text-muted-foreground">× {qty}</span></span>
                <span className="tabular-nums">£{line.toFixed(2)}</span>
              </div>
            ))
        )}
      </div>
      <div className="flex items-center justify-between text-sm pt-1">
        <span className="text-muted-foreground">Estimated total</span>
        <span className="text-base font-semibold tabular-nums">£{previewTotal.toFixed(2)}</span>
      </div>
      <p className="text-[11px] text-muted-foreground">
        This is an instant estimate. We'll confirm the final price after reviewing your request.
      </p>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit form" : "New form"}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-[1fr_1fr] gap-6 overflow-hidden flex-1">
          {/* Left — config */}
          <div className="overflow-y-auto pr-2 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Form name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Boiler service quote" />
              </div>
              <div className="space-y-1.5">
                <Label>Trade</Label>
                <Select value={trade} onValueChange={setTrade}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["General", "Plumbing", "Electrical", "Window cleaning", "Landscaping"].map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Description (optional)</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Shown above the form on your site" />
            </div>

            {/* Layout & quote */}
            <div className="border-hairline rounded-lg p-3 space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Layout</Label>
                <Select value={layout} onValueChange={(v: BuilderLayout) => { setLayout(v); setPreviewStep(0); }}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single page</SelectItem>
                    <SelectItem value="steps">Step-by-step (wizard)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  Step mode walks customers through details, products, booking and an instant quote.
                </p>
              </div>
              <label className="flex items-center justify-between gap-2 text-sm">
                <span className="inline-flex items-center gap-2">
                  <Calculator className="w-3.5 h-3.5 text-muted-foreground" />
                  Instant quote summary
                </span>
                <Switch checked={quoteMode} onCheckedChange={setQuoteMode} />
              </label>
              {quoteMode && products.length === 0 && (
                <p className="text-[11px] text-amber-600">Add at least one product so the quote has something to total.</p>
              )}
            </div>

            <div className="border-hairline rounded-lg">
              <div className="px-3 h-10 flex items-center justify-between border-b-hairline">
                <span className="text-sm font-medium">Fields</span>
                <Select onValueChange={(v) => setFields((p) => [...p, newField(v as FieldType)])}>
                  <SelectTrigger className="h-7 w-[150px] text-xs">
                    <Plus className="w-3 h-3 mr-1" /><SelectValue placeholder="Add field" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(fieldTypeMeta) as FieldType[]).map((t) => {
                      const Icon = fieldTypeMeta[t].icon;
                      return (
                        <SelectItem key={t} value={t}>
                          <span className="inline-flex items-center gap-2"><Icon className="w-3.5 h-3.5" />{fieldTypeMeta[t].label}</span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="divide-y divide-border">
                {fields.map((f, idx) => {
                  const Icon = fieldTypeMeta[f.type].icon;
                  const isDragging = dragId === f.id;
                  const isOver = dragOverId === f.id && dragId && dragId !== f.id;
                  return (
                    <div
                      key={f.id}
                      onDragOver={(e) => {
                        if (!dragId) return;
                        e.preventDefault();
                        if (dragOverId !== f.id) setDragOverId(f.id);
                      }}
                      onDragLeave={() => {
                        if (dragOverId === f.id) setDragOverId(null);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (dragId && dragId !== f.id) reorder(dragId, f.id);
                        setDragId(null);
                        setDragOverId(null);
                      }}
                      className={`p-3 space-y-2 transition-colors ${isDragging ? "opacity-40" : ""} ${isOver ? "bg-surface-hover" : ""}`}
                    >
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          draggable
                          onDragStart={(e) => {
                            setDragId(f.id);
                            e.dataTransfer.effectAllowed = "move";
                          }}
                          onDragEnd={() => {
                            setDragId(null);
                            setDragOverId(null);
                          }}
                          className="cursor-grab active:cursor-grabbing p-1 -m-1 rounded hover:bg-surface text-muted-foreground"
                          aria-label="Drag to reorder"
                        >
                          <GripVertical className="w-3.5 h-3.5" />
                        </button>
                        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                        <Input
                          value={f.label}
                          onChange={(e) => update(f.id, { label: e.target.value })}
                          className="h-8 flex-1"
                          placeholder="Field label"
                        />
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => move(f.id, -1)} disabled={idx === 0}>
                          <ArrowUp className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => move(f.id, 1)} disabled={idx === fields.length - 1}>
                          <ArrowDown className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => remove(f.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                      {f.type !== "section" && (
                        <div className="flex items-center gap-3 pl-6">
                          <Input
                            value={f.placeholder ?? ""}
                            onChange={(e) => update(f.id, { placeholder: e.target.value })}
                            className="h-7 text-xs flex-1"
                            placeholder="Placeholder text"
                          />
                          <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Checkbox checked={f.required} onCheckedChange={(v) => update(f.id, { required: !!v })} />
                            Required
                          </label>
                        </div>
                      )}
                      {hasOptions(f.type) && (
                        <div className="pl-6">
                          <Textarea
                            value={(f.options ?? []).join("\n")}
                            onChange={(e) => update(f.id, { options: e.target.value.split("\n").filter(Boolean) })}
                            rows={3}
                            className="text-xs"
                            placeholder={"One option per line"}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
                {fields.length === 0 && (
                  <div className="p-6 text-center text-sm text-muted-foreground">No fields yet — add one above.</div>
                )}
              </div>
            </div>

            {/* Products / Booking */}
            <div className="border-hairline rounded-lg">
              <div className="px-3 h-10 flex items-center justify-between border-b-hairline">
                <div className="flex items-center gap-2">
                  <Package className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-sm font-medium">Products</span>
                </div>
                {products.length > 0 && (
                  <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                    Require a selection
                    <Switch checked={productMode} onCheckedChange={setProductMode} />
                  </label>
                )}
              </div>

              <div className="p-3 space-y-3">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    value={pickerQuery}
                    onChange={(e) => setPickerQuery(e.target.value)}
                    placeholder="Search products to add…"
                    className="h-8 pl-8 text-sm"
                  />
                  {pickerQuery && availableProducts.length > 0 && (
                    <div className="absolute z-10 left-0 right-0 mt-1 bg-popover border-hairline rounded-md shadow-md max-h-56 overflow-y-auto">
                      {availableProducts.slice(0, 8).map((p) => (
                        <button
                          key={p.id}
                          onClick={() => { addProduct(p.id); setPickerQuery(""); }}
                          className="w-full text-left px-3 py-2 hover:bg-surface-hover flex items-center justify-between"
                        >
                          <span className="text-sm">{p.name}</span>
                          <span className="text-xs tabular-nums text-muted-foreground">£{p.price.toFixed(2)} / {p.unit}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {products.length === 0 ? (
                  <div className="text-center text-xs text-muted-foreground py-6">
                    No products attached. Add one to turn this into a product, booking, or quote form.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {products.map((bp) => {
                      const item = catalog.find((c) => c.id === bp.productId);
                      if (!item) return null;
                      return (
                        <div key={bp.productId} className="border-hairline rounded-md p-2.5 space-y-2">
                          <div className="flex items-center gap-2">
                            <Package className="w-3.5 h-3.5 text-muted-foreground" />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">{item.name}</div>
                              <div className="text-xs text-muted-foreground tabular-nums">
                                £{item.price.toFixed(2)} / {item.unit}{item.sku ? ` · ${item.sku}` : ""}
                              </div>
                            </div>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeProduct(bp.productId)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                          <div className="flex items-center gap-3 flex-wrap pl-6">
                            <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Checkbox
                                checked={bp.quantitySelectable}
                                onCheckedChange={(v) => updateProduct(bp.productId, { quantitySelectable: !!v })}
                              />
                              Customer picks quantity
                            </label>
                            {bp.quantitySelectable && (
                              <>
                                <div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                  Min
                                  <Input
                                    type="number"
                                    min={0}
                                    value={bp.minQty ?? 1}
                                    onChange={(e) => updateProduct(bp.productId, { minQty: Number(e.target.value) || 0 })}
                                    className="h-7 w-16 text-xs"
                                  />
                                </div>
                                <div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                  Max
                                  <Input
                                    type="number"
                                    min={0}
                                    value={bp.maxQty ?? ""}
                                    onChange={(e) => updateProduct(bp.productId, { maxQty: e.target.value === "" ? undefined : Number(e.target.value) })}
                                    className="h-7 w-16 text-xs"
                                    placeholder="—"
                                  />
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Booking */}
            <div className="border-hairline rounded-lg">
              <div className="px-3 h-10 flex items-center justify-between border-b-hairline">
                <div className="flex items-center gap-2">
                  <CalendarClock className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-sm font-medium">Booking date & time</span>
                </div>
                <Switch
                  checked={booking.enabled}
                  onCheckedChange={(v) => setBooking((b) => ({ ...b, enabled: v }))}
                />
              </div>
              {booking.enabled && (
                <div className="p-3 space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Field label</Label>
                    <Input
                      value={booking.label}
                      onChange={(e) => setBooking((b) => ({ ...b, label: e.target.value }))}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Type</Label>
                      <Select
                        value={booking.mode}
                        onValueChange={(v: "date" | "datetime") => setBooking((b) => ({ ...b, mode: v }))}
                      >
                        <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="date">Date only</SelectItem>
                          <SelectItem value="datetime">Date & time</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Lead time (days)</Label>
                      <Input
                        type="number"
                        min={0}
                        value={booking.leadDays ?? 0}
                        onChange={(e) => setBooking((b) => ({ ...b, leadDays: Math.max(0, Number(e.target.value) || 0) }))}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                  <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                    <Checkbox
                      checked={booking.required}
                      onCheckedChange={(v) => setBooking((b) => ({ ...b, required: !!v }))}
                    />
                    Required
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Right — preview */}
          <div className="overflow-y-auto border-hairline rounded-lg bg-surface/40 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Live preview</div>
              {(submitted || Object.keys(fieldValues).length > 0 || bookingValue || Object.values(previewQty).some((v) => v > 0)) && (
                <button
                  type="button"
                  onClick={() => { setFieldValues({}); setBookingValue(""); setPreviewQty({}); setPreviewStep(0); setSubmitted(false); }}
                  className="text-[11px] text-muted-foreground hover:text-foreground underline underline-offset-2"
                >
                  Reset
                </button>
              )}
            </div>

            {isStepped ? (
              <div className="bg-card border-hairline rounded-lg min-h-[480px] flex flex-col">
                {/* progress bar */}
                <div className="px-6 pt-5">
                  <div className="flex items-center gap-1">
                    {steps.map((s, i) => (
                      <div
                        key={s.key}
                        className={`h-1 flex-1 rounded-full transition-colors ${i <= safeStepIdx ? "bg-primary" : "bg-border"}`}
                      />
                    ))}
                  </div>
                  <div className="mt-2 text-[11px] text-muted-foreground">
                    {name || "Form name"}
                  </div>
                </div>

                {/* hero step */}
                <div className="flex-1 px-8 py-10 flex items-center">
                  <div className="w-full max-w-md mx-auto">
                    {submitted ? (
                      <div className="text-center space-y-3">
                        <div className="w-12 h-12 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
                          <Check className="w-6 h-6" />
                        </div>
                        <h2 className="text-2xl font-medium">Thanks — we'll be in touch.</h2>
                        <p className="text-sm text-muted-foreground">
                          Your request has been saved as a lead{bookingValue ? `, for ${bookingValue}` : ""}.
                        </p>
                      </div>
                    ) : currentStep?.kind === "field" && currentStep.field ? (
                      renderFieldHero(
                        currentStep.field,
                        safeStepIdx,
                        steps.length,
                      )
                    ) : currentStep?.kind === "products" ? (
                      <div className="space-y-4">
                        <h2 className="text-2xl font-medium leading-snug">Choose what you need</h2>
                        <p className="text-sm text-muted-foreground">Tick anything that applies — adjust quantities to match.</p>
                        {renderProducts()}
                      </div>
                    ) : currentStep?.kind === "booking" ? (
                      <div className="space-y-4">
                        <h2 className="text-2xl font-medium leading-snug">{booking.label || "When works for you?"}</h2>
                        <p className="text-sm text-muted-foreground">Pick your preferred slot — we'll confirm by email.</p>
                        {renderBooking()}
                      </div>
                    ) : currentStep?.kind === "quote" ? (
                      <div className="space-y-4">
                        <h2 className="text-2xl font-medium leading-snug">Here's your instant quote</h2>
                        {renderQuote()}
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* nav */}
                {!submitted && (
                  <div className="px-6 py-4 border-t-hairline flex items-center justify-between">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPreviewStep((s) => Math.max(0, s - 1))}
                      disabled={safeStepIdx === 0}
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Back
                    </Button>
                    <div className="text-[11px] text-muted-foreground">
                      {safeStepIdx + 1} / {steps.length}
                    </div>
                    {safeStepIdx < steps.length - 1 ? (
                      <Button size="sm" onClick={() => setPreviewStep((s) => Math.min(steps.length - 1, s + 1))}>
                        OK <CornerDownLeft className="w-3.5 h-3.5" />
                      </Button>
                    ) : (
                      <Button size="sm" onClick={handlePreviewSubmit}>
                        {submitLabel} <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-card border-hairline rounded-lg p-5 space-y-4">
                <div>
                  <h3 className="text-base font-medium">{name || "Form name"}</h3>
                  {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
                </div>
                {submitted ? (
                  <div className="text-center space-y-2 py-6">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
                      <Check className="w-5 h-5" />
                    </div>
                    <div className="text-sm font-medium">Thanks — we'll be in touch.</div>
                    <p className="text-xs text-muted-foreground">Saved as a lead{bookingValue ? `, for ${bookingValue}` : ""}.</p>
                  </div>
                ) : (
                  <>
                    {renderDetails()}
                    {products.length > 0 && <div className="pt-2 border-t-hairline">{renderProducts()}</div>}
                    {booking.enabled && <div className="pt-2 border-t-hairline">{renderBooking()}</div>}
                    {quoteMode && <div className="pt-2 border-t-hairline">{renderQuote()}</div>}
                    <Button className="w-full" onClick={handlePreviewSubmit}>{submitLabel}</Button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>


        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!name.trim()}>{initial ? "Save changes" : "Create form"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
