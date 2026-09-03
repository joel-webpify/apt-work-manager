import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Btn, Pill } from "@/components/layout/PageShell";
import { contacts } from "@/data/mockData";
import { actionMeta, triggerMeta, type Workflow, type WorkflowAction, type WorkflowCondition } from "@/lib/workflowsStore";
import { Check, SkipForward, Clock, StopCircle, FlaskConical } from "lucide-react";

type Entry = { depth: number; label: string; detail: string; state: "done" | "skipped" | "waiting" | "stopped" };

const fieldValue = (c: typeof contacts[number], field: string): string => {
  switch (field) {
    case "contact.tag":
      return c.lifecycle;
    case "contact.lifecycle":
      return c.lifecycle;
    case "contact.source":
    case "contact.channel":
      return c.source;
    case "contact.area":
      return c.postcode;
    case "contact.totalSpend":
      return String(c.totalSpend);
    case "contact.daysSinceLastJob":
      return "42";
    case "contact.hasAcceptedQuote":
      return c.totalSpend > 0 ? "yes" : "no";
    case "job.value":
      return String(Math.max(150, Math.round(c.totalSpend / 3)));
    case "job.stage":
      return "In progress";
    case "job.service":
      return "Service visit";
    case "quote.status":
      return c.totalSpend > 0 ? "Accepted" : "Sent";
    case "invoice.status":
      return c.totalSpend > 0 ? "Paid" : "Sent";
    case "email.opened":
      return "yes";
    case "email.clicked":
      return "no";
    default:
      return "";
  }
};

const test = (c: typeof contacts[number], cond?: WorkflowCondition): boolean => {
  if (!cond) return true;
  const actual = fieldValue(c, cond.field);
  const expected = cond.value.trim();
  switch (cond.op) {
    case "equals":
      return actual.toLowerCase() === expected.toLowerCase();
    case "not_equals":
      return actual.toLowerCase() !== expected.toLowerCase();
    case "contains":
      return actual.toLowerCase().includes(expected.toLowerCase());
    case "greater_than":
      return Number(actual) > Number(expected);
    case "less_than":
      return Number(actual) < Number(expected);
    case "is_set":
      return actual !== "";
    case "is_empty":
      return actual === "";
  }
};

const messageTypes = ["send_email", "send_sms", "send_sequence", "payment_reminder"];

const describe = (a: WorkflowAction): string => {
  switch (a.type) {
    case "send_email":
      return `“${a.emailSubject || "No subject"}”`;
    case "send_sms":
      return a.smsMessage || "(empty message)";
    case "send_sequence":
      return a.sequenceId || "(no follow-up picked)";
    case "notify_team":
      return `${a.notifyRecipients || "team"} — ${a.notifyMessage || "no message"}`;
    case "remind_owner":
      return a.reminderMessage || "(no message)";
    case "add_tag":
      return `label “${a.tag || "?"}” added`;
    case "remove_tag":
      return `label “${a.tag || "?"}” removed`;
    case "add_to_segment":
    case "remove_from_segment":
      return a.segmentId || "(no list)";
    case "assign_owner":
      return a.ownerId || "";
    case "update_field":
      return `${a.fieldTarget}.${a.fieldName} → ${a.fieldValue || "(blank)"}`;
    case "add_note":
      return a.noteText || "(empty note)";
    case "create_task":
      return `${a.taskTitle || "Task"} for ${a.taskAssignee || "owner"}`;
    case "create_job":
      return `${a.jobService || "Job"} in ${a.jobPipelineStage || "first stage"}`;
    case "move_stage":
      return `→ ${a.targetStage || "(no stage)"}`;
    case "send_quote":
      return `quote from “${a.quoteTemplate || "standard"}”`;
    case "send_invoice":
      return `due in ${a.invoiceDueInDays ?? 14} days`;
    case "payment_reminder":
      return `${a.paymentReminderTone || "friendly"} reminder`;
    case "book_visit":
      return a.visitWhen === "in_days" ? `in ${a.visitInDays ?? 3} days` : a.visitWhen === "same_day" ? "same day" : "next free slot";
    case "wait":
      return `${a.waitAmount ?? 1} ${a.waitUnit ?? "days"}`;
    case "wait_until":
      return `up to ${a.untilMaxDays ?? 7} days`;
    case "wait_for_good_time":
      return a.goodTimeWindow?.replace("_", " ") ?? "business hours";
    case "exit":
      return a.exitReason || "stopped here";
    case "webhook":
      return `${a.webhookMethod} ${a.webhookUrl || "(no address)"}`;
    default:
      return "";
  }
};

