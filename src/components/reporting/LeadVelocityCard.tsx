import { useMemo, useState } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { buildLeadVelocity, buildLeadDays } from "@/lib/cashFlow";

export function LeadVelocityCard() {
  const [window, setWindow] = useState<4 | 8>(8);
  const [view, setView] = useState<"week" | "day">("week");

  const velocity = useMemo(() => buildLeadVelocity(window), [window]);
  const days = useMemo(() => buildLeadDays(view === "day" ? (window === 4 ? 14 : 28) : 14), [view, window]);

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

  const dayMax = Math.max(...days.map((d) => d.count), 1);
  const busiestWeekday = useMemo(() => {
    const map = new Map<string, number>();
    days.forEach((d) => map.set(d.weekday, (map.get(d.weekday) || 0) + d.count));
    const sorted = Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[1] ? sorted[0] : null;
  }, [days]);
  const quietDays = days.filter((d) => d.count === 0).length;

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

      {/* View toggle */}
      <div className="mt-4 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">
          {view === "week" ? "By week" : `By day · last ${days.length} days`}
        </span>
        <div className="flex gap-1 p-0.5 bg-surface rounded-md">
          {(["week", "day"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`h-5 px-2 text-[11px] rounded transition-colors ${
                view === v ? "bg-card shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {v === "week" ? "Weekly" : "Daily"}
            </button>
          ))}
        </div>
      </div>

      {/* Breakdown */}
      <div className="mt-3 flex-1">
        {view === "week" ? (
          <div className="space-y-1.5">
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
        ) : (
          <div className="flex items-end gap-[3px] h-24">
            {days.map((d) => (
              <div
                key={d.date.toISOString()}
                className="flex-1 flex flex-col items-center justify-end gap-1 group"
                title={`${d.weekday} ${d.date.getDate()}/${d.date.getMonth() + 1} · ${d.count} ${
                  d.count === 1 ? "enquiry" : "enquiries"
                }${d.value ? ` · £${Math.round(d.value).toLocaleString("en-GB")}` : ""}`}
              >
                <span className="text-[9px] tabular-nums text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                  {d.count}
                </span>
                <div
                  className="w-full rounded-sm transition-opacity group-hover:opacity-80"
                  style={{
                    height: `${Math.max((d.count / dayMax) * 100, 4)}%`,
                    backgroundColor: d.isToday
                      ? velColor
                      : d.count === 0
                        ? "hsl(var(--muted-foreground) / 0.15)"
                        : d.isWeekend
                          ? "hsl(var(--primary) / 0.3)"
                          : "hsl(var(--primary) / 0.6)",
                  }}
                />
                <span
                  className={`text-[9px] leading-none ${
                    d.isToday ? "font-medium text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {days.length > 14 ? (d.date.getDay() === 1 ? d.date.getDate() : "") : d.weekday[0]}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-3 pt-3 border-t-hairline text-[11px] text-muted-foreground">
        {view === "week" ? (
          <>
            Averaging <span className="text-foreground font-medium">{avg.toFixed(1)} enquiries / week</span>
            {velocity.thisWeek < avg ? " — this week is running below trend." : " — this week is at or above trend."}
          </>
        ) : (
          <>
            {busiestWeekday ? (
              <>
                <span className="text-foreground font-medium">{busiestWeekday[0]}s</span> bring the most enquiries (
                {busiestWeekday[1]} in the period)
              </>
            ) : (
              <>No enquiries in this period</>
            )}
            {quietDays > 0 && <> · {quietDays} quiet days with none</>}.
          </>
        )}
      </div>
    </div>
  );
}
