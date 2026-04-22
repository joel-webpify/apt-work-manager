import { useMemo, useState } from "react";
import { adsCampaigns, jobs, contacts, stages, type AdsCampaign, type PipelineStage } from "@/data/mockData";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Pill } from "@/components/layout/PageShell";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

// Per-campaign 8-week trend (deterministic mock derived from current values)
function trendFor(campaign: AdsCampaign | null) {
  if (!campaign) {
    // Aggregate trend
    return [
      { w: "W-7", spend: 520, leads: 22 },
      { w: "W-6", spend: 540, leads: 24 },
      { w: "W-5", spend: 580, leads: 26 },
      { w: "W-4", spend: 600, leads: 28 },
      { w: "W-3", spend: 590, leads: 27 },
      { w: "W-2", spend: 610, leads: 29 },
      { w: "W-1", spend: 600, leads: 28 },
      {
        w: "Now",
        spend: adsCampaigns.reduce((s, c) => s + c.weeklySpend, 0),
        leads: adsCampaigns.reduce((s, c) => s + c.leads, 0),
      },
    ];
  }
  // Generate a smooth trajectory ending at current weeklySpend / leads
  const factors = [0.78, 0.84, 0.88, 0.94, 0.92, 0.97, 0.99, 1];
  return factors.map((f, i) => ({
    w: i === 7 ? "Now" : `W-${7 - i}`,
    spend: Math.round(campaign.weeklySpend * f),
    leads: Math.max(1, Math.round(campaign.leads * f)),
  }));
}

