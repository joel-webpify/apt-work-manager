import { useState } from "react";
import { PageHeader, PageBody, Btn, Pill } from "@/components/layout/PageShell";
import {
  adsCampaigns as initialCampaigns,
  jobs,
  contacts,
  type AdsCampaign,
  type PMaxSettings,
  type LSASettings,
  type BiddingStrategy,
} from "@/data/mockData";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { X } from "lucide-react";

const sourceMatchers: Record<AdsCampaign["type"], string[]> = {
  LSA: ["Local Service Ads", "Google LSA"],
  PMax: ["Google Ads", "Performance Max"],
};

function getAttributedJobs(campaign: AdsCampaign) {
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

function defaultPMax(weeklySpend: number): PMaxSettings {
  return {
    dailyBudget: Math.max(1, Math.round(weeklySpend / 7)),
    bidding: "Maximize conversions",
    conversionGoals: ["Quote request"],
    locations: [],
    languages: ["English"],
    startDate: new Date().toISOString().slice(0, 10),
    finalUrl: "",
    finalUrlExpansion: true,
    adSchedule: "All days, all hours",
    audienceSignals: [],
    searchThemes: [],
    assetGroupsCount: 1,
    brandExclusions: [],
  };
}

function defaultLSA(weeklySpend: number): LSASettings {
  return {
    weeklyBudget: weeklySpend,
    serviceAreas: [],
    servicesOffered: [],
    businessHours: "Mon–Fri, 9:00–17:00",
    leadTypes: ["Phone call", "Message"],
    bidMode: "Maximize leads",
  };
}

export default function Ads() {
  const [campaigns, setCampaigns] = useState<AdsCampaign[]>(initialCampaigns);
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    type: "LSA" as "LSA" | "PMax",
    weeklySpend: "",
  });

  const selected = campaigns.find((c) => c.id === selectedId) ?? null;
  const lsa = campaigns.filter((c) => c.type === "LSA");
  const pmax = campaigns.filter((c) => c.type === "PMax");

  const resetForm = () => setForm({ name: "", type: "LSA", weeklySpend: "" });

  const handleCreate = () => {
    if (!form.name.trim() || !form.weeklySpend) {
      toast.error("Please fill in name and weekly spend");
      return;
    }
    const spend = Number(form.weeklySpend);
    const newCampaign: AdsCampaign = {
      id: `ad${Date.now()}`,
      name: form.name.trim(),
      type: form.type,
      status: "Active",
      weeklySpend: spend,
      leads: 0,
      costPerLead: 0,
      jobsAttributed: 0,
      ...(form.type === "PMax"
        ? { pmax: defaultPMax(spend) }
        : { lsa: defaultLSA(spend) }),
    };
    setCampaigns((prev) => [...prev, newCampaign]);
    toast.success("Campaign created");
    setOpen(false);
    resetForm();
  };

  const updateCampaign = (id: string, patch: Partial<AdsCampaign>) => {
    setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
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
              {lsa.map((c) => <CampaignCard key={c.id} c={c} onClick={() => setSelectedId(c.id)} />)}
            </div>
          ) : (
            <EmptyState label="No LSA campaigns yet" />
          )}
        </Section>

        <Section title="Performance Max">
          {pmax.length ? (
            <div className="grid grid-cols-2 gap-3">
              {pmax.map((c) => <CampaignCard key={c.id} c={c} onClick={() => setSelectedId(c.id)} />)}
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

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelectedId(null)}>
        <SheetContent className="p-0 w-full sm:max-w-2xl flex flex-col">
          {selected && (
            <CampaignDrawer
              campaign={selected}
              onClose={() => setSelectedId(null)}
              onUpdate={(patch) => updateCampaign(selected.id, patch)}
            />
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

function CampaignDrawer({
  campaign,
  onClose,
  onUpdate,
}: {
  campaign: AdsCampaign;
  onClose: () => void;
  onUpdate: (patch: Partial<AdsCampaign>) => void;
}) {
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

      <Tabs defaultValue="overview" className="flex-1 flex flex-col overflow-hidden">
        <div className="px-6 pt-3 border-b-hairline">
          <TabsList className="bg-transparent p-0 h-auto gap-1">
            <TabsTrigger value="overview" className="data-[state=active]:bg-surface px-3 h-8">Overview</TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-surface px-3 h-8">Settings</TabsTrigger>
            <TabsTrigger value="jobs" className="data-[state=active]:bg-surface px-3 h-8">Attributed jobs</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="flex-1 overflow-auto m-0 p-6 space-y-5">
          <div className="grid grid-cols-4 gap-4 pb-5 border-b-hairline">
            <Stat label="Weekly spend" value={`£${campaign.weeklySpend}`} />
            <Stat label="Leads" value={campaign.leads.toString()} />
            <Stat label="Cost per lead" value={`£${campaign.costPerLead}`} />
            <Stat label="Jobs attributed" value={campaign.jobsAttributed.toString()} />
          </div>
          <div className="text-sm text-muted-foreground">
            {attributed.length} CRM jobs attributed · £{totalValue.toLocaleString()} total job value
          </div>
        </TabsContent>

        <TabsContent value="settings" className="flex-1 overflow-auto m-0 p-6">
          {campaign.type === "PMax" ? (
            <PMaxSettingsForm campaign={campaign} onUpdate={onUpdate} />
          ) : (
            <LSASettingsForm campaign={campaign} onUpdate={onUpdate} />
          )}
        </TabsContent>

        <TabsContent value="jobs" className="flex-1 overflow-auto m-0 p-6">
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
                        <Pill tone={job.stage === "Paid" || job.stage === "Completed" ? "success" : "info"}>
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
        </TabsContent>
      </Tabs>
    </>
  );
}

/* -------------------- PMax Settings -------------------- */

function PMaxSettingsForm({
  campaign,
  onUpdate,
}: {
  campaign: AdsCampaign;
  onUpdate: (patch: Partial<AdsCampaign>) => void;
}) {
  const initial = campaign.pmax ?? defaultPMax(campaign.weeklySpend);
  const [name, setName] = useState(campaign.name);
  const [status, setStatus] = useState<AdsCampaign["status"]>(campaign.status);
  const [s, setS] = useState<PMaxSettings>(initial);

  const update = <K extends keyof PMaxSettings>(key: K, value: PMaxSettings[K]) =>
    setS((prev) => ({ ...prev, [key]: value }));

  const save = () => {
    onUpdate({ name: name.trim() || campaign.name, status, pmax: s, weeklySpend: s.dailyBudget * 7 });
    toast.success("Settings saved");
  };

  const showCpa = s.bidding === "Maximize conversions" || s.bidding === "Target CPA";
  const showRoas = s.bidding === "Maximize conversion value" || s.bidding === "Target ROAS";

  return (
    <div className="space-y-6">
      <SettingsGroup title="Campaign">
        <Field label="Name">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Status">
          <Select value={status} onValueChange={(v: AdsCampaign["status"]) => setStatus(v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Paused">Paused</SelectItem>
              <SelectItem value="Removed">Removed</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </SettingsGroup>

      <SettingsGroup title="Budget & bidding">
        <Field label="Daily budget (£)">
          <Input
            type="number"
            min="1"
            value={s.dailyBudget}
            onChange={(e) => update("dailyBudget", Number(e.target.value))}
          />
        </Field>
        <Field label="Bidding strategy">
          <Select value={s.bidding} onValueChange={(v: BiddingStrategy) => update("bidding", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Maximize conversions">Maximize conversions</SelectItem>
              <SelectItem value="Maximize conversion value">Maximize conversion value</SelectItem>
              <SelectItem value="Target CPA">Target CPA</SelectItem>
              <SelectItem value="Target ROAS">Target ROAS</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        {showCpa && (
          <Field label="Target CPA (£) — optional">
            <Input
              type="number"
              min="0"
              value={s.targetCpa ?? ""}
              onChange={(e) => update("targetCpa", e.target.value ? Number(e.target.value) : undefined)}
            />
          </Field>
        )}
        {showRoas && (
          <Field label="Target ROAS (%)">
            <Input
              type="number"
              min="0"
              value={s.targetRoas ?? ""}
              onChange={(e) => update("targetRoas", e.target.value ? Number(e.target.value) : undefined)}
            />
          </Field>
        )}
      </SettingsGroup>

      <SettingsGroup title="Conversion goals">
        <Field label="Goals (comma separated)" full>
          <Input
            value={s.conversionGoals.join(", ")}
            onChange={(e) => update("conversionGoals", splitCsv(e.target.value))}
            placeholder="Quote request, Phone call, Form submission"
          />
        </Field>
      </SettingsGroup>

      <SettingsGroup title="Locations & languages">
        <Field label="Locations (comma separated)" full>
          <Input
            value={s.locations.join(", ")}
            onChange={(e) => update("locations", splitCsv(e.target.value))}
            placeholder="Bristol BS postcodes, Bath BA postcodes"
          />
        </Field>
        <Field label="Languages (comma separated)" full>
          <Input
            value={s.languages.join(", ")}
            onChange={(e) => update("languages", splitCsv(e.target.value))}
            placeholder="English"
          />
        </Field>
      </SettingsGroup>

      <SettingsGroup title="Schedule">
        <Field label="Start date">
          <Input
            type="date"
            value={s.startDate}
            onChange={(e) => update("startDate", e.target.value)}
          />
        </Field>
        <Field label="End date — optional">
          <Input
            type="date"
            value={s.endDate ?? ""}
            onChange={(e) => update("endDate", e.target.value || undefined)}
          />
        </Field>
        <Field label="Ad schedule" full>
          <Input
            value={s.adSchedule}
            onChange={(e) => update("adSchedule", e.target.value)}
            placeholder="Mon–Fri 08:00–18:00"
          />
        </Field>
      </SettingsGroup>

      <SettingsGroup title="URLs">
        <Field label="Final URL" full>
          <Input
            value={s.finalUrl}
            onChange={(e) => update("finalUrl", e.target.value)}
            placeholder="https://example.co.uk/landing"
          />
        </Field>
        <div className="col-span-2 flex items-center justify-between border-hairline rounded-md px-3 h-10">
          <div>
            <div className="text-sm font-medium">Final URL expansion</div>
            <div className="text-xs text-muted-foreground">Let Google match queries to relevant URLs on your site</div>
          </div>
          <Switch checked={s.finalUrlExpansion} onCheckedChange={(v) => update("finalUrlExpansion", v)} />
        </div>
      </SettingsGroup>

      <SettingsGroup title="Audience signals">
        <Field label="Audience signals (comma separated)" full>
          <Input
            value={s.audienceSignals.join(", ")}
            onChange={(e) => update("audienceSignals", splitCsv(e.target.value))}
            placeholder="Past customers, Homeowners 35–65"
          />
        </Field>
        <Field label="Search themes (comma separated)" full>
          <Input
            value={s.searchThemes.join(", ")}
            onChange={(e) => update("searchThemes", splitCsv(e.target.value))}
            placeholder="window cleaning near me"
          />
        </Field>
      </SettingsGroup>

      <SettingsGroup title="Asset groups & exclusions">
        <Field label="Number of asset groups">
          <Input
            type="number"
            min="1"
            value={s.assetGroupsCount}
            onChange={(e) => update("assetGroupsCount", Number(e.target.value))}
          />
        </Field>
        <Field label="Brand exclusions (comma separated)" full>
          <Input
            value={s.brandExclusions.join(", ")}
            onChange={(e) => update("brandExclusions", splitCsv(e.target.value))}
            placeholder="Competitor A, Competitor B"
          />
        </Field>
      </SettingsGroup>

      <div className="flex justify-end gap-2 pt-2">
        <Btn variant="primary" onClick={save}>Save changes</Btn>
      </div>
    </div>
  );
}

/* -------------------- LSA Settings -------------------- */

function LSASettingsForm({
  campaign,
  onUpdate,
}: {
  campaign: AdsCampaign;
  onUpdate: (patch: Partial<AdsCampaign>) => void;
}) {
  const initial = campaign.lsa ?? defaultLSA(campaign.weeklySpend);
  const [name, setName] = useState(campaign.name);
  const [status, setStatus] = useState<AdsCampaign["status"]>(campaign.status);
  const [s, setS] = useState<LSASettings>(initial);

  const update = <K extends keyof LSASettings>(key: K, value: LSASettings[K]) =>
    setS((prev) => ({ ...prev, [key]: value }));

  const save = () => {
    onUpdate({ name: name.trim() || campaign.name, status, lsa: s, weeklySpend: s.weeklyBudget });
    toast.success("Settings saved");
  };

  return (
    <div className="space-y-6">
      <SettingsGroup title="Campaign">
        <Field label="Name">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Status">
          <Select value={status} onValueChange={(v: AdsCampaign["status"]) => setStatus(v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Paused">Paused</SelectItem>
              <SelectItem value="Removed">Removed</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </SettingsGroup>

      <SettingsGroup title="Budget & bidding">
        <Field label="Weekly budget (£)">
          <Input
            type="number"
            min="1"
            value={s.weeklyBudget}
            onChange={(e) => update("weeklyBudget", Number(e.target.value))}
          />
        </Field>
        <Field label="Bid mode">
          <Select value={s.bidMode} onValueChange={(v: LSASettings["bidMode"]) => update("bidMode", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Maximize leads">Maximize leads</SelectItem>
              <SelectItem value="Set max per lead">Set max per lead</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        {s.bidMode === "Set max per lead" && (
          <Field label="Max per lead (£)">
            <Input
              type="number"
              min="0"
              value={s.maxPerLead ?? ""}
              onChange={(e) => update("maxPerLead", e.target.value ? Number(e.target.value) : undefined)}
            />
          </Field>
        )}
      </SettingsGroup>

      <SettingsGroup title="Service & area">
        <Field label="Service areas (comma separated)" full>
          <Input
            value={s.serviceAreas.join(", ")}
            onChange={(e) => update("serviceAreas", splitCsv(e.target.value))}
            placeholder="Bristol, Bath, Weston-super-Mare"
          />
        </Field>
        <Field label="Services offered (comma separated)" full>
          <Input
            value={s.servicesOffered.join(", ")}
            onChange={(e) => update("servicesOffered", splitCsv(e.target.value))}
            placeholder="Emergency plumbing, Leak repair"
          />
        </Field>
        <Field label="Business hours" full>
          <Input
            value={s.businessHours}
            onChange={(e) => update("businessHours", e.target.value)}
            placeholder="Mon–Sat, 7:00–19:00"
          />
        </Field>
      </SettingsGroup>

      <SettingsGroup title="Lead types">
        <div className="col-span-2 flex items-center justify-between border-hairline rounded-md px-3 h-10">
          <span className="text-sm">Phone call leads</span>
          <Switch
            checked={s.leadTypes.includes("Phone call")}
            onCheckedChange={(v) => update("leadTypes", toggle(s.leadTypes, "Phone call", v))}
          />
        </div>
        <div className="col-span-2 flex items-center justify-between border-hairline rounded-md px-3 h-10">
          <span className="text-sm">Message leads</span>
          <Switch
            checked={s.leadTypes.includes("Message")}
            onCheckedChange={(v) => update("leadTypes", toggle(s.leadTypes, "Message", v))}
          />
        </div>
      </SettingsGroup>

      <div className="flex justify-end gap-2 pt-2">
        <Btn variant="primary" onClick={save}>Save changes</Btn>
      </div>
    </div>
  );
}

/* -------------------- Helpers -------------------- */

function splitCsv(v: string): string[] {
  return v
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

function toggle<T>(arr: T[], value: T, on: boolean): T[] {
  const without = arr.filter((x) => x !== value);
  return on ? [...without, value] : without;
}

function SettingsGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">{title}</h4>
      <div className="grid grid-cols-2 gap-3">{children}</div>
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={`space-y-1.5 ${full ? "col-span-2" : ""}`}>
      <Label className="text-xs text-muted-foreground font-normal">{label}</Label>
      {children}
    </div>
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

function CampaignCard({ c, onClick }: { c: AdsCampaign; onClick: () => void }) {
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
        <Pill tone={c.status === "Active" ? "success" : c.status === "Paused" ? "warning" : "neutral"}>{c.status}</Pill>
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
