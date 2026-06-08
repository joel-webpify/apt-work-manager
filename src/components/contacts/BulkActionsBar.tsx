import { Tag, Download, Trash2, X } from "lucide-react";

export function BulkActionsBar({
  count,
  onClear,
  onTag,
  onExport,
  onDelete,
}: {
  count: number;
  onClear: () => void;
  onTag: () => void;
  onExport: () => void;
  onDelete: () => void;
}) {
  if (count === 0) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-fade-in">
      <div className="bg-foreground text-background shadow-xl rounded-xl px-4 py-2.5 flex items-center gap-2 text-sm">
        <button
          onClick={onClear}
          className="w-6 h-6 rounded-md hover:bg-background/10 flex items-center justify-center"
          aria-label="Clear selection"
        >
          <X className="w-3.5 h-3.5" />
        </button>
        <span className="font-medium pr-3 border-r border-background/20">
          {count} selected
        </span>
        <button
          onClick={onTag}
          className="px-2.5 h-8 rounded-md hover:bg-background/10 inline-flex items-center gap-1.5"
        >
          <Tag className="w-3.5 h-3.5" /> Tag
        </button>
        <button
          onClick={onExport}
          className="px-2.5 h-8 rounded-md hover:bg-background/10 inline-flex items-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5" /> Export
        </button>
        <button
          onClick={onDelete}
          className="px-2.5 h-8 rounded-md hover:bg-background/10 inline-flex items-center gap-1.5 text-[hsl(var(--destructive))]"
        >
          <Trash2 className="w-3.5 h-3.5" /> Delete
        </button>
      </div>
    </div>
  );
}
