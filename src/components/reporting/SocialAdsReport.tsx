import { useMemo } from "react";
import { Pill } from "@/components/layout/PageShell";
import { socialAdCampaigns, fmtGbpExact, fmtNum, type DateRange } from "@/lib/reportingData";

export function SocialAdsReport({ range }: { range: DateRange }) {
  const campaigns = useMemo(() => socialAdCampaigns(range), [range]);

  const spend = campaigns.reduce((a, c) => a + c.spend, 0);
  const leads = campaigns.reduce((a, c) => a + c.leads, 0);
  const revenue = campaigns.reduce((a, c) => a + c.revenue, 0);
  const clicks = campaigns.reduce((a, c) => a + c.clicks, 0);
  const impressions = campaigns.reduce((a, c) => a + c.impressions, 0);

  const byPlatform = useMemo(() => {
    const map = new Map<string, { spend: number; leads: number; revenue: number }>();
    campaigns.forEach((c) => {
      const cur = map.get(c.platform) ?? { spend: 0, leads: 0, revenue: 0 };
      cur.spend += c.spend;
      cur.leads += c.leads;
      cur.revenue += c.revenue;
      map.set(c.platform, cur);
    });
    return Array.from(map.entries()).map(([platform, v]) => ({ platform, ...v }));
  }, [campaigns]);

  const maxSpend = Math.max(...byPlatform.map((p) => p.spend), 1);
  const best = campaigns.filter((c) => c.leads > 0).sort((a, b) => a.spend / a.leads - b.spend / b.leads)[0];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-5 gap-3">
        <Kpi label="Spend" value={fmtGbpExact(spend)} />
        <Kpi label="Leads" value={fmtNum(leads)} />
        <Kpi label="Cost per lead" value={leads ? `£${(spend / leads).toFixed(2)}` : "—"} />
        <Kpi label="Revenue" value={fmtGbpExact(revenue)} />
        <Kpi label="Return on spend" value={spend ? `${(revenue / spend).toFixed(1)}x` : "—"} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="border-hairline rounded-lg bg-card p-4">
          <h3 className="text-sm font-medium">Where the budget went</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Spend split by platform.</p>
          <div className="mt-4 space-y-3">
            {byPlatform.map((p) => (
              <div key={p.platform}>
                <div className="flex items-center justify-between text-xs">
                  <span>{p.platform}</span>
                  <span className="text-muted-foreground tabular-nums">
                    {fmtGbpExact(p.spend)} · {p.leads} leads
                  </span>
                </div>
                <div className="h-1.5 bg-surface rounded-full mt-1 overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${(p.spend / maxSpend) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-2 border-hairline rounded-lg bg-card overflow-hidden">
          <div className="p-4 pb-3">
            <h3 className="text-sm font-medium">Campaign performance</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {best ? `${best.name} is your cheapest source of enquiries right now.` : "No campaigns with leads yet."}
            </p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-t-hairline border-b-hairline text-xs text-muted-foreground">
                <th className="text-left font-normal px-4 py-2">Campaign</th>
                <th className="text-right font-normal px-4 py-2">Spend</th>
                <th className="text-right font-normal px-4 py-2">Seen</th>
                <th className="text-right font-normal px-4 py-2">Clicks</th>
                <th className="text-right font-normal px-4 py-2">Leads</th>
                <th className="text-right font-normal px-4 py-2">Cost per lead</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.id} className="border-b-hairline last:border-0 hover:bg-surface-hover/50">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="truncate">{c.name}</span>
                      <Pill tone={c.status === "Live" ? "success" : c.status === "Paused" ? "warning" : "neutral"}>
                        {c.status}
                      </Pill>
                    </div>
                    <div className="text-xs text-muted-foreground">{c.platform}</div>
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{fmtGbpExact(c.spend)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{fmtNum(c.impressions)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{fmtNum(c.clicks)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{c.leads}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">
                    {c.leads ? `£${(c.spend / c.leads).toFixed(2)}` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="border-hairline rounded-lg bg-surface p-4 text-sm text-muted-foreground">
        People saw your ads {fmtNum(impressions)} times and clicked {fmtNum(clicks)} times — that's a{" "}
        {impressions ? ((clicks / impressions) * 100).toFixed(2) : "0"}% click rate, and{" "}
        {clicks ? ((leads / clicks) * 100).toFixed(1) : "0"}% of those clicks turned into an enquiry.
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
