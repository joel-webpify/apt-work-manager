import { jobCosts, useMaterials } from "@/lib/materialsStore";
import { useLabourRate } from "@/lib/surveysStore";
import { timeOnSiteMinutes, useJobRecords } from "@/lib/fieldStore";
import { fmt } from "@/lib/quoteUtils";
import { useQuotes } from "@/lib/quotesStore";
import { quoteTotals } from "@/lib/quoteUtils";
import MaterialsList from "@/components/field/MaterialsList";

/** What the job cost against what it's worth. */
export default function JobCostsCard({ jobId, jobValue }: { jobId: string; jobValue?: number }) {
  const materials = useMaterials(jobId);
  const [rate] = useLabourRate();
  const records = useJobRecords(jobId);
  const [quotes] = useQuotes();

  const labourMinutes = records.reduce((sum, r) => sum + (timeOnSiteMinutes(r.record) ?? 0), 0);
  const jobQuote = quotes.find((q) => q.jobId === jobId && q.status !== "Declined");
  const quoteValue = jobQuote ? quoteTotals(jobQuote.items, jobQuote.selection).total : jobValue ?? 0;

  const c = jobCosts({ quoteValue, materials, labourMinutes, labourRate: rate });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <Tile label="Job value" value={fmt(c.quoteValue)} />
        <Tile label="Materials cost" value={fmt(c.materials)} />
        <Tile label={`Labour (${c.labourHours}h @ ${fmt(rate)})`} value={fmt(c.labour)} />
        <Tile label="Total cost" value={fmt(c.totalCost)} />
        <Tile label="Profit" value={fmt(c.profit)} tone={c.profit >= 0 ? "good" : "bad"} />
        <Tile label="Margin" value={`${c.margin.toFixed(0)}%`} tone={c.margin >= 20 ? "good" : "bad"} />
      </div>

      <div>
        <p className="text-xs font-semibold mb-2">Materials used</p>
        <MaterialsList jobId={jobId} compact />
      </div>
    </div>
  );
}

function Tile({ label, value, tone }: { label: string; value: string; tone?: "good" | "bad" }) {
  const colour =
    tone === "good" ? "text-[hsl(var(--success))]" : tone === "bad" ? "text-[hsl(var(--destructive))]" : "";
  return (
    <div className="rounded-lg border-hairline bg-surface px-3 py-2">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={`text-sm font-semibold ${colour}`}>{value}</p>
    </div>
  );
}
