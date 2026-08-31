import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Navigation,
  Phone,
  MapPin,
  Clock,
  Sparkles,
  Lock,
  Unlock,
  CheckCircle2,
  Wand2,
  Loader2,
} from "lucide-react";
import { contacts, employees } from "@/data/mockData";
import { useJobs } from "@/lib/jobsStore";
import {
  FIELD_CHECKLIST,
  fieldStatusLabel,
  formatMinutes,
  patchRecord,
  setStatus,
  timeOnSiteMinutes,
  useFieldRecord,
  useFieldUser,
  type FieldStatus,
} from "@/lib/fieldStore";
import { templateFor } from "@/lib/fieldTemplates";
import { parseSpokenNotes } from "@/lib/fieldAi";
import { directionsUrl, openMaps, telHref } from "@/lib/mapLinks";
import StatusStepper from "@/components/field/StatusStepper";
import PhotoGrid from "@/components/field/PhotoGrid";
import JobSheetForm from "@/components/field/JobSheetForm";
import WrapUpSheet from "@/components/field/WrapUpSheet";
import QuickChips, { appendLine } from "@/components/field/QuickChips";
import VoiceNoteButton from "@/components/field/VoiceNoteButton";
import { useToast } from "@/hooks/use-toast";

const nextStep: Record<FieldStatus, { id: Exclude<FieldStatus, "not-started">; label: string } | null> = {
  "not-started": { id: "on-my-way", label: "I'm on my way" },
  "on-my-way": { id: "arrived", label: "I've arrived" },
  arrived: { id: "working", label: "Start work" },
  working: { id: "finished", label: "Finished working" },
  finished: null,
};

