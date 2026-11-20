import { MessageCircle, Mail, Facebook, Instagram, MessageSquareQuote, MessageSquare, Star, type LucideIcon } from "lucide-react";
import type { ChannelFilter, InboundChannel } from "@/lib/inboxMock";

/** Channel icons are deliberately monochrome: the icon shape tells channels apart, not colour. */
export const channelMeta: Record<InboundChannel, { label: string; icon: LucideIcon }> = {
  whatsapp: { label: "WhatsApp", icon: MessageCircle },
  email: { label: "Email", icon: Mail },
  facebook: { label: "Facebook DM", icon: Facebook },
  instagram: { label: "Instagram DM", icon: Instagram },
  comment: { label: "Comment", icon: MessageSquareQuote },
  review: { label: "Google review", icon: Star },
  sms: { label: "SMS", icon: MessageSquare },
};

export const filterMeta: Record<Exclude<ChannelFilter, "all">, { label: string; icon: LucideIcon }> = {
  whatsapp: { label: "WhatsApp", icon: MessageCircle },
  email: { label: "Email", icon: Mail },
  facebook: { label: "Facebook (DMs and comments)", icon: Facebook },
  instagram: { label: "Instagram (DMs and comments)", icon: Instagram },
  review: { label: "Google reviews", icon: Star },
};

/** Icon for a message: comments use their network's icon so Facebook/Instagram each have one icon. */
export function iconFor(channel: InboundChannel, network?: "facebook" | "instagram"): LucideIcon {
  const meta = channel === "comment" && network ? channelMeta[network] : channelMeta[channel];
  return meta?.icon ?? MessageSquare;
}

export function labelFor(channel: InboundChannel, network?: "facebook" | "instagram") {
  if (channel === "comment" && network) return `${network === "instagram" ? "Instagram" : "Facebook"} comment`;
  return channelMeta[channel]?.label ?? "Message";
}

export function ChannelIcon({ channel, network, size = "md" }: { channel: InboundChannel; network?: "facebook" | "instagram"; size?: "sm" | "md" }) {
  const Icon = iconFor(channel, network);
  const label = labelFor(channel, network);
  return <span title={label} aria-label={label} className="inline-flex shrink-0 items-center justify-center text-current"><Icon className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} /></span>;
}

export function Stars({ rating }: { rating: number }) {
  return <span className="inline-flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
    {[1, 2, 3, 4, 5].map((i) => <Star key={i} className={`h-3.5 w-3.5 ${i <= rating ? "fill-current" : "opacity-30"}`} />)}
  </span>;
}

export function relTime(iso: string, now: number) {
  const m = Math.round((now - new Date(iso).getTime()) / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  if (m < 60 * 24) return `${Math.floor(m / 60)}h`;
  return `${Math.floor(m / 1440)}d`;
}
