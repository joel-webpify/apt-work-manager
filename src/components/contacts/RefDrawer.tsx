import { X, Briefcase, Megaphone, MapPin, Calendar, Users, MailOpen, MousePointerClick, AlertTriangle } from "lucide-react";
import { jobs, contacts as allContacts } from "@/data/mockData";
import { Pill } from "@/components/layout/PageShell";

export type DrawerRef =
  | { kind: "job"; jobId: string }
  | { kind: "campaign"; campaignId: string; subject: string };

export function RefDrawer({ refItem, onClose }: { refItem: DrawerRef; onClose: () => void }) {
  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-[60] animate-fade-in" onClick={onClose} />
      <aside className="fixed top-0 right-0 h-screen w-[420px] bg-background border-l-hairline z-[70] flex flex-col animate-slide-in-right shadow-2xl">
        <header className="h-14 px-5 flex items-center justify-between border-b-hairline">
          <span className="text-sm font-medium text-muted-foreground">
            {refItem.kind === "job" ? "Job" : "Email campaign"}
          </span>
          <button onClick={onClose} className="w-7 h-7 rounded-md hover:bg-surface-hover flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-5">
          {refItem.kind === "job" ? <JobView jobId={refItem.jobId} /> : <CampaignView campaignId={refItem.campaignId} subject={refItem.subject} />}
        </div>
      </aside>
    </>
  );
}

function JobView({ jobId }: { jobId: string }) {
  const job = jobs.find((j) => j.id === jobId);
  if (!job) {
    return <p className="text-sm text-muted-foreground">Job not found.</p>;
  }
  const customer = allContacts.find((c) => c.id === job.contactId);
  const done = job.stage === "Paid" || job.stage === "Completed" || job.stage === "Invoiced";

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <Briefcase className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs text-muted-foreground">Job #{job.id}</div>
          <h3 className="text-lg font-semibold truncate">{job.service}</h3>
          <div className="mt-1">
            <Pill tone={done ? "success" : "info"}>{job.stage}</Pill>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Value</div>
          <div className="text-lg font-semibold tabular-nums">£{job.value.toLocaleString()}</div>
        </div>
      </div>

      <div className="space-y-1.5 text-sm border-t-hairline pt-4">
        <Row label="Customer" value={customer?.name ?? "—"} />
        <Row label="Stage" value={job.stage} />
        <Row label="Service" value={job.service} />
        {job.address && <Row label="Address" value={job.address} />}
        <Row label="Value" value={`£${job.value.toLocaleString()}`} />
      </div>
    </div>
  );
}

function CampaignView({ campaignId, subject }: { campaignId: string; subject: string }) {
  // Deterministic mock stats
  const seed = [...campaignId].reduce((a, c) => a + c.charCodeAt(0), 0);
  const sent = 80 + (seed % 320);
  const openRate = 32 + (seed % 28);
  const clickRate = 6 + (seed % 12);
  const bounceRate = (seed % 4);
  const opens = Math.round((sent * openRate) / 100);
  const clicks = Math.round((sent * clickRate) / 100);
  const bounces = Math.round((sent * bounceRate) / 100);
  const sentDaysAgo = 2 + (seed % 28);

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <Megaphone className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs text-muted-foreground">Campaign · {campaignId}</div>
          <h3 className="text-lg font-semibold truncate">{subject}</h3>
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            Sent {sentDaysAgo}d ago
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Stat icon={Users} label="Recipients" value={sent.toLocaleString()} />
        <Stat icon={MailOpen} label="Open rate" value={`${openRate}%`} sub={`${opens} opens`} tone="success" />
        <Stat icon={MousePointerClick} label="Click rate" value={`${clickRate}%`} sub={`${clicks} clicks`} tone="primary" />
        <Stat icon={AlertTriangle} label="Bounced" value={`${bounceRate}%`} sub={`${bounces} bounces`} tone="warn" />
      </div>

      <div className="space-y-1.5 text-sm border-t-hairline pt-4">
        <Row label="Subject" value={subject} />
        <Row label="Status" value="Delivered" />
        <Row label="From" value="hello@yourbusiness.com" />
        <Row label="Sent" value={`${sentDaysAgo} days ago`} />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right truncate">{value}</span>
    </div>
  );
}

function Stat({
  icon: Icon, label, value, sub, tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
  tone?: "success" | "primary" | "warn";
}) {
  const toneClass =
    tone === "success" ? "text-[hsl(var(--success))]"
    : tone === "warn" ? "text-[hsl(var(--destructive))]"
    : tone === "primary" ? "text-primary"
    : "text-foreground";
  return (
    <div className="border-hairline rounded-lg p-3">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        <Icon className="w-3 h-3" /> {label}
      </div>
      <div className={`text-xl font-semibold mt-1 tabular-nums ${toneClass}`}>{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}
