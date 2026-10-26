import { useEffect, useState } from "react";
import type { AudienceFilters } from "./whatsappAudience";

// Mockup only: nothing here talks to Meta. Templates, consent and sends live in localStorage.
export type TemplateStatus = "APPROVED" | "PENDING" | "REJECTED";
export type TemplateCategory = "UTILITY" | "MARKETING";
export type WaHeader = { type: "none" | "text" | "image" | "document" | "video"; text?: string; url?: string };
export type WaButton = { type: "quick_reply" | "url" | "call"; text: string; value?: string };
export interface WaTemplate { name: string; category: TemplateCategory; language: string; status: TemplateStatus; body: string; vars: string[]; header?: WaHeader; footer?: string; buttons?: WaButton[]; lastUsed?: string }
export interface WaChatMessage { id: string; dir: "in" | "out"; text: string; at: string; template?: string }
export interface WaConversation { id: string; contactId: string; name: string; phone: string; jobId?: string; unread: number; messages: WaChatMessage[] }
export type WaConsent = "not_set" | "utility" | "all" | "opted_out";
export interface WaCampaign { id: string; name: string; template: string; segment: string; audienceFilters?: AudienceFilters; contactIds?: string[]; status: "Draft" | "Scheduled" | "Sent"; scheduledFor?: string; recipients: number; skipped: number; delivered: number; failed: number; read: number }
export interface WaMessage { id: string; contactId: string; template: string; at: string; status: "sent" | "delivered" | "read" | "failed" | "skipped"; reason?: string }

const seedTemplates: WaTemplate[] = [
  { name: "survey_booked", category: "UTILITY", language: "en_GB", status: "APPROVED", body: "Hi {{1}}, your site survey is booked for {{2}} at {{3}}. {{4}} will be with you — reply here if you need to change it.", vars: ["first_name", "booking_datetime", "job_address", "technician_name"] },
  { name: "visit_reminder", category: "UTILITY", language: "en_GB", status: "APPROVED", body: "Hi {{1}}, a quick reminder that we're with you tomorrow, {{2}}. Please make sure we can get access to the property.", vars: ["first_name", "booking_datetime"] },
  { name: "visit_moved", category: "UTILITY", language: "en_GB", status: "APPROVED", body: "Hi {{1}}, your visit has moved to {{2}}. If the new time doesn't suit you, just reply to this message.", vars: ["first_name", "booking_datetime"] },
  { name: "visit_cancelled", category: "UTILITY", language: "en_GB", status: "PENDING", body: "Hi {{1}}, your visit on {{2}} has been cancelled. Reply here and we'll find a new time that works for you.", vars: ["first_name", "booking_datetime"] },
  { name: "spring_service_offer", category: "MARKETING", language: "en_GB", status: "APPROVED", body: "Hi {{1}}, spring is here! Book your annual service before the end of the month and get 15% off. Use code {{2}} when you book.", vars: ["first_name", "promo_code"] },
  { name: "winback_discount", category: "MARKETING", language: "en_GB", status: "REJECTED", body: "Hey {{1}}, we miss you! {{2}}", vars: ["first_name", "promo_code"] },
];
const ago = (h: number) => new Date(Date.now() - h * 3600e3).toISOString();
const seedConversations: WaConversation[] = [
  { id: "wcv-1", contactId: "c1", name: "Sarah Whitcombe", phone: "+44 7700 900201", jobId: "j1", unread: 1, messages: [
    { id: "m1", dir: "out", text: "Hi Sarah, your site survey is booked for Tue 28 Oct, 09:00 at 14 Clifton Rd. Tom will be with you.", at: ago(26), template: "survey_booked" },
    { id: "m2", dir: "in", text: "Great thanks! Is there parking on site?", at: ago(2) }] },
  { id: "wcv-2", contactId: "c2", name: "James Okafor", phone: "+44 7700 900202", unread: 0, messages: [
    { id: "m3", dir: "out", text: "Hi James, a quick reminder that we're with you tomorrow, Thu 30 Oct, 13:00.", at: ago(30), template: "visit_reminder" },
    { id: "m4", dir: "in", text: "Can we move it to the afternoon?", at: ago(29) },
    { id: "m5", dir: "out", text: "No problem, moved to 15:00.", at: ago(28) }] },
  { id: "wcv-3", contactId: "c3", name: "Priya Shah", phone: "+44 7700 900203", unread: 2, messages: [
    { id: "m6", dir: "out", text: "Hi Priya, spring is here! Book your annual service before the end of the month and get 15% off.", at: ago(8), template: "spring_service_offer" },
    { id: "m7", dir: "in", text: "Yes please, how do I book?", at: ago(1) },
    { id: "m8", dir: "in", text: "Weekends ok?", at: ago(0.5) }] },
];
const seedCampaigns: WaCampaign[] = [
  { id: "wac-1", name: "Spring service push", template: "spring_service_offer", segment: "Past customers", status: "Sent", recipients: 186, skipped: 41, delivered: 179, failed: 7, read: 132 },
  { id: "wac-2", name: "Autumn gutter clean", template: "spring_service_offer", segment: "Residential", status: "Scheduled", scheduledFor: "2026-11-02T09:00", recipients: 240, skipped: 58, delivered: 0, failed: 0, read: 0 },
];
export const segments = [{ name: "All contacts", size: 312 }, { name: "Past customers", size: 227 }, { name: "Residential", size: 298 }, { name: "Commercial", size: 14 }];
export const MARKETING_COST = 0.0498; // mock € per marketing message

