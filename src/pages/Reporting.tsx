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
        {tab === "Pipeline" && <PipelineReport />}
        {tab === "Marketing" && <EmailMarketingReport />}
        {tab === "Customers" && <CustomersReport />}
        {tab === "Google Ads" && <GoogleAds />}
      </PageBody>
    </>
  );
}

function GoogleAds() {
  return <GoogleAdsReport />;
}
