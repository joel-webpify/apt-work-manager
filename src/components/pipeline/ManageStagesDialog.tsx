import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { Link } from "react-router-dom";
import { useStages } from "@/lib/stagesStore";
import StageEditor from "./StageEditor";

export default function ManageStagesDialog({
  open,
  onOpenChange,
  pipelineId,
  onRename,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Which pipeline's stages we're editing. */
  pipelineId: string;
  /** Notify parent so it can rewrite jobs whose stage was renamed. */
  onRename?: (oldName: string, newName: string) => void;
}) {
  const { pipeline, resetToDefault } = useStages(pipelineId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{pipeline?.name ?? "Pipeline"} stages</DialogTitle>
        </DialogHeader>

        <StageEditor pipelineId={pipelineId} onRename={onRename} />

        <p className="text-xs text-muted-foreground">
          Both pipelines can also be set up in{" "}
          <Link to="/settings?tab=pipelines" className="text-primary hover:underline">
            Settings → Pipelines
          </Link>
          .
        </p>

        <DialogFooter className="justify-between">
          <Button variant="ghost" size="sm" onClick={resetToDefault} className="text-muted-foreground">
            <RotateCcw className="w-3.5 h-3.5" /> Reset both pipelines
          </Button>
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
