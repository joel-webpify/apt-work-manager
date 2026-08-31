import { supabase } from "@/integrations/supabase/client";

export interface ParsedNotes {
  workDone?: string;
  partsUsed?: string;
  extraWorkNote?: string;
  extraWorkValue?: string;
  checks?: string[];
}

async function callFieldNotes(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("field-notes", { body });
  if (error) {
    const details =
      typeof (error as { context?: { text?: () => Promise<string> } }).context?.text === "function"
        ? await (error as { context: { text: () => Promise<string> } }).context.text()
        : error.message;
    throw new Error(details || "Could not sort that out just now");
  }
  return data as Record<string, unknown>;
}

/** Turn a spoken (or typed) ramble into the job sheet fields. Nothing is saved without the worker seeing it. */
export async function parseSpokenNotes(input: {
  transcript: string;
  service?: string;
  checklist: { id: string; label: string }[];
}): Promise<ParsedNotes> {
  const data = await callFieldNotes({ mode: "parse", ...input });
  const parsed = (data.result ?? {}) as ParsedNotes;
  return {
    workDone: typeof parsed.workDone === "string" ? parsed.workDone : undefined,
    partsUsed: typeof parsed.partsUsed === "string" ? parsed.partsUsed : undefined,
    extraWorkNote: typeof parsed.extraWorkNote === "string" ? parsed.extraWorkNote : undefined,
    extraWorkValue: typeof parsed.extraWorkValue === "string" ? parsed.extraWorkValue : undefined,
    checks: Array.isArray(parsed.checks) ? parsed.checks.filter((c) => typeof c === "string") : [],
  };
}

/** Clean up rough notes into one tidy sentence the customer could read. */
export async function tidyText(text: string, hint?: string): Promise<string> {
  const data = await callFieldNotes({ mode: "tidy", transcript: text, hint });
  return typeof data.text === "string" ? data.text : text;
}
