import { useState } from "react";
import { PageHeader, PageBody } from "@/components/layout/PageShell";
import { GoogleAdsReport } from "@/components/reporting/GoogleAdsReport";
import { CustomersReport } from "@/components/reporting/CustomersReport";
import { EmailMarketingReport } from "@/components/reporting/EmailMarketingReport";
import { RevenueReport } from "@/components/reporting/RevenueReport";

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
        {tab === "Marketing" && <EmailMarketingReport />}
        {tab === "Customers" && <CustomersReport />}
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

function GoogleAds() {
  return <GoogleAdsReport />;
}
