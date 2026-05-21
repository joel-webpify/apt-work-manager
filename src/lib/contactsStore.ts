import { useEffect, useState } from "react";
import type { Contact } from "@/data/mockData";

const KEY = "contacts.imported.v1";

type Listener = () => void;
const listeners = new Set<Listener>();

function read(): Contact[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function write(list: Contact[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
  listeners.forEach((l) => l());
}

export function useImportedContacts() {
  const [list, setList] = useState<Contact[]>(read);
  useEffect(() => {
    const l = () => setList(read());
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return list;
}

/** Merge incoming rows by email (case-insensitive). Existing fields are
 *  overwritten only when the incoming value is non-empty. totalSpend is summed. */
export function mergeImportedContacts(incoming: Contact[]) {
  const current = read();
  const byEmail = new Map<string, Contact>();
  for (const c of current) byEmail.set(c.email.toLowerCase(), c);

  for (const row of incoming) {
    const key = row.email.toLowerCase();
    const existing = byEmail.get(key);
    if (!existing) {
      byEmail.set(key, row);
    } else {
      byEmail.set(key, {
        ...existing,
        ...Object.fromEntries(
          Object.entries(row).filter(([, v]) => v !== "" && v !== undefined && v !== null),
        ),
        totalSpend: (existing.totalSpend || 0) + (row.totalSpend || 0),
        id: existing.id,
      } as Contact);
    }
  }
  write(Array.from(byEmail.values()));
}

/** Merge with the seeded mock contacts for display. */
export function mergeWithMock(mock: Contact[], imported: Contact[]): Contact[] {
  const byEmail = new Map<string, Contact>();
  for (const c of mock) byEmail.set(c.email.toLowerCase(), c);
  for (const row of imported) {
    const key = row.email.toLowerCase();
    const existing = byEmail.get(key);
    if (!existing) {
      byEmail.set(key, row);
    } else {
      byEmail.set(key, {
        ...existing,
        ...Object.fromEntries(
          Object.entries(row).filter(([, v]) => v !== "" && v !== undefined && v !== null),
        ),
        totalSpend: (existing.totalSpend || 0) + (row.totalSpend || 0),
        id: existing.id,
      } as Contact);
    }
  }
  return Array.from(byEmail.values());
}

// ---------- CSV parsing ----------

export function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ",") {
        cur.push(field);
        field = "";
      } else if (ch === "\n" || ch === "\r") {
        if (field !== "" || cur.length) {
          cur.push(field);
          lines.push(cur);
          cur = [];
          field = "";
        }
        if (ch === "\r" && text[i + 1] === "\n") i++;
      } else field += ch;
    }
  }
  if (field !== "" || cur.length) {
    cur.push(field);
    lines.push(cur);
  }
  if (!lines.length) return { headers: [], rows: [] };
  const headers = lines[0].map((h) => h.trim());
  const rows = lines.slice(1).map((row) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => (obj[h] = (row[i] ?? "").trim()));
    return obj;
  });
  return { headers, rows };
}

const FIELD_ALIASES: Record<keyof Contact, string[]> = {
  id: ["id"],
  name: ["name", "full name", "customer", "contact"],
  type: ["type", "contact type"],
  phone: ["phone", "mobile", "telephone", "tel"],
  email: ["email", "e-mail", "email address"],
  source: ["source", "lead source", "channel"],
  lifecycle: ["lifecycle", "status", "stage"],
  lastJob: ["last job", "lastjob", "last service"],
  totalSpend: ["total spend", "totalspend", "spend", "revenue", "lifetime value", "ltv"],
  postcode: ["postcode", "zip", "postal code"],
  notes: ["notes", "note", "comments"],
};

export function autoMap(headers: string[]): Partial<Record<keyof Contact, string>> {
  const map: Partial<Record<keyof Contact, string>> = {};
  const lower = headers.map((h) => h.toLowerCase());
  (Object.keys(FIELD_ALIASES) as (keyof Contact)[]).forEach((field) => {
    for (const alias of FIELD_ALIASES[field]) {
      const idx = lower.indexOf(alias);
      if (idx >= 0) {
        map[field] = headers[idx];
        return;
      }
    }
  });
  return map;
}

export function rowsToContacts(
  rows: Record<string, string>[],
  mapping: Partial<Record<keyof Contact, string>>,
): Contact[] {
  return rows
    .map((r, i) => {
      const get = (f: keyof Contact) => (mapping[f] ? r[mapping[f]!] ?? "" : "");
      const email = get("email");
      if (!email) return null;
      const spendStr = get("totalSpend").replace(/[^0-9.-]/g, "");
      const lifecycleRaw = (get("lifecycle") || "Lead").toLowerCase();
      const lifecycle =
        lifecycleRaw.startsWith("cust") ? "Customer" : lifecycleRaw.startsWith("laps") ? "Lapsed" : "Lead";
      const typeRaw = (get("type") || "Residential").toLowerCase();
      const type = typeRaw.startsWith("com") ? "Commercial" : "Residential";
      return {
        id: get("id") || `imp_${Date.now()}_${i}`,
        name: get("name") || email,
        type,
        phone: get("phone"),
        email,
        source: get("source") || "Import",
        lifecycle,
        lastJob: get("lastJob"),
        totalSpend: spendStr ? Number(spendStr) || 0 : 0,
        postcode: get("postcode"),
        notes: get("notes"),
      } as Contact;
    })
    .filter((c): c is Contact => !!c);
}
