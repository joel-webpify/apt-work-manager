import { useMemo, useState } from "react";
import {
  X, Phone, Mail, MessageSquare, Plus, CheckCircle2, FileText, StickyNote, Pencil,
  Send, MailOpen, MousePointerClick, AlertTriangle, PhoneCall, MessageCircle,
} from "lucide-react";
import type { Contact } from "@/data/mockData";
import { jobs } from "@/data/mockData";
import { Pill } from "@/components/layout/PageShell";
import { initials, avatarColor } from "@/lib/avatar";
import { useContactExtras, updateContact } from "@/lib/contactsStore";
import { EditContactDialog } from "./EditContactDialog";
import { TagEditor } from "./TagEditor";

type Tab = "Overview" | "Jobs" | "Activity" | "Notes";
type ActivityFilter = "All" | "Email" | "Jobs" | "Calls" | "Notes";

export function ContactPanel({ contact, onClose }: { contact: Contact; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>("Overview");
  const [editOpen, setEditOpen] = useState(false);
  const extras = useContactExtras();
  const tags = extras[contact.id]?.tags ?? [];
  const history = jobs.filter((j) => j.contactId === contact.id);
  const av = avatarColor(contact.email || contact.name);

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
            <div className="relative pl-6">
              <div className="absolute left-[9px] top-2 bottom-2 w-px bg-border" />
              {buildTimeline(contact, history).map((e, i) => (
                <div key={i} className="relative mb-5 last:mb-0">
                  <div className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center ${e.bg}`}>
                    <e.icon className={`w-2.5 h-2.5 ${e.fg}`} />
                  </div>
                  <div className="text-sm font-medium">{e.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{e.detail}</div>
                </div>
              ))}
              {buildTimeline(contact, history).length === 0 && (
                <p className="text-sm text-muted-foreground -ml-6">No activity yet.</p>
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

function buildTimeline(contact: Contact, history: typeof jobs) {
  const events: { title: string; detail: string; icon: React.ComponentType<{ className?: string }>; bg: string; fg: string }[] = [];
  for (const j of history) {
    if (j.stage === "Paid" || j.stage === "Completed" || j.stage === "Invoiced") {
      events.push({
        title: `${j.stage}: ${j.service}`,
        detail: `£${j.value.toLocaleString()} • ${j.address || ""}`,
        icon: CheckCircle2,
        bg: "bg-[hsl(var(--success)/0.15)]",
        fg: "text-[hsl(var(--success))]",
      });
    } else {
      events.push({
        title: `${j.stage}: ${j.service}`,
        detail: `£${j.value.toLocaleString()}`,
        icon: FileText,
        bg: "bg-primary/10",
        fg: "text-primary",
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
    });
  }
  return events;
}
