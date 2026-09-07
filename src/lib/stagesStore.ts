import { useEffect, useState } from "react";
import { stageColors as seedStageColors } from "@/data/mockData";

export interface Stage {
  id: string;
  name: string;
  color: string; // hsl values without the wrapper, e.g. "199 89% 48%" OR a full hsl(var(--token)) string
}

export interface Pipeline {
  id: string;
  name: string;
  stages: Stage[];
}

export type PipelineId = "sales" | "install" | string;

const PIPELINES_KEY = "pipelines-v3";
const RENAMES_KEY = "pipeline-stage-renames-v1";

interface State {
  pipelines: Pipeline[];
  renames: Record<string, string>;
}

const SALES_STAGE_NAMES = [
  "New enquiry",
  "Contacted",
  "Site visit booked",
  "Quote sent",
  "Following up",
  "Won",
];
/** Delivery only — money (invoiced / paid) lives in Quotes & invoices. */
const INSTALL_STAGE_NAMES = ["To schedule", "Job booked", "In progress", "Completed"];

/** Stages that no longer exist land on their nearest surviving stage. */
const LEGACY_STAGE_MAP: Record<string, string> = {
  Invoiced: "Completed",
  Paid: "Completed",
  "Follow-up": "Following up",
};

const FALLBACK_COLORS: Record<string, string> = {
  "New enquiry": "hsl(var(--info))",
  Contacted: "199 89% 48%",
  "Site visit booked": "271 91% 65%",
  "Quote sent": "hsl(var(--warning))",
  "Following up": "25 95% 53%",
  Won: "142 71% 45%",
  "To schedule": "239 84% 67%",
  "Job booked": "hsl(var(--info))",
  "In progress": "hsl(var(--warning))",
  Completed: "hsl(var(--success))",
};

function colorForSeed(name: string): string {
  return FALLBACK_COLORS[name] ?? (seedStageColors as Record<string, string>)[name] ?? "215 16% 47%";
}

function mkStage(name: string, prefix: string): Stage {
  return { id: `${prefix}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`, name, color: colorForSeed(name) };
}


function defaultState(): State {
  return {
    pipelines: [
      { id: "sales", name: "Sales", stages: SALES_STAGE_NAMES.map((n) => mkStage(n, "sales")) },
      { id: "install", name: "Installation", stages: INSTALL_STAGE_NAMES.map((n) => mkStage(n, "install")) },
    ],
    renames: {},
  };
}

function load(): State {
  let renames: Record<string, string> = {};
  try {
    const renRaw = localStorage.getItem(RENAMES_KEY);
    if (renRaw) renames = JSON.parse(renRaw) as Record<string, string>;
  } catch {
    /* ignore */
  }
  try {
    const raw = localStorage.getItem(PIPELINES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Pipeline[];
      if (Array.isArray(parsed) && parsed.length) return { pipelines: parsed, renames };
    }
  } catch {
    /* ignore */
  }
  return { ...defaultState(), renames };
}

let state: State = typeof window !== "undefined" ? load() : defaultState();
const listeners = new Set<() => void>();