export function TestRunDialog({
  open,
  onOpenChange,
  workflow,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  workflow: Workflow;
}) {
  const [contactId, setContactId] = useState(contacts[0]?.id ?? "");
  const contact = contacts.find((c) => c.id === contactId) ?? contacts[0];

  const result = useMemo(() => {
    if (!contact) return { entries: [] as Entry[], blocked: "" };
    const entries: Entry[] = [];
    const match = workflow.conditionMatch ?? "all";
    const results = workflow.conditions.map((c) => test(contact, c));
    const passes =
      workflow.conditions.length === 0 ? true : match === "all" ? results.every(Boolean) : results.some(Boolean);

    entries.push({
      depth: 0,
      label: "When this happens",
      detail: triggerMeta[workflow.trigger].label,
      state: "done",
    });

    if (!passes) {
      entries.push({
        depth: 0,
        label: "Only if",
        detail: `${contact.name} does not match your rules — nothing else would happen`,
        state: "skipped",
      });
      return { entries, blocked: "" };
    }
    if (workflow.conditions.length > 0) {
      entries.push({ depth: 0, label: "Only if", detail: `${contact.name} matches your rules`, state: "done" });
    }

    let msgCount = 0;
    let stopped = false;

    const walk = (list: WorkflowAction[], depth: number) => {
      for (const a of list) {
        if (stopped) {
          entries.push({ depth, label: actionMeta[a.type].label, detail: "not reached", state: "skipped" });
          continue;
        }
        if (a.type === "exit") {
          entries.push({ depth, label: "Stop here", detail: describe(a), state: "stopped" });
          stopped = true;
          continue;
        }
        if (a.type === "wait" || a.type === "wait_for_good_time") {
          if (a.type === "wait_for_good_time" || a.waitUnit === "days") msgCount = 0;
          entries.push({ depth, label: actionMeta[a.type].label, detail: describe(a), state: "waiting" });
          continue;
        }
        if (a.type === "wait_until") {
          const ok = test(contact, a.untilCondition);
          entries.push({
            depth,
            label: "Wait until something is true",
            detail: ok ? "already true — carries straight on" : `waits ${describe(a)} for this to happen`,
            state: "waiting",
          });
          continue;
        }
        if (a.type === "branch") {
          const ok = test(contact, a.branchCondition);
          entries.push({
            depth,
            label: a.branchLabel || "Split the path",
            detail: ok ? "goes down the “yes” path" : "goes down the “no” path",
            state: "done",
          });
          walk((ok ? a.ifActions : a.elseActions) ?? [], depth + 1);
          continue;
        }
        if (a.type === "ab_split") {
          const goesA = (contact.name.charCodeAt(0) % 100) < (a.abSplit ?? 50);
          entries.push({
            depth,
            label: a.abLabel || "Try two versions",
            detail: goesA ? `gets version A (${a.abSplit ?? 50}%)` : `gets version B (${100 - (a.abSplit ?? 50)}%)`,
            state: "done",
          });
          walk((goesA ? a.aActions : a.bActions) ?? [], depth + 1);
          continue;
        }
        if (messageTypes.includes(a.type)) {
          msgCount += 1;
          const limit = workflow.settings?.maxPerContactPerDay ?? 0;
          if (limit > 0 && msgCount > limit) {
            entries.push({
              depth,
              label: actionMeta[a.type].label,
              detail: `held back — your limit is ${limit} message a day per contact`,
              state: "waiting",
            });
            continue;
          }
        }
        entries.push({ depth, label: actionMeta[a.type].label, detail: describe(a), state: "done" });
      }
    };

    walk(workflow.actions, 0);
    return { entries, blocked: "" };
  }, [contact, workflow]);

  const icon = (s: Entry["state"]) =>
    s === "done" ? <Check className="w-3.5 h-3.5 text-emerald-500" />
      : s === "skipped" ? <SkipForward className="w-3.5 h-3.5 text-muted-foreground" />
      : s === "stopped" ? <StopCircle className="w-3.5 h-3.5 text-rose-500" />
      : <Clock className="w-3.5 h-3.5 text-amber-500" />;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <FlaskConical className="w-4 h-4 text-primary" /> Try it out
          </DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground -mt-2">
          Pick a customer and see exactly what would happen. Nothing is sent — this is only a preview.
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Pretend this happened to</span>
          <Select value={contactId} onValueChange={setContactId}>
            <SelectTrigger className="h-8 text-xs w-[240px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {contacts.slice(0, 20).map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="border-hairline rounded-lg bg-surface/40 p-3 space-y-1.5 max-h-[50vh] overflow-y-auto">
          {result.entries.map((e, i) => (
            <div
              key={i}
              className="flex items-start gap-2 p-2 rounded-md bg-card border-hairline text-xs"
              style={{ marginLeft: e.depth * 16 }}
            >
              <div className="mt-0.5">{icon(e.state)}</div>
              <div className="min-w-0">
                <div className="font-medium">{e.label}</div>
                <div className="text-muted-foreground break-words">{e.detail}</div>
              </div>
            </div>
          ))}
          {result.entries.length <= 1 && (
            <div className="text-xs text-muted-foreground italic p-3 text-center">
              Add some steps and try again.
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Pill tone="info">preview only</Pill> No emails, texts or tasks are created.
          </div>
          <Btn onClick={() => onOpenChange(false)}>Close</Btn>
        </div>
      </DialogContent>
    </Dialog>
  );
}
