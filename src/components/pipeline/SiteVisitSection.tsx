import { Link } from "react-router-dom";
import { Check, HardHat, PoundSterling } from "lucide-react";
import { FIELD_CHECKLIST, useFieldRecord } from "@/lib/fieldStore";

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
  const rec = useFieldRecord(jobId);

  const anything =
    rec.status !== "not-started" ||
    rec.photos.length > 0 ||
    rec.measurements.length > 0 ||
    Boolean(rec.workDone || rec.partsUsed || rec.extraWorkNote || rec.signature) ||
    Object.values(rec.checklist).some(Boolean);

  if (!anything) {
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

  const ticked = FIELD_CHECKLIST.filter((c) => rec.checklist[c.id]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 text-xs">
        <Stat label="On my way" value={stamp(rec.stamps["on-my-way"])} />
        <Stat label="Arrived" value={stamp(rec.stamps.arrived)} />
        <Stat label="Started work" value={stamp(rec.stamps.working)} />
        <Stat label="Finished" value={stamp(rec.stamps.finished)} />
      </div>

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
          {rec.extraWorkValue && (
            <p className="text-xs text-muted-foreground mt-1 inline-flex items-center gap-1">
              <PoundSterling className="w-3 h-3" /> Roughly £{rec.extraWorkValue}
            </p>
          )}
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
