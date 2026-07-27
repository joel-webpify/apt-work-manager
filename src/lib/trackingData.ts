// Mock analytics/tracking data for the Tracking module.
// Deterministic pseudo-random so the UI is stable between renders.

export type EventCategory = "page" | "form" | "engagement" | "commerce" | "custom";

export interface TrackedEvent {
  id: string;
  event: string;
  category: EventCategory;
  page: string;
  source: string;
  medium: string;
  campaign?: string;
  device: "desktop" | "mobile" | "tablet";
  browser: string;
  os: string;
  country: string;
  city: string;
  visitorId: string;
  isNew: boolean;
  value?: number;
  minutesAgo: number;
}

export interface EventDefinition {
  name: string;
  category: EventCategory;
  description: string;
  enabled: boolean;
  count7d: number;
  conversion?: boolean;
}

const rnd = (seed: number) => {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
};

const pages = [
  "/",
  "/quote/window-cleaning",
  "/quote/artificial-grass",
  "/quote/plumbing",
  "/services/gutter-clearing",
  "/pricing",
  "/about",
  "/blog/how-often-clean-windows",
  "/contact",
];

const sources: { source: string; medium: string; campaign?: string }[] = [
  { source: "google", medium: "cpc", campaign: "brand-uk" },
  { source: "google", medium: "organic" },
  { source: "google", medium: "lsa", campaign: "local-services" },
  { source: "facebook", medium: "social", campaign: "spring-offer" },
  { source: "instagram", medium: "social", campaign: "spring-offer" },
  { source: "direct", medium: "none" },
  { source: "bing", medium: "organic" },
  { source: "newsletter", medium: "email", campaign: "may-digest" },
  { source: "gbp", medium: "referral" },
];

const eventPool: { event: string; category: EventCategory; weight: number; value?: number }[] = [
  { event: "page_view", category: "page", weight: 30 },
  { event: "scroll_50", category: "engagement", weight: 12 },
  { event: "scroll_90", category: "engagement", weight: 7 },
  { event: "form_view", category: "form", weight: 9 },
  { event: "form_start", category: "form", weight: 7 },
  { event: "field_complete", category: "form", weight: 6 },
  { event: "form_abandon", category: "form", weight: 3 },
  { event: "form_submit", category: "form", weight: 4, value: 180 },
  { event: "phone_click", category: "engagement", weight: 4, value: 140 },
  { event: "email_click", category: "engagement", weight: 3, value: 90 },
  { event: "whatsapp_click", category: "engagement", weight: 2, value: 120 },
  { event: "quote_viewed", category: "commerce", weight: 3 },
  { event: "quote_accepted", category: "commerce", weight: 1, value: 640 },
  { event: "booking_started", category: "commerce", weight: 2 },
  { event: "video_play", category: "engagement", weight: 2 },
  { event: "outbound_click", category: "custom", weight: 2 },
  { event: "rage_click", category: "custom", weight: 1 },
];

const devices: TrackedEvent["device"][] = ["mobile", "mobile", "desktop", "desktop", "tablet"];
const browsers = ["Chrome", "Safari", "Edge", "Firefox", "Samsung Internet"];
const oses = ["iOS", "Android", "Windows", "macOS"];
const places: [string, string][] = [
  ["United Kingdom", "London"],
  ["United Kingdom", "Manchester"],
  ["United Kingdom", "Bristol"],
  ["Ireland", "Dublin"],
  ["United Kingdom", "Leeds"],
  ["United Kingdom", "Glasgow"],
];

function weightedPick<T extends { weight: number }>(items: T[], r: number): T {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let acc = r * total;
  for (const i of items) {
    acc -= i.weight;
    if (acc <= 0) return i;
  }
  return items[items.length - 1];
}

export const liveEvents: TrackedEvent[] = (() => {
  const r = rnd(4207);
  const out: TrackedEvent[] = [];
  let minutes = 0;
  for (let i = 0; i < 60; i++) {
    const def = weightedPick(eventPool, r());
    const src = sources[Math.floor(r() * sources.length)];
    const place = places[Math.floor(r() * places.length)];
    minutes += Math.floor(r() * 7);
    out.push({
      id: `ev${i}`,
      event: def.event,
      category: def.category,
      page: pages[Math.floor(r() * pages.length)],
      source: src.source,
      medium: src.medium,
      campaign: src.campaign,
      device: devices[Math.floor(r() * devices.length)],
      browser: browsers[Math.floor(r() * browsers.length)],
      os: oses[Math.floor(r() * oses.length)],
      country: place[0],
      city: place[1],
      visitorId: `v_${(1000 + Math.floor(r() * 400)).toString(36)}`,
      isNew: r() > 0.55,
      value: def.value ? Math.round(def.value * (0.6 + r() * 0.9)) : undefined,
      minutesAgo: minutes,
    });
  }
  return out;
})();

