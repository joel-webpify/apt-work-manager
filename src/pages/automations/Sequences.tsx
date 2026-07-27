import { Repeat, Plus } from "lucide-react";
import { PageHeader, PageBody, Btn, Pill } from "@/components/layout/PageShell";

const mockSequences = [
  { name: "Warm up new enquiries (5 emails)", audience: "New enquiries", status: "active" as const, sent: "312 sent" },
  { name: "Ask for a review after the job (2 emails)", audience: "When a job is won", status: "active" as const, sent: "48 sent" },
  { name: "Win back quiet customers (4 emails)", audience: "Quiet for 90+ days", status: "draft" as const, sent: "—" },
];

export default function Sequences() {
  return (
    <>
      <PageHeader
        title="Email follow-ups"
        description="A series of emails that go out automatically, spaced out over days or weeks."
        actions={
          <Btn variant="primary">
            <Plus className="w-3.5 h-3.5" /> New follow-up
          </Btn>
        }
      />
      <PageBody>
        <div className="border-hairline rounded-lg bg-surface overflow-hidden">
          <div className="grid grid-cols-[1fr_240px_120px_120px] px-4 h-9 border-b-hairline text-xs text-muted-foreground items-center">
            <div>Name</div>
            <div>Who gets it</div>
            <div>Status</div>
            <div className="text-right">Sent so far</div>
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
