import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Btn, Pill } from "@/components/layout/PageShell";
import { MessageCircle, Plus, Send } from "lucide-react";
import { contacts } from "@/data/mockData";
import { useWhatsApp, saveCampaigns, getCampaigns, segments, canSend, fillTemplate, MARKETING_COST } from "@/lib/whatsappStore";
import { resolveMergeFields } from "@/lib/emailMergeFields";
import { toast } from "@/hooks/use-toast";

export function WhatsAppCampaignsTab() {
  const { campaigns, templates, consents } = useWhatsApp();
  const [open, setOpen] = useState(false);
  const approved = templates.filter((t) => t.category === "MARKETING" && t.status === "APPROVED");
  const [name, setName] = useState("New WhatsApp campaign");
  const [segment, setSegment] = useState(segments[1].name);
  const [template, setTemplate] = useState(approved[0]?.name ?? "");
  const [contactId, setContactId] = useState(contacts[0]?.id ?? "");
  const [when, setWhen] = useState("");
  const tpl = templates.find((t) => t.name === template);
  // Demo audience split: real contacts decide the ratio, segment size scales it.
  const size = segments.find((s) => s.name === segment)?.size ?? 0;
  const eligibleShare = contacts.filter((c) => canSend(consents[c.id], c.phone, "MARKETING").ok).length / Math.max(1, contacts.length);
  const receive = Math.round(size * Math.max(eligibleShare, 0.6)), skipped = size - receive;
  const preview = useMemo(() => {
    if (!tpl) return "";
    const v = resolveMergeFields(contactId, { values: { promo_code: "SPRING15" } });
    return fillTemplate(tpl.body, tpl.vars.map((k) => v[k] || ""));
  }, [tpl, contactId]);
  const launch = () => {
    saveCampaigns([{ id: `wac-${Date.now()}`, name, template, segment, status: when ? "Scheduled" : "Sent", scheduledFor: when || undefined, recipients: receive, skipped, delivered: when ? 0 : Math.round(receive * 0.96), failed: when ? 0 : Math.round(receive * 0.04), read: when ? 0 : Math.round(receive * 0.7) }, ...getCampaigns()]);
    setOpen(false); toast({ title: when ? "Campaign scheduled" : "Campaign sent (demo)", description: `${receive} customers, ${skipped} skipped.` });
  };
  const sel = "h-9 w-full rounded-md border-hairline bg-background px-2.5 text-sm";
  return <div className="space-y-4">
    <div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">Marketing messages on WhatsApp. Only contacts who agreed to WhatsApp marketing receive them.</p><Btn variant="primary" onClick={() => setOpen(!open)}><Plus className="h-3.5 w-3.5" />New WhatsApp campaign</Btn></div>
    {open && <div className="rounded-lg border-hairline bg-card p-4 grid gap-6 md:grid-cols-[1fr_300px]">
      <div className="space-y-3">
        <label className="block text-xs font-medium">Name<Input className="mt-1" value={name} onChange={(e) => setName(e.target.value)} /></label>
        <label className="block text-xs font-medium">Send to<select aria-label="Segment" className={`${sel} mt-1`} value={segment} onChange={(e) => setSegment(e.target.value)}>{segments.map((s) => <option key={s.name}>{s.name}</option>)}</select></label>
        <label className="block text-xs font-medium">Template<select aria-label="Template" className={`${sel} mt-1`} value={template} onChange={(e) => setTemplate(e.target.value)}>{approved.map((t) => <option key={t.name}>{t.name}</option>)}</select></label>
        {tpl && <div className="text-xs space-y-1">{tpl.vars.map((v, i) => <div key={i} className="flex gap-2"><span className="font-mono text-muted-foreground w-10">{`{{${i + 1}}}`}</span><span className="font-mono">{v}</span></div>)}</div>}
        <label className="block text-xs font-medium">Preview as<select aria-label="Preview contact" className={`${sel} mt-1`} value={contactId} onChange={(e) => setContactId(e.target.value)}>{contacts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        <label className="block text-xs font-medium">Schedule (leave empty to send now)<Input className="mt-1" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} /></label>
        <div className="rounded-md bg-surface p-3 text-sm"><b>{receive}</b> will receive · <b>{skipped}</b> skipped (no consent / no mobile) · est. cost €{(receive * MARKETING_COST).toFixed(2)}</div>
        <div className="flex justify-end gap-2"><Btn onClick={() => setOpen(false)}>Cancel</Btn><Btn variant="primary" onClick={launch} disabled={!tpl}><Send className="h-3.5 w-3.5" />{when ? "Schedule" : "Send now"}</Btn></div>
      </div>
      <div className="mx-auto w-[280px] rounded-[2rem] border-hairline bg-surface p-3">
        <div className="text-xs text-center text-muted-foreground mb-3">Brightside Services</div>
        <div className="rounded-lg rounded-tl-none bg-card p-3 text-sm shadow-sm whitespace-pre-wrap" data-testid="wa-preview">{preview || "Pick an approved template"}</div>
      </div>
    </div>}
    <div className="space-y-2">{campaigns.map((c) => <div key={c.id} className="rounded-lg border-hairline bg-card p-4 flex items-center gap-4">
      <div className="h-9 w-9 rounded-md bg-surface flex items-center justify-center"><MessageCircle className="h-4 w-4 text-primary" /></div>
      <div className="flex-1 min-w-0"><div className="text-sm font-medium">{c.name}</div><div className="text-xs text-muted-foreground">{c.segment} · {c.template}{c.scheduledFor ? ` · ${c.scheduledFor.replace("T", " ")}` : ""}</div></div>
      {c.status === "Sent" && <div className="hidden sm:flex gap-4 text-xs text-muted-foreground"><span><b className="text-foreground">{c.delivered}</b> delivered</span><span><b className="text-foreground">{c.read}</b> read</span><span><b className="text-foreground">{c.failed}</b> failed</span></div>}
      <Pill tone={c.status === "Sent" ? "success" : c.status === "Scheduled" ? "info" : "neutral"}>{c.status}</Pill>
    </div>)}</div>
  </div>;
}
