import { useEffect, useState } from "react";

export type PostKind = "organic" | "paid";
export type PostStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "scheduled"
  | "published"
  | "rejected";
export type SocialChannel = "facebook" | "instagram" | "linkedin" | "tiktok" | "x";

export interface SocialPost {
  id: string;
  kind: PostKind;
  channels: SocialChannel[];
  content: string;
  mediaUrl?: string;
  author: string;
  status: PostStatus;
  scheduledAt?: string; // ISO
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  approver?: string;
  rejectionNote?: string;
  // paid-only
  budget?: number;
  objective?: string;
  audience?: string;
  metrics?: { impressions: number; clicks: number; conversions: number };
}

const KEY = "social-posts-v1";

const now = new Date();
const iso = (d: Date) => d.toISOString();
const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
const at = (base: Date, h: number, m = 0) => {
  const x = new Date(base);
  x.setHours(h, m, 0, 0);
  return x;
};

const seed: SocialPost[] = [
  {
    id: "sp_1",
    kind: "organic",
    channels: ["instagram", "facebook"],
    content: "Behind the scenes on today's kitchen install — the tile work speaks for itself. 🔨",
    author: "Maya",
    status: "scheduled",
    scheduledAt: iso(at(addDays(now, 1), 9, 30)),
    createdAt: iso(addDays(now, -2)),
    updatedAt: iso(addDays(now, -1)),
  },
  {
    id: "sp_2",
    kind: "organic",
    channels: ["linkedin"],
    content: "We're hiring a project manager. DM us for the JD.",
    author: "Sam",
    status: "pending_approval",
    scheduledAt: iso(at(addDays(now, 2), 14)),
    createdAt: iso(addDays(now, -1)),
    updatedAt: iso(addDays(now, -1)),
  },
  {
    id: "sp_3",
    kind: "organic",
    channels: ["instagram"],
    content: "Draft: before / after carousel for the Willow Ave remodel.",
    author: "Maya",
    status: "draft",
    createdAt: iso(now),
    updatedAt: iso(now),
  },
  {
    id: "sp_4",
    kind: "organic",
    channels: ["facebook", "instagram"],
    content: "5-star review from the Petersons — thank you! 🌟",
    author: "Sam",
    status: "published",
    publishedAt: iso(addDays(now, -3)),
    createdAt: iso(addDays(now, -5)),
    updatedAt: iso(addDays(now, -3)),
    metrics: { impressions: 2430, clicks: 88, conversions: 4 },
  },
  {
    id: "sp_5",
    kind: "paid",
    channels: ["facebook", "instagram"],
    content: "Spring remodel promo — book a free consult, save 10%.",
    author: "Sam",
    status: "scheduled",
    scheduledAt: iso(at(addDays(now, 3), 8)),
    createdAt: iso(addDays(now, -1)),
    updatedAt: iso(addDays(now, -1)),
    budget: 500,
    objective: "Lead generation",
    audience: "Homeowners 30–60 · 25mi radius",
  },
  {
    id: "sp_6",
    kind: "paid",
    channels: ["linkedin"],
    content: "Commercial fit-out capabilities — download the capability deck.",
    author: "Maya",
    status: "pending_approval",
    scheduledAt: iso(at(addDays(now, 4), 10)),
    createdAt: iso(now),
    updatedAt: iso(now),
    budget: 800,
    objective: "Traffic",
    audience: "Facilities managers · US",
  },
  {
    id: "sp_7",
    kind: "paid",
    channels: ["facebook"],
    content: "Winter maintenance package — limited slots.",
    author: "Sam",
    status: "published",
    publishedAt: iso(addDays(now, -7)),
    createdAt: iso(addDays(now, -10)),
    updatedAt: iso(addDays(now, -7)),
    budget: 350,
    objective: "Conversions",
    audience: "Local homeowners",
    metrics: { impressions: 18420, clicks: 612, conversions: 23 },
  },
];

const listeners = new Set<() => void>();
let current: SocialPost[] = load();

function load(): SocialPost[] {
  if (typeof window === "undefined") return seed;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return seed;
    return JSON.parse(raw) as SocialPost[];
  } catch {
    return seed;
  }
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(current));
  } catch { /* ignore */ }
  listeners.forEach((l) => l());
}

export function getPosts() {
  return current;
}

export function useSocialPosts(kind?: PostKind) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const fn = () => setTick((t) => t + 1);
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, []);
  return kind ? current.filter((p) => p.kind === kind) : current;
}

export function upsertPost(post: SocialPost) {
  const idx = current.findIndex((p) => p.id === post.id);
  if (idx >= 0) current = current.map((p, i) => (i === idx ? post : p));
  else current = [post, ...current];
  persist();
}

export function deletePost(id: string) {
  current = current.filter((p) => p.id !== id);
  persist();
}

export function setStatus(id: string, status: PostStatus, extra?: Partial<SocialPost>) {
  current = current.map((p) =>
    p.id === id ? { ...p, ...extra, status, updatedAt: new Date().toISOString() } : p,
  );
  persist();
}

export function newDraft(kind: PostKind): SocialPost {
  const t = new Date().toISOString();
  return {
    id: `sp_${Math.random().toString(36).slice(2, 9)}`,
    kind,
    channels: kind === "paid" ? ["facebook"] : ["instagram"],
    content: "",
    author: "You",
    status: "draft",
    createdAt: t,
    updatedAt: t,
    ...(kind === "paid" ? { budget: 200, objective: "Traffic", audience: "" } : {}),
  };
}
