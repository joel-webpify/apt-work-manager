import { useEffect, useState } from "react";
import { invoices as seedInvoices, type Invoice } from "@/data/mockData";

const EXTRA_KEY = "extra-invoices-v1";
const PATCH_KEY = "patch-invoices-v1";

type Listener = () => void;
const listeners = new Set<Listener>();

let extra: Invoice[] = [];
let patches: Record<string, Partial<Invoice>> = {};

if (typeof window !== "undefined") {
  try { extra = JSON.parse(localStorage.getItem(EXTRA_KEY) || "[]"); } catch { extra = []; }
  try { patches = JSON.parse(localStorage.getItem(PATCH_KEY) || "{}"); } catch { patches = {}; }
}

const seedIdSet = new Set(seedInvoices.map((i) => i.id));

function build(): Invoice[] {
  const seedWithPatches = seedInvoices.map((i) => (patches[i.id] ? { ...i, ...patches[i.id] } : i));
  return [...extra, ...seedWithPatches];
}

let current: Invoice[] = build();

function persist() {
  try {
    localStorage.setItem(EXTRA_KEY, JSON.stringify(extra));
    localStorage.setItem(PATCH_KEY, JSON.stringify(patches));
  } catch { /* ignore */ }
  listeners.forEach((l) => l());
}

export function addInvoice(inv: Invoice) {
  extra = [inv, ...extra];
  current = build();
  persist();
}

export function updateInvoice(id: string, patch: Partial<Invoice>) {
  if (seedIdSet.has(id)) {
    patches[id] = { ...patches[id], ...patch };
  } else {
    extra = extra.map((i) => (i.id === id ? { ...i, ...patch } : i));
  }
  current = build();
  persist();
}

export function getInvoices(): Invoice[] { return current; }
export function findInvoice(id: string) { return current.find((i) => i.id === id); }
export function findInvoiceByJob(jobId: string) { return current.find((i) => i.jobId === jobId); }

export function useInvoices(): [Invoice[], (updater: (prev: Invoice[]) => Invoice[]) => void] {
  const [all, setAll] = useState<Invoice[]>(current);

  useEffect(() => {
    const l = () => setAll(current);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);

  const update = (fn: (prev: Invoice[]) => Invoice[]) => {
    const next = fn(current);
    extra = next.filter((i) => !seedIdSet.has(i.id));
    const nextPatches: Record<string, Partial<Invoice>> = {};
    next.forEach((i) => {
      if (!seedIdSet.has(i.id)) return;
      const seed = seedInvoices.find((s) => s.id === i.id)!;
      const patch: Partial<Invoice> = {};
      (Object.keys(i) as (keyof Invoice)[]).forEach((k) => {
        if (JSON.stringify(i[k]) !== JSON.stringify(seed[k])) {
          (patch as Record<string, unknown>)[k as string] = i[k];
        }
      });
      if (Object.keys(patch).length) nextPatches[i.id] = patch;
    });
    patches = nextPatches;
    current = build();
    persist();
  };

  return [all, update];
}
