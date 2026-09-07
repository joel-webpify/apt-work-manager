import { useEffect, useState } from "react";
import type { ProductUnit } from "@/data/mockData";

/**
 * Survey question sets: designed in Settings, filled in on site,
 * and turned into quote lines back in the office.
 */

export type QuestionType =
  | "text"
  | "longtext"
  | "number"
  | "yesno"
  | "one"
  | "many"
  | "photo"
  | "measure";

export const questionTypes: { id: QuestionType; label: string; help: string }[] = [
  { id: "text", label: "Short answer", help: "A word or a line." },
  { id: "longtext", label: "Notes", help: "A few sentences." },
  { id: "number", label: "Number", help: "Just a number." },
  { id: "yesno", label: "Yes / no", help: "A simple tap." },
  { id: "one", label: "Pick one", help: "One answer from your list." },
  { id: "many", label: "Pick several", help: "Any number from your list." },
  { id: "photo", label: "Photo", help: "Asks for a picture." },
  { id: "measure", label: "Measurement", help: "A number with a unit." },
];

export const measureUnits = ["m", "m²", "mm", "cm", "hours", "each", "bar", "°C"];

export interface SurveyQuestion {
  id: string;
  label: string;
  type: QuestionType;
  help?: string;
  required?: boolean;
  /** For "one" and "many". */
  options?: string[];
  /** For "measure". */
  unit?: string;
  /** Answers to this question can become a quote line. */
  priceable?: boolean;
  defaultPrice?: number;
  priceUnit?: ProductUnit;
  /** Only show this question when an earlier answer matches. */
  showIf?: { questionId: string; equals: string };
}

export interface SurveySection {
  id: string;
  title: string;
  questions: SurveyQuestion[];
}

export interface Survey {
  id: string;
  name: string;
  description?: string;
  /** Words found in a job's service name — the survey then loads automatically. */
  serviceMatch: string[];
  sections: SurveySection[];
  updatedAt?: string;
}

export type AnswerValue = string | string[] | boolean | number;

export interface SurveyAnswer {
  value?: AnswerValue;
  /** Photo questions. */
  photo?: string;
  /** Worker flagged it as something to quote for. */
  flagged?: boolean;
  /** Price the worker put against a priceable answer. */
  price?: number;
}

export type SurveyAnswers = Record<string, SurveyAnswer>;

// ---------- ids ----------
const rid = (p: string) => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

export function newQuestion(type: QuestionType = "text"): SurveyQuestion {
  return {
    id: rid("q"),
    label: "",
    type,
    options: type === "one" || type === "many" ? ["Option 1", "Option 2"] : undefined,
    unit: type === "measure" ? "m" : undefined,
  };
}

export function newSection(title = "New section"): SurveySection {
  return { id: rid("s"), title, questions: [newQuestion()] };
}

export function newSurvey(name = "New survey"): Survey {
  return { id: rid("sv"), name, serviceMatch: [], sections: [newSection("The basics")] };
}

