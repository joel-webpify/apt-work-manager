import type { QuoteLineItem, QuoteSelection, Quote } from "@/data/mockData";

export function lineSubtotal(li: QuoteLineItem) {
  const gross = li.qty * li.unitPrice;
  const discounted = gross * (1 - (li.discount ?? 0) / 100);
  return discounted;
}

export function lineTax(li: QuoteLineItem) {
  return lineSubtotal(li) * (li.taxRate / 100);
}

export function lineTotal(li: QuoteLineItem) {
  return lineSubtotal(li) + lineTax(li);
}

export function totals(items: QuoteLineItem[]) {
  const subtotal = items.reduce((s, li) => s + lineSubtotal(li), 0);
  const tax = items.reduce((s, li) => s + lineTax(li), 0);
  return { subtotal, tax, total: subtotal + tax };
}

export function fmt(n: number) {
  return `£${n.toFixed(2)}`;
}

export function fmtDate(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function fmtDateTime(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const lineKind = (li: QuoteLineItem) => li.kind ?? "included";

/** Does this document offer the customer anything to choose? */
export function hasCustomerChoices(items: QuoteLineItem[]) {
  return items.some((li) => lineKind(li) !== "included");
}

export interface ChoiceGroup {
  id: string;
  label: string;
  options: QuoteLineItem[];
}

/** Choice lines grouped by their groupId, in first-appearance order. */
export function choiceGroups(items: QuoteLineItem[]): ChoiceGroup[] {
  const out: ChoiceGroup[] = [];
  items.forEach((li) => {
    if (lineKind(li) !== "choice") return;
    const id = li.groupId ?? li.id;
    let g = out.find((x) => x.id === id);
    if (!g) {
      g = { id, label: li.groupLabel || "Choose an option", options: [] };
      out.push(g);
    }
    if (!g.label && li.groupLabel) g.label = li.groupLabel;
    g.options.push(li);
  });
  return out;
}

export function optionalItems(items: QuoteLineItem[]) {
  return items.filter((li) => lineKind(li) === "optional");
}

export function includedItems(items: QuoteLineItem[]) {
  return items.filter((li) => lineKind(li) === "included");
}

/** The selection the quote starts from — cheapest/default option per group, pre-ticked extras. */
export function defaultSelection(items: QuoteLineItem[]): QuoteSelection {
  const chosen: Record<string, string> = {};
  choiceGroups(items).forEach((g) => {
    const flagged = g.options.find((o) => o.defaultSelected);
    const cheapest = [...g.options].sort((a, b) => lineTotal(a) - lineTotal(b))[0];
    const pick = flagged ?? cheapest;
    if (pick) chosen[g.id] = pick.id;
  });
  const extras = optionalItems(items)
    .filter((li) => li.defaultSelected)
    .map((li) => li.id);
  return { chosen, extras };
}

/**
 * The effective line items for a quote given a customer selection.
 * Included lines always count; one line per choice group; only ticked extras.
 */
export function resolveItems(
  items: QuoteLineItem[],
  selection?: QuoteSelection,
): QuoteLineItem[] {
  const sel = selection ?? defaultSelection(items);
  const chosenIds = new Set(Object.values(sel.chosen ?? {}));
  const extraIds = new Set(sel.extras ?? []);
  return items.filter((li) => {
    const kind = lineKind(li);
    if (kind === "included") return true;
    if (kind === "choice") return chosenIds.has(li.id);
    return extraIds.has(li.id);
  });
}

/** Convenience: totals for a quote/invoice honouring any customer selection. */
export function docTotals(doc: { items: QuoteLineItem[]; selection?: QuoteSelection }) {
  return totals(resolveItems(doc.items, doc.selection));
}

export function quoteTotal(q: Quote) {
  return docTotals(q).total;
}
