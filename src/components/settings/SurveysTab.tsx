import { useState } from "react";
import { Btn, Pill } from "@/components/layout/PageShell";
import { ClipboardList, Copy, Plus, RotateCcw, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  deleteSurvey,
  duplicateSurvey,
  newSurvey,
  resetSurveys,
  saveSurvey,
  useLabourRate,
  useSurveys,
  type Survey,
} from "@/lib/surveysStore";
import SurveyEditor from "./SurveyEditor";
import { useToast } from "@/hooks/use-toast";

export default function SurveysTab() {
  const surveys = useSurveys();
  const [rate, setRate] = useLabourRate();
  const [draft, setDraft] = useState<Survey | null>(null);
  const { toast } = useToast();

  if (draft) {
    return (
      <div className="max-w-3xl space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Editing survey</h2>
          <div className="flex gap-2">
            <Btn onClick={() => setDraft(null)}>Cancel</Btn>
            <Btn
              variant="primary"
              onClick={() => {
                saveSurvey(draft);
                setDraft(null);
                toast({ title: "Survey saved", description: "It's ready for the team on site." });
              }}
            >
              Save survey
            </Btn>
          </div>
        </div>
        <SurveyEditor survey={draft} onChange={setDraft} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Site visit surveys</h2>
          <p className="text-sm text-muted-foreground">
            Build the questions your team answers on site. The answers come back on the job and can go
            straight onto a quote.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Btn onClick={() => resetSurveys()}>
            <RotateCcw className="w-4 h-4" /> Reset
          </Btn>
          <Btn variant="primary" onClick={() => setDraft(newSurvey())}>
            <Plus className="w-4 h-4" /> New survey
          </Btn>
        </div>
      </div>

      <div className="space-y-2">
        {surveys.map((s) => (
          <div key={s.id} className="rounded-xl border-hairline bg-surface p-3 flex items-start gap-3">
            <ClipboardList className="w-4 h-4 mt-1 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{s.name}</p>
              {s.description && <p className="text-xs text-muted-foreground">{s.description}</p>}
              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                <Pill>
                  {s.sections.reduce((n, sec) => n + sec.questions.length, 0)} questions
                </Pill>
                {s.serviceMatch.length > 0 ? (
                  <Pill tone="info">Auto for: {s.serviceMatch.join(", ")}</Pill>
                ) : (
                  <Pill>Picked by hand</Pill>
                )}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Btn onClick={() => setDraft(JSON.parse(JSON.stringify(s)))}>Edit</Btn>
              <Btn onClick={() => duplicateSurvey(s.id)}>
                <Copy className="w-4 h-4" />
              </Btn>
              <Btn onClick={() => deleteSurvey(s.id)}>
                <Trash2 className="w-4 h-4" />
              </Btn>
            </div>
          </div>
        ))}
        {surveys.length === 0 && (
          <p className="text-sm text-muted-foreground">No surveys yet — add one to get started.</p>
        )}
      </div>

      <div className="rounded-xl border-hairline p-4 max-w-sm">
        <Label>Labour rate per hour (£)</Label>
        <Input
          value={rate}
          onChange={(e) => setRate(Number(e.target.value) || 0)}
          inputMode="decimal"
        />
        <p className="text-[11px] text-muted-foreground mt-1">
          Used with time on site to work out what a job cost you.
        </p>
      </div>
    </div>
  );
}
