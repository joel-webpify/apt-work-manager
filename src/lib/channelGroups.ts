import { useEffect, useState } from "react";

export interface ChannelGroup {
  id: string;
  name: string;
  color: string; // raw HSL values, e.g. "199 89% 48%"
  sources: string[]; // exact source labels assigned to this group
}

const KEY = "channel-groups-v1";

export const DEFAULT_CHANNEL_GROUPS: ChannelGroup[] = [
  { id: "cg-paid-search", name: "Paid Search", color: "199 89% 48%", sources: ["Google Ads", "Bing Ads", "LSA", "google / cpc", "google / lsa"] },
  { id: "cg-paid-social", name: "Paid Social", color: "330 81% 60%", sources: ["Facebook Ads", "Instagram Ads", "facebook / social"] },
  { id: "cg-organic", name: "Organic & Direct", color: "142 71% 45%", sources: ["Website form", "SEO", "Direct", "direct / none", "Google organic"] },
  { id: "cg-referral", name: "Referral", color: "38 92% 50%", sources: ["Referral", "Word of mouth", "Repeat customer"] },
];

function load(): ChannelGroup[] {
  if (typeof window === "undefined") return DEFAULT_CHANNEL_GROUPS;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ChannelGroup[]) : DEFAULT_CHANNEL_GROUPS;
  } catch {
    return DEFAULT_CHANNEL_GROUPS;
  }
}

export function useChannelGroups() {
  const [groups, setGroups] = useState<ChannelGroup[]>(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(groups));
    } catch {
      /* ignore */
    }
  }, [groups]);

  return [groups, setGroups] as const;
}

export function groupForSource(source: string, groups: ChannelGroup[]): ChannelGroup | undefined {
  const s = source.trim().toLowerCase();
  return groups.find((g) => g.sources.some((src) => src.trim().toLowerCase() === s));
}
