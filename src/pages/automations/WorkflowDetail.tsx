import { useMemo, useState, useEffect } from "react";
import { useNavigate, useParams, Link, Navigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Mail,
  MessageSquare,
  Clock,
  Hourglass,
  Sun,
  Tag,
  TagIcon,
  ListPlus,
  ListMinus,
  Pencil,
  StickyNote,
  CheckSquare,
  GitBranch,
  SplitSquareHorizontal,
  Briefcase,
  Move,
  UserPlus,
  Bell,
  BellRing,
  FileText,
  Receipt,
  PoundSterling,
  CalendarPlus,
  StopCircle,
  Webhook,
  Zap,
  Repeat,
  Copy,
  History,
  Sparkles,
  ChevronRight,
  Check,
  X,
  AlertTriangle,
  FlaskConical,
} from "lucide-react";
import { PageHeader, PageBody, Btn, Pill } from "@/components/layout/PageShell";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import {
  actionMeta,
  checkWorkflow,
  conditionFields,
  conditionOps,
  countSteps,
  defaultSettings,
  deleteWorkflow,
  duplicateWorkflow,
  findWorkflow,
  segmentOptions,
  triggerMeta,
  updateWorkflow,
  useWorkflows,
  workflowStats,
  type Workflow,
  type WorkflowAction,
  type WorkflowActionType,
  type WorkflowCondition,
  type WorkflowSettings,
  type WorkflowTrigger,
} from "@/lib/workflowsStore";
import { useStages } from "@/lib/stagesStore";
import { TestRunDialog } from "@/components/automations/TestRunDialog";

const actionIcons: Record<WorkflowActionType, typeof Mail> = {
  send_email: Mail,
  send_sms: MessageSquare,
  send_sequence: Repeat,
  notify_team: Bell,
  remind_owner: BellRing,
  add_tag: Tag,
  remove_tag: TagIcon,
  add_to_segment: ListPlus,
  remove_from_segment: ListMinus,
  assign_owner: UserPlus,
  update_field: Pencil,
  add_note: StickyNote,
  create_task: CheckSquare,
  create_job: Briefcase,
  move_stage: Move,
  send_quote: FileText,
  send_invoice: Receipt,
  payment_reminder: PoundSterling,
  book_visit: CalendarPlus,
  wait: Clock,
  wait_until: Hourglass,
  wait_for_good_time: Sun,
  branch: GitBranch,
  ab_split: SplitSquareHorizontal,
  exit: StopCircle,
  webhook: Webhook,
};

