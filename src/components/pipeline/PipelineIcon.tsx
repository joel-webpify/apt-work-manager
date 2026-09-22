import {
  Handshake,
  Wrench,
  Truck,
  CalendarDays,
  ClipboardList,
  Hammer,
  Phone,
  Star,
  type LucideIcon,
} from "lucide-react";

/** Board icons, keyed by the string stored against each board. */
export const PIPELINE_ICON_MAP: Record<string, LucideIcon> = {
  handshake: Handshake,
  wrench: Wrench,
  truck: Truck,
  calendar: CalendarDays,
  clipboard: ClipboardList,
  hammer: Hammer,
  phone: Phone,
  star: Star,
};

export function pipelineIconFor(key?: string): LucideIcon {
  return PIPELINE_ICON_MAP[key ?? ""] ?? ClipboardList;
}

export default function PipelineIcon({ icon, className }: { icon?: string; className?: string }) {
  const Icon = pipelineIconFor(icon);
  return <Icon className={className ?? "w-3.5 h-3.5"} />;
}
