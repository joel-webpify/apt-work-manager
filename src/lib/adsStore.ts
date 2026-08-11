import { useEffect, useState } from "react";

/* ------------------------------------------------------------------ */
/* Types — mirrors the Meta Ads Manager hierarchy                      */
/* Campaign (objective + budget) → Ad set (audience) → Ad (creative)   */
/* ------------------------------------------------------------------ */

export type AdStatus = "draft" | "in_review" | "active" | "paused" | "completed" | "rejected";

export type AdObjective =
  | "leads"
  | "traffic"
  | "awareness"
  | "engagement"
  | "messages"
  | "sales";

export type AdPlatform = "facebook" | "instagram";

export type AdPlacement =
  | "fb_feed"
  | "ig_feed"
  | "ig_stories"
  | "ig_reels"
  | "fb_marketplace"
  | "audience_network";

export type CreativeFormat = "single_image" | "video" | "carousel";

export type CallToAction =
  | "Learn more"
  | "Book now"
  | "Get quote"
  | "Send message"
  | "Call now"
  | "Sign up"
  | "Shop now";

export interface Audience {
  locations: string[];
  radiusMiles: number;
  ageMin: number;
  ageMax: number;
  genders: "all" | "men" | "women";
  interests: string[];
  savedAudience?: string;
  estimatedReach: number;
}

export interface AdCreative {
  format: CreativeFormat;
  primaryText: string;
  headline: string;
  description: string;
  cta: CallToAction;
  destinationUrl: string;
  mediaUrls: string[];
}

export interface Ad {
  id: string;
  name: string;
  creative: AdCreative;
  status: AdStatus;
  metrics?: AdMetrics;
}

export interface AdSet {
  id: string;
  name: string;
  audience: Audience;
  placements: AdPlacement[];
  optimisationGoal: string;
  status: AdStatus;
  ads: Ad[];
}

export interface AdMetrics {
  spend: number;
  impressions: number;
  reach: number;
  clicks: number;
  results: number;
}

export interface Campaign {
  id: string;
  name: string;
  objective: AdObjective;
  platforms: AdPlatform[];
  budgetType: "daily" | "lifetime";
  budget: number;
  startDate: string; // ISO
  endDate?: string;
  status: AdStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  adSets: AdSet[];
}

/* ------------------------------------------------------------------ */
/* Labels                                                             */
/* ------------------------------------------------------------------ */

export const OBJECTIVES: {
  id: AdObjective;
  label: string;
  blurb: string;
  goal: string;
  resultLabel: string;
}[] = [
  { id: "leads", label: "Get leads", blurb: "Collect enquiries with a form or landing page.", goal: "Leads", resultLabel: "Leads" },
  { id: "messages", label: "Get messages", blurb: "Start chats in Messenger, Instagram or WhatsApp.", goal: "Conversations", resultLabel: "Conversations" },
  { id: "traffic", label: "Send people to your website", blurb: "Best when you want visits to a specific page.", goal: "Link clicks", resultLabel: "Visits" },
  { id: "sales", label: "Sell a service or product", blurb: "Optimise for bookings and purchases.", goal: "Purchases", resultLabel: "Sales" },
  { id: "engagement", label: "Get more engagement", blurb: "Likes, comments and post interaction.", goal: "Engagement", resultLabel: "Interactions" },
  { id: "awareness", label: "Get known locally", blurb: "Show your name to as many local people as possible.", goal: "Reach", resultLabel: "People reached" },
];

export const PLACEMENTS: { id: AdPlacement; label: string; platform: AdPlatform | "both" }[] = [
  { id: "fb_feed", label: "Facebook feed", platform: "facebook" },
  { id: "fb_marketplace", label: "Facebook Marketplace", platform: "facebook" },
  { id: "ig_feed", label: "Instagram feed", platform: "instagram" },
  { id: "ig_stories", label: "Instagram stories", platform: "instagram" },
  { id: "ig_reels", label: "Instagram reels", platform: "instagram" },
  { id: "audience_network", label: "Partner apps & sites", platform: "both" },
];

export const CTAS: CallToAction[] = [
  "Learn more",
  "Book now",
  "Get quote",
  "Send message",
  "Call now",
  "Sign up",
  "Shop now",
];

