import { useDeferredValue, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, Undo2, Redo2, Monitor, Smartphone, Send, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { contacts as sampleContacts } from "@/data/mockData";
import { applyExtrasTo, mergeWithMock, useContactExtras, useImportedContacts } from "@/lib/contactsStore";
import { toast } from "@/hooks/use-toast";
import type { EmailBlock } from "./EmailDesigner";
import { subjectNeedsLengthWarning } from "@/lib/emailEditor";
import { MergeFieldsProvider, InsertFieldButton } from "./MergeFields";
import { useBusinessSettings } from "@/lib/businessSettings";
import { resolveMergeFields, unavailableFields, type MergeContext } from "@/lib/emailMergeFields";

export interface EmailEditorDraft {
  name: string;
  subject: string;
  preview: string;
  blocks: EmailBlock[];
  body: string;
  htmlSource: string;
  mode: "visual" | "markdown" | "html";
  template?: string;
}

export const sampleEmailVars = {
  first_name: "Sarah", last_name: "Whitcombe", service_type: "window cleaning",
  postcode: "BS8 4QE", last_job_date: "12 Apr 2026", company_name: "Bristol Trades Co.",
};

export function EmailEditorPage({ initial, onBack, onSave, children, canSave = true, previewEditable = true, trigger = "broadcast", context = {} }: {
  initial: EmailEditorDraft;
  onBack: (draft: EmailEditorDraft) => void;
  onSave: (draft: EmailEditorDraft) => void;
  canSave?: boolean;
  previewEditable?: boolean;
  trigger?: string;
  context?: MergeContext;
  children: (draft: EmailEditorDraft, edit: (patch: Partial<EmailEditorDraft>) => void, vars: Record<string, string>, device: "desktop" | "mobile") => ReactNode;
}) {
  const [history, setHistory] = useState<EmailEditorDraft[]>([initial]);
  const [index, setIndex] = useState(0);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [contactId, setContactId] = useState("fields");
  const business = useBusinessSettings();
  const imported = useImportedContacts();
  const extras = useContactExtras();
  const contacts = applyExtrasTo(mergeWithMock(sampleContacts, imported), extras);
  const contact = contacts.find((item) => item.id === contactId);
  const draft = history[index] ?? initial;
  const savedDraft = useDeferredValue(draft);
  const vars: Record<string, string> = contact ? resolveMergeFields(contact.id, { ...context, trigger }) : {};
  const [saveWarning, setSaveWarning] = useState<string[]>([]);
  const save = () => {
    const fields = unavailableFields(JSON.stringify({ subject: draft.subject, preview: draft.preview, blocks: draft.blocks, body: draft.body, html: draft.htmlSource }), trigger);
    if (fields.length && !saveWarning.length) { setSaveWarning(fields); return; }
    onSave(draft);
  };
  const edit = (patch: Partial<EmailEditorDraft>) => {
    setSaveWarning([]);
    setHistory([...history.slice(0, index + 1), { ...draft, ...patch }]);
    setIndex(index + 1);
  };

  return createPortal(
    <MergeFieldsProvider trigger={trigger}><section aria-label="Email editor" className="fixed inset-0 z-[60] flex flex-col bg-background text-foreground">
      <header className="flex shrink-0 flex-wrap items-center gap-2 border-b-hairline px-4 py-3">
        <Button variant="ghost" size="icon" aria-label="Back" title="Back" onClick={() => onBack(draft)}><ArrowLeft /></Button>
        <Input aria-label="Email name" value={draft.name} onChange={(e) => edit({ name: e.target.value })} className="w-48 flex-1 border-transparent bg-transparent font-medium shadow-none min-w-32 max-w-72" />
        <span role="status" title="Changes are kept in this editing session. Save applies them to the existing form." className="mr-auto inline-flex items-center gap-1 text-xs text-muted-foreground"><Check className="h-3 w-3" />{savedDraft === draft ? "Saved" : "Saving…"}</span>
        <div className="flex items-center gap-1 border-r-hairline pr-2">
          <Button variant="ghost" size="icon" aria-label="Undo" title="Undo" disabled={index === 0} onClick={() => setIndex(index - 1)}><Undo2 /></Button>
          <Button variant="ghost" size="icon" aria-label="Redo" title="Redo" disabled={index === history.length - 1} onClick={() => setIndex(index + 1)}><Redo2 /></Button>
        </div>
        <div role="group" aria-label="Canvas width" className="flex items-center rounded-md border-hairline p-0.5">
          <Button size="sm" variant={device === "desktop" ? "secondary" : "ghost"} aria-pressed={device === "desktop"} onClick={() => setDevice("desktop")}><Monitor />Desktop</Button>
          <Button size="sm" variant={device === "mobile" ? "secondary" : "ghost"} aria-pressed={device === "mobile"} onClick={() => setDevice("mobile")}><Smartphone />Mobile</Button>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="email-preview-contact" className="whitespace-nowrap text-xs text-muted-foreground">Preview as</Label>
          <Select value={contactId} onValueChange={setContactId}>
            <SelectTrigger id="email-preview-contact" className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent className="z-[80]"><SelectItem value="fields">Merge fields</SelectItem>{contacts.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm" onClick={() => toast({ title: "Test email not sent", description: "Email delivery is not connected in this demo." })}><Send />Send test email</Button>
        <Button size="sm" disabled={!canSave || !draft.subject.trim()} onClick={save}>Save</Button>
      </header>
      <div className="shrink-0 border-b-hairline px-6 py-2 text-xs text-muted-foreground">Editing a copy — the original email is unchanged.</div>
      <div className="grid shrink-0 grid-cols-1 gap-4 border-b-hairline px-6 py-4 sm:grid-cols-2">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2"><Label htmlFor="editor-subject">Subject line</Label><span className={`text-xs tabular-nums ${subjectNeedsLengthWarning(draft.subject) ? "text-[hsl(var(--warning))]" : "text-muted-foreground"}`}>{draft.subject.length} characters{subjectNeedsLengthWarning(draft.subject) ? " · Above 60" : ""}</span></div>
          <div className="relative"><Input id="editor-subject" className="pr-10" value={draft.subject} onChange={(e) => edit({ subject: e.target.value })} placeholder="What will land in their inbox?" /><div className="absolute right-1 top-1"><InsertFieldButton inputId="editor-subject" /></div></div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2"><Label htmlFor="editor-preview">Preview text</Label><span className="text-xs tabular-nums text-muted-foreground">{draft.preview.length} characters</span></div>
          <div className="relative"><Input id="editor-preview" className="pr-10" value={draft.preview} disabled={!previewEditable} title={previewEditable ? undefined : "Preview text is not stored by the current automation email model"} onChange={(e) => edit({ preview: e.target.value })} placeholder="Short preview shown after the subject" />{previewEditable && <div className="absolute right-1 top-1"><InsertFieldButton inputId="editor-preview" /></div>}</div>
        </div>
      </div>
      {saveWarning.length > 0 && <div role="alert" className="shrink-0 border-b-hairline px-6 py-2 text-sm text-destructive">Fields unavailable for this email: {saveWarning.join(", ")}. <Button variant="outline" size="sm" onClick={() => onSave(draft)}>Save anyway</Button></div>}
      <div className="min-h-0 flex-1 overflow-auto">{children(draft, edit, vars, device)}</div>
    </section></MergeFieldsProvider>, document.body,
  );
}