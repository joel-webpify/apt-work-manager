import { Plus } from "lucide-react";

/**
 * One-tap wording above a text box. Tapping a chip appends the phrase —
 * the worker can still type anything they like.
 */
export default function QuickChips({
  options,
  onPick,
  disabled,
}: {
  options: string[];
  onPick: (text: string) => void;
  disabled?: boolean;
}) {
  if (options.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mb-2">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          disabled={disabled}
          onClick={() => onPick(o)}
          className="h-8 px-2.5 rounded-full border-hairline bg-surface hover:bg-surface-hover text-xs inline-flex items-center gap-1 disabled:opacity-40"
        >
          <Plus className="w-3 h-3 text-muted-foreground" />
          {o}
        </button>
      ))}
    </div>
  );
}

/** Append a phrase to existing text as its own line, without duplicating it. */
export function appendLine(current: string, addition: string) {
  const lines = current
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.some((l) => l.toLowerCase() === addition.toLowerCase())) return current;
  return [...lines, addition].join("\n");
}
