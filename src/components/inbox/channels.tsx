import { MessageCircle, Mail, FileText, Facebook, Phone, MessageSquare, type LucideIcon } from "lucide-react";
import type { InboundChannel } from "@/lib/inboxMock";

export const channelMeta: Record<InboundChannel, { label: string; icon: LucideIcon; cls: string }> = {
  whatsapp: { label: "WhatsApp", icon: MessageCircle, cls: "bg-success/15 text-success" },
  email: { label: "Email", icon: Mail, cls: "bg-primary/10 text-primary" },
  webform: { label: "Web form", icon: FileText, cls: "bg-accent text-accent-foreground" },
  facebook: { label: "Facebook", icon: Facebook, cls: "bg-primary/15 text-primary" },
  call: { label: "Call", icon: Phone, cls: "bg-warning/15 text-warning" },
  sms: { label: "SMS", icon: MessageSquare, cls: "bg-muted text-foreground" },
};

export function ChannelIcon({ channel, size = "md" }: { channel: InboundChannel; size?: "sm" | "md" }) {
  const m = channelMeta[channel];
  const Icon = m.icon;
  const box = size === "sm" ? "h-5 w-5" : "h-7 w-7";
  return <span title={m.label} aria-label={m.label} className={`inline-flex shrink-0 items-center justify-center rounded-full ${box} ${m.cls}`}><Icon className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} /></span>;
}

export function relTime(iso: string, now: number) {
  const m = Math.round((now - new Date(iso).getTime()) / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  if (m < 60 * 24) return `${Math.floor(m / 60)}h`;
  return `${Math.floor(m / 1440)}d`;
}
