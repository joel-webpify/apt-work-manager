import { useState } from "react";
import { Plus, Trash2, Crown } from "lucide-react";
import { employees } from "@/data/mockData";
import { addTeam, removeTeam, updateTeam, useTeams } from "@/lib/teamsStore";
import { Btn } from "@/components/layout/PageShell";
import { Input } from "@/components/ui/input";

const COLORS = ["32 90% 50%", "200 80% 45%", "150 55% 40%", "280 50% 55%", "350 70% 55%", "210 15% 45%"];

export default function TeamsTab() {
  const teams = useTeams();
  const [name, setName] = useState("");

  return (
    <div className="max-w-3xl space-y-4">
      <p className="text-sm text-muted-foreground">
        Crews that usually go out together. Drop a job on a team in the schedule and everyone is booked at the same time.
      </p>

      <div className="flex gap-2">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Install crew A" className="max-w-xs" />
        <Btn
          onClick={() => {
            if (!name.trim()) return;
            addTeam({ name: name.trim(), color: COLORS[teams.length % COLORS.length], memberIds: [] });
            setName("");
          }}
        >
          <Plus className="w-3.5 h-3.5" /> Add team
        </Btn>
      </div>

      {teams.length === 0 && <p className="text-sm text-muted-foreground">No teams yet.</p>}

      {teams.map((t) => (
        <div key={t.id} data-team={t.id} className="rounded-lg border-hairline bg-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: `hsl(${t.color})` }} />
            <Input
              value={t.name}
              onChange={(e) => updateTeam(t.id, { name: e.target.value })}
              className="h-8 max-w-xs font-medium"
            />
            <div className="flex gap-1 ml-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label="Team colour"
                  onClick={() => updateTeam(t.id, { color: c })}
                  className={`w-4 h-4 rounded-full ${t.color === c ? "ring-2 ring-offset-1 ring-foreground/40" : ""}`}
                  style={{ backgroundColor: `hsl(${c})` }}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => removeTeam(t.id)}
              className="ml-auto text-muted-foreground hover:text-foreground"
              aria-label="Delete team"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {employees.map((e) => {
              const on = t.memberIds.includes(e.id);
              const lead = t.leadId === e.id;
              return (
                <span key={e.id} className="inline-flex">
                  <button
                    type="button"
                    onClick={() =>
                      updateTeam(t.id, {
                        memberIds: on ? t.memberIds.filter((x) => x !== e.id) : [...t.memberIds, e.id],
                        leadId: on && lead ? undefined : t.leadId,
                      })
                    }
                    className={`h-8 px-2.5 text-xs font-medium border-hairline ${on ? "rounded-l-md" : "rounded-md"} ${
                      on ? "bg-primary/10 text-foreground" : "text-muted-foreground hover:bg-surface-hover"
                    }`}
                  >
                    {e.name}
                  </button>
                  {on && (
                    <button
                      type="button"
                      title={lead ? "Team lead" : "Make team lead"}
                      onClick={() => updateTeam(t.id, { leadId: lead ? undefined : e.id })}
                      className={`h-8 px-1.5 rounded-r-md border-hairline border-l-0 ${
                        lead ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-surface-hover"
                      }`}
                    >
                      <Crown className="w-3 h-3" />
                    </button>
                  )}
                </span>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