export function GoogleAdsReport() {
  const [filterId, setFilterId] = useState<string | null>(null);
  const [drawerId, setDrawerId] = useState<string | null>(null);

  const filtered = useMemo(
    () => (filterId ? adsCampaigns.filter((c) => c.id === filterId) : adsCampaigns),
    [filterId]
  );
  const selected = filterId ? adsCampaigns.find((c) => c.id === filterId) ?? null : null;
  const drawerCampaign = drawerId ? adsCampaigns.find((c) => c.id === drawerId) ?? null : null;

  const totalSpend = filtered.reduce((s, c) => s + c.weeklySpend, 0);
  const totalLeads = filtered.reduce((s, c) => s + c.leads, 0);
  const totalJobs = filtered.reduce((s, c) => s + c.jobsAttributed, 0);
  const blendedCpl = totalLeads ? totalSpend / totalLeads : 0;
  const avgJobValue = 468;
  const attributedRevenue = totalJobs * avgJobValue;
  const roas = totalSpend ? attributedRevenue / totalSpend : 0;

  const trend = trendFor(selected);
  const maxSpend = Math.max(...trend.map((t) => t.spend), 1);
  const maxLeads = Math.max(...trend.map((t) => t.leads), 1);

  const w = 560,
    h = 120,
    pad = 8;
  const stepX = (w - pad * 2) / (trend.length - 1);
  const linePoints = trend
    .map((t, i) => `${pad + i * stepX},${h - pad - (t.leads / maxLeads) * (h - pad * 2)}`)
    .join(" ");
  const areaPoints = `${pad},${h - pad} ${linePoints} ${w - pad},${h - pad}`;

  const onTileClick = () => {
    if (!selected) return;
    setDrawerId(selected.id);
  };

  return (
    <div className="space-y-4">
      {/* Filter chips */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground mr-1">Filter:</span>
        <FilterChip active={filterId === null} onClick={() => setFilterId(null)}>
          All campaigns
        </FilterChip>
        {adsCampaigns.map((c) => (
          <FilterChip key={c.id} active={filterId === c.id} onClick={() => setFilterId(c.id)}>
            {c.name}
          </FilterChip>
        ))}
        {selected && (
          <button
            onClick={() => setDrawerId(selected.id)}
            className="ml-auto text-xs text-primary hover:underline"
          >
            Open campaign details →
          </button>
        )}
      </div>

      {/* KPI tiles — clickable */}
      <div className="grid grid-cols-4 gap-3">
        <KpiTile
          label="Weekly spend"
          value={`£${totalSpend}`}
          sub={selected ? selected.type : `${adsCampaigns.length} active campaigns`}
          interactive={!!selected}
          onClick={onTileClick}
        />
        <KpiTile
          label="Leads this week"
          value={totalLeads.toString()}
          sub={selected ? "For this campaign" : "+8% vs last week"}
          subTone={selected ? "muted" : "success"}
          interactive={!!selected}
          onClick={onTileClick}
        />
        <KpiTile
          label="Blended cost per lead"
          value={`£${blendedCpl.toFixed(2)}`}
          sub={selected ? selected.type : "Across LSA + PMax"}
          interactive={!!selected}
          onClick={onTileClick}
        />
        <KpiTile
          label="ROAS"
          value={`${roas.toFixed(1)}×`}
          sub={`£${attributedRevenue.toLocaleString()} attributed`}
          interactive={!!selected}
          onClick={onTileClick}
        />
      </div>

      {selected && (
        <div className="text-xs text-muted-foreground -mt-1">
          Showing data for <span className="text-foreground font-medium">{selected.name}</span>. Click a KPI tile to open the campaign drawer.
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="border-hairline rounded-lg bg-card p-5">
          <div className="text-sm font-medium mb-1">Leads — last 8 weeks</div>
          <div className="text-xs text-muted-foreground mb-4">
            {selected ? `Weekly leads for ${selected.name}` : "Weekly lead volume across all campaigns"}
          </div>
          <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-32">
            <polygon points={areaPoints} fill="hsl(var(--primary))" fillOpacity="0.08" />
            <polyline points={linePoints} fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" />
            {trend.map((t, i) => {
              const cx = pad + i * stepX;
              const cy = h - pad - (t.leads / maxLeads) * (h - pad * 2);
              return <circle key={i} cx={cx} cy={cy} r="2" fill="hsl(var(--primary))" />;
            })}
          </svg>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground tabular-nums">
            {trend.map((t) => (
              <span key={t.w}>{t.w}</span>
            ))}
          </div>
        </div>

        <div className="border-hairline rounded-lg bg-card p-5">
          <div className="text-sm font-medium mb-1">Spend — last 8 weeks</div>
          <div className="text-xs text-muted-foreground mb-4">
            {selected ? `Weekly spend for ${selected.name} (£)` : "Weekly Google Ads spend (£)"}
          </div>
          <div className="flex items-end gap-2 h-32">
            {trend.map((t) => (
              <div key={t.w} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex items-end justify-center h-full">
                  <div
                    className="w-full max-w-8 rounded-t bg-primary/80"
                    style={{ height: `${(t.spend / maxSpend) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground tabular-nums">
            {trend.map((t) => (
              <span key={t.w} className="flex-1 text-center">
                {t.w}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="border-hairline rounded-lg bg-card p-5">
          <div className="text-sm font-medium mb-4">
            {selected ? "Campaign type" : "Spend split — LSA vs PMax"}
          </div>
          <SpendSplit campaigns={filtered} totalSpend={totalSpend} />
        </div>
        <div className="border-hairline rounded-lg bg-card p-5">
          <div className="text-sm font-medium mb-4">Cost per lead by campaign</div>
          <div className="space-y-3">
            {filtered.map((c) => {
              const maxCpl = Math.max(...filtered.map((x) => x.costPerLead), 1);
              return (
                <div key={c.id} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="truncate">{c.name}</span>
                    <span className="font-medium tabular-nums">£{c.costPerLead.toFixed(2)}</span>
                  </div>
                  <div className="h-1.5 bg-surface rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(c.costPerLead / maxCpl) * 100}%`,
                        backgroundColor: c.type === "LSA" ? "hsl(var(--info))" : "hsl(var(--primary))",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="border-hairline rounded-lg bg-card">
        <div className="px-4 h-11 flex items-center border-b-hairline">
          <span className="text-sm font-medium">Campaign performance</span>
          <span className="ml-2 text-xs text-muted-foreground">— click a row to view details</span>
        </div>
        <div className="px-4 h-9 grid grid-cols-[2fr_80px_90px_80px_90px_90px] items-center gap-3 border-b-hairline text-xs text-muted-foreground">
          <span>Campaign</span>
          <span>Type</span>
          <span className="text-right">Weekly spend</span>
          <span className="text-right">Leads</span>
          <span className="text-right">Cost/lead</span>
          <span className="text-right">Jobs won</span>
        </div>
        {adsCampaigns.map((c) => (
          <button
            key={c.id}
            onClick={() => {
              setFilterId(c.id);
              setDrawerId(c.id);
            }}
            className={`w-full text-left px-4 h-11 grid grid-cols-[2fr_80px_90px_80px_90px_90px] items-center gap-3 border-b-hairline last:border-b-0 text-sm hover:bg-surface-hover transition-colors ${
              filterId === c.id ? "bg-surface" : ""
            }`}
          >
            <span className="truncate">{c.name}</span>
            <span className="text-xs">
              <span
                className={`px-1.5 py-0.5 rounded ${
                  c.type === "LSA" ? "bg-[hsl(var(--info))]/10 text-[hsl(var(--info))]" : "bg-primary/10 text-primary"
                }`}
              >
                {c.type}
              </span>
            </span>
            <span className="text-right tabular-nums">£{c.weeklySpend}</span>
            <span className="text-right tabular-nums">{c.leads}</span>
            <span className="text-right tabular-nums">£{c.costPerLead.toFixed(2)}</span>
            <span className="text-right tabular-nums font-medium">{c.jobsAttributed}</span>
          </button>
        ))}
      </div>

      <Sheet open={!!drawerCampaign} onOpenChange={(o) => !o && setDrawerId(null)}>
        <SheetContent className="p-0 w-full sm:max-w-2xl flex flex-col">
          {drawerCampaign && (
            <CampaignReportDrawer campaign={drawerCampaign} onClose={() => setDrawerId(null)} />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`h-7 px-2.5 rounded text-xs border-hairline transition-colors ${
        active ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground hover:bg-surface-hover"
      }`}
    >
      {children}
    </button>
  );
}

function KpiTile({
  label,
  value,
  sub,
  subTone = "muted",
  interactive,
  onClick,
}: {
  label: string;
  value: string;
  sub: string;
  subTone?: "muted" | "success";
  interactive?: boolean;
  onClick?: () => void;
}) {
  const subClass = subTone === "success" ? "text-[hsl(var(--success))]" : "text-muted-foreground";
  return (
    <button
      onClick={onClick}
      disabled={!interactive}
      className={`border-hairline rounded-lg bg-card p-4 text-left transition-colors ${
        interactive ? "hover:bg-surface-hover cursor-pointer" : "cursor-default"
      }`}
    >
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-3xl font-medium mt-1.5 tabular-nums tracking-tight">{value}</div>
      <div className={`text-xs mt-1 ${subClass}`}>{sub}</div>
    </button>
  );
}

function SpendSplit({
  campaigns,
  totalSpend,
}: {
  campaigns: AdsCampaign[];
  totalSpend: number;
}) {
  const lsa = campaigns.filter((c) => c.type === "LSA").reduce((s, c) => s + c.weeklySpend, 0);
  const pmax = campaigns.filter((c) => c.type === "PMax").reduce((s, c) => s + c.weeklySpend, 0);
  const lsaPct = totalSpend ? Math.round((lsa / totalSpend) * 100) : 0;
  const pmaxPct = totalSpend ? 100 - lsaPct : 0;
  const segments = [
    { name: "LSA", value: lsaPct, amount: lsa, color: "hsl(var(--info))" },
    { name: "PMax", value: pmaxPct, amount: pmax, color: "hsl(var(--primary))" },
  ].filter((s) => s.value > 0);

  let cumulative = 0;
  const arcs = segments.map((s) => {
    const start = cumulative;
    cumulative += s.value;
    return { ...s, start };
  });

  return (
    <div className="flex items-center gap-6">
      <svg width="140" height="140" viewBox="0 0 42 42">
        {arcs.map((s, i) => (
          <circle
            key={i}
            cx="21"
            cy="21"
            r="15.915"
            fill="transparent"
            stroke={s.color}
            strokeWidth="6"
            strokeDasharray={`${s.value} ${100 - s.value}`}
            strokeDashoffset={25 - s.start}
          />
        ))}
      </svg>
      <div className="space-y-2 text-sm flex-1">
        {segments.map((s) => (
          <div key={s.name} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: s.color }} />
            <span className="flex-1">{s.name}</span>
            <span className="text-muted-foreground tabular-nums">£{s.amount}</span>
            <span className="font-medium tabular-nums w-10 text-right">{s.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CampaignReportDrawer({
  campaign,
  onClose,
}: {
  campaign: AdsCampaign;
  onClose: () => void;
}) {
  const attributed = getAttributedJobs(campaign);
  const totalValue = attributed.reduce((sum, a) => sum + a.job.value, 0);
  const trend = trendFor(campaign);
  const maxLeads = Math.max(...trend.map((t) => t.leads), 1);
  const w = 520, h = 100, pad = 8;
  const stepX = (w - pad * 2) / (trend.length - 1);
  const linePoints = trend
    .map((t, i) => `${pad + i * stepX},${h - pad - (t.leads / maxLeads) * (h - pad * 2)}`)
    .join(" ");
  const areaPoints = `${pad},${h - pad} ${linePoints} ${w - pad},${h - pad}`;

  return (
    <>
      <div className="px-6 h-16 border-b-hairline flex items-center justify-between shrink-0">
        <div>
          <div className="text-base font-medium">{campaign.name}</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {campaign.type} · {campaign.status} · Reporting view
          </div>
        </div>
        <button
          onClick={onClose}
          className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-surface-hover text-muted-foreground"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div className="grid grid-cols-4 gap-4 pb-5 border-b-hairline">
          <DrawerStat label="Weekly spend" value={`£${campaign.weeklySpend}`} />
          <DrawerStat label="Leads" value={campaign.leads.toString()} />
          <DrawerStat label="Cost per lead" value={`£${campaign.costPerLead.toFixed(2)}`} />
          <DrawerStat label="Jobs attributed" value={campaign.jobsAttributed.toString()} />
        </div>

        <div>
          <div className="text-sm font-medium mb-1">Leads — last 8 weeks</div>
          <div className="text-xs text-muted-foreground mb-3">Trend matches the chart on the dashboard</div>
          <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-24">
            <polygon points={areaPoints} fill="hsl(var(--primary))" fillOpacity="0.08" />
            <polyline points={linePoints} fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" />
            {trend.map((t, i) => {
              const cx = pad + i * stepX;
              const cy = h - pad - (t.leads / maxLeads) * (h - pad * 2);
              return <circle key={i} cx={cx} cy={cy} r="2" fill="hsl(var(--primary))" />;
            })}
          </svg>
          <div className="flex justify-between mt-1 text-xs text-muted-foreground tabular-nums">
            {trend.map((t) => (
              <span key={t.w}>{t.w}</span>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium">Attributed jobs</h3>
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
                    <th className="text-right font-normal px-3 h-9">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {attributed.map(({ job }) => (
                    <tr key={job.id} className="border-t-hairline">
                      <td className="px-3 h-10 font-medium">{job.customer}</td>
                      <td className="px-3 h-10 text-muted-foreground">{job.service}</td>
                      <td className="px-3 h-10">
                        <Pill tone={job.stage === "Paid" || job.stage === "Completed" ? "success" : "info"}>
                          {job.stage}
                        </Pill>
                      </td>
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

function DrawerStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-medium tabular-nums mt-0.5">{value}</div>
    </div>
  );
}
