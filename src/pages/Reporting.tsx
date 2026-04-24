import { useState } from "react";
import { PageHeader, PageBody } from "@/components/layout/PageShell";
import { GoogleAdsReport } from "@/components/reporting/GoogleAdsReport";
import { CustomersReport } from "@/components/reporting/CustomersReport";
import { EmailMarketingReport } from "@/components/reporting/EmailMarketingReport";
import { RevenueReport } from "@/components/reporting/RevenueReport";
import { PipelineReport } from "@/components/reporting/PipelineReport";

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

        {tab === "Revenue" && <RevenueReport />}
        {tab === "Pipeline" && <PipelineTab />}
        {tab === "Marketing" && <EmailMarketingReport />}
        {tab === "Customers" && <CustomersReport />}
        {tab === "Google Ads" && <GoogleAds />}
      </PageBody>
    </>
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
