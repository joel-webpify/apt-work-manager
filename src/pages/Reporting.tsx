import { useState } from "react";
import { PageHeader, PageBody } from "@/components/layout/PageShell";
import { GoogleAdsReport } from "@/components/reporting/GoogleAdsReport";

const tabs = ["Revenue", "Pipeline", "Marketing", "Customers", "Google Ads"] as const;
type Tab = typeof tabs[number];

export default function Reporting() {
  const [tab, setTab] = useState<Tab>("Revenue");
  const [digest, setDigest] = useState(true);

  return (
    <>
      <PageHeader
        title="Reporting & analytics"
        description="Pre-built dashboards for the metrics that matter"
        actions={
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <span className="text-muted-foreground">Weekly digest</span>
            <button
              onClick={() => setDigest(!digest)}
              className={`relative w-9 h-5 rounded-full transition-colors ${digest ? "bg-primary" : "bg-surface border-hairline"}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${digest ? "translate-x-4" : "translate-x-0.5"}`} />
            </button>
          </label>
        }
      />
      <PageBody>
        <div className="flex border-b-hairline mb-6 -mt-2">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`h-9 px-3 text-sm border-b-2 -mb-px transition-colors ${
                tab === t ? "border-primary text-foreground font-medium" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "Revenue" && <Revenue />}
        {tab === "Pipeline" && <PipelineTab />}
        {tab === "Marketing" && <Marketing />}
        {tab === "Customers" && <Empty title="Customers" />}
        {tab === "Google Ads" && <GoogleAds />}
      </PageBody>
    </>
  );
}

function Revenue() {
  const months = [
    { m: "Nov", v: 6400 },
    { m: "Dec", v: 5200 },
    { m: "Jan", v: 7100 },
    { m: "Feb", v: 6800 },
    { m: "Mar", v: 7900 },
    { m: "Apr", v: 8420 },
  ];
  const max = Math.max(...months.map((m) => m.v));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="border-hairline rounded-lg bg-card p-4 col-span-1">
          <div className="text-xs text-muted-foreground">Revenue this month</div>
          <div className="text-3xl font-medium mt-1.5 tabular-nums tracking-tight">£8,420</div>
          <div className="text-xs text-[hsl(var(--success))] mt-1">+18% vs last month</div>
        </div>
        <div className="border-hairline rounded-lg bg-card p-4 col-span-1">
          <div className="text-xs text-muted-foreground">Average job value</div>
          <div className="text-3xl font-medium mt-1.5 tabular-nums tracking-tight">£468</div>
          <div className="text-xs text-muted-foreground mt-1">Last 30 days</div>
        </div>
        <div className="border-hairline rounded-lg bg-card p-4 col-span-1">
          <div className="text-xs text-muted-foreground">Overdue invoices</div>
          <div className="text-3xl font-medium mt-1.5 tabular-nums tracking-tight">£1,090</div>
          <div className="text-xs text-[hsl(var(--destructive))] mt-1">2 invoices · 14 days avg</div>
        </div>
      </div>

      <div className="border-hairline rounded-lg bg-card p-5">
        <div className="text-sm font-medium mb-4">Month-on-month revenue</div>
        <div className="flex items-end gap-3 h-40">
          {months.map((m) => (
            <div key={m.m} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex items-end justify-center h-full">
                <div
                  className="w-full max-w-12 rounded-t bg-primary/80"
                  style={{ height: `${(m.v / max) * 100}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">{m.m}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="border-hairline rounded-lg bg-card">
        <div className="px-4 h-11 flex items-center border-b-hairline">
          <span className="text-sm font-medium">Top services by revenue</span>
        </div>
        {[
          { name: "Artificial grass installation", revenue: 4690, share: 56 },
          { name: "Window cleaning", revenue: 1425, share: 17 },
          { name: "Plumbing", revenue: 1415, share: 17 },
          { name: "Electrical", revenue: 890, share: 10 },
        ].map((s) => (
          <div key={s.name} className="px-4 h-11 grid grid-cols-[2fr_1fr_2fr_auto] items-center gap-4 border-b-hairline last:border-b-0 text-sm">
            <span>{s.name}</span>
            <span className="text-muted-foreground tabular-nums">{s.share}%</span>
            <div className="h-1 bg-surface rounded-full overflow-hidden">
              <div className="h-full bg-primary/80 rounded-full" style={{ width: `${s.share}%` }} />
            </div>
            <span className="font-medium tabular-nums w-16 text-right">£{s.revenue}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PipelineTab() {
  const funnel = [
    { stage: "Enquiries", count: 38, color: "hsl(var(--info))" },
    { stage: "Quotes sent", count: 24, color: "hsl(var(--info))" },
    { stage: "Quotes accepted", count: 16, color: "hsl(var(--warning))" },
    { stage: "Jobs booked", count: 14, color: "hsl(var(--warning))" },
    { stage: "Jobs paid", count: 12, color: "hsl(var(--success))" },
  ];
  const max = funnel[0].count;
  return (
    <div className="space-y-4">
      <div className="border-hairline rounded-lg bg-card p-5">
        <div className="text-sm font-medium mb-4">Conversion funnel — last 30 days</div>
        <div className="space-y-2.5">
          {funnel.map((f) => (
            <div key={f.stage} className="flex items-center gap-3">
              <span className="text-sm w-36">{f.stage}</span>
              <div className="flex-1 h-7 bg-surface rounded">
                <div
                  className="h-full rounded flex items-center px-3 text-xs font-medium text-primary-foreground"
                  style={{ width: `${(f.count / max) * 100}%`, backgroundColor: f.color }}
                >
                  {f.count}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Enquiry → quote", value: "63%" },
          { label: "Quote → booking", value: "58%" },
          { label: "Avg days per stage", value: "3.2" },
        ].map((s) => (
          <div key={s.label} className="border-hairline rounded-lg bg-card p-4">
            <div className="text-xs text-muted-foreground">{s.label}</div>
            <div className="text-2xl font-medium tabular-nums mt-1.5 tracking-tight">{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Marketing() {
  const sources = [
    { name: "Google Ads", value: 38, color: "hsl(240 60% 60%)" },
    { name: "Referral", value: 24, color: "hsl(153 65% 45%)" },
    { name: "Website form", value: 18, color: "hsl(33 92% 55%)" },
    { name: "Local Service Ads", value: 14, color: "hsl(280 50% 60%)" },
    { name: "Facebook", value: 6, color: "hsl(0 0% 60%)" },
  ];
  let cumulative = 0;
  const segments = sources.map((s) => {
    const start = cumulative;
    cumulative += s.value;
    return { ...s, start, end: cumulative };
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="border-hairline rounded-lg bg-card p-5">
          <div className="text-sm font-medium mb-4">Lead source breakdown</div>
          <div className="flex items-center gap-6">
            <svg width="140" height="140" viewBox="0 0 42 42">
              {segments.map((s, i) => {
                const r = 15.915;
                const dash = `${s.value} ${100 - s.value}`;
                const offset = 25 - s.start;
                return (
                  <circle
                    key={i}
                    cx="21" cy="21" r={r}
                    fill="transparent"
                    stroke={s.color}
                    strokeWidth="6"
                    strokeDasharray={dash}
                    strokeDashoffset={offset}
                  />
                );
              })}
            </svg>
            <div className="space-y-1.5 text-sm flex-1">
              {sources.map((s) => (
                <div key={s.name} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: s.color }} />
                  <span className="flex-1">{s.name}</span>
                  <span className="font-medium tabular-nums">{s.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border-hairline rounded-lg bg-card p-5">
          <div className="text-sm font-medium mb-4">Campaign ROI</div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span>Spring window cleaning offer</span><span className="font-medium tabular-nums">£2,180</span></div>
            <div className="flex justify-between"><span>Lapsed customer win-back</span><span className="font-medium tabular-nums">£890</span></div>
            <div className="flex justify-between"><span>Annual electrical reminder</span><span className="font-medium tabular-nums text-muted-foreground">—</span></div>
            <div className="pt-3 border-t-hairline flex justify-between font-medium"><span>Total revenue attributed</span><span className="tabular-nums">£3,070</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function GoogleAds() {
  const totalSpend = adsCampaigns.reduce((s, c) => s + c.weeklySpend, 0);
  const totalLeads = adsCampaigns.reduce((s, c) => s + c.leads, 0);
  const totalJobs = adsCampaigns.reduce((s, c) => s + c.jobsAttributed, 0);
  const blendedCpl = totalLeads ? totalSpend / totalLeads : 0;
  const avgJobValue = 468;
  const attributedRevenue = totalJobs * avgJobValue;
  const roas = totalSpend ? attributedRevenue / totalSpend : 0;

  // 8-week trend (mock)
  const trend = [
    { w: "W-7", spend: 520, leads: 22 },
    { w: "W-6", spend: 540, leads: 24 },
    { w: "W-5", spend: 580, leads: 26 },
    { w: "W-4", spend: 600, leads: 28 },
    { w: "W-3", spend: 590, leads: 27 },
    { w: "W-2", spend: 610, leads: 29 },
    { w: "W-1", spend: 600, leads: 28 },
    { w: "Now", spend: totalSpend, leads: totalLeads },
  ];
  const maxSpend = Math.max(...trend.map((t) => t.spend));
  const maxLeads = Math.max(...trend.map((t) => t.leads));

  // Build SVG line for leads trend
  const w = 560, h = 120, pad = 8;
  const stepX = (w - pad * 2) / (trend.length - 1);
  const linePoints = trend
    .map((t, i) => `${pad + i * stepX},${h - pad - (t.leads / maxLeads) * (h - pad * 2)}`)
    .join(" ");
  const areaPoints = `${pad},${h - pad} ${linePoints} ${w - pad},${h - pad}`;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <div className="border-hairline rounded-lg bg-card p-4">
          <div className="text-xs text-muted-foreground">Weekly spend</div>
          <div className="text-3xl font-medium mt-1.5 tabular-nums tracking-tight">£{totalSpend}</div>
          <div className="text-xs text-muted-foreground mt-1">{adsCampaigns.length} active campaigns</div>
        </div>
        <div className="border-hairline rounded-lg bg-card p-4">
          <div className="text-xs text-muted-foreground">Leads this week</div>
          <div className="text-3xl font-medium mt-1.5 tabular-nums tracking-tight">{totalLeads}</div>
          <div className="text-xs text-[hsl(var(--success))] mt-1">+8% vs last week</div>
        </div>
        <div className="border-hairline rounded-lg bg-card p-4">
          <div className="text-xs text-muted-foreground">Blended cost per lead</div>
          <div className="text-3xl font-medium mt-1.5 tabular-nums tracking-tight">£{blendedCpl.toFixed(2)}</div>
          <div className="text-xs text-muted-foreground mt-1">Across LSA + PMax</div>
        </div>
        <div className="border-hairline rounded-lg bg-card p-4">
          <div className="text-xs text-muted-foreground">ROAS</div>
          <div className="text-3xl font-medium mt-1.5 tabular-nums tracking-tight">{roas.toFixed(1)}×</div>
          <div className="text-xs text-muted-foreground mt-1">£{attributedRevenue.toLocaleString()} attributed</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="border-hairline rounded-lg bg-card p-5">
          <div className="text-sm font-medium mb-1">Leads — last 8 weeks</div>
          <div className="text-xs text-muted-foreground mb-4">Weekly lead volume across all campaigns</div>
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
            {trend.map((t) => <span key={t.w}>{t.w}</span>)}
          </div>
        </div>

        <div className="border-hairline rounded-lg bg-card p-5">
          <div className="text-sm font-medium mb-1">Spend — last 8 weeks</div>
          <div className="text-xs text-muted-foreground mb-4">Weekly Google Ads spend (£)</div>
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
            {trend.map((t) => <span key={t.w} className="flex-1 text-center">{t.w}</span>)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="border-hairline rounded-lg bg-card p-5">
          <div className="text-sm font-medium mb-4">Spend split — LSA vs PMax</div>
          <SpendSplit campaigns={adsCampaigns} totalSpend={totalSpend} />
        </div>
        <div className="border-hairline rounded-lg bg-card p-5">
          <div className="text-sm font-medium mb-4">Cost per lead by campaign</div>
          <div className="space-y-3">
            {adsCampaigns.map((c) => {
              const maxCpl = Math.max(...adsCampaigns.map((x) => x.costPerLead));
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
          <div key={c.id} className="px-4 h-11 grid grid-cols-[2fr_80px_90px_80px_90px_90px] items-center gap-3 border-b-hairline last:border-b-0 text-sm">
            <span className="truncate">{c.name}</span>
            <span className="text-xs">
              <span className={`px-1.5 py-0.5 rounded ${c.type === "LSA" ? "bg-[hsl(var(--info))]/10 text-[hsl(var(--info))]" : "bg-primary/10 text-primary"}`}>
                {c.type}
              </span>
            </span>
            <span className="text-right tabular-nums">£{c.weeklySpend}</span>
            <span className="text-right tabular-nums">{c.leads}</span>
            <span className="text-right tabular-nums">£{c.costPerLead.toFixed(2)}</span>
            <span className="text-right tabular-nums font-medium">{c.jobsAttributed}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SpendSplit({ campaigns, totalSpend }: { campaigns: typeof adsCampaigns; totalSpend: number }) {
  const lsa = campaigns.filter((c) => c.type === "LSA").reduce((s, c) => s + c.weeklySpend, 0);
  const pmax = campaigns.filter((c) => c.type === "PMax").reduce((s, c) => s + c.weeklySpend, 0);
  const lsaPct = totalSpend ? Math.round((lsa / totalSpend) * 100) : 0;
  const pmaxPct = 100 - lsaPct;
  const segments = [
    { name: "LSA", value: lsaPct, amount: lsa, color: "hsl(var(--info))" },
    { name: "PMax", value: pmaxPct, amount: pmax, color: "hsl(var(--primary))" },
  ];
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
            cx="21" cy="21" r="15.915"
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

function Empty({ title }: { title: string }) {
  return (
    <div className="border-hairline rounded-lg bg-card p-12 text-center">
      <div className="text-sm font-medium">{title} dashboard</div>
      <div className="text-sm text-muted-foreground mt-1">More charts coming here.</div>
    </div>
  );
}
