import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Navigation, Phone, MapPin, Clock, Check, Sparkles } from "lucide-react";
import { contacts, employees } from "@/data/mockData";
import { useJobs } from "@/lib/jobsStore";
import { updateJob } from "@/lib/jobsStore";
import {
  patchRecord,
  setStatus,
  useFieldRecord,
  useFieldUser,
  fieldStatusLabel,
} from "@/lib/fieldStore";
import { directionsUrl, openMaps, telHref } from "@/lib/mapLinks";
import StatusStepper from "@/components/field/StatusStepper";
import PhotoGrid from "@/components/field/PhotoGrid";
import JobSheetForm from "@/components/field/JobSheetForm";
import SignaturePad from "@/components/field/SignaturePad";

function endTime(start: string, hours: number) {
  const [h, m] = start.split(":").map(Number);
  const total = h * 60 + m + Math.round(hours * 60);
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return `${pad(Math.floor(total / 60) % 24)}:${pad(total % 60)}`;
}

export default function FieldJob() {
  const { id = "" } = useParams();
  const [jobs] = useJobs();
  const [userId] = useFieldUser();
  const record = useFieldRecord(id);

  const job = jobs.find((j) => j.id === id);
  const mine = useMemo(
    () => job?.assignments?.find((a) => a.employeeId === userId) ?? job?.assignments?.[0],
    [job, userId],
  );
  const contact = contacts.find((c) => c.id === job?.contactId);
  const mate = job?.assignments?.filter((a) => a.employeeId !== userId) ?? [];

  if (!job) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm font-medium">This job is not available</p>
        <Link to="/field" className="text-sm text-primary mt-2 inline-block">
          Back to my day
        </Link>
      </div>
    );
  }

  const milestones = job.milestones ?? [];
  const toggleMilestone = (msId: string) =>
    updateJob(job.id, {
      milestones: milestones.map((m) => (m.id === msId ? { ...m, done: !m.done } : m)),
    });

  const saved = record.updatedAt
    ? `Saved ${new Date(record.updatedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`
    : "Nothing saved yet";

  return (
    <div className="flex-1 pb-8">
      <div className="px-4 py-3 border-b-hairline flex items-center justify-between gap-2">
        <Link to="/field" className="h-9 px-2 -ml-2 rounded-lg inline-flex items-center gap-1.5 text-sm hover:bg-surface-hover">
          <ArrowLeft className="w-4 h-4" /> My day
        </Link>
        <span className="text-[11px] text-muted-foreground">{saved}</span>
      </div>

      {/* header */}
      <div className="px-4 pt-4 pb-4 border-b-hairline">
        <div className="text-lg font-medium">{job.customer}</div>
        <div className="text-sm text-muted-foreground">{job.service}</div>

        <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
          {mine && (
            <div className="inline-flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {mine.start} – {endTime(mine.start, mine.duration)} · {mine.duration}h booked
            </div>
          )}
          <div className="flex items-start gap-1.5">
            <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>{job.address}</span>
          </div>
          {mate.length > 0 && (
            <div>
              With{" "}
              {mate
                .map((a) => employees.find((e) => e.id === a.employeeId)?.name ?? "a colleague")
                .join(", ")}
            </div>
          )}
        </div>

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => openMaps(directionsUrl(job.address))}
            className="h-11 flex-1 rounded-lg bg-primary text-primary-foreground text-sm font-medium inline-flex items-center justify-center gap-1.5"
          >
            <Navigation className="w-4 h-4" /> Directions
          </button>
          <a
            href={contact?.phone ? telHref(contact.phone) : undefined}
            aria-disabled={!contact?.phone}
            className={`h-11 flex-1 rounded-lg border-hairline text-sm font-medium inline-flex items-center justify-center gap-1.5 ${
              contact?.phone ? "hover:bg-surface-hover" : "opacity-40 pointer-events-none"
            }`}
          >
            <Phone className="w-4 h-4" /> Call customer
          </a>
        </div>

        {job.notes && (
          <div className="mt-3 rounded-lg bg-surface border-hairline px-3 py-2 text-xs">
            <span className="font-medium">From the office: </span>
            {job.notes}
          </div>
        )}
      </div>

      <FieldSection title="Where are you up to?" hint={fieldStatusLabel[record.status]}>
        <StatusStepper record={record} onSet={(s) => setStatus(job.id, s)} />
      </FieldSection>

      {milestones.length > 0 && (
        <FieldSection
          title="Job steps"
          hint={`${milestones.filter((m) => m.done).length}/${milestones.length} done`}
        >
          <div className="space-y-1.5">
            {milestones.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => toggleMilestone(m.id)}
                className="w-full min-h-12 px-3 py-2 rounded-lg border-hairline bg-surface hover:bg-surface-hover flex items-center gap-3 text-left"
              >
                <span
                  className={`w-5 h-5 rounded shrink-0 flex items-center justify-center border-hairline ${
                    m.done ? "bg-[hsl(var(--success))] text-primary-foreground" : "bg-background"
                  }`}
                >
                  {m.done && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                </span>
                <span className={`text-sm ${m.done ? "text-muted-foreground line-through" : ""}`}>{m.label}</span>
              </button>
            ))}
          </div>
        </FieldSection>
      )}

      <FieldSection title="Photos" hint={record.photos.length ? `${record.photos.length}` : undefined}>
        <PhotoGrid jobId={job.id} photos={record.photos} />
      </FieldSection>

      <FieldSection title="Job sheet">
        <JobSheetForm jobId={job.id} record={record} />
      </FieldSection>

      <FieldSection title="Spotted more work?">
        <div className="space-y-2">
          <textarea
            value={record.extraWorkNote}
            onChange={(e) => patchRecord(job.id, { extraWorkNote: e.target.value })}
            rows={3}
            placeholder="e.g. Outside tap is leaking, customer asked about a new fence"
            className="w-full rounded-lg border-hairline bg-background px-2.5 py-2 text-sm resize-none"
          />
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Rough value £</span>
            <input
              value={record.extraWorkValue}
              onChange={(e) => patchRecord(job.id, { extraWorkValue: e.target.value })}
              inputMode="numeric"
              placeholder="0"
              className="h-10 w-28 rounded-lg border-hairline bg-background px-2.5 text-sm"
            />
          </div>
          <p className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-primary" /> The office sees this on the job and can turn it into a quote.
          </p>
        </div>
      </FieldSection>

      <FieldSection title="Customer sign-off">
        {record.signature ? (
          <div className="space-y-2">
            <img
              src={record.signature.dataUrl}
              alt={`Signature from ${record.signature.name}`}
              className="w-full h-[110px] object-contain rounded-lg border-hairline bg-surface"
            />
            <p className="text-xs text-muted-foreground">
              Signed by {record.signature.name || "customer"} ·{" "}
              {new Date(record.signature.at).toLocaleString("en-GB", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            <button
              type="button"
              onClick={() => patchRecord(job.id, { signature: undefined })}
              className="h-10 w-full rounded-lg border-hairline text-sm font-medium hover:bg-surface-hover"
            >
              Sign again
            </button>
          </div>
        ) : (
          <SignOff jobId={job.id} defaultName={job.customer} />
        )}
      </FieldSection>
    </div>
  );
}

function SignOff({ jobId, defaultName }: { jobId: string; defaultName: string }) {
  return (
    <div className="space-y-2">
      <input
        id={`sign-name-${jobId}`}
        defaultValue={defaultName}
        placeholder="Who is signing?"
        className="h-10 w-full rounded-lg border-hairline bg-background px-2.5 text-sm"
      />
      <SignaturePad
        onSave={(dataUrl) => {
          const el = document.getElementById(`sign-name-${jobId}`) as HTMLInputElement | null;
          patchRecord(jobId, {
            signature: { name: el?.value?.trim() || defaultName, dataUrl, at: new Date().toISOString() },
          });
        }}
      />
    </div>
  );
}

function FieldSection({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="px-4 py-4 border-b-hairline">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium">{title}</h2>
        {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </section>
  );
}
