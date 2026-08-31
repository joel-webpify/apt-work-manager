import { useEffect, useState } from "react";
import { contacts, type Quote } from "@/data/mockData";

/**
 * Mock customer portal sign-in. The customer types their email, we show them a
 * six-digit code on screen (in a real build it would be emailed) and they type
 * it back. The session is kept in this browser only — no accounts, no passwords.
 */

const SESSION_KEY = "portal-session-v1";
const CODE_KEY = "portal-code-v1";

export type PortalSession = { email: string; since: string };

type Listener = () => void;
const listeners = new Set<Listener>();

function read<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem(key) || "null");
  } catch {
    return null;
  }
}

let session: PortalSession | null = read<PortalSession>(SESSION_KEY);

function emit() {
  listeners.forEach((l) => l());
}

export const normEmail = (e: string) => e.trim().toLowerCase();

/** Email on record for a quote, via its contact (falls back to name match). */
export function quoteEmail(q: Quote): string | undefined {
  const byId = q.contactId ? contacts.find((c) => c.id === q.contactId) : undefined;
  const byName = contacts.find((c) => c.name === q.customer);
  return (byId ?? byName)?.email;
}

export function quotesForEmail(all: Quote[], email: string) {
  const e = normEmail(email);
  return all.filter((q) => normEmail(quoteEmail(q) || "") === e);
}

/** Emails we can actually recognise — used to keep the demo honest. */
export function knownCustomerEmails(all: Quote[]) {
  return Array.from(new Set(all.map(quoteEmail).filter(Boolean) as string[]));
}

/** Creates (and returns) a six-digit code for this email. */
export function requestCode(email: string): string {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  try {
    localStorage.setItem(CODE_KEY, JSON.stringify({ email: normEmail(email), code }));
  } catch {
    /* ignore */
  }
  return code;
}

export function verifyCode(email: string, code: string): boolean {
  const pending = read<{ email: string; code: string }>(CODE_KEY);
  if (!pending || pending.email !== normEmail(email) || pending.code !== code.trim()) return false;
  session = { email: normEmail(email), since: new Date().toISOString() };
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    localStorage.removeItem(CODE_KEY);
  } catch {
    /* ignore */
  }
  emit();
  return true;
}

export function signOutPortal() {
  session = null;
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
  emit();
}

export function getPortalSession() {
  return session;
}

export function usePortalSession() {
  const [s, setS] = useState<PortalSession | null>(session);
  useEffect(() => {
    const l = () => setS(session);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return s;
}
