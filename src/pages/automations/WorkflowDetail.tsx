import { useMemo, useState, useEffect } from "react";
import { useNavigate, useParams, Link, Navigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Mail,
  Clock,
  Tag,
  TagIcon,
  CheckSquare,
  GitBranch,
  Briefcase,
  Move,
  UserPlus,
  Bell,
  Webhook,
  Zap,
  Repeat,
  Copy,
  History,
  Sparkles,
  ChevronRight,
  Check,
  X,
} from "lucide-react";
import { PageHeader, PageBody, Btn, Pill } from "@/components/layout/PageShell";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import {
  actionMeta,
  deleteWorkflow,
  duplicateWorkflow,
  findWorkflow,
  triggerMeta,
  updateWorkflow,
  useWorkflows,
  type Workflow,
  type WorkflowAction,
  type WorkflowActionType,
  type WorkflowCondition,
  type WorkflowTrigger,
} from "@/lib/workflowsStore";
import { useStages } from "@/lib/stagesStore";

const actionIcons: Record<WorkflowActionType, typeof Mail> = {
  send_email: Mail,
  send_sequence: Repeat,
  notify_team: Bell,
  add_tag: Tag,
  remove_tag: TagIcon,
  assign_owner: UserPlus,
  create_task: CheckSquare,
  create_job: Briefcase,
  move_stage: Move,
  wait: Clock,
  branch: GitBranch,
  webhook: Webhook,
};

const actionTones: Record<WorkflowActionType, string> = {
  send_email: "text-blue-500 bg-blue-500/10",
  send_sequence: "text-blue-500 bg-blue-500/10",
  notify_team: "text-sky-500 bg-sky-500/10",
  add_tag: "text-purple-500 bg-purple-500/10",
  remove_tag: "text-purple-500 bg-purple-500/10",
  assign_owner: "text-purple-500 bg-purple-500/10",
  create_task: "text-emerald-500 bg-emerald-500/10",
  create_job: "text-emerald-500 bg-emerald-500/10",
  move_stage: "text-emerald-500 bg-emerald-500/10",
  wait: "text-amber-500 bg-amber-500/10",
  branch: "text-pink-500 bg-pink-500/10",
  webhook: "text-slate-500 bg-slate-500/10",
};

const uid = (p = "a") => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

const newCondition = (): WorkflowCondition => ({
  id: uid("c"),
  field: "contact.tag",
  op: "equals",
  value: "",
});

const newAction = (type: WorkflowActionType): WorkflowAction => {
  const id = uid("a");
  switch (type) {
    case "send_email":
      return { id, type, emailSubject: "New email", emailTemplate: "default" };
    case "send_sequence":
      return { id, type, sequenceId: "" };
    case "notify_team":
      return { id, type, notifyChannel: "in_app", notifyRecipients: "sales", notifyMessage: "" };
    case "add_tag":
    case "remove_tag":
      return { id, type, tag: "" };
    case "assign_owner":
      return { id, type, ownerId: "owner" };
    case "create_task":
      return { id, type, taskTitle: "Follow up", taskAssignee: "owner", taskDueInDays: 2 };
    case "create_job":
      return { id, type, jobService: "New service", jobPipelineStage: "New lead" };
    case "move_stage":
      return { id, type, targetStage: "" };
    case "wait":
      return { id, type, waitAmount: 1, waitUnit: "days" };
    case "webhook":
      return { id, type, webhookUrl: "", webhookMethod: "POST" };
    case "branch":
      return {
        id,
        type,
        branchLabel: "Condition met?",
        branchCondition: newCondition(),
        ifActions: [],
        elseActions: [],
      };
  }
};

