import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  KanbanSquare,
  Users,
  FileText,
  Receipt,
  Mail,
  Megaphone,
  BarChart3,
  Activity,
  Settings,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/pipeline", label: "Jobs & pipeline", icon: KanbanSquare },
  { to: "/contacts", label: "Contacts & leads", icon: Users },
  { to: "/forms", label: "Forms", icon: FileText },
  { to: "/quotes", label: "Quotes & invoices", icon: Receipt },
  { to: "/email", label: "Email marketing", icon: Mail },
  { to: "/ads", label: "Google Ads", icon: Megaphone },
  { to: "/reporting", label: "Reporting & analytics", icon: BarChart3 },
  { to: "/tracking", label: "Tracking", icon: Activity },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ onAskAI }: { onAskAI: () => void }) {
  const location = useLocation();
  return (
    <aside className="w-[240px] shrink-0 bg-surface border-r-hairline flex flex-col h-screen sticky top-0">
      <div className="px-4 h-14 flex items-center border-b-hairline">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-xs font-medium">S</span>
          </div>
          <span className="text-base font-medium tracking-tight">ServiceCRM</span>
        </div>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {items.map((item) => {
          const active = item.end
            ? location.pathname === item.to
            : location.pathname.startsWith(item.to);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={cn(
                "flex items-center gap-2.5 px-2.5 h-8 rounded-md text-sm transition-colors",
                active
                  ? "bg-surface-hover text-foreground font-medium"
                  : "text-muted-foreground hover:bg-surface-hover hover:text-foreground"
              )}
            >
              <item.icon className="w-4 h-4 shrink-0" strokeWidth={1.75} />
              <span className="truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-2 border-t-hairline">
        <button
          onClick={onAskAI}
          className="w-full flex items-center gap-2.5 px-2.5 h-9 rounded-md bg-background border-hairline text-sm font-medium hover:bg-surface-hover transition-colors"
        >
          <Sparkles className="w-4 h-4 text-primary" strokeWidth={1.75} />
          <span>Ask AI</span>
          <kbd className="ml-auto text-xs text-muted-foreground font-mono">⌘K</kbd>
        </button>
      </div>
    </aside>
  );
}
