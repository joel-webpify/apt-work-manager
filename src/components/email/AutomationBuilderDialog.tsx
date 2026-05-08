import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  GripVertical,
  Mail,
  Clock,
  Tag,
  CheckSquare,
  GitBranch,
  Zap,
  ArrowDown as FlowArrow,
} from "lucide-react";

export type TriggerType =
  | "form_submitted"
  | "quote_accepted"
  | "job_paid"
  | "job_stage_changed"
  | "tag_added"
  | "no_job_in_period"
  | "date_anniversary";

export type StepType = "send_email" | "wait" | "tag_contact" | "create_task" | "branch";

export interface Condition {
  id: string;
  field: string;
  op: "equals" | "not_equals" | "contains" | "greater_than" | "less_than";
  value: string;
}

export interface AutomationStep {
  id: string;
  type: StepType;
  // send_email
  emailSubject?: string;
  emailTemplate?: string;
  // wait
  waitAmount?: number;
  waitUnit?: "minutes" | "hours" | "days";
  // tag_contact
  tag?: string;
  // create_task
  taskTitle?: string;
  taskAssignee?: string;
  // branch
  branchLabel?: string;
}

export interface BuilderAutomation {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  trigger: TriggerType;
  triggerConfig?: Record<string, string>;
  conditions: Condition[];
  steps: AutomationStep[];
}

const triggerMeta: Record<TriggerType, { label: string; description: string }> = {
  form_submitted: { label: "Form submitted", description: "When a contact submits any form" },
  quote_accepted: { label: "Quote accepted", description: "When a quote is marked accepted" },
  job_paid: { label: "Job marked paid", description: "When invoice is settled" },
  job_stage_changed: { label: "Job stage changed", description: "When a job moves between pipeline stages" },
  tag_added: { label: "Tag added to contact", description: "When a specific tag is applied" },
  no_job_in_period: { label: "No job in period", description: "Lapsed customer detector" },
  date_anniversary: { label: "Date anniversary", description: "1 year since last job, etc." },
};

const stepMeta: Record<StepType, { label: string; icon: typeof Mail; tone: string }> = {
  send_email: { label: "Send email", icon: Mail, tone: "text-blue-500" },
  wait: { label: "Wait", icon: Clock, tone: "text-amber-500" },
  tag_contact: { label: "Tag contact", icon: Tag, tone: "text-purple-500" },
  create_task: { label: "Create task", icon: CheckSquare, tone: "text-emerald-500" },
  branch: { label: "Branch (if/else)", icon: GitBranch, tone: "text-pink-500" },
};

