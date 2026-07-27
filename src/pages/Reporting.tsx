import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PageHeader, PageBody } from "@/components/layout/PageShell";
import { CustomersReport } from "@/components/reporting/CustomersReport";
import { RevenueReport } from "@/components/reporting/RevenueReport";
import { PipelineReport } from "@/components/reporting/PipelineReport";
import { WebsiteReport } from "@/components/reporting/WebsiteReport";
import { OverviewReport } from "@/components/reporting/OverviewReport";
import { MarketingHubReport, marketingChannels, type MarketingChannelId } from "@/components/reporting/MarketingHubReport";
import { ReportRangePicker } from "@/components/reporting/ReportRangePicker";
import { RANGES, type DateRange } from "@/lib/reportingData";

const tabs = ["Overview", "Revenue", "Pipeline", "Marketing", "Website", "Customers"] as const;
type Tab = typeof tabs[number];

// Legacy links (?tab=google ads) land on Marketing with the right channel open.
const legacyTabToChannel: Record<string, MarketingChannelId> = {
  "google ads": "google-ads",
  "google-ads": "google-ads",
  email: "email",
  marketing: "all",
};

function resolveTab(raw: string | null): Tab {
  const v = (raw ?? "").toLowerCase();
  if (!v) return "Overview";
  if (legacyTabToChannel[v]) return "Marketing";
  return (tabs.find((t) => t.toLowerCase() === v) ?? "Overview") as Tab;
}

export default function Reporting() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState<Tab>(() => resolveTab(searchParams.get("tab")));
  const [range, setRange] = useState<DateRange>(() => {
    const r = (searchParams.get("range") ?? "").toLowerCase() as DateRange;
    return RANGES.includes(r) ? r : "90d";
  });
  const [channel, setChannel] = useState<MarketingChannelId>(() => {
    const c = (searchParams.get("channel") ?? "").toLowerCase();
    const fromLegacy = legacyTabToChannel[(searchParams.get("tab") ?? "").toLowerCase()];
    return (marketingChannels.find((m) => m.id === c)?.id ?? fromLegacy ?? "all") as MarketingChannelId;
  });
  const [digest, setDigest] = useState(true);

  // Keep URL in sync so a view can be shared.
  useEffect(() => {
    const next: Record<string, string> = { tab: tab.toLowerCase(), range };
    if (tab === "Marketing") next.channel = channel;
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, range, channel]);

  return (
    <>
      <PageHeader
        title="Reports"
        description="One place to see how the business and every marketing channel is doing"
        actions={
          <div className="flex items-center gap-4">
            <ReportRangePicker value={range} onChange={setRange} />
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <span className="text-muted-foreground">Weekly digest</span>
              <button
                onClick={() => setDigest(!digest)}
                className={`relative w-9 h-5 rounded-full transition-colors ${digest ? "bg-primary" : "bg-surface border-hairline"}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${digest ? "translate-x-4" : "translate-x-0.5"}`} />
              </button>
            </label>
          </div>
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

        {tab === "Overview" && (
          <OverviewReport
            range={range}
            onOpenChannel={() => {
              setChannel("all");
              setTab("Marketing");
            }}
          />
        )}
        {tab === "Revenue" && <RevenueReport range={range} />}
        {tab === "Pipeline" && <PipelineReport range={range} />}
        {tab === "Marketing" && (
          <MarketingHubReport range={range} channel={channel} onChannelChange={setChannel} />
        )}
        {tab === "Website" && <WebsiteReport />}
        {tab === "Customers" && <CustomersReport />}
      </PageBody>
    </>
  );
}
