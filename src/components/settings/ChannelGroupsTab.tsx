import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, X } from "lucide-react";
import { useChannelGroups, type ChannelGroup } from "@/lib/channelGroups";

const COLORS = [
  { label: "Blue", value: "199 89% 48%" },
  { label: "Indigo", value: "239 84% 67%" },
  { label: "Violet", value: "271 91% 65%" },
  { label: "Pink", value: "330 81% 60%" },
  { label: "Amber", value: "38 92% 50%" },
  { label: "Orange", value: "25 95% 53%" },
  { label: "Green", value: "142 71% 45%" },
  { label: "Teal", value: "173 80% 40%" },
  { label: "Slate", value: "215 16% 47%" },
];

export default function ChannelGroupsTab() {
  const [groups, setGroups] = useChannelGroups();
  const [newGroup, setNewGroup] = useState("");
  const [newGroupColor, setNewGroupColor] = useState(COLORS[0].value);
  const [sourceDraft, setSourceDraft] = useState<Record<string, string>>({});

  const updateGroup = (id: string, patch: Partial<ChannelGroup>) =>
    setGroups((prev) => prev.map((g) => (g.id === id ? { ...g, ...patch } : g)));
  const removeGroup = (id: string) => setGroups((prev) => prev.filter((g) => g.id !== id));

  const addSource = (groupId: string) => {
    const v = (sourceDraft[groupId] ?? "").trim();
    if (!v) return;
    setGroups((prev) =>
      prev.map((g) => (g.id === groupId && !g.sources.includes(v) ? { ...g, sources: [...g.sources, v] } : g)),
    );
    setSourceDraft((d) => ({ ...d, [groupId]: "" }));
  };

  const removeSource = (groupId: string, source: string) =>
    updateGroup(groupId, { sources: groups.find((g) => g.id === groupId)?.sources.filter((s) => s !== source) ?? [] });

  const addGroup = () => {
    if (!newGroup.trim()) return;
    setGroups((prev) => [
      ...prev,
      { id: `cg-${Date.now()}`, name: newGroup.trim(), color: newGroupColor, sources: [] },
    ]);
    setNewGroup("");
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="text-sm text-muted-foreground">
        Group lead sources into channels for cleaner reporting. Sources are matched case-insensitively against contacts'
        source field, UTM tags and form submissions.
      </div>

      <div className="space-y-3">
        {groups.map((g) => (
          <div key={g.id} className="border-hairline rounded-lg bg-card">
            <div className="flex items-center gap-2 px-3 h-11 border-b-hairline">
              <Select value={g.color} onValueChange={(v) => updateGroup(g.id, { color: v })}>
                <SelectTrigger className="h-7 w-7 p-0 border-hairline rounded-md">
                  <span className="w-3.5 h-3.5 rounded-full mx-auto" style={{ backgroundColor: `hsl(${g.color})` }} />
                </SelectTrigger>
                <SelectContent>
                  {COLORS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      <span className="inline-flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: `hsl(${c.value})` }} />
                        {c.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={g.name}
                onChange={(e) => updateGroup(g.id, { name: e.target.value })}
                className="h-8 flex-1 font-medium"
              />
              <span className="text-xs text-muted-foreground tabular-nums">{g.sources.length} sources</span>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-destructive"
                onClick={() => removeGroup(g.id)}
                title="Delete group"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
            <div className="p-3 space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {g.sources.length === 0 && (
                  <span className="text-xs text-muted-foreground italic">No sources assigned yet.</span>
                )}
                {g.sources.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1 h-6 px-2 rounded-full text-xs border-hairline bg-surface"
                  >
                    {s}
                    <button
                      onClick={() => removeSource(g.id, s)}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label={`Remove ${s}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={sourceDraft[g.id] ?? ""}
                  onChange={(e) => setSourceDraft((d) => ({ ...d, [g.id]: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && addSource(g.id)}
                  placeholder="Add a source (e.g. Google Ads, Referral, facebook / social)"
                  className="h-8 text-sm"
                />
                <Button size="sm" variant="outline" onClick={() => addSource(g.id)}>
                  <Plus className="w-3.5 h-3.5" /> Add
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="border-hairline rounded-lg p-3 flex items-center gap-2 bg-surface/40">
        <Select value={newGroupColor} onValueChange={setNewGroupColor}>
          <SelectTrigger className="h-8 w-8 p-0 border-hairline rounded-md">
            <span className="w-3.5 h-3.5 rounded-full mx-auto" style={{ backgroundColor: `hsl(${newGroupColor})` }} />
          </SelectTrigger>
          <SelectContent>
            {COLORS.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                <span className="inline-flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: `hsl(${c.value})` }} />
                  {c.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          value={newGroup}
          onChange={(e) => setNewGroup(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addGroup()}
          placeholder="New channel group name…"
          className="h-8 flex-1"
        />
        <Button size="sm" onClick={addGroup} disabled={!newGroup.trim()}>
          <Plus className="w-3.5 h-3.5" /> Add group
        </Button>
      </div>
    </div>
  );
}
