import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Btn } from "@/components/layout/PageShell";
import {
  JobCustomField,
  JobFieldType,
  JOB_FIELD_TYPE_META,
  makeNewField,
} from "@/lib/jobFields";
import { Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  schema: JobCustomField[];
  onSave: (schema: JobCustomField[]) => void;
}

export default function ManageJobFieldsDialog({ open, onOpenChange, schema, onSave }: Props) {
  const [fields, setFields] = useState<JobCustomField[]>(schema);

  useEffect(() => { if (open) setFields(schema); }, [open, schema]);

  const update = (id: string, patch: Partial<JobCustomField>) =>
    setFields((p) => p.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  const remove = (id: string) => setFields((p) => p.filter((f) => f.id !== id));
  const move = (id: string, dir: -1 | 1) =>
    setFields((p) => {
      const i = p.findIndex((f) => f.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= p.length) return p;
      const next = [...p];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  const add = (type: JobFieldType) => setFields((p) => [...p, makeNewField(type)]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage job fields</DialogTitle>
          <DialogDescription>
            Add custom fields to capture extra info on every job. Available in the New Job form, the job drawer, and (optionally) on board cards.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {fields.length === 0 && (
            <div className="text-sm text-muted-foreground border-hairline rounded-md p-4 text-center">
              No custom fields yet. Add one below.
            </div>
          )}
          {fields.map((f, idx) => (
            <div key={f.id} className="border-hairline rounded-md p-3 space-y-2">
              <div className="flex items-start gap-2">
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <label className="block">
                    <div className="text-xs font-medium text-muted-foreground mb-1">Label</div>
                    <input
                      value={f.label}
                      onChange={(e) => update(f.id, { label: e.target.value })}
                      className="w-full h-8 rounded-md border-hairline bg-background px-2 text-sm"
                    />
                  </label>
                  <label className="block">
                    <div className="text-xs font-medium text-muted-foreground mb-1">Type</div>
                    <select
                      value={f.type}
                      onChange={(e) => {
                        const t = e.target.value as JobFieldType;
                        update(f.id, {
                          type: t,
                          options: t === "select" ? (f.options ?? ["Option 1", "Option 2"]) : undefined,
                        });
                      }}
                      className="w-full h-8 rounded-md border-hairline bg-background px-2 text-sm"
                    >
                      {Object.entries(JOB_FIELD_TYPE_META).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="flex items-center gap-1 pt-5">
                  <IconBtn onClick={() => move(f.id, -1)} disabled={idx === 0}><ArrowUp className="w-3.5 h-3.5" /></IconBtn>
                  <IconBtn onClick={() => move(f.id, 1)} disabled={idx === fields.length - 1}><ArrowDown className="w-3.5 h-3.5" /></IconBtn>
                  <IconBtn onClick={() => remove(f.id)}><Trash2 className="w-3.5 h-3.5" /></IconBtn>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <div className="text-xs font-medium text-muted-foreground mb-1">Placeholder</div>
                  <input
                    value={f.placeholder ?? ""}
                    onChange={(e) => update(f.id, { placeholder: e.target.value })}
                    className="w-full h-8 rounded-md border-hairline bg-background px-2 text-sm"
                  />
                </label>
                <div className="flex items-end gap-3 pb-1">
                  <label className="inline-flex items-center gap-1.5 text-xs">
                    <input type="checkbox" checked={!!f.required} onChange={(e) => update(f.id, { required: e.target.checked })} />
                    Required
                  </label>
                  <label className="inline-flex items-center gap-1.5 text-xs">
                    <input type="checkbox" checked={!!f.showOnCard} onChange={(e) => update(f.id, { showOnCard: e.target.checked })} />
                    Show on board card
                  </label>
                </div>
              </div>

              {f.type === "select" && (
                <label className="block">
                  <div className="text-xs font-medium text-muted-foreground mb-1">Options (one per line)</div>
                  <textarea
                    value={(f.options ?? []).join("\n")}
                    onChange={(e) => update(f.id, { options: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean) })}
                    rows={3}
                    className="w-full rounded-md border-hairline bg-background px-2 py-1.5 text-sm resize-none"
                  />
                </label>
              )}
            </div>
          ))}

          <div className="flex flex-wrap gap-1.5 pt-1">
            {(Object.keys(JOB_FIELD_TYPE_META) as JobFieldType[]).map((t) => (
              <button
                key={t}
                onClick={() => add(t)}
                className="h-8 px-2.5 rounded-md text-xs font-medium border-hairline hover:bg-surface-hover inline-flex items-center gap-1.5"
              >
                <Plus className="w-3 h-3" /> {JOB_FIELD_TYPE_META[t].label}
              </button>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Btn variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Btn>
          <Btn variant="primary" onClick={() => { onSave(fields); onOpenChange(false); }}>Save fields</Btn>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function IconBtn({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-7 h-7 rounded-md inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-surface-hover disabled:opacity-30 disabled:pointer-events-none"
    >
      {children}
    </button>
  );
}
