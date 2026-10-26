import { ExternalLink, Phone, Reply, FileText, Image as ImageIcon, Video } from "lucide-react";
import type { WaTemplate } from "@/lib/whatsappStore";
import { fillTemplate } from "@/lib/whatsappStore";
import { useBusinessSettings } from "@/lib/businessSettings";

export function PhonePreview({ template, values = {}, className = "" }: { template?: Partial<WaTemplate>; values?: Record<string, string>; className?: string }) {
  const business = useBusinessSettings();
  const body = template?.body ? fillTemplate(template.body, (template.vars ?? []).map((k) => values[k] || "")) : "";
  const h = template?.header;
  const MediaIcon = h?.type === "video" ? Video : h?.type === "document" ? FileText : ImageIcon;
  return <div className={`mx-auto w-[300px] rounded-[2.2rem] border-hairline bg-card p-2 shadow-sm ${className}`}>
    <div className="rounded-[1.8rem] bg-surface overflow-hidden">
      <div className="bg-primary px-4 py-3 text-primary-foreground text-sm font-medium">{business.name || "Your business"}</div>
      <div className="p-3 min-h-[360px]">
        {!template?.body ? <p className="text-xs text-center text-muted-foreground mt-10">Pick a template to preview it</p> :
        <div className="max-w-[240px]">
          <div className="rounded-lg rounded-tl-none bg-card shadow-sm overflow-hidden" data-testid="wa-preview">
            {h && h.type !== "none" && (h.type === "text"
              ? <div className="px-3 pt-2.5 text-sm font-semibold">{h.text}</div>
              : h.type === "image" && h.url ? <img src={h.url} alt="" className="h-32 w-full object-cover" />
              : <div className="h-28 bg-surface-hover flex items-center justify-center"><MediaIcon className="h-8 w-8 text-muted-foreground" /></div>)}
            <div className="px-3 py-2 text-sm whitespace-pre-wrap">{body}</div>
            {template.footer && <div className="px-3 pb-2 text-[11px] text-muted-foreground">{template.footer}</div>}
            <div className="px-3 pb-1.5 text-right text-[10px] text-muted-foreground">09:41</div>
          </div>
          {(template.buttons ?? []).map((b, i) => {
            const Icon = b.type === "url" ? ExternalLink : b.type === "call" ? Phone : Reply;
            return <div key={i} className="mt-1 rounded-lg bg-card shadow-sm py-2 text-center text-sm text-primary flex items-center justify-center gap-1.5"><Icon className="h-3.5 w-3.5" />{b.text || "Button"}</div>;
          })}
        </div>}
      </div>
    </div>
  </div>;
}
