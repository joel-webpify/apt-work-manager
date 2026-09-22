import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  X, Mail, MessageSquare, Plus, CheckCircle2, FileText, StickyNote, Pencil,
  Send, MailOpen, MousePointerClick, AlertTriangle,
  Briefcase, Megaphone, ArrowUpRight, Package, ChevronDown, ChevronRight,
  Phone, Copy, Check, CalendarDays, Info, Workflow,
} from "lucide-react";
import type { Contact, Job } from "@/data/mockData";
import { employees } from "@/data/mockData";
import { Pill } from "@/components/layout/PageShell";
import { initials, avatarColor } from "@/lib/avatar";
import { updateContact, updateContactExtra, useContactExtras, type MarketingConsent } from "@/lib/contactsStore";
import { useJobs } from "@/lib/jobsStore";
import { useQuotes } from "@/lib/quotesStore";
import { useWorkflows } from "@/lib/workflowsStore";
import { useChannelGroups, groupForSource } from "@/lib/channelGroups";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";
import { EditContactDialog } from "./EditContactDialog";
import { TagEditor } from "./TagEditor";
import { RefDrawer, type DrawerRef } from "./RefDrawer";

type Tab = "Overview" | "Jobs" | "Activity" | "Notes";
type ActivityFilter = "All" | "Email" | "Jobs" | "Notes";