function persist() {
  try {
    localStorage.setItem(PIPELINES_KEY, JSON.stringify(state.pipelines));
    localStorage.setItem(RENAMES_KEY, JSON.stringify(state.renames));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

export function resolveStageName(name: string): string {
  let cur = LEGACY_STAGE_MAP[name] ?? name;
  const seen = new Set<string>();
  while (state.renames[cur] && !seen.has(cur)) {
    seen.add(cur);
    cur = state.renames[cur];
  }
  // A stage that no longer exists anywhere falls back to a sensible one.
  const exists = state.pipelines.some((p) => p.stages.some((s) => s.name === cur));
  if (!exists) cur = LEGACY_STAGE_MAP[cur] ?? cur;
  return cur;
}


export function getPipelines(): Pipeline[] {
  return state.pipelines;
}

/** Which pipeline a stage name belongs to. Unknown stages fall back to the first pipeline. */
export function pipelineIdForStage(stageName: string): PipelineId {
  const resolved = resolveStageName(stageName);
  const hit = state.pipelines.find((p) => p.stages.some((s) => s.name === resolved));
  return hit?.id ?? state.pipelines[0]?.id ?? "sales";
}

export function firstStageOf(pipelineId: PipelineId): string {
  const p = state.pipelines.find((x) => x.id === pipelineId);
  return p?.stages[0]?.name ?? "";
}

export function lastStageOf(pipelineId: PipelineId): string {
  const p = state.pipelines.find((x) => x.id === pipelineId);
  return p?.stages[p.stages.length - 1]?.name ?? "";
}

export const STAGE_COLOR_PRESETS: { label: string; value: string }[] = [
  { label: "Blue", value: "199 89% 48%" },
  { label: "Indigo", value: "239 84% 67%" },
  { label: "Violet", value: "271 91% 65%" },
  { label: "Pink", value: "330 81% 60%" },
  { label: "Rose", value: "350 89% 60%" },
  { label: "Amber", value: "38 92% 50%" },
  { label: "Orange", value: "25 95% 53%" },
  { label: "Green", value: "142 71% 45%" },
  { label: "Teal", value: "173 80% 40%" },
  { label: "Slate", value: "215 16% 47%" },
];

export function colorToCss(value: string): string {
  // Allow pre-formatted strings (hsl(...), var(--...), #hex) to pass through
  if (value.includes("(") || value.startsWith("#") || value.startsWith("var(")) return value;
  return `hsl(${value})`;
}

/**
 * Stage helpers. Pass a pipeline id to scope stages/edits to one pipeline;
 * with no id you get every stage across all pipelines (used by automations).
 */
export function useStages(pipelineId?: PipelineId) {
  const [snap, setSnap] = useState(state);

  useEffect(() => {
    const l = () => setSnap({ ...state });
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);

  const targetId = pipelineId ?? snap.pipelines[0]?.id ?? "sales";
  const allStages = snap.pipelines.flatMap((p) => p.stages);
  const scoped = pipelineId
    ? snap.pipelines.find((p) => p.id === pipelineId)?.stages ?? []
    : allStages;

  const mutate = (fn: (stages: Stage[]) => Stage[]) => {
    state.pipelines = state.pipelines.map((p) => (p.id === targetId ? { ...p, stages: fn(p.stages) } : p));
    persist();
  };

  return {
    pipelines: snap.pipelines,
    pipeline: snap.pipelines.find((p) => p.id === targetId),
    stages: scoped,
    stageNames: scoped.map((s) => s.name),
    allStageNames: allStages.map((s) => s.name),
    colorFor: (name: string) => allStages.find((s) => s.name === name)?.color ?? "215 16% 47%",
    pipelineIdForStage,
    renameStage: (oldName: string, newName: string) => {
      const trimmed = newName.trim();
      if (!trimmed || trimmed === oldName) return;
      state.pipelines = state.pipelines.map((p) => ({
        ...p,
        stages: p.stages.map((st) => (st.name === oldName ? { ...st, name: trimmed } : st)),
      }));
      state.renames = { ...state.renames, [oldName]: trimmed };
      persist();
    },
    renamePipeline: (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      state.pipelines = state.pipelines.map((p) => (p.id === targetId ? { ...p, name: trimmed } : p));
      persist();
    },
    setStageColor: (id: string, color: string) => {
      state.pipelines = state.pipelines.map((p) => ({
        ...p,
        stages: p.stages.map((st) => (st.id === id ? { ...st, color } : st)),
      }));
      persist();
    },
    addStage: (name: string, color: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      mutate((stages) => [
        ...stages,
        { id: `st-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, name: trimmed, color },
      ]);
    },
    removeStage: (id: string) => {
      mutate((stages) => (stages.length <= 1 ? stages : stages.filter((st) => st.id !== id)));
    },
    moveStage: (id: string, dir: -1 | 1) => {
      mutate((stages) => {
        const i = stages.findIndex((st) => st.id === id);
        const j = i + dir;
        if (i < 0 || j < 0 || j >= stages.length) return stages;
        const next = [...stages];
        [next[i], next[j]] = [next[j], next[i]];
        return next;
      });
    },
    resetToDefault: () => {
      state = { ...defaultState(), renames: {} };
      persist();
    },
  };
}
