import { useEffect, useMemo, useRef, useState } from "react";
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
  Blocks,
  Code2,
  Upload,
  FileCode2,
  Gift,
  Wrench,
  ShieldCheck,
  PartyPopper,
} from "lucide-react";
import { Btn, Pill } from "@/components/layout/PageShell";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { EmailDesigner, renderBlocksToHtml, createBlock, type EmailBlock, type BlockType } from "./EmailDesigner";
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
  accent?: string;
  blocks?: EmailBlock[];
}

const defaultBody = `Hi {{first_name}},

Thanks for choosing us for your {{service_type}} work. We wanted to share a quick update with you.

Reply to this email or call us on 0117 000 0000 if you have any questions.

Best,
The team`;

// Helper to seed templates with rich block layouts
const tBlock = (type: BlockType, patch: Partial<EmailBlock> = {}): EmailBlock => ({ ...createBlock(type), ...patch });

const templates: Template[] = [
  {
    id: "t-blank",
    name: "Blank campaign",
    description: "Start from an empty canvas — drag blocks to build it your way.",
    segment: "All customers",
    subject: "",
    preview: "",
    body: "",
    icon: Mail,
    accent: "bg-slate-500/10 text-slate-600",
  },
  {
    id: "t-seasonal",
    name: "Seasonal offer",
    description: "Hero image, headline, benefits list and a strong CTA.",
    segment: "Residential — Bristol BS",
    subject: "Limited spring offer — save 15% this month",
    preview: "Book a service this April and save 15% on labour…",
    body: `Hi {{first_name}},\n\nSpring is here — and we're offering **15% off** {{service_type}} bookings made before the end of April.\n\nWe've still got a few slots left for your area ({{postcode}}). Reply to lock one in.\n\nBest,\n{{company_name}}`,
    icon: Gift,
    accent: "bg-rose-500/10 text-rose-600",
    blocks: [
      tBlock("logo"),
      tBlock("hero", {
        heroTitle: "Spring is here — save 15% this month",
        heroSubtitle: "Book any {{service_type}} before April 30th and we'll take 15% off labour.",
        heroCtaLabel: "Book my slot",
        bgColor: "#0f766e",
        color: "#ffffff",
      }),
      tBlock("text", { text: "Hi {{first_name}}, we've still got a handful of slots left in your area ({{postcode}}). Pick a time that suits and we'll do the rest." }),
      tBlock("list", { items: ["DBS-checked, uniformed team", "Fully insured & guaranteed", "Free re-clean if you're not happy"] }),
      tBlock("button", { label: "Claim 15% off", bgColor: "#0f766e" }),
      tBlock("divider"),
      tBlock("footer", { company: "{{company_name}}" }),
    ],
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
    accent: "bg-violet-500/10 text-violet-600",
    blocks: [
      tBlock("logo"),
      tBlock("heading", { text: "We miss you, {{first_name}}", level: 1, align: "center" }),
      tBlock("text", { text: "It's been a while since your last {{service_type}} with us. As a thank-you for being a previous customer, here's **10% off** your next booking — no strings.", align: "center" }),
      tBlock("button", { label: "Use my 10% off", bgColor: "#7c3aed" }),
      tBlock("quote", { text: "“They were on time, tidy and the finish was spotless. Booked them again the next year.”", label: "— Emma R., previous customer" }),
      tBlock("footer", { company: "{{company_name}}" }),
    ],
  },
  {
    id: "t-reminder",
    name: "Service reminder",
    description: "Annual maintenance prompt with a clear next step.",
    segment: "Customers — last 24 months",
    subject: "Time for your annual {{service_type}}",
    preview: "Stay on top of maintenance with a quick yearly check…",
    body: `Hi {{first_name}},\n\nJust a reminder — it's been close to a year since your last {{service_type}}. Annual checks keep everything running smoothly and catch small issues early.\n\nShall we book you in?\n\nBest,\n{{company_name}}`,
    icon: Wrench,
    accent: "bg-amber-500/10 text-amber-600",
    blocks: [
      tBlock("logo"),
      tBlock("heading", { text: "Time for your annual {{service_type}}", level: 2 }),
      tBlock("text", { text: "Hi {{first_name}}, it's been almost a year since your last visit on {{last_job_date}}. A quick annual check keeps everything safe and catches small issues before they grow." }),
      tBlock("columns", {
        leftText: "**What's included**\n- Full visual inspection\n- Compliance check\n- Written report",
        rightText: "**Typical visit**\n- 45–60 minutes\n- No mess left behind\n- Flexible time slots",
      }),
      tBlock("button", { label: "Book my annual check", bgColor: "#d97706" }),
      tBlock("footer", { company: "{{company_name}}" }),
    ],
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
    accent: "bg-emerald-500/10 text-emerald-600",
    blocks: [
      tBlock("logo"),
      tBlock("heading", { text: "How did we do, {{first_name}}?", align: "center" }),
      tBlock("text", { text: "Thanks again for booking your {{service_type}} with us. If we got it right, a quick Google review goes a long way for a small local business like ours.", align: "center" }),
      tBlock("button", { label: "Leave a review", bgColor: "#059669" }),
      tBlock("text", { text: "If anything was less than perfect, just hit reply — we'd rather hear from you directly so we can put it right.", align: "center" }),
      tBlock("footer", { company: "{{company_name}}" }),
    ],
  },
  {
    id: "t-launch",
    name: "New service launch",
    description: "Announce a new offering with hero, features and CTA.",
    segment: "All customers",
    subject: "Introducing {{service_type}} — built for homes like yours",
    preview: "Something new from {{company_name}}…",
    body: "",
    icon: PartyPopper,
    accent: "bg-fuchsia-500/10 text-fuchsia-600",
    blocks: [
      tBlock("logo"),
      tBlock("hero", {
        heroTitle: "Introducing our newest service",
        heroSubtitle: "Built around what {{postcode}} customers asked us for most.",
        heroCtaLabel: "See what's new",
        bgColor: "#1e293b",
      }),
      tBlock("columns3", {
        leftText: "**Faster**\nBook online in under a minute.",
        midText: "**Cleaner**\nLow-impact products, every visit.",
        rightText: "**Guaranteed**\nFree re-do within 7 days.",
      }),
      tBlock("button", { label: "Get an instant quote" }),
      tBlock("social"),
      tBlock("footer", { company: "{{company_name}}" }),
    ],
  },
  {
    id: "t-compliance",
    name: "Compliance reminder",
    description: "Professional notice for safety / certification renewals.",
    segment: "Commercial — all",
    subject: "Action needed: your annual safety check is due",
    preview: "Stay compliant with a quick yearly inspection…",
    body: "",
    icon: ShieldCheck,
    accent: "bg-blue-500/10 text-blue-600",
    blocks: [
      tBlock("logo"),
      tBlock("heading", { text: "Your annual safety check is due", level: 2 }),
      tBlock("text", { text: "Hi {{first_name}}, our records show your last certificate was issued on {{last_job_date}}. To stay compliant we recommend booking your renewal within the next 30 days." }),
      tBlock("quote", { text: "“Quick, professional, paperwork sorted same day.”", label: "— Site manager, BS3" }),
      tBlock("button", { label: "Schedule my inspection", bgColor: "#1d4ed8" }),
      tBlock("footer", { company: "{{company_name}}" }),
    ],
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
        <Btn variant="primary" onClick={() => setBuilderTemplate(templates[0] ?? null)}>
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
  const [subject, setSubject] = useState("");
  const [preview, setPreview] = useState("");
  const [body, setBody] = useState("");
  const [sendDate, setSendDate] = useState("");
  const [scheduleNow, setScheduleNow] = useState<"now" | "later" | "draft">("later");
  const [editorMode, setEditorMode] = useState<"visual" | "markdown" | "html">("visual");
  const [blocks, setBlocks] = useState<EmailBlock[]>([]);
  const [htmlSource, setHtmlSource] = useState<string>("");

  // Audience state
  const [savedAudiences, setSavedAudiences] = useState<SavedAudience[]>(initialSavedAudiences);
  const [audienceMode, setAudienceMode] = useState<"saved" | "custom">("saved");
  const [selectedAudienceId, setSelectedAudienceId] = useState<string>("");
  const [match, setMatch] = useState<"all" | "any">("all");
  const [rules, setRules] = useState<AudienceRule[]>([
    { id: "r1", field: "lifecycle", op: "is", value: "Customer" },
  ]);
  const [audienceNameDraft, setAudienceNameDraft] = useState("");

  const subjectRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const [activeField, setActiveField] = useState<"subject" | "body">("body");

  // Sync template on open — defensive against partial/missing template data
  useEffect(() => {
    if (!template) return;
    const safeName = template.name ?? "";
    setStep(1);
    setName(safeName === "Blank campaign" ? "" : safeName);
    setSubject(template.subject ?? "");
    setPreview(template.preview ?? "");
    setBody(template.body && template.body.length > 0 ? template.body : defaultBody);
    setSendDate("");
    setScheduleNow("later");
    setAudienceMode("saved");
    const matchAud = template.segment
      ? savedAudiences.find((a) => a.name === template.segment)
      : undefined;
    setSelectedAudienceId(matchAud?.id ?? savedAudiences[0]?.id ?? "");
    setMatch("all");
    setRules([{ id: "r1", field: "lifecycle", op: "is", value: "Customer" }]);
    setAudienceNameDraft("");
    // Seed designer blocks — use template-provided layout when available, otherwise minimal default
    setEditorMode("visual");
    setHtmlSource("");
    if (template.blocks && template.blocks.length > 0) {
      // Clone with fresh ids so edits don't mutate template defaults
      setBlocks(template.blocks.map((b) => ({ ...b, id: Math.random().toString(36).slice(2, 9) })));
    } else {
      setBlocks([
        { ...createBlock("heading"), text: template.subject || "Your headline here" },
        { ...createBlock("text"), text: template.body && template.body.length > 0 ? template.body : defaultBody },
        { ...createBlock("button"), label: "Book now", url: "https://" },
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template]);

  // Estimate for custom audience — deterministic pseudo calc
  const customEstimate = useMemo(() => {
    if (rules.length === 0) return 0;
    const base = match === "all" ? 420 : 680;
    const factor = rules.reduce((acc, r) => {
      const hash = (r.field + r.op + r.value).length;
      return acc * (match === "all" ? 0.55 + (hash % 10) / 40 : 0.85);
    }, 1);
    return Math.max(12, Math.floor(base * factor));
  }, [rules, match]);

  const selectedAudience = savedAudiences.find((a) => a.id === selectedAudienceId);
  const activeSegmentName =
    audienceMode === "saved"
      ? selectedAudience?.name ?? ""
      : audienceNameDraft.trim() || `Custom — ${rules.length} rule${rules.length === 1 ? "" : "s"}`;
  const activeEstimate = audienceMode === "saved" ? selectedAudience?.estimate ?? 0 : customEstimate;

  const canNext1 =
    name.trim().length > 0 &&
    ((audienceMode === "saved" && !!selectedAudience) || (audienceMode === "custom" && rules.length > 0));
  const canNext2 =
    subject.trim().length > 0 &&
    (editorMode === "markdown" ? body.trim().length > 0 : blocks.length > 0);
  const canSubmit = scheduleNow === "draft" || scheduleNow === "now" || (scheduleNow === "later" && sendDate);

  const handleSubmit = () => {
    onSubmit({
      name,
      segment: activeSegmentName,
      subject,
      preview,
      sendDate: scheduleNow === "now" ? "Just now" : scheduleNow === "later" ? sendDate : "—",
      status: scheduleNow === "now" ? "Sending" : scheduleNow === "later" ? "Scheduled" : "Draft",
    });
  };

  const updateRule = (id: string, patch: Partial<AudienceRule>) => {
    setRules((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const addRule = () => {
    setRules((rs) => [...rs, { id: `r${Date.now()}`, field: "lifecycle", op: "is", value: "Customer" }]);
  };

  const removeRule = (id: string) => {
    setRules((rs) => rs.filter((r) => r.id !== id));
  };

  const saveAudience = () => {
    const trimmed = audienceNameDraft.trim();
    if (!trimmed) return;
    const newAud: SavedAudience = {
      id: `aud${Date.now()}`,
      name: trimmed,
      match,
      rules,
      estimate: customEstimate,
    };
    setSavedAudiences((a) => [newAud, ...a]);
    setAudienceMode("saved");
    setSelectedAudienceId(newAud.id);
    setAudienceNameDraft("");
  };

  // Insert merge variable at caret into active field
  const insertVariable = (key: string) => {
    const token = `{{${key}}}`;
    if (activeField === "subject") {
      const el = subjectRef.current;
      if (!el) {
        setSubject((s) => s + token);
        return;
      }
      const start = el.selectionStart ?? subject.length;
      const end = el.selectionEnd ?? subject.length;
      const next = subject.slice(0, start) + token + subject.slice(end);
      setSubject(next);
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(start + token.length, start + token.length);
      });
    } else {
      const el = bodyRef.current;
      if (!el) {
        setBody((b) => b + token);
        return;
      }
      const start = el.selectionStart ?? body.length;
      const end = el.selectionEnd ?? body.length;
      const next = body.slice(0, start) + token + body.slice(end);
      setBody(next);
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(start + token.length, start + token.length);
      });
    }
  };

  // Wrap selection in body with given before/after tokens (e.g. **, _)
  const wrapSelection = (before: string, after: string = before) => {
    const el = bodyRef.current;
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const selected = body.slice(start, end) || "text";
    const next = body.slice(0, start) + before + selected + after + body.slice(end);
    setBody(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + before.length, start + before.length + selected.length);
    });
  };

  const insertAtCursor = (text: string) => {
    const el = bodyRef.current;
    if (!el) {
      setBody((b) => b + text);
      return;
    }
    const start = el.selectionStart ?? body.length;
    const end = el.selectionEnd ?? body.length;
    setBody(body.slice(0, start) + text + body.slice(end));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + text.length, start + text.length);
    });
  };

  // Preview rendering: substitute variables with examples and render minimal markdown
  const renderPreview = (text: string) => {
    let out = text;
    mergeVariables.forEach((v) => {
      out = out.split(`{{${v.key}}}`).join(v.example);
    });
    return out;
  };

  const bodyPreviewHtml = useMemo(() => {
    const rendered = renderPreview(body);
    // Minimal markdown: **bold**, *italic*, [label](url), newlines
    const escaped = rendered
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    const withMd = escaped
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-primary underline">$1</a>')
      .replace(/\n/g, "<br/>");
    return withMd;
  }, [body]);

  return (
    <Dialog open={!!template} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className={`${step === 2 ? "max-w-5xl" : "max-w-3xl"} max-h-[92vh] overflow-y-auto`}>
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
          <div className="space-y-4">
            <Field label="Campaign name">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Spring window cleaning offer"
                className="h-9 w-full px-3 text-sm rounded-md border-hairline bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </Field>

            {/* Mode tabs */}
            <div className="flex items-center gap-1 border-hairline rounded-md p-0.5 w-fit">
              {(["saved", "custom"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setAudienceMode(m)}
                  className={`h-7 px-3 rounded text-xs font-medium transition-colors ${
                    audienceMode === m ? "bg-surface text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {m === "saved" ? "Saved audiences" : "Build new"}
                </button>
              ))}
            </div>

            {audienceMode === "saved" ? (
              <div className="space-y-2">
                {savedAudiences.map((a) => (
                  <label
                    key={a.id}
                    className={`flex items-start gap-3 p-3 border-hairline rounded-md cursor-pointer transition-colors ${
                      selectedAudienceId === a.id ? "border-primary bg-primary/5" : "hover:bg-surface-hover"
                    }`}
                  >
                    <input
                      type="radio"
                      name="audience"
                      checked={selectedAudienceId === a.id}
                      onChange={() => setSelectedAudienceId(a.id)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-medium">{a.name}</div>
                        <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                          <Users className="w-3 h-3" /> {a.estimate.toLocaleString()}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        Match {a.match === "all" ? "all" : "any"} of{" "}
                        {(a.rules ?? [])
                          .map((r) => {
                            const fieldLabel = ruleFieldConfig[r.field]?.label ?? r.field;
                            const opLabel = opLabels[r.op] ?? r.op;
                            return `${fieldLabel} ${opLabel} ${r.value ?? ""}`;
                          })
                          .join(a.match === "all" ? " AND " : " OR ")}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Match</span>
                  <div className="flex items-center gap-1 border-hairline rounded-md p-0.5">
                    {(["all", "any"] as const).map((m) => (
                      <button
                        key={m}
                        onClick={() => setMatch(m)}
                        className={`h-6 px-2 rounded text-xs font-medium transition-colors ${
                          match === m ? "bg-surface text-foreground" : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {m === "all" ? "All (AND)" : "Any (OR)"}
                      </button>
                    ))}
                  </div>
                  <div className="flex-1" />
                  <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                    <Users className="w-3 h-3" /> ~{customEstimate.toLocaleString()} contacts
                  </span>
                </div>

                <div className="space-y-2">
                  {rules.map((r) => {
                    const cfg = ruleFieldConfig[r.field] ?? ruleFieldConfig.lifecycle;
                    const ops = cfg.ops ?? [];
                    const selectOptions = cfg.options ?? [];
                    return (
                      <div key={r.id} className="flex items-center gap-2">
                        <select
                          value={r.field}
                          onChange={(e) => {
                            const nextField = e.target.value as RuleField;
                            const nextCfg = ruleFieldConfig[nextField];
                            if (!nextCfg) return;
                            updateRule(r.id, {
                              field: nextField,
                              op: nextCfg.ops[0],
                              value: nextCfg.kind === "select" ? (nextCfg.options?.[0] ?? "") : "",
                            });
                          }}
                          className="h-8 px-2 text-xs rounded-md border-hairline bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                          {(Object.keys(ruleFieldConfig) as RuleField[]).map((f) => (
                            <option key={f} value={f}>
                              {ruleFieldConfig[f].label}
                            </option>
                          ))}
                        </select>
                        <select
                          value={r.op}
                          onChange={(e) => updateRule(r.id, { op: e.target.value as RuleOp })}
                          className="h-8 px-2 text-xs rounded-md border-hairline bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                          {ops.map((op) => (
                            <option key={op} value={op}>
                              {opLabels[op] ?? op}
                            </option>
                          ))}
                        </select>
                        {cfg.kind === "select" ? (
                          <select
                            value={r.value}
                            onChange={(e) => updateRule(r.id, { value: e.target.value })}
                            className="h-8 px-2 text-xs rounded-md border-hairline bg-background focus:outline-none focus:ring-2 focus:ring-ring flex-1"
                          >
                            {selectOptions.map((o) => (
                              <option key={o} value={o}>
                                {o}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={cfg.kind === "number" ? "number" : "text"}
                            value={r.value}
                            onChange={(e) => updateRule(r.id, { value: e.target.value })}
                            placeholder={cfg.kind === "number" ? "0" : "value"}
                            className="h-8 px-2 text-xs rounded-md border-hairline bg-background focus:outline-none focus:ring-2 focus:ring-ring flex-1"
                          />
                        )}
                        <button
                          onClick={() => removeRule(r.id)}
                          disabled={rules.length === 1}
                          className="h-8 w-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed"
                          aria-label="Remove rule"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>

                <Btn variant="ghost" onClick={addRule}>
                  <Plus className="w-3.5 h-3.5" /> Add rule
                </Btn>

                <div className="flex items-center gap-2 pt-2 border-t-hairline">
                  <input
                    value={audienceNameDraft}
                    onChange={(e) => setAudienceNameDraft(e.target.value)}
                    placeholder="Name this audience to save it…"
                    className="h-8 flex-1 px-3 text-xs rounded-md border-hairline bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <Btn variant="secondary" onClick={saveAudience} disabled={!audienceNameDraft.trim()}>
                    <Save className="w-3.5 h-3.5" /> Save audience
                  </Btn>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            {/* Mode toggle */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 border-hairline rounded-md p-0.5">
                <button
                  onClick={() => setEditorMode("visual")}
                  className={`h-7 px-3 rounded text-xs font-medium inline-flex items-center gap-1.5 transition-colors ${
                    editorMode === "visual" ? "bg-surface text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Blocks className="w-3.5 h-3.5" /> Visual builder
                </button>
                <button
                  onClick={() => setEditorMode("markdown")}
                  className={`h-7 px-3 rounded text-xs font-medium inline-flex items-center gap-1.5 transition-colors ${
                    editorMode === "markdown" ? "bg-surface text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" /> Markdown
                </button>
              </div>
              <span className="text-xs text-muted-foreground">
                {editorMode === "visual"
                  ? "Drag blocks into the canvas to design your email."
                  : "Write in markdown with merge variables."}
              </span>
            </div>

            <Field label="Subject line">
              <input
                ref={subjectRef}
                value={subject}
                onFocus={() => setActiveField("subject")}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="What will land in their inbox?"
                className="h-9 w-full px-3 text-sm rounded-md border-hairline bg-background focus:outline-none focus:ring-2 focus:ring-ring font-mono"
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

            {/* Variable chips (shared) */}
            <div className="border-hairline rounded-md p-2.5 bg-surface/50">
              <div className="flex items-center gap-1.5 mb-2">
                <Braces className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {editorMode === "markdown" ? (
                    <>
                      Insert variable into{" "}
                      <span className="font-medium text-foreground">
                        {activeField === "subject" ? "subject" : "body"}
                      </span>
                    </>
                  ) : (
                    <>Copy a variable into any text block or the subject</>
                  )}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {mergeVariables.map((v) => (
                  <button
                    key={v.key}
                    onClick={() => {
                      if (editorMode === "markdown") {
                        insertVariable(v.key);
                      } else if (activeField === "subject") {
                        insertVariable(v.key);
                      } else {
                        navigator.clipboard?.writeText(`{{${v.key}}}`).catch(() => {});
                      }
                    }}
                    className="h-6 px-2 text-xs rounded-md border-hairline bg-background hover:bg-surface-hover hover:border-primary/40 transition-colors inline-flex items-center gap-1"
                    title={`Example: ${v.example} — click to insert/copy`}
                  >
                    <span className="font-mono text-muted-foreground">{`{{${v.key}}}`}</span>
                    <span>{v.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {editorMode === "visual" ? (
              <Field label="Email design">
                <EmailDesigner
                  blocks={blocks}
                  onChange={setBlocks}
                  vars={Object.fromEntries(mergeVariables.map((v) => [v.key, v.example]))}
                />
              </Field>
            ) : (
              <Field label="Body">
                <div className="border-hairline rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-ring">
                  {/* Toolbar */}
                  <div className="flex items-center gap-0.5 px-1.5 py-1 border-b-hairline bg-surface/50">
                    <ToolbarBtn onClick={() => wrapSelection("**")} title="Bold">
                      <Bold className="w-3.5 h-3.5" />
                    </ToolbarBtn>
                    <ToolbarBtn onClick={() => wrapSelection("*")} title="Italic">
                      <Italic className="w-3.5 h-3.5" />
                    </ToolbarBtn>
                    <ToolbarBtn onClick={() => insertAtCursor("\n## Heading\n")} title="Heading">
                      <HeadingIcon className="w-3.5 h-3.5" />
                    </ToolbarBtn>
                    <ToolbarBtn onClick={() => insertAtCursor("\n- Item\n- Item\n")} title="List">
                      <ListIcon className="w-3.5 h-3.5" />
                    </ToolbarBtn>
                    <ToolbarBtn
                      onClick={() => {
                        const url = window.prompt("Link URL", "https://");
                        if (!url) return;
                        wrapSelection("[", `](${url})`);
                      }}
                      title="Link"
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                    </ToolbarBtn>
                    <div className="w-px h-4 bg-border mx-1" />
                    <span className="text-xs text-muted-foreground px-1">
                      Markdown + {"{{variables}}"}
                    </span>
                  </div>
                  <textarea
                    ref={bodyRef}
                    value={body}
                    onFocus={() => setActiveField("body")}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Write your email. Use **bold**, *italic*, [links](url) and {{first_name}} style variables."
                    className="w-full min-h-[200px] px-3 py-2 text-sm bg-background focus:outline-none font-mono resize-y"
                  />
                </div>
              </Field>
            )}

            {/* Inbox preview */}
            <div className="border-hairline rounded-md overflow-hidden">
              <div className="px-3 py-2 border-b-hairline bg-surface/50 flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Inbox preview
                </span>
                <span className="text-xs text-muted-foreground ml-auto">with example values</span>
              </div>
              <div className="px-3 py-3 bg-background">
                <div className="text-sm font-medium">{renderPreview(subject) || "Subject line"}</div>
                {preview && (
                  <div className="text-xs text-muted-foreground mt-0.5">{renderPreview(preview)}</div>
                )}
                {editorMode === "visual" ? (
                  <div
                    className="mt-3"
                    dangerouslySetInnerHTML={{
                      __html: renderBlocksToHtml(
                        blocks,
                        Object.fromEntries(mergeVariables.map((v) => [v.key, v.example])),
                      ),
                    }}
                  />
                ) : (
                  <div
                    className="text-sm mt-3 leading-relaxed text-foreground"
                    dangerouslySetInnerHTML={{ __html: bodyPreviewHtml || "Body preview…" }}
                  />
                )}
              </div>
            </div>
          </div>
        )}


        {step === 3 && (
          <div className="space-y-3">
            <div className="border-hairline rounded-md p-3 bg-surface/50 flex items-center gap-3">
              <Users className="w-4 h-4 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{activeSegmentName || "Untitled audience"}</div>
                <div className="text-xs text-muted-foreground">~{(activeEstimate ?? 0).toLocaleString()} recipients</div>
              </div>
            </div>
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

function ToolbarBtn({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="h-7 w-7 inline-flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors"
    >
      {children}
    </button>
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
