import { useEffect, useState } from "react";
import { jobs as seedJobs, type Job } from "@/data/mockData";

const EXTRA_KEY = "extra-jobs-v1";
const PATCH_KEY = "patch-jobs-v1";

type Listener = () => void;
const listeners = new Set<Listener>();

let extra: Job[] = [];
let patches: Record<string, Partial<Job>> = {};

if (typeof window !== "undefined") {
  try {
    extra = JSON.parse(localStorage.getItem(EXTRA_KEY) || "[]");
  } catch {
    extra = [];
  }
  try {
    patches = JSON.parse(localStorage.getItem(PATCH_KEY) || "{}");
  } catch {
    patches = {};
  }
}

function build(): Job[] {
  const seedWithPatches = seedJobs.map((j) =>
    patches[j.id] ? { ...j, ...patches[j.id] } : j,
  );
  return [...extra, ...seedWithPatches];
}

let current: Job[] = build();

function persist() {
  try {
    localStorage.setItem(EXTRA_KEY, JSON.stringify(extra));
    localStorage.setItem(PATCH_KEY, JSON.stringify(patches));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

const seedIdSet = new Set(seedJobs.map((j) => j.id));

export function addJob(job: Job) {
  extra = [job, ...extra];
  current = build();
  persist();
}

export function updateJob(id: string, patch: Partial<Job>) {
  if (seedIdSet.has(id)) {
    patches[id] = { ...patches[id], ...patch };
  } else {
    extra = extra.map((j) => (j.id === id ? { ...j, ...patch } : j));
  }
  current = build();
  persist();
}

export function getJobs(): Job[] {
  return current;
}

export function findJob(id: string): Job | undefined {
  return current.find((j) => j.id === id);
}

export function useJobs(): [Job[], (updater: (prev: Job[]) => Job[]) => void] {
  const [all, setAll] = useState<Job[]>(current);

  useEffect(() => {
    const l = () => setAll(current);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);

  const update = (fn: (prev: Job[]) => Job[]) => {
    const next = fn(current);
    extra = next.filter((j) => !seedIdSet.has(j.id));
    const nextPatches: Record<string, Partial<Job>> = {};
    next.forEach((j) => {
      if (!seedIdSet.has(j.id)) return;
      const seed = seedJobs.find((s) => s.id === j.id)!;
      const patch: Partial<Job> = {};
      (Object.keys(j) as (keyof Job)[]).forEach((k) => {
        if (JSON.stringify(j[k]) !== JSON.stringify(seed[k])) {
          (patch as Record<string, unknown>)[k as string] = j[k];
        }
      });
      if (Object.keys(patch).length) nextPatches[j.id] = patch;
    });
    patches = nextPatches;
    current = build();
    persist();
  };

  return [all, update];
}