export default function FieldJob() {
  const { id = "" } = useParams();
  const [jobs] = useJobs();
  const [userId] = useFieldUser();
  const record = useFieldRecord(id, userId);
  const { toast } = useToast();
  const [wrapUp, setWrapUp] = useState(false);
  const [thinking, setThinking] = useState(false);

  const job = jobs.find((j) => j.id === id);
  const me = employees.find((e) => e.id === userId) ?? employees[0];
  const contact = useMemo(() => contacts.find((c) => c.id === job?.contactId), [job]);
  const tpl = templateFor(job?.service);

  if (!job) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm font-medium">That job isn't on your list.</p>
        <Link to="/field" className="text-sm text-primary hover:underline mt-2 inline-block">
          Back to my day
        </Link>
      </div>
    );
  }

  const locked = Boolean(record.lockedAt);
  const step = nextStep[record.status];
  const mins = timeOnSiteMinutes(record);

  /** One spoken summary fills the sheet — the worker sees every word before it sticks. */
  const fillFromSpeech = async (transcript: string) => {
    setThinking(true);
    try {
      const parsed = await parseSpokenNotes({ transcript, service: job.service, checklist: FIELD_CHECKLIST });
      const checklist = { ...record.checklist };
      (parsed.checks ?? []).forEach((cid) => {
        if (FIELD_CHECKLIST.some((c) => c.id === cid)) checklist[cid] = true;
      });
      patchRecord(id, userId, {
        workDone: parsed.workDone ? appendLine(record.workDone, parsed.workDone) : record.workDone,
        partsUsed: parsed.partsUsed ? appendLine(record.partsUsed, parsed.partsUsed) : record.partsUsed,
        extraWorkNote: parsed.extraWorkNote
          ? appendLine(record.extraWorkNote, parsed.extraWorkNote)
          : record.extraWorkNote,
        extraWorkValue: parsed.extraWorkValue || record.extraWorkValue,
        checklist,
      });
      toast({ title: "Filled in from what you said", description: "Have a read and change anything that's off." });
    } catch (e) {
      // Never lose the words — drop the raw transcript into the notes instead.
      patchRecord(id, userId, { workDone: appendLine(record.workDone, transcript) });
      toast({
        title: "Saved what you said as notes",
        description: (e as Error).message,
      });
    } finally {
      setThinking(false);
    }
  };

  return (
    <div className="flex-1 pb-28">
      {/* header */}
      <div className="px-4 py-3 border-b-hairline">
        <Link to="/field" className="text-xs text-muted-foreground inline-flex items-center gap-1 hover:text-foreground">
          <ArrowLeft className="w-3 h-3" /> My day
        </Link>
        <h1 className="text-lg font-semibold mt-1.5 leading-tight">{job.customer}</h1>
        <p className="text-sm text-muted-foreground">{job.service}</p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" /> {job.address}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> {fieldStatusLabel[record.status]}
            {mins ? ` · ${formatMinutes(mins)} on site` : ""}
          </span>
        </div>
        <div className="flex gap-2 mt-3">
          <button
            type="button"
            onClick={() => openMaps(directionsUrl(job.address))}
            className="h-10 flex-1 rounded-lg border-hairline bg-surface hover:bg-surface-hover text-sm font-medium inline-flex items-center justify-center gap-1.5"
          >
            <Navigation className="w-4 h-4" /> Directions
          </button>
          {contact?.phone && (
            <a
              href={telHref(contact.phone)}
              className="h-10 flex-1 rounded-lg border-hairline bg-surface hover:bg-surface-hover text-sm font-medium inline-flex items-center justify-center gap-1.5"
            >
              <Phone className="w-4 h-4" /> Call
            </a>
          )}
        </div>
      </div>

      {locked && (
        <div className="mx-4 mt-4 rounded-lg border-hairline bg-[hsl(var(--success)/0.08)] p-3 flex items-start gap-2">
          <Lock className="w-4 h-4 mt-0.5 text-[hsl(var(--success))]" />
          <div className="flex-1">
            <p className="text-sm font-medium">Signed off and sent to the office</p>
            <p className="text-xs text-muted-foreground">
              Locked {new Date(record.lockedAt!).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}.
            </p>
            <button
              type="button"
              onClick={() => {
                patchRecord(id, userId, { lockedAt: undefined, reopenedAt: new Date().toISOString() });
                toast({ title: "Sheet reopened", description: "The office can see it was changed after sign-off." });
              }}
              className="mt-2 h-9 px-3 rounded-lg border-hairline bg-background text-xs font-medium inline-flex items-center gap-1.5"
            >
              <Unlock className="w-3.5 h-3.5" /> Reopen to fix something
            </button>
          </div>
        </div>
      )}

      <FieldSection title="Where are you up to?">
        <StatusStepper record={record} onSet={(s) => !locked && setStatus(id, userId, s)} />
      </FieldSection>

      {!locked && (
        <FieldSection title="Fill it in by talking" subtitle="Or skip this and type it in below — both work.">
          <VoiceNoteButton
            label="Talk me through the job"
            busy={thinking}
            onTranscript={fillFromSpeech}
          />
          <p className="text-[11px] text-muted-foreground mt-2 inline-flex items-start gap-1">
            <Sparkles className="w-3 h-3 mt-0.5 text-primary shrink-0" />
            Say what you did, what you used and anything you spotted. It drops into the boxes below for you to check.
          </p>
        </FieldSection>
      )}

      <FieldSection title="Photos" subtitle="Labelled from where you are in the job, so you don't have to.">
        <PhotoGrid jobId={id} employeeId={userId} photos={record.photos} status={record.status} readOnly={locked} />
      </FieldSection>

      <FieldSection title="Job sheet">
        <JobSheetForm jobId={id} employeeId={userId} record={record} service={job.service} readOnly={locked} />
      </FieldSection>

      <FieldSection title="Spotted more work?">
        <div className="space-y-2">
          {!locked && (
            <QuickChips
              options={tpl.extraWork}
              onPick={(t) => patchRecord(id, userId, { extraWorkNote: appendLine(record.extraWorkNote, t) })}
            />
          )}
          <textarea
            value={record.extraWorkNote}
            readOnly={locked}
            onChange={(e) => patchRecord(id, userId, { extraWorkNote: e.target.value })}
            rows={3}
            placeholder="e.g. Outside tap is leaking, customer asked about a new fence"
            className="w-full rounded-lg border-hairline bg-background px-2.5 py-2 text-sm resize-none"
          />
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Rough value £</span>
            <input
              value={record.extraWorkValue}
              readOnly={locked}
              onChange={(e) => patchRecord(id, userId, { extraWorkValue: e.target.value })}
              inputMode="numeric"
              placeholder="0"
              className="h-10 w-28 rounded-lg border-hairline bg-background px-2.5 text-sm"
            />
          </div>
          {!locked && (
            <VoiceNoteButton
              label="Say it instead"
              onTranscript={(t) => patchRecord(id, userId, { extraWorkNote: appendLine(record.extraWorkNote, t) })}
            />
          )}
          <p className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-primary" /> At wrap up you can turn this into a real quote in one tap.
          </p>
        </div>
      </FieldSection>

      {/* one big button, always in reach */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-background/95 backdrop-blur border-t-hairline p-3">
        <div className="mx-auto w-full max-w-[520px] flex gap-2">
          {step && !locked && (
            <button
              type="button"
              onClick={() => setStatus(id, userId, step.id)}
              className="h-12 flex-1 rounded-lg bg-primary text-primary-foreground text-sm font-semibold"
            >
              {step.label}
            </button>
          )}
          <button
            type="button"
            onClick={() => setWrapUp(true)}
            className={`h-12 rounded-lg text-sm font-semibold inline-flex items-center justify-center gap-1.5 ${
              step && !locked
                ? "px-4 border-hairline bg-surface hover:bg-surface-hover"
                : "flex-1 bg-primary text-primary-foreground"
            }`}
          >
            {thinking ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {locked ? "View wrap up" : "Wrap up"}
          </button>
        </div>
      </div>

      {wrapUp && (
        <WrapUpSheet
          job={job}
          contact={contact}
          record={record}
          employeeId={userId}
          workerName={me.name}
          onClose={() => setWrapUp(false)}
        />
      )}
    </div>
  );
}

function FieldSection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="px-4 py-4 border-b-hairline">
      <h2 className="text-sm font-semibold mb-0.5">{title}</h2>
      {subtitle && <p className="text-[11px] text-muted-foreground mb-2.5">{subtitle}</p>}
      <div className={subtitle ? "" : "mt-2.5"}>{children}</div>
    </section>
  );
}