function load<T>(key: string, seed: T): T { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : seed; } catch { return seed; } }
function store(key: string, v: unknown) { localStorage.setItem(key, JSON.stringify(v)); window.dispatchEvent(new Event("whatsapp-changed")); }
const K = { conv: "wa.conversations.v1", t: "wa.templates.v2", c: "wa.campaigns.v1", consent: "wa.consent.v1", m: "wa.messages.v1" };

export const getTemplates = (): WaTemplate[] => load(K.t, load("wa.templates.v1", seedTemplates)).map((t: WaTemplate) => ({ header: { type: "none" }, footer: "", buttons: [], ...t }));
export const saveTemplates = (t: WaTemplate[]) => store(K.t, t);
export const getCampaigns = () => load(K.c, seedCampaigns);
export const saveCampaigns = (c: WaCampaign[]) => store(K.c, c);
export const getConsents = () => load<Record<string, WaConsent>>(K.consent, { c1: "all", c2: "utility", c3: "all" });
export const setConsent = (id: string, v: WaConsent) => store(K.consent, { ...getConsents(), [id]: v });
export const getConversations = () => load<WaConversation[]>(K.conv, seedConversations);
export const saveConversations = (c: WaConversation[]) => store(K.conv, c);
export function sendReply(convId: string, text: string) {
  saveConversations(getConversations().map((c) => c.id === convId ? { ...c, unread: 0, messages: [...c.messages, { id: `m-${Date.now()}`, dir: "out" as const, text, at: new Date().toISOString() }] } : c));
}
export const markRead = (convId: string) => saveConversations(getConversations().map((c) => c.id === convId ? { ...c, unread: 0 } : c));
export const getMessages = () => load<WaMessage[]>(K.m, []);
export const logMessage = (m: Omit<WaMessage, "id" | "at">) => store(K.m, [{ ...m, id: `wam-${Date.now()}`, at: new Date().toISOString() }, ...getMessages()]);

export function useWhatsApp() {
  const read = () => ({ conversations: getConversations(), templates: getTemplates(), campaigns: getCampaigns(), consents: getConsents(), messages: getMessages() });
  const [s, set] = useState(read);
  useEffect(() => { const f = () => set(read()); window.addEventListener("whatsapp-changed", f); return () => window.removeEventListener("whatsapp-changed", f); }, []);
  return s;
}

/** Digits-only E.164; UK/SE local numbers get the business country code. */
export function toE164(phone: string, country: "GB" | "SE" = "GB"): string | null {
  const raw = phone.replace(/[^\d+]/g, "");
  let d = raw.startsWith("+") ? raw.slice(1) : raw.startsWith("00") ? raw.slice(2) : raw.startsWith("0") ? (country === "SE" ? "46" : "44") + raw.slice(1) : raw;
  d = d.replace(/\D/g, "");
  return d.length >= 10 && d.length <= 15 ? d : null;
}
export const isMobile = (e164: string) => /^447\d{9}$/.test(e164) || /^467\d{8}$/.test(e164) || !/^(44|46)/.test(e164);

