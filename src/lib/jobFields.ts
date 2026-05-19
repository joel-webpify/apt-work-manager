import { useEffect, useState } from "react";

export type JobFieldType =
  | "text"
  | "textarea"
  | "number"
  | "email"
  | "phone"
  | "select"
  | "date"
  | "checkbox";

export interface JobCustomField {
  id: string;
  type: JobFieldType;
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: string[]; // for select
  showOnCard?: boolean;
}

export const JOB_FIELD_TYPE_META: Record<JobFieldType, { label: string }> = {
  text: { label: "Short text" },
  textarea: { label: "Long text" },
  number: { label: "Number" },
  email: { label: "Email" },
  phone: { label: "Phone" },
  select: { label: "Dropdown" },
  date: { label: "Date" },
  checkbox: { label: "Checkbox" },
};

export const DEFAULT_JOB_FIELDS: JobCustomField[] = [
  { id: "jf-pref-time", type: "select", label: "Preferred time", options: ["Morning", "Afternoon", "Evening", "Flexible"] },
  { id: "jf-access", type: "text", label: "Access notes", placeholder: "Key safe, side gate…" },
  { id: "jf-source", type: "select", label: "Lead source", options: ["Website form", "Google Ads", "Referral", "Facebook", "Repeat customer"] },
  { id: "jf-deadline", type: "date", label: "Customer deadline" },
  { id: "jf-priority", type: "select", label: "Priority", options: ["Low", "Normal", "High", "Urgent"], showOnCard: true },
];

const STORAGE_KEY = "tt:jobFieldSchema:v1";

export function useJobFieldSchema() {
  const [schema, setSchema] = useState<JobCustomField[]>(() => {
    if (typeof window === "undefined") return DEFAULT_JOB_FIELDS;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return DEFAULT_JOB_FIELDS;
      const parsed = JSON.parse(raw) as JobCustomField[];
      return Array.isArray(parsed) ? parsed : DEFAULT_JOB_FIELDS;
    } catch {
      return DEFAULT_JOB_FIELDS;
    }
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(schema)); } catch { /* noop */ }
    // Notify other components on same tab
    window.dispatchEvent(new CustomEvent("jobFieldSchema:update"));
  }, [schema]);

  useEffect(() => {
    const handler = () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as JobCustomField[];
          if (Array.isArray(parsed)) setSchema(parsed);
        }
      } catch { /* noop */ }
    };
    window.addEventListener("jobFieldSchema:update", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("jobFieldSchema:update", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  return [schema, setSchema] as const;
}

export function makeNewField(type: JobFieldType): JobCustomField {
  return {
    id: `jf-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type,
    label: JOB_FIELD_TYPE_META[type].label,
    required: false,
    options: type === "select" ? ["Option 1", "Option 2"] : undefined,
  };
}

export function formatFieldValue(field: JobCustomField, value: unknown): string {
  if (value === undefined || value === null || value === "") return "—";
  if (field.type === "checkbox") return value ? "Yes" : "No";
  return String(value);
}
