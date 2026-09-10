import { ClipboardList, Wrench } from "lucide-react";
import { visitTypeLabel, type VisitType } from "@/lib/visitTypes";

/** Tells the worker at a glance whether they're pricing a job up or doing it. */
export default function VisitBadge({ type, className = "" }: { type: VisitType; className?: string }) {
  const Icon = type === "survey" ? ClipboardList : Wrench;
  return (
    <span
      className={`h-6 px-2 rounded-full text-[11px] font-medium inline-flex items-center gap-1 ${
        type === "survey"
          ? "bg-[hsl(var(--warning)/0.14)] text-[hsl(var(--warning))]"
          : "bg-primary/10 text-primary"
      } ${className}`}
    >
      <Icon className="w-3 h-3" /> {visitTypeLabel[type]}
    </span>
  );
}