/** Whether a contact may get this kind of message; reason explains a skip. */
export function canSend(consent: WaConsent | undefined, phone: string, category: TemplateCategory): { ok: boolean; reason?: string } {
  const n = toE164(phone);
  if (!n || !isMobile(n)) return { ok: false, reason: "No mobile number" };
  if (consent === "opted_out") return { ok: false, reason: "Opted out of WhatsApp" };
  if (category === "MARKETING" && consent !== "all") return { ok: false, reason: "No WhatsApp marketing consent" };
  if (category === "UTILITY" && (!consent || consent === "not_set")) return { ok: false, reason: "No WhatsApp consent" };
  return { ok: true };
}
export const placeholderCount = (body: string) => new Set(Array.from(body.matchAll(/\{\{(\d+)\}\}/g), (m) => m[1])).size;
export const fillTemplate = (body: string, values: string[]) => body.replace(/\{\{(\d+)\}\}/g, (_, i) => values[Number(i) - 1] || `{{${i}}}`);

/** Free-form replies are allowed for 24h after the customer's last message. */
export function replyWindow(messages: WaChatMessage[], now = Date.now()): { open: boolean; until?: Date } {
  const lastIn = [...messages].reverse().find((m) => m.dir === "in");
  if (!lastIn) return { open: false };
  const until = new Date(new Date(lastIn.at).getTime() + 24 * 3600e3);
  return { open: until.getTime() > now, until };
}

/** Meta's main template rules, checked live in the editor. */
export function validateTemplate(t: Pick<WaTemplate, "name" | "body" | "buttons" | "footer" | "header">): string[] {
  const e: string[] = [];
  if (!/^[a-z0-9_]+$/.test(t.name)) e.push("Name can only use lowercase letters, numbers and _");
  if (!t.body.trim()) e.push("Body is empty");
  if (t.body.length > 1024) e.push("Body is over 1024 characters");
  if (/^\s*\{\{\d+\}\}/.test(t.body) || /\{\{\d+\}\}[\s.!?]*$/.test(t.body)) e.push("Body can't start or end with a variable");
  if (/\{\{\d+\}\}\s*\{\{\d+\}\}/.test(t.body)) e.push("Variables can't sit next to each other");
  const nums = [...new Set(Array.from(t.body.matchAll(/\{\{(\d+)\}\}/g), (m) => Number(m[1])))].sort((a, b) => a - b);
  if (nums.some((n, i) => n !== i + 1)) e.push("Variables must be numbered {{1}}, {{2}}… without gaps");
  if (t.body.trim() && placeholderCount(t.body) > 0 && t.body.replace(/\{\{\d+\}\}/g, "").trim().split(/\s+/).length < placeholderCount(t.body) * 3) e.push("Message is too short for the number of variables");
  if ((t.footer ?? "").length > 60) e.push("Footer is over 60 characters");
  if (t.header?.type === "text" && (t.header.text ?? "").length > 60) e.push("Header text is over 60 characters");
  const b = t.buttons ?? [];
  if (b.length > 3) e.push("Up to 3 buttons");
  if (b.filter((x) => x.type === "url").length > 2) e.push("Up to 2 link buttons");
  if (b.filter((x) => x.type === "call").length > 1) e.push("Only 1 call button");
  if (b.some((x) => !x.text.trim() || x.text.length > 25)) e.push("Button text must be 1–25 characters");
  return e;
}

/** Splits an audience into receivers and skips with reasons. */
export function audienceSplit(people: { id: string; phone: string }[], consents: Record<string, WaConsent>, category: TemplateCategory) {
  const reasons: Record<string, number> = {}; let ok = 0;
  for (const p of people) { const r = canSend(consents[p.id], p.phone, category); if (r.ok) ok++; else if (r.reason) reasons[r.reason] = (reasons[r.reason] ?? 0) + 1; }
  return { receive: ok, skipped: people.length - ok, reasons };
}
