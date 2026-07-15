import { Store, Share2, Target, Mail, Megaphone, TrendingUp } from "lucide-react";
import { NavLink } from "react-router-dom";
import { PageBody } from "@/components/layout/PageShell";

const channels = [
  {
    to: "/marketing/gbp",
    icon: Store,
    title: "Google Business Profile",
    metric: "142 profile views",
    sub: "8 new reviews this week",
  },
  {
    to: "/marketing/social-organic",
    icon: Share2,
    title: "Social — Organic",
    metric: "12 posts scheduled",
    sub: "Reach 4.2k · Engagement 3.1%",
  },
  {
    to: "/marketing/social-paid",
    icon: Target,
    title: "Social — Paid",
    metric: "$1,240 spent",
    sub: "23 leads · $53.9 CPL",
  },
  {
    to: "/marketing/email",
    icon: Mail,
    title: "Email",
    metric: "3 campaigns live",
    sub: "Open 42% · Click 8.1%",
  },
  {
    to: "/marketing/ads",
    icon: Megaphone,
    title: "Google Ads",
    metric: "$2,880 spent",
    sub: "51 leads · $56.4 CPL",
  },
];

export default function MarketingOverview() {
  return (
    <PageBody>
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Leads this month", value: "128", delta: "+18%" },
          { label: "Marketing spend", value: "$4,120", delta: "+6%" },
          { label: "Blended CPL", value: "$32.20", delta: "-9%" },
        ].map((k) => (
          <div key={k.label} className="border-hairline rounded-lg p-4 bg-surface">
            <div className="text-xs text-muted-foreground">{k.label}</div>
            <div className="text-2xl font-medium tracking-tight mt-1">{k.value}</div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> {k.delta} vs last month
            </div>
          </div>
        ))}
      </div>

      <h3 className="text-sm font-medium text-muted-foreground mb-2">Channels</h3>
      <div className="grid grid-cols-2 gap-3">
        {channels.map((c) => (
          <NavLink
            key={c.to}
            to={c.to}
            className="border-hairline rounded-lg p-4 bg-surface hover:bg-surface-hover transition-colors flex items-start gap-3"
          >
            <div className="w-9 h-9 rounded-md bg-background border-hairline flex items-center justify-center text-muted-foreground">
              <c.icon className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">{c.title}</div>
              <div className="text-sm mt-0.5">{c.metric}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{c.sub}</div>
            </div>
          </NavLink>
        ))}
      </div>
    </PageBody>
  );
}
