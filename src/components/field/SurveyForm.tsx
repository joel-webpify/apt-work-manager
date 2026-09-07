import { useRef } from "react";
import { Camera, Check, PoundSterling, Trash2 } from "lucide-react";
import { fileToDataUrl, patchRecord, type FieldRecord } from "@/lib/fieldStore";
import {
  isAnswered,
  isVisible,
  surveyProgress,
  type Survey,
  type SurveyAnswer,
  type SurveyAnswers,
  type SurveyQuestion,
} from "@/lib/surveysStore";
import { useToast } from "@/hooks/use-toast";

export default function SurveyForm({
  jobId,
  employeeId,
  record,
  survey,
  readOnly,
}: {
  jobId: string;
  employeeId: string;
  record: FieldRecord;
  survey: Survey;
  readOnly?: boolean;
}) {
  const { toast } = useToast();
  const answers: SurveyAnswers = record.survey?.surveyId === survey.id ? record.survey.answers : {};
  const progress = surveyProgress(survey, answers);

  const setAnswer = (qid: string, patch: Partial<SurveyAnswer>) => {
    if (readOnly) return;
    const next: SurveyAnswers = { ...answers, [qid]: { ...answers[qid], ...patch } };
    patchRecord(jobId, employeeId, { survey: { surveyId: survey.id, answers: next } });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium">{survey.name}</span>
        <span className="text-muted-foreground">
          {progress.done} of {progress.total} answered
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }}
        />
      </div>

      {survey.sections.map((section) => {
        const visible = section.questions.filter((q) => isVisible(q, answers));
        if (!visible.length) return null;
        return (
          <div key={section.id} className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {section.title}
            </p>
            {visible.map((q) => (
              <QuestionField
                key={q.id}
                q={q}
                answer={answers[q.id]}
                readOnly={readOnly}
                onChange={(p) => setAnswer(q.id, p)}
                onPhotoError={(m) => toast({ title: "Couldn't use that photo", description: m })}
              />
            ))}
          </div>
        );
      })}

      {progress.missingRequired.length > 0 && (
        <p className="text-[11px] text-[hsl(var(--warning))]">
          Still to answer: {progress.missingRequired.map((q) => q.label).join(", ")}
        </p>
      )}
    </div>
  );
}

function QuestionField({
  q,
  answer,
  readOnly,
  onChange,
  onPhotoError,
}: {
  q: SurveyQuestion;
  answer?: SurveyAnswer;
  readOnly?: boolean;
  onChange: (patch: Partial<SurveyAnswer>) => void;
  onPhotoError: (msg: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const done = isAnswered(q, answer);
  const many = Array.isArray(answer?.value) ? (answer!.value as string[]) : [];

  const pickPhoto = async (file?: File) => {
    if (!file) return;
    try {
      onChange({ photo: await fileToDataUrl(file) });
    } catch (e) {
      onPhotoError((e as Error).message);
    }
  };

  return (
    <div className="rounded-lg border-hairline bg-surface p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium leading-snug">
            {q.label || "Untitled question"}
            {q.required && <span className="text-[hsl(var(--danger))]"> *</span>}
          </p>
          {q.help && <p className="text-[11px] text-muted-foreground mt-0.5">{q.help}</p>}
        </div>
        {done && <Check className="w-4 h-4 text-[hsl(var(--success))] shrink-0 mt-0.5" />}
      </div>

      {(q.type === "text" || q.type === "number" || q.type === "measure") && (
        <div className="flex items-center gap-2">
          <input
            value={String(answer?.value ?? "")}
            readOnly={readOnly}
            inputMode={q.type === "text" ? "text" : "decimal"}
            onChange={(e) => onChange({ value: e.target.value })}
            className="h-10 flex-1 rounded-lg border-hairline bg-background px-2.5 text-sm"
            placeholder={q.type === "text" ? "Type your answer" : "0"}
          />
          {q.type === "measure" && q.unit && (
            <span className="text-xs text-muted-foreground w-10">{q.unit}</span>
          )}
        </div>
      )}

      {q.type === "longtext" && (
        <textarea
          value={String(answer?.value ?? "")}
          readOnly={readOnly}
          rows={3}
          onChange={(e) => onChange({ value: e.target.value })}
          className="w-full rounded-lg border-hairline bg-background px-2.5 py-2 text-sm resize-none"
          placeholder="Write what you found"
        />
      )}

      {q.type === "yesno" && (
        <div className="flex gap-2">
          {[
            { v: true, label: "Yes" },
            { v: false, label: "No" },
          ].map((o) => (
            <button
              key={o.label}
              type="button"
              disabled={readOnly}
              onClick={() => onChange({ value: o.v })}
              className={`h-10 flex-1 rounded-lg text-sm font-medium border-hairline ${
                answer?.value === o.v ? "bg-primary text-primary-foreground border-primary" : "bg-background"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}

      {(q.type === "one" || q.type === "many") && (
        <div className="flex flex-wrap gap-1.5">
          {(q.options ?? []).map((opt) => {
            const on = q.type === "one" ? answer?.value === opt : many.includes(opt);
            return (
              <button
                key={opt}
                type="button"
                disabled={readOnly}
                onClick={() =>
                  q.type === "one"
                    ? onChange({ value: opt })
                    : onChange({ value: on ? many.filter((m) => m !== opt) : [...many, opt] })
                }
                className={`h-9 px-3 rounded-full text-xs font-medium border-hairline ${
                  on ? "bg-primary text-primary-foreground border-primary" : "bg-background"
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      )}

      {q.type === "photo" && (
        <div className="space-y-2">
          {answer?.photo && (
            <div className="relative w-32">
              <img src={answer.photo} alt={q.label} className="w-32 h-24 object-cover rounded-lg border-hairline" />
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => onChange({ photo: undefined })}
                  className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-background border-hairline inline-flex items-center justify-center"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
          {!readOnly && (
            <>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => pickPhoto(e.target.files?.[0] ?? undefined)}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="h-10 px-3 rounded-lg border-hairline bg-background text-sm font-medium inline-flex items-center gap-1.5"
              >
                <Camera className="w-4 h-4" /> {answer?.photo ? "Retake" : "Take a photo"}
              </button>
            </>
          )}
        </div>
      )}

      {q.priceable && (
        <div className="flex items-center gap-2 pt-1 border-t-hairline">
          <PoundSterling className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[11px] text-muted-foreground">Price to quote</span>
          <input
            value={answer?.price ?? q.defaultPrice ?? ""}
            readOnly={readOnly}
            inputMode="decimal"
            onChange={(e) => onChange({ price: Number(e.target.value) || 0 })}
            className="h-9 w-24 rounded-lg border-hairline bg-background px-2.5 text-sm"
            placeholder="0"
          />
          <button
            type="button"
            disabled={readOnly}
            onClick={() => onChange({ flagged: !answer?.flagged })}
            className={`h-9 px-2.5 rounded-lg text-[11px] font-medium border-hairline ${
              answer?.flagged ? "bg-primary text-primary-foreground border-primary" : "bg-background"
            }`}
          >
            {answer?.flagged ? "On the quote" : "Add to quote"}
          </button>
        </div>
      )}
    </div>
  );
}
