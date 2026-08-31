import { useEffect, useState } from "react";
import { employees, jobs as seedJobs } from "@/data/mockData";

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

export type VisitOutcome = "completed" | "no-access" | "return-visit" | "parts-needed";

export const visitOutcomes: { id: VisitOutcome; label: string; help: string }[] = [
  { id: "completed", label: "All done", help: "Work finished as planned." },
  { id: "no-access", label: "Couldn't get in", help: "Nobody home or no access to the site." },
  { id: "return-visit", label: "Needs another visit", help: "Started, but more to do." },
  { id: "parts-needed", label: "Waiting on parts", help: "Held up until parts arrive." },
];

export type PaymentMethod = "card" | "cash" | "bank" | "link";

export interface FieldPayment {
  method: PaymentMethod;
  amount: number;
  at: string;
  reference?: string;
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
  /** Quote raised from the extra work spotted on site. */
  extraWorkQuoteId?: string;
  signature?: { name: string; dataUrl: string; at: string };
  outcome?: VisitOutcome;
  outcomeNote?: string;
  /** Reason the worker gave for wrapping up with things missing. */
  skipReason?: string;
  payment?: FieldPayment;
  reviewRequestedAt?: string;
  summarySentAt?: string;
  followUp?: { date: string; note: string };
  /** Set on sign-off — the sheet goes read-only. */
  lockedAt?: string;
  reopenedAt?: string;
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
const KEY = "field-records-v2";
const LEGACY_KEY = "field-records-v1";
const USER_KEY = "field-user-v1";

/** Records are per worker per job so two people on one job never overwrite each other. */
export function recordKey(jobId: string, employeeId: string) {
  return `${jobId}::${employeeId}`;
}

function splitKey(key: string): { jobId: string; employeeId: string } {
  const [jobId, employeeId] = key.split("::");
  return { jobId, employeeId: employeeId ?? "" };
}

let records: Record<string, FieldRecord> = {};
const listeners = new Set<() => void>();

function migrateLegacy(): Record<string, FieldRecord> {
  const out: Record<string, FieldRecord> = {};
  try {
    const old = JSON.parse(localStorage.getItem(LEGACY_KEY) || "{}") as Record<string, FieldRecord>;
    Object.entries(old).forEach(([jobId, rec]) => {
      const job = seedJobs.find((j) => j.id === jobId);
      const employeeId = job?.assignments?.[0]?.employeeId ?? employees[0].id;
      out[recordKey(jobId, employeeId)] = { ...emptyRecord(), ...rec };
    });
  } catch {
    /* nothing to migrate */
  }
  return out;
}

if (typeof window !== "undefined") {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      records = JSON.parse(raw);
    } else {
      records = migrateLegacy();
      if (Object.keys(records).length) localStorage.setItem(KEY, JSON.stringify(records));
    }
  } catch {
    records = {};
  }
}

/** Set when the last write could not be saved (storage full / offline device). */
let lastWriteFailed = false;

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(records));
    lastWriteFailed = false;
  } catch {
    lastWriteFailed = true;
  }
  listeners.forEach((l) => l());
}

export function storageFailed() {
  return lastWriteFailed;
}

export function getRecord(jobId: string, employeeId: string): FieldRecord {
  return records[recordKey(jobId, employeeId)] ?? emptyRecord();
}

/** Every worker's record for one job — used by the office view. */
export function recordsForJob(jobId: string): { employeeId: string; record: FieldRecord }[] {
  return Object.entries(records)
    .map(([key, record]) => ({ ...splitKey(key), record }))
    .filter((r) => r.jobId === jobId)
    .map(({ employeeId, record }) => ({ employeeId, record }));
}

export function hasAnyWork(r: FieldRecord): boolean {
  return (
    r.status !== "not-started" ||
    r.photos.length > 0 ||
    r.measurements.length > 0 ||
    Boolean(r.workDone || r.partsUsed || r.extraWorkNote || r.signature || r.payment || r.outcome) ||
    Object.values(r.checklist).some(Boolean)
  );
}

export function hasFieldWork(jobId: string): boolean {
  return recordsForJob(jobId).some((r) => hasAnyWork(r.record));
}

