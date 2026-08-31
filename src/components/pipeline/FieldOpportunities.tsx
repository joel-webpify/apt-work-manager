import { Link } from "react-router-dom";
import { HardHat, PoundSterling, ArrowRight } from "lucide-react";
import { employees } from "@/data/mockData";
import { useJobs } from "@/lib/jobsStore";
import { useFieldOpportunities } from "@/lib/fieldStore";

/** Work the team spotted while on site — the cheapest pipeline in the business. */
export default function FieldOpportunities() {
  const [jobs] = useJobs();
  const rows = useFieldOpportunities();

  if (rows.length === 0) return null;

  const total = rows.reduce((sum, r) => sum + (Number(r.record.extraWorkValue) || 0), 0);

  return (
    <div className="rounded-xl border-hairline p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold inline-flex items-center gap-1.5">
            <HardHat className="w-4 h-4" /> Opportunities from the field
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Work your team spotted on site — roughly £{total.toFixed(0)} waiting to be quoted.
          </p>
        </div>
      </div>

      <ul className="mt-3 space-y-2">
        {rows.map(({ employeeId, record }, i) => {
          const jobId = Object.keys({});
          return null;
        })}
      </ul>

      <ul className="space-y-2">
        {rows.map((row, i) => {
          const job = jobs.find((j) => (row as { jobId?: string }).jobId === j.id);
          const who = employees.find((e) => e.id === row.employeeId);
          return (
            <li
              key={`${(row as { jobId?: string }).jobId}-${row.employeeId}-${i}`}
              className="rounded-lg border-hairline p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{job?.customer ?? "Job"}</div>
                  <p className="text-xs text-muted-foreground mt-0.5">{row.record.extraWorkNote}</p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[11px] text-muted-foreground">
                    {who && <span>Spotted by {who.name}</span>}
                    {row.record.extraWorkValue && (
                      <span className="inline-flex items-center gap-1">
                        <PoundSterling className="w-3 h-3" /> Roughly £{row.record.extraWorkValue}
                      </span>
                    )}
                  </div>
                </div>
                {row.record.extraWorkQuoteId ? (
                  <Link
                    to="/quotes"
                    className="h-8 px-2.5 shrink-0 rounded-lg border-hairline bg-surface hover:bg-surface-hover text-xs font-medium inline-flex items-center gap-1"
                  >
                    {row.record.extraWorkQuoteId} <ArrowRight className="w-3 h-3" />
                  </Link>
                ) : (
                  <span className="h-8 px-2.5 shrink-0 rounded-lg bg-[hsl(var(--warning)/0.14)] text-[hsl(var(--warning))] text-xs font-medium inline-flex items-center">
                    Needs a quote
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
