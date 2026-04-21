import { useState } from "react";
import { PageHeader, PageBody, Btn, Pill } from "@/components/layout/PageShell";
import { adsCampaigns as initialCampaigns } from "@/data/mockData";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type Campaign = typeof initialCampaigns[number];

export default function Ads() {
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns);
  const [open, setOpen] = useState(false);
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
              {lsa.map((c) => <CampaignCard key={c.id} c={c} />)}
            </div>
          ) : (
            <EmptyState label="No LSA campaigns yet" />
          )}
        </Section>

        <Section title="Performance Max">
          {pmax.length ? (
            <div className="grid grid-cols-2 gap-3">
              {pmax.map((c) => <CampaignCard key={c.id} c={c} />)}
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

function CampaignCard({ c }: { c: Campaign }) {
  return (
    <div className="border-hairline rounded-lg bg-card p-4">
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
    </div>
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