export function patchRecord(jobId: string, employeeId: string, patch: Partial<FieldRecord>) {
  records = {
    ...records,
    [recordKey(jobId, employeeId)]: {
      ...getRecord(jobId, employeeId),
      ...patch,
      updatedAt: new Date().toISOString(),
    },
  };
  persist();
}

export function setStatus(jobId: string, employeeId: string, status: Exclude<FieldStatus, "not-started">) {
  const cur = getRecord(jobId, employeeId);
  patchRecord(jobId, employeeId, {
    status,
    stamps: { ...cur.stamps, [status]: cur.stamps[status] ?? new Date().toISOString() },
  });
}

/** Where we are in the visit decides how a new photo is labelled. */
export function autoPhotoLabel(status: FieldStatus): PhotoLabel {
  if (status === "finished") return "after";
  if (status === "working") return "during";
  return "before";
}

export function addPhoto(jobId: string, employeeId: string, photo: Omit<FieldPhoto, "id" | "at">) {
  const cur = getRecord(jobId, employeeId);
  patchRecord(jobId, employeeId, {
    photos: [
      ...cur.photos,
      { ...photo, id: `ph-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, at: new Date().toISOString() },
    ],
  });
}

export function updatePhoto(jobId: string, employeeId: string, photoId: string, patch: Partial<FieldPhoto>) {
  const cur = getRecord(jobId, employeeId);
  patchRecord(jobId, employeeId, {
    photos: cur.photos.map((p) => (p.id === photoId ? { ...p, ...patch } : p)),
  });
}

export function removePhoto(jobId: string, employeeId: string, photoId: string) {
  const cur = getRecord(jobId, employeeId);
  patchRecord(jobId, employeeId, { photos: cur.photos.filter((p) => p.id !== photoId) });
}

/** Minutes between arriving and finishing. */
export function timeOnSiteMinutes(r: FieldRecord): number | undefined {
  const start = r.stamps.arrived ?? r.stamps.working;
  const end = r.stamps.finished;
  if (!start || !end) return undefined;
  const mins = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
  return mins > 0 ? mins : undefined;
}

export function formatMinutes(mins?: number) {
  if (!mins && mins !== 0) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/** What is still missing before this visit can honestly be called done. */
export interface Gap {
  id: string;
  label: string;
}

export function wrapUpGaps(r: FieldRecord): Gap[] {
  const gaps: Gap[] = [];
  if (!r.photos.some((p) => p.label === "after")) gaps.push({ id: "after", label: "No after photo" });
  if (!FIELD_CHECKLIST.every((c) => r.checklist[c.id])) gaps.push({ id: "checks", label: "Some checks not ticked" });
  if (!r.workDone.trim()) gaps.push({ id: "notes", label: "Nothing written about the work" });
  if (!r.signature) gaps.push({ id: "signature", label: "No customer signature" });
  return gaps;
}

export function useFieldRecord(jobId: string, employeeId: string): FieldRecord {
  const [snap, setSnap] = useState<FieldRecord>(() => getRecord(jobId, employeeId));

  useEffect(() => {
    const l = () => setSnap(getRecord(jobId, employeeId));
    l();
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, [jobId, employeeId]);

  return snap;
}

/** Subscribe to any change (used by My day and the office view). */
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

export function useJobRecords(jobId: string): { employeeId: string; record: FieldRecord }[] {
  const all = useFieldRecords();
  return Object.entries(all)
    .map(([key, record]) => ({ ...splitKey(key), record }))
    .filter((r) => r.jobId === jobId)
    .map(({ employeeId, record }) => ({ employeeId, record }));
}

/** Every bit of extra work spotted in the field, newest first. */
export function useFieldOpportunities() {
  const all = useFieldRecords();
  return Object.entries(all)
    .map(([key, record]) => ({ ...splitKey(key), record }))
    .filter((r) => r.record.extraWorkNote.trim().length > 0)
    .sort((a, b) => (b.record.updatedAt ?? "").localeCompare(a.record.updatedAt ?? ""));
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

// ---------- connection ----------
export function useOnline() {
  const [online, setOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  return online;
}

// ---------- photo helper ----------
/** Read a file and downscale it so localStorage stays usable. */
export function fileToDataUrl(file: File, maxSize = 900, quality = 0.7): Promise<string> {
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
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
