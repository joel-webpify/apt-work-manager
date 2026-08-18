import { Check, Plus, Trash2 } from "lucide-react";
import { FIELD_CHECKLIST, patchRecord, type FieldRecord } from "@/lib/fieldStore";

export default function JobSheetForm({ jobId, record }: { jobId: string; record: FieldRecord }) {
  const toggle = (id: string) =>
    patchRecord(jobId, { checklist: { ...record.checklist, [id]: !record.checklist[id] } });

  const addMeasurement = () =>
    patchRecord(jobId, {
      measurements: [...record.measurements, { id: `m-${Date.now()}`, label: "", value: "" }],
    });

  const updateMeasurement = (id: string, patch: { label?: string; value?: string }) =>
    patchRecord(jobId, {
      measurements: record.measurements.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    });

  const removeMeasurement = (id: string) =>
    patchRecord(jobId, { measurements: record.measurements.filter((m) => m.id !== id) });

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        {FIELD_CHECKLIST.map((c) => {
          const on = Boolean(record.checklist[c.id]);
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => toggle(c.id)}
              className="w-full min-h-12 px-3 py-2 rounded-lg border-hairline bg-surface hover:bg-surface-hover flex items-center gap-3 text-left"
            >
              <span
                className={`w-5 h-5 rounded shrink-0 flex items-center justify-center border-hairline ${
                  on ? "bg-[hsl(var(--success))] text-primary-foreground" : "bg-background"
                }`}
              >
                {on && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
              </span>
              <span className={`text-sm ${on ? "text-muted-foreground line-through" : ""}`}>{c.label}</span>
            </button>
          );
        })}
      </div>

      <div className="space-y-2">
        <div className="text-xs font-medium text-muted-foreground">Measurements & quantities</div>
        {record.measurements.map((m) => (
          <div key={m.id} className="flex gap-2">
            <input
              value={m.label}
              onChange={(e) => updateMeasurement(m.id, { label: e.target.value })}
              placeholder="What (e.g. rear garden)"
              className="h-10 flex-1 min-w-0 rounded-lg border-hairline bg-background px-2.5 text-sm"
            />
            <input
              value={m.value}
              onChange={(e) => updateMeasurement(m.id, { value: e.target.value })}
              placeholder="Amount"
              className="h-10 w-24 rounded-lg border-hairline bg-background px-2.5 text-sm"
            />
            <button
              type="button"
              onClick={() => removeMeasurement(m.id)}
              aria-label="Remove row"
              className="w-10 h-10 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-surface-hover shrink-0"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addMeasurement}
          className="h-10 w-full rounded-lg border-hairline bg-surface hover:bg-surface-hover text-sm font-medium inline-flex items-center justify-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Add a measurement
        </button>
      </div>

      <label className="block">
        <div className="text-xs font-medium text-muted-foreground mb-1">What did you do?</div>
        <textarea
          value={record.workDone}
          onChange={(e) => patchRecord(jobId, { workDone: e.target.value })}
          rows={4}
          placeholder="Describe the work in plain words — this goes back to the office."
          className="w-full rounded-lg border-hairline bg-background px-2.5 py-2 text-sm resize-none"
        />
      </label>

      <label className="block">
        <div className="text-xs font-medium text-muted-foreground mb-1">Parts & materials used</div>
        <textarea
          value={record.partsUsed}
          onChange={(e) => patchRecord(jobId, { partsUsed: e.target.value })}
          rows={2}
          placeholder="e.g. 2 x TRV, 1 m of 15 mm pipe"
          className="w-full rounded-lg border-hairline bg-background px-2.5 py-2 text-sm resize-none"
        />
      </label>
    </div>
  );
}
