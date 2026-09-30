import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { travelMinutes } from "@/lib/travel";
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
  Check,
  ChevronDown,
  ChevronRight,
  MessageSquare,
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
  wrapUpGaps,
  type FieldStatus,
} from "@/lib/fieldStore";
import { templateFor } from "@/lib/fieldTemplates";
import { parseSpokenNotes } from "@/lib/fieldAi";
import { directionsUrl, openMaps, telHref } from "@/lib/mapLinks";
import PhotoGrid from "@/components/field/PhotoGrid";
import JobSheetForm from "@/components/field/JobSheetForm";
import SurveyForm from "@/components/field/SurveyForm";
import MaterialsList from "@/components/field/MaterialsList";
import { getSurveys, setJobSurvey, surveyForJob, useSurveys } from "@/lib/surveysStore";
import WrapUpSheet from "@/components/field/WrapUpSheet";
import QuickChips, { appendLine } from "@/components/field/QuickChips";
import VoiceNoteButton from "@/components/field/VoiceNoteButton";
import { useToast } from "@/hooks/use-toast";
import VisitBadge from "@/components/field/VisitBadge";
import { setVisitType, visitTypeBlurb, visitTypeFor } from "@/lib/visitTypes";

type Stage = "before" | "arrived" | "work" | "wrap" | "done";
const STAGES: { id: Stage; label: string }[] = [
  { id: "before", label: "Go" },
  { id: "arrived", label: "Arrive" },
  { id: "work", label: "Job" },
  { id: "wrap", label: "Wrap up" },
  { id: "done", label: "Done" },
];

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
  const [stage, setStage] = useState<Stage | null>(null);
  const [more, setMore] = useState(false);
  const navigate = useNavigate();

  const job = jobs.find((j) => j.id === id);
  const me = employees.find((e) => e.id === userId) ?? employees[0];
  const contact = useMemo(() => contacts.find((c) => c.id === job?.contactId), [job]);
  const tpl = templateFor(job?.service);
  const allSurveys = useSurveys();
  const survey = surveyForJob(id, job?.service);
  void allSurveys;

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

  const kind = visitTypeFor(job);
  const locked = Boolean(record.lockedAt);
  const step = nextStep[record.status];
  const mins = timeOnSiteMinutes(record);
  const gaps = wrapUpGaps(record);
  void step;

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

  const stageOf = (): Stage =>
    locked
      ? "done"
      : record.status === "working"
        ? "work"
        : record.status === "finished"
          ? "wrap"
          : record.status === "arrived"
            ? "arrived"
            : "before";
  const current = stageOf();
  const shown: Stage = stage ?? current;

  // Next stop for this worker later the same day.
  const mine = job.assignments?.find((a) => a.employeeId === userId);
  const nextJob = (() => {
    if (!mine) return null;
    const rows = jobs.flatMap((j) =>
      (j.assignments ?? [])
        .filter((a) => a.employeeId === userId && a.date === mine.date && j.id !== job.id && a.start > mine.start)
        .map((a) => ({ job: j, a })),
    );
    rows.sort((x, y) => x.a.start.localeCompare(y.a.start));
    const n = rows[0];
    return n ? { ...n, drive: travelMinutes(job.address, n.job.address) } : null;
  })();

  const go = (s: Exclude<FieldStatus, "not-started">) => {
    setStatus(id, userId, s);
    setStage(null);
  };

  const survey_select = !locked && (
    <select
      value={survey?.id ?? ""}
      onChange={(e) => setJobSurvey(id, e.target.value || undefined)}
      className="h-11 w-full rounded-lg border-hairline bg-background px-2.5 text-sm mb-3"
    >
      <option value="">No question set</option>
      {getSurveys().map((s) => (
        <option key={s.id} value={s.id}>
          {s.name}
        </option>
      ))}
    </select>
  );

  const action: { label: string; onClick: () => void } | null = locked
    ? nextJob
      ? { label: `Next job · ${nextJob.a.start} ${nextJob.job.customer}`, onClick: () => navigate(`/field/job/${nextJob.job.id}`) }
      : { label: "Back to my day", onClick: () => navigate("/field") }
    : shown === "before"
      ? record.status === "on-my-way"
        ? { label: "I've arrived", onClick: () => go("arrived") }
        : { label: "I'm on my way", onClick: () => go("on-my-way") }
      : shown === "arrived"
        ? { label: kind === "survey" ? "Start the survey" : "Start work", onClick: () => go("working") }
        : shown === "work"
          ? { label: kind === "survey" ? "Survey done — wrap up" : "Finished — wrap up", onClick: () => go("finished") }
          : shown === "wrap"
            ? { label: kind === "survey" ? "Finish the survey" : "Open wrap up", onClick: () => setWrapUp(true) }
            : null;

  return (
    <div className="flex-1 pb-28">
      {/* header — just who, where and how to get there */}
      <div className="px-4 py-3 border-b-hairline">
        <Link to="/field" className="text-xs text-muted-foreground inline-flex items-center gap-1 hover:text-foreground">
          <ArrowLeft className="w-3 h-3" /> My day
        </Link>
        <div className="flex items-start justify-between gap-2 mt-1.5">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold leading-tight">{job.customer}</h1>
            <p className="text-sm text-muted-foreground">{job.service}</p>
          </div>
          <VisitBadge type={kind} />
        </div>
      </div>

      {/* stage tabs — jump back without losing your place */}
      <nav className="sticky top-14 z-20 bg-background/95 backdrop-blur border-b-hairline px-2 py-2 grid grid-cols-5 gap-1">
        {STAGES.map((s, i) => {
          const done = STAGES.findIndex((x) => x.id === current) > i;
          const on = shown === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setStage(s.id === current ? null : s.id)}
              className={`h-12 rounded-lg text-[11px] font-medium flex flex-col items-center justify-center gap-0.5 ${
                on ? "bg-primary text-primary-foreground" : done ? "text-[hsl(var(--success))]" : "text-muted-foreground"
              }`}
            >
              {done && !on ? <Check className="w-3.5 h-3.5" /> : <span className="text-xs font-semibold">{i + 1}</span>}
              {s.label}
            </button>
          );
        })}
      </nav>

      {shown === "before" && (
        <>
          <FieldSection title={record.status === "on-my-way" ? "On your way" : "Before you go"}>
            <div className="space-y-2 text-sm">
              <p className="inline-flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" /> {job.address}
              </p>
              {mine && (
                <p className="inline-flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" /> {mine.start} · {mine.duration}h booked
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              <button
                type="button"
                onClick={() => openMaps(directionsUrl(job.address))}
                className="h-14 rounded-lg border-hairline bg-surface hover:bg-surface-hover text-sm font-semibold inline-flex items-center justify-center gap-2"
              >
                <Navigation className="w-5 h-5" /> Directions
              </button>
              {contact?.phone ? (
                <a
                  href={telHref(contact.phone)}
                  className="h-14 rounded-lg border-hairline bg-surface hover:bg-surface-hover text-sm font-semibold inline-flex items-center justify-center gap-2"
                >
                  <Phone className="w-5 h-5" /> Call
                </a>
              ) : (
                <span className="h-14 rounded-lg border-hairline text-xs text-muted-foreground inline-flex items-center justify-center">
                  No phone number
                </span>
              )}
            </div>
            {contact?.phone && record.status === "not-started" && (
              <a
                href={`sms:${contact.phone}?body=${encodeURIComponent(`Hi, it's ${me.name.split(" ")[0]} — I'm on my way to you now.`)}`}
                className="mt-2 h-11 w-full rounded-lg border-hairline bg-background text-sm font-medium inline-flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4" /> Text the customer I'm on my way
              </a>
            )}
          </FieldSection>
        </>
      )}

      {shown === "arrived" && (
        <>
          <FieldSection title="Take your before photos" subtitle="So there's proof of how you found it.">
            <PhotoGrid jobId={id} employeeId={userId} photos={record.photos} status={record.status} readOnly={locked} />
          </FieldSection>
          {kind === "survey" && <FieldSection title="Which questions?">{survey_select}</FieldSection>}
        </>
      )}

      {shown === "work" && (
        <>
          {!locked && (
            <FieldSection title="Talk me through it" subtitle="Or type below — both work.">
              <VoiceNoteButton label="Talk me through the job" busy={thinking} onTranscript={fillFromSpeech} />
            </FieldSection>
          )}
          {kind === "survey" ? (
            <FieldSection title="Survey questions">
              {!survey && survey_select}
              {survey ? (
                <SurveyForm jobId={id} employeeId={userId} record={record} survey={survey} readOnly={locked} />
              ) : (
                <p className="text-xs text-muted-foreground">Pick a question set to start.</p>
              )}
            </FieldSection>
          ) : (
            <>
              <FieldSection title="Job sheet">
                <JobSheetForm jobId={id} employeeId={userId} record={record} service={job.service} readOnly={locked} />
              </FieldSection>
              <FieldSection title="Materials used">
                <MaterialsList jobId={id} addedBy={me.name} readOnly={locked} />
              </FieldSection>
            </>
          )}
          <FieldSection title="Photos">
            <PhotoGrid jobId={id} employeeId={userId} photos={record.photos} status={record.status} readOnly={locked} />
          </FieldSection>

          <section className="px-4 py-3 border-b-hairline">
            <button
              type="button"
              onClick={() => setMore((m) => !m)}
              className="h-11 w-full inline-flex items-center justify-between text-sm font-medium"
            >
              <span>{kind === "survey" ? "Anything else to price in?" : "Spotted more work?"} · more</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${more ? "rotate-180" : ""}`} />
            </button>
            {more && (
              <div className="space-y-2 pt-2">
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
                  placeholder="e.g. Outside tap is leaking"
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
                    className="h-11 w-28 rounded-lg border-hairline bg-background px-2.5 text-sm"
                  />
                </div>
                {!locked && (
                  <VoiceNoteButton
                    label="Say it instead"
                    onTranscript={(t) => patchRecord(id, userId, { extraWorkNote: appendLine(record.extraWorkNote, t) })}
                  />
                )}
                {!locked && (
                  <button
                    type="button"
                    onClick={() => setVisitType(id, kind === "survey" ? "work" : "survey")}
                    className="h-10 px-3 rounded-lg border-hairline bg-surface text-xs font-medium"
                  >
                    {kind === "survey" ? "This is actually work, not a survey" : "This is actually a survey visit"}
                  </button>
                )}
              </div>
            )}
          </section>
        </>
      )}

      {shown === "wrap" && (
        <FieldSection title="Wrap up" subtitle="After photo, signature, payment and what happens next.">
          <ul className="space-y-1.5 text-sm">
            {gaps.length === 0 ? (
              <li className="inline-flex items-center gap-2 text-[hsl(var(--success))]">
                <CheckCircle2 className="w-4 h-4" /> Everything's in — ready to sign off.
              </li>
            ) : (
              gaps.map((g) => (
                <li key={g.id} className="inline-flex items-center gap-2 text-muted-foreground w-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--warning))]" /> {g.label}
                </li>
              ))
            )}
          </ul>
        </FieldSection>
      )}

      {shown === "done" && (
        <FieldSection title="Signed off">
          <div className="rounded-lg bg-[hsl(var(--success)/0.08)] p-4 flex items-start gap-3">
            <Lock className="w-5 h-5 text-[hsl(var(--success))] mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Sent to the office</p>
              <p className="text-xs text-muted-foreground">
                {record.photos.length} photos{mins ? ` · ${formatMinutes(mins)} on site` : ""}
                {record.lockedAt &&
                  ` · ${new Date(record.lockedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`}
              </p>
            </div>
          </div>
          {nextJob && (
            <div className="mt-3 rounded-lg border-hairline p-3 text-sm">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Next up</p>
              <p className="font-medium mt-0.5">
                {nextJob.a.start} · {nextJob.job.customer}
              </p>
              <p className="text-xs text-muted-foreground">
                {nextJob.job.address} · about {nextJob.drive} min drive
              </p>
            </div>
          )}
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={() => setWrapUp(true)}
              className="h-11 flex-1 rounded-lg border-hairline bg-background text-xs font-medium"
            >
              View wrap up
            </button>
            <button
              type="button"
              onClick={() => {
                patchRecord(id, userId, { lockedAt: undefined, reopenedAt: new Date().toISOString() });
                setStage("work");
                toast({ title: "Sheet reopened", description: "The office can see it was changed after sign-off." });
              }}
              className="h-11 flex-1 rounded-lg border-hairline bg-background text-xs font-medium inline-flex items-center justify-center gap-1.5"
            >
              <Unlock className="w-3.5 h-3.5" /> Reopen to fix something
            </button>
          </div>
        </FieldSection>
      )}

      {/* one big button, always in reach */}
      {action && (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-background/95 backdrop-blur border-t-hairline p-3">
          <div className="mx-auto w-full max-w-[520px]">
            <button
              type="button"
              onClick={action.onClick}
              className="h-14 w-full rounded-xl bg-primary text-primary-foreground text-base font-semibold inline-flex items-center justify-center gap-2"
            >
              {thinking && <Loader2 className="w-4 h-4 animate-spin" />}
              <span className="truncate">{action.label}</span>
              <ChevronRight className="w-4 h-4 shrink-0" />
            </button>
          </div>
        </div>
      )}

      {wrapUp && (
        <WrapUpSheet
          job={job}
          contact={contact}
          record={record}
          employeeId={userId}
          workerName={me.name}
          visitType={kind}
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
