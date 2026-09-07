import { Button } from "@/components/ui/button";
import { Handshake, RotateCcw, Wrench } from "lucide-react";
import StageEditor from "@/components/pipeline/StageEditor";
import { useStages } from "@/lib/stagesStore";

/** Settings → Pipelines: set up the stages for the sales and installation boards. */
export default function PipelinesTab() {
  const { pipelines, resetToDefault } = useStages();

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Add, rename, reorder or recolour the stages on each board. Money stages live in Quotes &amp; invoices, so the
          installation board stops at the work being finished.
        </p>
        <Button variant="ghost" size="sm" onClick={resetToDefault} className="text-muted-foreground shrink-0">
          <RotateCcw className="w-3.5 h-3.5" /> Reset
        </Button>
      </div>

      {pipelines.map((p) => (
        <section key={p.id} className="border-hairline rounded-xl p-4 bg-surface/40">
          <div className="flex items-center gap-2 mb-3">
            {p.id === "install" ? (
              <Wrench className="w-4 h-4 text-muted-foreground" />
            ) : (
              <Handshake className="w-4 h-4 text-muted-foreground" />
            )}
            <h3 className="text-sm font-medium">{p.name}</h3>
            <span className="text-xs text-muted-foreground">{p.stages.length} stages</span>
          </div>
          <StageEditor pipelineId={p.id} />
        </section>
      ))}
    </div>
  );
}