// ---------- starter surveys ----------
function defaults(): Survey[] {
  return [
    {
      id: "sv-bathroom",
      name: "Bathroom / heating site visit",
      description: "What to look at before quoting a bathroom or boiler job.",
      serviceMatch: ["bathroom", "boiler", "heating", "plumb", "radiator"],
      sections: [
        {
          id: "sv-bathroom-s1",
          title: "The property",
          questions: [
            { id: "bp1", label: "Type of property", type: "one", options: ["Flat", "Terrace", "Semi", "Detached", "Commercial"], required: true },
            { id: "bp2", label: "Where can we park?", type: "text", help: "Helps the fitters on the day." },
            { id: "bp3", label: "Any access problems?", type: "yesno" },
            { id: "bp4", label: "Tell us about the access", type: "longtext", showIf: { questionId: "bp3", equals: "yes" } },
          ],
        },
        {
          id: "sv-bathroom-s2",
          title: "The room",
          questions: [
            { id: "br1", label: "Room size", type: "measure", unit: "m²", required: true },
            { id: "br2", label: "Photo of the whole room", type: "photo", required: true },
            { id: "br3", label: "Water pressure", type: "measure", unit: "bar" },
            { id: "br4", label: "What's staying?", type: "many", options: ["Bath", "Toilet", "Basin", "Radiator", "Tiles", "Nothing"] },
          ],
        },
        {
          id: "sv-bathroom-s3",
          title: "Extra work to price",
          questions: [
            { id: "bx1", label: "Old pipework needs replacing", type: "yesno", priceable: true, defaultPrice: 320, priceUnit: "each" },
            { id: "bx2", label: "Floor needs levelling", type: "yesno", priceable: true, defaultPrice: 240, priceUnit: "each" },
            { id: "bx3", label: "Anything else you spotted", type: "longtext", priceable: true, defaultPrice: 0, priceUnit: "each" },
          ],
        },
      ],
    },
    {
      id: "sv-fence",
      name: "Fencing / garden survey",
      description: "Measure up and check the ground before quoting.",
      serviceMatch: ["fence", "fencing", "garden", "landscap", "decking", "patio"],
      sections: [
        {
          id: "sv-fence-s1",
          title: "Measure up",
          questions: [
            { id: "fm1", label: "Run length", type: "measure", unit: "m", required: true },
            { id: "fm2", label: "Height wanted", type: "one", options: ["3ft", "4ft", "5ft", "6ft"], required: true },
            { id: "fm3", label: "Photo along the fence line", type: "photo", required: true },
            { id: "fm4", label: "Ground type", type: "one", options: ["Soil", "Concrete", "Mixed", "Sloped"] },
          ],
        },
        {
          id: "sv-fence-s2",
          title: "Extras to price",
          questions: [
            { id: "fx1", label: "Old fence to take away", type: "yesno", priceable: true, defaultPrice: 180, priceUnit: "each" },
            { id: "fx2", label: "New gate wanted", type: "yesno", priceable: true, defaultPrice: 260, priceUnit: "each" },
            { id: "fx3", label: "Concrete posts instead of timber", type: "yesno", priceable: true, defaultPrice: 22, priceUnit: "each" },
            { id: "fx4", label: "Anything else you spotted", type: "longtext", priceable: true, defaultPrice: 0, priceUnit: "each" },
          ],
        },
      ],
    },
  ];
}

// ---------- store ----------
const KEY = "surveys-v1";
const JOB_KEY = "job-survey-v1";
const RATE_KEY = "labour-rate-v1";

const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}

let surveys: Survey[] = defaults();
let jobSurveys: Record<string, string> = {};
let labourRate = 45;

if (typeof window !== "undefined") {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) surveys = JSON.parse(raw);
  } catch {
    surveys = defaults();
  }
  try {
    jobSurveys = JSON.parse(localStorage.getItem(JOB_KEY) || "{}");
  } catch {
    jobSurveys = {};
  }
  const r = Number(localStorage.getItem(RATE_KEY));
  if (r > 0) labourRate = r;
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(surveys));
    localStorage.setItem(JOB_KEY, JSON.stringify(jobSurveys));
    localStorage.setItem(RATE_KEY, String(labourRate));
  } catch {
    /* ignore */
  }
  emit();
}

export function getSurveys() {
  return surveys;
}
export function findSurvey(id?: string) {
  return id ? surveys.find((s) => s.id === id) : undefined;
}

export function saveSurvey(next: Survey) {
  const stamped = { ...next, updatedAt: new Date().toISOString() };
  surveys = surveys.some((s) => s.id === next.id)
    ? surveys.map((s) => (s.id === next.id ? stamped : s))
    : [stamped, ...surveys];
  persist();
}

export function deleteSurvey(id: string) {
  surveys = surveys.filter((s) => s.id !== id);
  persist();
}

export function duplicateSurvey(id: string) {
  const src = findSurvey(id);
  if (!src) return;
  const copy: Survey = JSON.parse(JSON.stringify(src));
  copy.id = rid("sv");
  copy.name = `${src.name} (copy)`;
  copy.serviceMatch = [];
  saveSurvey(copy);
}

export function resetSurveys() {
  surveys = defaults();
  persist();
}