export const SAVED_AUDIENCES = [
  "Local homeowners 25 mi",
  "Past customers (lookalike 1%)",
  "Website visitors — last 30 days",
  "Quote requested, not booked",
];

export const INTEREST_SUGGESTIONS = [
  "Home improvement",
  "Kitchen renovation",
  "Bathroom remodelling",
  "Interior design",
  "Homeowners",
  "Newly moved",
  "Property investors",
  "Garden & outdoor",
];

export function objectiveMeta(id: AdObjective) {
  return OBJECTIVES.find((o) => o.id === id) ?? OBJECTIVES[0];
}

export const statusTone: Record<AdStatus, "neutral" | "success" | "warning" | "danger" | "info"> = {
  draft: "neutral",
  in_review: "warning",
  active: "success",
  paused: "info",
  completed: "neutral",
  rejected: "danger",
};

export const statusLabel: Record<AdStatus, string> = {
  draft: "Draft",
  in_review: "In review",
  active: "Active",
  paused: "Paused",
  completed: "Finished",
  rejected: "Rejected",
};

/* ------------------------------------------------------------------ */
/* Store                                                              */
/* ------------------------------------------------------------------ */

const KEY = "social-ad-campaigns-v1";
const uid = (p: string) => `${p}_${Math.random().toString(36).slice(2, 9)}`;
const iso = (d: Date) => d.toISOString();
const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

const today = new Date();

function baseAudience(over: Partial<Audience> = {}): Audience {
  return {
    locations: ["Manchester, UK"],
    radiusMiles: 25,
    ageMin: 30,
    ageMax: 65,
    genders: "all",
    interests: ["Home improvement"],
    estimatedReach: 92000,
    ...over,
  };
}