// ───────── Recursive action list editor ─────────
function ActionListEditor({
  actions,
  onChange,
  stageNames,
  depth = 0,
}: {
  actions: WorkflowAction[];
  onChange: (next: WorkflowAction[]) => void;
  stageNames: string[];
  depth?: number;
}) {
  const update = (id: string, patch: Partial<WorkflowAction>) =>
    onChange(actions.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  const remove = (id: string) => onChange(actions.filter((a) => a.id !== id));
  const move = (id: string, dir: -1 | 1) => {
    const i = actions.findIndex((a) => a.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= actions.length) return;
    const next = [...actions];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const add = (t: WorkflowActionType) => onChange([...actions, newAction(t)]);

  return (
    <div className="space-y-2">
      {actions.map((a, idx) => {
        const Icon = actionIcons[a.type];
        return (
          <div key={a.id} className="rounded-lg border-hairline bg-card overflow-hidden">
            <div className="flex items-center gap-2 px-3 h-9 border-b-hairline bg-surface/40">
              <div className={`w-6 h-6 rounded flex items-center justify-center ${actionTones[a.type]}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-medium flex-1">
                Step {idx + 1} · {actionMeta[a.type].label}
              </span>
              <button
                onClick={() => move(a.id, -1)}
                disabled={idx === 0}
                className="w-6 h-6 rounded hover:bg-surface disabled:opacity-30 flex items-center justify-center"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => move(a.id, 1)}
                disabled={idx === actions.length - 1}
                className="w-6 h-6 rounded hover:bg-surface disabled:opacity-30 flex items-center justify-center"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => remove(a.id)}
                className="w-6 h-6 rounded hover:bg-destructive/10 text-destructive flex items-center justify-center"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="p-3 space-y-2">
              {a.type === "send_email" && (
                <>
                  <Input
                    value={a.emailSubject ?? ""}
                    onChange={(e) => update(a.id, { emailSubject: e.target.value })}
                    className="h-8 text-xs"
                    placeholder="Email subject"
                  />
                  <Select value={a.emailTemplate ?? "default"} onValueChange={(v) => update(a.id, { emailTemplate: v })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default template</SelectItem>
                      <SelectItem value="review_request">Review request</SelectItem>
                      <SelectItem value="winback">Win-back offer</SelectItem>
                      <SelectItem value="reminder">Reminder</SelectItem>
                      <SelectItem value="welcome">Welcome</SelectItem>
                    </SelectContent>
                  </Select>
                </>
              )}
              {a.type === "send_sequence" && (
                <Select value={a.sequenceId ?? ""} onValueChange={(v) => update(a.id, { sequenceId: v })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select sequence" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new-lead">New lead nurture (5 steps)</SelectItem>
                    <SelectItem value="post-job">Post-job review (2 steps)</SelectItem>
                    <SelectItem value="reactivation">Reactivation (4 steps)</SelectItem>
                  </SelectContent>
                </Select>
              )}
              {a.type === "notify_team" && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={a.notifyChannel ?? "in_app"} onValueChange={(v) => update(a.id, { notifyChannel: v as WorkflowAction["notifyChannel"] })}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="in_app">In-app</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="slack">Slack</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      value={a.notifyRecipients ?? ""}
                      onChange={(e) => update(a.id, { notifyRecipients: e.target.value })}
                      className="h-8 text-xs"
                      placeholder="Recipients (team or email)"
                    />
                  </div>
                  <Input
                    value={a.notifyMessage ?? ""}
                    onChange={(e) => update(a.id, { notifyMessage: e.target.value })}
                    className="h-8 text-xs"
                    placeholder="Message"
                  />
                </>
              )}
              {(a.type === "add_tag" || a.type === "remove_tag") && (
                <Input
                  value={a.tag ?? ""}
                  onChange={(e) => update(a.id, { tag: e.target.value })}
                  className="h-8 text-xs"
                  placeholder="Tag name"
                />
              )}
              {a.type === "assign_owner" && (
                <Select value={a.ownerId ?? "owner"} onValueChange={(v) => update(a.id, { ownerId: v })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owner">Current owner</SelectItem>
                    <SelectItem value="round_robin">Round robin (sales)</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              )}
              {a.type === "create_task" && (
                <>
                  <Input
                    value={a.taskTitle ?? ""}
                    onChange={(e) => update(a.id, { taskTitle: e.target.value })}
                    className="h-8 text-xs"
                    placeholder="Task title"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={a.taskAssignee ?? "owner"} onValueChange={(v) => update(a.id, { taskAssignee: v })}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="owner">Contact owner</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="sales">Sales team</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={0}
                        value={a.taskDueInDays ?? 1}
                        onChange={(e) => update(a.id, { taskDueInDays: Number(e.target.value) })}
                        className="h-8 text-xs"
                      />
                      <span className="text-xs text-muted-foreground shrink-0">days out</span>
                    </div>
                  </div>
                </>
              )}
              {a.type === "create_job" && (
                <>
                  <Input
                    value={a.jobService ?? ""}
                    onChange={(e) => update(a.id, { jobService: e.target.value })}
                    className="h-8 text-xs"
                    placeholder="Service name"
                  />
                  <Select value={a.jobPipelineStage ?? stageNames[0] ?? ""} onValueChange={(v) => update(a.id, { jobPipelineStage: v })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Starting stage" /></SelectTrigger>
                    <SelectContent>
                      {stageNames.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </>
              )}
              {a.type === "move_stage" && (
                <Select value={a.targetStage ?? ""} onValueChange={(v) => update(a.id, { targetStage: v })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Target stage" /></SelectTrigger>
                  <SelectContent>
                    {stageNames.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              {a.type === "wait" && (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    value={a.waitAmount ?? 1}
                    onChange={(e) => update(a.id, { waitAmount: Number(e.target.value) })}
                    className="h-8 text-xs w-20"
                  />
                  <Select value={a.waitUnit ?? "days"} onValueChange={(v) => update(a.id, { waitUnit: v as WorkflowAction["waitUnit"] })}>
                    <SelectTrigger className="h-8 text-xs w-[120px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minutes">minutes</SelectItem>
                      <SelectItem value="hours">hours</SelectItem>
                      <SelectItem value="days">days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              {a.type === "webhook" && (
                <>
                  <div className="flex items-center gap-2">
                    <Select value={a.webhookMethod ?? "POST"} onValueChange={(v) => update(a.id, { webhookMethod: v as WorkflowAction["webhookMethod"] })}>
                      <SelectTrigger className="h-8 text-xs w-[90px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="POST">POST</SelectItem>
                        <SelectItem value="GET">GET</SelectItem>
                        <SelectItem value="PUT">PUT</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      value={a.webhookUrl ?? ""}
                      onChange={(e) => update(a.id, { webhookUrl: e.target.value })}
                      className="h-8 text-xs flex-1"
                      placeholder="https://…"
                    />
                  </div>
                </>
              )}
              {a.type === "branch" && (
                <div className="space-y-3">
                  <Input
                    value={a.branchLabel ?? ""}
                    onChange={(e) => update(a.id, { branchLabel: e.target.value })}
                    className="h-8 text-xs"
                    placeholder="Branch label"
                  />
                  <div className="rounded-md bg-surface/40 p-2 space-y-2">
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">If condition</div>
                    <div className="grid grid-cols-[1fr_110px_1fr] gap-2">
                      <Select
                        value={a.branchCondition?.field ?? "contact.tag"}
                        onValueChange={(v) => update(a.id, { branchCondition: { ...(a.branchCondition ?? newCondition()), field: v } })}
                      >
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="contact.tag">Contact tag</SelectItem>
                          <SelectItem value="contact.lifecycle">Lifecycle stage</SelectItem>
                          <SelectItem value="contact.source">Lead source</SelectItem>
                          <SelectItem value="contact.totalSpend">Total spend</SelectItem>
                          <SelectItem value="job.value">Job value (£)</SelectItem>
                          <SelectItem value="job.stage">Job stage</SelectItem>
                          <SelectItem value="quote.status">Quote status</SelectItem>
                          <SelectItem value="email.opened">Email opened</SelectItem>
                          <SelectItem value="email.clicked">Email clicked</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select
                        value={a.branchCondition?.op ?? "equals"}
                        onValueChange={(v) => update(a.id, { branchCondition: { ...(a.branchCondition ?? newCondition()), op: v as WorkflowCondition["op"] } })}
                      >
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="equals">equals</SelectItem>
                          <SelectItem value="not_equals">not equals</SelectItem>
                          <SelectItem value="contains">contains</SelectItem>
                          <SelectItem value="greater_than">&gt;</SelectItem>
                          <SelectItem value="less_than">&lt;</SelectItem>
                          <SelectItem value="is_set">is set</SelectItem>
                          <SelectItem value="is_empty">is empty</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        value={a.branchCondition?.value ?? ""}
                        onChange={(e) => update(a.id, { branchCondition: { ...(a.branchCondition ?? newCondition()), value: e.target.value } })}
                        className="h-8 text-xs"
                        placeholder="Value"
                      />
                    </div>
                  </div>

                  <div className="rounded-md border-l-2 border-emerald-500/60 pl-3 space-y-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                      <Check className="w-3 h-3" /> If true
                    </div>
                    {(a.ifActions?.length ?? 0) > 0 && (
                      <ActionListEditor
                        actions={a.ifActions ?? []}
                        onChange={(next) => update(a.id, { ifActions: next })}
                        stageNames={stageNames}
                        depth={depth + 1}
                      />
                    )}
                    <AddActionMenu compact onAdd={(t) => update(a.id, { ifActions: [...(a.ifActions ?? []), newAction(t)] })} allowBranch={depth < 2} />
                  </div>

                  <div className="rounded-md border-l-2 border-rose-500/60 pl-3 space-y-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-rose-600 dark:text-rose-400">
                      <X className="w-3 h-3" /> If false
                    </div>
                    {(a.elseActions?.length ?? 0) > 0 && (
                      <ActionListEditor
                        actions={a.elseActions ?? []}
                        onChange={(next) => update(a.id, { elseActions: next })}
                        stageNames={stageNames}
                        depth={depth + 1}
                      />
                    )}
                    <AddActionMenu compact onAdd={(t) => update(a.id, { elseActions: [...(a.elseActions ?? []), newAction(t)] })} allowBranch={depth < 2} />
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
      {actions.length === 0 && (
        <div className="p-6 text-center text-sm text-muted-foreground border-hairline border-dashed rounded-lg">
          No steps yet — add your first action below.
        </div>
      )}
      <AddActionMenu onAdd={add} allowBranch={depth < 2} />
    </div>
  );
}

function AddActionMenu({
  onAdd,
  compact = false,
  allowBranch = true,
}: {
  onAdd: (t: WorkflowActionType) => void;
  compact?: boolean;
  allowBranch?: boolean;
}) {
  const groups = useMemo(() => {
    const g: Record<string, WorkflowActionType[]> = {};
    (Object.keys(actionMeta) as WorkflowActionType[]).forEach((t) => {
      if (!allowBranch && t === "branch") return;
      const grp = actionMeta[t].group;
      (g[grp] ||= []).push(t);
    });
    return g;
  }, [allowBranch]);

  return (
    <Select onValueChange={(v) => onAdd(v as WorkflowActionType)} value="">
      <SelectTrigger className={compact ? "h-8 text-xs w-[180px]" : "h-9 text-xs w-[200px]"}>
        <Plus className="w-3.5 h-3.5 mr-1" />
        <SelectValue placeholder="Add step" />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(groups).map(([grp, types]) => (
          <div key={grp}>
            <div className="px-2 pt-1.5 pb-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">{grp}</div>
            {types.map((t) => {
              const Icon = actionIcons[t];
              return (
                <SelectItem key={t} value={t}>
                  <span className="inline-flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5" />
                    {actionMeta[t].label}
                  </span>
                </SelectItem>
              );
            })}
          </div>
        ))}
      </SelectContent>
    </Select>
  );
}

// ───────── Flow preview (right column) ─────────
function FlowActions({ actions }: { actions: WorkflowAction[] }) {
  return (
    <div className="space-y-1.5">
      {actions.map((a) => {
        const Icon = actionIcons[a.type];
        let summary = "";
        if (a.type === "send_email") summary = a.emailSubject || "Untitled email";
        else if (a.type === "send_sequence") summary = a.sequenceId || "(pick sequence)";
        else if (a.type === "notify_team") summary = `${a.notifyChannel} → ${a.notifyRecipients || "team"}`;
        else if (a.type === "add_tag") summary = a.tag ? `+ ${a.tag}` : "(no tag)";
        else if (a.type === "remove_tag") summary = a.tag ? `− ${a.tag}` : "(no tag)";
        else if (a.type === "assign_owner") summary = a.ownerId || "";
        else if (a.type === "create_task") summary = a.taskTitle || "Task";
        else if (a.type === "create_job") summary = a.jobService || "Job";
        else if (a.type === "move_stage") summary = `→ ${a.targetStage || "(stage)"}`;
        else if (a.type === "wait") summary = `${a.waitAmount ?? 1} ${a.waitUnit ?? "days"}`;
        else if (a.type === "webhook") summary = `${a.webhookMethod} ${a.webhookUrl || "(url)"}`;
        else if (a.type === "branch") summary = a.branchLabel || "Branch";

        if (a.type === "branch") {
          return (
            <div key={a.id}>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-card border-hairline">
                <div className={`w-6 h-6 rounded flex items-center justify-center ${actionTones[a.type]}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-medium truncate">{summary}</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 mt-1.5">
                <div className="rounded-md border-hairline bg-emerald-500/[0.04] p-1.5">
                  <div className="text-[9px] font-medium uppercase text-emerald-600 dark:text-emerald-400 mb-1">If true</div>
                  {(a.ifActions?.length ?? 0) === 0
                    ? <div className="text-[10px] text-muted-foreground italic">(no steps)</div>
                    : <FlowActions actions={a.ifActions ?? []} />}
                </div>
                <div className="rounded-md border-hairline bg-rose-500/[0.04] p-1.5">
                  <div className="text-[9px] font-medium uppercase text-rose-600 dark:text-rose-400 mb-1">If false</div>
                  {(a.elseActions?.length ?? 0) === 0
                    ? <div className="text-[10px] text-muted-foreground italic">(no steps)</div>
                    : <FlowActions actions={a.elseActions ?? []} />}
                </div>
              </div>
            </div>
          );
        }
        return (
          <div key={a.id} className="flex items-center gap-2 p-2 rounded-lg bg-card border-hairline">
            <div className={`w-6 h-6 rounded flex items-center justify-center ${actionTones[a.type]}`}>
              <Icon className="w-3.5 h-3.5" />
            </div>
            <div className="text-xs truncate flex-1">
              <div className="font-medium">{actionMeta[a.type].label}</div>
              <div className="text-muted-foreground truncate">{summary}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ───────── Main page ─────────
export default function WorkflowDetail() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  useWorkflows(); // subscribe
  const existing = findWorkflow(id);
  const { stageNames } = useStages();

  const [draft, setDraft] = useState<Workflow>(() => {
    if (existing) return existing;
    const created = newWorkflow();
    addWorkflow(created);
    // Also update the URL silently by navigating (harmless here since we just added it)
    return { ...created, id };
  });
  const [tab, setTab] = useState<"build" | "history" | "settings">("build");

  const patch = (p: Partial<Workflow>) => setDraft((d) => ({ ...d, ...p }));
  const save = (silent = false) => {
    updateWorkflow(draft.id, draft);
    if (!silent) toast({ title: "Workflow saved" });
  };
  const toggleActive = () => {
    const next = !draft.active;
    patch({ active: next });
    updateWorkflow(draft.id, { active: next });
    toast({ title: next ? "Workflow activated" : "Workflow paused" });
  };
  const onDuplicate = () => {
    const copy = duplicateWorkflow(draft.id);
    if (copy) {
      toast({ title: "Duplicated" });
      navigate(`/automations/${copy.id}`);
    }
  };
  const onDelete = () => {
    if (!confirm("Delete this workflow?")) return;
    deleteWorkflow(draft.id);
    navigate("/automations");
  };

  const tmeta = triggerMeta[draft.trigger];

  return (
    <>
      <PageHeader
        title={draft.name}
        description={tmeta.label}
        actions={
          <div className="flex items-center gap-2">
            <Link to="/automations" className="h-8 px-2 rounded-md hover:bg-surface-hover inline-flex items-center gap-1 text-sm text-muted-foreground">
              <ArrowLeft className="w-3.5 h-3.5" /> All workflows
            </Link>
            <div className="flex items-center gap-2 pl-2 border-l-hairline">
              <span className="text-xs text-muted-foreground">{draft.active ? "Active" : "Paused"}</span>
              <Switch checked={draft.active} onCheckedChange={toggleActive} />
            </div>
            <Btn onClick={onDuplicate}><Copy className="w-3.5 h-3.5" /> Duplicate</Btn>
            <Btn onClick={onDelete}><Trash2 className="w-3.5 h-3.5" /> Delete</Btn>
            <Btn variant="primary" onClick={() => save()}>Save</Btn>
          </div>
        }
      />
      <PageBody>
        <div className="flex border-b-hairline mb-4 -mt-2">
          {([
            { id: "build", label: "Build", icon: Zap },
            { id: "history", label: "Run history", icon: History },
            { id: "settings", label: "Settings", icon: Sparkles },
          ] as const).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`h-9 px-3 text-sm inline-flex items-center gap-1.5 border-b-2 -mb-px transition-colors ${
                tab === t.id ? "border-primary text-foreground font-medium" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        {tab === "build" && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
            {/* Editor */}
            <div className="space-y-6">
              {/* Basics */}
              <section className="border-hairline rounded-lg bg-card p-4 space-y-3">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Details</div>
                <Input
                  value={draft.name}
                  onChange={(e) => patch({ name: e.target.value })}
                  onBlur={() => save(true)}
                  className="h-9 text-sm font-medium"
                  placeholder="Workflow name"
                />
                <Textarea
                  value={draft.description ?? ""}
                  onChange={(e) => patch({ description: e.target.value })}
                  onBlur={() => save(true)}
                  className="text-xs min-h-[60px]"
                  placeholder="Describe what this workflow does…"
                />
              </section>

              {/* Trigger */}
              <section className="border-hairline rounded-lg bg-card p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-amber-500/10 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">Trigger</div>
                    <div className="text-sm font-medium">When this happens…</div>
                  </div>
                </div>
                <Select value={draft.trigger} onValueChange={(v) => patch({ trigger: v as WorkflowTrigger, triggerConfig: {} })}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(
                      (Object.keys(triggerMeta) as WorkflowTrigger[]).reduce((acc, t) => {
                        (acc[triggerMeta[t].group] ||= []).push(t);
                        return acc;
                      }, {} as Record<string, WorkflowTrigger[]>),
                    ).map(([grp, ts]) => (
                      <div key={grp}>
                        <div className="px-2 pt-1.5 pb-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">{grp}</div>
                        {ts.map((t) => <SelectItem key={t} value={t}>{triggerMeta[t].label}</SelectItem>)}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">{tmeta.description}</p>

                {/* Trigger-specific config */}
                {draft.trigger === "job_stage_changed" && (
                  <div>
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Target stage</div>
                    <Select
                      value={(draft.triggerConfig?.stage as string) ?? "any"}
                      onValueChange={(v) => patch({ triggerConfig: { ...draft.triggerConfig, stage: v } })}
                    >
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any stage change</SelectItem>
                        {stageNames.map((s) => <SelectItem key={s} value={s}>Moved to "{s}"</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {draft.trigger === "tag_added" || draft.trigger === "tag_removed" ? (
                  <Input
                    value={(draft.triggerConfig?.tag as string) ?? ""}
                    onChange={(e) => patch({ triggerConfig: { ...draft.triggerConfig, tag: e.target.value } })}
                    className="h-8 text-xs"
                    placeholder="Tag name (leave blank for any)"
                  />
                ) : null}
                {draft.trigger === "no_activity_period" && (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={1}
                      value={(draft.triggerConfig?.days as number) ?? 30}
                      onChange={(e) => patch({ triggerConfig: { ...draft.triggerConfig, days: Number(e.target.value) } })}
                      className="h-8 text-xs w-24"
                    />
                    <span className="text-xs text-muted-foreground">days without activity</span>
                  </div>
                )}
                {draft.trigger === "date_scheduled" && (
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="date"
                      value={(draft.triggerConfig?.date as string) ?? ""}
                      onChange={(e) => patch({ triggerConfig: { ...draft.triggerConfig, date: e.target.value } })}
                      className="h-8 text-xs"
                    />
                    <Select
                      value={(draft.triggerConfig?.repeat as string) ?? "once"}
                      onValueChange={(v) => patch({ triggerConfig: { ...draft.triggerConfig, repeat: v } })}
                    >
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="once">Once</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {draft.trigger === "form_submitted" && (
                  <Select
                    value={(draft.triggerConfig?.formId as string) ?? "any"}
                    onValueChange={(v) => patch({ triggerConfig: { ...draft.triggerConfig, formId: v } })}
                  >
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any form</SelectItem>
                      <SelectItem value="contact">Contact form</SelectItem>
                      <SelectItem value="quote-request">Quote request</SelectItem>
                      <SelectItem value="booking">Booking</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </section>

              {/* Filters */}
              <section className="border-hairline rounded-lg bg-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">Filters</div>
                    <div className="text-sm font-medium">Only run when… (optional)</div>
                  </div>
                  <button
                    onClick={() => patch({ conditions: [...draft.conditions, newCondition()] })}
                    className="h-8 px-2 rounded-md hover:bg-surface-hover text-xs inline-flex items-center gap-1 text-primary"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add filter
                  </button>
                </div>
                {draft.conditions.length === 0 ? (
                  <div className="text-xs text-muted-foreground italic">No filters — runs on every trigger event.</div>
                ) : (
                  <div className="space-y-2">
                    {draft.conditions.map((c, i) => (
                      <div key={c.id} className="grid grid-cols-[60px_1fr_110px_1fr_auto] gap-2 items-center">
                        <span className="text-xs text-muted-foreground text-center">{i === 0 ? "IF" : "AND"}</span>
                        <Select
                          value={c.field}
                          onValueChange={(v) => patch({ conditions: draft.conditions.map((x) => x.id === c.id ? { ...x, field: v } : x) })}
                        >
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="contact.tag">Contact tag</SelectItem>
                            <SelectItem value="contact.lifecycle">Lifecycle</SelectItem>
                            <SelectItem value="contact.source">Lead source</SelectItem>
                            <SelectItem value="contact.totalSpend">Total spend</SelectItem>
                            <SelectItem value="job.value">Job value</SelectItem>
                            <SelectItem value="job.stage">Job stage</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select
                          value={c.op}
                          onValueChange={(v) => patch({ conditions: draft.conditions.map((x) => x.id === c.id ? { ...x, op: v as WorkflowCondition["op"] } : x) })}
                        >
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="equals">equals</SelectItem>
                            <SelectItem value="not_equals">not equals</SelectItem>
                            <SelectItem value="contains">contains</SelectItem>
                            <SelectItem value="greater_than">&gt;</SelectItem>
                            <SelectItem value="less_than">&lt;</SelectItem>
                            <SelectItem value="is_set">is set</SelectItem>
                            <SelectItem value="is_empty">is empty</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          value={c.value}
                          onChange={(e) => patch({ conditions: draft.conditions.map((x) => x.id === c.id ? { ...x, value: e.target.value } : x) })}
                          className="h-8 text-xs"
                          placeholder="Value"
                        />
                        <button
                          onClick={() => patch({ conditions: draft.conditions.filter((x) => x.id !== c.id) })}
                          className="w-8 h-8 rounded-md hover:bg-destructive/10 text-destructive flex items-center justify-center"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Actions */}
              <section className="border-hairline rounded-lg bg-card p-4 space-y-3">
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Actions</div>
                  <div className="text-sm font-medium">Do the following…</div>
                </div>
                <ActionListEditor
                  actions={draft.actions}
                  onChange={(next) => patch({ actions: next })}
                  stageNames={stageNames}
                />
              </section>
            </div>

            {/* Live flow preview */}
            <aside className="lg:sticky lg:top-4 h-fit space-y-2">
              <div className="text-xs uppercase tracking-wide text-muted-foreground px-1">Flow preview</div>
              <div className="border-hairline rounded-lg bg-surface/40 p-3 space-y-1.5">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-card border-hairline">
                  <div className="w-6 h-6 rounded flex items-center justify-center bg-amber-500/10">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                  <div className="text-xs truncate flex-1">
                    <div className="font-medium">Trigger</div>
                    <div className="text-muted-foreground truncate">{tmeta.label}</div>
                  </div>
                </div>
                {draft.conditions.length > 0 && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-card border-hairline">
                    <div className="w-6 h-6 rounded flex items-center justify-center bg-slate-500/10">
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                    <div className="text-xs truncate flex-1">
                      <div className="font-medium">Filters</div>
                      <div className="text-muted-foreground">{draft.conditions.length} condition{draft.conditions.length === 1 ? "" : "s"}</div>
                    </div>
                  </div>
                )}
                <FlowActions actions={draft.actions} />
                {draft.actions.length === 0 && (
                  <div className="text-xs text-muted-foreground italic px-2 py-3 text-center">No actions yet.</div>
                )}
              </div>
            </aside>
          </div>
        )}

        {tab === "history" && (
          <div className="border-hairline rounded-lg bg-card overflow-hidden max-w-3xl">
            <div className="grid grid-cols-[1fr_160px_120px] px-4 h-9 border-b-hairline text-xs text-muted-foreground items-center">
              <div>Contact / summary</div>
              <div>Started</div>
              <div>Status</div>
            </div>
            {(draft.runs ?? []).length === 0 ? (
              <div className="p-10 text-center text-sm text-muted-foreground">
                No runs yet. Once this workflow is active and its trigger fires, runs will appear here.
              </div>
            ) : (
              (draft.runs ?? []).map((r) => (
                <div key={r.id} className="grid grid-cols-[1fr_160px_120px] px-4 h-12 border-b-hairline last:border-b-0 items-center text-sm">
                  <div>
                    <div className="font-medium">{r.contact ?? "—"}</div>
                    <div className="text-xs text-muted-foreground truncate">{r.summary}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">{new Date(r.startedAt).toLocaleString()}</div>
                  <div>
                    <Pill tone={r.status === "completed" ? "success" : r.status === "failed" ? "danger" : "info"}>
                      {r.status}
                    </Pill>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === "settings" && (
          <div className="max-w-2xl space-y-4">
            <section className="border-hairline rounded-lg bg-card p-4 space-y-3">
              <div className="text-sm font-medium">Enrollment</div>
              <label className="flex items-center gap-3 text-sm">
                <Switch
                  checked={(draft.triggerConfig?.reEnroll as string) === "true"}
                  onCheckedChange={(v) => patch({ triggerConfig: { ...draft.triggerConfig, reEnroll: v ? "true" : "false" } })}
                />
                Allow re-enrollment (contact can enter this workflow more than once)
              </label>
              <label className="flex items-center gap-3 text-sm">
                <Switch
                  checked={(draft.triggerConfig?.skipWeekends as string) === "true"}
                  onCheckedChange={(v) => patch({ triggerConfig: { ...draft.triggerConfig, skipWeekends: v ? "true" : "false" } })}
                />
                Only send communications on business days
              </label>
            </section>
            <section className="border-hairline rounded-lg bg-card p-4 space-y-3">
              <div className="text-sm font-medium">Goal (optional)</div>
              <p className="text-xs text-muted-foreground">If a contact hits the goal, they exit the workflow early.</p>
              <Select
                value={(draft.triggerConfig?.goal as string) ?? "none"}
                onValueChange={(v) => patch({ triggerConfig: { ...draft.triggerConfig, goal: v } })}
              >
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No goal</SelectItem>
                  <SelectItem value="quote_accepted">Quote accepted</SelectItem>
                  <SelectItem value="invoice_paid">Invoice paid</SelectItem>
                  <SelectItem value="job_created">Job created</SelectItem>
                  <SelectItem value="tag_added">Tag added</SelectItem>
                </SelectContent>
              </Select>
            </section>
            <div className="flex justify-end">
              <Btn variant="primary" onClick={() => save()}>Save settings</Btn>
            </div>
          </div>
        )}
      </PageBody>
    </>
  );
}