const actionTones: Record<WorkflowActionType, string> = {
  send_email: "text-blue-500 bg-blue-500/10",
  send_sms: "text-blue-500 bg-blue-500/10",
  send_sequence: "text-blue-500 bg-blue-500/10",
  notify_team: "text-sky-500 bg-sky-500/10",
  remind_owner: "text-sky-500 bg-sky-500/10",
  add_tag: "text-purple-500 bg-purple-500/10",
  remove_tag: "text-purple-500 bg-purple-500/10",
  add_to_segment: "text-purple-500 bg-purple-500/10",
  remove_from_segment: "text-purple-500 bg-purple-500/10",
  assign_owner: "text-purple-500 bg-purple-500/10",
  update_field: "text-purple-500 bg-purple-500/10",
  add_note: "text-purple-500 bg-purple-500/10",
  create_task: "text-emerald-500 bg-emerald-500/10",
  create_job: "text-emerald-500 bg-emerald-500/10",
  move_stage: "text-emerald-500 bg-emerald-500/10",
  send_quote: "text-teal-500 bg-teal-500/10",
  send_invoice: "text-teal-500 bg-teal-500/10",
  payment_reminder: "text-teal-500 bg-teal-500/10",
  book_visit: "text-emerald-500 bg-emerald-500/10",
  wait: "text-amber-500 bg-amber-500/10",
  wait_until: "text-amber-500 bg-amber-500/10",
  wait_for_good_time: "text-amber-500 bg-amber-500/10",
  branch: "text-pink-500 bg-pink-500/10",
  ab_split: "text-pink-500 bg-pink-500/10",
  exit: "text-rose-500 bg-rose-500/10",
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
    case "send_sms":
      return { id, type, smsMessage: "" };
    case "send_sequence":
      return { id, type, sequenceId: "" };
    case "notify_team":
      return { id, type, notifyChannel: "in_app", notifyRecipients: "sales", notifyMessage: "" };
    case "remind_owner":
      return { id, type, reminderMessage: "", reminderInMinutes: 30 };
    case "add_tag":
    case "remove_tag":
      return { id, type, tag: "" };
    case "add_to_segment":
    case "remove_from_segment":
      return { id, type, segmentId: segmentOptions[0].value };
    case "assign_owner":
      return { id, type, ownerId: "owner" };
    case "update_field":
      return { id, type, fieldTarget: "contact", fieldName: "source", fieldValue: "" };
    case "add_note":
      return { id, type, noteText: "" };
    case "create_task":
      return { id, type, taskTitle: "Follow up", taskAssignee: "owner", taskDueInDays: 2 };
    case "create_job":
      return { id, type, jobService: "New service", jobPipelineStage: "New lead" };
    case "move_stage":
      return { id, type, targetStage: "" };
    case "send_quote":
      return { id, type, quoteTemplate: "standard" };
    case "send_invoice":
      return { id, type, invoiceTemplate: "standard", invoiceDueInDays: 14 };
    case "payment_reminder":
      return { id, type, paymentReminderTone: "friendly" };
    case "book_visit":
      return { id, type, visitWhen: "next_available", visitInDays: 3, visitDurationMins: 60 };
    case "wait":
      return { id, type, waitAmount: 1, waitUnit: "days" };
    case "wait_until":
      return { id, type, untilCondition: newCondition(), untilMaxDays: 7 };
    case "wait_for_good_time":
      return { id, type, goodTimeWindow: "business_hours" };
    case "exit":
      return { id, type, exitReason: "" };
    case "webhook":
      return { id, type, webhookUrl: "", webhookMethod: "POST" };
    case "ab_split":
      return { id, type, abLabel: "Two versions", abSplit: 50, aActions: [], bActions: [] };
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

// Small reusable condition row used by branches and "wait until"
function ConditionRow({
  value,
  onChange,
}: {
  value: WorkflowCondition;
  onChange: (next: WorkflowCondition) => void;
}) {
  const needsValue = !["is_set", "is_empty"].includes(value.op);
  return (
    <div className={`grid gap-2 ${needsValue ? "grid-cols-[1fr_110px_1fr]" : "grid-cols-[1fr_110px]"}`}>
      <Select value={value.field} onValueChange={(v) => onChange({ ...value, field: v })}>
        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>
          {conditionFields.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={value.op} onValueChange={(v) => onChange({ ...value, op: v as WorkflowCondition["op"] })}>
        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>
          {conditionOps.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
        </SelectContent>
      </Select>
      {needsValue && (
        <Input
          value={value.value}
          onChange={(e) => onChange({ ...value, value: e.target.value })}
          className="h-8 text-xs"
          placeholder="Value"
        />
      )}
    </div>
  );
}


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
              {a.type === "send_sms" && (
                <>
                  <Textarea
                    value={a.smsMessage ?? ""}
                    onChange={(e) => update(a.id, { smsMessage: e.target.value })}
                    className="text-xs min-h-[60px]"
                    placeholder="Hi {{first_name}}, …"
                  />
                  <div className="text-[10px] text-muted-foreground">
                    {(a.smsMessage ?? "").length}/160 characters · {"{{first_name}}"} and {"{{company}}"} are filled in automatically
                  </div>
                </>
              )}
              {a.type === "remind_owner" && (
                <>
                  <Input
                    value={a.reminderMessage ?? ""}
                    onChange={(e) => update(a.id, { reminderMessage: e.target.value })}
                    className="h-8 text-xs"
                    placeholder="What should they be reminded to do?"
                  />
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      value={a.reminderInMinutes ?? 30}
                      onChange={(e) => update(a.id, { reminderInMinutes: Number(e.target.value) })}
                      className="h-8 text-xs w-24"
                    />
                    <span className="text-xs text-muted-foreground">minutes from now</span>
                  </div>
                </>
              )}
              {(a.type === "add_to_segment" || a.type === "remove_from_segment") && (
                <Select value={a.segmentId ?? ""} onValueChange={(v) => update(a.id, { segmentId: v })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Pick a list" /></SelectTrigger>
                  <SelectContent>
                    {segmentOptions.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              {a.type === "update_field" && (
                <div className="grid grid-cols-3 gap-2">
                  <Select value={a.fieldTarget ?? "contact"} onValueChange={(v) => update(a.id, { fieldTarget: v as WorkflowAction["fieldTarget"] })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contact">On the contact</SelectItem>
                      <SelectItem value="job">On the job</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    value={a.fieldName ?? ""}
                    onChange={(e) => update(a.id, { fieldName: e.target.value })}
                    className="h-8 text-xs"
                    placeholder="Detail (e.g. source)"
                  />
                  <Input
                    value={a.fieldValue ?? ""}
                    onChange={(e) => update(a.id, { fieldValue: e.target.value })}
                    className="h-8 text-xs"
                    placeholder="New value"
                  />
                </div>
              )}
              {a.type === "add_note" && (
                <Textarea
                  value={a.noteText ?? ""}
                  onChange={(e) => update(a.id, { noteText: e.target.value })}
                  className="text-xs min-h-[54px]"
                  placeholder="Note to drop on the timeline"
                />
              )}
              {a.type === "send_quote" && (
                <Select value={a.quoteTemplate ?? "standard"} onValueChange={(v) => update(a.id, { quoteTemplate: v })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard quote</SelectItem>
                    <SelectItem value="extra-work">Extra work found on site</SelectItem>
                    <SelectItem value="service-plan">Service plan</SelectItem>
                    <SelectItem value="options">Quote with options to choose</SelectItem>
                  </SelectContent>
                </Select>
              )}
              {a.type === "send_invoice" && (
                <div className="grid grid-cols-2 gap-2">
                  <Select value={a.invoiceTemplate ?? "standard"} onValueChange={(v) => update(a.id, { invoiceTemplate: v })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard invoice</SelectItem>
                      <SelectItem value="deposit">Deposit (50%)</SelectItem>
                      <SelectItem value="final">Final balance</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      value={a.invoiceDueInDays ?? 14}
                      onChange={(e) => update(a.id, { invoiceDueInDays: Number(e.target.value) })}
                      className="h-8 text-xs"
                    />
                    <span className="text-xs text-muted-foreground shrink-0">days to pay</span>
                  </div>
                </div>
              )}
              {a.type === "payment_reminder" && (
                <Select value={a.paymentReminderTone ?? "friendly"} onValueChange={(v) => update(a.id, { paymentReminderTone: v as WorkflowAction["paymentReminderTone"] })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="friendly">Friendly nudge</SelectItem>
                    <SelectItem value="firm">Firm reminder</SelectItem>
                    <SelectItem value="final">Final notice</SelectItem>
                  </SelectContent>
                </Select>
              )}
              {a.type === "book_visit" && (
                <div className="grid grid-cols-3 gap-2">
                  <Select value={a.visitWhen ?? "next_available"} onValueChange={(v) => update(a.id, { visitWhen: v as WorkflowAction["visitWhen"] })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="next_available">Next free slot</SelectItem>
                      <SelectItem value="same_day">Same day</SelectItem>
                      <SelectItem value="in_days">In a set number of days</SelectItem>
                    </SelectContent>
                  </Select>
                  {a.visitWhen === "in_days" ? (
                    <Input
                      type="number"
                      min={1}
                      value={a.visitInDays ?? 3}
                      onChange={(e) => update(a.id, { visitInDays: Number(e.target.value) })}
                      className="h-8 text-xs"
                    />
                  ) : <div />}
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={15}
                      step={15}
                      value={a.visitDurationMins ?? 60}
                      onChange={(e) => update(a.id, { visitDurationMins: Number(e.target.value) })}
                      className="h-8 text-xs"
                    />
                    <span className="text-xs text-muted-foreground shrink-0">mins</span>
                  </div>
                </div>
              )}
              {a.type === "wait_until" && (
                <div className="space-y-2">
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Carry on once this is true</div>
                  <ConditionRow
                    value={a.untilCondition ?? newCondition()}
                    onChange={(c) => update(a.id, { untilCondition: c })}
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Give up after</span>
                    <Input
                      type="number"
                      min={1}
                      value={a.untilMaxDays ?? 7}
                      onChange={(e) => update(a.id, { untilMaxDays: Number(e.target.value) })}
                      className="h-8 text-xs w-20"
                    />
                    <span className="text-xs text-muted-foreground">days</span>
                  </div>
                </div>
              )}
              {a.type === "wait_for_good_time" && (
                <Select value={a.goodTimeWindow ?? "business_hours"} onValueChange={(v) => update(a.id, { goodTimeWindow: v as WorkflowAction["goodTimeWindow"] })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="business_hours">Next working hours (9–5, Mon–Fri)</SelectItem>
                    <SelectItem value="morning">Next morning</SelectItem>
                    <SelectItem value="afternoon">Next afternoon</SelectItem>
                    <SelectItem value="weekday">Next working day</SelectItem>
                  </SelectContent>
                </Select>
              )}
              {a.type === "exit" && (
                <Input
                  value={a.exitReason ?? ""}
                  onChange={(e) => update(a.id, { exitReason: e.target.value })}
                  className="h-8 text-xs"
                  placeholder="Why does it stop here? (optional)"
                />
              )}
              {a.type === "ab_split" && (
                <div className="space-y-3">
                  <Input
                    value={a.abLabel ?? ""}
                    onChange={(e) => update(a.id, { abLabel: e.target.value })}
                    className="h-8 text-xs"
                    placeholder="What are you testing?"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Send version A to</span>
                    <Input
                      type="number"
                      min={5}
                      max={95}
                      step={5}
                      value={a.abSplit ?? 50}
                      onChange={(e) => update(a.id, { abSplit: Number(e.target.value) })}
                      className="h-8 text-xs w-20"
                    />
                    <span className="text-xs text-muted-foreground">% — the rest get version B</span>
                  </div>
                  <div className="rounded-md border-l-2 border-indigo-500/60 pl-3 space-y-2">
                    <div className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400">Version A</div>
                    {(a.aActions?.length ?? 0) > 0 && (
                      <ActionListEditor
                        actions={a.aActions ?? []}
                        onChange={(next) => update(a.id, { aActions: next })}
                        stageNames={stageNames}
                        depth={depth + 1}
                      />
                    )}
                    <AddActionMenu compact onAdd={(t) => update(a.id, { aActions: [...(a.aActions ?? []), newAction(t)] })} allowBranch={depth < 2} />
                  </div>
                  <div className="rounded-md border-l-2 border-fuchsia-500/60 pl-3 space-y-2">
                    <div className="text-[11px] font-medium text-fuchsia-600 dark:text-fuchsia-400">Version B</div>
                    {(a.bActions?.length ?? 0) > 0 && (
                      <ActionListEditor
                        actions={a.bActions ?? []}
                        onChange={(next) => update(a.id, { bActions: next })}
                        stageNames={stageNames}
                        depth={depth + 1}
                      />
                    )}
                    <AddActionMenu compact onAdd={(t) => update(a.id, { bActions: [...(a.bActions ?? []), newAction(t)] })} allowBranch={depth < 2} />
                  </div>
                </div>
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
                    <ConditionRow
                      value={a.branchCondition ?? newCondition()}
                      onChange={(c) => update(a.id, { branchCondition: c })}
                    />
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
          Nothing happens yet — add your first step below.
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
        <SelectValue placeholder="Add a step" />
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
        else if (a.type === "send_sms") summary = a.smsMessage || "(no message)";
        else if (a.type === "send_sequence") summary = a.sequenceId || "(pick follow-up)";
        else if (a.type === "notify_team") summary = `${a.notifyChannel} → ${a.notifyRecipients || "team"}`;
        else if (a.type === "remind_owner") summary = a.reminderMessage || "(no reminder)";
        else if (a.type === "add_tag") summary = a.tag ? `+ ${a.tag}` : "(no label)";
        else if (a.type === "remove_tag") summary = a.tag ? `− ${a.tag}` : "(no label)";
        else if (a.type === "add_to_segment" || a.type === "remove_from_segment") summary = a.segmentId || "(no list)";
        else if (a.type === "assign_owner") summary = a.ownerId || "";
        else if (a.type === "update_field") summary = `${a.fieldTarget}.${a.fieldName || "?"} → ${a.fieldValue || "(blank)"}`;
        else if (a.type === "add_note") summary = a.noteText || "(empty note)";
        else if (a.type === "create_task") summary = a.taskTitle || "Task";
        else if (a.type === "create_job") summary = a.jobService || "Job";
        else if (a.type === "move_stage") summary = `→ ${a.targetStage || "(stage)"}`;
        else if (a.type === "send_quote") summary = a.quoteTemplate || "standard";
        else if (a.type === "send_invoice") summary = `due in ${a.invoiceDueInDays ?? 14} days`;
        else if (a.type === "payment_reminder") summary = `${a.paymentReminderTone ?? "friendly"} reminder`;
        else if (a.type === "book_visit") summary = a.visitWhen === "in_days" ? `in ${a.visitInDays ?? 3} days` : a.visitWhen === "same_day" ? "same day" : "next free slot";
        else if (a.type === "wait") summary = `${a.waitAmount ?? 1} ${a.waitUnit ?? "days"}`;
        else if (a.type === "wait_until") summary = `until true · up to ${a.untilMaxDays ?? 7} days`;
        else if (a.type === "wait_for_good_time") summary = (a.goodTimeWindow ?? "business_hours").replace(/_/g, " ");
        else if (a.type === "exit") summary = a.exitReason || "stops here";
        else if (a.type === "webhook") summary = `${a.webhookMethod} ${a.webhookUrl || "(url)"}`;
        else if (a.type === "branch") summary = a.branchLabel || "Branch";
        else if (a.type === "ab_split") summary = a.abLabel || "A/B test";

        if (a.type === "branch" || a.type === "ab_split") {
          const isAb = a.type === "ab_split";
          const left = (isAb ? a.aActions : a.ifActions) ?? [];
          const right = (isAb ? a.bActions : a.elseActions) ?? [];
          return (
            <div key={a.id}>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-card border-hairline">
                <div className={`w-6 h-6 rounded flex items-center justify-center ${actionTones[a.type]}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-medium truncate">{summary}</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 mt-1.5">
                <div className={`rounded-md border-hairline p-1.5 ${isAb ? "bg-indigo-500/[0.04]" : "bg-emerald-500/[0.04]"}`}>
                  <div className={`text-[9px] font-medium uppercase mb-1 ${isAb ? "text-indigo-600 dark:text-indigo-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                    {isAb ? `Version A (${a.abSplit ?? 50}%)` : "If true"}
                  </div>
                  {left.length === 0
                    ? <div className="text-[10px] text-muted-foreground italic">(no steps)</div>
                    : <FlowActions actions={left} />}
                </div>
                <div className={`rounded-md border-hairline p-1.5 ${isAb ? "bg-fuchsia-500/[0.04]" : "bg-rose-500/[0.04]"}`}>
                  <div className={`text-[9px] font-medium uppercase mb-1 ${isAb ? "text-fuchsia-600 dark:text-fuchsia-400" : "text-rose-600 dark:text-rose-400"}`}>
                    {isAb ? `Version B (${100 - (a.abSplit ?? 50)}%)` : "If false"}
                  </div>
                  {right.length === 0
                    ? <div className="text-[10px] text-muted-foreground italic">(no steps)</div>
                    : <FlowActions actions={right} />}
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

  const [localDraft, setLocalDraft] = useState<Workflow | null>(existing ?? null);
  useEffect(() => {
    if (existing && !localDraft) setLocalDraft(existing);
  }, [existing, localDraft]);

  if (!existing && !localDraft) {
    return <Navigate to="/automations" replace />;
  }
  const draft = (localDraft ?? existing) as Workflow;
  const setDraft = (updater: (d: Workflow) => Workflow) =>
    setLocalDraft((prev) => updater((prev ?? existing) as Workflow));
  const [tab, setTab] = useState<"build" | "history" | "settings">("build");
  const [openRun, setOpenRun] = useState<string | null>(null);
  const [testOpen, setTestOpen] = useState(false);

  const patch = (p: Partial<Workflow>) => setDraft((d) => ({ ...d, ...p }));
  const settings = draft.settings ?? defaultSettings();
  const patchSettings = (p: Partial<WorkflowSettings>) => patch({ settings: { ...settings, ...p } });
  const stats = workflowStats(draft);
  const warnings = checkWorkflow(draft);
  const save = (silent = false) => {
    updateWorkflow(draft.id, draft);
    if (!silent) toast({ title: "Automation saved" });
  };
  const toggleActive = () => {
    const next = !draft.active;
    if (next && warnings.length > 0) {
      toast({ title: "Have a quick look first", description: warnings[0] });
    }
    patch({ active: next });
    updateWorkflow(draft.id, { ...draft, active: next });
    toast({ title: next ? "Automation switched on" : "Automation paused" });
  };
  const onDuplicate = () => {
    const copy = duplicateWorkflow(draft.id);
    if (copy) {
      toast({ title: "Duplicated" });
      navigate(`/automations/${copy.id}`);
    }
  };
  const onDelete = () => {
    if (!confirm("Delete this automation?")) return;
    deleteWorkflow(draft.id);
    navigate("/automations");
  };

  const tmeta = triggerMeta[draft.trigger];

  return (
    <>
      <PageHeader
        title={draft.name}
        description={`${tmeta.label} · ${countSteps(draft.actions)} step${countSteps(draft.actions) === 1 ? "" : "s"}`}
        actions={
          <div className="flex items-center gap-2">
            <Link to="/automations" className="h-8 px-2 rounded-md hover:bg-surface-hover inline-flex items-center gap-1 text-sm text-muted-foreground">
              <ArrowLeft className="w-3.5 h-3.5" /> All automations
            </Link>
            <div className="flex items-center gap-2 pl-2 border-l-hairline">
              <span className="text-xs text-muted-foreground">{draft.active ? "On" : "Paused"}</span>
              <Switch checked={draft.active} onCheckedChange={toggleActive} />
            </div>
            <Btn onClick={() => setTestOpen(true)}><FlaskConical className="w-3.5 h-3.5" /> Try it out</Btn>
            <Btn onClick={onDuplicate}><Copy className="w-3.5 h-3.5" /> Duplicate</Btn>
            <Btn onClick={onDelete}><Trash2 className="w-3.5 h-3.5" /> Delete</Btn>
            <Btn variant="primary" onClick={() => save()}>Save</Btn>
          </div>
        }
      />
      <TestRunDialog open={testOpen} onOpenChange={setTestOpen} workflow={draft} />

      <PageBody>
        <div className="flex border-b-hairline mb-4 -mt-2">
          {([
            { id: "build", label: "Set it up", icon: Zap },
            { id: "history", label: "What it\u2019s done", icon: History },
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
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Name it</div>
                <Input
                  value={draft.name}
                  onChange={(e) => patch({ name: e.target.value })}
                  onBlur={() => save(true)}
                  className="h-9 text-sm font-medium"
                  placeholder="Give this automation a name"
                />
                <Textarea
                  value={draft.description ?? ""}
                  onChange={(e) => patch({ description: e.target.value })}
                  onBlur={() => save(true)}
                  className="text-xs min-h-[60px]"
                  placeholder="What is this automation for? (optional)"
                />
              </section>

              {/* Trigger */}
              <section className="border-hairline rounded-lg bg-card p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-amber-500/10 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">Step 1</div>
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
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">Step 2 — optional</div>
                    <div className="text-sm font-medium">Only if…</div>
                  </div>
                  <button
                    onClick={() => patch({ conditions: [...draft.conditions, newCondition()] })}
                    className="h-8 px-2 rounded-md hover:bg-surface-hover text-xs inline-flex items-center gap-1 text-primary"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add a rule
                  </button>
                </div>
                {draft.conditions.length === 0 ? (
                  <div className="text-xs text-muted-foreground italic">No rules — this runs every time.</div>
                ) : (
                  <div className="space-y-2">
                    {draft.conditions.length > 1 && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Match</span>
                        <Select
                          value={draft.conditionMatch ?? "all"}
                          onValueChange={(v) => patch({ conditionMatch: v as "all" | "any" })}
                        >
                          <SelectTrigger className="h-8 text-xs w-[220px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">all of these rules</SelectItem>
                            <SelectItem value="any">any one of these rules</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    {draft.conditions.map((c, i) => (
                      <div key={c.id} className="grid grid-cols-[60px_1fr_auto] gap-2 items-center">
                        <span className="text-xs text-muted-foreground text-center">
                          {i === 0 ? "Only if" : (draft.conditionMatch ?? "all") === "all" ? "and" : "or"}
                        </span>
                        <ConditionRow
                          value={c}
                          onChange={(next) => patch({ conditions: draft.conditions.map((x) => (x.id === c.id ? next : x)) })}
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
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Step 3</div>
                  <div className="text-sm font-medium">Then do this…</div>
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
              <div className="text-xs uppercase tracking-wide text-muted-foreground px-1">How it will run</div>
              <div className="border-hairline rounded-lg bg-surface/40 p-3 space-y-1.5">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-card border-hairline">
                  <div className="w-6 h-6 rounded flex items-center justify-center bg-amber-500/10">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                  <div className="text-xs truncate flex-1">
                    <div className="font-medium">When this happens</div>
                    <div className="text-muted-foreground truncate">{tmeta.label}</div>
                  </div>
                </div>
                {draft.conditions.length > 0 && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-card border-hairline">
                    <div className="w-6 h-6 rounded flex items-center justify-center bg-slate-500/10">
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                    <div className="text-xs truncate flex-1">
                      <div className="font-medium">Only if</div>
                      <div className="text-muted-foreground">{draft.conditions.length} rule{draft.conditions.length === 1 ? "" : "s"}</div>
                    </div>
                  </div>
                )}
                <FlowActions actions={draft.actions} />
                {draft.actions.length === 0 && (
                  <div className="text-xs text-muted-foreground italic px-2 py-3 text-center">No steps yet.</div>
                )}
              </div>
            </aside>
          </div>
        )}

        {tab === "history" && (
          <div className="max-w-3xl space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {[
                { label: "People in it", value: stats.enrolled },
                { label: "Finished", value: stats.finished },
                { label: "Skipped", value: stats.skipped },
                { label: "Problems", value: stats.failed },
                { label: "Emails opened", value: stats.opened },
                { label: "Links clicked", value: stats.clicked },
              ].map((s) => (
                <div key={s.label} className="border-hairline rounded-lg bg-card p-3">
                  <div className="text-lg font-semibold tabular-nums">{s.value}</div>
                  <div className="text-[11px] text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="border-hairline rounded-lg bg-card overflow-hidden">
              <div className="grid grid-cols-[1fr_160px_110px_28px] px-4 h-9 border-b-hairline text-xs text-muted-foreground items-center">
                <div>Who / what happened</div>
                <div>Started</div>
                <div>Status</div>
                <div />
              </div>
              {(draft.runs ?? []).length === 0 ? (
                <div className="p-10 text-center text-sm text-muted-foreground">
                  Nothing yet. Once this automation is switched on, everything it does will be listed here.
                </div>
              ) : (
                (draft.runs ?? []).map((r) => {
                  const isOpen = openRun === r.id;
                  return (
                    <div key={r.id} className="border-b-hairline last:border-b-0">
                      <button
                        onClick={() => setOpenRun(isOpen ? null : r.id)}
                        className="w-full grid grid-cols-[1fr_160px_110px_28px] px-4 h-12 items-center text-sm text-left hover:bg-surface-hover"
                      >
                        <div className="min-w-0">
                          <div className="font-medium truncate">{r.contact ?? "—"}</div>
                          <div className="text-xs text-muted-foreground truncate">{r.reason ?? r.summary}</div>
                        </div>
                        <div className="text-xs text-muted-foreground">{new Date(r.startedAt).toLocaleString()}</div>
                        <div>
                          <Pill tone={r.status === "completed" ? "success" : r.status === "failed" ? "danger" : r.status === "skipped" ? "neutral" : "info"}>
                            {r.status === "skipped" ? "not run" : r.status}
                          </Pill>
                        </div>
                        <ChevronRight className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${isOpen ? "rotate-90" : ""}`} />
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-3 space-y-1.5 bg-surface/30">
                          {(r.steps ?? []).length === 0 ? (
                            <div className="text-xs text-muted-foreground italic py-2">No step details for this one.</div>
                          ) : (
                            (r.steps ?? []).map((s, i) => (
                              <div key={i} className="flex items-start gap-2 text-xs p-2 rounded-md bg-card border-hairline">
                                {s.status === "done" ? <Check className="w-3.5 h-3.5 text-emerald-500 mt-0.5" />
                                  : s.status === "failed" ? <AlertTriangle className="w-3.5 h-3.5 text-rose-500 mt-0.5" />
                                  : s.status === "waiting" ? <Clock className="w-3.5 h-3.5 text-amber-500 mt-0.5" />
                                  : <X className="w-3.5 h-3.5 text-muted-foreground mt-0.5" />}
                                <div>
                                  <div className="font-medium">{s.label}</div>
                                  {s.note && <div className="text-muted-foreground">{s.note}</div>}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}


        {tab === "settings" && (
          <div className="max-w-2xl space-y-4">
            <section className="border-hairline rounded-lg bg-card p-4 space-y-3">
              <div className="text-sm font-medium">How often the same person goes through this</div>
              <Select value={settings.reEnroll} onValueChange={(v) => patchSettings({ reEnroll: v as WorkflowSettings["reEnroll"] })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="once">Once only</SelectItem>
                  <SelectItem value="once_per_job">Once for each job</SelectItem>
                  <SelectItem value="every_time">Every time it happens</SelectItem>
                </SelectContent>
              </Select>
            </section>

            <section className="border-hairline rounded-lg bg-card p-4 space-y-3">
              <div className="text-sm font-medium">Good manners</div>
              <label className="flex items-center gap-3 text-sm">
                <Switch checked={settings.workingDaysOnly} onCheckedChange={(v) => patchSettings({ workingDaysOnly: v })} />
                Only send emails and texts on working days
              </label>
              <label className="flex items-center gap-3 text-sm">
                <Switch checked={settings.quietHours} onCheckedChange={(v) => patchSettings({ quietHours: v })} />
                Keep quiet in the evening and early morning
              </label>
              {settings.quietHours && (
                <div className="flex items-center gap-2 pl-11">
                  <span className="text-xs text-muted-foreground">from</span>
                  <Input type="time" value={settings.quietFrom} onChange={(e) => patchSettings({ quietFrom: e.target.value })} className="h-8 text-xs w-28" />
                  <span className="text-xs text-muted-foreground">to</span>
                  <Input type="time" value={settings.quietTo} onChange={(e) => patchSettings({ quietTo: e.target.value })} className="h-8 text-xs w-28" />
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-sm">Never send more than</span>
                <Input
                  type="number"
                  min={0}
                  value={settings.maxPerContactPerDay}
                  onChange={(e) => patchSettings({ maxPerContactPerDay: Number(e.target.value) })}
                  className="h-8 text-xs w-20"
                />
                <span className="text-sm">message(s) a day to one person</span>
              </div>
              <label className="flex items-center gap-3 text-sm">
                <Switch checked={settings.skipUnsubscribed} onCheckedChange={(v) => patchSettings({ skipUnsubscribed: v })} />
                Skip anyone who has asked not to be emailed
              </label>
            </section>

            <section className="border-hairline rounded-lg bg-card p-4 space-y-3">
              <div className="text-sm font-medium">Stop early when… (optional)</div>
              <p className="text-xs text-muted-foreground">If this happens, the person stops receiving the rest of the steps.</p>
              <Select value={settings.goal} onValueChange={(v) => patchSettings({ goal: v })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Never stop early</SelectItem>
                  <SelectItem value="quote_accepted">They accept a quote</SelectItem>
                  <SelectItem value="invoice_paid">They pay an invoice</SelectItem>
                  <SelectItem value="job_created">A job is created for them</SelectItem>
                  <SelectItem value="visit_booked">They book a visit</SelectItem>
                  <SelectItem value="email_replied">They reply to an email</SelectItem>
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