const seed: Campaign[] = [
  {
    id: "cmp_spring",
    name: "Spring kitchen promo",
    objective: "leads",
    platforms: ["facebook", "instagram"],
    budgetType: "daily",
    budget: 35,
    startDate: iso(addDays(today, -14)),
    endDate: iso(addDays(today, 16)),
    status: "active",
    createdBy: "Sam",
    createdAt: iso(addDays(today, -16)),
    updatedAt: iso(addDays(today, -2)),
    adSets: [
      {
        id: "as_spring_local",
        name: "Local homeowners 30–65",
        audience: baseAudience({ estimatedReach: 88000 }),
        placements: ["fb_feed", "ig_feed", "ig_stories"],
        optimisationGoal: "Leads",
        status: "active",
        ads: [
          {
            id: "ad_spring_1",
            name: "Before / after kitchen",
            status: "active",
            creative: {
              format: "single_image",
              primaryText:
                "Thinking about a new kitchen this year? We handle everything from design to the final tile — with a fixed price before we start.",
              headline: "Free kitchen design visit",
              description: "10% off installs booked in April",
              cta: "Book now",
              destinationUrl: "https://example.com/kitchens",
              mediaUrls: [],
            },
            metrics: { spend: 318.4, impressions: 42180, reach: 21340, clicks: 934, results: 41 },
          },
          {
            id: "ad_spring_2",
            name: "Customer review video",
            status: "active",
            creative: {
              format: "video",
              primaryText: "\"They finished a day early and the finish is spotless.\" — Helen, Didsbury",
              headline: "See what our customers say",
              description: "Rated 4.9 from 180+ reviews",
              cta: "Get quote",
              destinationUrl: "https://example.com/reviews",
              mediaUrls: [],
            },
            metrics: { spend: 186.2, impressions: 25900, reach: 15020, clicks: 512, results: 19 },
          },
        ],
      },
      {
        id: "as_spring_retarget",
        name: "Website visitors — last 30 days",
        audience: baseAudience({
          savedAudience: "Website visitors — last 30 days",
          ageMin: 25,
          ageMax: 70,
          estimatedReach: 14000,
          interests: [],
        }),
        placements: ["fb_feed", "ig_feed"],
        optimisationGoal: "Leads",
        status: "paused",
        ads: [
          {
            id: "ad_spring_3",
            name: "Still comparing quotes?",
            status: "paused",
            creative: {
              format: "single_image",
              primaryText: "Still comparing quotes? Ours is fixed, itemised and valid for 30 days.",
              headline: "Get your fixed quote",
              description: "No obligation",
              cta: "Get quote",
              destinationUrl: "https://example.com/quote",
              mediaUrls: [],
            },
            metrics: { spend: 74.9, impressions: 8100, reach: 5400, clicks: 288, results: 12 },
          },
        ],
      },
    ],
  },
  {
    id: "cmp_bathrooms",
    name: "Bathroom leads — always on",
    objective: "messages",
    platforms: ["instagram"],
    budgetType: "lifetime",
    budget: 900,
    startDate: iso(addDays(today, 2)),
    status: "in_review",
    createdBy: "Maya",
    createdAt: iso(addDays(today, -1)),
    updatedAt: iso(today),
    adSets: [
      {
        id: "as_bath_1",
        name: "Reels — 25 mi radius",
        audience: baseAudience({ ageMin: 28, ageMax: 55, interests: ["Bathroom remodelling"], estimatedReach: 61000 }),
        placements: ["ig_reels", "ig_stories"],
        optimisationGoal: "Conversations",
        status: "in_review",
        ads: [
          {
            id: "ad_bath_1",
            name: "48-hour bathroom refit",
            status: "in_review",
            creative: {
              format: "video",
              primaryText: "A full bathroom refit in 48 hours. Message us with your room size for a rough price.",
              headline: "Message us for a price",
              description: "",
              cta: "Send message",
              destinationUrl: "",
              mediaUrls: [],
            },
          },
        ],
      },
    ],
  },
  {
    id: "cmp_winter",
    name: "Winter maintenance package",
    objective: "traffic",
    platforms: ["facebook"],
    budgetType: "lifetime",
    budget: 350,
    startDate: iso(addDays(today, -70)),
    endDate: iso(addDays(today, -40)),
    status: "completed",
    createdBy: "Sam",
    createdAt: iso(addDays(today, -75)),
    updatedAt: iso(addDays(today, -40)),
    adSets: [
      {
        id: "as_winter_1",
        name: "All local homeowners",
        audience: baseAudience({ estimatedReach: 104000 }),
        placements: ["fb_feed", "fb_marketplace"],
        optimisationGoal: "Link clicks",
        status: "completed",
        ads: [
          {
            id: "ad_winter_1",
            name: "Limited slots",
            status: "completed",
            creative: {
              format: "single_image",
              primaryText: "Winter maintenance package — limited slots left before the cold snap.",
              headline: "£99 winter check",
              description: "Boiler, gutters, roof",
              cta: "Learn more",
              destinationUrl: "https://example.com/winter",
              mediaUrls: [],
            },
            metrics: { spend: 350, impressions: 61400, reach: 32100, clicks: 1840, results: 1840 },
          },
        ],
      },
    ],
  },
];

const listeners = new Set<() => void>();
let current: Campaign[] = load();

function load(): Campaign[] {
  if (typeof window === "undefined") return seed;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Campaign[]) : seed;
  } catch {
    return seed;
  }
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(current));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

export function useCampaigns() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const fn = () => setTick((t) => t + 1);
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);
  return current;
}

export function upsertCampaign(c: Campaign) {
  const idx = current.findIndex((x) => x.id === c.id);
  current = idx >= 0 ? current.map((x, i) => (i === idx ? c : x)) : [c, ...current];
  persist();
}

export function deleteCampaign(id: string) {
  current = current.filter((c) => c.id !== id);
  persist();
}

export function setCampaignStatus(id: string, status: AdStatus) {
  current = current.map((c) =>
    c.id === id
      ? {
          ...c,
          status,
          updatedAt: new Date().toISOString(),
          adSets: c.adSets.map((s) => ({
            ...s,
            status,
            ads: s.ads.map((a) => ({ ...a, status })),
          })),
        }
      : c,
  );
  persist();
}

export function setAdSetStatus(campaignId: string, adSetId: string, status: AdStatus) {
  current = current.map((c) =>
    c.id === campaignId
      ? {
          ...c,
          adSets: c.adSets.map((s) =>
            s.id === adSetId ? { ...s, status, ads: s.ads.map((a) => ({ ...a, status })) } : s,
          ),
        }
      : c,
  );
  persist();
}

