import { useState } from "react";
import { ChevronDown, ChevronUp, Copy, GripVertical, Plus, Trash2 } from "lucide-react";
import { Btn } from "@/components/layout/PageShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  measureUnits,
  newQuestion,
  newSection,
  questionTypes,
  type QuestionType,
  type Survey,
  type SurveyQuestion,
} from "@/lib/surveysStore";

/** Builds one survey: sections, questions, answer types and quoting rules. */
export default function SurveyEditor({
  survey,
  onChange,
}: {
  survey: Survey;
  onChange: (next: Survey) => void;
}) {
  const [openQ, setOpenQ] = useState<string | null>(null);

  const patch = (p: Partial<Survey>) => onChange({ ...survey, ...p });

  const patchSection = (sid: string, p: Partial<Survey["sections"][number]>) =>
    patch({ sections: survey.sections.map((s) => (s.id === sid ? { ...s, ...p } : s)) });

  const patchQuestion = (sid: string, qid: string, p: Partial<SurveyQuestion>) =>
    patchSection(sid, {
      questions: survey.sections
        .find((s) => s.id === sid)!
        .questions.map((q) => (q.id === qid ? { ...q, ...p } : q)),
    });

  const moveQuestion = (sid: string, qid: string, dir: -1 | 1) => {
    const section = survey.sections.find((s) => s.id === sid)!;
    const idx = section.questions.findIndex((q) => q.id === qid);
    const to = idx + dir;
    if (to < 0 || to >= section.questions.length) return;
    const next = [...section.questions];
    [next[idx], next[to]] = [next[to], next[idx]];
    patchSection(sid, { questions: next });
  };

  const moveSection = (sid: string, dir: -1 | 1) => {
    const idx = survey.sections.findIndex((s) => s.id === sid);
    const to = idx + dir;
    if (to < 0 || to >= survey.sections.length) return;
    const next = [...survey.sections];
    [next[idx], next[to]] = [next[to], next[idx]];
    patch({ sections: next });
  };

  /** Yes/no and choice questions earlier in the survey can drive "show only if". */
  const conditionSources = survey.sections
    .flatMap((s) => s.questions)
    .filter((q) => q.type === "yesno" || q.type === "one" || q.type === "many");

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label>Survey name</Label>
          <Input value={survey.name} onChange={(e) => patch({ name: e.target.value })} placeholder="e.g. Bathroom site visit" />
        </div>
        <div>
          <Label>Loads automatically for jobs mentioning</Label>
          <Input
            value={survey.serviceMatch.join(", ")}
            onChange={(e) =>
              patch({ serviceMatch: e.target.value.split(",").map((w) => w.trim()).filter(Boolean) })
            }
            placeholder="bathroom, boiler, heating"
          />
          <p className="text-[11px] text-muted-foreground mt-1">
            Separate words with commas. Leave empty to only use it when picked by hand.
          </p>
        </div>
      </div>
      <div>
        <Label>What is this survey for?</Label>
        <Textarea
          value={survey.description ?? ""}
          onChange={(e) => patch({ description: e.target.value })}
          rows={2}
          placeholder="A line to help whoever attaches it to a job."
        />
      </div>

      {survey.sections.map((section, si) => (
        <div key={section.id} className="rounded-xl border-hairline bg-surface p-3 space-y-3">
          <div className="flex items-center gap-2">
            <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
            <Input
              value={section.title}
              onChange={(e) => patchSection(section.id, { title: e.target.value })}
              className="font-medium"
            />
            <button type="button" onClick={() => moveSection(section.id, -1)} disabled={si === 0} className="w-8 h-8 rounded-lg border-hairline bg-background inline-flex items-center justify-center disabled:opacity-40">
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={() => moveSection(section.id, 1)} disabled={si === survey.sections.length - 1} className="w-8 h-8 rounded-lg border-hairline bg-background inline-flex items-center justify-center disabled:opacity-40">
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => patch({ sections: survey.sections.filter((s) => s.id !== section.id) })}
              className="w-8 h-8 rounded-lg border-hairline bg-background inline-flex items-center justify-center"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {section.questions.map((q, qi) => {
              const open = openQ === q.id;
              const type = questionTypes.find((t) => t.id === q.type);
              return (
                <div key={q.id} className="rounded-lg border-hairline bg-background">
                  <div className="flex items-center gap-2 p-2">
                    <Input
                      value={q.label}
                      onChange={(e) => patchQuestion(section.id, q.id, { label: e.target.value })}
                      placeholder="Question the worker sees"
                      className="flex-1"
                    />
                    <span className="text-[11px] text-muted-foreground hidden sm:block w-24 truncate">{type?.label}</span>
                    <button type="button" onClick={() => moveQuestion(section.id, q.id, -1)} disabled={qi === 0} className="w-8 h-8 rounded-lg border-hairline inline-flex items-center justify-center disabled:opacity-40">
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" onClick={() => moveQuestion(section.id, q.id, 1)} disabled={qi === section.questions.length - 1} className="w-8 h-8 rounded-lg border-hairline inline-flex items-center justify-center disabled:opacity-40">
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        patchSection(section.id, {
                          questions: [...section.questions, { ...q, id: newQuestion().id }],
                        })
                      }
                      className="w-8 h-8 rounded-lg border-hairline inline-flex items-center justify-center"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        patchSection(section.id, { questions: section.questions.filter((x) => x.id !== q.id) })
                      }
                      className="w-8 h-8 rounded-lg border-hairline inline-flex items-center justify-center"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setOpenQ(open ? null : q.id)}
                      className="h-8 px-2.5 rounded-lg border-hairline text-xs font-medium"
                    >
                      {open ? "Done" : "Set up"}
                    </button>
                  </div>

                  {open && (
                    <div className="border-t-hairline p-3 space-y-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <Label>Answer type</Label>
                          <select
                            value={q.type}
                            onChange={(e) => {
                              const t = e.target.value as QuestionType;
                              patchQuestion(section.id, q.id, {
                                type: t,
                                options: t === "one" || t === "many" ? q.options ?? ["Option 1", "Option 2"] : undefined,
                                unit: t === "measure" ? q.unit ?? "m" : undefined,
                              });
                            }}
                            className="h-10 w-full rounded-lg border-hairline bg-background px-2.5 text-sm"
                          >
                            {questionTypes.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.label}
                              </option>
                            ))}
                          </select>
                          <p className="text-[11px] text-muted-foreground mt-1">{type?.help}</p>
                        </div>
                        <div>
                          <Label>Help text for the worker</Label>
                          <Input
                            value={q.help ?? ""}
                            onChange={(e) => patchQuestion(section.id, q.id, { help: e.target.value })}
                            placeholder="Optional hint"
                          />
                        </div>
                      </div>

                      {(q.type === "one" || q.type === "many") && (
                        <div>
                          <Label>Options (one per line)</Label>
                          <Textarea
                            rows={3}
                            value={(q.options ?? []).join("\n")}
                            onChange={(e) =>
                              patchQuestion(section.id, q.id, {
                                options: e.target.value.split("\n").map((o) => o.trim()).filter(Boolean),
                              })
                            }
                          />
                        </div>
                      )}

                      {q.type === "measure" && (
                        <div>
                          <Label>Unit</Label>
                          <select
                            value={q.unit ?? "m"}
                            onChange={(e) => patchQuestion(section.id, q.id, { unit: e.target.value })}
                            className="h-10 w-full rounded-lg border-hairline bg-background px-2.5 text-sm"
                          >
                            {measureUnits.map((u) => (
                              <option key={u} value={u}>
                                {u}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div className="flex items-center justify-between rounded-lg border-hairline p-2.5">
                        <div>
                          <p className="text-sm font-medium">Must be answered</p>
                          <p className="text-[11px] text-muted-foreground">The worker is reminded before signing off.</p>
                        </div>
                        <Switch
                          checked={Boolean(q.required)}
                          onCheckedChange={(v) => patchQuestion(section.id, q.id, { required: v })}
                        />
                      </div>

                      <div className="rounded-lg border-hairline p-2.5 space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">Can become a quote line</p>
                            <p className="text-[11px] text-muted-foreground">
                              The answer comes back as something you can charge for.
                            </p>
                          </div>
                          <Switch
                            checked={Boolean(q.priceable)}
                            onCheckedChange={(v) => patchQuestion(section.id, q.id, { priceable: v })}
                          />
                        </div>
                        {q.priceable && (
                          <div className="grid gap-2 sm:grid-cols-2">
                            <div>
                              <Label>Suggested price £</Label>
                              <Input
                                value={q.defaultPrice ?? 0}
                                onChange={(e) =>
                                  patchQuestion(section.id, q.id, { defaultPrice: Number(e.target.value) || 0 })
                                }
                              />
                            </div>
                            <div>
                              <Label>Per</Label>
                              <select
                                value={q.priceUnit ?? "each"}
                                onChange={(e) =>
                                  patchQuestion(section.id, q.id, {
                                    priceUnit: e.target.value as SurveyQuestion["priceUnit"],
                                  })
                                }
                                className="h-10 w-full rounded-lg border-hairline bg-background px-2.5 text-sm"
                              >
                                {["each", "hour", "day", "sqm", "m", "visit"].map((u) => (
                                  <option key={u} value={u}>
                                    {u}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="rounded-lg border-hairline p-2.5 space-y-2">
                        <p className="text-sm font-medium">Show only if</p>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <select
                            value={q.showIf?.questionId ?? ""}
                            onChange={(e) =>
                              patchQuestion(section.id, q.id, {
                                showIf: e.target.value
                                  ? { questionId: e.target.value, equals: q.showIf?.equals ?? "yes" }
                                  : undefined,
                              })
                            }
                            className="h-10 w-full rounded-lg border-hairline bg-background px-2.5 text-sm"
                          >
                            <option value="">Always show</option>
                            {conditionSources
                              .filter((s) => s.id !== q.id)
                              .map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.label || "Untitled question"}
                                </option>
                              ))}
                          </select>
                          {q.showIf && (
                            <Input
                              value={q.showIf.equals}
                              onChange={(e) =>
                                patchQuestion(section.id, q.id, {
                                  showIf: { questionId: q.showIf!.questionId, equals: e.target.value },
                                })
                              }
                              placeholder="yes"
                            />
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          For a yes/no question type "yes" or "no". For a list, type the option exactly.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <Btn
            variant="secondary"
            onClick={() =>
              patchSection(section.id, { questions: [...section.questions, newQuestion()] })
            }
          >
            <Plus className="w-4 h-4" /> Add question
          </Btn>
        </div>
      ))}

      <Btn variant="secondary" onClick={() => patch({ sections: [...survey.sections, newSection()] })}>
        <Plus className="w-4 h-4" /> Add section
      </Btn>
    </div>
  );
}
