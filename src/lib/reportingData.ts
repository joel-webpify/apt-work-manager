// Shared reporting dataset + helpers.
// One place where every report tab gets its numbers from, so the whole
// Reports section tells a consistent story for the selected date range.

export type DateRange = "30d" | "90d" | "ytd" | "12m";

export const RANGES: DateRange[] = ["30d", "90d", "ytd", "12m"];

export const rangeLabels: Record<DateRange, string> = {
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  ytd: "Year to date",
  "12m": "Last 12 months",
};

export const rangeShort: Record<DateRange, string> = {
  "30d": "30d",
  "90d": "90d",
  ytd: "YTD",
  "12m": "12m",
};

export const rangeDays: Record<DateRange, number> = {
  "30d": 30,
  "90d": 90,
  ytd: 208,
  "12m": 365,
};

/** How much a 30-day baseline is multiplied by for the selected range. */
export function rangeFactor(range: DateRange) {
  return rangeDays[range] / 30;
}

export type ChannelId =
  | "google-ads"
  | "google-lsa"
  | "social-ads"
  | "social-posts"
  | "google-business"
  | "email"
  | "organic"
  | "direct";

export interface ChannelBase {
  id: ChannelId;
  name: string;
  group: "Paid" | "Free";
  /** 30-day baseline figures. */
  spend: number;
  leads: number;
  jobs: number;
  revenue: number;
  visits: number;
  /** growth vs previous period, as a share (0.12 = +12%) */
  growth: number;
}

const baseChannels: ChannelBase[] = [
  { id: "google-ads", name: "Google Ads", group: "Paid", spend: 2880, leads: 51, jobs: 21, revenue: 12400, visits: 1420, growth: 0.08 },
  { id: "google-lsa", name: "Local Service Ads", group: "Paid", spend: 940, leads: 24, jobs: 13, revenue: 7300, visits: 380, growth: 0.19 },
  { id: "social-ads", name: "Social ads", group: "Paid", spend: 1240, leads: 23, jobs: 7, revenue: 3900, visits: 860, growth: -0.06 },
  { id: "social-posts", name: "Social posts", group: "Free", spend: 0, leads: 11, jobs: 4, revenue: 1850, visits: 640, growth: 0.14 },
  { id: "google-business", name: "Google Business", group: "Free", spend: 0, leads: 34, jobs: 19, revenue: 11200, visits: 720, growth: 0.22 },
  { id: "email", name: "Email", group: "Free", spend: 120, leads: 18, jobs: 9, revenue: 3800, visits: 410, growth: 0.05 },
  { id: "organic", name: "Organic search", group: "Free", spend: 0, leads: 27, jobs: 12, revenue: 8600, visits: 1180, growth: 0.03 },
  { id: "direct", name: "Direct & referral", group: "Free", spend: 0, leads: 15, jobs: 8, revenue: 5400, visits: 470, growth: -0.02 },
];

export interface ChannelMetrics extends ChannelBase {
  cpl: number;
  roas: number;
  convRate: number;
}

export function channelMetrics(range: DateRange): ChannelMetrics[] {
  const f = rangeFactor(range);
  return baseChannels.map((c) => {
    const spend = Math.round(c.spend * f);
    const leads = Math.round(c.leads * f);
    const jobs = Math.round(c.jobs * f);
    const revenue = Math.round(c.revenue * f);
    const visits = Math.round(c.visits * f);
    return {
      ...c,
      spend,
      leads,
      jobs,
      revenue,
      visits,
      cpl: leads ? spend / leads : 0,
      roas: spend ? revenue / spend : 0,
      convRate: leads ? (jobs / leads) * 100 : 0,
    };
  });
}

export interface ReportTotals {
  spend: number;
  leads: number;
  jobs: number;
  revenue: number;
  visits: number;
  cpl: number;
  roas: number;
}

export function reportTotals(range: DateRange): ReportTotals {
  const list = channelMetrics(range);
  const spend = list.reduce((a, c) => a + c.spend, 0);
  const leads = list.reduce((a, c) => a + c.leads, 0);
  const jobs = list.reduce((a, c) => a + c.jobs, 0);
  const revenue = list.reduce((a, c) => a + c.revenue, 0);
  const visits = list.reduce((a, c) => a + c.visits, 0);
  return { spend, leads, jobs, revenue, visits, cpl: leads ? spend / leads : 0, roas: spend ? revenue / spend : 0 };
}

/** Deterministic pseudo-random helper for trend shapes. */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
}

export interface TrendPoint {
  label: string;
  leads: number;
  revenue: number;
  spend: number;
}

