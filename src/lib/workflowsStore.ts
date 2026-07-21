import { useSyncExternalStore } from "react";

export type WorkflowTrigger =
  | "form_submitted"
  | "contact_created"
  | "tag_added"
  | "tag_removed"
  | "quote_sent"
  | "quote_accepted"
  | "quote_rejected"
  | "job_created"
  | "job_stage_changed"
  | "invoice_sent"
  | "invoice_paid"
  | "invoice_overdue"
  | "review_received"
  | "email_opened"
  | "email_clicked"
  | "no_activity_period"
  | "date_scheduled";

export type WorkflowActionType =
  | "send_email"
  | "send_sequence"
  | "add_tag"
  | "remove_tag"
  | "create_task"
  | "create_job"
  | "move_stage"
  | "assign_owner"
  | "notify_team"
  | "webhook"
  | "wait"
  | "branch";

export interface WorkflowCondition {
  id: string;
  field: string;
  op: "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "is_set" | "is_empty";
  value: string;
}

export interface WorkflowAction {
  id: string;
  type: WorkflowActionType;
  // send_email
  emailSubject?: string;
  emailTemplate?: string;
  // send_sequence
  sequenceId?: string;
  // tags
  tag?: string;
  // task
  taskTitle?: string;
  taskAssignee?: string;
  taskDueInDays?: number;
  // job
  jobService?: string;
  jobPipelineStage?: string;
  // move_stage
  targetStage?: string;
  // assign
  ownerId?: string;
  // notify
  notifyChannel?: "email" | "in_app" | "slack";
  notifyRecipients?: string;
  notifyMessage?: string;
  // webhook
  webhookUrl?: string;
  webhookMethod?: "POST" | "GET" | "PUT";
  // wait
  waitAmount?: number;
  waitUnit?: "minutes" | "hours" | "days";
  // branch
  branchLabel?: string;
  branchCondition?: WorkflowCondition;
  ifActions?: WorkflowAction[];
  elseActions?: WorkflowAction[];
}

export interface WorkflowRun {
  id: string;
  startedAt: string;
  status: "completed" | "running" | "failed";
  contact?: string;
  summary: string;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  trigger: WorkflowTrigger;
  triggerConfig?: Record<string, string | number>;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  createdAt: string;
  updatedAt: string;
  runs?: WorkflowRun[];
}

const KEY = "workflows:v1";

const seed = (): Workflow[] => {
  const now = new Date().toISOString();
  return [
    {
      id: "wf-1",
      name: "New form submission → welcome email",
      description: "Greet every new lead and notify the sales team.",
      active: true,
      trigger: "form_submitted",
      triggerConfig: { formId: "any" },
      conditions: [],
      actions: [
        { id: "a1", type: "send_email", emailSubject: "Thanks for reaching out", emailTemplate: "default" },
        { id: "a2", type: "add_tag", tag: "new-lead" },
        { id: "a3", type: "notify_team", notifyChannel: "in_app", notifyRecipients: "sales", notifyMessage: "New lead submitted a form" },
      ],
      createdAt: now,
      updatedAt: now,
      runs: [
        { id: "r1", startedAt: now, status: "completed", contact: "Sarah Wilson", summary: "Sent welcome + tagged" },
        { id: "r2", startedAt: now, status: "completed", contact: "James O'Neill", summary: "Sent welcome + tagged" },
      ],
    },
    {
      id: "wf-2",
      name: "Quote sent → follow-up in 3 days",
      description: "Nudge prospects who haven't responded to a quote.",
      active: true,
      trigger: "quote_sent",
      conditions: [],
      actions: [
        { id: "a1", type: "wait", waitAmount: 3, waitUnit: "days" },
        {
          id: "a2",
          type: "branch",
          branchLabel: "Quote accepted?",
          branchCondition: { id: "c1", field: "quote.status", op: "equals", value: "Accepted" },
          ifActions: [{ id: "a2i", type: "add_tag", tag: "won" }],
          elseActions: [
            { id: "a2e1", type: "send_email", emailSubject: "Any questions on your quote?", emailTemplate: "reminder" },
            { id: "a2e2", type: "create_task", taskTitle: "Call prospect about quote", taskAssignee: "owner", taskDueInDays: 1 },
          ],
        },
      ],
      createdAt: now,
      updatedAt: now,
      runs: [],
    },
    {
      id: "wf-3",
      name: "Job stage = Paid → request review",
      description: "Ask happy customers to leave a Google review.",
      active: false,
      trigger: "job_stage_changed",
      triggerConfig: { stage: "Paid" },
      conditions: [],
      actions: [
        { id: "a1", type: "wait", waitAmount: 2, waitUnit: "days" },
        { id: "a2", type: "send_email", emailSubject: "How did we do?", emailTemplate: "review_request" },
        { id: "a3", type: "add_tag", tag: "review-requested" },
      ],
      createdAt: now,
      updatedAt: now,
      runs: [],
    },
  ];
};