export function ContactPanel({ contact, onClose }: { contact: Contact; onClose: () => void }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("Overview");
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>("All");
  const [editOpen, setEditOpen] = useState(false);
  const [drawerRef, setDrawerRef] = useState<DrawerRef | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [nextActionOpen, setNextActionOpen] = useState(false);
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const extras = useContactExtras();
  const [allJobs] = useJobs();
  const [quotes] = useQuotes();
  const workflows = useWorkflows();
  const extra = extras[contact.id] ?? {};
  const currentContact = { ...contact, ...(extra.overrides ?? {}) };
  const tags = extra.tags ?? [];
  const history = allJobs.filter((j) => j.contactId === contact.id);
  const av = avatarColor(currentContact.email || currentContact.name);
  const jobsMeta = useMemo(() => buildJobsMeta(currentContact, history), [currentContact, history]);
  const leadSinceAt = useMemo(() => computeLeadSince(currentContact, history), [currentContact, history]);
  const productSummary = useMemo(() => summarizeProducts(jobsMeta), [jobsMeta]);
  const timeline = useMemo(() => buildTimeline(currentContact, jobsMeta), [currentContact, jobsMeta]);
  const contactQuotes = quotes.filter((q) => q.contactId === contact.id);
  const scoreFactors = leadScoreFactors(currentContact, history, contactQuotes);
  const leadScore = scoreFactors.reduce((sum, factor) => sum + factor.points, 0);
  const owner = employees.find((employee) => employee.id === extra.assignedRepId);
  const enrolled = workflows.filter((workflow) => extra.automationIds?.includes(workflow.id));
  const availableAutomations = workflows.filter((workflow) => workflow.active && !extra.automationIds?.includes(workflow.id));
  const lastActivity = latestActivity(currentContact, history, contactQuotes);
  const visibleTimeline = useMemo(
    () => (activityFilter === "All" ? timeline : timeline.filter((e) => e.category === activityFilter)),
    [timeline, activityFilter],
  );

  return (
    <>
      <div className="fixed inset-0 bg-black/25 z-40 animate-fade-in" onClick={onClose} />
       <aside className="fixed top-0 right-0 h-screen w-full sm:w-[460px] bg-background border-l-hairline z-50 flex flex-col animate-slide-in-right">
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
               {initials(currentContact.name)}
            </div>
            <div className="min-w-0">
               <h2 className="text-lg font-semibold truncate">{currentContact.name}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                 <Pill tone={currentContact.lifecycle === "Customer" ? "success" : currentContact.lifecycle === "Lead" ? "info" : "neutral"}>
                   {currentContact.lifecycle}
                </Pill>
                 <label className="relative inline-flex items-center">
                   <select
                     aria-label="Contact type"
                     value={currentContact.type}
                     onChange={(event) => updateContact(contact.id, { type: event.target.value as Contact["type"] })}
                     className="h-6 appearance-none rounded-md border-hairline bg-background pl-2 pr-6 text-xs font-medium focus:outline-none focus:border-primary/50"
                   >
                     <option>Residential</option>
                     <option>Commercial</option>
                   </select>
                   <ChevronDown className="pointer-events-none absolute right-1.5 h-3 w-3 text-primary" />
                 </label>
              </div>
            </div>
          </div>

           <div className="grid grid-cols-4 gap-2">
             <QuickAction icon={Mail} label="Email" href={currentContact.email ? `mailto:${currentContact.email}` : undefined} disabled={!currentContact.email} disabledReason="Requires an email address on file" />
             <QuickAction icon={Phone} label="Call" href={currentContact.phone ? `tel:${currentContact.phone}` : undefined} disabled={!currentContact.phone} disabledReason="Requires a phone number on file" />
             <QuickAction icon={MessageSquare} label="Chat" href={smsHref(currentContact.phone)} disabled={!smsHref(currentContact.phone)} disabledReason="Requires an SMS number on file" />
             <QuickAction icon={Plus} label="New project" primary onClick={() => { onClose(); navigate("/pipeline"); }} />
          </div>

           <div className="mt-4 grid grid-cols-3 divide-x divide-border rounded-md border-hairline bg-surface/50">
             <Popover>
               <PopoverTrigger asChild>
                 <button className="min-w-0 px-3 py-2 text-left hover:bg-surface-hover">
                   <span className="block text-[10px] text-muted-foreground">Score</span>
                   <span className="text-xs font-semibold text-primary">{leadScore}/100</span>
                 </button>
               </PopoverTrigger>
               <PopoverContent align="start" className="w-64 p-3">
                 <div className="mb-2 text-xs font-semibold">Score factors</div>
                 <div className="space-y-2">
                   {scoreFactors.map((factor) => (
                     <div key={factor.label} className="flex items-center justify-between gap-3 text-xs">
                       <span className="text-muted-foreground">{factor.label}</span>
                       <span className="font-semibold text-primary">+{factor.points}</span>
                     </div>
                   ))}
                 </div>
               </PopoverContent>
             </Popover>
             <Popover>
               <PopoverTrigger asChild>
                 <button className="min-w-0 px-3 py-2 text-left hover:bg-surface-hover">
                   <span className="block text-[10px] text-muted-foreground">Owner</span>
                   <span className="block truncate text-xs font-medium">{owner?.name ?? "Unassigned"}</span>
                 </button>
               </PopoverTrigger>
               <PopoverContent align="center" className="w-56 p-1">
                 <PickerButton label="Unassigned" onClick={() => updateContactExtra(contact.id, { assignedRepId: undefined })} />
                 {employees.map((employee) => <PickerButton key={employee.id} label={employee.name} onClick={() => updateContactExtra(contact.id, { assignedRepId: employee.id })} />)}
               </PopoverContent>
             </Popover>
             <Popover open={nextActionOpen} onOpenChange={setNextActionOpen}>
               <PopoverTrigger asChild>
                 <button className="min-w-0 px-3 py-2 text-left hover:bg-surface-hover">
                   <span className="block text-[10px] text-muted-foreground">Next action</span>
                   <span className="block truncate text-xs font-medium">{extra.nextActionNote || "None set"}</span>
                 </button>
               </PopoverTrigger>
               <PopoverContent align="end" className="w-72 p-3">
                 <NextActionEditor note={extra.nextActionNote ?? ""} date={extra.nextActionDate ?? ""} onSave={(note, date) => { updateContactExtra(contact.id, { nextActionNote: note || undefined, nextActionDate: date || undefined }); setNextActionOpen(false); }} />
               </PopoverContent>
             </Popover>
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
            <div className="space-y-5">
               <section>
                 <SectionLabel>Overview</SectionLabel>
                 <div className="space-y-2 text-sm">
                   <Row label="Phone" value={currentContact.phone || "Not set"} />
                   <div className="flex items-center justify-between gap-3">
                     <span className="shrink-0 text-muted-foreground">Email</span>
                     <div className="flex min-w-0 items-center gap-1.5">
                       <span className="truncate font-medium">{currentContact.email || "Not set"}</span>
                       {currentContact.email && <button aria-label="Copy email" className="shrink-0 rounded p-1 text-muted-foreground hover:bg-surface-hover hover:text-foreground" onClick={async () => { await navigator.clipboard.writeText(currentContact.email); setCopied(true); toast({ title: "Email copied" }); window.setTimeout(() => setCopied(false), 1500); }}>{copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}</button>}
                     </div>
                   </div>
                   <Row label="Last activity" value={lastActivity ? `${relTime(lastActivity)} · ${formatDateTime(lastActivity)}` : "No activity yet"} />
                   <Row label="Total spend" value={`£${currentContact.totalSpend.toLocaleString()}`} />
                 </div>
                 <button onClick={() => setMoreOpen((value) => !value)} className="mt-3 flex w-full items-center justify-between border-t-hairline pt-3 text-xs font-medium text-muted-foreground hover:text-foreground">
                   More details {moreOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                 </button>
                 {moreOpen && <div className="mt-3 space-y-2 text-sm">
                   <Row label="Location" value={currentContact.postcode || "Not set"} />
                   <Row label="Record source" value={safeAttribution(currentContact.source)} />
                   <Row label="Lead since" value={leadSinceAt ? formatDate(leadSinceAt) : "Not recorded"} />
                   <Row label="Last job in pipeline" value={latestJobLabel(history)} />
                 </div>}
               </section>

               <Attribution source={currentContact.source} mode={extra.attributionMode ?? "manual"} />

               <section>
                 <SectionLabel>Marketing consent</SectionLabel>
                 <select aria-label="Marketing consent" value={extra.marketingConsent ?? "not_set"} onChange={(event) => updateContactExtra(contact.id, { marketingConsent: event.target.value as MarketingConsent })} className="h-9 w-full rounded-md border-hairline bg-background px-2.5 text-sm focus:outline-none focus:border-primary/40">
                   <option value="not_set">Not set</option>
                   <option value="opted_in">Opted in</option>
                   <option value="opted_out">Opted out</option>
                 </select>
               </section>

               <section>
                 <div className="mb-2 flex items-center justify-between">
                   <SectionLabel>Email automations</SectionLabel>
                   <button onClick={() => setEnrollOpen((value) => !value)} className="text-xs font-medium text-primary hover:underline">{enrolled.length ? "Add another" : "Browse automations →"}</button>
                 </div>
                 {enrolled.length === 0 ? <p className="text-sm text-muted-foreground">This contact has not been enrolled in any automations yet.</p> : <div className="space-y-1.5">{enrolled.map((workflow) => <div key={workflow.id} className="flex items-center gap-2 rounded-md border-hairline px-2.5 py-2 text-sm"><Workflow className="h-3.5 w-3.5 text-primary" /><span className="min-w-0 flex-1 truncate">{workflow.name}</span><button className="text-xs text-muted-foreground hover:text-foreground" onClick={() => updateContactExtra(contact.id, { automationIds: extra.automationIds?.filter((id) => id !== workflow.id) })}>Remove</button></div>)}</div>}
                 {enrollOpen && <div className="mt-3 rounded-md border-hairline bg-surface/50 p-2.5">
                   {extra.marketingConsent !== "opted_in" ? <div className="flex gap-2 text-xs text-[hsl(var(--destructive))]"><AlertTriangle className="h-3.5 w-3.5 shrink-0" /><span>Set marketing consent to Opted in before enrolling this contact.</span></div> : availableAutomations.length === 0 ? <p className="text-xs text-muted-foreground">No other active automations are available.</p> : <div className="space-y-1">{availableAutomations.map((workflow) => <PickerButton key={workflow.id} label={workflow.name} onClick={() => updateContactExtra(contact.id, { automationIds: [...(extra.automationIds ?? []), workflow.id] })} />)}</div>}
                 </div>}
               </section>

              {productSummary.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">
                      Products purchased
                    </div>
                    <span className="text-[10px] text-muted-foreground">For retargeting</span>
                  </div>
                  <div className="space-y-1">
                    {productSummary.map((p) => (
                      <div key={p.name} className="flex items-center justify-between text-sm border-hairline rounded-md px-3 h-9">
                        <div className="flex items-center gap-2 min-w-0">
                          <Package className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span className="truncate">{p.name}</span>
                          <span className="text-xs text-muted-foreground shrink-0">×{p.qty}</span>
                        </div>
                        <span className="font-medium tabular-nums text-xs">£{p.spend.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === "Jobs" && (
            history.length === 0 ? (
              <p className="text-sm text-muted-foreground">No jobs yet.</p>
            ) : (
              <div className="space-y-2">
                {jobsMeta.map((j) => (
                  <JobCard key={j.id} job={j} />
                ))}
              </div>
            )
          )}

          {tab === "Activity" && (
            <div>
              <div className="flex gap-1 mb-4 flex-wrap">
                {(["All", "Email", "Jobs", "Notes"] as ActivityFilter[]).map((f) => {
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
               key={currentContact.id}
               defaultValue={currentContact.notes}
              placeholder="Add a note…"
              maxLength={2000}
              onBlur={(e) => updateContact(contact.id, { notes: e.target.value })}
              className="w-full min-h-[140px] border-hairline rounded-md p-2.5 text-sm bg-background resize-none focus:outline-none focus:border-primary/40"
            />
          )}
        </div>
      </aside>

      <EditContactDialog contact={currentContact} open={editOpen} onOpenChange={setEditOpen} />
      {drawerRef && <RefDrawer refItem={drawerRef} onClose={() => setDrawerRef(null)} />}
    </>
  );
}

function QuickAction({
  icon: Icon,
  label,
  href,
  primary,
  disabled,
  disabledReason,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href?: string;
  primary?: boolean;
  disabled?: boolean;
  disabledReason?: string;
  onClick?: () => void;
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
   const control = href && !disabled ? (
    <a href={href} className={cls}>{inner}</a>
  ) : (
     <button onClick={onClick} disabled={disabled} className={`${cls} disabled:cursor-not-allowed disabled:opacity-45`}>{inner}</button>
  );
   if (!disabled || !disabledReason) return control;
   return <Tooltip><TooltipTrigger asChild><span className="block">{control}</span></TooltipTrigger><TooltipContent>{disabledReason}</TooltipContent></Tooltip>;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right truncate">{value}</span>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{children}</div>;
}

function PickerButton({ label, onClick }: { label: string; onClick: () => void }) {
  return <button onClick={onClick} className="block w-full rounded px-2.5 py-2 text-left text-sm hover:bg-surface-hover">{label}</button>;
}

function NextActionEditor({ note, date, onSave }: { note: string; date: string; onSave: (note: string, date: string) => void }) {
  const [draftNote, setDraftNote] = useState(note);
  const [draftDate, setDraftDate] = useState(date);
  return <div className="space-y-3"><div className="text-xs font-semibold">Next action</div><input autoFocus value={draftNote} onChange={(event) => setDraftNote(event.target.value)} placeholder="e.g. Call about quote" className="h-9 w-full rounded-md border-hairline bg-background px-2.5 text-sm focus:outline-none focus:border-primary/40" /><label className="flex items-center gap-2 text-xs text-muted-foreground"><CalendarDays className="h-3.5 w-3.5" /><input type="date" value={draftDate} onChange={(event) => setDraftDate(event.target.value)} className="h-8 flex-1 rounded-md border-hairline bg-background px-2 text-sm text-foreground" /></label><button onClick={() => onSave(draftNote.trim(), draftDate)} className="h-8 w-full rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground">Save next action</button></div>;
}

const KNOWN_ATTRIBUTION: Record<string, { source: string; medium: string; campaign?: string }> = {
  "google ads": { source: "google", medium: "cpc", campaign: "brand-uk" },
  "local service ads": { source: "google", medium: "lsa", campaign: "local-services" },
  "lsa": { source: "google", medium: "lsa", campaign: "local-services" },
  "facebook": { source: "facebook", medium: "social", campaign: "spring-offer" },
  "facebook ads": { source: "facebook", medium: "social", campaign: "spring-offer" },
  "instagram": { source: "instagram", medium: "social", campaign: "spring-offer" },
  "website form": { source: "direct", medium: "none" },
  "direct": { source: "direct", medium: "none" },
  "referral": { source: "referral", medium: "word-of-mouth" },
  "word of mouth": { source: "referral", medium: "word-of-mouth" },
  "google business": { source: "gbp", medium: "referral" },
  "newsletter": { source: "newsletter", medium: "email", campaign: "may-digest" },
  "email": { source: "newsletter", medium: "email" },
  "seo": { source: "google", medium: "organic" },
  "google organic": { source: "google", medium: "organic" },
};

/** Split "source / medium / campaign" style values, then fall back to the known-source map. */
function attributionDetails(raw: string): { source: string; medium: string; campaign?: string } {
  const clean = safeAttribution(raw);
  if (clean === "Direct / unknown") return { source: "direct", medium: "none" };
  const parts = clean.split("/").map((part) => part.trim()).filter(Boolean);
  if (parts.length >= 2) return { source: parts[0], medium: parts[1], campaign: parts[2] };
  const known = KNOWN_ATTRIBUTION[clean.toLowerCase()];
  if (known) return known;
  return { source: clean, medium: "—" };
}

function Attribution({ source, mode }: { source: string; mode: "manual" | "automatic" }) {
  const [groups] = useChannelGroups();
  const details = attributionDetails(source);
  const group = groupForSource(source, groups) ?? groupForSource(details.source, groups);
  return (
    <section className="rounded-md border-hairline bg-surface/50 p-3">
      <div className="mb-2 flex items-center justify-between">
        <SectionLabel>Traffic attribution</SectionLabel>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex cursor-help items-center gap-1 rounded border-hairline bg-background px-1.5 py-0.5 text-[9px] font-semibold text-muted-foreground">TAGGED <Info className="h-2.5 w-2.5" /></span>
          </TooltipTrigger>
          <TooltipContent>{mode === "manual" ? "Manually assigned by a team member" : "Automatically captured from the visitor’s journey"}</TooltipContent>
        </Tooltip>
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="text-[10px] uppercase tracking-wide font-medium text-muted-foreground">Channel group</span>
          {group ? (
            <span className="inline-flex items-center gap-1.5 font-medium">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: `hsl(${group.color})` }} />
              {group.name}
            </span>
          ) : (
            <span className="font-medium text-muted-foreground">Ungrouped</span>
          )}
        </div>
        <Row label="Source" value={details.source} />
        <Row label="Medium" value={details.medium} />
        <Row label="Campaign" value={details.campaign ?? "—"} />
      </div>
    </section>
  );
}

function safeAttribution(source: string): string {
  const value = source.trim();
  if (!value) return "Direct / unknown";
  const unsafe = /(^|\b)(localhost|127\.0\.0\.1|0\.0\.0\.0|::1)(\b|$)|-preview--|\.lovable\.app/i;
  return unsafe.test(value) ? "Direct / unknown" : value;
}

function smsHref(phone: string): string | undefined {
  const compact = phone.replace(/[\s()-]/g, "");
  if (!/^(?:\+44|0044|07)\d{9}$/.test(compact)) return undefined;
  return `sms:${compact}`;
}

function parseRecordedDate(value?: string): number | null {
  if (!value || value === "—") return null;
  const direct = Date.parse(value);
  if (!Number.isNaN(direct)) return direct;
  const withYear = Date.parse(`${value} ${new Date().getFullYear()}`);
  return Number.isNaN(withYear) ? null : withYear;
}

function latestActivity(contact: Contact, history: Job[], contactQuotes: { issueDate: string; selection?: { acceptedAt?: string } }[]): number | null {
  const candidates: number[] = [];
  const lastJob = parseRecordedDate(contact.lastJob);
  if (lastJob) candidates.push(lastJob);
  history.forEach((job) => job.timeline.forEach((entry) => {
    const at = parseRecordedDate(entry.date);
    if (at) candidates.push(at);
  }));
  contactQuotes.forEach((quote) => {
    const issued = parseRecordedDate(quote.issueDate);
    const accepted = parseRecordedDate(quote.selection?.acceptedAt);
    if (issued) candidates.push(issued);
    if (accepted) candidates.push(accepted);
  });
  return candidates.length ? Math.max(...candidates) : null;
}

function formatDateTime(at: number): string {
  return new Date(at).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function latestJobLabel(history: Job[]): string {
  if (!history.length) return "No jobs yet";
  const dated = history
    .map((job) => ({ job, at: Math.max(0, ...job.timeline.map((entry) => parseRecordedDate(entry.date) ?? 0)) }))
    .sort((a, b) => b.at - a.at);
  const latest = dated[0]?.job;
  return latest ? `${latest.service} · ${latest.stage}` : "No jobs yet";
}

function leadScoreFactors(contact: Contact, history: Job[], contactQuotes: { status: string }[]) {
  const factors: { label: string; points: number }[] = [];
  if (contactQuotes.length) factors.push({ label: "Submitted a quote", points: 15 });
  if (history.some((job) => ["Completed", "Invoiced", "Paid"].includes(job.stage))) factors.push({ label: "Previous completed job", points: 20 });
  if (contact.email) factors.push({ label: "Email address on file", points: 10 });
  if (contact.phone) factors.push({ label: "Phone number on file", points: 10 });
  if (contact.lifecycle === "Customer") factors.push({ label: "Existing customer", points: 15 });
  if (history.length > 1) factors.push({ label: "Repeat work", points: 15 });
  if (contact.totalSpend > 0) factors.push({ label: "Recorded customer spend", points: 15 });
  return factors;
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

type JobMeta = Job & { at: number; products: { name: string; qty: number; price: number }[] };

const PRODUCTS_BY_TRADE: Record<string, string[]> = {
  Plumbing: ["Boiler service", "Leak repair", "Tap replacement", "Pipework", "Radiator install"],
  Electrical: ["Consumer unit", "EICR test", "Socket install", "Lighting circuit", "EV charger"],
  "Window cleaning": ["Standard window clean", "Conservatory roof clean", "Gutter clear", "Fascia wash"],
  Landscaping: ["Lawn treatment", "Hedge trim", "Patio jet wash", "Bedding plant install"],
  General: ["Handyman hour", "Minor repair", "Materials"],
};

function deriveProducts(j: Job, rnd: () => number) {
  const pool = PRODUCTS_BY_TRADE[j.trade ?? "General"] ?? PRODUCTS_BY_TRADE.General;
  const count = 1 + Math.floor(rnd() * 2); // 1-2 items
  const picks: string[] = [];
  while (picks.length < count && picks.length < pool.length) {
    const name = pool[Math.floor(rnd() * pool.length)];
    if (!picks.includes(name)) picks.push(name);
  }
  // Distribute job value across picks
  const weights = picks.map(() => 1 + rnd());
  const total = weights.reduce((s, w) => s + w, 0);
  return picks.map((name, i) => {
    const share = Math.round((j.value * weights[i]) / total);
    const qty = 1 + Math.floor(rnd() * 2);
    return { name, qty, price: Math.max(1, Math.round(share / qty)) };
  });
}

function buildJobsMeta(contact: Contact, history: Job[]): JobMeta[] {
  const rnd = seeded(contact.id + ":jobs");
  const now = Date.now();
  const day = 86400000;
  return history.map((j, idx) => {
    const at = now - (idx + 1) * day * (3 + Math.floor(rnd() * 14));
    return { ...j, at, products: deriveProducts(j, rnd) };
  });
}

function computeLeadSince(contact: Contact, history: Job[]): number | null {
  const dates = history.flatMap((job) => job.timeline.map((entry) => parseRecordedDate(entry.date)).filter((at): at is number => at !== null));
  const lastJob = parseRecordedDate(contact.lastJob);
  if (lastJob) dates.push(lastJob);
  return dates.length ? Math.min(...dates) : null;
}

function summarizeProducts(jobsMeta: JobMeta[]) {
  const map = new Map<string, { name: string; qty: number; spend: number }>();
  jobsMeta.forEach((j) =>
    j.products.forEach((p) => {
      const cur = map.get(p.name) ?? { name: p.name, qty: 0, spend: 0 };
      cur.qty += p.qty;
      cur.spend += p.qty * p.price;
      map.set(p.name, cur);
    }),
  );
  return Array.from(map.values()).sort((a, b) => b.spend - a.spend);
}

function formatDate(at: number): string {
  return new Date(at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function JobCard({ job }: { job: JobMeta }) {
  const [open, setOpen] = useState(false);
  const done = job.stage === "Paid" || job.stage === "Completed" || job.stage === "Invoiced";
  return (
    <div className="border-hairline rounded-md">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 h-12 text-left hover:bg-surface-hover rounded-md transition-colors"
      >
        {open ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{job.service}</div>
          <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            <span>{formatDate(job.at)}</span>
            <span>·</span>
            <span className={done ? "text-[hsl(var(--success))]" : ""}>{job.stage}</span>
          </div>
        </div>
        <span className="text-sm font-medium tabular-nums">£{job.value.toLocaleString()}</span>
      </button>
      {open && (
        <div className="border-t-hairline px-3 py-2 space-y-1">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Line items</div>
          {job.products.map((p) => (
            <div key={p.name} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <Package className="w-3 h-3 text-muted-foreground shrink-0" />
                <span className="truncate">{p.name}</span>
                <span className="text-muted-foreground shrink-0">× {p.qty}</span>
              </div>
              <span className="tabular-nums">£{(p.price * p.qty).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function buildTimeline(contact: Contact, jobsMeta: JobMeta[]): TimelineEvent[] {
  const events: Omit<TimelineEvent, "when">[] = [];
  const now = Date.now();
  const day = 86400000;
  const rnd = seeded(contact.id);

  // Jobs
  jobsMeta.forEach((j) => {
    const done = j.stage === "Paid" || j.stage === "Completed" || j.stage === "Invoiced";
    events.push({
      title: `${j.stage}: ${j.service}`,
      detail: `£${j.value.toLocaleString()}${j.address ? ` • ${j.address}` : ""}`,
      icon: done ? CheckCircle2 : FileText,
      bg: done ? "bg-[hsl(var(--success)/0.15)]" : "bg-primary/10",
      fg: done ? "text-[hsl(var(--success))]" : "text-primary",
      category: "Jobs",
      at: j.at,
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
