import { useMemo, useState } from "react";
import { TrendingUp, TrendingDown, Minus, X } from "lucide-react";
import { buildLeadVelocity, buildLeadDays, type LeadDay } from "@/lib/cashFlow";

const WEEKDAY_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function LeadVelocityCard() {
  const [window, setWindow] = useState<4 | 8>(8);
  /** Weeks back from now: 0 = this week. null = all weeks combined. */
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);

  const velocity = useMemo(() => buildLeadVelocity(window), [window]);
  const allDays = useMemo(() => buildLeadDays(window * 7), [window]);

  const sparkMax = Math.max(...velocity.history, 1);
  const total = velocity.history.reduce((a, b) => a + b, 0);
  const avg = total / (velocity.history.length || 1);
  const dir = velocity.changePct === null ? 0 : velocity.changePct > 0 ? 1 : velocity.changePct < 0 ? -1 : 0;
  const VelIcon = dir > 0 ? TrendingUp : dir < 0 ? TrendingDown : Minus;
  const velColor =
    dir > 0 ? "hsl(var(--success))" : dir < 0 ? "hsl(var(--destructive))" : "hsl(var(--muted-foreground))";

  // Newest → oldest weeks, each with the days it contains (oldest → newest).
  const weekRows = useMemo(() => {
    // allDays is oldest → newest; last 7 entries are "this week".
    return velocity.history
      .slice()
      .reverse()
      .map((count, back) => {
        const end = allDays.length - back * 7;
        const days = allDays.slice(Math.max(end - 7, 0), end);
        return {
          back,
          count,
          days,
          label: back === 0 ? "This week" : back === 1 ? "Last week" : `${back} wks ago`,
        };
      });
  }, [velocity.history, allDays]);

  const selected = selectedWeek === null ? null : weekRows.find((w) => w.back === selectedWeek) || null;

  // Daily series: either the selected week's days, or weekday totals across all weeks.
  const daily: { key: string; label: string; sub?: string; count: number; value: number; highlight: boolean; weekend: boolean }[] =
    useMemo(() => {
      if (selected) {
        return selected.days.map((d: LeadDay) => ({
          key: d.date.toISOString(),
          label: d.weekday,
          sub: `${d.date.getDate()}/${d.date.getMonth() + 1}`,
          count: d.count,
          value: d.value,
          highlight: d.isToday,
          weekend: d.isWeekend,
        }));
      }
      const map = new Map<string, { count: number; value: number }>();
      WEEKDAY_ORDER.forEach((w) => map.set(w, { count: 0, value: 0 }));
      allDays.forEach((d) => {
        const cur = map.get(d.weekday)!;
        cur.count += d.count;
        cur.value += d.value;
      });
      const best = Math.max(...Array.from(map.values()).map((v) => v.count), 0);
      return WEEKDAY_ORDER.map((w) => ({
        key: w,
        label: w,
        count: map.get(w)!.count,
        value: map.get(w)!.value,
        highlight: best > 0 && map.get(w)!.count === best,
        weekend: w === "Sat" || w === "Sun",
      }));
    }, [selected, allDays]);

  const dayMax = Math.max(...daily.map((d) => d.count), 1);
  const dailyTotal = daily.reduce((a, d) => a + d.count, 0);
  const topDay = daily.reduce((a, d) => (d.count > a.count ? d : a), daily[0]);
  const quietDays = daily.filter((d) => d.count === 0).length;

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
              onClick={() => { setWindow(w); setSelectedWeek(null); }}
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
            <span className="text-[11px] text-muted-foreground">vs last week</span>
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

      {/* Weekly rows — click to drill into a single week */}
      <div className="mt-4 space-y-1">
        {weekRows.map((w) => {
          const active = selectedWeek === w.back;
          return (
            <button
              key={w.back}
              onClick={() => setSelectedWeek(active ? null : w.back)}
              className={`w-full flex items-center gap-2 px-1 -mx-1 py-1 rounded transition-colors ${
                active ? "bg-surface" : "hover:bg-surface-hover/60"
              }`}
            >
              <span className={`text-xs w-20 flex-shrink-0 text-left ${active ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                {w.label}
              </span>
              <div className="flex-1 h-2 rounded-full bg-surface overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${(w.count / sparkMax) * 100}%`,
                    backgroundColor: w.back === 0 ? velColor : "hsl(var(--primary) / 0.55)",
                    opacity: selectedWeek === null || active ? 1 : 0.35,
                  }}
                />
              </div>
              <span className="text-xs font-medium tabular-nums w-6 text-right">{w.count}</span>
            </button>
          );
        })}
      </div>

      {/* Daily breakdown */}
      <div className="mt-4 pt-3 border-t-hairline flex-1">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">
            {selected ? `${selected.label} · per day` : "All weeks · per weekday"}
          </span>
          {selected ? (
            <button
              onClick={() => setSelectedWeek(null)}
              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-3 h-3" /> All weeks
            </button>
          ) : (
            <span className="text-[11px] text-muted-foreground">Click a week to drill in</span>
          )}
        </div>

        <div className="flex items-end gap-1.5 h-24">
          {daily.map((d) => (
            <div
              key={d.key}
              className="flex-1 flex flex-col items-center justify-end gap-1 group"
              title={`${d.label}${d.sub ? ` ${d.sub}` : ""} · ${d.count} ${d.count === 1 ? "enquiry" : "enquiries"}${
                d.value ? ` · £${Math.round(d.value).toLocaleString("en-GB")}` : ""
              }`}
            >
              <span className="text-[9px] tabular-nums text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                {d.count}
              </span>
              <div
                className="w-full max-w-8 rounded-sm transition-opacity group-hover:opacity-80"
                style={{
                  height: `${Math.max((d.count / dayMax) * 100, 4)}%`,
                  backgroundColor: d.count === 0
                    ? "hsl(var(--muted-foreground) / 0.15)"
                    : d.highlight
                      ? velColor
                      : d.weekend
                        ? "hsl(var(--primary) / 0.3)"
                        : "hsl(var(--primary) / 0.6)",
                }}
              />
              <span className={`text-[9px] leading-none ${d.highlight ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                {d.label.slice(0, selected ? 1 : 3)}
              </span>
              {d.sub && <span className="text-[8px] leading-none text-muted-foreground tabular-nums">{d.sub}</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 pt-3 border-t-hairline text-[11px] text-muted-foreground">
        {selected ? (
          <>
            <span className="text-foreground font-medium">{dailyTotal} enquiries</span> in {selected.label.toLowerCase()}
            {topDay && topDay.count > 0 && <> · busiest on {topDay.label} {topDay.sub} ({topDay.count})</>}
            {quietDays > 0 && <> · {quietDays} quiet days</>}.
          </>
        ) : (
          <>
            Averaging <span className="text-foreground font-medium">{avg.toFixed(1)} enquiries / week</span>
            {topDay && topDay.count > 0 && <> · {topDay.label}s are the strongest day ({topDay.count})</>}.
          </>
        )}
      </div>
    </div>
  );
}
