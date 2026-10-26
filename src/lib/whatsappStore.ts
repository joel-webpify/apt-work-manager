import { useEffect, useState } from "react";

// Mockup only: nothing here talks to Meta. Templates, consent and sends live in localStorage.
export type TemplateStatus = "APPROVED" | "PENDING" | "REJECTED";
export type TemplateCategory = "UTILITY" | "MARKETING";
export interface WaTemplate { name: string; category: TemplateCategory; language: string; status: TemplateStatus; body: string; vars: string[] }
export type WaConsent = "not_set" | "utility" | "all" | "opted_out";
export interface WaCampaign { id: string; name: string; template: string; segment: string; status: "Draft" | "Scheduled" | "Sent"; scheduledFor?: string; recipients: number; skipped: number; delivered: number; failed: number; read: number }
export interface WaMessage { id: string; contactId: string; template: string; at: string; status: "sent" | "delivered" | "read" | "failed" | "skipped"; reason?: string }

const seedTemplates: WaTemplate[] = [
  { name: "survey_booked", category: "UTILITY", language: "en_GB", status: "APPROVED", body: "Hi {{1}}, your site survey is booked for {{2}} at {{3}}. {{4}} will be with you — reply here if you need to change it.", vars: ["first_name", "booking_datetime", "job_address", "technician_name"] },
  { name: "visit_reminder", category: "UTILITY", language: "en_GB", status: "APPROVED", body: "Hi {{1}}, a quick reminder that we're with you tomorrow, {{2}}. Please make sure we can get access to the property.", vars: ["first_name", "booking_datetime"] },
  { name: "visit_moved", category: "UTILITY", language: "en_GB", status: "APPROVED", body: "Hi {{1}}, your visit has moved to {{2}}. If the new time doesn't suit you, just reply to this message.", vars: ["first_name", "booking_datetime"] },
  { name: "visit_cancelled", category: "UTILITY", language: "en_GB", status: "PENDING", body: "Hi {{1}}, your visit on {{2}} has been cancelled. Reply here and we'll find a new time that works for you.", vars: ["first_name", "booking_datetime"] },
  { name: "spring_service_offer", category: "MARKETING", language: "en_GB", status: "APPROVED", body: "Hi {{1}}, spring is here! Book your annual service before the end of the month and get 15% off. Use code {{2}} when you book.", vars: ["first_name", "promo_code"] },
  { name: "winback_discount", category: "MARKETING", language: "en_GB", status: "REJECTED", body: "Hey {{1}}, we miss you! {{2}}", vars: ["first_name", "promo_code"] },
];
const seedCampaigns: WaCampaign[] = [
  { id: "wac-1", name: "Spring service push", template: "spring_service_offer", segment: "Past customers", status: "Sent", recipients: 186, skipped: 41, delivered: 179, failed: 7, read: 132 },
  { id: "wac-2", name: "Autumn gutter clean", template: "spring_service_offer", segment: "Residential", status: "Scheduled", scheduledFor: "2026-11-02T09:00", recipients: 240, skipped: 58, delivered: 0, failed: 0, read: 0 },
];
export const segments = [{ name: "All contacts", size: 312 }, { name: "Past customers", size: 227 }, { name: "Residential", size: 298 }, { name: "Commercial", size: 14 }];
export const MARKETING_COST = 0.0498; // mock € per marketing message

function load<T>(key: string, seed: T): T { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : seed; } catch { return seed; } }
function store(key: string, v: unknown) { localStorage.setItem(key, JSON.stringify(v)); window.dispatchEvent(new Event("whatsapp-changed")); }
const K = { t: "wa.templates.v1", c: "wa.campaigns.v1", consent: "wa.consent.v1", m: "wa.messages.v1" };

export const getTemplates = () => load(K.t, seedTemplates);
export const saveTemplates = (t: WaTemplate[]) => store(K.t, t);
export const getCampaigns = () => load(K.c, seedCampaigns);
export const saveCampaigns = (c: WaCampaign[]) => store(K.c, c);
export const getConsents = () => load<Record<string, WaConsent>>(K.consent, { c1: "all", c2: "utility", c3: "all" });
export const setConsent = (id: string, v: WaConsent) => store(K.consent, { ...getConsents(), [id]: v });
export const getMessages = () => load<WaMessage[]>(K.m, []);
export const logMessage = (m: Omit<WaMessage, "id" | "at">) => store(K.m, [{ ...m, id: `wam-${Date.now()}`, at: new Date().toISOString() }, ...getMessages()]);

export function useWhatsApp() {
  const read = () => ({ templates: getTemplates(), campaigns: getCampaigns(), consents: getConsents(), messages: getMessages() });
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