const eventDescriptions: Record<string, string> = {
  page_view: "Any page load on the tracked domain",
  scroll_50: "Visitor scrolled halfway down the page",
  scroll_90: "Visitor reached the bottom of the page",
  form_view: "A tracked form entered the viewport",
  form_start: "First field interaction on a form",
  field_complete: "A field was filled and blurred",
  form_abandon: "Form started but never submitted",
  form_submit: "Successful submission — creates a lead",
  phone_click: "Click on a tel: link or call button",
  email_click: "Click on a mailto: link",
  whatsapp_click: "Click on a WhatsApp chat link",
  quote_viewed: "Customer opened a sent quote",
  quote_accepted: "Customer accepted a quote online",
  booking_started: "Booking/calendar flow opened",
  video_play: "Embedded video started playing",
  outbound_click: "Click to an external domain",
  rage_click: "Repeated rapid clicks — UX friction signal",
};

export const eventCatalog: EventDefinition[] = eventPool.map((e) => {
  const count = Math.round(e.weight * (60 + (e.weight % 7) * 11));
  return {
    name: e.event,
    category: e.category,
    description: eventDescriptions[e.event] ?? "Custom tracked interaction",
    enabled: e.event !== "rage_click",
    count7d: count,
    conversion: ["form_submit", "phone_click", "quote_accepted", "whatsapp_click"].includes(e.event),
  };
});

export const trafficByDay = (() => {
  const r = rnd(991);
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return Array.from({ length: 14 }, (_, i) => {
    const sessions = Math.round(120 + r() * 180);
    return {
      label: days[i % 7],
      dayIndex: i,
      sessions,
      visitors: Math.round(sessions * (0.72 + r() * 0.16)),
      conversions: Math.round(sessions * (0.02 + r() * 0.05)),
    };
  });
})();

export const topPages = [
  { page: "/quote/window-cleaning", views: 1842, avgTime: "2m 14s", bounce: 28, conversions: 96 },
  { page: "/", views: 1610, avgTime: "0m 51s", bounce: 46, conversions: 34 },
  { page: "/quote/artificial-grass", views: 984, avgTime: "2m 02s", bounce: 31, conversions: 51 },
  { page: "/services/gutter-clearing", views: 742, avgTime: "1m 38s", bounce: 39, conversions: 22 },
  { page: "/pricing", views: 618, avgTime: "1m 12s", bounce: 42, conversions: 18 },
  { page: "/blog/how-often-clean-windows", views: 511, avgTime: "3m 26s", bounce: 61, conversions: 7 },
];

export const channelBreakdown = [
  { channel: "Google Ads", sessions: 1420, conversions: 118, revenue: 21400 },
  { channel: "Organic search", sessions: 1180, conversions: 74, revenue: 13850 },
  { channel: "Google Business", sessions: 640, conversions: 61, revenue: 11200 },
  { channel: "Paid social", sessions: 520, conversions: 27, revenue: 4900 },
  { channel: "Direct", sessions: 470, conversions: 31, revenue: 6100 },
  { channel: "Email", sessions: 260, conversions: 22, revenue: 3800 },
];

export const deviceSplit = [
  { device: "Mobile", share: 61, sessions: 2760 },
  { device: "Desktop", share: 32, sessions: 1448 },
  { device: "Tablet", share: 7, sessions: 317 },
];

export const geoSplit = [
  { place: "London", sessions: 1240, conversions: 88 },
  { place: "Manchester", sessions: 720, conversions: 46 },
  { place: "Bristol", sessions: 505, conversions: 33 },
  { place: "Leeds", sessions: 410, conversions: 24 },
  { place: "Glasgow", sessions: 318, conversions: 15 },
];

export const funnelSteps = [
  { step: "Page view", count: 4525 },
  { step: "Form view", count: 2140 },
  { step: "Form start", count: 1180 },
  { step: "Form submit", count: 412 },
  { step: "Quote accepted", count: 168 },
];

export function formatAgo(minutes: number) {
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m ago`;
  const h = Math.floor(minutes / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
