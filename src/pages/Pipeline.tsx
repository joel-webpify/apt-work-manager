import { useState } from "react";
import { PageHeader, PageBody, Btn, StatusDot } from "@/components/layout/PageShell";
import { Plus, X, Phone, Mail, MapPin } from "lucide-react";
import { jobs, stages, stageColors, type Job } from "@/data/mockData";

export default function Pipeline() {
  const [selected, setSelected] = useState<Job | null>(null);

  return (
    <>
      <PageHeader
        title="Jobs & pipeline"
        description="Drag and track jobs through every stage"
        actions={<Btn variant="primary"><Plus className="w-3.5 h-3.5" /> New job</Btn>}
      />
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-3 px-8 py-6 h-full min-w-max">
          {stages.map((stage) => {
            const stageJobs = jobs.filter((j) => j.stage === stage);
            const total = stageJobs.reduce((s, j) => s + j.value, 0);
            return (
              <div key={stage} className="w-[260px] shrink-0 flex flex-col">
                <div className="flex items-center gap-2 mb-2 px-1">
                  <StatusDot color={stageColors[stage]} />
                  <span className="text-sm font-medium">{stage}</span>
                  <span className="text-xs text-muted-foreground">{stageJobs.length}</span>
                  <span className="ml-auto text-xs text-muted-foreground tabular-nums">£{total}</span>
                </div>
                <div className="flex-1 space-y-2 overflow-y-auto pb-4">
                  {stageJobs.map((job) => (
                    <button
                      key={job.id}
                      onClick={() => setSelected(job)}
                      className="w-full text-left bg-card border-hairline rounded-lg p-3 hover:bg-surface-hover transition-colors relative overflow-hidden"
                      style={{ boxShadow: "none" }}
                    >
                      <div
                        className="absolute left-0 top-0 bottom-0 w-0.5"
                        style={{ backgroundColor: stageColors[stage] }}
                      />
                      <div className="text-sm font-medium truncate">{job.customer}</div>
                      <div className="text-xs text-muted-foreground mt-0.5 truncate">{job.service}</div>
                      <div className="flex items-center justify-between mt-2.5">
                        <span className="text-sm font-medium tabular-nums">£{job.value}</span>
                        <span className="text-xs text-muted-foreground">{job.daysInStage}d</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selected && <JobDrawer job={selected} onClose={() => setSelected(null)} />}
    </>
  );
}

function JobDrawer({ job, onClose }: { job: Job; onClose: () => void }) {
  return (
    <>
      <div className="fixed inset-0 bg-black/25 z-40 animate-fade-in" onClick={onClose} />
      <aside className="fixed top-0 right-0 h-screen w-[480px] bg-background border-l-hairline z-50 flex flex-col animate-slide-in-right">
        <header className="h-14 px-5 flex items-center justify-between border-b-hairline shrink-0">
          <div className="flex items-center gap-2">
            <StatusDot color={stageColors[job.stage]} />
            <span className="text-sm font-medium">{job.stage}</span>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-surface-hover">
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div>
            <h2 className="text-lg font-medium">{job.customer}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{job.service}</p>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground"><Phone className="w-3.5 h-3.5" /> 07700 900123</div>
            <div className="flex items-center gap-2 text-muted-foreground"><Mail className="w-3.5 h-3.5" /> contact@example.com</div>
            <div className="flex items-start gap-2 text-muted-foreground"><MapPin className="w-3.5 h-3.5 mt-0.5" /> {job.address}</div>
          </div>

          <Section title="Job notes">
            <p className="text-sm text-foreground">{job.notes || "No notes yet."}</p>
          </Section>

          <Section title="Photos">
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="aspect-square rounded-md bg-surface border-hairline" />
              ))}
            </div>
          </Section>

          <Section title="Quote & invoice">
            <div className="space-y-1.5 text-sm">
              <Row label="Quote value" value={`£${job.quoteValue}`} />
              <Row label="Invoice" value={job.invoiceId ?? "Not invoiced"} />
            </div>
          </Section>

          <Section title="Communication">
            {job.timeline.length === 0 ? (
              <p className="text-sm text-muted-foreground">No messages yet.</p>
            ) : (
              <div className="space-y-2">
                {job.timeline.map((t, i) => (
                  <div key={i} className="flex gap-2.5 text-sm">
                    <span className="text-xs text-muted-foreground w-12 shrink-0 mt-0.5">{t.date}</span>
                    <span className="text-xs uppercase text-muted-foreground w-10 shrink-0 mt-0.5">{t.type}</span>
                    <span className="text-foreground">{t.text}</span>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>
      </aside>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">{title}</div>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
