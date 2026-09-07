import { useEffect, useState } from "react";
import type { ProductUnit } from "@/data/mockData";

/** Materials used on a job — what they cost you, and what the customer pays. */
export interface JobMaterial {
  id: string;
  productId?: string;
  name: string;
  qty: number;
  unit: ProductUnit;
  /** What you paid, per unit. */
  cost: number;
  /** What the customer pays, per unit. */
  price: number;
  taxRate: number;
  supplier?: string;
  note?: string;
  chargeable: boolean;
  /** Set when it came from the field app. */
  addedBy?: string;
  at: string;
  /** Once pushed onto a quote or invoice. */
  billedOn?: string;
}

const KEY = "job-materials-v1";
const listeners = new Set<() => void>();

let byJob: Record<string, JobMaterial[]> = {};

if (typeof window !== "undefined") {
  try {
    byJob = JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    byJob = {};
  }
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(byJob));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

export function blankMaterial(): JobMaterial {
  return {
    id: `mat-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
    name: "",
    qty: 1,
    unit: "each",
    cost: 0,
    price: 0,
    taxRate: 20,
    chargeable: true,
    at: new Date().toISOString(),
  };
}

export function getMaterials(jobId: string): JobMaterial[] {
  return byJob[jobId] ?? [];
}

export function addMaterial(jobId: string, mat: Partial<JobMaterial>) {
  const next = { ...blankMaterial(), ...mat };
  byJob = { ...byJob, [jobId]: [...getMaterials(jobId), next] };
  persist();
  return next;
}

export function updateMaterial(jobId: string, id: string, patch: Partial<JobMaterial>) {
  byJob = {
    ...byJob,
    [jobId]: getMaterials(jobId).map((m) => (m.id === id ? { ...m, ...patch } : m)),
  };
  persist();
}

export function removeMaterial(jobId: string, id: string) {
  byJob = { ...byJob, [jobId]: getMaterials(jobId).filter((m) => m.id !== id) };
  persist();
}

export function markBilled(jobId: string, ids: string[], ref: string) {
  byJob = {
    ...byJob,
    [jobId]: getMaterials(jobId).map((m) => (ids.includes(m.id) ? { ...m, billedOn: ref } : m)),
  };
  persist();
}

export function useMaterials(jobId: string): JobMaterial[] {
  const [snap, setSnap] = useState(() => getMaterials(jobId));
  useEffect(() => {
    const l = () => setSnap(getMaterials(jobId));
    l();
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, [jobId]);
  return snap;
}

export function materialsCost(list: JobMaterial[]) {
  return list.reduce((sum, m) => sum + m.qty * m.cost, 0);
}

export function materialsCharge(list: JobMaterial[]) {
  return list.filter((m) => m.chargeable).reduce((sum, m) => sum + m.qty * m.price, 0);
}

export interface JobCosts {
  quoteValue: number;
  materials: number;
  labourHours: number;
  labour: number;
  totalCost: number;
  profit: number;
  margin: number;
}

export function jobCosts(opts: {
  quoteValue: number;
  materials: JobMaterial[];
  labourMinutes: number;
  labourRate: number;
}): JobCosts {
  const materials = materialsCost(opts.materials);
  const labourHours = Math.round((opts.labourMinutes / 60) * 10) / 10;
  const labour = labourHours * opts.labourRate;
  const totalCost = materials + labour;
  const profit = opts.quoteValue - totalCost;
  const margin = opts.quoteValue > 0 ? (profit / opts.quoteValue) * 100 : 0;
  return { quoteValue: opts.quoteValue, materials, labourHours, labour, totalCost, profit, margin };
}
