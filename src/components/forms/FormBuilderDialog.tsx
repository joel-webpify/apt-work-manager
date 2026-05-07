import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, ArrowUp, ArrowDown, GripVertical, Mail, Phone, Type, AlignLeft, ListChecks, Hash } from "lucide-react";

export type FieldType = "text" | "email" | "phone" | "textarea" | "select" | "number";

export interface BuilderField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
}

export interface BuilderForm {
  id: string;
  name: string;
  trade: string;
  description?: string;
  fields: BuilderField[];
}

const fieldTypeMeta: Record<FieldType, { label: string; icon: typeof Type }> = {
  text: { label: "Short text", icon: Type },
  email: { label: "Email", icon: Mail },
  phone: { label: "Phone", icon: Phone },
  textarea: { label: "Long text", icon: AlignLeft },
  select: { label: "Dropdown", icon: ListChecks },
  number: { label: "Number", icon: Hash },
};

const newField = (type: FieldType): BuilderField => ({
  id: `f-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  type,
  label: fieldTypeMeta[type].label,
  placeholder: "",
  required: false,
  options: type === "select" ? ["Option 1", "Option 2"] : undefined,
});

export function FormBuilderDialog({
  open,
  onOpenChange,
  initial,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: BuilderForm;
  onSave: (form: BuilderForm) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [trade, setTrade] = useState(initial?.trade ?? "General");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [fields, setFields] = useState<BuilderField[]>(
    initial?.fields ?? [
      { id: "f-name", type: "text", label: "Full name", required: true },
      { id: "f-email", type: "email", label: "Email", required: true },
      { id: "f-phone", type: "phone", label: "Phone", required: false },
      { id: "f-msg", type: "textarea", label: "How can we help?", required: false },
    ],
  );

  const update = (id: string, patch: Partial<BuilderField>) =>
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  const remove = (id: string) => setFields((prev) => prev.filter((f) => f.id !== id));
  const move = (id: string, dir: -1 | 1) =>
    setFields((prev) => {
      const i = prev.findIndex((f) => f.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      id: initial?.id ?? `form-${Date.now()}`,
      name: name.trim(),
      trade,
      description: description.trim() || undefined,
      fields,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit form" : "New form"}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-[1fr_1fr] gap-6 overflow-hidden flex-1">
          {/* Left — config */}
          <div className="overflow-y-auto pr-2 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Form name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Boiler service quote" />
              </div>
              <div className="space-y-1.5">
                <Label>Trade</Label>
                <Select value={trade} onValueChange={setTrade}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["General", "Plumbing", "Electrical", "Window cleaning", "Landscaping"].map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Description (optional)</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Shown above the form on your site" />
            </div>

            <div className="border-hairline rounded-lg">
              <div className="px-3 h-10 flex items-center justify-between border-b-hairline">
                <span className="text-sm font-medium">Fields</span>
                <Select onValueChange={(v) => setFields((p) => [...p, newField(v as FieldType)])}>
                  <SelectTrigger className="h-7 w-[150px] text-xs">
                    <Plus className="w-3 h-3 mr-1" /><SelectValue placeholder="Add field" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(fieldTypeMeta) as FieldType[]).map((t) => {
                      const Icon = fieldTypeMeta[t].icon;
                      return (
                        <SelectItem key={t} value={t}>
                          <span className="inline-flex items-center gap-2"><Icon className="w-3.5 h-3.5" />{fieldTypeMeta[t].label}</span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="divide-y divide-border">
                {fields.map((f, idx) => {
                  const Icon = fieldTypeMeta[f.type].icon;
                  return (
                    <div key={f.id} className="p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <GripVertical className="w-3.5 h-3.5 text-muted-foreground" />
                        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                        <Input
                          value={f.label}
                          onChange={(e) => update(f.id, { label: e.target.value })}
                          className="h-8 flex-1"
                          placeholder="Field label"
                        />
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => move(f.id, -1)} disabled={idx === 0}>
                          <ArrowUp className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => move(f.id, 1)} disabled={idx === fields.length - 1}>
                          <ArrowDown className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => remove(f.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-3 pl-6">
                        <Input
                          value={f.placeholder ?? ""}
                          onChange={(e) => update(f.id, { placeholder: e.target.value })}
                          className="h-7 text-xs flex-1"
                          placeholder="Placeholder text"
                        />
                        <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Checkbox checked={f.required} onCheckedChange={(v) => update(f.id, { required: !!v })} />
                          Required
                        </label>
                      </div>
                      {f.type === "select" && (
                        <div className="pl-6">
                          <Textarea
                            value={(f.options ?? []).join("\n")}
                            onChange={(e) => update(f.id, { options: e.target.value.split("\n").filter(Boolean) })}
                            rows={3}
                            className="text-xs"
                            placeholder={"One option per line"}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
                {fields.length === 0 && (
                  <div className="p-6 text-center text-sm text-muted-foreground">No fields yet — add one above.</div>
                )}
              </div>
            </div>
          </div>

          {/* Right — preview */}
          <div className="overflow-y-auto border-hairline rounded-lg bg-surface/40 p-5">
            <div className="text-xs uppercase tracking-wide text-muted-foreground mb-3">Live preview</div>
            <div className="bg-card border-hairline rounded-lg p-5 space-y-4">
              <div>
                <h3 className="text-base font-medium">{name || "Form name"}</h3>
                {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
              </div>
              {fields.map((f) => (
                <div key={f.id} className="space-y-1.5">
                  <Label className="text-xs">
                    {f.label} {f.required && <span className="text-destructive">*</span>}
                  </Label>
                  {f.type === "textarea" ? (
                    <Textarea placeholder={f.placeholder} rows={3} disabled />
                  ) : f.type === "select" ? (
                    <Select disabled>
                      <SelectTrigger><SelectValue placeholder={f.placeholder || "Select..."} /></SelectTrigger>
                    </Select>
                  ) : (
                    <Input
                      type={f.type === "number" ? "number" : f.type === "email" ? "email" : f.type === "phone" ? "tel" : "text"}
                      placeholder={f.placeholder}
                      disabled
                    />
                  )}
                </div>
              ))}
              <Button className="w-full" disabled>Submit</Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!name.trim()}>{initial ? "Save changes" : "Create form"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
