import { FieldFallbacks } from "./MergeFields";
import { EmailEditorPage } from "./EmailEditorPage";
import { createBlock, renderBlocksToHtml } from "./EmailDesigner";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { decorateMergePills } from "@/lib/emailEditor";

const templateLabels: Record<string, string> = {
  default: "Default template", review_request: "Review request", winback: "Win-back offer", reminder: "Reminder", welcome: "Welcome",
};

export function AutomationEmailEditor({ subject, template, onBack, onSave, trigger = "broadcast" }: {
  trigger?: string;
  subject: string;
  template: string;
  onBack: () => void;
  onSave: (subject: string, template: string) => void;
}) {
  return <EmailEditorPage
    initial={{ name: subject || "Automation email", subject, template, preview: "", blocks: [], body: "", htmlSource: "", mode: "visual" }}
    trigger={trigger}
    previewEditable={false}
    onBack={onBack}
    onSave={(draft) => onSave(draft.subject, draft.template ?? "default")}
  >
    {(draft, edit, vars, device) => {
      const blocks = [
        { ...createBlock("heading"), text: draft.subject },
        { ...createBlock("text"), text: "Hi {{first_name}}," },
        { ...createBlock("footer"), company: "{{company_name}}", address: "" },
      ];
      return <div className="grid h-full min-h-0 grid-cols-[240px_minmax(420px,1fr)_320px]">
        <aside className="border-r-hairline p-5 space-y-3">
          <Label htmlFor="automation-email-template">Email template</Label>
          <Select value={draft.template ?? "default"} onValueChange={(template) => edit({ template })}>
            <SelectTrigger id="automation-email-template"><SelectValue /></SelectTrigger>
            <SelectContent className="z-[80]">{Object.entries(templateLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
          </Select>
        </aside>
        <div className="overflow-auto bg-surface-hover p-6">
          <div aria-label="Email canvas" className={`email-editor-paper mx-auto border-hairline p-6 min-h-[420px] ${device === "mobile" ? "w-[375px]" : "w-full max-w-[600px]"}`} dangerouslySetInnerHTML={{ __html: decorateMergePills(renderBlocksToHtml(blocks, vars)) }} />
        </div>
        <aside className="border-l-hairline p-5 space-y-4">
          <FieldFallbacks />
          <h2 className="text-sm font-medium">Email properties</h2>
          <div className="space-y-1"><div className="text-xs text-muted-foreground">Template</div><div className="text-sm">{templateLabels[draft.template ?? "default"] ?? draft.template}</div></div>
          <p className="text-xs text-muted-foreground">Sample layout only. Automation emails currently save a subject and template, not custom blocks or preview text.</p>
        </aside>
      </div>;
    }}
  </EmailEditorPage>;
}