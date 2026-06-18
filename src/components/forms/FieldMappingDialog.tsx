import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wand2 } from "lucide-react";
import type { BuilderForm } from "@/components/forms/FormBuilderDialog";
import { CORE_TARGET_META, guessTarget, type MappingTarget } from "@/lib/formFieldMapping";
import { useJobFieldSchema } from "@/lib/jobFields";

export default function FieldMappingDialog({
  open,
  onOpenChange,
  form,
  sampleLabels,
  initial,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  form: { id: string; name: string; fields?: BuilderForm["fields"] };
  /** Extra labels from past submissions (in case the form's builder fields are empty). */
  sampleLabels?: string[];
  initial?: Record<string, MappingTarget>;
  onSave: (formId: string, mapping: Record<string, MappingTarget>) => void;
}) {
  const [schema] = useJobFieldSchema();

  const syntheticLabels = useMemo(() => {
    const items: { label: string; hint: string }[] = [];
    if (form.booking?.enabled) items.push({ label: form.booking.label || "Booking slot", hint: "Booking step" });
    if (form.products && form.products.length > 0) items.push({ label: "Selected products", hint: "Products step" });
    if (form.quoteMode) items.push({ label: "Instant quote total", hint: "Quote step" });
    return items;
  }, [form.booking, form.products, form.quoteMode]);

  const labels = useMemo(() => {
    const set = new Set<string>();
    form.fields?.forEach((f) => f.type !== "section" && set.add(f.label));
    syntheticLabels.forEach((s) => set.add(s.label));
    sampleLabels?.forEach((l) => set.add(l));
    return Array.from(set);
  }, [form.fields, sampleLabels, syntheticLabels]);

  const [mapping, setMapping] = useState<Record<string, MappingTarget>>(() => {
    const init: Record<string, MappingTarget> = {};
    labels.forEach((l) => {
      init[l] = initial?.[l] ?? guessTarget(l, schema);
    });
    return init;
  });

  const autoFill = () => {
    const next: Record<string, MappingTarget> = {};
    labels.forEach((l) => (next[l] = guessTarget(l, schema)));
    setMapping(next);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Field mapping — {form.name}</DialogTitle>
          <DialogDescription>
            Choose where each form field lands when you click "Create job". Smart defaults are applied to every form; per-form overrides win.
          </DialogDescription>
        </DialogHeader>

        <div className="border-hairline rounded-lg overflow-hidden">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center px-3 h-9 text-xs text-muted-foreground font-medium bg-surface/40 border-b-hairline">
            <div>Form field</div>
            <div className="px-6">→</div>
            <div>Job field</div>
          </div>
          {labels.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              This form has no fields yet. Open the form editor to add some.
            </div>
          ) : (
            labels.map((label) => (
              <div key={label} className="grid grid-cols-[1fr_auto_1fr] items-center px-3 h-11 border-b-hairline last:border-0">
                <div className="text-sm truncate">{label}</div>
                <div className="px-6 text-muted-foreground">→</div>
                <Select value={mapping[label] ?? "ignore"} onValueChange={(v) => setMapping((m) => ({ ...m, [label]: v as MappingTarget }))}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ignore">— Don't import</SelectItem>
                    <SelectGroupLabel>Core job fields</SelectGroupLabel>
                    {(Object.keys(CORE_TARGET_META) as (keyof typeof CORE_TARGET_META)[]).map((k) => (
                      <SelectItem key={k} value={k}>{CORE_TARGET_META[k].label}</SelectItem>
                    ))}
                    {schema.length > 0 && <SelectGroupLabel>Custom fields</SelectGroupLabel>}
                    {schema.map((f) => (
                      <SelectItem key={f.id} value={`cf:${f.id}`}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))
          )}
        </div>

        <DialogFooter className="justify-between">
          <Button variant="ghost" size="sm" onClick={autoFill} className="text-muted-foreground">
            <Wand2 className="w-3.5 h-3.5" /> Auto-map by label
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={() => { onSave(form.id, mapping); onOpenChange(false); }}>Save mapping</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SelectGroupLabel({ children }: { children: React.ReactNode }) {
  return <div className="px-2 pt-2 pb-1 text-[10px] uppercase tracking-wide text-muted-foreground font-medium">{children}</div>;
}
