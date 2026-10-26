import { useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, Undo2, Redo2, Plus, Trash2, Check, AlertCircle, Braces } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { contacts } from "@/data/mockData";
import { mergeFieldGroups, resolveMergeFields } from "@/lib/emailMergeFields";
import { placeholderCount, validateTemplate, type WaTemplate, type WaButton } from "@/lib/whatsappStore";
import { PhonePreview } from "./PhonePreview";

const sel = "h-9 w-full rounded-md border-hairline bg-background px-2.5 text-sm";
const allFields = Object.entries(mergeFieldGroups);

export function TemplateEditor({ initial, onBack, onSave }: { initial: WaTemplate; onBack: () => void; onSave: (t: WaTemplate, submit: boolean) => void }) {
  const [hist, setHist] = useState([initial]);
  const [i, setI] = useState(0);
  const [contactId, setContactId] = useState(contacts[0]?.id ?? "");
  const t = hist[i];
  const edit = (p: Partial<WaTemplate>) => {
    const next = { ...t, ...p };
    const n = placeholderCount(next.body);
    next.vars = Array.from({ length: n }, (_, k) => next.vars[k] ?? "first_name");
    setHist([...hist.slice(0, i + 1), next]); setI(i + 1);
  };
  const errors = validateTemplate(t);
  const values = { promo_code: "SPRING15", ...resolveMergeFields(contactId, { values: { promo_code: "SPRING15" }, trigger: "visit_booked" }) };
  const buttons = t.buttons ?? [];
  const setBtn = (k: number, p: Partial<WaButton>) => edit({ buttons: buttons.map((b, j) => j === k ? { ...b, ...p } : b) });
  const insertVar = () => edit({ body: `${t.body}${t.body.endsWith(" ") || !t.body ? "" : " "}{{${placeholderCount(t.body) + 1}}}` });

  return createPortal(<div className="fixed inset-0 z-[60] bg-background flex flex-col">
    <div className="h-14 border-b-hairline flex items-center gap-2 px-4">
      <Button variant="ghost" size="icon" aria-label="Back" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
      <Input aria-label="Template name" value={t.name} onChange={(e) => edit({ name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_") })} className="max-w-[260px] font-mono border-transparent hover:border-input" />
      <span className="text-xs text-muted-foreground flex items-center gap-1"><Check className="h-3 w-3" />Draft saved</span>
      <div className="flex-1" />
      <Button variant="ghost" size="icon" aria-label="Undo" disabled={i === 0} onClick={() => setI(i - 1)}><Undo2 className="h-4 w-4" /></Button>
      <Button variant="ghost" size="icon" aria-label="Redo" disabled={i >= hist.length - 1} onClick={() => setI(i + 1)}><Redo2 className="h-4 w-4" /></Button>
      <select aria-label="Preview as" className={`${sel} w-44`} value={contactId} onChange={(e) => setContactId(e.target.value)}>{contacts.map((c) => <option key={c.id} value={c.id}>Preview as {c.name}</option>)}</select>
      <Button variant="outline" onClick={() => onSave(t, false)}>Save draft</Button>
      <Button disabled={errors.length > 0} onClick={() => onSave(t, true)}>Submit for review</Button>
    </div>
    <div className="grid flex-1 min-h-0 grid-cols-1 md:grid-cols-[minmax(320px,1fr)_minmax(340px,1fr)_320px] overflow-auto">
      <div className="p-5 space-y-5 border-r-hairline overflow-auto">
        <section className="space-y-2"><h3 className="text-sm font-medium">Header</h3>
          <select aria-label="Header type" className={sel} value={t.header?.type ?? "none"} onChange={(e) => edit({ header: { ...t.header, type: e.target.value as never } })}>
            <option value="none">No header</option><option value="text">Text</option><option value="image">Image</option><option value="document">Document</option><option value="video">Video</option>
          </select>
          {t.header?.type === "text" && <Input aria-label="Header text" placeholder="Your visit is booked" value={t.header.text ?? ""} onChange={(e) => edit({ header: { ...t.header!, text: e.target.value } })} />}
          {t.header && ["image", "video", "document"].includes(t.header.type) && <Input aria-label="Header media URL" placeholder="https://… (sample file)" value={t.header.url ?? ""} onChange={(e) => edit({ header: { ...t.header!, url: e.target.value } })} />}
        </section>
        <section className="space-y-2">
          <div className="flex items-center justify-between"><h3 className="text-sm font-medium">Body</h3><Button size="sm" variant="ghost" onClick={insertVar}><Braces className="h-3.5 w-3.5" />Add variable</Button></div>
          <Textarea aria-label="Template body" rows={7} value={t.body} onChange={(e) => edit({ body: e.target.value })} placeholder="Hi {{1}}, your visit is booked for {{2}}." />
          <div className={`text-right text-[11px] ${t.body.length > 1024 ? "text-destructive" : "text-muted-foreground"}`}>{t.body.length}/1024</div>
        </section>
        <section className="space-y-2"><h3 className="text-sm font-medium">Footer</h3>
          <Input aria-label="Footer" placeholder="Reply STOP to opt out" value={t.footer ?? ""} onChange={(e) => edit({ footer: e.target.value })} />
        </section>
        <section className="space-y-2">
          <div className="flex items-center justify-between"><h3 className="text-sm font-medium">Buttons <span className="text-muted-foreground font-normal">({buttons.length}/3)</span></h3>
            <Button size="sm" variant="ghost" disabled={buttons.length >= 3} onClick={() => edit({ buttons: [...buttons, { type: "quick_reply", text: "" }] })}><Plus className="h-3.5 w-3.5" />Add button</Button></div>
          {buttons.map((b, k) => <div key={k} className="rounded-md border-hairline p-2 space-y-2">
            <div className="flex gap-2">
              <select aria-label={`Button ${k + 1} type`} className={`${sel} w-36`} value={b.type} onChange={(e) => setBtn(k, { type: e.target.value as WaButton["type"] })}><option value="quick_reply">Quick reply</option><option value="url">Link</option><option value="call">Call</option></select>
              <Input aria-label={`Button ${k + 1} text`} placeholder="Button text" value={b.text} onChange={(e) => setBtn(k, { text: e.target.value })} />
              <Button variant="ghost" size="icon" aria-label={`Remove button ${k + 1}`} onClick={() => edit({ buttons: buttons.filter((_, j) => j !== k) })}><Trash2 className="h-4 w-4" /></Button>
            </div>
            {b.type !== "quick_reply" && <Input aria-label={`Button ${k + 1} ${b.type === "url" ? "link" : "phone"}`} placeholder={b.type === "url" ? "https://…" : "+44…"} value={b.value ?? ""} onChange={(e) => setBtn(k, { value: e.target.value })} />}
          </div>)}
        </section>
      </div>
      <div className="bg-surface-hover p-6 overflow-auto"><PhonePreview template={t} values={values} /></div>
      <aside className="border-l-hairline p-5 space-y-5 overflow-auto">
        <section className="space-y-2"><h3 className="text-sm font-medium">Template settings</h3>
          <label className="block text-xs text-muted-foreground">Category<select aria-label="Category" className={`${sel} mt-1`} value={t.category} onChange={(e) => edit({ category: e.target.value as never })}><option value="UTILITY">Booking update</option><option value="MARKETING">Marketing</option></select></label>
          <label className="block text-xs text-muted-foreground">Language<select aria-label="Language" className={`${sel} mt-1`} value={t.language} onChange={(e) => edit({ language: e.target.value })}><option value="en_GB">English (UK)</option><option value="sv">Swedish</option><option value="en_US">English (US)</option></select></label>
        </section>
        <section className="space-y-2"><h3 className="text-sm font-medium">Variables</h3>
          {t.vars.length === 0 && <p className="text-xs text-muted-foreground">Add a variable to fill in customer details.</p>}
          {t.vars.map((v, k) => <div key={k} className="flex items-center gap-2">
            <span className="font-mono text-xs w-10 text-muted-foreground">{`{{${k + 1}}}`}</span>
            <select aria-label={`Variable ${k + 1}`} className={sel} value={v} onChange={(e) => edit({ vars: t.vars.map((x, j) => j === k ? e.target.value : x) })}>
              {allFields.map(([g, keys]) => <optgroup key={g} label={g}>{keys.map((key) => <option key={key} value={key}>{key}</option>)}</optgroup>)}
            </select>
          </div>)}
        </section>
        <section className="space-y-1.5"><h3 className="text-sm font-medium">Checks</h3>
          {errors.length === 0 ? <p className="text-xs text-success flex items-center gap-1.5"><Check className="h-3.5 w-3.5" />Ready to submit to Meta</p>
            : errors.map((e) => <p key={e} className="text-xs text-destructive flex gap-1.5"><AlertCircle className="h-3.5 w-3.5 shrink-0 mt-px" />{e}</p>)}
        </section>
        <p className="text-[11px] text-muted-foreground">Demo only: submitting doesn't contact Meta.</p>
      </aside>
    </div>
  </div>, document.body);
}
