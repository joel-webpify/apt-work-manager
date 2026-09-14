// Job-level cost and profit figures for the reports.
// Reads exactly the same sources as the job's Costs tab, so the numbers agree.

import { useEffect, useState } from "react";
import type { Job } from "@/data/mockData";
import { getMaterials, getLabourSource, jobCosts, subscribeMaterials } from "@/lib/materialsStore";
import { recordsForJob, timeOnSiteMinutes } from "@/lib/fieldStore";
import { getLabourRate } from "@/lib/surveysStore";
import { getQuotes } from "@/lib/quotesStore";
import { quoteTotal } from "@/lib/quoteUtils";

export interface JobCostRow {
  job: Job;
  revenue: number;
  materials: number;
  labour: number;
  totalCost: number;
  profit: number;
  margin: number;
  labourHours: number;
  /** True when something real has been recorded — materials or logged time. */
  costed: boolean;
}

export function jobCostRows(list: Job[]): JobCostRow[] {
  const rate = getLabourRate();
  const quotes = getQuotes();
  return list.map((job) => {
    const materials = getMaterials(job.id);
    const labourMinutes = recordsForJob(job.id).reduce(
      (sum, r) => sum + (timeOnSiteMinutes(r.record) ?? 0),
      0,
    );
    const jobQuote = quotes.find((q) => q.jobId === job.id && q.status !== "Declined");
    const revenue = jobQuote ? quoteTotal(jobQuote) : job.value;
    const c = jobCosts({
      quoteValue: revenue,
      materials,
      labourMinutes,
      labourRate: rate,
      labourSource: getLabourSource(job.id),
    });
    return {
      job,
      revenue,
      materials: c.products,
      labour: c.labour,
      totalCost: c.totalCost,
      profit: c.profit,
      margin: c.margin,
      labourHours: c.labourHours,
      costed: materials.length > 0 || labourMinutes > 0,
    };
  });
}

export interface CostTotals {
  revenue: number;
  materials: number;
  labour: number;
  totalCost: number;
  profit: number;
  margin: number;
  costedCount: number;
  uncostedCount: number;
  uncostedValue: number;
  /** Share of won jobs that have figures recorded. */
  coverage: number;
}

/** Only jobs with recorded figures count towards the money; the rest are reported as gaps. */
export function costTotals(rows: JobCostRow[]): CostTotals {
  const costed = rows.filter((r) => r.costed);
  const uncosted = rows.filter((r) => !r.costed);
  const revenue = costed.reduce((a, r) => a + r.revenue, 0);
  const materials = costed.reduce((a, r) => a + r.materials, 0);
  const labour = costed.reduce((a, r) => a + r.labour, 0);
  const totalCost = materials + labour;
  const profit = revenue - totalCost;
  return {
    revenue,
    materials,
    labour,
    totalCost,
    profit,
    margin: revenue > 0 ? (profit / revenue) * 100 : 0,
    costedCount: costed.length,
    uncostedCount: uncosted.length,
    uncostedValue: uncosted.reduce((a, r) => a + r.revenue, 0),
    coverage: rows.length ? (costed.length / rows.length) * 100 : 0,
  };
}

export interface CostGroup extends CostTotals {
  name: string;
}

/** Roll costed rows up by any key — service, area, customer. */
export function groupCosts(rows: JobCostRow[], keyFn: (r: JobCostRow) => string): CostGroup[] {
  const map = new Map<string, JobCostRow[]>();
  rows.forEach((r) => {
    const k = keyFn(r) || "Unknown";
    map.set(k, [...(map.get(k) ?? []), r]);
  });
  return Array.from(map.entries())
    .map(([name, list]) => ({ name, ...costTotals(list) }))
    .sort((a, b) => b.profit - a.profit);
}

/** Live figures — refreshes when materials or the labour choice change. */
export function useCostReporting(list: Job[]) {
  const [rows, setRows] = useState<JobCostRow[]>(() => jobCostRows(list));
  useEffect(() => {
    const refresh = () => setRows(jobCostRows(list));
    refresh();
    return subscribeMaterials(refresh);
  }, [list]);
  return { rows, totals: costTotals(rows) };
}
