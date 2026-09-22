import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Briefcase, UserPlus, Trash2, Phone, Mail, MapPin, Inbox } from "lucide-react";
import { useLsaLeads, removeLsaLead, type LsaLead } from "@/lib/lsaLeadsStore";
import { createContact } from "@/lib/contactsStore";
import { addJob } from "@/lib/jobsStore";
import { firstStageOf, getPipelines } from "@/lib/stagesStore";
import { toast } from "@/hooks/use-toast";
import type { Job } from "@/data/mockData";

const niceDate = () =>
  new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short" });

export function LsaLeadsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const leads = useLsaLeads();
  const [busy, setBusy] = useState<string | null>(null);

  function makeContact(lead: LsaLead) {
    return createContact({
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      postcode: lead.postcode,
      source: "Google Ads (LSA)",
      lifecycle: "Lead",
      notes: lead.note ? `LSA lead: ${lead.note}` : `Lead from ${lead.campaign}.`,
    });
  }

  function createContactAndJob(lead: LsaLead) {
    setBusy(lead.id);
    const contactId = makeContact(lead);
    const board = getPipelines()[0];
    const job: Job = {
      id: `j-lsa-${lead.id}-${Date.now()}`,
      contactId,
      customer: lead.name,
      service: lead.service,
      value: 0,
      stage: firstStageOf(board?.id ?? "sales") as Job["stage"],
      pipelineId: board?.id ?? "sales",
      daysInStage: 0,
      address: lead.postcode,
      postcode: lead.postcode,
      notes: lead.note ?? `Came in through ${lead.campaign}.`,
      quoteValue: 0,
      assignments: [],
      timeline: [{ type: "note", text: `Lead from Local Services Ads`, date: niceDate() }],
    };
    addJob(job);
    removeLsaLead(lead.id);
    setBusy(null);
    toast({ title: "Contact and job created", description: `${lead.name} is now on your ${board?.name ?? "first"} board.` });
  }

  function createContactOnly(lead: LsaLead) {
    setBusy(lead.id);
    makeContact(lead);
    removeLsaLead(lead.id);
    setBusy(null);
    toast({ title: "Contact created", description: `${lead.name} was added to your contacts.` });
  }

  function discard(lead: LsaLead) {
    removeLsaLead(lead.id);
    toast({ title: "Lead deleted", description: `${lead.name} was removed from the LSA inbox.` });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0">
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle>Local Services Ads leads</DialogTitle>
          <DialogDescription>
            Decide what to do with each lead — start the work, just keep the details, or throw it away.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto border-t-hairline">
          {leads.length === 0 ? (
            <div className="py-14 flex flex-col items-center text-center px-6">
              <div className="w-11 h-11 rounded-full bg-surface flex items-center justify-center mb-3">
                <Inbox className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="font-medium">Nothing left to sort</div>
              <p className="text-sm text-muted-foreground mt-1">
                New Local Services Ads leads will show up here.
              </p>
            </div>
          ) : (
            leads.map((lead) => (
              <div key={lead.id} className="px-5 py-4 border-b-hairline last:border-b-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{lead.name}</div>
                    <div className="text-sm text-muted-foreground">{lead.service}</div>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{lead.received}</span>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Phone className="w-3 h-3" /> {lead.phone}</span>
                  <span className="inline-flex items-center gap-1"><Mail className="w-3 h-3" /> {lead.email}</span>
                  <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" /> {lead.postcode}</span>
                </div>
                {lead.note && <p className="text-xs text-muted-foreground mt-2 italic">“{lead.note}”</p>}

                <div className="flex flex-wrap gap-2 mt-3">
                  <button
                    disabled={busy === lead.id}
                    onClick={() => createContactAndJob(lead)}
                    className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium inline-flex items-center gap-1.5 hover:opacity-90 disabled:opacity-50"
                  >
                    <Briefcase className="w-3.5 h-3.5" /> Create contact &amp; job
                  </button>
                  <button
                    disabled={busy === lead.id}
                    onClick={() => createContactOnly(lead)}
                    className="h-8 px-3 rounded-md border-hairline bg-background text-sm inline-flex items-center gap-1.5 hover:bg-surface-hover disabled:opacity-50"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> Create contact
                  </button>
                  <button
                    disabled={busy === lead.id}
                    onClick={() => discard(lead)}
                    className="h-8 px-3 rounded-md border-hairline bg-background text-sm inline-flex items-center gap-1.5 text-[hsl(var(--destructive))] hover:bg-surface-hover disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
