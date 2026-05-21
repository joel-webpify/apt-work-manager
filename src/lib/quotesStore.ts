import { useEffect, useState } from "react";
import { quotes as seedQuotes, type Quote } from "@/data/mockData";

const EXTRA_KEY = "extra-quotes-v1";
const PATCH_KEY = "patch-quotes-v1";

type Listener = () => void;
const listeners = new Set<Listener>();

let extra: Quote[] = [];
let patches: Record<string, Partial<Quote>> = {};

if (typeof window !== "undefined") {
  try { extra = JSON.parse(localStorage.getItem(EXTRA_KEY) || "[]"); } catch { extra = []; }
  try { patches = JSON.parse(localStorage.getItem(PATCH_KEY) || "{}"); } catch { patches = {}; }
}

const seedIdSet = new Set(seedQuotes.map((q) => q.id));

function build(): Quote[] {
  const seedWithPatches = seedQuotes.map((q) => (patches[q.id] ? { ...q, ...patches[q.id] } : q));
  return [...extra, ...seedWithPatches];
}

let current: Quote[] = build();

function persist() {
  try {
    localStorage.setItem(EXTRA_KEY, JSON.stringify(extra));
    localStorage.setItem(PATCH_KEY, JSON.stringify(patches));
  } catch { /* ignore */ }
  listeners.forEach((l) => l());
}

export function addQuote(q: Quote) {
  extra = [q, ...extra];
  current = build();
  persist();
}

export function updateQuote(id: string, patch: Partial<Quote>) {
  if (seedIdSet.has(id)) {
    patches[id] = { ...patches[id], ...patch };
  } else {
    extra = extra.map((q) => (q.id === id ? { ...q, ...patch } : q));
  }
  current = build();
  persist();
}

export function getQuotes(): Quote[] { return current; }
export function findQuote(id: string) { return current.find((q) => q.id === id); }

export function useQuotes(): [Quote[], (updater: (prev: Quote[]) => Quote[]) => void] {
  const [all, setAll] = useState<Quote[]>(current);

  useEffect(() => {
    const l = () => setAll(current);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);

  const update = (fn: (prev: Quote[]) => Quote[]) => {
    const next = fn(current);
    extra = next.filter((q) => !seedIdSet.has(q.id));
    const nextPatches: Record<string, Partial<Quote>> = {};
    next.forEach((q) => {
      if (!seedIdSet.has(q.id)) return;
      const seed = seedQuotes.find((s) => s.id === q.id)!;
      const patch: Partial<Quote> = {};
      (Object.keys(q) as (keyof Quote)[]).forEach((k) => {
        if (JSON.stringify(q[k]) !== JSON.stringify(seed[k])) {
          (patch as Record<string, unknown>)[k as string] = q[k];
        }
      });
      if (Object.keys(patch).length) nextPatches[q.id] = patch;
    });
    patches = nextPatches;
    current = build();
    persist();
  };

  return [all, update];
}
