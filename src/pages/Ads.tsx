import { useState } from "react";
import { PageHeader, PageBody, Btn, Pill } from "@/components/layout/PageShell";
import { adsCampaigns as initialCampaigns, jobs, contacts } from "@/data/mockData";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { X } from "lucide-react";

type Campaign = typeof initialCampaigns[number];

// Map a campaign type to the contact lead-source labels that count as attributed
const sourceMatchers: Record<Campaign["type"], string[]> = {
  LSA: ["Local Service Ads", "Google LSA"],
  PMax: ["Google Ads", "Performance Max"],
};

function getAttributedJobs(campaign: Campaign) {
  const matchers = sourceMatchers[campaign.type];
  const matchingContactIds = new Set(
    contacts.filter((c) => matchers.includes(c.source)).map((c) => c.id)
  );
  return jobs
    .filter((j) => matchingContactIds.has(j.contactId))
    .map((j) => {
      const contact = contacts.find((c) => c.id === j.contactId);
      return { job: j, source: contact?.source ?? "—" };
    });
}

export default function Ads() {
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Campaign | null>(null);
  const [form, setForm] = useState({
    name: "",
    type: "LSA" as "LSA" | "PMax",
    weeklySpend: "",
  });

  const lsa = campaigns.filter((c) => c.type === "LSA");
  const pmax = campaigns.filter((c) => c.type === "PMax");

  const resetForm = () => setForm({ name: "", type: "LSA", weeklySpend: "" });

  const handleCreate = () => {
    if (!form.name.trim() || !form.weeklySpend) {
      toast.error("Please fill in name and weekly spend");
      return;
    }
    const newCampaign: Campaign = {
      id: `ad${Date.now()}`,
      name: form.name.trim(),
      type: form.type,
      status: "Active",
      weeklySpend: Number(form.weeklySpend),
      leads: 0,
      costPerLead: 0,
      jobsAttributed: 0,
    };
    setCampaigns((prev) => [...prev, newCampaign]);
    toast.success("Campaign created");
    setOpen(false);
    resetForm();
  };

  return (
    <>
      <PageHeader
        title="Google Ads"
        description="Track LSA and Performance Max campaigns alongside your CRM jobs"
        actions={<Btn variant="primary" onClick={() => setOpen(true)}>New campaign</Btn>}
      />
      <PageBody>
        <div className="border-hairline rounded-lg bg-card p-4 mb-6 flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">Connected to Google Ads</div>
            <div className="text-xs text-muted-foreground mt-0.5">Last synced 4 minutes ago · Account 845-921-6630</div>
          </div>
          <Btn>Manage connection</Btn>
        </div>

        <Section title="Local Service Ads">
          {lsa.length ? (
            <div className="grid grid-cols-2 gap-3">
              {lsa.map((c) => <CampaignCard key={c.id} c={c} onClick={() => setSelected(c)} />)}
            </div>
          ) : (
            <EmptyState label="No LSA campaigns yet" />
          )}
        </Section>

        <Section title="Performance Max">
          {pmax.length ? (
            <div className="grid grid-cols-2 gap-3">
              {pmax.map((c) => <CampaignCard key={c.id} c={c} onClick={() => setSelected(c)} />)}
            </div>
          ) : (
            <EmptyState label="No PMax campaigns yet" />
          )}
        </Section>

        <div className="mt-6 border-hairline rounded-lg bg-card">
          <div className="px-4 h-11 flex items-center border-b-hairline">
            <span className="text-sm font-medium">Conversions linked to CRM</span>
          </div>
          <div className="grid grid-cols-4 gap-0">
            {[
              { label: "Ad clicks", value: "412" },
              { label: "Quote requests", value: "30" },
              { label: "Quotes sent", value: "24" },
              { label: "Jobs booked", value: "12" },
            ].map((s, i) => (
              <div key={s.label} className={`p-4 ${i < 3 ? "border-r-hairline" : ""}`}>
                <div className="text-xs text-muted-foreground">{s.label}</div>
                <div className="text-2xl font-medium mt-1.5 tabular-nums tracking-tight">{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </PageBody>

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-medium">New campaign</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs text-muted-foreground font-normal">Campaign name</Label>
              <Input
                id="name"
                placeholder="e.g. Bristol electricians — LSA"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground font-normal">Campaign type</Label>
              <Select value={form.type} onValueChange={(v: "LSA" | "PMax") => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="LSA">Local Service Ads</SelectItem>
                  <SelectItem value="PMax">Performance Max</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="spend" className="text-xs text-muted-foreground font-normal">Weekly spend (£)</Label>
              <Input
                id="spend"
                type="number"
                min="0"
                placeholder="250"
                value={form.weeklySpend}
                onChange={(e) => setForm({ ...form, weeklySpend: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Btn onClick={() => setOpen(false)}>Cancel</Btn>
            <Btn variant="primary" onClick={handleCreate}>Create campaign</Btn>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="p-0 w-full sm:max-w-xl flex flex-col">
          {selected && <CampaignDrawer campaign={selected} onClose={() => setSelected(null)} />}
        </SheetContent>
      </Sheet>
    </>
  );
}

function CampaignDrawer({ campaign, onClose }: { campaign: Campaign; onClose: () => void }) {
  const attributed = getAttributedJobs(campaign);
  const totalValue = attributed.reduce((sum, a) => sum + a.job.value, 0);

  return (
    <>
      <div className="px-6 h-16 border-b-hairline flex items-center justify-between shrink-0">
        <div>
          <div className="text-base font-medium">{campaign.name}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{campaign.type} · {campaign.status}</div>
        </div>
        <button
          onClick={onClose}
          className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-surface-hover text-muted-foreground"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="px-6 py-5 border-b-hairline grid grid-cols-4 gap-4">
          <Stat label="Weekly spend" value={`£${campaign.weeklySpend}`} />
          <Stat label="Leads" value={campaign.leads.toString()} />
          <Stat label="Cost per lead" value={`£${campaign.costPerLead}`} />
          <Stat label="Jobs attributed" value={campaign.jobsAttributed.toString()} />
        </div>

        <div className="px-6 py-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium">View attributed jobs</h3>
            <span className="text-xs text-muted-foreground tabular-nums">
              {attributed.length} {attributed.length === 1 ? "job" : "jobs"} · £{totalValue.toLocaleString()}
            </span>
          </div>

          {attributed.length ? (
            <div className="border-hairline rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface text-xs text-muted-foreground">
                    <th className="text-left font-normal px-3 h-9">Customer</th>
                    <th className="text-left font-normal px-3 h-9">Service</th>
                    <th className="text-left font-normal px-3 h-9">Stage</th>
                    <th className="text-left font-normal px-3 h-9">Source</th>
                    <th className="text-right font-normal px-3 h-9">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {attributed.map(({ job, source }) => (
                    <tr key={job.id} className="border-t-hairline hover:bg-surface-hover">
                      <td className="px-3 h-10 font-medium">{job.customer}</td>
                      <td className="px-3 h-10 text-muted-foreground">{job.service}</td>
                      <td className="px-3 h-10">
                        <Pill tone={job.stage === "Paid" ? "success" : job.stage === "Completed" ? "success" : "info"}>
                          {job.stage}
                        </Pill>
                      </td>
                      <td className="px-3 h-10 text-muted-foreground text-xs">{source}</td>
                      <td className="px-3 h-10 text-right tabular-nums">£{job.value.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="border-hairline rounded-lg bg-card p-6 text-sm text-muted-foreground text-center">
              No jobs attributed to this campaign yet
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-medium mb-2">{title}</h3>
      {children}
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="border-hairline rounded-lg bg-card p-6 text-sm text-muted-foreground text-center">
      {label}
    </div>
  );
}

function CampaignCard({ c, onClick }: { c: Campaign; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="border-hairline rounded-lg bg-card p-4 text-left hover:bg-surface-hover transition-colors"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-sm font-medium">{c.name}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{c.type}</div>
        </div>
        <Pill tone="success">{c.status}</Pill>
      </div>
      <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 mt-3 pt-3 border-t-hairline text-sm">
        <Stat label="Weekly spend" value={`£${c.weeklySpend}`} />
        <Stat label="Leads" value={c.leads.toString()} />
        <Stat label="Cost per lead" value={`£${c.costPerLead}`} />
        <Stat label="Jobs attributed" value={c.jobsAttributed.toString()} />
      </div>
    </button>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-base font-medium tabular-nums mt-0.5">{value}</div>
    </div>
  );
}
