import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Btn } from "@/components/layout/PageShell";
import { Check, Copy, Code2, Link2, BarChart3 } from "lucide-react";

interface EmbedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formId: string;
  formName: string;
}

const BASE = typeof window !== "undefined" ? window.location.origin : "https://app.example.com";

export function EmbedDialog({ open, onOpenChange, formId, formName }: EmbedDialogProps) {
  const [tab, setTab] = useState<"script" | "iframe" | "link">("script");
  const [copied, setCopied] = useState<string | null>(null);

  const snippets = useMemo(() => {
    const url = `${BASE}/embed/forms/${formId}`;
    return {
      script: `<!-- ${formName} — Lovable Forms embed -->
<div data-lovable-form="${formId}"></div>
<script async src="${BASE}/embed.js"
  data-form-id="${formId}"
  data-track="true"
  data-utm-capture="true"></script>`,
      iframe: `<iframe
  src="${url}?track=1"
  title="${formName}"
  width="100%"
  height="640"
  style="border:0;max-width:680px;"
  loading="lazy"
></iframe>`,
      link: `${url}`,
    };
  }, [formId, formName]);

  const copy = (key: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const tabs = [
    { id: "script" as const, label: "Script", icon: Code2 },
    { id: "iframe" as const, label: "iFrame", icon: Code2 },
    { id: "link" as const, label: "Direct link", icon: Link2 },
  ];

  const current = snippets[tab];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Embed “{formName}”</DialogTitle>
          <DialogDescription>
            Paste a snippet on your site. Submissions, page views and conversion are tracked automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-1 border-hairline rounded-md p-1 bg-surface w-fit">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 h-7 px-2.5 rounded text-xs font-medium transition-colors ${
                  active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-3 h-3" /> {t.label}
              </button>
            );
          })}
        </div>

        <div className="relative">
          <pre className="bg-surface border-hairline rounded-md p-3 text-xs overflow-x-auto font-mono leading-relaxed text-foreground/90 whitespace-pre-wrap break-all">
{current}
          </pre>
          <button
            onClick={() => copy(tab, current)}
            className="absolute top-2 right-2 flex items-center gap-1 h-7 px-2 rounded bg-card border-hairline text-xs hover:bg-surface-hover"
          >
            {copied === tab ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
            {copied === tab ? "Copied" : "Copy"}
          </button>
        </div>

        <div className="border-hairline rounded-md p-3 bg-surface/50">
          <div className="flex items-center gap-2 text-xs font-medium mb-2">
            <BarChart3 className="w-3.5 h-3.5 text-primary" />
            Built-in tracking
          </div>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
            <li>Page views, form views, field interactions, abandonment</li>
            <li>UTM parameters, referrer, device & geo (auto-captured)</li>
            <li>Submission events feed straight into the Pipeline</li>
            <li>No cookies required — privacy-friendly by default</li>
          </ul>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Btn onClick={() => onOpenChange(false)}>Close</Btn>
        </div>
      </DialogContent>
    </Dialog>
  );
}