const load = (): Workflow[] => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const s = seed();
      localStorage.setItem(KEY, JSON.stringify(s));
      return s;
    }
    return JSON.parse(raw);
  } catch {
    return seed();
  }
};

let state: Workflow[] = load();
const listeners = new Set<() => void>();
const persist = () => {
  localStorage.setItem(KEY, JSON.stringify(state));
  listeners.forEach((l) => l());
};

export const getWorkflows = () => state;
export const findWorkflow = (id: string) => state.find((w) => w.id === id);

export const addWorkflow = (w: Workflow) => {
  state = [w, ...state];
  persist();
};
export const updateWorkflow = (id: string, patch: Partial<Workflow>) => {
  state = state.map((w) => (w.id === id ? { ...w, ...patch, updatedAt: new Date().toISOString() } : w));
  persist();
};
export const deleteWorkflow = (id: string) => {
  state = state.filter((w) => w.id !== id);
  persist();
};
export const duplicateWorkflow = (id: string): Workflow | null => {
  const w = findWorkflow(id);
  if (!w) return null;
  const copy: Workflow = {
    ...w,
    id: `wf-${Date.now()}`,
    name: `${w.name} (copy)`,
    active: false,
    runs: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  addWorkflow(copy);
  return copy;
};

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
export const useWorkflows = () => useSyncExternalStore(subscribe, () => state, () => state);

export const newWorkflow = (): Workflow => {
  const now = new Date().toISOString();
  return {
    id: `wf-${Date.now()}`,
    name: "Untitled workflow",
    description: "",
    active: false,
    trigger: "form_submitted",
    conditions: [],
    actions: [],
    createdAt: now,
    updatedAt: now,
    runs: [],
  };
};

export const triggerMeta: Record<WorkflowTrigger, { label: string; group: string; description: string }> = {
  form_submitted: { label: "Form submitted", group: "Forms", description: "A contact submits any form" },
  contact_created: { label: "Contact created", group: "Contacts", description: "A new contact is added" },
  tag_added: { label: "Tag added to contact", group: "Contacts", description: "A specific tag is applied" },
  tag_removed: { label: "Tag removed from contact", group: "Contacts", description: "A specific tag is removed" },
  quote_sent: { label: "Quote sent", group: "Sales", description: "A quote is sent to a customer" },
  quote_accepted: { label: "Quote accepted", group: "Sales", description: "A quote is marked accepted" },
  quote_rejected: { label: "Quote rejected", group: "Sales", description: "A quote is declined" },
  job_created: { label: "Job created", group: "Pipeline", description: "A new job is added to the pipeline" },
  job_stage_changed: { label: "Job stage changed", group: "Pipeline", description: "A job moves stages" },
  invoice_sent: { label: "Invoice sent", group: "Billing", description: "An invoice is issued" },
  invoice_paid: { label: "Invoice paid", group: "Billing", description: "Payment received" },
  invoice_overdue: { label: "Invoice overdue", group: "Billing", description: "Invoice past due date" },
  review_received: { label: "Review received (GBP)", group: "Marketing", description: "A Google review is left" },
  email_opened: { label: "Email opened", group: "Marketing", description: "A marketing email is opened" },
  email_clicked: { label: "Email link clicked", group: "Marketing", description: "A link inside an email is clicked" },
  no_activity_period: { label: "No activity for period", group: "Contacts", description: "Contact has been inactive" },
  date_scheduled: { label: "On a specific date", group: "Other", description: "One-off or recurring schedule" },
};

export const actionMeta: Record<WorkflowActionType, { label: string; group: string }> = {
  send_email: { label: "Send email", group: "Communication" },
  send_sequence: { label: "Enroll in sequence", group: "Communication" },
  notify_team: { label: "Notify team", group: "Communication" },
  add_tag: { label: "Add tag", group: "Contacts" },
  remove_tag: { label: "Remove tag", group: "Contacts" },
  assign_owner: { label: "Assign owner", group: "Contacts" },
  create_task: { label: "Create task", group: "Work" },
  create_job: { label: "Create job", group: "Work" },
  move_stage: { label: "Move job stage", group: "Work" },
  wait: { label: "Wait / delay", group: "Flow" },
  branch: { label: "Branch (if/else)", group: "Flow" },
  webhook: { label: "Call webhook", group: "Flow" },
};
