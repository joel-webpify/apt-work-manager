import { NavLink, Outlet, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/marketing", label: "Overview", end: true },
  { to: "/marketing/gbp", label: "Google Business" },
  { to: "/marketing/social-organic", label: "Social — Organic" },
  { to: "/marketing/social-paid", label: "Social — Paid" },
  { to: "/marketing/email", label: "Email" },
  { to: "/marketing/ads", label: "Google Ads" },
];

export function MarketingLayout() {
  const { pathname } = useLocation();
  return (
    <div className="flex flex-col flex-1 min-w-0">
      <div className="px-8 pt-5 border-b-hairline">
        <h1 className="text-[22px] font-medium tracking-tight leading-none">Marketing</h1>
        <p className="text-sm text-muted-foreground mt-1">
          All customer acquisition channels in one place.
        </p>
        <div className="flex items-center gap-1 mt-4 -mb-px overflow-x-auto">
          {tabs.map((t) => {
            const active = t.end ? pathname === t.to : pathname.startsWith(t.to);
            return (
              <NavLink
                key={t.to}
                to={t.to}
                end={t.end}
                className={cn(
                  "px-3 h-9 inline-flex items-center text-sm border-b-2 transition-colors whitespace-nowrap",
                  active
                    ? "border-primary text-foreground font-medium"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {t.label}
              </NavLink>
            );
          })}
        </div>
      </div>
      <div className="flex-1 min-h-0 flex flex-col">
        <Outlet />
      </div>
    </div>
  );
}