export function useSurveys(): Survey[] {
  const [snap, setSnap] = useState(surveys);
  useEffect(() => {
    const l = () => setSnap([...surveys]);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return snap;
}

// ---------- which survey for which job ----------
export function surveyForService(service?: string): Survey | undefined {
  const s = (service ?? "").toLowerCase();
  if (!s) return undefined;
  return surveys.find((sv) => sv.serviceMatch.some((m) => m && s.includes(m.toLowerCase())));
}

export function setJobSurvey(jobId: string, surveyId: string | undefined) {
  if (surveyId) jobSurveys[jobId] = surveyId;
  else delete jobSurveys[jobId];
  jobSurveys = { ...jobSurveys };
  persist();
}

export function surveyForJob(jobId: string, service?: string): Survey | undefined {
  return findSurvey(jobSurveys[jobId]) ?? surveyForService(service);
}

export function useSurveyForJob(jobId: string, service?: string): Survey | undefined {
  const all = useSurveys();
  const [, tick] = useState(0);
  useEffect(() => {
    const l = () => tick((n) => n + 1);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  void all;
  return surveyForJob(jobId, service);
}

// ---------- labour rate ----------
export function getLabourRate() {
  return labourRate;
}
export function setLabourRate(rate: number) {
  labourRate = rate > 0 ? rate : 0;
  persist();
}
export function useLabourRate(): [number, (r: number) => void] {
  const [snap, setSnap] = useState(labourRate);
  useEffect(() => {
    const l = () => setSnap(labourRate);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return [snap, setLabourRate];
}

// ---------- answering helpers ----------
export function allQuestions(survey: Survey): SurveyQuestion[] {
  return survey.sections.flatMap((s) => s.questions);
}

function matches(answer: SurveyAnswer | undefined, equals: string): boolean {
  if (!answer) return false;
  const v = answer.value;
  if (typeof v === "boolean") return equals === (v ? "yes" : "no");
  if (Array.isArray(v)) return v.includes(equals);
  return String(v ?? "").toLowerCase() === equals.toLowerCase();
}

export function isVisible(q: SurveyQuestion, answers: SurveyAnswers): boolean {
  if (!q.showIf) return true;
  return matches(answers[q.showIf.questionId], q.showIf.equals);
}

export function visibleQuestions(survey: Survey, answers: SurveyAnswers): SurveyQuestion[] {
  return allQuestions(survey).filter((q) => isVisible(q, answers));
}

export function isAnswered(q: SurveyQuestion, a?: SurveyAnswer): boolean {
  if (!a) return false;
  if (q.type === "photo") return Boolean(a.photo);
  if (typeof a.value === "boolean") return true;
  if (Array.isArray(a.value)) return a.value.length > 0;
  return String(a.value ?? "").trim().length > 0;
}

export function surveyProgress(survey: Survey, answers: SurveyAnswers) {
  const qs = visibleQuestions(survey, answers);
  const done = qs.filter((q) => isAnswered(q, answers[q.id])).length;
  const missingRequired = qs.filter((q) => q.required && !isAnswered(q, answers[q.id]));
  return { total: qs.length, done, missingRequired };
}

export function answerText(q: SurveyQuestion, a?: SurveyAnswer): string {
  if (!a) return "";
  if (q.type === "photo") return a.photo ? "Photo taken" : "";
  const v = a.value;
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (Array.isArray(v)) return v.join(", ");
  const text = String(v ?? "");
  if (!text) return "";
  return q.type === "measure" && q.unit ? `${text} ${q.unit}` : text;
}

export interface SurveyFinding {
  questionId: string;
  label: string;
  description: string;
  price: number;
  unit: ProductUnit;
  photo?: string;
}

/** Priceable answers the worker said yes to (or wrote something against). */
export function surveyFindings(survey: Survey | undefined, answers: SurveyAnswers): SurveyFinding[] {
  if (!survey) return [];
  return allQuestions(survey)
    .filter((q) => (q.priceable || answers[q.id]?.flagged) && isVisible(q, answers))
    .map((q): SurveyFinding | undefined => {
      const a = answers[q.id];
      if (!a) return undefined;
      const answered = isAnswered(q, a);
      const yesNo = typeof a.value === "boolean";
      if (yesNo && a.value !== true && !a.flagged) return undefined;
      if (!yesNo && !answered && !a.flagged) return undefined;
      return {
        questionId: q.id,
        label: q.label || "Extra work spotted on site",
        description: yesNo ? "" : answerText(q, a),
        price: a.price ?? q.defaultPrice ?? 0,
        unit: (q.priceUnit ?? "each") as ProductUnit,
        photo: a.photo,
      } satisfies SurveyFinding;
    })
    .filter((f): f is SurveyFinding => Boolean(f));
}
