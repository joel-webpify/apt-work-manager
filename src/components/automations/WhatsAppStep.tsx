import { Link } from "react-router-dom";
import { useWhatsApp } from "@/lib/whatsappStore";
import { PhonePreview } from "@/components/whatsapp/PhonePreview";

export function WhatsAppStep({ value, onChange }: { value?: string; onChange: (v: string) => void }) {
  const { templates } = useWhatsApp();
  const tpl = templates.find((t) => t.name === value);
  return <div className="space-y-2">
    <select aria-label="WhatsApp template" value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="h-8 w-full rounded-md border-hairline bg-background px-2 text-xs">
      <option value="">Pick a template…</option>
      {templates.map((t) => <option key={t.name} value={t.name} disabled={t.status !== "APPROVED"}>{t.name}{t.status !== "APPROVED" ? ` (${t.status.toLowerCase()})` : ""}</option>)}
    </select>
    {tpl && <>
      <div className="origin-top scale-[0.8] -mb-20"><PhonePreview template={tpl} values={Object.fromEntries(tpl.vars.map((v) => [v, `[${v}]`]))} /></div>
      <div className="text-[10px] text-muted-foreground">{tpl.vars.map((v, i) => `{{${i + 1}}} = ${v}`).join(" · ")} · Skipped when the contact has no mobile number or WhatsApp consent.</div>
      <Link to={`/whatsapp?tab=templates&edit=${tpl.name}`} className="text-xs text-primary">Edit template</Link>
    </>}
  </div>;
}
