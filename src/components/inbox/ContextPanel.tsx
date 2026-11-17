import { Button } from "@/components/ui/button";
import { MapPin, Phone, Mail, UserPlus, CalendarPlus, Briefcase } from "lucide-react";
import type { ConvStatus, InboxContact } from "@/lib/inboxMock";

const gbp = (n: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(n);
const statusLabel: Record<ConvStatus, string> = { open: "New enquiry", replied: "Replied", lead: "Lead", booked: "Survey booked", done: "Done" };

export function ContextPanel({ contact, status, onAction }: { contact: InboxContact; status: ConvStatus; onAction: (a: "lead" | "survey" | "job") => void }) {
  const s = contact.source;
  const rows: [string, string][] = [["Channel", s.channel], ["Campaign", s.campaign], ["Ad / keyword", s.adOrKeyword], ["Landing page", s.landingPage], ["First seen", new Date(s.firstSeen).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })]];
  return <div className="space-y-4 p-4">
    <div>
      <div className="text-lg font-semibold">{contact.name}</div>
      <div className="text-xs text-muted-foreground">{statusLabel[status]} · est. {gbp(contact.estValue)}</div>
    </div>
    <div className="space-y-2 text-sm">
      <a href={`tel:${contact.phone}`} className="flex items-center gap-2 hover:underline"><Phone className="h-4 w-4 text-muted-foreground" />{contact.phone}</a>
      <a href={`mailto:${contact.email}`} className="flex items-center gap-2 truncate hover:underline"><Mail className="h-4 w-4 text-muted-foreground" />{contact.email}</a>
      <div className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" /><span>{contact.address}<br /><span className="font-medium">{contact.postcode}</span></span></div>
    </div>
    <div className="rounded-lg border">
      <div className="border-b px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Source</div>
      <dl className="space-y-1.5 p-3 text-sm">
        {rows.map(([k, v]) => <div key={k} className="flex gap-2"><dt className="w-24 shrink-0 text-muted-foreground">{k}</dt><dd className="min-w-0 break-words">{v}</dd></div>)}
      </dl>
    </div>
    <div className="space-y-2">
      <Button className="w-full" onClick={() => onAction("lead")} disabled={status === "lead"}><UserPlus className="mr-1.5 h-4 w-4" />{status === "lead" ? "Lead created" : "Convert to lead"}</Button>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" onClick={() => onAction("survey")}><CalendarPlus className="mr-1.5 h-4 w-4" />Book survey</Button>
        <Button variant="outline" onClick={() => onAction("job")}><Briefcase className="mr-1.5 h-4 w-4" />Create job</Button>
      </div>
    </div>
  </div>;
}
