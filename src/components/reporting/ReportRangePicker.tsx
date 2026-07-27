import { Calendar } from "lucide-react";
import { RANGES, rangeShort, rangeLabels, type DateRange } from "@/lib/reportingData";

export function ReportRangePicker({
  value,
  onChange,
}: {
  value: DateRange;
  onChange: (r: DateRange) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
      <div className="inline-flex border-hairline rounded-md p-0.5 bg-card">
        {RANGES.map((r) => (
          <button
            key={r}
            title={rangeLabels[r]}
            onClick={() => onChange(r)}
            className={`h-6 px-2.5 text-xs rounded transition-colors ${
              value === r ? "bg-surface-hover text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {rangeShort[r]}
          </button>
        ))}
      </div>
    </div>
  );
}
