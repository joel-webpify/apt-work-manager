import { useMemo, useState } from "react";
import { Grid3x3, Plus, Search, Trash2, TrendingDown, TrendingUp, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Btn, Pill } from "@/components/layout/PageShell";
import {
  buildKeywordGrid,
  defaultKeywords,
  gridSizes,
  radiusOptions,
  rankTone,
  rankToneClass,
  plainAdvice,
  type GridSize,
} from "@/lib/gbpRankGrid";
import { cn } from "@/lib/utils";

export function RankGridTab({ businessName }: { businessName: string }) {
  const [keywords, setKeywords] = useState<string[]>(defaultKeywords);
  const [selected, setSelected] = useState(defaultKeywords[0]);
  const [size, setSize] = useState<GridSize>(5);
  const [radius, setRadius] = useState(2);
  const [input, setInput] = useState("");

  const grids = useMemo(
    () => keywords.map((k) => buildKeywordGrid(k, size, radius)),
    [keywords, size, radius],
  );
  const active = grids.find((g) => g.keyword === selected) ?? grids[0];

  const addKeyword = () => {
    const k = input.trim().toLowerCase();
    if (!k || keywords.includes(k)) return;
    setKeywords((list) => [...list, k]);
    setSelected(k);
    setInput("");
  };

  const removeKeyword = (k: string) => {
    setKeywords((list) => {
      const next = list.filter((x) => x !== k);
      if (selected === k) setSelected(next[0] ?? "");
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium inline-flex items-center gap-1.5">
            <Grid3x3 className="w-4 h-4 text-primary" /> Where you show up on the map
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            We check your position for each search word from points spread across your area. 1–3 is the map pack.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Choice label="Grid" value={size} options={gridSizes.map((s) => ({ value: s, label: `${s} × ${s}` }))} onChange={(v) => setSize(v as GridSize)} />
          <Choice
            label="Spread"
            value={radius}
            options={radiusOptions.map((r) => ({ value: r, label: `${r} mi` }))}
            onChange={(v) => setRadius(v as number)}
          />
        </div>
      </div>

      <div className="grid grid-cols-[260px_1fr] gap-4">
        {/* keywords */}
        <div className="border-hairline rounded-lg bg-card p-3">
          <div className="text-xs font-medium mb-2">Search words</div>
          <div className="flex items-center gap-1.5 mb-2.5">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-7 h-8"
                placeholder="Add a search word…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addKeyword())}
              />
            </div>
            <Btn variant="secondary" onClick={addKeyword}>
              <Plus className="w-3.5 h-3.5" />
            </Btn>
          </div>
          <div className="space-y-1">
            {grids.map((g) => {
              const on = g.keyword === active?.keyword;
              return (
                <div
                  key={g.keyword}
                  className={cn(
                    "group rounded-md border-hairline px-2.5 py-2 cursor-pointer transition-colors",
                    on ? "bg-primary/8 border-primary/40" : "bg-background hover:bg-surface-hover",
                  )}
                  onClick={() => setSelected(g.keyword)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm truncate">{g.keyword}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeKeyword(g.keyword);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Pill tone={g.topThreeShare >= 50 ? "success" : g.foundShare < 50 ? "danger" : "warning"}>
                      Avg {g.averageRank ?? "20+"}
                    </Pill>
                    <span className="text-[11px] text-muted-foreground">{g.topThreeShare}% in top 3</span>
                  </div>
                </div>
              );
            })}
            {grids.length === 0 && (
              <p className="text-xs text-muted-foreground py-4 text-center">Add a search word to start.</p>
            )}
          </div>
        </div>

        {/* grid */}
        {active ? (
          <div className="border-hairline rounded-lg bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div>
                <div className="text-sm font-medium">“{active.keyword}”</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {businessName} · {size} × {size} points across {radius} mile{radius > 1 ? "s" : ""}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Metric label="Average spot" value={active.averageRank !== null ? String(active.averageRank) : "20+"} delta={delta(active.previousAverage, active.averageRank)} />
                <Metric label="In the top 3" value={`${active.topThreeShare}%`} />
                <Metric label="Found at all" value={`${active.foundShare}%`} />
              </div>
            </div>

            <div
              className="grid gap-1.5 mx-auto"
              style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`, maxWidth: size * 72 }}
            >
              {active.points.map((p) => {
                const tone = rankTone(p.rank);
                const move = p.previous !== null && p.rank !== null ? p.previous - p.rank : 0;
                return (
                  <div
                    key={`${p.row}-${p.col}`}
                    title={p.rank === null ? "Not in the top 20 here" : `Position ${p.rank}${move ? ` (was ${p.previous})` : ""}`}
                    className={cn(
                      "aspect-square rounded-md border flex flex-col items-center justify-center",
                      rankToneClass[tone],
                    )}
                  >
                    <span className="text-sm font-medium tabular-nums">{p.rank ?? "–"}</span>
                    {move !== 0 && (
                      <span className="text-[10px] inline-flex items-center gap-0.5 opacity-80">
                        {move > 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                        {Math.abs(move)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-center gap-3 mt-3 text-[11px] text-muted-foreground">
              <Legend className="bg-[hsl(var(--success)/0.25)]" label="1–3 (map pack)" />
              <Legend className="bg-[hsl(var(--warning)/0.25)]" label="4–10" />
              <Legend className="bg-[hsl(var(--destructive)/0.2)]" label="11–20" />
              <Legend className="bg-surface" label="Not found" />
            </div>

            <p className="text-xs text-muted-foreground border-t-hairline mt-3 pt-3">{plainAdvice(active)}</p>
          </div>
        ) : (
          <div className="border-hairline rounded-lg bg-card p-10 text-center text-sm text-muted-foreground">
            Add a search word to see your map ranking.
          </div>
        )}
      </div>
    </div>
  );
}

function delta(prev: number | null, now: number | null) {
  if (prev === null || now === null) return 0;
  return Number((prev - now).toFixed(1));
}

function Metric({ label, value, delta }: { label: string; value: string; delta?: number }) {
  return (
    <div className="text-right">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="text-lg font-medium tracking-tight inline-flex items-center gap-1">
        {value}
        {!!delta && (
          <span
            className={cn(
              "text-[11px] inline-flex items-center gap-0.5",
              delta > 0 ? "text-[hsl(var(--success))]" : "text-[hsl(var(--destructive))]",
            )}
          >
            {delta > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(delta)}
          </span>
        )}
      </div>
    </div>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={cn("w-2.5 h-2.5 rounded-sm border-hairline", className)} /> {label}
    </span>
  );
}

function Choice<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="inline-flex border-hairline rounded-md overflow-hidden">
        {options.map((o) => (
          <button
            key={String(o.value)}
            onClick={() => onChange(o.value)}
            className={cn(
              "h-7 px-2 text-xs transition-colors",
              o.value === value ? "bg-primary text-primary-foreground" : "bg-background hover:bg-surface-hover",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
