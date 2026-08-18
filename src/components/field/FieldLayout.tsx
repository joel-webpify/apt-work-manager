import { Outlet, Link } from "react-router-dom";
import { HardHat, ArrowLeft } from "lucide-react";
import { employees } from "@/data/mockData";
import { useFieldUser } from "@/lib/fieldStore";

export default function FieldLayout() {
  const [userId, setUserId] = useFieldUser();
  const me = employees.find((e) => e.id === userId) ?? employees[0];

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
        </header>

        <main className="flex-1 flex flex-col">
          <Outlet />
        </main>

        <footer className="px-4 py-4 border-t-hairline flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <HardHat className="w-3.5 h-3.5" /> Field app
          </span>
          <Link to="/pipeline" className="inline-flex items-center gap-1 hover:text-foreground">
            <ArrowLeft className="w-3 h-3" /> Back to office
          </Link>
        </footer>
      </div>
    </div>
  );
}
