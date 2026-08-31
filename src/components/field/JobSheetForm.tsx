import { useState } from "react";
import { Check, Plus, Trash2, Wand2, Loader2 } from "lucide-react";
import { FIELD_CHECKLIST, patchRecord, type FieldRecord } from "@/lib/fieldStore";
import { templateFor } from "@/lib/fieldTemplates";
import QuickChips, { appendLine } from "./QuickChips";
import VoiceNoteButton from "./VoiceNoteButton";
import { tidyText } from "@/lib/fieldAi";
import { useToast } from "@/hooks/use-toast";

export default function JobSheetForm({
  jobId,
  employeeId,
  record,
  service,
  readOnly,
}: {
  jobId: string;
  employeeId: string;
  record: FieldRecord;
  service?: string;
  readOnly?: boolean;
}) {
  const tpl = templateFor(service);
  const { toast } = useToast();
  const [tidying, setTidying] = useState<null | "workDone" | "partsUsed">(null);

  const patch = (p: Partial<FieldRecord>) => {
    if (readOnly) return;
    patchRecord(jobId, employeeId, p);
  };

  const toggle = (id: string) => patch({ checklist: { ...record.checklist, [id]: !record.checklist[id] } });

  const addMeasurement = (label = "", value = "") =>
    patch({
      measurements: [
        ...record.measurements,
        { id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`, label, value },
      ],
    });

  const updateMeasurement = (id: string, p: { label?: string; value?: string }) =>
    patch({ measurements: record.measurements.map((m) => (m.id === id ? { ...m, ...p } : m)) });

  const removeMeasurement = (id: string) =>
    patch({ measurements: record.measurements.filter((m) => m.id !== id) });

  const tidy = async (field: "workDone" | "partsUsed") => {
    const value = record[field];
    if (!value.trim()) return;
    setTidying(field);
    try {
      const text = await tidyText(
        value,
        field === "workDone"
          ? "This describes work done on a customer's job. Keep it factual and readable for the customer."
          : "This is a list of parts and materials used on a job.",
      );
      patch({ [field]: text } as Partial<FieldRecord>);
    } catch (e) {
      toast({ title: "Couldn't tidy that up", description: (e as Error).message });
    } finally {
      setTidying(null);
    }
  };

  const suggestedMeasurements = tpl.measurements.filter(
    (m) => !record.measurements.some((r) => r.label.toLowerCase() === m.label.toLowerCase()),
  );

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        {FIELD_CHECKLIST.map((c) => {
          const on = Boolean(record.checklist[c.id]);
          return (
            <button
              key={c.id}
              type="button"
              disabled={readOnly}
              onClick={() => toggle(c.id)}
              className="w-full min-h-12 px-3 py-2 rounded-lg border-hairline bg-surface hover:bg-surface-hover flex items-center gap-3 text-left disabled:opacity-70"
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
        {!readOnly && suggestedMeasurements.length > 0 && (
          <QuickChips options={suggestedMeasurements.map((m) => m.label)} onPick={(l) => addMeasurement(l)} />
        )}
        {record.measurements.map((m) => (
          <div key={m.id} className="flex gap-2">
            <input
              value={m.label}
              readOnly={readOnly}
              onChange={(e) => updateMeasurement(m.id, { label: e.target.value })}
              placeholder="What (e.g. rear garden)"
              className="h-10 flex-1 min-w-0 rounded-lg border-hairline bg-background px-2.5 text-sm"
            />
            <input
              value={m.value}
              readOnly={readOnly}
              onChange={(e) => updateMeasurement(m.id, { value: e.target.value })}
              placeholder="Amount"
              className="h-10 w-24 rounded-lg border-hairline bg-background px-2.5 text-sm"
            />
            {!readOnly && (
              <button
                type="button"
                onClick={() => removeMeasurement(m.id)}
                aria-label="Remove row"
                className="w-10 h-10 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-surface-hover shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
        {!readOnly && (
          <button
            type="button"
            onClick={() => addMeasurement()}
            className="h-10 w-full rounded-lg border-hairline bg-surface hover:bg-surface-hover text-sm font-medium inline-flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add a measurement
          </button>
        )}
      </div>

      <div>
        <div className="text-xs font-medium text-muted-foreground mb-1.5">What did you do?</div>
        {!readOnly && (
          <QuickChips options={tpl.workDone} onPick={(t) => patch({ workDone: appendLine(record.workDone, t) })} />
        )}
        <textarea
          value={record.workDone}
          readOnly={readOnly}
          onChange={(e) => patch({ workDone: e.target.value })}
          rows={4}
          placeholder="Tap the words above, type it, or say it — whatever's quickest."
          className="w-full rounded-lg border-hairline bg-background px-2.5 py-2 text-sm resize-none"
        />
        {!readOnly && (
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <VoiceNoteButton
              label="Say it instead"
              onTranscript={(t) => patch({ workDone: appendLine(record.workDone, t) })}
            />
            <button
              type="button"
              disabled={!record.workDone.trim() || tidying === "workDone"}
              onClick={() => tidy("workDone")}
              className="h-9 px-3 rounded-full border-hairline bg-surface hover:bg-surface-hover text-xs font-medium inline-flex items-center gap-1.5 disabled:opacity-40"
            >
              {tidying === "workDone" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Wand2 className="w-3.5 h-3.5" />
              )}
              Tidy this up
            </button>
          </div>
        )}
      </div>

      <div>
        <div className="text-xs font-medium text-muted-foreground mb-1.5">Parts & materials used</div>
        {!readOnly && (
          <QuickChips options={tpl.parts} onPick={(t) => patch({ partsUsed: appendLine(record.partsUsed, t) })} />
        )}
        <textarea
          value={record.partsUsed}
          readOnly={readOnly}
          onChange={(e) => patch({ partsUsed: e.target.value })}
          rows={2}
          placeholder="e.g. 2 x TRV, 1 m of 15 mm pipe"
          className="w-full rounded-lg border-hairline bg-background px-2.5 py-2 text-sm resize-none"
        />
        {!readOnly && (
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <VoiceNoteButton
              label="Say it instead"
              onTranscript={(t) => patch({ partsUsed: appendLine(record.partsUsed, t) })}
            />
            <button
              type="button"
              disabled={!record.partsUsed.trim() || tidying === "partsUsed"}
              onClick={() => tidy("partsUsed")}
              className="h-9 px-3 rounded-full border-hairline bg-surface hover:bg-surface-hover text-xs font-medium inline-flex items-center gap-1.5 disabled:opacity-40"
            >
              {tidying === "partsUsed" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Wand2 className="w-3.5 h-3.5" />
              )}
              Tidy this up
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
