import { useMemo } from "react";
import { Heart, Eye, MousePointerClick, Send } from "lucide-react";
import { Pill } from "@/components/layout/PageShell";
import { organicPostStats, rangeFactor, fmtNum, type DateRange } from "@/lib/reportingData";
import { getPosts } from "@/lib/socialPostsStore";

export function SocialOrganicReport({ range }: { range: DateRange }) {
  const f = rangeFactor(range);

  const posts = useMemo(() => {
    const stats = organicPostStats.map((p) => ({
      ...p,
      reach: Math.round(p.reach),
      engagements: Math.round(p.engagements),
    }));
    return stats.sort((a, b) => b.reach - a.reach);
  }, []);

  const scheduled = useMemo(() => {
    try {
      return getPosts().filter((p) => p.kind === "organic" && p.status === "scheduled").length;
    } catch {
      return 0;
    }
  }, []);

  const published = Math.round(organicPostStats.length * f);
  const reach = Math.round(organicPostStats.reduce((a, p) => a + p.reach, 0) * f);
  const engagements = Math.round(organicPostStats.reduce((a, p) => a + p.engagements, 0) * f);
  const clicks = Math.round(organicPostStats.reduce((a, p) => a + p.clicks, 0) * f);
  const engagementRate = reach ? (engagements / reach) * 100 : 0;
  const maxReach = Math.max(...posts.map((p) => p.reach), 1);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-5 gap-3">
        <Kpi icon={<Send className="w-3.5 h-3.5" />} label="Posts published" value={fmtNum(published)} />
        <Kpi icon={<Eye className="w-3.5 h-3.5" />} label="People reached" value={fmtNum(reach)} />
        <Kpi icon={<Heart className="w-3.5 h-3.5" />} label="Likes & comments" value={fmtNum(engagements)} />
        <Kpi label="Engagement rate" value={`${engagementRate.toFixed(1)}%`} />
        <Kpi icon={<MousePointerClick className="w-3.5 h-3.5" />} label="Clicks to site" value={fmtNum(clicks)} />
      </div>

      <div className="border-hairline rounded-lg bg-card overflow-hidden">
        <div className="p-4 pb-3">
          <h3 className="text-sm font-medium">Your best performing posts</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Do more of what already works.</p>
        </div>
        <div className="border-t-hairline divide-y divide-border">
          {posts.map((p) => (
            <div key={p.id} className="px-4 py-3 flex items-center gap-4 hover:bg-surface-hover/50">
              <div className="flex-1 min-w-0">
                <div className="text-sm truncate">{p.caption}</div>
                <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                  <Pill tone="neutral">{p.platform}</Pill>
                  <span>{p.postedAgo}</span>
                </div>
              </div>
              <div className="w-40">
                <div className="h-1.5 bg-surface rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${(p.reach / maxReach) * 100}%` }} />
                </div>
                <div className="text-[11px] text-muted-foreground mt-1 text-right tabular-nums">
                  {fmtNum(p.reach)} reached
                </div>
              </div>
              <div className="w-24 text-right text-sm tabular-nums">{fmtNum(p.engagements)}</div>
              <div className="w-20 text-right text-sm tabular-nums text-muted-foreground">{p.clicks} clicks</div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-hairline rounded-lg bg-surface p-4 text-sm text-muted-foreground">
        {scheduled > 0
          ? `You have ${scheduled} post${scheduled === 1 ? "" : "s"} lined up in the scheduler. `
          : "Nothing is scheduled at the moment. "}
        Posts with before-and-after photos are reaching the most people right now.
      </div>
    </div>
  );
}

function Kpi({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <div className="border-hairline rounded-lg bg-card p-4">
      <div className="text-xs text-muted-foreground flex items-center gap-1.5">
        {icon} {label}
      </div>
      <div className="text-xl font-medium tracking-tight mt-1">{value}</div>
    </div>
  );
}
