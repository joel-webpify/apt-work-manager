import { useMemo } from "react";
import { Pill } from "@/components/layout/PageShell";
import { GoogleAdsReport } from "@/components/reporting/GoogleAdsReport";
import { EmailMarketingReport } from "@/components/reporting/EmailMarketingReport";
import { SocialAdsReport } from "@/components/reporting/SocialAdsReport";
import { SocialOrganicReport } from "@/components/reporting/SocialOrganicReport";
import { GoogleBusinessReport } from "@/components/reporting/GoogleBusinessReport";
import { channelMetrics, fmtGbpExact, fmtNum, type DateRange } from "@/lib/reportingData";

export const marketingChannels = [
  { id: "all", label: "All channels" },
  { id: "google-ads", label: "Google Ads & LSA" },
  { id: "social-ads", label: "Social ads" },
  { id: "social-posts", label: "Social posts" },
  { id: "google-business", label: "Google Business" },
  { id: "email", label: "Email" },
] as const;

export type MarketingChannelId = typeof marketingChannels[number]["id"];

export function MarketingHubReport({
  range,
  channel,
  onChannelChange,
}: {
  range: DateRange;
  channel: MarketingChannelId;
  onChannelChange: (c: MarketingChannelId) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1 flex-wrap">
        {marketingChannels.map((c) => (
          <button
            key={c.id}
            onClick={() => onChannelChange(c.id)}
            className={`h-7 px-3 text-xs rounded-full border-hairline transition-colors ${
              channel === c.id ? "bg-foreground text-background border-transparent" : "bg-card hover:bg-surface-hover text-muted-foreground"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {channel === "all" && <AllChannels range={range} onChannelChange={onChannelChange} />}
      {channel === "google-ads" && <GoogleAdsReport />}
      {channel === "social-ads" && <SocialAdsReport range={range} />}
      {channel === "social-posts" && <SocialOrganicReport range={range} />}
      {channel === "google-business" && <GoogleBusinessReport range={range} />}
      {channel === "email" && <EmailMarketingReport />}
    </div>
  );
}

const channelLink: Record<string, MarketingChannelId | undefined> = {
  "google-ads": "google-ads",
  "google-lsa": "google-ads",
  "social-ads": "social-ads",
  "social-posts": "social-posts",
  "google-business": "google-business",
  email: "email",
};

function AllChannels({
  range,
  onChannelChange,
}: {
  range: DateRange;
  onChannelChange: (c: MarketingChannelId) => void;
}) {
  const channels = useMemo(() => channelMetrics(range).sort((a, b) => b.revenue - a.revenue), [range]);
  const spend = channels.reduce((a, c) => a + c.spend, 0);
  const leads = channels.reduce((a, c) => a + c.leads, 0);
  const revenue = channels.reduce((a, c) => a + c.revenue, 0);
  const maxRevenue = Math.max(...channels.map((c) => c.revenue), 1);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <Kpi label="Marketing spend" value={fmtGbpExact(spend)} />
        <Kpi label="Leads generated" value={fmtNum(leads)} />
        <Kpi label="Blended cost per lead" value={leads ? `£${(spend / leads).toFixed(2)}` : "—"} />
        <Kpi label="Revenue attributed" value={fmtGbpExact(revenue)} />
      </div>

      <div className="border-hairline rounded-lg bg-card p-4">
        <h3 className="text-sm font-medium">Revenue by channel</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Which marketing is actually paying for itself.</p>
        <div className="mt-4 space-y-3">
          {channels.map((c) => (
            <div key={c.id}>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2">
                  {c.name}
                  <Pill tone={c.group === "Paid" ? "info" : "success"}>{c.group}</Pill>
                </span>
                <span className="text-muted-foreground tabular-nums">
                  {fmtGbpExact(c.revenue)}
                  {c.spend ? ` · ${c.roas.toFixed(1)}x return` : ""}
                </span>
              </div>
              <div className="h-2 bg-surface rounded-full mt-1 overflow-hidden">
                <div
                  className={`h-full rounded-full ${c.group === "Paid" ? "bg-primary" : "bg-success"}`}
                  style={{ width: `${(c.revenue / maxRevenue) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-hairline rounded-lg bg-card overflow-hidden">
        <div className="p-4 pb-3">
          <h3 className="text-sm font-medium">Channel comparison</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Click a channel to see the detail behind the numbers.</p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-t-hairline border-b-hairline text-xs text-muted-foreground">
              <th className="text-left font-normal px-4 py-2">Channel</th>
              <th className="text-right font-normal px-4 py-2">Spend</th>
              <th className="text-right font-normal px-4 py-2">Visits</th>
              <th className="text-right font-normal px-4 py-2">Leads</th>
              <th className="text-right font-normal px-4 py-2">Cost per lead</th>
              <th className="text-right font-normal px-4 py-2">Jobs won</th>
              <th className="text-right font-normal px-4 py-2">Lead → job</th>
              <th className="text-right font-normal px-4 py-2">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {channels.map((c) => {
              const target = channelLink[c.id];
              return (
                <tr
                  key={c.id}
                  onClick={() => target && onChannelChange(target)}
                  className={`border-b-hairline last:border-0 ${target ? "cursor-pointer hover:bg-surface-hover/50" : ""}`}
                >
                  <td className="px-4 py-2.5">{c.name}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{c.spend ? fmtGbpExact(c.spend) : "—"}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{fmtNum(c.visits)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{c.leads}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{c.spend ? `£${c.cpl.toFixed(2)}` : "Free"}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{c.jobs}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{c.convRate.toFixed(0)}%</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{fmtGbpExact(c.revenue)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-hairline rounded-lg bg-card p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-xl font-medium tracking-tight mt-1">{value}</div>
    </div>
  );
}
