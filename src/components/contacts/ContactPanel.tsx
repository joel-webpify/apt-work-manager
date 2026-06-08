import { useMemo, useState } from "react";
import {
  X, Phone, Mail, MessageSquare, Plus, CheckCircle2, FileText, StickyNote, Pencil,
  Send, MailOpen, MousePointerClick, AlertTriangle, PhoneCall, MessageCircle,
  Briefcase, Megaphone, ArrowUpRight,
} from "lucide-react";
import type { Contact } from "@/data/mockData";
import { jobs } from "@/data/mockData";
import { Pill } from "@/components/layout/PageShell";
import { initials, avatarColor } from "@/lib/avatar";
import { useContactExtras, updateContact } from "@/lib/contactsStore";
import { EditContactDialog } from "./EditContactDialog";
import { TagEditor } from "./TagEditor";
import { RefDrawer, type DrawerRef } from "./RefDrawer";

type Tab = "Overview" | "Jobs" | "Activity" | "Notes";
type ActivityFilter = "All" | "Email" | "Jobs" | "Calls" | "Notes";

export function ContactPanel({ contact, onClose }: { contact: Contact; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>("Overview");
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>("All");
  const [editOpen, setEditOpen] = useState(false);
  const [drawerRef, setDrawerRef] = useState<DrawerRef | null>(null);
  const extras = useContactExtras();
  const tags = extras[contact.id]?.tags ?? [];
  const history = jobs.filter((j) => j.contactId === contact.id);
  const av = avatarColor(contact.email || contact.name);
  const timeline = useMemo(() => buildTimeline(contact, history), [contact, history]);
  const visibleTimeline = useMemo(
    () => (activityFilter === "All" ? timeline : timeline.filter((e) => e.category === activityFilter)),
    [timeline, activityFilter],
  );

  return (
    <>
      <div className="fixed inset-0 bg-black/25 z-40 animate-fade-in" onClick={onClose} />
      <aside className="fixed top-0 right-0 h-screen w-[460px] bg-background border-l-hairline z-50 flex flex-col animate-slide-in-right">
        <header className="h-14 px-5 flex items-center justify-between border-b-hairline">
          <span className="text-sm font-medium text-muted-foreground">Contact</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setEditOpen(true)}
              className="h-7 px-2 rounded-md hover:bg-surface-hover flex items-center gap-1 text-xs"
            >
              <Pencil className="w-3.5 h-3.5" /> Edit
            </button>
            <button onClick={onClose} className="w-7 h-7 rounded-md hover:bg-surface-hover flex items-center justify-center">
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        <div className="px-5 pt-5 pb-4 border-b-hairline">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-semibold text-sm ${av.bg} ${av.fg}`}>
              {initials(contact.name)}
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold truncate">{contact.name}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <Pill tone={contact.lifecycle === "Customer" ? "success" : contact.lifecycle === "Lead" ? "info" : "neutral"}>
                  {contact.lifecycle}
                </Pill>
                <span className="text-xs text-muted-foreground">{contact.type}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <QuickAction icon={Phone} label="Call" href={`tel:${contact.phone}`} />
            <QuickAction icon={Mail} label="Email" href={`mailto:${contact.email}`} />
            <QuickAction icon={MessageSquare} label="Chat" />
            <QuickAction icon={Plus} label="New job" primary />
          </div>

          <div className="mt-4">
            <div className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground mb-2">
              Tags
            </div>
            <TagEditor contactId={contact.id} tags={tags} />
          </div>
        </div>

        <nav className="flex px-5 border-b-hairline">
          {(["Overview", "Jobs", "Activity", "Notes"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 h-10 text-sm border-b-2 -mb-px transition-colors ${
                tab === t
                  ? "border-primary text-foreground font-medium"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </nav>

        <div className="flex-1 overflow-y-auto p-5">
          {tab === "Overview" && (
            <div className="space-y-1.5 text-sm">
              <Row label="Phone" value={contact.phone} />
              <Row label="Email" value={contact.email} />
              <Row label="Postcode" value={contact.postcode} />
              <Row label="Lead source" value={contact.source} />
              <Row label="Last job" value={contact.lastJob || "—"} />
              <Row label="Total spend" value={`£${contact.totalSpend.toLocaleString()}`} />
            </div>
          )}

          {tab === "Jobs" && (
            history.length === 0 ? (
              <p className="text-sm text-muted-foreground">No jobs yet.</p>
            ) : (
              <div className="space-y-1.5">
                {history.map((j) => (
                  <div key={j.id} className="flex items-center justify-between text-sm border-hairline rounded-md px-3 h-10">
                    <div className="min-w-0">
                      <div className="truncate font-medium">{j.service}</div>
                      <div className="text-xs text-muted-foreground">{j.stage}</div>
                    </div>
                    <span className="font-medium tabular-nums">£{j.value}</span>
                  </div>
                ))}
              </div>
            )
          )}

          {tab === "Activity" && (
            <div>
              <div className="flex gap-1 mb-4 flex-wrap">
                {(["All", "Email", "Jobs", "Calls", "Notes"] as ActivityFilter[]).map((f) => {
                  const count =
                    f === "All" ? timeline.length : timeline.filter((e) => e.category === f).length;
                  return (
                    <button
                      key={f}
                      onClick={() => setActivityFilter(f)}
                      className={`h-6 px-2 rounded-md text-xs font-medium transition-colors ${
                        activityFilter === f
                          ? "bg-primary text-primary-foreground"
                          : "bg-surface text-muted-foreground hover:bg-surface-hover"
                      }`}
                    >
                      {f} <span className="opacity-60">{count}</span>
                    </button>
                  );
                })}
              </div>
              {visibleTimeline.length === 0 ? (
                <p className="text-sm text-muted-foreground">No activity yet.</p>
              ) : (
                <div className="relative pl-6">
                  <div className="absolute left-[9px] top-2 bottom-2 w-px bg-border" />
                  {visibleTimeline.map((e, i) => (
                    <div key={i} className="relative mb-5 last:mb-0">
                      <div className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center ${e.bg}`}>
                        <e.icon className={`w-2.5 h-2.5 ${e.fg}`} />
                      </div>
                      <div className="flex items-baseline justify-between gap-2">
                        <div className="text-sm font-medium truncate">{e.title}</div>
                        <div className="text-[11px] text-muted-foreground shrink-0 tabular-nums">{e.when}</div>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">{e.detail}</div>
                      {e.refs && e.refs.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {e.refs.map((r, idx) => (
                            <button
                              key={idx}
                              onClick={() => setDrawerRef(r.target)}
                              className="inline-flex items-center gap-1 h-6 px-1.5 rounded border-hairline bg-background hover:bg-surface-hover text-[11px] font-medium text-foreground transition-colors"
                            >
                              <r.icon className="w-3 h-3 text-muted-foreground" />
                              {r.label}
                              <ArrowUpRight className="w-2.5 h-2.5 text-muted-foreground" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "Notes" && (
            <textarea
              key={contact.id}
              defaultValue={contact.notes}
              placeholder="Add a note…"
              maxLength={2000}
              onBlur={(e) => updateContact(contact.id, { notes: e.target.value })}
              className="w-full min-h-[140px] border-hairline rounded-md p-2.5 text-sm bg-background resize-none focus:outline-none focus:border-primary/40"
            />
          )}
        </div>
      </aside>

      <EditContactDialog contact={contact} open={editOpen} onOpenChange={setEditOpen} />
      {drawerRef && <RefDrawer refItem={drawerRef} onClose={() => setDrawerRef(null)} />}
    </>
  );
}

function QuickAction({
  icon: Icon,
  label,
  href,
  primary,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href?: string;
  primary?: boolean;
}) {
  const cls = `flex flex-col items-center gap-1.5 py-2.5 rounded-lg border-hairline transition-colors ${
    primary
      ? "bg-primary text-primary-foreground border-primary hover:opacity-90"
      : "bg-card hover:bg-surface-hover"
  }`;
  const inner = (
    <>
      <Icon className="w-4 h-4" />
      <span className="text-[10px] uppercase tracking-wide font-medium">{label}</span>
    </>
  );
  return href ? (
    <a href={href} className={cls}>{inner}</a>
  ) : (
    <button className={cls}>{inner}</button>
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

type TimelineRef = {
  label: string;
  target: DrawerRef;
  icon: React.ComponentType<{ className?: string }>;
};

type TimelineEvent = {
  title: string;
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
  bg: string;
  fg: string;
  category: Exclude<ActivityFilter, "All">;
  at: number;
  when: string;
  refs?: TimelineRef[];
};



function relTime(at: number): string {
  const diff = Date.now() - at;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const mos = Math.round(days / 30);
  if (mos < 12) return `${mos}mo ago`;
  return `${Math.round(mos / 12)}y ago`;
}

// Deterministic pseudo-random from string seed
function seeded(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h ^= h << 13; h ^= h >>> 17; h ^= h << 5;
    return ((h >>> 0) % 10000) / 10000;
  };
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function buildTimeline(contact: Contact, history: typeof jobs): TimelineEvent[] {
  const events: Omit<TimelineEvent, "when">[] = [];
  const now = Date.now();
  const day = 86400000;
  const rnd = seeded(contact.id);

  // Jobs
  history.forEach((j, idx) => {
    const at = now - (idx + 1) * day * (3 + Math.floor(rnd() * 14));
    const done = j.stage === "Paid" || j.stage === "Completed" || j.stage === "Invoiced";
    events.push({
      title: `${j.stage}: ${j.service}`,
      detail: `£${j.value.toLocaleString()}${j.address ? ` • ${j.address}` : ""}`,
      icon: done ? CheckCircle2 : FileText,
      bg: done ? "bg-[hsl(var(--success)/0.15)]" : "bg-primary/10",
      fg: done ? "text-[hsl(var(--success))]" : "text-primary",
      category: "Jobs",
      at,
      refs: [
        { label: `Job #${j.id}`, target: { kind: "job", jobId: j.id }, icon: Briefcase },
      ],
    });
  });

  // Mock email thread (sent → opened → clicked, sometimes bounced)
  const emails: { subject: string; daysAgo: number }[] = [
    { subject: "Quote for your job", daysAgo: 2 + Math.floor(rnd() * 4) },
    { subject: "Invoice ready", daysAgo: 9 + Math.floor(rnd() * 6) },
    { subject: "Booking confirmation", daysAgo: 22 + Math.floor(rnd() * 10) },
  ];
  emails.forEach((em) => {
    const sentAt = now - em.daysAgo * day;
    const campaignId = slugify(em.subject);
    const campaignRef: TimelineRef = {
      label: em.subject,
      target: { kind: "campaign", campaignId, subject: em.subject },
      icon: Megaphone,
    };
    const refs = [campaignRef];

    events.push({
      title: `Sent: ${em.subject}`,
      detail: `To ${contact.email || "—"}`,
      icon: Send,
      bg: "bg-primary/10",
      fg: "text-primary",
      category: "Email",
      at: sentAt,
      refs,
    });
    const r = rnd();
    if (r < 0.15) {
      events.push({
        title: `Bounced: ${em.subject}`,
        detail: "Address rejected by recipient server",
        icon: AlertTriangle,
        bg: "bg-[hsl(var(--destructive)/0.15)]",
        fg: "text-[hsl(var(--destructive))]",
        category: "Email",
        at: sentAt + 60000,
        refs,
      });
      return;
    }
    if (r < 0.85) {
      const openAt = sentAt + (15 + Math.floor(rnd() * 600)) * 60000;
      events.push({
        title: `Opened: ${em.subject}`,
        detail: rnd() > 0.5 ? "Opened on iPhone Mail" : "Opened on Gmail (web)",
        icon: MailOpen,
        bg: "bg-[hsl(var(--success)/0.15)]",
        fg: "text-[hsl(var(--success))]",
        category: "Email",
        at: openAt,
        refs,
      });
      if (rnd() < 0.55) {
        events.push({
          title: `Clicked link in ${em.subject}`,
          detail: rnd() > 0.5 ? "Tapped “View quote”" : "Tapped “Pay invoice”",
          icon: MousePointerClick,
          bg: "bg-primary/15",
          fg: "text-primary",
          category: "Email",
          at: openAt + 90000,
          refs,
        });
      }
    }
  });

  // Mock call / SMS
  if (contact.phone) {
    events.push({
      title: "Outbound call",
      detail: `${1 + Math.floor(rnd() * 6)}m ${Math.floor(rnd() * 60)}s • answered`,
      icon: PhoneCall,
      bg: "bg-surface",
      fg: "text-foreground",
      category: "Calls",
      at: now - (4 + Math.floor(rnd() * 20)) * day,
    });
    if (rnd() > 0.5) {
      events.push({
        title: "SMS sent",
        detail: "“On my way, ETA 20 min”",
        icon: MessageCircle,
        bg: "bg-surface",
        fg: "text-foreground",
        category: "Calls",
        at: now - (1 + Math.floor(rnd() * 5)) * day,
      });
    }
  }


  if (contact.notes) {
    events.push({
      title: "Note",
      detail: contact.notes,
      icon: StickyNote,
      bg: "bg-surface",
      fg: "text-muted-foreground",
      category: "Notes",
      at: now - day,
    });
  }

  return events
    .sort((a, b) => b.at - a.at)
    .map((e) => ({ ...e, when: relTime(e.at) }));
}
