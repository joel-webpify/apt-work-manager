import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";
import { MapPin, Phone, Mail, UserPlus, CalendarPlus, Briefcase, Megaphone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials } from "./ConversationList";
import type { ConvStatus, InboxContact } from "@/lib/inboxMock";

const gbp = (n: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(n);
const statusLabel: Record<ConvStatus, string> = { open: "New enquiry", replied: "Replied", lead: "Lead", booked: "Survey booked", done: "Done" };

export function ContextPanel({ contact, status, sourceChannel, onAction }: { contact: InboxContact; status: ConvStatus; sourceChannel?: ReactNode; onAction: (a: "lead" | "survey" | "job") => void }) {
  const s = contact.source;
  const rows: [string, string][] = [["Campaign", s.campaign], ["Ad / keyword", s.adOrKeyword], ["Landing page", s.landingPage], ["First seen", new Date(s.firstSeen).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })]];
  return <div className="space-y-4">
    <Card><CardContent className="space-y-3 pt-6">
      <div className="flex items-center gap-3">
        <Avatar className="h-12 w-12"><AvatarFallback>{initials(contact.name)}</AvatarFallback></Avatar>
        <div className="min-w-0"><p className="truncate font-semibold">{contact.name}</p><p className="text-sm text-muted-foreground">{statusLabel[status]} · est. {gbp(contact.estValue)}</p></div>
      </div>
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between gap-2"><dt className="flex items-center gap-1.5 text-muted-foreground"><Phone className="h-3.5 w-3.5" />Phone</dt><dd><a href={`tel:${contact.phone.replace(/\s/g, "")}`} className="underline-offset-2 hover:underline">{contact.phone}</a></dd></div>
        <div className="flex justify-between gap-2"><dt className="flex shrink-0 items-center gap-1.5 text-muted-foreground"><Mail className="h-3.5 w-3.5" />Email</dt><dd className="min-w-0 truncate"><a href={`mailto:${contact.email}`} className="underline-offset-2 hover:underline">{contact.email}</a></dd></div>
      </dl>
      <div className="flex gap-2 rounded-lg bg-muted p-3 text-sm"><MapPin className="h-4 w-4 shrink-0" /><div>{contact.address}<br /><span className="font-medium">{contact.postcode}</span></div></div>
    </CardContent></Card>
    <Card>
      <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><Megaphone className="h-4 w-4" />Source</CardTitle></CardHeader>
      <CardContent><dl className="space-y-2 text-sm">
        <div className="flex items-center justify-between gap-2"><dt className="text-muted-foreground">Channel</dt><dd>{sourceChannel ?? s.channel}</dd></div>
        {rows.map(([k, v]) => <div key={k} className="flex justify-between gap-3"><dt className="shrink-0 text-muted-foreground">{k}</dt><dd className="min-w-0 break-words text-right">{v}</dd></div>)}
      </dl></CardContent>
    </Card>
    <div className="space-y-2">
      <Button className="w-full" onClick={() => onAction("lead")} disabled={status === "lead"}><UserPlus className="mr-1.5 h-4 w-4" />{status === "lead" ? "Lead created" : "Convert to lead"}</Button>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" onClick={() => onAction("survey")}><CalendarPlus className="mr-1.5 h-4 w-4" />Book survey</Button>
        <Button variant="outline" onClick={() => onAction("job")}><Briefcase className="mr-1.5 h-4 w-4" />Create job</Button>
      </div>
    </div>
  </div>;
}
