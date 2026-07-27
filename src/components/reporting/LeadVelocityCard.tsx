import { useMemo, useState } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { buildLeadVelocity } from "@/lib/cashFlow";

export function LeadVelocityCard() {
  const [window, setWindow] = useState<4 | 8>(8);
  const velocity = useMemo(() => buildLeadVelocity(window), [window]);

  const sparkMax = Math.max(...velocity.history, 1);
  const total = velocity.history.reduce((a, b) => a + b, 0);
  const avg = total / (velocity.history.length || 1);
  const dir = velocity.changePct === null ? 0 : velocity.changePct > 0 ? 1 : velocity.changePct < 0 ? -1 : 0;
  const VelIcon = dir > 0 ? TrendingUp : dir < 0 ? TrendingDown : Minus;
  const velColor =
    dir > 0 ? "hsl(var(--success))" : dir < 0 ? "hsl(var(--destructive))" : "hsl(var(--muted-foreground))";

  // Oldest → newest, labelled relative to now
  const weeks = velocity.history.map((count, i) => {
    const back = velocity.history.length - 1 - i;
    return { count, label: back === 0 ? "This week" : back === 1 ? "Last week" : `${back} wks ago` };
  });

  return (
    <div className="border-hairline rounded-lg bg-card p-5 flex flex-col">
      <div className="flex items-start justify-between mb-1">
        <div>
          <div className="text-sm font-medium">Lead velocity</div>
          <div className="text-xs text-muted-foreground">New enquiries entering the pipeline</div>
        </div>
        <div className="flex border-hairline rounded-md overflow-hidden">
          {([4, 8] as const).map((w) => (
            <button
              key={w}
              onClick={() => setWindow(w)}
              className={`px-2 h-6 text-[11px] transition-colors ${
                window === w
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-muted-foreground hover:bg-surface-hover"
              }`}
            >
              {w}w
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-baseline gap-2 mt-2">
        <span className="text-2xl font-medium tracking-tight tabular-nums">{total}</span>
        <span className="text-xs text-muted-foreground">enquiries over {window} weeks</span>
      </div>

      {/* Summary strip */}
      <div className="mt-4 rounded-md bg-surface/50 border-hairline px-3 py-2.5 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">This week</span>
            <VelIcon className="w-3 h-3" style={{ color: velColor }} strokeWidth={2.2} />
            <span className="text-xs font-medium tabular-nums" style={{ color: velColor }}>
              {velocity.changePct === null
                ? "—"
                : `${velocity.changePct > 0 ? "+" : ""}${velocity.changePct.toFixed(0)}%`}
            </span>
            <span className="text-[11px] text-muted-foreground">WoW</span>
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            {velocity.thisWeek} new {velocity.thisWeek === 1 ? "enquiry" : "enquiries"} vs {velocity.lastWeek} last week
          </div>
        </div>
        <div className="flex items-end gap-[3px] h-7" title={`New enquiries, last ${window} weeks`}>
          {velocity.history.map((v, i) => (
            <div
              key={i}
              className="w-1.5 rounded-sm"
              style={{
                height: `${Math.max((v / sparkMax) * 100, 8)}%`,
                backgroundColor:
                  i === velocity.history.length - 1 ? velColor : "hsl(var(--muted-foreground) / 0.3)",
              }}
            />
          ))}
        </div>
      </div>

      {/* Weekly rows */}
      <div className="mt-4 flex-1 space-y-1.5">
        {[...weeks].reverse().map((w) => (
          <div key={w.label} className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-20 flex-shrink-0">{w.label}</span>
            <div className="flex-1 h-2 rounded-full bg-surface overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(w.count / sparkMax) * 100}%`,
                  backgroundColor: w.label === "This week" ? velColor : "hsl(var(--primary) / 0.55)",
                }}
              />
            </div>
            <span className="text-xs font-medium tabular-nums w-6 text-right">{w.count}</span>
          </div>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t-hairline text-[11px] text-muted-foreground">
        Averaging <span className="text-foreground font-medium">{avg.toFixed(1)} enquiries / week</span>
        {velocity.thisWeek < avg
          ? " — this week is running below trend."
          : " — this week is at or above trend."}
      </div>
    </div>
  );
}