/** A trend series sized to the range: days for 30d, weeks/months beyond. */
export function trendSeries(range: DateRange): TrendPoint[] {
  const t = reportTotals(range);
  const buckets = range === "30d" ? 30 : range === "90d" ? 13 : range === "ytd" ? 7 : 12;
  const unit = range === "30d" ? "d" : range === "90d" ? "W" : "M";
  const r = seeded(8191 + buckets);
  const raw = Array.from({ length: buckets }, () => 0.65 + r() * 0.7);
  const sum = raw.reduce((a, b) => a + b, 0);
  return raw.map((w, i) => ({
    label: unit === "d" ? `${i + 1}` : `${unit}${i + 1}`,
    leads: Math.round((t.leads * w) / sum),
    revenue: Math.round((t.revenue * w) / sum),
    spend: Math.round((t.spend * w) / sum),
  }));
}

export const fmtGbp = (v: number) =>
  v >= 10000 ? `£${(v / 1000).toFixed(1)}k` : `£${Math.round(v).toLocaleString()}`;

export const fmtGbpExact = (v: number) => `£${Math.round(v).toLocaleString()}`;

export const fmtNum = (v: number) => Math.round(v).toLocaleString();

export const fmtPct = (v: number) => `${v > 0 ? "+" : ""}${Math.round(v * 100)}%`;

/* ---------------- channel-specific datasets ---------------- */

export interface SocialAdCampaign {
  id: string;
  name: string;
  platform: "Facebook" | "Instagram" | "TikTok" | "LinkedIn";
  status: "Live" | "Paused" | "Ended";
  spend: number;
  impressions: number;
  clicks: number;
  leads: number;
  revenue: number;
}

const socialAdsBase: SocialAdCampaign[] = [
  { id: "sa1", name: "Spring offer — retargeting", platform: "Facebook", status: "Live", spend: 460, impressions: 78400, clicks: 1420, leads: 11, revenue: 1980 },
  { id: "sa2", name: "Window cleaning — local reach", platform: "Instagram", status: "Live", spend: 380, impressions: 61200, clicks: 980, leads: 7, revenue: 1240 },
  { id: "sa3", name: "Artificial grass — video", platform: "TikTok", status: "Paused", spend: 240, impressions: 92600, clicks: 1610, leads: 3, revenue: 480 },
  { id: "sa4", name: "Commercial contracts", platform: "LinkedIn", status: "Live", spend: 160, impressions: 12800, clicks: 220, leads: 2, revenue: 200 },
];

export function socialAdCampaigns(range: DateRange): SocialAdCampaign[] {
  const f = rangeFactor(range);
  return socialAdsBase.map((c) => ({
    ...c,
    spend: Math.round(c.spend * f),
    impressions: Math.round(c.impressions * f),
    clicks: Math.round(c.clicks * f),
    leads: Math.round(c.leads * f),
    revenue: Math.round(c.revenue * f),
  }));
}

export interface OrganicPostStat {
  id: string;
  caption: string;
  platform: "Facebook" | "Instagram" | "LinkedIn" | "TikTok";
  postedAgo: string;
  reach: number;
  engagements: number;
  clicks: number;
}

export const organicPostStats: OrganicPostStat[] = [
  { id: "op1", caption: "Before & after: 3-bed semi in Clifton", platform: "Instagram", postedAgo: "2d ago", reach: 4120, engagements: 386, clicks: 74 },
  { id: "op2", caption: "Why gutters matter before autumn", platform: "Facebook", postedAgo: "5d ago", reach: 2860, engagements: 198, clicks: 51 },
  { id: "op3", caption: "Meet the team — Friday spotlight", platform: "Instagram", postedAgo: "8d ago", reach: 2140, engagements: 244, clicks: 18 },
  { id: "op4", caption: "Artificial grass install timelapse", platform: "TikTok", postedAgo: "11d ago", reach: 9800, engagements: 612, clicks: 39 },
  { id: "op5", caption: "Commercial contract case study", platform: "LinkedIn", postedAgo: "14d ago", reach: 980, engagements: 87, clicks: 33 },
];

export interface GbpMetrics {
  profileViews: number;
  searchViews: number;
  mapViews: number;
  calls: number;
  directions: number;
  websiteClicks: number;
  messages: number;
  newReviews: number;
  avgRating: number;
  photoViews: number;
}

export function gbpMetrics(range: DateRange): GbpMetrics {
  const f = rangeFactor(range);
  return {
    profileViews: Math.round(1420 * f),
    searchViews: Math.round(980 * f),
    mapViews: Math.round(440 * f),
    calls: Math.round(86 * f),
    directions: Math.round(124 * f),
    websiteClicks: Math.round(212 * f),
    messages: Math.round(28 * f),
    newReviews: Math.round(11 * f),
    avgRating: 4.8,
    photoViews: Math.round(3100 * f),
  };
}

export const gbpSearchTerms = [
  { term: "window cleaner near me", views: 412, share: 26 },
  { term: "gutter cleaning bristol", views: 288, share: 18 },
  { term: "artificial grass installer", views: 214, share: 14 },
  { term: "your business name", views: 186, share: 12 },
  { term: "conservatory roof cleaning", views: 132, share: 8 },
];
