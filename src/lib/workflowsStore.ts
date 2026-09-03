import { useSyncExternalStore } from "react";

export type WorkflowTrigger =
  | "form_submitted"
  | "form_abandoned"
  | "contact_created"
  | "tag_added"
  | "tag_removed"
  | "quote_sent"
  | "quote_accepted"
  | "quote_rejected"
  | "job_created"
  | "job_stage_changed"
  | "job_won"
  | "job_lost"
  | "visit_booked"
  | "visit_completed"
  | "job_sheet_completed"
  | "extra_work_added"
  | "invoice_sent"
  | "invoice_paid"
  | "invoice_part_paid"
  | "invoice_overdue"
  | "review_received"
  | "low_rating_review"
  | "email_opened"
  | "email_clicked"
  | "email_replied"
  | "no_activity_period"
  | "date_scheduled"
  | "recurring_schedule";

export type WorkflowActionType =
  | "send_email"
  | "send_sms"
  | "send_sequence"
  | "notify_team"
  | "remind_owner"
  | "add_tag"
  | "remove_tag"
  | "add_to_segment"
  | "remove_from_segment"
  | "assign_owner"
  | "update_field"
  | "add_note"
  | "create_task"
  | "create_job"
  | "move_stage"
  | "send_quote"
  | "send_invoice"
  | "payment_reminder"
  | "book_visit"
  | "wait"
  | "wait_until"
  | "wait_for_good_time"
  | "branch"
  | "ab_split"
  | "exit"
  | "webhook";

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
  // send_sms
  smsMessage?: string;
  // send_sequence
  sequenceId?: string;
  // tags
  tag?: string;
  // segments
  segmentId?: string;
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
  // remind_owner
  reminderMessage?: string;
  reminderInMinutes?: number;
  // update_field
  fieldTarget?: "contact" | "job";
  fieldName?: string;
  fieldValue?: string;
  // add_note
  noteText?: string;
  // quotes / invoices
  quoteTemplate?: string;
  invoiceTemplate?: string;
  invoiceDueInDays?: number;
  paymentReminderTone?: "friendly" | "firm" | "final";
  // book_visit
  visitWhen?: "next_available" | "in_days" | "same_day";
  visitInDays?: number;
  visitDurationMins?: number;
  // webhook
  webhookUrl?: string;
  webhookMethod?: "POST" | "GET" | "PUT";
  // wait
  waitAmount?: number;
  waitUnit?: "minutes" | "hours" | "days";
  // wait_until
  untilCondition?: WorkflowCondition;
  untilMaxDays?: number;
  // wait_for_good_time
  goodTimeWindow?: "business_hours" | "morning" | "afternoon" | "weekday";
  goodTimeWeekday?: string;
  // exit
  exitReason?: string;
  // branch
  branchLabel?: string;
  branchCondition?: WorkflowCondition;
  ifActions?: WorkflowAction[];
  elseActions?: WorkflowAction[];
  // ab_split
  abLabel?: string;
  abSplit?: number; // % that goes down path A
  aActions?: WorkflowAction[];
  bActions?: WorkflowAction[];
}

export interface WorkflowRunStep {
  label: string;
  status: "done" | "skipped" | "waiting" | "failed";
  note?: string;
}

export interface WorkflowRun {
  id: string;
  startedAt: string;
  status: "completed" | "running" | "failed" | "skipped";
  contact?: string;
  summary: string;
  reason?: string;
  steps?: WorkflowRunStep[];
}

export interface WorkflowSettings {
  reEnroll: "once" | "every_time" | "once_per_job";
  workingDaysOnly: boolean;
  quietHours: boolean;
  quietFrom: string;
  quietTo: string;
  maxPerContactPerDay: number;
  skipUnsubscribed: boolean;
  goal: string;
}

export const defaultSettings = (): WorkflowSettings => ({
  reEnroll: "once",
  workingDaysOnly: true,
  quietHours: true,
  quietFrom: "20:00",
  quietTo: "08:00",
  maxPerContactPerDay: 1,
  skipUnsubscribed: true,
  goal: "none",
});

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  trigger: WorkflowTrigger;
  triggerConfig?: Record<string, string | number>;
  conditionMatch?: "all" | "any";
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  settings?: WorkflowSettings;
  createdAt: string;
  updatedAt: string;
  runs?: WorkflowRun[];
}

