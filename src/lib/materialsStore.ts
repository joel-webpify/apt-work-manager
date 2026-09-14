import { useEffect, useState } from "react";
import type { ProductKind, ProductUnit } from "@/data/mockData";

/** Materials used on a job — what they cost you, and what the customer pays. */
export interface JobMaterial {
  id: string;
  productId?: string;
  /** Product supplied vs service done. Missing = product. */
  kind?: ProductKind;
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

/** Product supplied vs service done. Missing = product. */
export const materialKind = (m: JobMaterial): ProductKind => m.kind ?? "product";

export const productLines = (list: JobMaterial[]) => list.filter((m) => materialKind(m) === "product");
export const serviceLines = (list: JobMaterial[]) => list.filter((m) => materialKind(m) === "service");

export function materialsCost(list: JobMaterial[]) {
  return list.reduce((sum, m) => sum + m.qty * m.cost, 0);
}

/** Just the things you supplied. */
export function productsCost(list: JobMaterial[]) {
  return materialsCost(productLines(list));
}

/** Just the work priced from the catalogue. */
export function servicesCost(list: JobMaterial[]) {
  return materialsCost(serviceLines(list));
}

export function materialsCharge(list: JobMaterial[]) {
  return list.filter((m) => m.chargeable).reduce((sum, m) => sum + m.qty * m.price, 0);
}

/** Where the labour figure comes from. */
export type LabourSource = "time" | "services";

export interface JobCosts {
  quoteValue: number;
  /** Products supplied, at your cost. */
  products: number;
  /** Services picked from the catalogue, at your cost. */
  services: number;
  /** Everything added on site, products + services. */
  materials: number;
  labourHours: number;
  /** Hours logged, priced at your labour rate. */
  loggedLabour: number;
  /** The labour figure actually counted in the total. */
  labour: number;
  labourSource: LabourSource;
  totalCost: number;
  profit: number;
  margin: number;
}

export function jobCosts(opts: {
  quoteValue: number;
  materials: JobMaterial[];
  labourMinutes: number;
  labourRate: number;
  labourSource?: LabourSource;
}): JobCosts {
  const labourSource = opts.labourSource ?? "time";
  const products = productsCost(opts.materials);
  const services = servicesCost(opts.materials);
  const materials = products + services;
  const labourHours = Math.round((opts.labourMinutes / 60) * 10) / 10;
  const loggedLabour = labourHours * opts.labourRate;
  const labour = labourSource === "services" ? services : loggedLabour;
  const totalCost = products + labour;
  const profit = opts.quoteValue - totalCost;
  const margin = opts.quoteValue > 0 ? (profit / opts.quoteValue) * 100 : 0;
  return {
    quoteValue: opts.quoteValue,
    products,
    services,
    materials,
    labourHours,
    loggedLabour,
    labour,
    labourSource,
    totalCost,
    profit,
    margin,
  };
}

/** Which labour figure a job uses — remembered per job. */
const SRC_KEY = "job-labour-source-v1";

let sources: Record<string, LabourSource> = {};
if (typeof window !== "undefined") {
  try {
    sources = JSON.parse(localStorage.getItem(SRC_KEY) || "{}");
  } catch {
    sources = {};
  }
}

export function getLabourSource(jobId: string): LabourSource {
  return sources[jobId] ?? "time";
}

export function setLabourSource(jobId: string, src: LabourSource) {
  sources = { ...sources, [jobId]: src };
  try {
    localStorage.setItem(SRC_KEY, JSON.stringify(sources));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

export function useLabourSource(jobId: string): [LabourSource, (s: LabourSource) => void] {
  const [snap, setSnap] = useState(() => getLabourSource(jobId));
  useEffect(() => {
    const l = () => setSnap(getLabourSource(jobId));
    l();
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, [jobId]);
  return [snap, (s) => setLabourSource(jobId, s)];
}
