import { jobCosts, useLabourSource, useMaterials } from "@/lib/materialsStore";
import { useLabourRate } from "@/lib/surveysStore";
import { timeOnSiteMinutes, useJobRecords } from "@/lib/fieldStore";
import { fmt, quoteTotal } from "@/lib/quoteUtils";
import { useQuotes } from "@/lib/quotesStore";
import MaterialsList from "@/components/field/MaterialsList";

/** What the job cost against what it's worth. */
export default function JobCostsCard({ jobId, jobValue }: { jobId: string; jobValue?: number }) {
  const materials = useMaterials(jobId);
  const [rate] = useLabourRate();
  const records = useJobRecords(jobId);
  const [quotes] = useQuotes();
  const [labourSource, setLabourSource] = useLabourSource(jobId);

  const labourMinutes = records.reduce((sum, r) => sum + (timeOnSiteMinutes(r.record) ?? 0), 0);
  const jobQuote = quotes.find((q) => q.jobId === jobId && q.status !== "Declined");
  const quoteValue = jobQuote ? quoteTotal(jobQuote) : jobValue ?? 0;

  const c = jobCosts({ quoteValue, materials, labourMinutes, labourRate: rate, labourSource });
  const usingTime = labourSource === "time";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <Tile label="Job value" value={fmt(c.quoteValue)} />
        <Tile label="Materials" value={fmt(c.products)} />
        <Tile
          label={usingTime ? `Labour (${c.labourHours}h @ ${fmt(rate)})` : "Services from catalogue"}
          value={fmt(c.labour)}
        />
        <Tile label="Total cost" value={fmt(c.totalCost)} />
        <Tile label="Profit" value={fmt(c.profit)} tone={c.profit >= 0 ? "good" : "bad"} />
        <Tile label="Margin" value={`${c.margin.toFixed(0)}%`} tone={c.margin >= 20 ? "good" : "bad"} />
      </div>

      <div className="rounded-lg border-hairline bg-surface px-3 py-2.5">
        <p className="text-xs font-semibold mb-1.5">How is the work priced?</p>
        <div className="flex flex-wrap gap-1.5">
          <Choice
            active={usingTime}
            onClick={() => setLabourSource("time")}
            label={`Time logged — ${fmt(c.loggedLabour)}`}
          />
          <Choice
            active={!usingTime}
            onClick={() => setLabourSource("services")}
            label={`Catalogue services — ${fmt(c.services)}`}
          />
        </div>
        <p className="text-[11px] text-muted-foreground mt-1.5">
          {usingTime
            ? `Counting ${c.labourHours}h logged on site. Catalogue services (${fmt(c.services)}) are shown for comparison only.`
            : `Counting the priced services added on the job. Time logged (${c.labourHours}h, ${fmt(c.loggedLabour)}) is shown for comparison only.`}
        </p>
      </div>

      <div>
        <p className="text-xs font-semibold mb-2">Materials used</p>
        <MaterialsList jobId={jobId} compact kind="product" />
      </div>

      <div>
        <p className="text-xs font-semibold mb-2">Work done</p>
        <MaterialsList jobId={jobId} compact kind="service" />
      </div>
    </div>
  );
}

function Choice({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-8 px-2.5 rounded-lg text-[11px] font-medium border-hairline ${
        active ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground"
      }`}
    >
      {label}
    </button>
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
