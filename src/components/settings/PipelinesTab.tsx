import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, RotateCcw, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import StageEditor from "@/components/pipeline/StageEditor";
import PipelineIcon from "@/components/pipeline/PipelineIcon";
import {
  useStages,
  colorToCss,
  STAGE_COLOR_PRESETS,
  PIPELINE_ICONS,
  PIPELINE_TEMPLATES,
  type Pipeline,
} from "@/lib/stagesStore";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useJobs } from "@/lib/jobsStore";
import { toast } from "@/hooks/use-toast";
import type { Job, PipelineStage } from "@/data/mockData";

/** Settings → Pipelines: set up as many boards as you need, each with its own stages. */
export default function PipelinesTab() {
  const { pipelines, resetToDefault, addPipeline, removePipeline, movePipeline, updatePipeline } = useStages();
  const [jobs, setJobs] = useJobs();
  const [addOpen, setAddOpen] = useState(false);
  const [deleting, setDeleting] = useState<Pipeline | null>(null);
  const [moveTo, setMoveTo] = useState<string>("");

  const jobCount = (id: string) => jobs.filter((j) => (j.pipelineId ?? pipelines[0]?.id) === id).length;

  const openDelete = (p: Pipeline) => {
    setDeleting(p);
    setMoveTo(pipelines.find((x) => x.id !== p.id)?.id ?? "");
  };

  const confirmDelete = () => {
    if (!deleting) return;
    const target = pipelines.find((p) => p.id === moveTo);
    const affected = jobCount(deleting.id);
    if (target) {
      const firstStage = target.stages[0]?.name;
      setJobs((prev) =>
        prev.map((j: Job) =>
          (j.pipelineId ?? pipelines[0]?.id) === deleting.id
            ? { ...j, pipelineId: target.id, stage: (firstStage ?? j.stage) as PipelineStage, daysInStage: 0 }
            : j,
        ),
      );
    }
    removePipeline(deleting.id);
    toast({
      title: `${deleting.name} removed`,
      description: affected
        ? `${affected} job${affected === 1 ? "" : "s"} moved to ${target?.name ?? "another board"}.`
        : "That board had no jobs on it.",
    });
    setDeleting(null);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Set up a board for each process you run — sales, installation, service calls, whatever fits. Add, rename,
          reorder or recolour the stages on each one. Money stages live in Quotes &amp; invoices.
        </p>
        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="sm" onClick={resetToDefault} className="text-muted-foreground">
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </Button>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="w-3.5 h-3.5" /> Add board
          </Button>
        </div>
      </div>

      {pipelines.map((p, i) => (
        <section key={p.id} className="border-hairline rounded-xl p-4 bg-surface/40">
          <div className="flex items-center gap-2 mb-3">
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className="w-8 h-8 rounded-md inline-flex items-center justify-center border-hairline shrink-0"
                  style={{ color: colorToCss(p.color ?? "215 16% 47%") }}
                  title="Icon and colour"
                >
                  <PipelineIcon icon={p.icon} className="w-4 h-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-64 space-y-3">
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1.5">Icon</div>
                  <div className="grid grid-cols-8 gap-1">
                    {PIPELINE_ICONS.map((ic) => (
                      <button
                        key={ic}
                        onClick={() => updatePipeline(p.id, { icon: ic })}
                        className={`h-7 rounded-md inline-flex items-center justify-center hover:bg-surface-hover ${
                          p.icon === ic ? "border-hairline bg-surface-hover" : ""
                        }`}
                      >
                        <PipelineIcon icon={ic} className="w-3.5 h-3.5" />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1.5">Colour</div>
                  <div className="grid grid-cols-10 gap-1">
                    {STAGE_COLOR_PRESETS.map((c) => (
                      <button
                        key={c.value}
                        title={c.label}
                        onClick={() => updatePipeline(p.id, { color: c.value })}
                        className={`w-5 h-5 rounded-full ${p.color === c.value ? "ring-2 ring-offset-1 ring-ring" : ""}`}
                        style={{ background: colorToCss(c.value) }}
                      />
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <Input
              value={p.name}
              onChange={(e) => updatePipeline(p.id, { name: e.target.value })}
              className="h-8 max-w-[220px] text-sm font-medium"
            />
            <span className="text-xs text-muted-foreground">
              {p.stages.length} stages · {jobCount(p.id)} jobs
            </span>

            <div className="ml-auto flex items-center gap-0.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground"
                disabled={i === 0}
                onClick={() => movePipeline(p.id, -1)}
                title="Move board up"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground"
                disabled={i === pipelines.length - 1}
                onClick={() => movePipeline(p.id, 1)}
                title="Move board down"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                disabled={pipelines.length <= 1}
                onClick={() => openDelete(p)}
                title="Delete board"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
          <StageEditor pipelineId={p.id} />
        </section>
      ))}

      {/* Add a board */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add a board</DialogTitle>
            <DialogDescription>Pick something to start from — you can change every stage afterwards.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {PIPELINE_TEMPLATES.map((t) => (
              <button
                key={t.key}
                onClick={() => {
                  const created = addPipeline(t.key);
                  setAddOpen(false);
                  toast({ title: `${created.name} added`, description: "Set up its stages below." });
                }}
                className="w-full text-left border-hairline rounded-lg p-3 hover:bg-surface-hover transition-colors flex items-start gap-3"
              >
                <span
                  className="w-8 h-8 rounded-md inline-flex items-center justify-center border-hairline shrink-0"
                  style={{ color: colorToCss(t.color) }}
                >
                  <PipelineIcon icon={t.icon} className="w-4 h-4" />
                </span>
                <span>
                  <span className="block text-sm font-medium">{t.label}</span>
                  <span className="block text-xs text-muted-foreground">{t.description}</span>
                  <span className="block text-xs text-muted-foreground mt-0.5">{t.stageNames.join(" → ")}</span>
                </span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete a board */}
      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete “{deleting?.name}”?</DialogTitle>
            <DialogDescription>
              {deleting && jobCount(deleting.id) > 0
                ? `${jobCount(deleting.id)} job${jobCount(deleting.id) === 1 ? "" : "s"} sit on this board. Choose where they should go.`
                : "This board has no jobs on it."}
            </DialogDescription>
          </DialogHeader>
          {deleting && jobCount(deleting.id) > 0 && (
            <label className="block">
              <div className="text-xs font-medium text-muted-foreground mb-1">Move those jobs to</div>
              <select
                value={moveTo}
                onChange={(e) => setMoveTo(e.target.value)}
                className="w-full h-9 rounded-md border-hairline bg-background px-2 text-sm"
              >
                {pipelines
                  .filter((x) => x.id !== deleting.id)
                  .map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.name} — {x.stages[0]?.name}
                    </option>
                  ))}
              </select>
            </label>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete board
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
