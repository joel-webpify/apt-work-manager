import { useEffect, useState } from "react";
import { stages as seedStages, stageColors as seedStageColors } from "@/data/mockData";

export interface Stage {
  id: string;
  name: string;
  color: string; // hsl values without the wrapper, e.g. "199 89% 48%" OR a full hsl(var(--token)) string
}

const STAGES_KEY = "pipeline-stages-v1";
const RENAMES_KEY = "pipeline-stage-renames-v1";

interface State {
  stages: Stage[];
  renames: Record<string, string>;
}

function defaultState(): State {
  return {
    stages: seedStages.map((s) => ({ id: s, name: s, color: seedStageColors[s] })),
    renames: {},
  };
}

function load(): State {
  try {
    const raw = localStorage.getItem(STAGES_KEY);
    const renRaw = localStorage.getItem(RENAMES_KEY);
    if (raw) {
      return {
        stages: JSON.parse(raw) as Stage[],
        renames: renRaw ? (JSON.parse(renRaw) as Record<string, string>) : {},
      };
    }
  } catch {
    /* ignore */
  }
  return defaultState();
}

let state: State = typeof window !== "undefined" ? load() : defaultState();
const listeners = new Set<() => void>();

function persist() {
  try {
    localStorage.setItem(STAGES_KEY, JSON.stringify(state.stages));
    localStorage.setItem(RENAMES_KEY, JSON.stringify(state.renames));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

export function resolveStageName(name: string): string {
  let cur = name;
  const seen = new Set<string>();
  while (state.renames[cur] && !seen.has(cur)) {
    seen.add(cur);
    cur = state.renames[cur];
  }
  return cur;
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

export function useStages() {
  const [snap, setSnap] = useState(state);

  useEffect(() => {
    const l = () => setSnap({ ...state });
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);

  return {
    stages: snap.stages,
    stageNames: snap.stages.map((s) => s.name),
    colorFor: (name: string) => snap.stages.find((s) => s.name === name)?.color ?? "215 16% 47%",
    renameStage: (oldName: string, newName: string) => {
      const trimmed = newName.trim();
      if (!trimmed || trimmed === oldName) return;
      state.stages = state.stages.map((st) => (st.name === oldName ? { ...st, name: trimmed } : st));
      state.renames = { ...state.renames, [oldName]: trimmed };
      persist();
    },
    setStageColor: (id: string, color: string) => {
      state.stages = state.stages.map((st) => (st.id === id ? { ...st, color } : st));
      persist();
    },
    addStage: (name: string, color: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      state.stages = [...state.stages, { id: `st-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, name: trimmed, color }];
      persist();
    },
    removeStage: (id: string) => {
      state.stages = state.stages.filter((st) => st.id !== id);
      persist();
    },
    moveStage: (id: string, dir: -1 | 1) => {
      const i = state.stages.findIndex((st) => st.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= state.stages.length) return;
      const next = [...state.stages];
      [next[i], next[j]] = [next[j], next[i]];
      state.stages = next;
      persist();
    },
    resetToDefault: () => {
      state = defaultState();
      persist();
    },
  };
}
