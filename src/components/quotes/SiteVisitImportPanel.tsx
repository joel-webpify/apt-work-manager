import { useMemo, useState } from "react";
import { ClipboardList, Plus } from "lucide-react";
import { Btn, Pill } from "@/components/layout/PageShell";
import { Label } from "@/components/ui/label";
import type { QuoteLineItem } from "@/data/mockData";
import { useJobs } from "@/lib/jobsStore";
import { useJobRecords } from "@/lib/fieldStore";
import { answerText, isAnswered, surveyFindings, surveyForJob, useSurveys } from "@/lib/surveysStore";
import { useMaterials } from "@/lib/materialsStore";
import { fmt } from "@/lib/quoteUtils";

type Target = "included" | "optional" | "choice";

interface Row {
  key: string;
  name: string;
  description?: string;
  qty: number;
  unit: QuoteLineItem["unit"];
  unitPrice: number;
  taxRate: number;
  imageUrl?: string;
  source: "Survey" | "Materials";
}

/** Pulls survey findings and materials from a job's site visit into the quote. */
export default function SiteVisitImportPanel({
  jobId,
  contactId,
  onPickJob,
  onAdd,
}: {
  jobId?: string;
  contactId?: string;
  onPickJob: (jobId: string | undefined) => void;
  onAdd: (lines: Omit<QuoteLineItem, "id">[], target: Target) => void;
}) {
  const [jobs] = useJobs();
  useSurveys();
  const records = useJobRecords(jobId ?? "");
  const materials = useMaterials(jobId ?? "");
  const [picked, setPicked] = useState<string[]>([]);
  const [target, setTarget] = useState<Target>("included");

  const jobOptions = useMemo(
    () => (contactId ? jobs.filter((j) => j.contactId === contactId) : jobs).slice(0, 40),
    [jobs, contactId],
  );

  const job = jobs.find((j) => j.id === jobId);
  const survey = jobId ? surveyForJob(jobId, job?.service) : undefined;

  const rows: Row[] = [];
  records.forEach((r) => {
    surveyFindings(survey, r.record.survey?.answers ?? {}).forEach((f) => {
      rows.push({
        key: `${r.employeeId}-${f.questionId}`,
        name: f.label,
        description: f.description,
        qty: 1,
        unit: f.unit,
        unitPrice: f.price,
        taxRate: 20,
        imageUrl: f.photo,
        source: "Survey",
      });
    });
  });
  materials.forEach((m) => {
    rows.push({
      key: m.id,
      name: m.name || "Materials",
      description: m.supplier ? `Supplied by ${m.supplier}` : m.note,
      qty: m.qty,
      unit: m.unit,
      unitPrice: m.price,
      taxRate: m.taxRate,
      source: "Materials",
    });
  });

  /** Plain answers, so you can read what the visit found while pricing. */
  const answerLines = records.flatMap((r) => {
    const answers = r.record.survey?.answers ?? {};
    if (!survey) return [];
    return survey.sections.flatMap((s) =>
      s.questions
        .filter((q) => isAnswered(q, answers[q.id]))
        .map((q) => ({ key: `${r.employeeId}-${q.id}`, label: q.label, value: answerText(q, answers[q.id]) })),
    );
  });

  const toggle = (key: string) =>
    setPicked((p) => (p.includes(key) ? p.filter((x) => x !== key) : [...p, key]));

  const add = () => {
    const lines = rows
      .filter((r) => picked.includes(r.key))
      .map(({ key, source, ...rest }) => {
        void key;
        void source;
        return rest;
      });
    if (!lines.length) return;
    onAdd(lines, target);
    setPicked([]);
  };

  return (
    <div className="rounded-lg border-hairline bg-surface p-3 space-y-3">
      <div className="flex items-center gap-2">
        <ClipboardList className="w-4 h-4 text-muted-foreground" />
        <p className="text-sm font-medium">From the site visit</p>
      </div>

      <div className="space-y-1.5">
        <Label>Which job was visited?</Label>
        <select
          value={jobId ?? ""}
          onChange={(e) => onPickJob(e.target.value || undefined)}
          className="h-9 w-full rounded-md border-hairline bg-background px-2.5 text-sm"
        >
          <option value="">No job linked</option>
          {jobOptions.map((j) => (
            <option key={j.id} value={j.id}>
              {j.customer} · {j.service}
            </option>
          ))}
        </select>
      </div>

      {!jobId && (
        <p className="text-xs text-muted-foreground">Pick the job to see what the team found on site.</p>
      )}

      {jobId && answerLines.length > 0 && (
        <div className="rounded-md bg-background border-hairline p-2.5 space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Survey answers
          </p>
          {answerLines.map((a) => (
            <div key={a.key} className="flex justify-between gap-3 text-xs">
              <span className="text-muted-foreground">{a.label}</span>
              <span className="font-medium text-right">{a.value}</span>
            </div>
          ))}
        </div>
      )}

      {jobId && rows.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Nothing to price from this visit yet — priced survey answers and materials show up here.
        </p>
      )}

      {rows.length > 0 && (
        <div className="space-y-1.5">
          {rows.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => toggle(r.key)}
              className={`w-full text-left rounded-md border-hairline px-2.5 py-2 flex items-center gap-2 ${
                picked.includes(r.key) ? "bg-primary/10 border-primary" : "bg-background hover:bg-surface-hover"
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{r.name}</p>
                {r.description && <p className="text-[11px] text-muted-foreground truncate">{r.description}</p>}
              </div>
              <Pill tone={r.source === "Survey" ? "info" : "neutral"}>{r.source}</Pill>
              <span className="text-xs tabular-nums w-20 text-right">{fmt(r.qty * r.unitPrice)}</span>
            </button>
          ))}

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value as Target)}
              className="h-8 rounded-md border-hairline bg-background px-2 text-xs"
            >
              <option value="included">Add as included</option>
              <option value="choice">Add as a customer choice</option>
              <option value="optional">Add as an optional extra</option>
            </select>
            <Btn variant="primary" onClick={add} disabled={picked.length === 0}>
              <Plus className="w-3.5 h-3.5" /> Add {picked.length || ""} to the quote
            </Btn>
          </div>
        </div>
      )}
    </div>
  );
}
