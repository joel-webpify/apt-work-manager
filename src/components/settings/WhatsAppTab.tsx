import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Btn, Pill } from "@/components/layout/PageShell";
import { MessageCircle, Plus, Trash2 } from "lucide-react";
import { useWhatsApp, saveTemplates, getTemplates, placeholderCount, type TemplateCategory } from "@/lib/whatsappStore";
import { toast } from "@/hooks/use-toast";

const tone = { APPROVED: "success", PENDING: "warning", REJECTED: "danger" } as const;

export default function WhatsAppTab() {
  const { templates } = useWhatsApp();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState(""), [category, setCategory] = useState<TemplateCategory>("UTILITY"), [body, setBody] = useState("");
  const create = () => {
    const clean = name.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_");
    if (!clean || !body.trim()) return;
    saveTemplates([...getTemplates(), { name: clean, category, language: "en_GB", status: "PENDING", body, vars: Array.from({ length: placeholderCount(body) }, () => "first_name") }]);
    setCreating(false); setName(""); setBody("");
    toast({ title: "Template sent for review", description: "Meta usually approves within 48 hours (demo)." });
  };
  return <div className="max-w-3xl space-y-6">
    <div className="rounded-lg border-hairline bg-card p-4 flex items-center gap-3">
      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center"><MessageCircle className="h-5 w-5 text-primary" /></div>
      <div className="flex-1"><div className="text-sm font-medium">+44 7700 900 100 · Brightside Services</div><div className="text-xs text-muted-foreground">WhatsApp Business · Quality rating: High · Demo connection</div></div>
      <Pill tone="success">Connected</Pill>
    </div>
    <div>
      <div className="flex items-center justify-between mb-2"><h2 className="text-lg font-medium">Message templates</h2><Btn variant="primary" onClick={() => setCreating(!creating)}><Plus className="h-3.5 w-3.5" />New template</Btn></div>
      <p className="text-xs text-muted-foreground mb-3">Messages you start (reminders, campaigns) must use an approved template. Use {"{{1}}"}, {"{{2}}"} for details filled in per customer.</p>
      {creating && <div className="rounded-lg border-hairline bg-card p-4 space-y-3 mb-3">
        <div className="flex gap-2"><Input aria-label="Template name" placeholder="template_name" value={name} onChange={(e) => setName(e.target.value)} /><select aria-label="Category" value={category} onChange={(e) => setCategory(e.target.value as TemplateCategory)} className="h-10 rounded-md border-hairline bg-background px-2 text-sm"><option value="UTILITY">Booking update</option><option value="MARKETING">Marketing</option></select></div>
        <Textarea aria-label="Template body" placeholder="Hi {{1}}, your visit is booked for {{2}}…" value={body} onChange={(e) => setBody(e.target.value)} />
        <div className="flex justify-end gap-2"><Btn onClick={() => setCreating(false)}>Cancel</Btn><Btn variant="primary" onClick={create}>Submit for review</Btn></div>
      </div>}
      <div className="space-y-2">{templates.map((t) => <div key={t.name} className="rounded-lg border-hairline bg-card p-3">
        <div className="flex items-center gap-2"><span className="text-sm font-medium font-mono">{t.name}</span><Pill tone="neutral">{t.category === "UTILITY" ? "Booking update" : "Marketing"}</Pill><span className="flex-1" /><Pill tone={tone[t.status]}>{t.status.toLowerCase()}</Pill>
          <button aria-label={`Delete ${t.name}`} onClick={() => saveTemplates(getTemplates().filter((x) => x.name !== t.name))} className="h-7 w-7 flex items-center justify-center rounded hover:bg-destructive/10 text-destructive"><Trash2 className="h-3.5 w-3.5" /></button></div>
        <p className="text-sm text-muted-foreground mt-1.5">{t.body}</p>
        {t.status === "REJECTED" && <p className="text-xs text-destructive mt-1">Rejected: message is too short for the number of variables.</p>}
      </div>)}</div>
    </div>
  </div>;
}
