import { useState } from "react";
import { PageHeader, PageBody, Btn, Pill } from "@/components/layout/PageShell";
import { Plus, Zap, Pencil, Mail, Clock, Tag, CheckSquare, GitBranch } from "lucide-react";
import { automations as initialAutomations } from "@/data/mockData";
import { CampaignsTab } from "@/components/email/CampaignsTab";
import { AutomationBuilderDialog, type BuilderAutomation, type TriggerType } from "@/components/email/AutomationBuilderDialog";

const triggerLabels: Record<string, string> = {
  form_submitted: "Form submitted",
  quote_accepted: "Quote accepted",
  job_paid: "Job marked paid",
  job_stage_changed: "Job stage changed",
  tag_added: "Tag added",
  no_job_in_period: "No job in period",
  date_anniversary: "Date anniversary",
};

const stepIcon: Record<string, typeof Mail> = {
  send_email: Mail,
  wait: Clock,
  tag_contact: Tag,
  create_task: CheckSquare,
  branch: GitBranch,
};

const seed: BuilderAutomation[] = initialAutomations.map((a, i) => ({
  id: a.id,
  name: a.name,
  active: a.active,
  trigger: (["job_paid", "no_job_in_period", "date_anniversary"][i] ?? "form_submitted") as TriggerType,
  conditions: [],
  steps:
    i === 0
      ? [
          { id: `${a.id}-s1`, type: "wait", waitAmount: 2, waitUnit: "days" },
          { id: `${a.id}-s2`, type: "send_email", emailSubject: "How did we do?", emailTemplate: "review_request" },
          { id: `${a.id}-s3`, type: "tag_contact", tag: "review-requested" },
        ]
      : i === 1
      ? [
          { id: `${a.id}-s1`, type: "send_email", emailSubject: "We miss you — 15% off", emailTemplate: "winback" },
          { id: `${a.id}-s2`, type: "wait", waitAmount: 7, waitUnit: "days" },
          { id: `${a.id}-s3`, type: "branch", branchLabel: "Has opened email" },
          { id: `${a.id}-s4`, type: "create_task", taskTitle: "Follow up with lapsed customer", taskAssignee: "sales" },
        ]
      : [
          { id: `${a.id}-s1`, type: "send_email", emailSubject: "Time for your annual service", emailTemplate: "reminder" },
          { id: `${a.id}-s2`, type: "wait", waitAmount: 14, waitUnit: "days" },
        ],
}));

export default function Email() {
  const [tab, setTab] = useState<"campaigns" | "automations">("campaigns");
  const [list, setList] = useState<BuilderAutomation[]>(seed);
  const [editing, setEditing] = useState<BuilderAutomation | null>(null);
  const [open, setOpen] = useState(false);

  const openNew = () => {
    setEditing(null);
    setOpen(true);
  };
  const openEdit = (a: BuilderAutomation) => {
    setEditing(a);
    setOpen(true);
  };
  const onSave = (a: BuilderAutomation) => {
    setList((prev) => {
      const idx = prev.findIndex((x) => x.id === a.id);
      if (idx === -1) return [...prev, a];
      const next = [...prev];
      next[idx] = a;
      return next;
    });
  };
  const toggleActive = (id: string) =>
    setList((prev) => prev.map((a) => (a.id === id ? { ...a, active: !a.active } : a)));

  return (
    <>
      <PageHeader
        title="Email marketing"
        description="Send campaigns and run automated journeys"
        actions={
          tab === "automations" ? (
            <Btn variant="primary" onClick={openNew}>
              <Plus className="w-3.5 h-3.5" /> New automation
            </Btn>
          ) : null
        }
      />
      <PageBody>
        <div className="flex border-b-hairline mb-4 -mt-2">
          {(["campaigns", "automations"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`h-9 px-3 text-sm capitalize border-b-2 -mb-px transition-colors ${
                tab === t ? "border-primary text-foreground font-medium" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "campaigns" ? (
          <CampaignsTab />
        ) : (
          <div className="space-y-2">
            {list.map((a) => (
              <div key={a.id} className="border-hairline rounded-lg bg-card p-4 flex items-center gap-4">
                <div className="w-9 h-9 rounded-md bg-surface flex items-center justify-center">
                  <Zap className="w-4 h-4 text-amber-500" strokeWidth={1.75} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{a.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
                    <span>Trigger: {triggerLabels[a.trigger] ?? a.trigger}</span>
                    <span>·</span>
                    <span>{a.steps.length} steps</span>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1">
                      {a.steps.slice(0, 5).map((s, i) => {
                        const Icon = stepIcon[s.type] ?? Mail;
                        return <Icon key={i} className="w-3 h-3" strokeWidth={1.75} />;
                      })}
                    </span>
                  </div>
                </div>
                <Pill tone={a.active ? "success" : "neutral"}>{a.active ? "On" : "Off"}</Pill>
                <button
                  onClick={() => toggleActive(a.id)}
                  className={`relative w-9 h-5 rounded-full transition-colors ${a.active ? "bg-primary" : "bg-surface border-hairline"}`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${a.active ? "translate-x-4" : "translate-x-0.5"}`}
                  />
                </button>
                <Btn onClick={() => openEdit(a)}>
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </Btn>
              </div>
            ))}
            {list.length === 0 && (
              <div className="border-hairline border-dashed rounded-lg p-10 text-center text-sm text-muted-foreground">
                No automations yet. Create one to start nurturing leads automatically.
              </div>
            )}
          </div>
        )}
      </PageBody>

      <AutomationBuilderDialog
        open={open}
        onOpenChange={setOpen}
        initial={editing ?? undefined}
        onSave={onSave}
      />
    </>
  );
}
