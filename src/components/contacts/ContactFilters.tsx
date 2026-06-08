import { useMemo, useState } from "react";
import { Filter, X, Calendar as CalendarIcon, Check } from "lucide-react";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Btn } from "@/components/layout/PageShell";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";

export type DatePreset = "any" | "7d" | "30d" | "90d" | "1y" | "custom";

export type ContactFilterState = {
  tags: string[];
  lastActivity: { preset: DatePreset; range?: DateRange };
};

export const emptyFilters: ContactFilterState = {
  tags: [],
  lastActivity: { preset: "any" },
};

const PRESETS: { value: DatePreset; label: string }[] = [
  { value: "any", label: "Any time" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "1y", label: "Last year" },
  { value: "custom", label: "Custom range" },
];

export function presetToRange(preset: DatePreset, custom?: DateRange): DateRange | null {
  if (preset === "any") return null;
  if (preset === "custom") return custom?.from ? custom : null;
  const to = new Date();
  const from = new Date();
  const days = preset === "7d" ? 7 : preset === "30d" ? 30 : preset === "90d" ? 90 : 365;
  from.setDate(from.getDate() - days);
  return { from, to };
}

function describeRange(state: ContactFilterState["lastActivity"]): string | null {
  if (state.preset === "any") return null;
  if (state.preset === "custom") {
    if (!state.range?.from) return null;
    const to = state.range.to ?? state.range.from;
    return `${format(state.range.from, "d MMM")} – ${format(to, "d MMM")}`;
  }
  return PRESETS.find((p) => p.value === state.preset)?.label ?? null;
}

export function ContactFilters({
  allTags,
  value,
  onChange,
}: {
  allTags: string[];
  value: ContactFilterState;
  onChange: (next: ContactFilterState) => void;
}) {
  const [open, setOpen] = useState(false);
  const activeCount =
    value.tags.length + (value.lastActivity.preset !== "any" ? 1 : 0);
  const rangeLabel = describeRange(value.lastActivity);

  function toggleTag(t: string) {
    const has = value.tags.includes(t);
    onChange({ ...value, tags: has ? value.tags.filter((x) => x !== t) : [...value.tags, t] });
  }

  function setPreset(preset: DatePreset) {
    onChange({ ...value, lastActivity: { preset, range: value.lastActivity.range } });
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              "inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md border-hairline bg-background text-sm hover:bg-surface-hover transition-colors",
              activeCount > 0 && "border-primary/40 text-foreground",
            )}
          >
            <Filter className="w-3.5 h-3.5" />
            Filters
            {activeCount > 0 && (
              <span className="ml-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold">
                {activeCount}
              </span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <div className="p-3 border-b-hairline">
            <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
              Last activity
            </div>
            <div className="grid grid-cols-2 gap-1">
              {PRESETS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPreset(p.value)}
                  className={cn(
                    "flex items-center gap-1.5 h-8 px-2 rounded text-sm text-left transition-colors",
                    value.lastActivity.preset === p.value
                      ? "bg-primary/10 text-primary font-medium"
                      : "hover:bg-surface-hover text-muted-foreground",
                  )}
                >
                  {value.lastActivity.preset === p.value ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <CalendarIcon className="w-3.5 h-3.5" />
                  )}
                  {p.label}
                </button>
              ))}
            </div>
            {value.lastActivity.preset === "custom" && (
              <div className="mt-2 border-hairline rounded-md">
                <Calendar
                  mode="range"
                  selected={value.lastActivity.range}
                  onSelect={(range) =>
                    onChange({ ...value, lastActivity: { preset: "custom", range } })
                  }
                  numberOfMonths={1}
                  className={cn("p-2 pointer-events-auto")}
                />
              </div>
            )}
          </div>

          <div className="p-3">
            <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
              Tags {value.tags.length > 0 && `(${value.tags.length})`}
            </div>
            {allTags.length === 0 ? (
              <div className="text-xs text-muted-foreground py-2">
                No tags yet. Add tags from a contact panel.
              </div>
            ) : (
              <div className="flex flex-wrap gap-1 max-h-40 overflow-y-auto">
                {allTags.map((t) => {
                  const active = value.tags.includes(t);
                  return (
                    <button
                      key={t}
                      onClick={() => toggleTag(t)}
                      className={cn(
                        "inline-flex items-center gap-1 h-6 px-2 rounded text-xs transition-colors",
                        active
                          ? "bg-primary text-primary-foreground"
                          : "bg-surface hover:bg-surface-hover text-muted-foreground",
                      )}
                    >
                      {active && <Check className="w-3 h-3" />}
                      {t}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-between items-center p-2 border-t-hairline bg-surface/40">
            <button
              onClick={() => onChange(emptyFilters)}
              className="text-xs text-muted-foreground hover:text-foreground px-2 h-7"
            >
              Reset
            </button>
            <Btn variant="primary" onClick={() => setOpen(false)}>
              Done
            </Btn>
          </div>
        </PopoverContent>
      </Popover>

      {rangeLabel && (
        <FilterChip
          label={`Activity: ${rangeLabel}`}
          onClear={() => onChange({ ...value, lastActivity: { preset: "any" } })}
        />
      )}
      {value.tags.map((t) => (
        <FilterChip
          key={t}
          label={`#${t}`}
          onClear={() => onChange({ ...value, tags: value.tags.filter((x) => x !== t) })}
        />
      ))}
    </div>
  );
}

function FilterChip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 h-7 pl-2 pr-1 rounded-md bg-primary/10 text-primary text-xs font-medium">
      {label}
      <button
        onClick={onClear}
        className="w-4 h-4 rounded-sm hover:bg-primary/20 flex items-center justify-center"
        aria-label={`Remove ${label}`}
      >
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}

// Parse strings like "12 Apr 2026". Returns null for placeholders like "—".
export function parseActivityDate(s: string | undefined | null): Date | null {
  if (!s || s === "—") return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}
