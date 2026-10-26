import { useState } from "react";
import { Btn, Pill } from "@/components/layout/PageShell";
import { Plus, Trash2, Pencil, CheckCircle2 } from "lucide-react";
import { useWhatsApp, saveTemplates, getTemplates, type WaTemplate } from "@/lib/whatsappStore";
import { TemplateEditor } from "./TemplateEditor";
import { toast } from "@/hooks/use-toast";

const tone = { APPROVED: "success", PENDING: "warning", REJECTED: "danger" } as const;
const blank: WaTemplate = { name: "new_template", category: "UTILITY", language: "en_GB", status: "PENDING", body: "", vars: [], header: { type: "none" }, footer: "", buttons: [] };

export function TemplatesList({ editName, onEdited }: { editName?: string; onEdited?: () => void }) {
  const { templates } = useWhatsApp();
  const [editing, setEditing] = useState<{ t: WaTemplate; orig?: string } | null>(() => {
    const t = editName ? getTemplates().find((x) => x.name === editName) : undefined;
    return t ? { t, orig: t.name } : null;
  });
  const save = (t: WaTemplate, submit: boolean) => {
    const rest = getTemplates().filter((x) => x.name !== editing?.orig && x.name !== t.name);
    saveTemplates([{ ...t, status: submit ? "PENDING" : t.status }, ...rest]);
    setEditing(null); onEdited?.();
    toast({ title: submit ? "Sent for review" : "Template saved", description: submit ? "Meta usually approves within 48 hours (demo)." : undefined });
  };
  const approve = (name: string) => saveTemplates(getTemplates().map((x) => x.name === name ? { ...x, status: "APPROVED" } : x));
  return <div className="space-y-3">
    <div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">Messages you start must use an approved template.</p><Btn variant="primary" onClick={() => setEditing({ t: blank })}><Plus className="h-3.5 w-3.5" />New template</Btn></div>
    <div className="rounded-lg border-hairline bg-card divide-y divide-border">
      {templates.map((t) => <div key={t.name} className="p-3 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2"><span className="text-sm font-medium font-mono">{t.name}</span><Pill tone="neutral">{t.category === "UTILITY" ? "Booking update" : "Marketing"}</Pill><span className="text-xs text-muted-foreground">{t.language}</span></div>
          <p className="text-xs text-muted-foreground truncate mt-0.5">{t.body}</p>
        </div>
        <span className="hidden md:block text-xs text-muted-foreground w-28">{t.lastUsed ? `Used ${new Date(t.lastUsed).toLocaleDateString()}` : "Not used yet"}</span>
        <Pill tone={tone[t.status]}>{t.status.toLowerCase()}</Pill>
        {t.status === "PENDING" && <button title="Approve (demo)" aria-label={`Approve ${t.name}`} onClick={() => approve(t.name)} className="h-7 w-7 flex items-center justify-center rounded hover:bg-surface-hover"><CheckCircle2 className="h-3.5 w-3.5" /></button>}
        <button aria-label={`Edit ${t.name}`} onClick={() => setEditing({ t, orig: t.name })} className="h-7 w-7 flex items-center justify-center rounded hover:bg-surface-hover"><Pencil className="h-3.5 w-3.5" /></button>
        <button aria-label={`Delete ${t.name}`} onClick={() => saveTemplates(getTemplates().filter((x) => x.name !== t.name))} className="h-7 w-7 flex items-center justify-center rounded hover:bg-destructive/10 text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
      </div>)}
    </div>
    {editing && <TemplateEditor initial={editing.t} onBack={() => { setEditing(null); onEdited?.(); }} onSave={save} />}
  </div>;
}
