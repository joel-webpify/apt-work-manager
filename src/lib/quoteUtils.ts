import type { QuoteLineItem } from "@/data/mockData";

export function lineSubtotal(li: QuoteLineItem) {
  const gross = li.qty * li.unitPrice;
  const discounted = gross * (1 - (li.discount ?? 0) / 100);
  return discounted;
}

export function lineTax(li: QuoteLineItem) {
  return lineSubtotal(li) * (li.taxRate / 100);
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
