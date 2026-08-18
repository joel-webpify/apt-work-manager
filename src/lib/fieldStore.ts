import { useEffect, useState } from "react";
import { employees } from "@/data/mockData";

// ---------- types ----------
export type FieldStatus = "not-started" | "on-my-way" | "arrived" | "working" | "finished";

export const fieldStatusSteps: { id: Exclude<FieldStatus, "not-started">; label: string }[] = [
  { id: "on-my-way", label: "On my way" },
  { id: "arrived", label: "Arrived" },
  { id: "working", label: "Working" },
  { id: "finished", label: "Finished" },
];

export const fieldStatusLabel: Record<FieldStatus, string> = {
  "not-started": "Not started",
  "on-my-way": "On my way",
  arrived: "Arrived",
  working: "Working",
  finished: "Finished",
};

export type PhotoLabel = "before" | "during" | "after";

export interface FieldPhoto {
  id: string;
  dataUrl: string;
  caption: string;
  label: PhotoLabel;
  at: string; // ISO datetime
}

export interface Measurement {
  id: string;
  label: string;
  value: string;
}

export interface FieldRecord {
  status: FieldStatus;
  /** ISO datetimes stamped when each step was tapped. */
  stamps: Partial<Record<Exclude<FieldStatus, "not-started">, string>>;
  photos: FieldPhoto[];
  /** checklist item id -> ticked */
  checklist: Record<string, boolean>;
  measurements: Measurement[];
  workDone: string;
  partsUsed: string;
  extraWorkNote: string;
  extraWorkValue: string;
  signature?: { name: string; dataUrl: string; at: string };
  updatedAt?: string;
}

export const FIELD_CHECKLIST: { id: string; label: string }[] = [
  { id: "access", label: "Got access with no problems" },
  { id: "protected", label: "Area protected / dust sheets down" },
  { id: "safety", label: "Site safe — no hazards left" },
  { id: "work", label: "Work finished as quoted" },
  { id: "tidy", label: "Cleared up and waste removed" },
  { id: "happy", label: "Customer happy with the work" },
];

export function emptyRecord(): FieldRecord {
  return {
    status: "not-started",
    stamps: {},
    photos: [],
    checklist: {},
    measurements: [],
    workDone: "",
    partsUsed: "",
    extraWorkNote: "",
    extraWorkValue: "",
  };
}

// ---------- store ----------
const KEY = "field-records-v1";
const USER_KEY = "field-user-v1";

let records: Record<string, FieldRecord> = {};
const listeners = new Set<() => void>();

if (typeof window !== "undefined") {
  try {
    records = JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    records = {};
  }
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(records));
  } catch {
    /* storage full — keep in memory */
  }
  listeners.forEach((l) => l());
}

export function getRecord(jobId: string): FieldRecord {
  return records[jobId] ?? emptyRecord();
}

export function hasFieldWork(jobId: string): boolean {
  const r = records[jobId];
  if (!r) return false;
  return (
    r.status !== "not-started" ||
    r.photos.length > 0 ||
    r.measurements.length > 0 ||
    Boolean(r.workDone || r.partsUsed || r.extraWorkNote || r.signature) ||
    Object.values(r.checklist).some(Boolean)
  );
}

export function patchRecord(jobId: string, patch: Partial<FieldRecord>) {
  records = {
    ...records,
    [jobId]: { ...getRecord(jobId), ...patch, updatedAt: new Date().toISOString() },
  };
  persist();
}

export function setStatus(jobId: string, status: Exclude<FieldStatus, "not-started">) {
  const cur = getRecord(jobId);
  patchRecord(jobId, {
    status,
    stamps: { ...cur.stamps, [status]: new Date().toISOString() },
  });
}

export function addPhoto(jobId: string, photo: Omit<FieldPhoto, "id" | "at">) {
  const cur = getRecord(jobId);
  patchRecord(jobId, {
    photos: [
      ...cur.photos,
      { ...photo, id: `ph-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, at: new Date().toISOString() },
    ],
  });
}

export function updatePhoto(jobId: string, photoId: string, patch: Partial<FieldPhoto>) {
  const cur = getRecord(jobId);
  patchRecord(jobId, { photos: cur.photos.map((p) => (p.id === photoId ? { ...p, ...patch } : p)) });
}

export function removePhoto(jobId: string, photoId: string) {
  const cur = getRecord(jobId);
  patchRecord(jobId, { photos: cur.photos.filter((p) => p.id !== photoId) });
}

export function useFieldRecord(jobId: string): FieldRecord {
  const [snap, setSnap] = useState<FieldRecord>(() => getRecord(jobId));

  useEffect(() => {
    const l = () => setSnap(getRecord(jobId));
    l();
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, [jobId]);

  return snap;
}

/** Subscribe to any change (used by the office view). */
export function useFieldRecords(): Record<string, FieldRecord> {
  const [snap, setSnap] = useState(records);
  useEffect(() => {
    const l = () => setSnap({ ...records });
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return snap;
}

// ---------- who am I (mock, no login) ----------
export function useFieldUser(): [string, (id: string) => void] {
  const [id, setId] = useState<string>(() => {
    if (typeof window === "undefined") return employees[0].id;
    const saved = localStorage.getItem(USER_KEY);
    return saved && employees.some((e) => e.id === saved) ? saved : employees[0].id;
  });

  const set = (next: string) => {
    setId(next);
    try {
      localStorage.setItem(USER_KEY, next);
    } catch {
      /* ignore */
    }
  };

  return [id, set];
}

// ---------- photo helper ----------
/** Read a file and downscale it so localStorage stays usable. */
export function fileToDataUrl(file: File, maxSize = 900): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that photo"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Could not read that photo"));
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(String(reader.result));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
