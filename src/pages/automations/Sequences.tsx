import { Repeat, Plus } from "lucide-react";
import { PageHeader, PageBody, Btn, Pill } from "@/components/layout/PageShell";

const mockSequences = [
  { name: "New lead nurture (5 steps)", audience: "Segment: New leads", status: "active" as const, sent: "312 sent" },
  { name: "Post-job review request (2 steps)", audience: "Trigger: Job won", status: "active" as const, sent: "48 sent" },
  { name: "Reactivation (4 steps)", audience: "Segment: Cold > 90d", status: "draft" as const, sent: "—" },
];

export default function Sequences() {
  return (
    <>
      <PageHeader
        title="Email sequences"
        description="Multi-step drip campaigns. Also editable inside the Email module."
        actions={
          <Btn variant="primary">
            <Plus className="w-3.5 h-3.5" /> New sequence
          </Btn>
        }
      />
      <PageBody>
        <div className="border-hairline rounded-lg bg-surface overflow-hidden">
          <div className="grid grid-cols-[1fr_240px_120px_120px] px-4 h-9 border-b-hairline text-xs text-muted-foreground items-center">
            <div>Name</div>
            <div>Audience</div>
            <div>Status</div>
            <div className="text-right">Activity</div>
          </div>
          {mockSequences.map((s) => (
            <div
              key={s.name}
              className="grid grid-cols-[1fr_240px_120px_120px] px-4 h-12 border-b-hairline last:border-b-0 items-center text-sm hover:bg-surface-hover cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Repeat className="w-4 h-4 text-muted-foreground" strokeWidth={1.75} />
                <span className="font-medium truncate">{s.name}</span>
              </div>
              <div className="text-muted-foreground truncate">{s.audience}</div>
              <div>
                <Pill tone={s.status === "active" ? "success" : "neutral"}>{s.status}</Pill>
              </div>
              <div className="text-right text-muted-foreground text-xs">{s.sent}</div>
            </div>
          ))}
        </div>
      </PageBody>
    </>
  );
}
