import { useMemo, useRef, useState } from "react";
import {
  Plus,
  Search,
  Send,
  Eye,
  MousePointerClick,
  PoundSterling,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Calendar,
  Users,
  Mail,
  CheckCircle2,
  X,
  Sparkles,
  TrendingUp,
  Filter,
  Trash2,
  Bold,
  Italic,
  Link as LinkIcon,
  Heading as HeadingIcon,
  List as ListIcon,
  Braces,
  Save,
} from "lucide-react";
import { Btn, Pill } from "@/components/layout/PageShell";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

type CampaignStatus = "Sent" | "Scheduled" | "Draft" | "Sending";

interface CampaignActivity {
  date: string;
  label: string;
  detail?: string;
}

interface ExtendedCampaign {
  id: string;
  name: string;
  segment: string;
  status: CampaignStatus;
  sendDate: string;
  recipients: number;
  delivered: number;
  openRate: number;
  clickRate: number;
  unsubRate: number;
  bounceRate: number;
  jobs: number;
  revenue: number;
  subject: string;
  preview: string;
  activity: CampaignActivity[];
}

const initialCampaigns: ExtendedCampaign[] = [
  {
    id: "ca1",
    name: "Spring window cleaning offer",
    segment: "Residential — Bristol BS",
    status: "Sent",
    sendDate: "08 Apr 2026",
    recipients: 412,
    delivered: 408,
    openRate: 42.3,
    clickRate: 6.8,
    unsubRate: 0.4,
    bounceRate: 1.0,
    jobs: 14,
    revenue: 2180,
    subject: "Spring is here — book your window clean and save 15%",
    preview: "Sparkling windows for the brighter months ahead…",
    activity: [
      { date: "08 Apr 09:00", label: "Campaign sent", detail: "412 recipients" },
      { date: "08 Apr 09:14", label: "First open" },
      { date: "08 Apr 11:32", label: "First booking", detail: "Sarah Whitcombe" },
      { date: "10 Apr", label: "10 jobs booked" },
    ],
  },
  {
    id: "ca2",
    name: "Artificial grass — early summer",
    segment: "Past quote, no booking",
    status: "Scheduled",
    sendDate: "24 Apr 2026",
    recipients: 86,
    delivered: 0,
    openRate: 0,
    clickRate: 0,
    unsubRate: 0,
    bounceRate: 0,
    jobs: 0,
    revenue: 0,
    subject: "Still thinking about that artificial grass install?",
    preview: "Lock in our spring pricing before summer demand kicks in…",
    activity: [
      { date: "18 Apr", label: "Campaign scheduled", detail: "Sends 24 Apr 09:00" },
      { date: "18 Apr", label: "Audience locked", detail: "86 contacts" },
    ],
  },
  {
    id: "ca3",
    name: "Annual electrical safety check",
    segment: "Customers — last 24 months",
    status: "Draft",
    sendDate: "—",
    recipients: 0,
    delivered: 0,
    openRate: 0,
    clickRate: 0,
    unsubRate: 0,
    bounceRate: 0,
    jobs: 0,
    revenue: 0,
    subject: "Time for your annual electrical safety check",
    preview: "Stay compliant and safe with a quick yearly inspection…",
    activity: [{ date: "16 Apr", label: "Draft created" }],
  },
];

interface Template {
  id: string;
  name: string;
  description: string;
  segment: string;
  subject: string;
  preview: string;
  body: string;
  icon: typeof Sparkles;
}

const defaultBody = `Hi {{first_name}},

Thanks for choosing us for your {{service_type}} work. We wanted to share a quick update with you.

Reply to this email or call us on 0117 000 0000 if you have any questions.

Best,
The team`;

