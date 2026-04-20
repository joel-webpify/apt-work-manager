import { PageHeader, PageBody, Btn, Pill } from "@/components/layout/PageShell";
import { adsCampaigns } from "@/data/mockData";

export default function Ads() {
  const lsa = adsCampaigns.filter((c) => c.type === "LSA");
  const pmax = adsCampaigns.filter((c) => c.type === "PMax");

  return (
    <>
      <PageHeader
        title="Google Ads"
        description="Track LSA and Performance Max campaigns alongside your CRM jobs"
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
          <div className="grid grid-cols-2 gap-3">
            {lsa.map((c) => <CampaignCard key={c.id} c={c} />)}
          </div>
        </Section>

        <Section title="Performance Max">
          <div className="grid grid-cols-2 gap-3">
            {pmax.map((c) => <CampaignCard key={c.id} c={c} />)}
          </div>
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

function CampaignCard({ c }: { c: typeof adsCampaigns[number] }) {
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
