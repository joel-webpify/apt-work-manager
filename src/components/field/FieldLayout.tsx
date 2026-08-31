import { Outlet, Link, NavLink, useLocation } from "react-router-dom";
import { ArrowLeft, CalendarDays, CalendarRange, ClipboardList, CloudOff, User, AlertTriangle } from "lucide-react";
import { employees } from "@/data/mockData";
import { storageFailed, useFieldRecords, useFieldUser, useOnline } from "@/lib/fieldStore";

const tabs = [
  { to: "/field", label: "My day", icon: CalendarDays, end: true },
  { to: "/field/week", label: "My week", icon: CalendarRange, end: true },
  { to: "/field/me", label: "Me", icon: User, end: true },
];

export default function FieldLayout() {
  const [userId, setUserId] = useFieldUser();
  const me = employees.find((e) => e.id === userId) ?? employees[0];
  const online = useOnline();
  const records = useFieldRecords();
  const location = useLocation();
  const onJob = location.pathname.includes("/field/job/");
  const saveProblem = storageFailed() && Object.keys(records).length > 0;

  return (
    <div className="min-h-screen bg-surface">
      <div className="mx-auto w-full max-w-[520px] min-h-screen bg-background flex flex-col shadow-sm">
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b-hairline">
          <div className="h-14 px-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 text-primary-foreground"
                style={{ backgroundColor: `hsl(${me.color})` }}
              >
                {me.initials}
              </span>
              <div className="min-w-0">
                <div className="text-sm font-medium leading-tight truncate">{me.name}</div>
                <div className="text-[11px] text-muted-foreground leading-tight truncate">{me.role}</div>
              </div>
            </div>
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="h-8 max-w-[120px] rounded-md border-hairline bg-background px-2 text-xs"
              aria-label="Switch worker"
            >
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </div>

          {!online && (
            <div className="px-4 py-2 bg-[hsl(var(--warning)/0.14)] text-[hsl(var(--warning))] text-xs inline-flex items-center gap-1.5 w-full">
              <CloudOff className="w-3.5 h-3.5 shrink-0" />
              No signal — carry on, everything is saved on this phone and sent when you're back.
            </div>
          )}
          {saveProblem && (
            <div className="px-4 py-2 bg-destructive/10 text-destructive text-xs inline-flex items-center gap-1.5 w-full">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              This phone is out of room — delete a few photos so nothing gets lost.
            </div>
          )}
        </header>

        <main className="flex-1 flex flex-col">
          <Outlet />
        </main>

        {!onJob && (
          <nav className="sticky bottom-0 z-30 bg-background/95 backdrop-blur border-t-hairline grid grid-cols-3">
            {tabs.map((t) => (
              <NavLink
                key={t.to}
                to={t.to}
                end={t.end}
                className={({ isActive }) =>
                  `h-14 flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`
                }
              >
                <t.icon className="w-4 h-4" />
                {t.label}
              </NavLink>
            ))}
          </nav>
        )}

        <footer className="px-4 py-3 border-t-hairline flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <ClipboardList className="w-3.5 h-3.5" /> Field app
          </span>
          <Link to="/pipeline" className="inline-flex items-center gap-1 hover:text-foreground">
            <ArrowLeft className="w-3 h-3" /> Back to office
          </Link>
        </footer>
      </div>
    </div>
  );
}
