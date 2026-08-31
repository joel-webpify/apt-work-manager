import { Link } from "react-router-dom";
import { Check, HardHat, PoundSterling, Lock, Star, Send, CalendarPlus, AlertTriangle } from "lucide-react";
import { employees } from "@/data/mockData";
import {
  FIELD_CHECKLIST,
  formatMinutes,
  hasAnyWork,
  timeOnSiteMinutes,
  useJobRecords,
  visitOutcomes,
  type FieldRecord,
} from "@/lib/fieldStore";
import { paymentLabel } from "@/lib/visitSummary";

function stamp(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SiteVisitSection({ jobId }: { jobId: string }) {
  const all = useJobRecords(jobId).filter((r) => hasAnyWork(r.record));

  if (all.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nothing sent back from site yet.{" "}
        <Link to="/field" className="text-primary hover:underline">
          Open the field app
        </Link>
        .
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {all.map(({ employeeId, record }) => (
        <WorkerVisit key={employeeId} employeeId={employeeId} rec={record} multiple={all.length > 1} />
      ))}
    </div>
  );
}

function WorkerVisit({ employeeId, rec, multiple }: { employeeId: string; rec: FieldRecord; multiple: boolean }) {
  const who = employees.find((e) => e.id === employeeId);
  const ticked = FIELD_CHECKLIST.filter((c) => rec.checklist[c.id]);
  const outcome = visitOutcomes.find((o) => o.id === rec.outcome);
  const mins = timeOnSiteMinutes(rec);

  return (
    <div className={multiple ? "rounded-lg border-hairline p-3 space-y-4" : "space-y-4"}>
      <div className="flex flex-wrap items-center gap-2">
        {who && (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium">
            <span
              className="w-5 h-5 rounded-full text-[10px] font-semibold flex items-center justify-center text-primary-foreground"
              style={{ backgroundColor: `hsl(${who.color})` }}
            >
              {who.initials}
            </span>
            {who.name}
          </span>
        )}
        {outcome && (
          <span
            className={`h-6 px-2 rounded-full text-[11px] font-medium inline-flex items-center ${
              rec.outcome === "completed"
                ? "bg-[hsl(var(--success)/0.12)] text-[hsl(var(--success))]"
                : "bg-[hsl(var(--warning)/0.14)] text-[hsl(var(--warning))]"
            }`}
          >
            {outcome.label}
          </span>
        )}
        {rec.lockedAt && (
          <span className="h-6 px-2 rounded-full bg-surface border-hairline text-[11px] inline-flex items-center gap-1">
            <Lock className="w-3 h-3" /> Signed off
          </span>
        )}
        {mins !== undefined && (
          <span className="text-[11px] text-muted-foreground">{formatMinutes(mins)} on site</span>
        )}
      </div>

      {rec.outcomeNote && (
        <div className="rounded-md border-hairline bg-[hsl(var(--warning)/0.08)] p-2.5 text-sm inline-flex gap-2">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[hsl(var(--warning))]" />
          <span>{rec.outcomeNote}</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 text-xs">
        <Stat label="On my way" value={stamp(rec.stamps["on-my-way"])} />
        <Stat label="Arrived" value={stamp(rec.stamps.arrived)} />
        <Stat label="Started work" value={stamp(rec.stamps.working)} />
        <Stat label="Finished" value={stamp(rec.stamps.finished)} />
      </div>

      {(rec.payment || rec.reviewRequestedAt || rec.summarySentAt || rec.followUp?.date) && (
        <div className="flex flex-wrap gap-1.5">
          {rec.payment && (
            <Pill icon={<PoundSterling className="w-3 h-3" />}>
              £{rec.payment.amount.toFixed(2)} by {paymentLabel(rec.payment.method)}
            </Pill>
          )}
          {rec.reviewRequestedAt && <Pill icon={<Star className="w-3 h-3" />}>Review asked for</Pill>}
          {rec.summarySentAt && <Pill icon={<Send className="w-3 h-3" />}>Summary sent</Pill>}
          {rec.followUp?.date && (
            <Pill icon={<CalendarPlus className="w-3 h-3" />}>
              Next visit {new Date(rec.followUp.date).toLocaleDateString("en-GB")}
            </Pill>
          )}
        </div>
      )}

      {rec.skipReason && (
        <p className="text-xs text-muted-foreground">Finished with things missing — reason given: “{rec.skipReason}”</p>
      )}

      {rec.photos.length > 0 && (
        <div>
          <div className="text-xs text-muted-foreground mb-1.5">Photos from site</div>
          <div className="grid grid-cols-3 gap-2">
            {rec.photos.map((p) => (
              <a
                key={p.id}
                href={p.dataUrl}
                target="_blank"
                rel="noreferrer"
                className="block aspect-square rounded-md overflow-hidden border-hairline bg-surface relative"
                title={`${p.label}${p.caption ? ` — ${p.caption}` : ""}`}
              >
                <img src={p.dataUrl} alt={p.caption || `${p.label} photo`} className="w-full h-full object-cover" />
                <span className="absolute bottom-1 left-1 h-4 px-1 rounded bg-background/85 text-[10px] capitalize">
                  {p.label}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {ticked.length > 0 && (
        <div>
          <div className="text-xs text-muted-foreground mb-1.5">Job sheet checks</div>
          <ul className="space-y-1">
            {ticked.map((c) => (
              <li key={c.id} className="flex items-center gap-1.5 text-sm">
                <Check className="w-3.5 h-3.5 text-[hsl(var(--success))]" /> {c.label}
              </li>
            ))}
          </ul>
        </div>
      )}

      {rec.measurements.filter((m) => m.label || m.value).length > 0 && (
        <div>
          <div className="text-xs text-muted-foreground mb-1.5">Measurements</div>
          <div className="space-y-1 text-sm">
            {rec.measurements
              .filter((m) => m.label || m.value)
              .map((m) => (
                <div key={m.id} className="flex justify-between gap-2">
                  <span className="text-muted-foreground">{m.label || "—"}</span>
                  <span>{m.value}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {rec.workDone && <Block label="What was done">{rec.workDone}</Block>}
      {rec.partsUsed && <Block label="Parts & materials">{rec.partsUsed}</Block>}

      {rec.extraWorkNote && (
        <div className="rounded-md border-hairline bg-[hsl(var(--warning)/0.08)] p-3">
          <div className="text-xs font-medium mb-1 inline-flex items-center gap-1.5">
            <HardHat className="w-3.5 h-3.5" /> More work spotted on site
          </div>
          <p className="text-sm">{rec.extraWorkNote}</p>
          <div className="flex flex-wrap items-center gap-3 mt-1">
            {rec.extraWorkValue && (
              <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                <PoundSterling className="w-3 h-3" /> Roughly £{rec.extraWorkValue}
              </span>
            )}
            {rec.extraWorkQuoteId ? (
              <Link to="/quotes" className="text-xs text-primary hover:underline">
                Draft quote {rec.extraWorkQuoteId}
              </Link>
            ) : (
              <span className="text-xs text-muted-foreground">No quote raised yet</span>
            )}
          </div>
        </div>
      )}

      {rec.signature && (
        <div>
          <div className="text-xs text-muted-foreground mb-1.5">Customer sign-off</div>
          <img
            src={rec.signature.dataUrl}
            alt={`Signature from ${rec.signature.name}`}
            className="w-full h-20 object-contain rounded-md border-hairline bg-surface"
          />
          <p className="text-xs text-muted-foreground mt-1">
            {rec.signature.name} · {stamp(rec.signature.at)}
          </p>
        </div>
      )}
    </div>
  );
}

function Pill({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="h-6 px-2 rounded-full border-hairline bg-surface text-[11px] inline-flex items-center gap-1">
      {icon}
      {children}
    </span>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border-hairline px-2.5 py-2">
      <div className="text-muted-foreground">{label}</div>
      <div className="text-foreground mt-0.5">{value}</div>
    </div>
  );
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <p className="text-sm whitespace-pre-wrap">{children}</p>
    </div>
  );
}
