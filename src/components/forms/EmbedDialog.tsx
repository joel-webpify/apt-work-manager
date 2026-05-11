import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Btn } from "@/components/layout/PageShell";
import { Switch } from "@/components/ui/switch";
import { Check, Copy, Code2, Link2, BarChart3, Settings2, ShieldCheck } from "lucide-react";

export type SpamProtection = "off" | "honeypot" | "recaptcha_v2" | "recaptcha_v3";

export interface TrackingConfig {
  enabled: boolean;
  utmCapture: boolean;
  referrerCapture: boolean;
  deviceGeo: boolean;
  spamProtection: SpamProtection;
  recaptchaSiteKey?: string;
  events: {
    pageView: boolean;
    formView: boolean;
    fieldFocus: boolean;
    fieldComplete: boolean;
    abandonment: boolean;
    submission: boolean;
  };
}

export const defaultTracking: TrackingConfig = {
  enabled: true,
  utmCapture: true,
  referrerCapture: true,
  deviceGeo: true,
  events: {
    pageView: true,
    formView: true,
    fieldFocus: false,
    fieldComplete: false,
    abandonment: true,
    submission: true,
  },
};

interface EmbedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formId: string;
  formName: string;
  tracking?: TrackingConfig;
  onTrackingChange?: (cfg: TrackingConfig) => void;
}

const BASE = typeof window !== "undefined" ? window.location.origin : "https://app.example.com";

const eventLabels: { key: keyof TrackingConfig["events"]; label: string; description: string }[] = [
  { key: "pageView", label: "Page view", description: "Fires when the host page loads" },
  { key: "formView", label: "Form view", description: "Fires when the form scrolls into view" },
  { key: "fieldFocus", label: "Field focus", description: "User focuses an individual input" },
  { key: "fieldComplete", label: "Field complete", description: "User finishes a field and moves on" },
  { key: "abandonment", label: "Abandonment", description: "User starts but never submits" },
  { key: "submission", label: "Submission", description: "Successful submit — pushed to Pipeline" },
];