const newStep = (type: StepType): AutomationStep => {
  const id = `s-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  switch (type) {
    case "send_email":
      return { id, type, emailSubject: "New email", emailTemplate: "default" };
    case "wait":
      return { id, type, waitAmount: 1, waitUnit: "days" };
    case "tag_contact":
      return { id, type, tag: "" };
    case "create_task":
      return { id, type, taskTitle: "Follow up", taskAssignee: "owner" };
    case "branch":
      return { id, type, branchLabel: "Has opened previous email" };
  }
};

const newCondition = (): Condition => ({
  id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  field: "contact.tag",
  op: "equals",
  value: "",
});

export function AutomationBuilderDialog({
  open,
  onOpenChange,
  initial,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: BuilderAutomation;
  onSave: (a: BuilderAutomation) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [active, setActive] = useState(initial?.active ?? false);
  const [trigger, setTrigger] = useState<TriggerType>(initial?.trigger ?? "form_submitted");
  const [conditions, setConditions] = useState<Condition[]>(initial?.conditions ?? []);
  const [steps, setSteps] = useState<AutomationStep[]>(
    initial?.steps ?? [
      { id: "s-default", type: "send_email", emailSubject: "Thanks for getting in touch", emailTemplate: "default" },
    ],
  );

  const updateStep = (id: string, patch: Partial<AutomationStep>) =>
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const removeStep = (id: string) => setSteps((prev) => prev.filter((s) => s.id !== id));
  const moveStep = (id: string, dir: -1 | 1) =>
    setSteps((prev) => {
      const i = prev.findIndex((s) => s.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const updateCond = (id: string, patch: Partial<Condition>) =>
    setConditions((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const removeCond = (id: string) => setConditions((prev) => prev.filter((c) => c.id !== id));

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      id: initial?.id ?? `au-${Date.now()}`,
      name: name.trim(),
      description: description.trim() || undefined,
      active,
      trigger,
      conditions,
      steps,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit automation" : "New automation"}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-[1fr_1fr] gap-6 overflow-hidden flex-1">
          {/* Left — config */}
          <div className="overflow-y-auto pr-2 space-y-4">
            {/* Basics */}
            <div className="space-y-3">
              <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
                <div className="space-y-1.5">
                  <Label>Automation name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Post-job review request" />
                </div>
                <div className="flex items-center gap-2 pb-2">
                  <Switch checked={active} onCheckedChange={setActive} />
                  <Label className="text-xs text-muted-foreground">{active ? "On" : "Off"}</Label>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Description (optional)</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="What does this automation do?" />
              </div>
            </div>

            {/* Trigger */}
            <div className="border-hairline rounded-lg">
              <div className="px-3 h-10 flex items-center gap-2 border-b-hairline">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-sm font-medium">Trigger</span>
              </div>
              <div className="p-3 space-y-2">
                <Select value={trigger} onValueChange={(v) => setTrigger(v as TriggerType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(triggerMeta) as TriggerType[]).map((t) => (
                      <SelectItem key={t} value={t}>{triggerMeta[t].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">{triggerMeta[trigger].description}</p>
              </div>
            </div>

            {/* Conditions */}
            <div className="border-hairline rounded-lg">
              <div className="px-3 h-10 flex items-center justify-between border-b-hairline">
                <span className="text-sm font-medium">Conditions <span className="text-muted-foreground font-normal">(all must match)</span></span>
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setConditions((p) => [...p, newCondition()])}>
                  <Plus className="w-3 h-3 mr-1" /> Add
                </Button>
              </div>
              <div className="divide-y divide-border">
                {conditions.map((c) => (
                  <div key={c.id} className="p-3 flex items-center gap-2">
                    <Select value={c.field} onValueChange={(v) => updateCond(c.id, { field: v })}>
                      <SelectTrigger className="h-8 text-xs flex-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="contact.tag">Contact tag</SelectItem>
                        <SelectItem value="contact.trade">Contact trade</SelectItem>
                        <SelectItem value="job.value">Job value (£)</SelectItem>
                        <SelectItem value="job.stage">Job stage</SelectItem>
                        <SelectItem value="form.id">Form ID</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={c.op} onValueChange={(v) => updateCond(c.id, { op: v as Condition["op"] })}>
                      <SelectTrigger className="h-8 text-xs w-[120px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equals">equals</SelectItem>
                        <SelectItem value="not_equals">not equals</SelectItem>
                        <SelectItem value="contains">contains</SelectItem>
                        <SelectItem value="greater_than">&gt;</SelectItem>
                        <SelectItem value="less_than">&lt;</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input value={c.value} onChange={(e) => updateCond(c.id, { value: e.target.value })} className="h-8 text-xs flex-1" placeholder="Value" />
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeCond(c.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
                {conditions.length === 0 && (
                  <div className="p-4 text-center text-xs text-muted-foreground">No conditions — runs on every trigger.</div>
                )}
              </div>
            </div>

            {/* Steps */}
            <div className="border-hairline rounded-lg">
              <div className="px-3 h-10 flex items-center justify-between border-b-hairline">
                <span className="text-sm font-medium">Steps</span>
                <Select onValueChange={(v) => setSteps((p) => [...p, newStep(v as StepType)])}>
                  <SelectTrigger className="h-7 w-[150px] text-xs">
                    <Plus className="w-3 h-3 mr-1" /><SelectValue placeholder="Add step" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(stepMeta) as StepType[]).map((t) => {
                      const Icon = stepMeta[t].icon;
                      return (
                        <SelectItem key={t} value={t}>
                          <span className="inline-flex items-center gap-2"><Icon className={`w-3.5 h-3.5 ${stepMeta[t].tone}`} />{stepMeta[t].label}</span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="divide-y divide-border">
                {steps.map((s, idx) => {
                  const Icon = stepMeta[s.type].icon;
                  return (
                    <div key={s.id} className="p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <GripVertical className="w-3.5 h-3.5 text-muted-foreground" />
                        <Icon className={`w-3.5 h-3.5 ${stepMeta[s.type].tone}`} />
                        <span className="text-xs font-medium flex-1">{stepMeta[s.type].label}</span>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => moveStep(s.id, -1)} disabled={idx === 0}>
                          <ArrowUp className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => moveStep(s.id, 1)} disabled={idx === steps.length - 1}>
                          <ArrowDown className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeStep(s.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                      <div className="pl-6 space-y-2">
                        {s.type === "send_email" && (
                          <>
                            <Input
                              value={s.emailSubject ?? ""}
                              onChange={(e) => updateStep(s.id, { emailSubject: e.target.value })}
                              className="h-8 text-xs"
                              placeholder="Email subject"
                            />
                            <Select value={s.emailTemplate ?? "default"} onValueChange={(v) => updateStep(s.id, { emailTemplate: v })}>
                              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="default">Default template</SelectItem>
                                <SelectItem value="review_request">Review request</SelectItem>
                                <SelectItem value="winback">Win-back offer</SelectItem>
                                <SelectItem value="reminder">Reminder</SelectItem>
                              </SelectContent>
                            </Select>
                          </>
                        )}
                        {s.type === "wait" && (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min={1}
                              value={s.waitAmount ?? 1}
                              onChange={(e) => updateStep(s.id, { waitAmount: Number(e.target.value) })}
                              className="h-8 text-xs w-20"
                            />
                            <Select value={s.waitUnit ?? "days"} onValueChange={(v) => updateStep(s.id, { waitUnit: v as AutomationStep["waitUnit"] })}>
                              <SelectTrigger className="h-8 text-xs w-[120px]"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="minutes">minutes</SelectItem>
                                <SelectItem value="hours">hours</SelectItem>
                                <SelectItem value="days">days</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        {s.type === "tag_contact" && (
                          <Input value={s.tag ?? ""} onChange={(e) => updateStep(s.id, { tag: e.target.value })} className="h-8 text-xs" placeholder="Tag name e.g. nurtured" />
                        )}
                        {s.type === "create_task" && (
                          <>
                            <Input value={s.taskTitle ?? ""} onChange={(e) => updateStep(s.id, { taskTitle: e.target.value })} className="h-8 text-xs" placeholder="Task title" />
                            <Select value={s.taskAssignee ?? "owner"} onValueChange={(v) => updateStep(s.id, { taskAssignee: v })}>
                              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="owner">Contact owner</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="sales">Sales team</SelectItem>
                              </SelectContent>
                            </Select>
                          </>
                        )}
                        {s.type === "branch" && (
                          <Input value={s.branchLabel ?? ""} onChange={(e) => updateStep(s.id, { branchLabel: e.target.value })} className="h-8 text-xs" placeholder="Condition label" />
                        )}
                      </div>
                    </div>
                  );
                })}
                {steps.length === 0 && (
                  <div className="p-6 text-center text-sm text-muted-foreground">No steps yet — add one above.</div>
                )}
              </div>
            </div>
          </div>

          {/* Right — flow preview */}
          <div className="overflow-y-auto border-hairline rounded-lg bg-surface/40 p-5">
            <div className="text-xs uppercase tracking-wide text-muted-foreground mb-3">Flow preview</div>
            <div className="flex flex-col items-center gap-1">
              {/* Trigger node */}
              <div className="w-full bg-card border-hairline rounded-lg p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-amber-500/10 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Trigger</div>
                  <div className="text-sm font-medium truncate">{triggerMeta[trigger].label}</div>
                </div>
              </div>

              {conditions.length > 0 && (
                <>
                  <FlowArrow className="w-3.5 h-3.5 text-muted-foreground my-1" />
                  <div className="w-full bg-card border-hairline rounded-lg p-3">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1.5">If all match</div>
                    <div className="space-y-1">
                      {conditions.map((c) => (
                        <div key={c.id} className="text-xs font-mono text-foreground/80 truncate">
                          {c.field} <span className="text-muted-foreground">{c.op.replace("_", " ")}</span> <span className="text-primary">{c.value || "…"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {steps.map((s) => {
                const Icon = stepMeta[s.type].icon;
                let summary = "";
                if (s.type === "send_email") summary = s.emailSubject || "Untitled email";
                else if (s.type === "wait") summary = `${s.waitAmount} ${s.waitUnit}`;
                else if (s.type === "tag_contact") summary = s.tag ? `Add "${s.tag}"` : "(no tag)";
                else if (s.type === "create_task") summary = s.taskTitle || "Untitled task";
                else if (s.type === "branch") summary = s.branchLabel || "(no condition)";
                return (
                  <div key={s.id} className="w-full flex flex-col items-center">
                    <FlowArrow className="w-3.5 h-3.5 text-muted-foreground my-1" />
                    <div className="w-full bg-card border-hairline rounded-lg p-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-md bg-surface flex items-center justify-center">
                        <Icon className={`w-4 h-4 ${stepMeta[s.type].tone}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs uppercase tracking-wide text-muted-foreground">{stepMeta[s.type].label}</div>
                        <div className="text-sm font-medium truncate">{summary}</div>
                      </div>
                    </div>
                  </div>
                );
              })}

              <FlowArrow className="w-3.5 h-3.5 text-muted-foreground my-1" />
              <div className="w-full bg-surface border-dashed border border-border rounded-lg p-3 text-center text-xs text-muted-foreground">
                End of automation
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!name.trim()}>{initial ? "Save changes" : "Create automation"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
