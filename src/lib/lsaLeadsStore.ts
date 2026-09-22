import { useEffect, useState } from "react";

/** A lead that came in from Google Local Services Ads and is waiting to be sorted. */
export type LsaLead = {
  id: string;
  name: string;
  email: string;
  phone: string;
  service: string;
  postcode: string;
  /** Plain-English time, e.g. "13h ago" */
  received: string;
  campaign: string;
  note?: string;
};

const KEY = "lsa.leads.v1";
const DISMISS_KEY = "lsa.leads.dismissed.v1";

type Listener = () => void;
const listeners = new Set<Listener>();

const SEED: LsaLead[] = [
  { id: "lsa1", name: "Ann Luff", email: "ann.luff55@gmail.com", phone: "07700 900411", service: "Fencing repair", postcode: "BS7 8QP", received: "13h ago", campaign: "Bristol plumbing — LSA", note: "Back garden panels blown down." },
  { id: "lsa2", name: "Joyce Moore", email: "joycetm@uwclub.net", phone: "07700 900122", service: "Boiler service", postcode: "BS5 0AA", received: "23h ago", campaign: "Bristol plumbing — LSA" },
  { id: "lsa3", name: "Gareth Pope", email: "g.pope@outlook.com", phone: "07700 900733", service: "Leaking radiator", postcode: "BS16 1TR", received: "1d ago", campaign: "Bristol plumbing — LSA", note: "Asked for a morning visit." },
  { id: "lsa4", name: "Nadia Rahman", email: "nadia.rahman@gmail.com", phone: "07700 900288", service: "Bathroom install quote", postcode: "BS3 4HU", received: "2d ago", campaign: "Bristol plumbing — LSA" },
  { id: "lsa5", name: "Tom Ellery", email: "tomellery@yahoo.co.uk", phone: "07700 900955", service: "Outside tap fitting", postcode: "BS9 2AA", received: "2d ago", campaign: "Bristol plumbing — LSA" },
];

function read(): LsaLead[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return SEED;
    return JSON.parse(raw);
  } catch {
    return SEED;
  }
}

function write(list: LsaLead[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
  listeners.forEach((l) => l());
}

export function removeLsaLead(id: string) {
  write(read().filter((l) => l.id !== id));
}

export function useLsaLeads(): LsaLead[] {
  const [list, setList] = useState<LsaLead[]>(read);
  useEffect(() => {
    const l = () => setList(read());
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return list;
}

export function isLsaBannerDismissed(): boolean {
  return localStorage.getItem(DISMISS_KEY) === "1";
}

export function dismissLsaBanner() {
  localStorage.setItem(DISMISS_KEY, "1");
  listeners.forEach((l) => l());
}
