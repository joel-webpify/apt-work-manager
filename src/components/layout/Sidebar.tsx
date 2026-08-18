import { useEffect, useState } from "react";
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
  ChevronDown,
  Store,
  Share2,
  Target,
  Zap,
  Workflow,
  Repeat,
  Radar,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Item = { to: string; label: string; icon: any; end?: boolean };
type Group = { id: string; label?: string; items: Item[] };

const groups: Group[] = [
  {
    id: "top",
    items: [{ to: "/", label: "Dashboard", icon: LayoutDashboard, end: true }],
  },
  {
    id: "crm",
    label: "CRM",
    items: [
      { to: "/contacts", label: "Contacts & leads", icon: Users },
      { to: "/pipeline", label: "Jobs & pipeline", icon: KanbanSquare },
      { to: "/quotes", label: "Quotes & invoices", icon: Receipt },
      { to: "/forms", label: "Forms", icon: FileText },
    ],
  },
  {
    id: "marketing",
    label: "Marketing",
    items: [
      { to: "/marketing", label: "Overview", icon: Radar, end: true },
      { to: "/marketing/gbp", label: "Google Business", icon: Store },
      { to: "/marketing/social-organic", label: "Social posts", icon: Share2 },
      { to: "/marketing/social-paid", label: "Social ads", icon: Target },
      { to: "/marketing/email", label: "Email", icon: Mail },
      { to: "/marketing/ads", label: "Google Ads", icon: Megaphone },
    ],
  },
  {
    id: "automations",
    label: "Automations",
    items: [
      { to: "/automations", label: "Automations", icon: Workflow, end: true },
      { to: "/automations/sequences", label: "Email follow-ups", icon: Repeat },
    ],
  },
  {
    id: "analytics",
    label: "Reports",
    items: [
      { to: "/reporting", label: "Reports", icon: BarChart3 },
      { to: "/tracking", label: "Website tracking", icon: Activity },
    ],
  },
  {
    id: "system",
    items: [
      { to: "/field", label: "Field app", icon: HardHat },
      { to: "/settings", label: "Settings", icon: Settings },
    ],
  },

];

const STORAGE_KEY = "sidebar.collapsed.v1";

export function Sidebar({ onAskAI }: { onAskAI: () => void }) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setCollapsed(JSON.parse(raw));
    } catch {}
  }, []);

  const toggle = (id: string) => {
    setCollapsed((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const isActive = (item: Item) =>
    item.end ? location.pathname === item.to : location.pathname.startsWith(item.to);

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

      <nav className="flex-1 px-2 py-3 overflow-y-auto">
        {groups.map((group) => {
          const isCollapsed = !!collapsed[group.id];
          const hasActive = group.items.some(isActive);
          return (
            <div key={group.id} className="mb-2">
              {group.label && (
                <button
                  onClick={() => toggle(group.id)}
                  className="w-full flex items-center justify-between px-2.5 h-6 text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                >
                  <span>{group.label}</span>
                  <ChevronDown
                    className={cn(
                      "w-3 h-3 transition-transform",
                      isCollapsed && "-rotate-90"
                    )}
                    strokeWidth={2}
                  />
                </button>
              )}
              {(!isCollapsed || hasActive) && (
                <div className="mt-0.5 space-y-0.5">
                  {group.items.map((item) => {
                    const active = isActive(item);
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
                </div>
              )}
            </div>
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