const templates: Template[] = [
  {
    id: "t-blank",
    name: "Blank campaign",
    description: "Start from scratch with an empty draft.",
    segment: "All customers",
    subject: "",
    preview: "",
    body: "",
    icon: Mail,
  },
  {
    id: "t-seasonal",
    name: "Seasonal offer",
    description: "Promote a limited-time discount tied to the season.",
    segment: "Residential — Bristol BS",
    subject: "Limited spring offer — save 15% this month",
    preview: "Book a service this April and save 15% on labour…",
    body: `Hi {{first_name}},\n\nSpring is here — and we're offering **15% off** {{service_type}} bookings made before the end of April.\n\nWe've still got a few slots left for your area ({{postcode}}). Reply to lock one in.\n\nBest,\n{{company_name}}`,
    icon: Sparkles,
  },
  {
    id: "t-winback",
    name: "Win-back lapsed",
    description: "Re-engage customers who haven't booked in 12+ months.",
    segment: "Lapsed — 12+ months",
    subject: "We miss you — here's 10% off your next job",
    preview: "It's been a while. Treat your home with a fresh service…",
    body: `Hi {{first_name}},\n\nIt's been a while since your last {{service_type}} with us. As a thank you for being a previous customer, here's **10% off** your next booking.\n\nJust reply and we'll get you back in the diary.\n\nBest,\n{{company_name}}`,
    icon: TrendingUp,
  },
  {
    id: "t-reminder",
    name: "Service reminder",
    description: "Annual maintenance prompt for past customers.",
    segment: "Customers — last 24 months",
    subject: "Time for your annual {{service_type}}",
    preview: "Stay on top of maintenance with a quick yearly check…",
    body: `Hi {{first_name}},\n\nJust a reminder — it's been close to a year since your last {{service_type}}. Annual checks keep everything running smoothly and catch small issues early.\n\nShall we book you in?\n\nBest,\n{{company_name}}`,
    icon: Calendar,
  },
  {
    id: "t-review",
    name: "Review request",
    description: "Ask happy customers for a Google review.",
    segment: "Recent customers (last 30 days)",
    subject: "How did we do, {{first_name}}?",
    preview: "Your feedback helps other locals find us…",
    body: `Hi {{first_name}},\n\nThanks again for booking your {{service_type}} with us. If you had a good experience, would you mind leaving a short Google review? It genuinely helps other people in {{postcode}} find us.\n\n[Leave a review](https://g.page/review)\n\nThanks,\n{{company_name}}`,
    icon: CheckCircle2,
  },
];

// Reusable merge variables available across campaigns
const mergeVariables: { key: string; label: string; example: string }[] = [
  { key: "first_name", label: "First name", example: "Sarah" },
  { key: "last_name", label: "Last name", example: "Whitcombe" },
  { key: "service_type", label: "Service type", example: "window cleaning" },
  { key: "postcode", label: "Postcode", example: "BS8 4QE" },
  { key: "last_job_date", label: "Last job date", example: "12 Apr 2026" },
  { key: "company_name", label: "Company name", example: "Bristol Trades Co." },
];

// Audience targeting
type RuleField = "lifecycle" | "type" | "postcode" | "last_job_days" | "total_spend" | "source";
type RuleOp = "is" | "is_not" | "contains" | "gt" | "lt" | "gte" | "lte";

interface AudienceRule {
  id: string;
  field: RuleField;
  op: RuleOp;
  value: string;
}

const ruleFieldConfig: Record<RuleField, { label: string; ops: RuleOp[]; kind: "text" | "number" | "select"; options?: string[] }> = {
  lifecycle: { label: "Lifecycle", ops: ["is", "is_not"], kind: "select", options: ["Lead", "Customer", "Lapsed"] },
  type: { label: "Contact type", ops: ["is", "is_not"], kind: "select", options: ["Residential", "Commercial"] },
  postcode: { label: "Postcode", ops: ["contains", "is"], kind: "text" },
  last_job_days: { label: "Days since last job", ops: ["gt", "lt", "gte", "lte"], kind: "number" },
  total_spend: { label: "Total spend (£)", ops: ["gt", "lt", "gte", "lte"], kind: "number" },
  source: { label: "Source", ops: ["is", "is_not"], kind: "select", options: ["Google Ads", "Facebook", "Referral", "Website form", "Local Service Ads"] },
};

