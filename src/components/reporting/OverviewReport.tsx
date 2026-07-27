import { useMemo } from "react";
import { TrendingUp, TrendingDown, PoundSterling, Users, Briefcase, Target, MousePointerClick, Globe, Lightbulb } from "lucide-react";
import { Pill } from "@/components/layout/PageShell";
import {
  channelMetrics,
  reportTotals,
  trendSeries,
  rangeLabels,
  fmtGbp,
  fmtGbpExact,
  fmtNum,
  type DateRange,
} from "@/lib/reportingData";

export function OverviewReport({ range, onOpenChannel }: { range: DateRange; onOpenChannel?: () => void }) {
  const totals = useMemo(() => reportTotals(range), [range]);
  const channels = useMemo(() => channelMetrics(range).sort((a, b) => b.revenue - a.revenue), [range]);
  const trend = useMemo(() => trendSeries(range), [range]);

  const paidChannels = channels.filter((c) => c.spend > 0 && c.leads > 0);
  const cheapest = paidChannels.length ? paidChannels.reduce((a, c) => (c.cpl < a.cpl ? c : a)) : null;
  const bestRoas = paidChannels.length ? paidChannels.reduce((a, c) => (c.roas > a.roas ? c : a)) : null;
  const weakest = paidChannels.length ? paidChannels.reduce((a, c) => (c.roas < a.roas ? c : a)) : null;
  const topFree = channels.filter((c) => c.spend === 0).sort((a, b) => b.revenue - a.revenue)[0];

  const maxRevenue = Math.max(...trend.map((t) => t.revenue), 1);
  const leadMax = Math.max(...channels.map((c) => c.leads), 1);

  return (
    <div className="space-y-4">
      <div className="text-xs text-muted-foreground -mt-1">
        Everything below covers {rangeLabels[range].toLowerCase()}, compared with the period before it.
      </div>

      {/* Headline tiles */}
      <div className="grid grid-cols-3 gap-3">
        <Tile icon={<PoundSterling className="w-3.5 h-3.5" />} label="Revenue won" value={fmtGbp(totals.revenue)} delta={11} accent />
        <Tile icon={<Briefcase className="w-3.5 h-3.5" />} label="Jobs booked" value={fmtNum(totals.jobs)} delta={7} />
        <Tile icon={<Users className="w-3.5 h-3.5" />} label="New leads" value={fmtNum(totals.leads)} delta={14} />
        <Tile icon={<Target className="w-3.5 h-3.5" />} label="Marketing spend" value={fmtGbp(totals.spend)} delta={5} invert />
        <Tile icon={<MousePointerClick className="w-3.5 h-3.5" />} label="Cost per lead" value={`£${totals.cpl.toFixed(2)}`} delta={-8} invert />
        <Tile icon={<Globe className="w-3.5 h-3.5" />} label="Website visits" value={fmtNum(totals.visits)} delta={9} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        {/* Trend */}
        <div className="col-span-2 border-hairline rounded-lg bg-card p-4">
          <div className="flex items-baseline justify-between">
            <h3 className="text-sm font-medium">Leads and revenue over time</h3>
            <span className="text-xs text-muted-foreground">{fmtGbpExact(totals.revenue)} total</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">Whether the work coming in is growing or slowing.</p>
          <div className="mt-4 flex items-end gap-1 h-40">
            {trend.map((t) => (
              <div key={t.label} className="flex-1 flex flex-col items-center gap-1 group">
                <div className="w-full flex flex-col justify-end h-full">
                  <div
                    className="w-full rounded-t bg-primary/80 group-hover:bg-primary transition-colors"
                    style={{ height: `${(t.revenue / maxRevenue) * 100}%` }}
                    title={`${t.label}: ${fmtGbpExact(t.revenue)} · ${t.leads} leads`}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground truncate">{t.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Where leads came from */}
        <div className="border-hairline rounded-lg bg-card p-4">
          <h3 className="text-sm font-medium">Where your leads came from</h3>
          <p className="text-xs text-muted-foreground mt-0.5">The channels bringing you enquiries.</p>
          <div className="mt-4 space-y-2.5">
            {channels
              .slice()
              .sort((a, b) => b.leads - a.leads)
              .map((c) => (
                <div key={c.id}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="truncate">{c.name}</span>
                    <span className="text-muted-foreground tabular-nums">{c.leads}</span>
                  </div>
                  <div className="h-1.5 bg-surface rounded-full mt-1 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${c.group === "Paid" ? "bg-primary" : "bg-success"}`}
                      style={{ width: `${(c.leads / leadMax) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>
          <div className="flex items-center gap-3 mt-4 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1"><i className="w-2 h-2 rounded-full bg-primary inline-block" /> Paid</span>
            <span className="inline-flex items-center gap-1"><i className="w-2 h-2 rounded-full bg-success inline-block" /> Free</span>
          </div>
        </div>
      </div>

      {/* Channel scorecard */}
      <div className="border-hairline rounded-lg bg-card overflow-hidden">
        <div className="p-4 pb-3 flex items-baseline justify-between">
          <div>
            <h3 className="text-sm font-medium">Every channel side by side</h3>
            <p className="text-xs text-muted-foreground mt-0.5">What each one costs you and what it brings back.</p>
          </div>
          {onOpenChannel && (
            <button onClick={onOpenChannel} className="text-xs text-primary hover:underline">
              Open marketing detail
            </button>
          )}
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-t-hairline border-b-hairline text-xs text-muted-foreground">
              <th className="text-left font-normal px-4 py-2">Channel</th>
              <th className="text-right font-normal px-4 py-2">Spend</th>
              <th className="text-right font-normal px-4 py-2">Leads</th>
              <th className="text-right font-normal px-4 py-2">Cost per lead</th>
              <th className="text-right font-normal px-4 py-2">Jobs won</th>
              <th className="text-right font-normal px-4 py-2">Revenue</th>
              <th className="text-right font-normal px-4 py-2">Return on spend</th>
            </tr>
          </thead>
          <tbody>
            {channels.map((c) => (
              <tr key={c.id} className="border-b-hairline last:border-0 hover:bg-surface-hover/50">
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span>{c.name}</span>
                    <Pill tone={c.group === "Paid" ? "info" : "success"}>{c.group}</Pill>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums">{c.spend ? fmtGbpExact(c.spend) : "—"}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{c.leads}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{c.spend ? `£${c.cpl.toFixed(2)}` : "Free"}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{c.jobs}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{fmtGbpExact(c.revenue)}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{c.spend ? `${c.roas.toFixed(1)}x` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Takeaways */}
      <div className="border-hairline rounded-lg bg-surface p-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> What this means
        </div>
        <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
          {cheapest && (
            <li>
              <strong className="text-foreground">{cheapest.name}</strong> gave you the cheapest enquiries at £
              {cheapest.cpl.toFixed(2)} each.
            </li>
          )}
          {bestRoas && (
            <li>
              Every £1 spent on <strong className="text-foreground">{bestRoas.name}</strong> came back as £
              {bestRoas.roas.toFixed(2)} of work.
            </li>
          )}
          {weakest && weakest.id !== bestRoas?.id && (
            <li>
              <strong className="text-foreground">{weakest.name}</strong> is your weakest paid channel right now —
              worth a look before you add more budget.
            </li>
          )}
          {topFree && (
            <li>
              <strong className="text-foreground">{topFree.name}</strong> brought in {fmtGbpExact(topFree.revenue)} without
              any ad spend at all.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

function Tile({
  icon,
  label,
  value,
  delta,
  accent,
  invert,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  delta: number;
  accent?: boolean;
  invert?: boolean;
}) {
  const good = invert ? delta <= 0 : delta >= 0;
  const Icon = delta >= 0 ? TrendingUp : TrendingDown;
  return (
    <div className={`border-hairline rounded-lg p-4 ${accent ? "bg-surface" : "bg-card"}`}>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon} {label}
      </div>
      <div className="text-2xl font-medium tracking-tight mt-1">{value}</div>
      <div className={`text-xs mt-1 flex items-center gap-1 ${good ? "text-success" : "text-destructive"}`}>
        <Icon className="w-3 h-3" /> {delta > 0 ? "+" : ""}
        {delta}% vs previous period
      </div>
    </div>
  );
}
