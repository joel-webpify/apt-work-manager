import { useEffect, useState } from "react";
import { jobs as seedJobs, type Job } from "@/data/mockData";

const KEY = "extra-jobs-v1";
type Listener = () => void;
const listeners = new Set<Listener>();

function load(): Job[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Job[]) : [];
  } catch {
    return [];
  }
}

let extra: Job[] = typeof window !== "undefined" ? load() : [];

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(extra));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

export function addJob(job: Job) {
  extra = [job, ...extra];
  persist();
}

export function useJobs(): [Job[], (updater: (prev: Job[]) => Job[]) => void] {
  const [all, setAll] = useState<Job[]>(() => [...extra, ...seedJobs]);

  useEffect(() => {
    const l = () => setAll([...extra, ...seedJobs]);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);

  const update = (fn: (prev: Job[]) => Job[]) => {
    setAll((prev) => {
      const next = fn(prev);
      const seedIds = new Set(seedJobs.map((j) => j.id));
      extra = next.filter((j) => !seedIds.has(j.id));
      try {
        localStorage.setItem(KEY, JSON.stringify(extra));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  return [all, update];
}