const opLabels: Record<RuleOp, string> = {
  is: "is",
  is_not: "is not",
  contains: "contains",
  gt: ">",
  lt: "<",
  gte: "≥",
  lte: "≤",
};

interface SavedAudience {
  id: string;
  name: string;
  match: "all" | "any";
  rules: AudienceRule[];
  estimate: number;
}

const initialSavedAudiences: SavedAudience[] = [
  {
    id: "aud1",
    name: "Residential — Bristol BS",
    match: "all",
    rules: [
      { id: "r1", field: "type", op: "is", value: "Residential" },
      { id: "r2", field: "postcode", op: "contains", value: "BS" },
    ],
    estimate: 412,
  },
  {
    id: "aud2",
    name: "Past quote, no booking",
    match: "all",
    rules: [{ id: "r1", field: "lifecycle", op: "is", value: "Lead" }],
    estimate: 86,
  },
  {
    id: "aud3",
    name: "Lapsed — 12+ months",
    match: "all",
    rules: [{ id: "r1", field: "last_job_days", op: "gt", value: "365" }],
    estimate: 134,
  },
  {
    id: "aud4",
    name: "Customers — last 24 months",
    match: "all",
    rules: [
      { id: "r1", field: "lifecycle", op: "is", value: "Customer" },
      { id: "r2", field: "last_job_days", op: "lte", value: "730" },
    ],
    estimate: 268,
  },
  {
    id: "aud5",
    name: "Recent customers (last 30 days)",
    match: "all",
    rules: [
      { id: "r1", field: "lifecycle", op: "is", value: "Customer" },
      { id: "r2", field: "last_job_days", op: "lte", value: "30" },
    ],
    estimate: 47,
  },
];

