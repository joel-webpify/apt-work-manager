import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, TrendingUp, TrendingDown, Minus, ArrowUpRight } from "lucide-react";
import { buildCashFlowForecast, buildLeadVelocity, type CashFlowItem } from "@/lib/cashFlow";

function gbp(n: number, compact = false) {
  if (compact && Math.abs(n) >= 1000) return `£${(n / 1000).toFixed(1)}k`;
  return `£${Math.round(n).toLocaleString("en-GB")}`;
}

const confidenceColor: Record<CashFlowItem["confidence"], string> = {
  confirmed: "hsl(var(--success))",
  expected: "hsl(var(--info))",
  "at-risk": "hsl(var(--warning))",
};

const confidenceLabel: Record<CashFlowItem["confidence"], string> = {
  confirmed: "Confirmed",
  expected: "Expected",
  "at-risk": "At risk",
};

export function CashFlowForecast() {
  const navigate = useNavigate();
  const [window, setWindow] = useState<4 | 8>(4);
  const [open, setOpen] = useState<string | null>(null);

  const data = useMemo(() => buildCashFlowForecast(window), [window]);
  const velocity = useMemo(() => buildLeadVelocity(8), []);

  const max = Math.max(...data.weeks.map((w) => w.total), 1);
  const sparkMax = Math.max(...velocity.history, 1);
  const dir = velocity.changePct === null ? 0 : velocity.changePct > 0 ? 1 : velocity.changePct < 0 ? -1 : 0;
  const VelIcon = dir > 0 ? TrendingUp : dir < 0 ? TrendingDown : Minus;
  const velColor = dir > 0 ? "hsl(var(--success))" : dir < 0 ? "hsl(var(--destructive))" : "hsl(var(--muted-foreground))";

  return (
    <div className="border-hairline rounded-lg bg-card p-5 flex flex-col">
      <div className="flex items-start justify-between mb-1">
        <div>
          <div className="text-sm font-medium">Cash flow forecast</div>
          <div className="text-xs text-muted-foreground">Expected money in, by week</div>
        </div>
        <div className="flex border-hairline rounded-md overflow-hidden">
          {([4, 8] as const).map((w) => (
            <button
              key={w}
              onClick={() => { setWindow(w); setOpen(null); }}
              className={`px-2 h-6 text-[11px] transition-colors ${
                window === w ? "bg-primary text-primary-foreground font-medium" : "text-muted-foreground hover:bg-surface-hover"
              }`}
            >
              {w}w
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-baseline gap-2 mt-2">
        <span className="text-2xl font-medium tracking-tight tabular-nums">{gbp(data.total)}</span>
        <span className="text-xs text-muted-foreground">expected in over {window} weeks</span>
      </div>

      {/* Lead velocity strip */}
      <div className="mt-4 rounded-md bg-surface/50 border-hairline px-3 py-2.5 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Lead velocity</span>
            <VelIcon className="w-3 h-3" style={{ color: velColor }} strokeWidth={2.2} />
            <span className="text-xs font-medium tabular-nums" style={{ color: velColor }}>
              {velocity.changePct === null ? "—" : `${velocity.changePct > 0 ? "+" : ""}${velocity.changePct.toFixed(0)}%`}
            </span>
            <span className="text-[11px] text-muted-foreground">WoW</span>
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            {velocity.thisWeek} new {velocity.thisWeek === 1 ? "enquiry" : "enquiries"} this week vs {velocity.lastWeek} last week
          </div>
        </div>
        <div className="flex items-end gap-[3px] h-7" title="New enquiries, last 8 weeks">
          {velocity.history.map((v, i) => (
            <div
              key={i}
              className="w-1.5 rounded-sm"
              style={{
                height: `${Math.max((v / sparkMax) * 100, 8)}%`,
                backgroundColor: i === velocity.history.length - 1 ? velColor : "hsl(var(--muted-foreground) / 0.3)",
              }}
            />
          ))}
        </div>
      </div>

      {/* Weekly rows */}
      <div className="mt-4 flex-1">
        {data.weeks.map((w) => {
          const isOpen = open === w.label;
          return (
            <div key={w.label} className="border-b-hairline last:border-b-0">
              <button
                onClick={() => setOpen(isOpen ? null : w.label)}
                disabled={!w.items.length}
                className="w-full py-2 flex items-center gap-2 text-left group disabled:cursor-default hover:bg-surface-hover/60 rounded transition-colors px-1 -mx-1"
              >
                <ChevronRight
                  className={`w-3 h-3 flex-shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-90" : ""} ${w.items.length ? "" : "opacity-0"}`}
                />
                <span className="text-xs text-muted-foreground w-16 flex-shrink-0">{w.label}</span>
                <div className="flex-1 h-2 rounded-full bg-surface overflow-hidden flex">
                  {(["confirmed", "expected", "at-risk"] as const).map((k) => {
                    const val = k === "confirmed" ? w.confirmed : k === "expected" ? w.expected : w.atRisk;
                    if (!val) return null;
                    return (
                      <div
                        key={k}
                        style={{ width: `${(val / max) * 100}%`, backgroundColor: confidenceColor[k] }}
                        title={`${confidenceLabel[k]}: ${gbp(val)}`}
                      />
                    );
                  })}
                </div>
                <span className="text-xs font-medium tabular-nums w-14 text-right">{gbp(w.total, true)}</span>
              </button>

              {isOpen && (
                <div className="pb-2 pl-6 space-y-1">
                  {w.items.map((it) => (
                    <button
                      key={`${it.kind}-${it.id}`}
                      onClick={() => navigate(it.link)}
                      className="w-full flex items-center gap-2 text-left px-2 py-1.5 rounded hover:bg-surface-hover transition-colors group"
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: confidenceColor[it.confidence] }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs truncate">{it.label}</div>
                        <div className="text-[10px] text-muted-foreground truncate">{it.sub}</div>
                      </div>
                      <span className="text-xs tabular-nums">{gbp(it.amount)}</span>
                      <ArrowUpRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend + footer */}
      <div className="mt-3 pt-3 border-t-hairline space-y-2">
        <div className="flex items-center gap-3">
          {(["confirmed", "expected", "at-risk"] as const).map((k) => (
            <div key={k} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: confidenceColor[k] }} />
              <span className="text-[10px] text-muted-foreground">
                {confidenceLabel[k]} {gbp(k === "confirmed" ? data.totalConfirmed : k === "expected" ? data.totalExpected : data.totalAtRisk, true)}
              </span>
            </div>
          ))}
        </div>
        {data.peak && (
          <div className="text-[11px] text-muted-foreground">
            Biggest week is <span className="text-foreground font-medium">w/c {data.peak.label}</span> at {gbp(data.peak.total)}
            {data.overdueValue > 0 && <> · {gbp(data.overdueValue)} of it depends on chasing overdue invoices</>}.
          </div>
        )}
      </div>
    </div>
  );
}
