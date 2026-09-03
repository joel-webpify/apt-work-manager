import { Workflow as WorkflowIcon, Plus, Copy, Trash2, MoreHorizontal, Search } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PageHeader, PageBody, Btn, Pill } from "@/components/layout/PageShell";
import { Input } from "@/components/ui/input";
import {
  addWorkflow,
  deleteWorkflow,
  duplicateWorkflow,
  newWorkflow,
  triggerMeta,
  updateWorkflow,
  useWorkflows,
} from "@/lib/workflowsStore";
import { toast } from "@/hooks/use-toast";

export default function Workflows() {
  const workflows = useWorkflows();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "draft">("all");

  const filtered = workflows.filter((w) => {
    if (filter === "active" && !w.active) return false;
    if (filter === "draft" && w.active) return false;
    if (q && !w.name.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const create = () => {
    const w = newWorkflow();
    addWorkflow(w);
    navigate(`/automations/${w.id}`);
  };

  const activeCount = workflows.filter((w) => w.active).length;
  const totalRuns = workflows.reduce((s, w) => s + (w.runs?.length ?? 0), 0);

  return (
    <>
      <PageHeader
        title="Automations"
        description="Let the system do the repetitive jobs for you — follow-ups, reminders and updates."
        actions={
          <Btn variant="primary" onClick={create}>
            <Plus className="w-3.5 h-3.5" /> New automation
          </Btn>
        }
      />
      <PageBody>
        {/* KPIs */}
        <div className="grid grid-cols-3 gap-3 mb-4 max-w-2xl">
          <div className="border-hairline rounded-lg bg-card p-3">
            <div className="text-xs text-muted-foreground">Automations</div>
            <div className="text-xl font-medium">{workflows.length}</div>
          </div>
          <div className="border-hairline rounded-lg bg-card p-3">
            <div className="text-xs text-muted-foreground">Switched on</div>
            <div className="text-xl font-medium">{activeCount}</div>
          </div>
          <div className="border-hairline rounded-lg bg-card p-3">
            <div className="text-xs text-muted-foreground">Times they have run</div>
            <div className="text-xl font-medium">{totalRuns}</div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 mb-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search workflows"
              className="h-8 pl-8 text-sm"
            />
          </div>
          <div className="flex border-hairline rounded-md overflow-hidden">
            {(["all", "active", "draft"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`h-8 px-3 text-xs capitalize transition-colors ${
                  filter === f ? "bg-surface text-foreground font-medium" : "text-muted-foreground hover:bg-surface-hover"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="border-hairline rounded-lg bg-surface overflow-hidden">
          <div className="grid grid-cols-[1fr_220px_100px_120px_60px_100px] px-4 h-9 border-b-hairline text-xs text-muted-foreground items-center">
            <div>Name</div>
            <div>Trigger</div>
            <div>Steps</div>
            <div>Status</div>
            <div className="text-right">Times run</div>
            <div />
          </div>
          {filtered.map((w) => {
            const tmeta = triggerMeta[w.trigger];
            const runs = w.runs?.length ?? 0;
            return (
              <div
                key={w.id}
                className="grid grid-cols-[1fr_220px_100px_120px_60px_100px] px-4 h-14 border-b-hairline last:border-b-0 items-center text-sm hover:bg-surface-hover cursor-pointer group"
                onClick={() => navigate(`/automations/${w.id}`)}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                    <WorkflowIcon className="w-3.5 h-3.5 text-primary" strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium truncate">{w.name}</div>
                    {w.description && (
                      <div className="text-xs text-muted-foreground truncate">{w.description}</div>
                    )}
                  </div>
                </div>
                <div className="text-muted-foreground text-xs truncate">
                  <span className="text-[10px] uppercase tracking-wide">{tmeta.group}</span>
                  <span className="mx-1">·</span>
                  {tmeta.label}
                </div>
                <div className="text-xs">{w.actions.length}</div>
                <div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateWorkflow(w.id, { active: !w.active });
                      toast({ title: !w.active ? "Activated" : "Paused" });
                    }}
                    className="inline-flex items-center gap-2"
                  >
                    <span className={`relative w-8 h-4 rounded-full transition-colors ${w.active ? "bg-primary" : "bg-surface border-hairline"}`}>
                      <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${w.active ? "translate-x-4" : "translate-x-0.5"}`} />
                    </span>
                    <Pill tone={w.active ? "success" : "neutral"}>{w.active ? "on" : "off"}</Pill>
                  </button>
                </div>
                <div className="text-right text-xs text-muted-foreground">{runs || "—"}</div>
                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const copy = duplicateWorkflow(w.id);
                      if (copy) toast({ title: "Duplicated" });
                    }}
                    className="w-7 h-7 rounded hover:bg-surface flex items-center justify-center"
                    title="Duplicate"
                  >
                    <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!confirm(`Delete "${w.name}"?`)) return;
                      deleteWorkflow(w.id);
                      toast({ title: "Deleted" });
                    }}
                    className="w-7 h-7 rounded hover:bg-destructive/10 flex items-center justify-center"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </button>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="p-10 text-center text-sm text-muted-foreground">
              {workflows.length === 0
                ? "No workflows yet. Create one to automate cross-module actions."
                : "No workflows match your search."}
            </div>
          )}
        </div>

        {/* Recipes */}
        <div className="mt-8">
          <div className="flex items-end justify-between mb-3">
            <div>
              <div className="text-sm font-medium">Ready-made recipes</div>
              <div className="text-xs text-muted-foreground">Pick one and we set it up for you — nothing goes live until you switch it on.</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {(["All", ...categories] as const).map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`h-7 px-2.5 rounded-full text-xs border-hairline transition-colors ${
                  cat === c ? "bg-primary text-primary-foreground border-transparent" : "bg-card text-muted-foreground hover:bg-surface-hover"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {recipes.map((t) => (
              <div key={t.id} className="border-hairline rounded-lg bg-card p-4 flex flex-col gap-2">
                <div className="flex items-start gap-2">
                  <div className="w-7 h-7 rounded-md bg-amber-500/10 flex items-center justify-center shrink-0">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{t.name}</div>
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{t.category}</div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground flex-1">{t.blurb}</p>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-muted-foreground">
                    {triggerMeta[t.trigger].label} · {t.actions.length} steps
                  </span>
                  <Btn onClick={() => useRecipe(t)}>
                    <Plus className="w-3.5 h-3.5" /> Use this
                  </Btn>
                </div>
              </div>
            ))}
          </div>
        </div>

      </PageBody>
    </>
  );
}