export function EmbedDialog({ open, onOpenChange, formId, formName, tracking, onTrackingChange }: EmbedDialogProps) {
  const [tab, setTab] = useState<"script" | "iframe" | "link" | "tracking">("script");
  const [copied, setCopied] = useState<string | null>(null);
  const [local, setLocal] = useState<TrackingConfig>(tracking ?? defaultTracking);

  const cfg = tracking ?? local;
  const setCfg = (next: TrackingConfig) => {
    setLocal(next);
    onTrackingChange?.(next);
  };

  const enabledEvents = useMemo(
    () => (Object.keys(cfg.events) as (keyof TrackingConfig["events"])[]).filter((k) => cfg.events[k]),
    [cfg.events],
  );

  const snippets = useMemo(() => {
    const url = `${BASE}/embed/forms/${formId}`;
    const events = enabledEvents.join(",");
    return {
      script: `<!-- ${formName} — Lovable Forms embed -->
<div data-lovable-form="${formId}"></div>
<script async src="${BASE}/embed.js"
  data-form-id="${formId}"
  data-track="${cfg.enabled}"
  data-utm-capture="${cfg.utmCapture}"
  data-referrer="${cfg.referrerCapture}"
  data-device-geo="${cfg.deviceGeo}"
  data-events="${events}"></script>`,
      iframe: `<iframe
  src="${url}?track=${cfg.enabled ? 1 : 0}&utm=${cfg.utmCapture ? 1 : 0}&events=${events}"
  title="${formName}"
  width="100%"
  height="640"
  style="border:0;max-width:680px;"
  loading="lazy"
></iframe>`,
      link: `${url}?track=${cfg.enabled ? 1 : 0}`,
    };
  }, [formId, formName, cfg, enabledEvents]);

  const copy = (key: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const tabs = [
    { id: "script" as const, label: "Script", icon: Code2 },
    { id: "iframe" as const, label: "iFrame", icon: Code2 },
    { id: "link" as const, label: "Direct link", icon: Link2 },
    { id: "tracking" as const, label: "Tracking", icon: Settings2 },
  ];

  const updateEvent = (key: keyof TrackingConfig["events"], value: boolean) =>
    setCfg({ ...cfg, events: { ...cfg.events, [key]: value } });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Embed “{formName}”</DialogTitle>
          <DialogDescription>
            Paste a snippet on your site. Configure exactly what gets tracked under the Tracking tab.
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

        {tab === "tracking" ? (
          <div className="space-y-4">
            <div className="border-hairline rounded-md p-3 space-y-3 bg-surface/50">
              <Row
                label="Enable tracking"
                description="Master switch — disables all events when off"
                checked={cfg.enabled}
                onChange={(v) => setCfg({ ...cfg, enabled: v })}
              />
              <Row
                label="Capture UTM parameters"
                description="utm_source, utm_medium, utm_campaign, etc."
                checked={cfg.utmCapture}
                onChange={(v) => setCfg({ ...cfg, utmCapture: v })}
                disabled={!cfg.enabled}
              />
              <Row
                label="Capture referrer"
                description="The page the visitor came from"
                checked={cfg.referrerCapture}
                onChange={(v) => setCfg({ ...cfg, referrerCapture: v })}
                disabled={!cfg.enabled}
              />
              <Row
                label="Device & geo"
                description="Browser, OS, country (no PII, no cookies)"
                checked={cfg.deviceGeo}
                onChange={(v) => setCfg({ ...cfg, deviceGeo: v })}
                disabled={!cfg.enabled}
              />
            </div>

            <div className="border-hairline rounded-md">
              <div className="px-3 h-9 flex items-center text-xs font-medium border-b-hairline bg-surface/50">
                Events recorded
              </div>
              <div className="divide-y divide-border">
                {eventLabels.map((e) => (
                  <div key={e.key} className="px-3 py-2.5">
                    <Row
                      label={e.label}
                      description={e.description}
                      checked={cfg.events[e.key]}
                      onChange={(v) => updateEvent(e.key, v)}
                      disabled={!cfg.enabled}
                      compact
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="relative">
              <pre className="bg-surface border-hairline rounded-md p-3 text-xs overflow-x-auto font-mono leading-relaxed text-foreground/90 whitespace-pre-wrap break-all">
{snippets[tab]}
              </pre>
              <button
                onClick={() => copy(tab, snippets[tab])}
                className="absolute top-2 right-2 flex items-center gap-1 h-7 px-2 rounded bg-card border-hairline text-xs hover:bg-surface-hover"
              >
                {copied === tab ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
                {copied === tab ? "Copied" : "Copy"}
              </button>
            </div>

            <div className="border-hairline rounded-md p-3 bg-surface/50">
              <div className="flex items-center gap-2 text-xs font-medium mb-2">
                <BarChart3 className="w-3.5 h-3.5 text-primary" />
                Tracking summary
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>
                  Status:{" "}
                  <span className={cfg.enabled ? "text-success font-medium" : "text-muted-foreground"}>
                    {cfg.enabled ? "Enabled" : "Disabled"}
                  </span>
                </div>
                <div>UTM capture: {cfg.utmCapture ? "On" : "Off"} · Referrer: {cfg.referrerCapture ? "On" : "Off"} · Device/Geo: {cfg.deviceGeo ? "On" : "Off"}</div>
                <div>Events: {enabledEvents.length ? enabledEvents.join(", ") : "none"}</div>
              </div>
            </div>
          </>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Btn onClick={() => onOpenChange(false)}>Close</Btn>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Row({
  label,
  description,
  checked,
  onChange,
  disabled,
  compact,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  compact?: boolean;
}) {
  return (
    <div className={`flex items-start justify-between gap-3 ${compact ? "" : ""}`}>
      <div className="min-w-0">
        <div className="text-xs font-medium">{label}</div>
        <div className="text-[11px] text-muted-foreground mt-0.5">{description}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </div>
  );
}
