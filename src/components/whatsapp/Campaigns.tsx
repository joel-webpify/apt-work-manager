import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Btn, Pill } from "@/components/layout/PageShell";
import { MessageCircle, Plus, Send } from "lucide-react";
import { contacts } from "@/data/mockData";
import { useWhatsApp, saveCampaigns, getCampaigns, getTemplates, saveTemplates, segments, audienceSplit, MARKETING_COST } from "@/lib/whatsappStore";
import { resolveMergeFields, mergeFieldGroups } from "@/lib/emailMergeFields";
import { PhonePreview } from "./PhonePreview";
import { toast } from "@/hooks/use-toast";

const steps = ["Audience", "Message", "Details", "Send"] as const;
const sel = "h-9 w-full rounded-md border-hairline bg-background px-2.5 text-sm";

export function Campaigns() {
  const { campaigns, templates, consents } = useWhatsApp();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const approved = templates.filter((t) => t.category === "MARKETING" && t.status === "APPROVED");
  const [name, setName] = useState("New WhatsApp campaign");
  const [segment, setSegment] = useState(segments[1].name);
  const [lifecycle, setLifecycle] = useState("any");
  const [postcode, setPostcode] = useState("");
  const [lastJobMonths, setLastJobMonths] = useState("any");
  const [template, setTemplate] = useState(approved[0]?.name ?? "");
  const [overrides, setOverrides] = useState<Record<string, string>>({ promo_code: "SPRING15" });
  const [contactId, setContactId] = useState(contacts[0]?.id ?? "");
  const [when, setWhen] = useState("");
  const tpl = templates.find((t) => t.name === template);

  const people = contacts.filter((c) => (lifecycle === "any" || c.lifecycle === lifecycle) && (!postcode || c.postcode.toUpperCase().startsWith(postcode.toUpperCase()))
    && (lastJobMonths === "any" || (c.lastJob && Date.now() - new Date(c.lastJob).getTime() > Number(lastJobMonths) * 30 * 864e5)));
  const split = audienceSplit(people, consents, "MARKETING");
  // Demo scale: sample contacts set the ratio, segment size sets the volume.
  const size = Math.round((segments.find((s) => s.name === segment)?.size ?? 0) * (people.length / Math.max(1, contacts.length)));
  const receive = Math.round(size * (split.receive / Math.max(1, people.length))), skipped = size - receive;
  const values = useMemo(() => ({ ...resolveMergeFields(contactId, { values: overrides }), ...overrides }), [contactId, overrides]);
  const reset = () => { setOpen(false); setStep(0); };
  const launch = () => {
    saveCampaigns([{ id: `wac-${Date.now()}`, name, template, segment, status: when ? "Scheduled" : "Sent", scheduledFor: when || undefined, recipients: receive, skipped, delivered: when ? 0 : Math.round(receive * 0.96), failed: when ? 0 : Math.round(receive * 0.04), read: when ? 0 : Math.round(receive * 0.7) }, ...getCampaigns()]);
    saveTemplates(getTemplates().map((t) => t.name === template ? { ...t, lastUsed: new Date().toISOString() } : t));
    reset(); toast({ title: when ? "Campaign scheduled" : "Campaign sent (demo)", description: `${receive} customers, ${skipped} skipped.` });
  };
  const nonContactVars = (tpl?.vars ?? []).filter((v) => mergeFieldGroups.Promo.includes(v));

  return <div className="space-y-4">
    <div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">Only contacts who agreed to WhatsApp marketing receive campaigns.</p><Btn variant="primary" onClick={() => (open ? reset() : setOpen(true))}><Plus className="h-3.5 w-3.5" />New campaign</Btn></div>
    {open && <div className="rounded-lg border-hairline bg-card p-4 grid gap-6 md:grid-cols-[1fr_300px]">
      <div className="space-y-4">
        <div className="flex gap-1">{steps.map((s, i) => <button key={s} onClick={() => setStep(i)} className={`flex-1 text-xs py-1.5 border-b-2 ${i === step ? "border-primary font-medium" : i < step ? "border-primary/40 text-muted-foreground" : "border-transparent text-muted-foreground"}`}>{i + 1}. {s}</button>)}</div>
        {step === 0 && <div className="space-y-3">
          <label className="block text-xs font-medium">Campaign name<Input className="mt-1" value={name} onChange={(e) => setName(e.target.value)} /></label>
          <label className="block text-xs font-medium">Segment<select aria-label="Segment" className={`${sel} mt-1`} value={segment} onChange={(e) => setSegment(e.target.value)}>{segments.map((s) => <option key={s.name}>{s.name}</option>)}</select></label>
          <div className="grid grid-cols-3 gap-2">
            <label className="block text-xs font-medium">Status<select aria-label="Lifecycle" className={`${sel} mt-1`} value={lifecycle} onChange={(e) => setLifecycle(e.target.value)}><option value="any">Any</option><option>Lead</option><option>Customer</option><option>Lapsed</option></select></label>
            <label className="block text-xs font-medium">Last job over<select aria-label="Last job" className={`${sel} mt-1`} value={lastJobMonths} onChange={(e) => setLastJobMonths(e.target.value)}><option value="any">Any time</option><option value="6">6 months ago</option><option value="12">12 months ago</option></select></label>
            <label className="block text-xs font-medium">Postcode starts<Input aria-label="Postcode" className="mt-1" placeholder="BS" value={postcode} onChange={(e) => setPostcode(e.target.value)} /></label>
          </div>
        </div>}
        {step === 1 && <label className="block text-xs font-medium">Approved marketing template<select aria-label="Template" className={`${sel} mt-1`} value={template} onChange={(e) => setTemplate(e.target.value)}>{approved.map((t) => <option key={t.name}>{t.name}</option>)}</select></label>}
        {step === 2 && <div className="space-y-2">
          {tpl?.vars.map((v, i) => <div key={i} className="flex items-center gap-2 text-xs"><span className="font-mono text-muted-foreground w-10">{`{{${i + 1}}}`}</span><span className="font-mono w-32">{v}</span>
            {nonContactVars.includes(v) ? <Input aria-label={v} className="h-8" value={overrides[v] ?? ""} onChange={(e) => setOverrides({ ...overrides, [v]: e.target.value })} /> : <span className="text-muted-foreground">Filled per customer</span>}</div>)}
          <label className="block text-xs font-medium pt-2">Preview as<select aria-label="Preview contact" className={`${sel} mt-1`} value={contactId} onChange={(e) => setContactId(e.target.value)}>{contacts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        </div>}
        {step === 3 && <div className="space-y-3">
          <label className="block text-xs font-medium">Schedule (leave empty to send now)<Input className="mt-1" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} /></label>
          <div className="rounded-md bg-surface p-3 text-sm space-y-1"><div><b>{receive}</b> will receive · <b>{skipped}</b> skipped · est. cost €{(receive * MARKETING_COST).toFixed(2)}</div>
            {Object.entries(split.reasons).map(([r, n]) => <div key={r} className="text-xs text-muted-foreground">{r}: {Math.round(skipped * n / Math.max(1, split.skipped))}</div>)}</div>
        </div>}
        <div className="flex justify-between"><Btn onClick={() => (step ? setStep(step - 1) : reset())}>{step ? "Back" : "Cancel"}</Btn>
          {step < 3 ? <Btn variant="primary" disabled={step === 1 && !tpl} onClick={() => setStep(step + 1)}>Next</Btn> : <Btn variant="primary" onClick={launch} disabled={!tpl}><Send className="h-3.5 w-3.5" />{when ? "Schedule" : "Send now"}</Btn>}</div>
      </div>
      <PhonePreview template={tpl} values={values} />
    </div>}
    <div className="space-y-2">{campaigns.map((c) => <div key={c.id} className="rounded-lg border-hairline bg-card p-4 flex items-center gap-4">
      <div className="h-9 w-9 rounded-md bg-surface flex items-center justify-center"><MessageCircle className="h-4 w-4 text-primary" /></div>
      <div className="flex-1 min-w-0"><div className="text-sm font-medium">{c.name}</div><div className="text-xs text-muted-foreground">{c.segment} · {c.template}{c.scheduledFor ? ` · ${c.scheduledFor.replace("T", " ")}` : ""}</div></div>
      {c.status === "Sent" && <div className="hidden sm:flex gap-4 text-xs text-muted-foreground"><span><b className="text-foreground">{c.delivered}</b> delivered</span><span><b className="text-foreground">{c.read}</b> read</span><span><b className="text-foreground">{c.skipped}</b> skipped</span></div>}
      <Pill tone={c.status === "Sent" ? "success" : c.status === "Scheduled" ? "info" : "neutral"}>{c.status}</Pill>
    </div>)}</div>
  </div>;
}
