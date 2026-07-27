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
    name: "Untitled automation",
    description: "",
    active: false,
    trigger: "form_submitted",
    conditions: [],
    actions: [],
    triggerConfig: { reEnroll: "false" },
    createdAt: now,
    updatedAt: now,
    runs: [],
  };
};

export const triggerMeta: Record<WorkflowTrigger, { label: string; group: string; description: string }> = {
  form_submitted: { label: "Someone sends a form", group: "Forms", description: "A customer fills in and sends one of your forms" },
  contact_created: { label: "A new contact is added", group: "Contacts", description: "Someone new is added to your contacts" },
  tag_added: { label: "A label is added to a contact", group: "Contacts", description: "A specific label is put on a contact" },
  tag_removed: { label: "A label is removed from a contact", group: "Contacts", description: "A specific label is taken off a contact" },
  quote_sent: { label: "A quote is sent", group: "Quotes and invoices", description: "You send a quote to a customer" },
  quote_accepted: { label: "A quote is accepted", group: "Quotes and invoices", description: "A customer accepts your quote" },
  quote_rejected: { label: "A quote is turned down", group: "Quotes and invoices", description: "A customer declines your quote" },
  job_created: { label: "A new job is created", group: "Jobs", description: "A job is added to your pipeline" },
  job_stage_changed: { label: "A job moves to a new stage", group: "Jobs", description: "A job moves into a different column" },
  invoice_sent: { label: "An invoice is sent", group: "Quotes and invoices", description: "You issue an invoice" },
  invoice_paid: { label: "An invoice is paid", group: "Quotes and invoices", description: "You receive payment" },
  invoice_overdue: { label: "An invoice becomes overdue", group: "Quotes and invoices", description: "An invoice passes its due date" },
  review_received: { label: "You get a Google review", group: "Marketing", description: "Someone leaves a review on your Google profile" },
  email_opened: { label: "Someone opens your email", group: "Marketing", description: "A marketing email is opened" },
  email_clicked: { label: "Someone clicks a link in your email", group: "Marketing", description: "A link inside an email is clicked" },
  no_activity_period: { label: "A contact goes quiet", group: "Contacts", description: "You have not heard from a contact for a while" },
  date_scheduled: { label: "On a certain date", group: "Other", description: "A one-off or repeating date" },
};

export const actionMeta: Record<WorkflowActionType, { label: string; group: string }> = {
  send_email: { label: "Send an email", group: "Get in touch" },
  send_sequence: { label: "Start an email follow-up", group: "Get in touch" },
  notify_team: { label: "Tell the team", group: "Get in touch" },
  add_tag: { label: "Add a label", group: "Contacts" },
  remove_tag: { label: "Remove a label", group: "Contacts" },
  assign_owner: { label: "Assign to someone", group: "Contacts" },
  create_task: { label: "Create a task", group: "Work" },
  create_job: { label: "Create a job", group: "Work" },
  move_stage: { label: "Move the job to another stage", group: "Work" },
  wait: { label: "Wait a while", group: "Timing and choices" },
  branch: { label: "Split the path (if / otherwise)", group: "Timing and choices" },
  webhook: { label: "Send data to another system", group: "Advanced" },
};
