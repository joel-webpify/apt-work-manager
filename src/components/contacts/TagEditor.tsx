import { useState } from "react";
import { X, Plus } from "lucide-react";
import { addContactTag, removeContactTag } from "@/lib/contactsStore";

export function TagEditor({ contactId, tags }: { contactId: string; tags: string[] }) {
  const [adding, setAdding] = useState(false);
  const [val, setVal] = useState("");

  function commit() {
    if (val.trim()) addContactTag(contactId, val);
    setVal("");
    setAdding(false);
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {tags.map((t) => (
        <span
          key={t}
          className="inline-flex items-center gap-1 h-6 pl-2 pr-1 rounded-full bg-primary/10 text-primary text-xs font-medium"
        >
          {t}
          <button
            onClick={() => removeContactTag(contactId, t)}
            className="w-4 h-4 rounded-full hover:bg-primary/20 flex items-center justify-center"
            aria-label={`Remove ${t}`}
          >
            <X className="w-2.5 h-2.5" />
          </button>
        </span>
      ))}
      {adding ? (
        <input
          autoFocus
          value={val}
          maxLength={32}
          onChange={(e) => setVal(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") {
              setVal("");
              setAdding(false);
            }
          }}
          placeholder="Tag…"
          className="h-6 px-2 rounded-full border-hairline bg-background text-xs w-24 focus:outline-none focus:border-primary/40"
        />
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="inline-flex items-center gap-1 h-6 px-2 rounded-full border-hairline border-dashed text-xs text-muted-foreground hover:text-foreground hover:border-primary/40"
        >
          <Plus className="w-3 h-3" /> Add tag
        </button>
      )}
    </div>
  );
}
