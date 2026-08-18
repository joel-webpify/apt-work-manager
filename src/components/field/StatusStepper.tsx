import { fieldStatusSteps, type FieldRecord, type FieldStatus } from "@/lib/fieldStore";
import { Check } from "lucide-react";

const order: FieldStatus[] = ["not-started", "on-my-way", "arrived", "working", "finished"];

function time(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export default function StatusStepper({
  record,
  onSet,
}: {
  record: FieldRecord;
  onSet: (s: Exclude<FieldStatus, "not-started">) => void;
}) {
  const currentIdx = order.indexOf(record.status);

  return (
    <div className="grid grid-cols-2 gap-2">
      {fieldStatusSteps.map((s) => {
        const idx = order.indexOf(s.id);
        const done = idx <= currentIdx;
        const isCurrent = record.status === s.id;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onSet(s.id)}
            className={`h-14 rounded-lg text-sm font-medium flex flex-col items-center justify-center gap-0.5 transition-colors border-hairline ${
              isCurrent
                ? "bg-primary text-primary-foreground"
                : done
                  ? "bg-[hsl(var(--success)/0.12)] text-[hsl(var(--success))]"
                  : "bg-surface text-foreground hover:bg-surface-hover"
            }`}
          >
            <span className="inline-flex items-center gap-1.5">
              {done && !isCurrent && <Check className="w-3.5 h-3.5" />}
              {s.label}
            </span>
            {record.stamps[s.id] && (
              <span className={`text-[11px] ${isCurrent ? "opacity-80" : "text-muted-foreground"}`}>
                {time(record.stamps[s.id])}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