export function CampaignsTab() {
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<ExtendedCampaign[]>(initialCampaigns);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | CampaignStatus>("All");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [builderTemplate, setBuilderTemplate] = useState<Template | null>(null);

  const kpis = useMemo(() => {
    const sent = campaigns.filter((c) => c.status === "Sent");
    const totalSent30 = sent.reduce((s, c) => s + c.delivered, 0);
    const avgOpen = sent.length ? sent.reduce((s, c) => s + c.openRate, 0) / sent.length : 0;
    const avgClick = sent.length ? sent.reduce((s, c) => s + c.clickRate, 0) / sent.length : 0;
    const totalJobs = sent.reduce((s, c) => s + c.jobs, 0);
    const totalRevenue = sent.reduce((s, c) => s + c.revenue, 0);
    const avgUnsub = sent.length ? sent.reduce((s, c) => s + c.unsubRate, 0) / sent.length : 0;
    const avgBounce = sent.length ? sent.reduce((s, c) => s + c.bounceRate, 0) / sent.length : 0;
    return { totalSent30, avgOpen, avgClick, totalJobs, totalRevenue, avgUnsub, avgBounce };
  }, [campaigns]);

  const filtered = campaigns.filter((c) => {
    const matchesSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.segment.toLowerCase().includes(search.toLowerCase()) ||
      c.subject.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const selected = campaigns.find((c) => c.id === selectedId) ?? null;

  const handleCreateCampaign = (draft: { name: string; segment: string; subject: string; preview: string; sendDate: string; status: CampaignStatus }) => {
    const newCampaign: ExtendedCampaign = {
      id: `ca${Date.now()}`,
      name: draft.name,
      segment: draft.segment,
      status: draft.status,
      sendDate: draft.status === "Draft" ? "—" : draft.sendDate,
      recipients: draft.status === "Draft" ? 0 : 120,
      delivered: 0,
      openRate: 0,
      clickRate: 0,
      unsubRate: 0,
      bounceRate: 0,
      jobs: 0,
      revenue: 0,
      subject: draft.subject,
      preview: draft.preview,
      activity: [{ date: "Just now", label: draft.status === "Scheduled" ? "Campaign scheduled" : "Draft created" }],
    };
    setCampaigns([newCampaign, ...campaigns]);
    setBuilderTemplate(null);
    toast({
      title: draft.status === "Scheduled" ? "Campaign scheduled" : "Draft saved",
      description: `${draft.name} — ${draft.segment}`,
    });
  };

  return (
    <>
      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <KpiCard icon={Send} label="Sent (30d)" value={kpis.totalSent30.toLocaleString()} hint={`${campaigns.filter((c) => c.status === "Sent").length} campaigns`} />
        <KpiCard
          icon={Eye}
          label="Avg open / click"
          value={`${kpis.avgOpen.toFixed(1)}%`}
          hint={
            <span className="inline-flex items-center gap-1">
              <MousePointerClick className="w-3 h-3" /> {kpis.avgClick.toFixed(1)}% click
            </span>
          }
        />
        <KpiCard
          icon={PoundSterling}
          label="Jobs attributed"
          value={`${kpis.totalJobs}`}
          hint={`£${kpis.totalRevenue.toLocaleString()} revenue`}
          tone="success"
        />
        <KpiCard
          icon={AlertTriangle}
          label="Unsub / bounce"
          value={`${kpis.avgUnsub.toFixed(1)}%`}
          hint={`${kpis.avgBounce.toFixed(1)}% bounce`}
          tone={kpis.avgUnsub > 1 || kpis.avgBounce > 2 ? "warning" : "neutral"}
        />
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search campaigns…"
            className="h-8 w-full pl-8 pr-3 text-sm rounded-md border-hairline bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex items-center gap-1 border-hairline rounded-md p-0.5">
          {(["All", "Sent", "Scheduled", "Draft"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`h-7 px-2.5 rounded text-xs font-medium transition-colors ${
                statusFilter === s ? "bg-surface text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <Btn variant="secondary" onClick={() => setTemplateOpen(true)}>
          <Sparkles className="w-3.5 h-3.5" /> Templates
        </Btn>
        <Btn variant="primary" onClick={() => setBuilderTemplate(templates[0])}>
          <Plus className="w-3.5 h-3.5" /> New campaign
        </Btn>
      </div>

      {/* Table */}
      <div className="border-hairline rounded-lg bg-card overflow-hidden">
        <div className="grid grid-cols-[2fr_1.4fr_0.9fr_1fr_0.7fr_0.7fr_0.7fr_0.8fr] px-4 h-9 items-center text-xs text-muted-foreground font-medium border-b-hairline bg-surface/50">
          <div>Campaign</div>
          <div>Segment</div>
          <div>Status</div>
          <div>Send date</div>
          <div className="text-right">Open</div>
          <div className="text-right">Click</div>
          <div className="text-right">Jobs</div>
          <div className="text-right">Revenue</div>
        </div>
        {filtered.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-muted-foreground">No campaigns match your filters.</div>
        ) : (
          filtered.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedId(c.id)}
              className="w-full grid grid-cols-[2fr_1.4fr_0.9fr_1fr_0.7fr_0.7fr_0.7fr_0.8fr] px-4 h-11 items-center text-sm border-b-hairline last:border-b-0 hover:bg-surface-hover transition-colors text-left"
            >
              <div className="min-w-0">
                <div className="font-medium truncate">{c.name}</div>
                <div className="text-xs text-muted-foreground truncate">{c.subject || "No subject"}</div>
              </div>
              <div className="text-muted-foreground truncate">{c.segment}</div>
              <div>
                <Pill tone={c.status === "Sent" ? "success" : c.status === "Scheduled" ? "warning" : c.status === "Sending" ? "info" : "neutral"}>
                  {c.status}
                </Pill>
              </div>
              <div className="text-muted-foreground tabular-nums">{c.sendDate}</div>
              <div className="text-right tabular-nums">{c.openRate ? `${c.openRate}%` : "—"}</div>
              <div className="text-right tabular-nums">{c.clickRate ? `${c.clickRate}%` : "—"}</div>
              <div className="text-right tabular-nums font-medium">{c.jobs || "—"}</div>
              <div className="text-right tabular-nums font-medium">{c.revenue ? `£${c.revenue.toLocaleString()}` : "—"}</div>
            </button>
          ))
        )}
      </div>

      {/* Detail drawer */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelectedId(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-2 mb-1">
                  <Pill tone={selected.status === "Sent" ? "success" : selected.status === "Scheduled" ? "warning" : "neutral"}>
                    {selected.status}
                  </Pill>
                  <span className="text-xs text-muted-foreground">{selected.sendDate}</span>
                </div>
                <SheetTitle className="text-left">{selected.name}</SheetTitle>
                <SheetDescription className="text-left">{selected.segment}</SheetDescription>
              </SheetHeader>

              <div className="mt-5 space-y-5">
                {/* Subject preview */}
                <div className="border-hairline rounded-lg p-3 bg-surface/50">
                  <div className="text-xs text-muted-foreground mb-1">Subject</div>
                  <div className="text-sm font-medium">{selected.subject || "—"}</div>
                  {selected.preview && <div className="text-xs text-muted-foreground mt-1.5">{selected.preview}</div>}
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-2">
                  <StatBlock label="Recipients" value={selected.recipients.toLocaleString()} icon={Users} />
                  <StatBlock label="Delivered" value={selected.delivered.toLocaleString()} icon={CheckCircle2} />
                  <StatBlock label="Open rate" value={selected.openRate ? `${selected.openRate}%` : "—"} icon={Eye} />
                  <StatBlock label="Click rate" value={selected.clickRate ? `${selected.clickRate}%` : "—"} icon={MousePointerClick} />
                  <StatBlock label="Jobs" value={`${selected.jobs}`} icon={CheckCircle2} tone="success" />
                  <StatBlock label="Revenue" value={selected.revenue ? `£${selected.revenue.toLocaleString()}` : "—"} icon={PoundSterling} tone="success" />
                  <StatBlock label="Unsubscribes" value={`${selected.unsubRate}%`} icon={X} tone={selected.unsubRate > 1 ? "warning" : "neutral"} />
                  <StatBlock label="Bounces" value={`${selected.bounceRate}%`} icon={AlertTriangle} tone={selected.bounceRate > 2 ? "warning" : "neutral"} />
                </div>

                {/* Activity timeline */}
                <div>
                  <div className="text-xs text-muted-foreground font-medium mb-2 uppercase tracking-wide">Activity</div>
                  <div className="space-y-3">
                    {selected.activity.map((a, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                          {i < selected.activity.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                        </div>
                        <div className="flex-1 pb-3">
                          <div className="text-sm font-medium">{a.label}</div>
                          {a.detail && <div className="text-xs text-muted-foreground">{a.detail}</div>}
                          <div className="text-xs text-muted-foreground mt-0.5">{a.date}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t-hairline">
                  {selected.status === "Draft" && (
                    <Btn variant="primary" onClick={() => toast({ title: "Campaign sent", description: selected.name })}>
                      <Send className="w-3.5 h-3.5" /> Send now
                    </Btn>
                  )}
                  {selected.status === "Sent" && (
                    <Btn variant="secondary" onClick={() => toast({ title: "Duplicated", description: `Copy of ${selected.name}` })}>
                      Duplicate
                    </Btn>
                  )}
                  <Btn variant="ghost" onClick={() => setSelectedId(null)}>
                    Close
                  </Btn>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Templates dialog */}
      <Dialog open={templateOpen} onOpenChange={setTemplateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Choose a template</DialogTitle>
            <DialogDescription>Start from a proven layout or build from scratch.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
            {templates.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setTemplateOpen(false);
                    setBuilderTemplate(t);
                  }}
                  className="text-left border-hairline rounded-lg p-3 hover:bg-surface-hover hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center">
                      <Icon className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div className="text-sm font-medium">{t.name}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">{t.description}</div>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Builder dialog */}
      <CampaignBuilder
        template={builderTemplate}
        onClose={() => setBuilderTemplate(null)}
        onSubmit={handleCreateCampaign}
      />
    </>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = "neutral",
}: {
  icon: typeof Send;
  label: string;
  value: string;
  hint?: React.ReactNode;
  tone?: "neutral" | "success" | "warning";
}) {
  const toneClasses = {
    neutral: "text-muted-foreground",
    success: "text-[hsl(var(--success))]",
    warning: "text-[hsl(var(--warning))]",
  };
  return (
    <div className="border-hairline rounded-lg bg-card p-3.5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
        <Icon className={`w-3.5 h-3.5 ${toneClasses[tone]}`} strokeWidth={1.75} />
      </div>
      <div className="text-2xl font-medium tracking-tight tabular-nums">{value}</div>
      {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
    </div>
  );
}

function StatBlock({
  label,
  value,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: string;
  icon: typeof Send;
  tone?: "neutral" | "success" | "warning";
}) {
  const toneClasses = {
    neutral: "text-foreground",
    success: "text-[hsl(var(--success))]",
    warning: "text-[hsl(var(--warning))]",
  };
  return (
    <div className="border-hairline rounded-md p-2.5">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
        <Icon className="w-3 h-3" strokeWidth={1.75} />
        {label}
      </div>
      <div className={`text-lg font-medium tabular-nums ${toneClasses[tone]}`}>{value}</div>
    </div>
  );
}

function CampaignBuilder({
  template,
  onClose,
  onSubmit,
}: {
  template: Template | null;
  onClose: () => void;
  onSubmit: (draft: { name: string; segment: string; subject: string; preview: string; sendDate: string; status: CampaignStatus }) => void;
}) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [segment, setSegment] = useState("");
  const [subject, setSubject] = useState("");
  const [preview, setPreview] = useState("");
  const [sendDate, setSendDate] = useState("");
  const [scheduleNow, setScheduleNow] = useState<"now" | "later" | "draft">("later");

  // Sync template on open
  useMemo(() => {
    if (template) {
      setStep(1);
      setName(template.name === "Blank campaign" ? "" : template.name);
      setSegment(template.segment);
      setSubject(template.subject);
      setPreview(template.preview);
      setSendDate("");
      setScheduleNow("later");
    }
  }, [template]);

  if (!template) return null;

  const canNext1 = name.trim().length > 0 && segment.trim().length > 0;
  const canNext2 = subject.trim().length > 0;
  const canSubmit = scheduleNow === "draft" || scheduleNow === "now" || (scheduleNow === "later" && sendDate);

  const handleSubmit = () => {
    onSubmit({
      name,
      segment,
      subject,
      preview,
      sendDate: scheduleNow === "now" ? "Just now" : scheduleNow === "later" ? sendDate : "—",
      status: scheduleNow === "now" ? "Sending" : scheduleNow === "later" ? "Scheduled" : "Draft",
    });
  };

  const segments = [
    "All customers",
    "Residential — Bristol BS",
    "Commercial",
    "Past quote, no booking",
    "Lapsed — 12+ months",
    "Customers — last 24 months",
    "Recent customers (last 30 days)",
  ];

  return (
    <Dialog open={!!template} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>New campaign</DialogTitle>
          <DialogDescription>
            Step {step} of 3 — {step === 1 ? "Audience" : step === 2 ? "Content" : "Schedule"}
          </DialogDescription>
        </DialogHeader>

        {/* Stepper */}
        <div className="flex items-center gap-2 mb-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex-1 flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                  step >= s ? "bg-primary text-primary-foreground" : "bg-surface text-muted-foreground"
                }`}
              >
                {step > s ? <CheckCircle2 className="w-3.5 h-3.5" /> : s}
              </div>
              {s < 3 && <div className={`flex-1 h-px ${step > s ? "bg-primary" : "bg-border"}`} />}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-3">
            <Field label="Campaign name">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Spring window cleaning offer"
                className="h-9 w-full px-3 text-sm rounded-md border-hairline bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </Field>
            <Field label="Audience segment">
              <select
                value={segment}
                onChange={(e) => setSegment(e.target.value)}
                className="h-9 w-full px-2.5 text-sm rounded-md border-hairline bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select segment…</option>
                {segments.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              {segment && (
                <div className="text-xs text-muted-foreground mt-1.5 inline-flex items-center gap-1">
                  <Users className="w-3 h-3" /> ~{Math.floor(Math.random() * 300 + 80)} contacts
                </div>
              )}
            </Field>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <Field label="Subject line">
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="What will land in their inbox?"
                className="h-9 w-full px-3 text-sm rounded-md border-hairline bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </Field>
            <Field label="Preview text">
              <input
                value={preview}
                onChange={(e) => setPreview(e.target.value)}
                placeholder="Short preview shown after the subject"
                className="h-9 w-full px-3 text-sm rounded-md border-hairline bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </Field>
            <div className="border-hairline rounded-md p-3 bg-surface/50">
              <div className="text-xs text-muted-foreground mb-1">Inbox preview</div>
              <div className="text-sm font-medium truncate">{subject || "Subject line"}</div>
              <div className="text-xs text-muted-foreground truncate">{preview || "Preview text"}</div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <div className="space-y-2">
              {[
                { id: "now", label: "Send now", desc: "Deliver immediately to all recipients" },
                { id: "later", label: "Schedule for later", desc: "Pick a date and time" },
                { id: "draft", label: "Save as draft", desc: "Finish editing later" },
              ].map((opt) => (
                <label
                  key={opt.id}
                  className={`flex items-start gap-3 p-3 border-hairline rounded-md cursor-pointer transition-colors ${
                    scheduleNow === opt.id ? "border-primary bg-primary/5" : "hover:bg-surface-hover"
                  }`}
                >
                  <input
                    type="radio"
                    name="schedule"
                    checked={scheduleNow === opt.id}
                    onChange={() => setScheduleNow(opt.id as "now" | "later" | "draft")}
                    className="mt-0.5"
                  />
                  <div>
                    <div className="text-sm font-medium">{opt.label}</div>
                    <div className="text-xs text-muted-foreground">{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>
            {scheduleNow === "later" && (
              <Field label="Send date">
                <input
                  type="date"
                  value={sendDate}
                  onChange={(e) => setSendDate(e.target.value)}
                  className="h-9 w-full px-3 text-sm rounded-md border-hairline bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </Field>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t-hairline">
          <Btn variant="ghost" onClick={step === 1 ? onClose : () => setStep(step - 1)}>
            {step === 1 ? "Cancel" : (<><ArrowLeft className="w-3.5 h-3.5" /> Back</>)}
          </Btn>
          {step < 3 ? (
            <Btn
              variant="primary"
              onClick={() => setStep(step + 1)}
              disabled={(step === 1 && !canNext1) || (step === 2 && !canNext2)}
            >
              Continue <ArrowRight className="w-3.5 h-3.5" />
            </Btn>
          ) : (
            <Btn variant="primary" onClick={handleSubmit} disabled={!canSubmit}>
              {scheduleNow === "now" ? "Send now" : scheduleNow === "later" ? "Schedule" : "Save draft"}
            </Btn>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}