const KEY = "workflows:v2";

const seed = (): Workflow[] => {
  const now = new Date().toISOString();
  const ago = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();
  return [
    {
      id: "wf-1",
      name: "New form submission → welcome email",
      description: "Greet every new lead and notify the sales team.",
      active: true,
      trigger: "form_submitted",
      triggerConfig: { formId: "any" },
      conditionMatch: "all",
      conditions: [],
      settings: defaultSettings(),
      actions: [
        { id: "a1", type: "send_email", emailSubject: "Thanks for reaching out", emailTemplate: "default" },
        { id: "a2", type: "add_tag", tag: "new-lead" },
        { id: "a3", type: "notify_team", notifyChannel: "in_app", notifyRecipients: "sales", notifyMessage: "New lead submitted a form" },
      ],
      createdAt: now,
      updatedAt: now,
      runs: [
        {
          id: "r1",
          startedAt: ago(3),
          status: "completed",
          contact: "Sarah Wilson",
          summary: "Sent welcome + tagged",
          steps: [
            { label: "Send an email", status: "done" },
            { label: "Add a label", status: "done" },
            { label: "Tell the team", status: "done" },
          ],
        },
        {
          id: "r2",
          startedAt: ago(9),
          status: "completed",
          contact: "James O'Neill",
          summary: "Sent welcome + tagged",
          steps: [
            { label: "Send an email", status: "done" },
            { label: "Add a label", status: "done" },
            { label: "Tell the team", status: "done" },
          ],
        },
        {
          id: "r3",
          startedAt: ago(20),
          status: "skipped",
          contact: "Priya Shah",
          summary: "Not started",
          reason: "Already been through this automation once",
        },
        {
          id: "r4",
          startedAt: ago(26),
          status: "running",
          contact: "Tom Bright",
          summary: "Waiting for the next step",
          steps: [
            { label: "Send an email", status: "done" },
            { label: "Add a label", status: "waiting" },
          ],
        },
      ],
    },
    {
      id: "wf-2",
      name: "Quote sent → follow-up in 3 days",
      description: "Nudge prospects who haven't responded to a quote.",
      active: true,
      trigger: "quote_sent",
      conditionMatch: "all",
      conditions: [],
      settings: { ...defaultSettings(), goal: "quote_accepted" },
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
      conditionMatch: "all",
      conditions: [],
      settings: defaultSettings(),
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

const migrate = (list: Workflow[]): Workflow[] =>
  list.map((w) => ({
    ...w,
    conditionMatch: w.conditionMatch ?? "all",
    settings: { ...defaultSettings(), ...(w.settings ?? {}) },
  }));

const load = (): Workflow[] => {
  try {
    const raw = localStorage.getItem(KEY) ?? localStorage.getItem("workflows:v1");
    if (!raw) {
      const s = seed();
      localStorage.setItem(KEY, JSON.stringify(s));
      return s;
    }
    return migrate(JSON.parse(raw));
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
    conditionMatch: "all",
    conditions: [],
    actions: [],
    settings: defaultSettings(),
    triggerConfig: {},
    createdAt: now,
    updatedAt: now,
    runs: [],
  };
};

/** Count every step, including the ones nested inside branches / A-B tests. */
export const countSteps = (actions: WorkflowAction[]): number =>
  actions.reduce(
    (n, a) =>
      n +
      1 +
      countSteps(a.ifActions ?? []) +
      countSteps(a.elseActions ?? []) +
      countSteps(a.aActions ?? []) +
      countSteps(a.bActions ?? []),
    0,
  );

const messageTypes: WorkflowActionType[] = ["send_email", "send_sms", "send_sequence", "payment_reminder"];
const flatten = (actions: WorkflowAction[]): WorkflowAction[] =>
  actions.flatMap((a) => [
    a,
    ...flatten(a.ifActions ?? []),
    ...flatten(a.elseActions ?? []),
    ...flatten(a.aActions ?? []),
    ...flatten(a.bActions ?? []),
  ]);

/** Simple deterministic demo stats so the detail page can show outcomes. */
export const workflowStats = (w: Workflow) => {
  const runs = w.runs ?? [];
  const enrolled = runs.length;
  const finished = runs.filter((r) => r.status === "completed").length;
  const skipped = runs.filter((r) => r.status === "skipped").length;
  const failed = runs.filter((r) => r.status === "failed").length;
  const msgs = flatten(w.actions).filter((a) => messageTypes.includes(a.type)).length;
  const seedNum = w.id.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
  const opened = msgs && finished ? Math.min(finished, Math.round(finished * (0.4 + ((seedNum % 30) / 100)))) : 0;
  const clicked = opened ? Math.round(opened * 0.45) : 0;
  return { enrolled, finished, skipped, failed, opened, clicked };
};

/** Warnings shown before switching an automation on. */
export const checkWorkflow = (w: Workflow): string[] => {
  const warnings: string[] = [];
  const all = flatten(w.actions);
  if (all.length === 0) warnings.push("There are no steps yet — nothing would happen.");
  if (all.some((a) => a.type === "send_email" && !a.emailSubject?.trim()))
    warnings.push("One of the emails has no subject line.");
  if (all.some((a) => a.type === "send_sms" && !a.smsMessage?.trim()))
    warnings.push("One of the text messages is empty.");
  if (all.some((a) => (a.type === "add_tag" || a.type === "remove_tag") && !a.tag?.trim()))
    warnings.push("One label step has no label chosen.");
  if (all.some((a) => a.type === "webhook" && !a.webhookUrl?.trim()))
    warnings.push("A 'send data to another system' step has no web address.");
  if (all.some((a) => a.type === "branch" && (a.ifActions?.length ?? 0) === 0 && (a.elseActions?.length ?? 0) === 0))
    warnings.push("A split path has no steps on either side.");
  if (w.settings?.reEnroll === "every_time" && w.trigger === "tag_added")
    warnings.push("Repeating every time on a label trigger can send the same message over and over.");
  if (w.conditions.some((c) => !["is_set", "is_empty"].includes(c.op) && !c.value.trim()))
    warnings.push("One of the 'only if' rules has no value filled in.");
  return warnings;
};

export const triggerMeta: Record<WorkflowTrigger, { label: string; group: string; description: string }> = {
  form_submitted: { label: "Someone sends a form", group: "Forms", description: "A customer fills in and sends one of your forms" },
  form_abandoned: { label: "Someone starts a form but doesn't finish", group: "Forms", description: "They began filling in a form and left before sending it" },
  contact_created: { label: "A new contact is added", group: "Contacts", description: "Someone new is added to your contacts" },
  tag_added: { label: "A label is added to a contact", group: "Contacts", description: "A specific label is put on a contact" },
  tag_removed: { label: "A label is removed from a contact", group: "Contacts", description: "A specific label is taken off a contact" },
  quote_sent: { label: "A quote is sent", group: "Quotes and invoices", description: "You send a quote to a customer" },
  quote_accepted: { label: "A quote is accepted", group: "Quotes and invoices", description: "A customer accepts your quote" },
  quote_rejected: { label: "A quote is turned down", group: "Quotes and invoices", description: "A customer declines your quote" },
  job_created: { label: "A new job is created", group: "Jobs", description: "A job is added to your pipeline" },
  job_stage_changed: { label: "A job moves to a new stage", group: "Jobs", description: "A job moves into a different column" },
  job_won: { label: "A job is won", group: "Jobs", description: "A job is marked as won" },
  job_lost: { label: "A job is lost", group: "Jobs", description: "A job is marked as lost" },
  visit_booked: { label: "A visit is booked in", group: "Jobs", description: "An appointment goes in the diary" },
  visit_completed: { label: "A visit is finished", group: "Jobs", description: "An engineer marks a visit as done in the field app" },
  job_sheet_completed: { label: "A job sheet is filled in", group: "Jobs", description: "Photos and notes are completed on site" },
  extra_work_added: { label: "Extra work is spotted on site", group: "Jobs", description: "An engineer adds extra work during a visit" },
  invoice_sent: { label: "An invoice is sent", group: "Quotes and invoices", description: "You issue an invoice" },
  invoice_paid: { label: "An invoice is paid", group: "Quotes and invoices", description: "You receive payment in full" },
  invoice_part_paid: { label: "An invoice is part paid", group: "Quotes and invoices", description: "Some of the money comes in, but not all" },
  invoice_overdue: { label: "An invoice becomes overdue", group: "Quotes and invoices", description: "An invoice passes its due date" },
  review_received: { label: "You get a Google review", group: "Marketing", description: "Someone leaves a review on your Google profile" },
  low_rating_review: { label: "You get a poor review (3 stars or less)", group: "Marketing", description: "A low rating comes in so you can put it right quickly" },
  email_opened: { label: "Someone opens your email", group: "Marketing", description: "A marketing email is opened" },
  email_clicked: { label: "Someone clicks a link in your email", group: "Marketing", description: "A link inside an email is clicked" },
  email_replied: { label: "Someone replies to your email", group: "Marketing", description: "A customer writes back" },
  no_activity_period: { label: "A contact goes quiet", group: "Contacts", description: "You have not heard from a contact for a while" },
  date_scheduled: { label: "On a certain date", group: "Other", description: "A one-off date" },
  recurring_schedule: { label: "On a repeating schedule", group: "Other", description: "Every week or month, for everyone who matches your rules" },
};

export const actionMeta: Record<WorkflowActionType, { label: string; group: string }> = {
  send_email: { label: "Send an email", group: "Get in touch" },
  send_sms: { label: "Send a text message", group: "Get in touch" },
  send_sequence: { label: "Start an email follow-up", group: "Get in touch" },
  notify_team: { label: "Tell the team", group: "Get in touch" },
  remind_owner: { label: "Remind the job owner", group: "Get in touch" },
  add_tag: { label: "Add a label", group: "Contacts" },
  remove_tag: { label: "Remove a label", group: "Contacts" },
  add_to_segment: { label: "Add to a list", group: "Contacts" },
  remove_from_segment: { label: "Remove from a list", group: "Contacts" },
  assign_owner: { label: "Assign to someone", group: "Contacts" },
  update_field: { label: "Update a detail", group: "Contacts" },
  add_note: { label: "Add a note to the timeline", group: "Contacts" },
  create_task: { label: "Create a task", group: "Work" },
  create_job: { label: "Create a job", group: "Work" },
  move_stage: { label: "Move the job to another stage", group: "Work" },
  send_quote: { label: "Send a quote", group: "Money" },
  send_invoice: { label: "Send an invoice", group: "Money" },
  payment_reminder: { label: "Send a payment reminder", group: "Money" },
  book_visit: { label: "Book a visit", group: "Work" },
  wait: { label: "Wait a while", group: "Timing and choices" },
  wait_until: { label: "Wait until something is true", group: "Timing and choices" },
  wait_for_good_time: { label: "Wait for a good time to send", group: "Timing and choices" },
  branch: { label: "Split the path (if / otherwise)", group: "Timing and choices" },
  ab_split: { label: "Try two versions (A/B)", group: "Timing and choices" },
  exit: { label: "Stop here", group: "Timing and choices" },
  webhook: { label: "Send data to another system", group: "Advanced" },
};

export const conditionFields: { value: string; label: string }[] = [
  { value: "contact.tag", label: "Contact label" },
  { value: "contact.lifecycle", label: "Customer stage" },
  { value: "contact.source", label: "Where they came from" },
  { value: "contact.channel", label: "Marketing channel" },
  { value: "contact.area", label: "Area / postcode" },
  { value: "contact.totalSpend", label: "Total they have spent" },
  { value: "contact.daysSinceLastJob", label: "Days since their last job" },
  { value: "contact.hasAcceptedQuote", label: "Has an accepted quote" },
  { value: "job.value", label: "Job value (£)" },
  { value: "job.stage", label: "Job stage" },
  { value: "job.service", label: "Service type" },
  { value: "quote.status", label: "Quote status" },
  { value: "invoice.status", label: "Invoice status" },
  { value: "email.opened", label: "Email opened" },
  { value: "email.clicked", label: "Email clicked" },
];

export const conditionOps: { value: WorkflowCondition["op"]; label: string }[] = [
  { value: "equals", label: "is" },
  { value: "not_equals", label: "is not" },
  { value: "contains", label: "contains" },
  { value: "greater_than", label: "is more than" },
  { value: "less_than", label: "is less than" },
  { value: "is_set", label: "has a value" },
  { value: "is_empty", label: "is blank" },
];

export const segmentOptions = [
  { value: "new-enquiries", label: "New enquiries" },
  { value: "repeat-customers", label: "Repeat customers" },
  { value: "quiet-90", label: "Quiet for 90+ days" },
  { value: "high-value", label: "High value customers" },
  { value: "service-plan", label: "Service plan members" },
];