export function setAdStatus(campaignId: string, adSetId: string, adId: string, status: AdStatus) {
  current = current.map((c) =>
    c.id === campaignId
      ? {
          ...c,
          adSets: c.adSets.map((s) =>
            s.id === adSetId ? { ...s, ads: s.ads.map((a) => (a.id === adId ? { ...a, status } : a)) } : s,
          ),
        }
      : c,
  );
  persist();
}

export function duplicateCampaign(id: string) {
  const src = current.find((c) => c.id === id);
  if (!src) return;
  const t = new Date().toISOString();
  const copy: Campaign = {
    ...structuredClone(src),
    id: uid("cmp"),
    name: `${src.name} (copy)`,
    status: "draft",
    createdAt: t,
    updatedAt: t,
    adSets: src.adSets.map((s) => ({
      ...structuredClone(s),
      id: uid("as"),
      status: "draft",
      ads: s.ads.map((a) => ({ ...structuredClone(a), id: uid("ad"), status: "draft", metrics: undefined })),
    })),
  };
  current = [copy, ...current];
  persist();
}

/* ------------------------------------------------------------------ */
/* Builders + derived helpers                                         */
/* ------------------------------------------------------------------ */

export function newCampaignDraft(): Campaign {
  const t = new Date().toISOString();
  return {
    id: uid("cmp"),
    name: "",
    objective: "leads",
    platforms: ["facebook", "instagram"],
    budgetType: "daily",
    budget: 25,
    startDate: t,
    status: "draft",
    createdBy: "You",
    createdAt: t,
    updatedAt: t,
    adSets: [
      {
        id: uid("as"),
        name: "Ad set 1",
        audience: baseAudience({ interests: [] }),
        placements: ["fb_feed", "ig_feed", "ig_stories"],
        optimisationGoal: "Leads",
        status: "draft",
        ads: [
          {
            id: uid("ad"),
            name: "Ad 1",
            status: "draft",
            creative: {
              format: "single_image",
              primaryText: "",
              headline: "",
              description: "",
              cta: "Learn more",
              destinationUrl: "",
              mediaUrls: [],
            },
          },
        ],
      },
    ],
  };
}

export function campaignMetrics(c: Campaign): AdMetrics {
  const zero: AdMetrics = { spend: 0, impressions: 0, reach: 0, clicks: 0, results: 0 };
  return c.adSets
    .flatMap((s) => s.ads)
    .reduce((acc, a) => {
      if (!a.metrics) return acc;
      return {
        spend: acc.spend + a.metrics.spend,
        impressions: acc.impressions + a.metrics.impressions,
        reach: acc.reach + a.metrics.reach,
        clicks: acc.clicks + a.metrics.clicks,
        results: acc.results + a.metrics.results,
      };
    }, zero);
}

export function adSetMetrics(s: AdSet): AdMetrics {
  const zero: AdMetrics = { spend: 0, impressions: 0, reach: 0, clicks: 0, results: 0 };
  return s.ads.reduce((acc, a) => {
    if (!a.metrics) return acc;
    return {
      spend: acc.spend + a.metrics.spend,
      impressions: acc.impressions + a.metrics.impressions,
      reach: acc.reach + a.metrics.reach,
      clicks: acc.clicks + a.metrics.clicks,
      results: acc.results + a.metrics.results,
    };
  }, zero);
}

/** Rough daily-reach estimate so the wizard feels alive, Meta-style. */
export function estimateReach(a: Audience, platforms: AdPlatform[], budget: number) {
  const ageSpan = Math.max(1, a.ageMax - a.ageMin);
  const base = a.savedAudience ? 18000 : 4200 * Math.sqrt(Math.max(1, a.radiusMiles));
  const genderFactor = a.genders === "all" ? 1 : 0.52;
  const interestFactor = a.interests.length ? Math.max(0.35, 1 - a.interests.length * 0.12) : 1;
  const platformFactor = 0.6 + platforms.length * 0.3;
  const pool = Math.round(base * (ageSpan / 40) * genderFactor * interestFactor * platformFactor);
  const dailyReach = Math.round(Math.min(pool * 0.18, budget * 240));
  return { pool, dailyLow: Math.round(dailyReach * 0.7), dailyHigh: Math.round(dailyReach * 1.3) };
}

export const fmtMoney = (n: number) =>
  `£${n.toLocaleString("en-GB", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;
export const fmtInt = (n: number) => n.toLocaleString("en-GB");
