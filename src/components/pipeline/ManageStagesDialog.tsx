import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowDown, ArrowUp, Plus, Trash2, RotateCcw } from "lucide-react";
import { useStages, STAGE_COLOR_PRESETS, colorToCss } from "@/lib/stagesStore";

export default function ManageStagesDialog({
  open,
  onOpenChange,
  onRename,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Notify parent so it can rewrite jobs whose stage was renamed. */
  onRename?: (oldName: string, newName: string) => void;
}) {
  const { stages, renameStage, setStageColor, addStage, removeStage, moveStage, resetToDefault } = useStages();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(STAGE_COLOR_PRESETS[0].value);

  useEffect(() => {
    if (open) setDrafts(Object.fromEntries(stages.map((s) => [s.id, s.name])));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const commitRename = (id: string, oldName: string) => {
    const next = (drafts[id] ?? "").trim();
    if (!next || next === oldName) return;
    renameStage(oldName, next);
    onRename?.(oldName, next);
  };

  const handleAdd = () => {
    if (!newName.trim()) return;
    addStage(newName, newColor);
    setNewName("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage pipeline stages</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="border-hairline rounded-lg divide-y divide-border">
            {stages.map((s, idx) => (
              <div key={s.id} className="flex items-center gap-2 p-2.5">
                <ColorSwatch
                  value={s.color}
                  onChange={(c) => setStageColor(s.id, c)}
                />
                <Input
                  value={drafts[s.id] ?? s.name}
                  onChange={(e) => setDrafts((d) => ({ ...d, [s.id]: e.target.value }))}
                  onBlur={() => commitRename(s.id, s.name)}
                  onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                  className="h-8 flex-1"
                />
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => moveStage(s.id, -1)} disabled={idx === 0}>
                  <ArrowUp className="w-3.5 h-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => moveStage(s.id, 1)} disabled={idx === stages.length - 1}>
                  <ArrowDown className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-destructive"
                  onClick={() => removeStage(s.id)}
                  disabled={stages.length <= 1}
                  title="Delete stage"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 border-hairline rounded-lg p-2.5 bg-surface/40">
            <ColorSwatch value={newColor} onChange={setNewColor} />
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New stage name…"
              className="h-8 flex-1"
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <Button size="sm" onClick={handleAdd} disabled={!newName.trim()}>
              <Plus className="w-3.5 h-3.5" /> Add
            </Button>
          </div>
        </div>

        <DialogFooter className="justify-between">
          <Button variant="ghost" size="sm" onClick={resetToDefault} className="text-muted-foreground">
            <RotateCcw className="w-3.5 h-3.5" /> Reset to defaults
          </Button>
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ColorSwatch({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-8 w-8 p-0 border-hairline rounded-md">
        <span className="w-4 h-4 rounded-full mx-auto" style={{ backgroundColor: colorToCss(value) }} />
      </SelectTrigger>
      <SelectContent>
        {STAGE_COLOR_PRESETS.map((p) => (
          <SelectItem key={p.value} value={p.value}>
            <span className="inline-flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: `hsl(${p.value})` }} />
              {p.label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
