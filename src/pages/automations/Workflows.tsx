import { Workflow, Plus } from "lucide-react";
import { PageHeader, PageBody, Btn, Pill } from "@/components/layout/PageShell";

const mockWorkflows = [
  {
    name: "New form submission → welcome email",
    trigger: "Form: Contact form",
    status: "active" as const,
    runs: "128 runs · 7 days",
  },
  {
    name: "Quote sent → follow-up in 3 days",
    trigger: "Quote status: sent",
    status: "active" as const,
    runs: "42 runs · 7 days",
  },
  {
    name: "Job stage = Won → request review",
    trigger: "Pipeline stage: Won",
    status: "draft" as const,
    runs: "—",
  },
];

export default function Workflows() {
  return (
    <>
      <PageHeader
        title="Workflows"
        description="Cross-module automations triggered by activity."
        actions={
          <Btn variant="primary">
            <Plus className="w-3.5 h-3.5" /> New workflow
          </Btn>
        }
      />
      <PageBody>
        <div className="border-hairline rounded-lg bg-surface overflow-hidden">
          <div className="grid grid-cols-[1fr_240px_120px_140px] px-4 h-9 border-b-hairline text-xs text-muted-foreground items-center">
            <div>Name</div>
            <div>Trigger</div>
            <div>Status</div>
            <div className="text-right">Activity</div>
          </div>
          {mockWorkflows.map((w) => (
            <div
              key={w.name}
              className="grid grid-cols-[1fr_240px_120px_140px] px-4 h-12 border-b-hairline last:border-b-0 items-center text-sm hover:bg-surface-hover cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Workflow className="w-4 h-4 text-muted-foreground" strokeWidth={1.75} />
                <span className="font-medium truncate">{w.name}</span>
              </div>
              <div className="text-muted-foreground truncate">{w.trigger}</div>
              <div>
                <Pill tone={w.status === "active" ? "success" : "neutral"}>{w.status}</Pill>
              </div>
              <div className="text-right text-muted-foreground text-xs">{w.runs}</div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          Visual workflow builder coming next: form submits, tag changes, pipeline moves, review
          received → send email, add tag, create task, delay, branch.
        </p>
      </PageBody>
    </>
  );
}
