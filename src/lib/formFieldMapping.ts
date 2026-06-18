import { useEffect, useState } from "react";
import type { JobCustomField } from "./jobFields";

/** Built-in job fields you can map a form field to. */
export type CoreJobTarget =
  | "customer"
  | "service"
  | "trade"
  | "postcode"
  | "address"
  | "value"
  | "notes"
  | "phone"
  | "email"
  | "bookingSlot"
  | "products"
  | "quoteTotal";

/** Custom-field targets use the prefix `cf:<fieldId>` so we can route arbitrary fields. */
export type MappingTarget = CoreJobTarget | `cf:${string}` | "ignore";

export interface FieldMappingRule {
  /** Form field id OR plain label string. */
  source: string;
  target: MappingTarget;
}

export const CORE_TARGET_META: Record<CoreJobTarget, { label: string }> = {
  customer: { label: "Customer name" },
  service: { label: "Service" },
  trade: { label: "Trade" },
  postcode: { label: "Postcode" },
  address: { label: "Address" },
  value: { label: "Quote value (£)" },
  notes: { label: "Job notes" },
  phone: { label: "Phone" },
  email: { label: "Email" },
  bookingSlot: { label: "Booking slot (date/time)" },
  products: { label: "Selected products" },
  quoteTotal: { label: "Instant quote total (£)" },
};

const PER_FORM_KEY = "form-field-mapping-v1";

/** Heuristic global mapping based on common label words. */
export function guessTarget(label: string, schema: JobCustomField[]): MappingTarget {
  const l = label.trim().toLowerCase();
  if (!l) return "ignore";
  const has = (...kws: string[]) => kws.some((k) => l.includes(k));

  if (has("booking slot", "preferred slot", "appointment", "preferred date", "preferred time", "schedule")) return "bookingSlot";
  if (has("selected products", "chosen products", "products", "line items", "basket", "cart")) return "products";
  if (has("instant quote", "quote total", "estimated total", "your quote")) return "quoteTotal";
  if (has("full name", "your name", "customer", "contact name")) return "customer";
  if (has("name") && !has("company", "business", "product")) return "customer";
  if (has("email")) return "email";
  if (has("phone", "mobile", "tel")) return "phone";
  if (has("service", "what do you need", "type of work")) return "service";
  if (has("trade")) return "trade";
  if (has("postcode", "post code", "zip")) return "postcode";
  if (has("address", "street")) return "address";
  if (has("budget", "price")) return "value";
  if (has("quote value", "quote amount")) return "quoteTotal";
  if (has("message", "details", "tell us", "how can we help", "notes", "description")) return "notes";

  // Try matching a custom-field label
  for (const f of schema) {
    if (f.label.toLowerCase() === l) return `cf:${f.id}` as MappingTarget;
  }
  // Keyword routing to common custom fields
  if (has("priority", "urgency")) {
    const f = schema.find((s) => s.label.toLowerCase().includes("priority"));
    if (f) return `cf:${f.id}` as MappingTarget;
  }
  if (has("source", "how did you hear", "referral")) {
    const f = schema.find((s) => s.label.toLowerCase().includes("source"));
    if (f) return `cf:${f.id}` as MappingTarget;
  }
  if (has("access", "key")) {
    const f = schema.find((s) => s.label.toLowerCase().includes("access"));
    if (f) return `cf:${f.id}` as MappingTarget;
  }
  if (has("deadline", "by when", "when do you need")) {
    const f = schema.find((s) => s.label.toLowerCase().includes("deadline"));
    if (f) return `cf:${f.id}` as MappingTarget;
  }
  if (has("preferred time", "best time")) {
    const f = schema.find((s) => s.label.toLowerCase().includes("time"));
    if (f) return `cf:${f.id}` as MappingTarget;
  }
  return "ignore";
}

/** Per-form override map: formId → (sourceField → target). */
type OverrideMap = Record<string, Record<string, MappingTarget>>;

function loadOverrides(): OverrideMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(PER_FORM_KEY);
    return raw ? (JSON.parse(raw) as OverrideMap) : {};
  } catch {
    return {};
  }
}

export function useFormMappingOverrides() {
  const [map, setMap] = useState<OverrideMap>(loadOverrides);
  useEffect(() => {
    try {
      localStorage.setItem(PER_FORM_KEY, JSON.stringify(map));
    } catch {
      /* ignore */
    }
  }, [map]);

  const setFormMapping = (formId: string, overrides: Record<string, MappingTarget>) => {
    setMap((prev) => ({ ...prev, [formId]: overrides }));
  };

  return { overrides: map, setFormMapping };
}

/** Apply mapping to a submission's values, returning a partial job payload. */
export interface MappedSubmission {
  core: Partial<Record<CoreJobTarget, string | number>>;
  customFields: Record<string, string | number | boolean>;
}

export function applyMapping(
  values: Record<string, unknown>,
  schema: JobCustomField[],
  overrides: Record<string, MappingTarget> | undefined,
): MappedSubmission {
  const out: MappedSubmission = { core: {}, customFields: {} };
  for (const [label, raw] of Object.entries(values)) {
    if (raw === undefined || raw === null || raw === "") continue;
    const override = overrides?.[label];
    const target: MappingTarget = override ?? guessTarget(label, schema);
    if (target === "ignore") continue;
    if (target.startsWith("cf:")) {
      const id = target.slice(3);
      out.customFields[id] = typeof raw === "boolean" ? raw : String(raw);
    } else if (target === "value" || target === "quoteTotal") {
      const n = typeof raw === "number" ? raw : parseFloat(String(raw).replace(/[^\d.]/g, ""));
      if (!Number.isNaN(n)) out.core[target] = n;
    } else {
      out.core[target as CoreJobTarget] = String(raw);
    }
  }
  return out;
}
