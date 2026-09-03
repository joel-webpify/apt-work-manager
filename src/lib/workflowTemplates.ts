import { defaultSettings, type Workflow, type WorkflowAction, type WorkflowTrigger } from "@/lib/workflowsStore";

export interface WorkflowTemplate {
  id: string;
  name: string;
  blurb: string;
  category: "Win more work" | "Get paid" | "Keep customers" | "Reputation";
  trigger: WorkflowTrigger;
  triggerConfig?: Record<string, string | number>;
  actions: WorkflowAction[];
}

const a = (id: string, action: Omit<WorkflowAction, "id">): WorkflowAction => ({ id, ...action } as WorkflowAction);

export const workflowTemplates: WorkflowTemplate[] = [
  {
    id: "tpl-quote-chase",
    name: "Chase a quote that has gone quiet",
    blurb: "Three gentle nudges over two weeks, stopping the moment they accept.",
    category: "Win more work",
    trigger: "quote_sent",
    actions: [
      a("t1", { type: "wait", waitAmount: 2, waitUnit: "days" }),
      a("t2", { type: "send_email", emailSubject: "Any questions about your quote?", emailTemplate: "reminder" }),
      a("t3", { type: "wait", waitAmount: 4, waitUnit: "days" }),
      a("t4", { type: "send_sms", smsMessage: "Hi {{first_name}}, just checking you got our quote — happy to talk it through." }),
      a("t5", { type: "wait", waitAmount: 7, waitUnit: "days" }),
      a("t6", { type: "create_task", taskTitle: "Ring about the open quote", taskAssignee: "owner", taskDueInDays: 1 }),
    ],
  },
  {
    id: "tpl-review",
    name: "Ask for a Google review after a job is paid",
    blurb: "Waits two days, then asks nicely — and flags unhappy customers to you first.",
    category: "Reputation",
    trigger: "invoice_paid",
    actions: [
      a("t1", { type: "wait", waitAmount: 2, waitUnit: "days" }),
      a("t2", { type: "wait_for_good_time", goodTimeWindow: "business_hours" }),
      a("t3", { type: "send_email", emailSubject: "How did we do?", emailTemplate: "review_request" }),
      a("t4", { type: "add_tag", tag: "review-requested" }),
    ],
  },
  {
    id: "tpl-fast-response",
    name: "New enquiry → reply within 5 minutes",
    blurb: "Speed wins jobs. Text and email straight away, plus a nudge to the team.",
    category: "Win more work",
    trigger: "form_submitted",
    triggerConfig: { formId: "any" },
    actions: [
      a("t1", { type: "send_sms", smsMessage: "Thanks for getting in touch — we'll call you shortly." }),
      a("t2", { type: "send_email", emailSubject: "Thanks for your enquiry", emailTemplate: "welcome" }),
      a("t3", { type: "notify_team", notifyChannel: "in_app", notifyRecipients: "sales", notifyMessage: "New enquiry — call within 5 minutes" }),
      a("t4", { type: "create_task", taskTitle: "Call the new enquiry", taskAssignee: "sales", taskDueInDays: 0 }),
    ],
  },
  {
    id: "tpl-rebook",
    name: "Rebook the annual service",
    blurb: "Eleven months after the job, invite them back before a competitor does.",
    category: "Keep customers",
    trigger: "invoice_paid",
    actions: [
      a("t1", { type: "wait", waitAmount: 330, waitUnit: "days" }),
      a("t2", { type: "send_email", emailSubject: "Time for your annual service", emailTemplate: "reminder" }),
      a("t3", { type: "wait", waitAmount: 7, waitUnit: "days" }),
      a("t4", {
        type: "branch",
        branchLabel: "Have they booked?",
        branchCondition: { id: "tc1", field: "job.stage", op: "is_set", value: "" },
        ifActions: [a("t4a", { type: "exit", exitReason: "They booked — nothing more to do" })],
        elseActions: [a("t4b", { type: "send_sms", smsMessage: "Shall we get your annual service in the diary?" })],
      }),
    ],
  },
  {
    id: "tpl-overdue",
    name: "Invoice overdue → reminder ladder",
    blurb: "Polite at 3 days, firmer at 7, final notice at 14 — with a task for you.",
    category: "Get paid",
    trigger: "invoice_overdue",
    actions: [
      a("t1", { type: "wait", waitAmount: 3, waitUnit: "days" }),
      a("t2", { type: "payment_reminder", paymentReminderTone: "friendly" }),
      a("t3", { type: "wait", waitAmount: 4, waitUnit: "days" }),
      a("t4", { type: "payment_reminder", paymentReminderTone: "firm" }),
      a("t5", { type: "wait", waitAmount: 7, waitUnit: "days" }),
      a("t6", { type: "payment_reminder", paymentReminderTone: "final" }),
      a("t7", { type: "create_task", taskTitle: "Chase unpaid invoice by phone", taskAssignee: "admin", taskDueInDays: 1 }),
    ],
  },
  {
    id: "tpl-winback",
    name: "Win back customers who have gone quiet",
    blurb: "Ninety days of silence, then an offer — and a task if they engage.",
    category: "Keep customers",
    trigger: "no_activity_period",
    triggerConfig: { days: 90 },
    actions: [
      a("t1", { type: "add_to_segment", segmentId: "quiet-90" }),
      a("t2", { type: "send_email", emailSubject: "We miss you — 15% off your next visit", emailTemplate: "winback" }),
      a("t3", { type: "wait", waitAmount: 5, waitUnit: "days" }),
      a("t4", {
        type: "branch",
        branchLabel: "Did they open it?",
        branchCondition: { id: "tc2", field: "email.opened", op: "equals", value: "yes" },
        ifActions: [a("t4a", { type: "create_task", taskTitle: "Follow up — interested customer", taskAssignee: "sales", taskDueInDays: 1 })],
        elseActions: [a("t4b", { type: "exit", exitReason: "Not interested for now" })],
      }),
    ],
  },
  {
    id: "tpl-extra-work",
    name: "Extra work spotted on site → quote it same day",
    blurb: "Turn engineer findings into money instead of forgotten notes.",
    category: "Win more work",
    trigger: "extra_work_added",
    actions: [
      a("t1", { type: "notify_team", notifyChannel: "in_app", notifyRecipients: "sales", notifyMessage: "Extra work found on site — quote it today" }),
      a("t2", { type: "send_quote", quoteTemplate: "extra-work" }),
      a("t3", { type: "wait", waitAmount: 2, waitUnit: "days" }),
      a("t4", { type: "create_task", taskTitle: "Follow up on the extra work quote", taskAssignee: "owner", taskDueInDays: 1 }),
    ],
  },
  {
    id: "tpl-bad-review",
    name: "Poor review → put it right fast",
    blurb: "A low rating pings the owner immediately with a task to call.",
    category: "Reputation",
    trigger: "low_rating_review",
    actions: [
      a("t1", { type: "remind_owner", reminderMessage: "Poor review received — call the customer today", reminderInMinutes: 15 }),
      a("t2", { type: "add_tag", tag: "needs-attention" }),
      a("t3", { type: "create_task", taskTitle: "Call unhappy customer", taskAssignee: "admin", taskDueInDays: 0 }),
      a("t4", { type: "add_note", noteText: "Low rating received — see review in Google Business Profile." }),
    ],
  },
];

export const workflowFromTemplate = (t: WorkflowTemplate): Workflow => {
  const now = new Date().toISOString();
  const stamp = Date.now().toString(36);
  const rekey = (list: WorkflowAction[], p: string): WorkflowAction[] =>
    list.map((act, i) => ({
      ...act,
      id: `${p}-${i}-${stamp}`,
      ifActions: act.ifActions ? rekey(act.ifActions, `${p}-${i}i`) : undefined,
      elseActions: act.elseActions ? rekey(act.elseActions, `${p}-${i}e`) : undefined,
      aActions: act.aActions ? rekey(act.aActions, `${p}-${i}a`) : undefined,
      bActions: act.bActions ? rekey(act.bActions, `${p}-${i}b`) : undefined,
    }));
  return {
    id: `wf-${Date.now()}`,
    name: t.name,
    description: t.blurb,
    active: false,
    trigger: t.trigger,
    triggerConfig: t.triggerConfig ?? {},
    conditionMatch: "all",
    conditions: [],
    actions: rekey(t.actions, "a"),
    settings: defaultSettings(),
    createdAt: now,
    updatedAt: now,
    runs: [],
  };
};
