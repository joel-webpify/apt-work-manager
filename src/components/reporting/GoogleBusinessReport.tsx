import { useMemo } from "react";
import { Eye, Phone, Navigation, Globe, MessageSquare, Star, Image } from "lucide-react";
import { gbpMetrics, gbpSearchTerms, fmtNum, rangeLabels, type DateRange } from "@/lib/reportingData";

export function GoogleBusinessReport({ range }: { range: DateRange }) {
  const m = useMemo(() => gbpMetrics(range), [range]);
  const actions = m.calls + m.directions + m.websiteClicks + m.messages;
  const actionRate = m.profileViews ? (actions / m.profileViews) * 100 : 0;

  const actionRows = [
    { icon: <Phone className="w-3.5 h-3.5" />, label: "Phone calls", value: m.calls },
    { icon: <Navigation className="w-3.5 h-3.5" />, label: "Direction requests", value: m.directions },
    { icon: <Globe className="w-3.5 h-3.5" />, label: "Website clicks", value: m.websiteClicks },
    { icon: <MessageSquare className="w-3.5 h-3.5" />, label: "Messages", value: m.messages },
  ];
  const maxAction = Math.max(...actionRows.map((a) => a.value), 1);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <Kpi icon={<Eye className="w-3.5 h-3.5" />} label="Profile views" value={fmtNum(m.profileViews)} sub={`${fmtNum(m.searchViews)} in search · ${fmtNum(m.mapViews)} on maps`} />
        <Kpi label="People who took action" value={fmtNum(actions)} sub={`${actionRate.toFixed(1)}% of everyone who saw you`} />
        <Kpi icon={<Star className="w-3.5 h-3.5" />} label="Average rating" value={m.avgRating.toFixed(1)} sub={`${m.newReviews} new reviews`} />
        <Kpi icon={<Image className="w-3.5 h-3.5" />} label="Photo views" value={fmtNum(m.photoViews)} sub="Fresh photos keep you visible" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="border-hairline rounded-lg bg-card p-4">
          <h3 className="text-sm font-medium">What people did after finding you</h3>
          <p className="text-xs text-muted-foreground mt-0.5">The actions that turn into real enquiries.</p>
          <div className="mt-4 space-y-3">
            {actionRows.map((a) => (
              <div key={a.label}>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    {a.icon} {a.label}
                  </span>
                  <span className="tabular-nums">{fmtNum(a.value)}</span>
                </div>
                <div className="h-1.5 bg-surface rounded-full mt-1 overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${(a.value / maxAction) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-hairline rounded-lg bg-card p-4">
          <h3 className="text-sm font-medium">What people searched to find you</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Useful words to reuse on your website and posts.</p>
          <div className="mt-4 space-y-2.5">
            {gbpSearchTerms.map((t) => (
              <div key={t.term} className="flex items-center gap-3">
                <span className="text-sm flex-1 truncate">{t.term}</span>
                <div className="w-28 h-1.5 bg-surface rounded-full overflow-hidden">
                  <div className="h-full bg-success rounded-full" style={{ width: `${t.share * 3.5}%` }} />
                </div>
                <span className="text-xs text-muted-foreground tabular-nums w-10 text-right">{t.share}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border-hairline rounded-lg bg-surface p-4 text-sm text-muted-foreground">
        Over {rangeLabels[range].toLowerCase()}, {fmtNum(m.profileViews)} people saw your Google listing and{" "}
        {fmtNum(m.calls)} of them called you directly. This is your cheapest source of work — keep photos and reviews
        coming.
      </div>
    </div>
  );
}

function Kpi({ icon, label, value, sub }: { icon?: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="border-hairline rounded-lg bg-card p-4">
      <div className="text-xs text-muted-foreground flex items-center gap-1.5">
        {icon} {label}
      </div>
      <div className="text-2xl font-medium tracking-tight mt-1">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}
