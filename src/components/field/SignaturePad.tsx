import { useRef, useState, type PointerEvent } from "react";
import { Eraser, Check } from "lucide-react";

export default function SignaturePad({
  onSave,
}: {
  onSave: (dataUrl: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const [dirty, setDirty] = useState(false);

  const ctxOf = () => {
    const c = canvasRef.current;
    if (!c) return null;
    const ctx = c.getContext("2d");
    if (!ctx) return null;
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#111827";
    return ctx;
  };

  const pos = (e: PointerEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * c.width, y: ((e.clientY - r.top) / r.height) * c.height };
  };

  const down = (e: PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const ctx = ctxOf();
    if (!ctx) return;
    drawing.current = true;
    setDirty(true);
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  };

  const move = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = ctxOf();
    if (!ctx) return;
    const p = pos(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  };

  const up = () => {
    drawing.current = false;
  };

  const clear = () => {
    const c = canvasRef.current;
    const ctx = c?.getContext("2d");
    if (c && ctx) ctx.clearRect(0, 0, c.width, c.height);
    setDirty(false);
  };

  return (
    <div className="space-y-2">
      <canvas
        ref={canvasRef}
        width={640}
        height={220}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerLeave={up}
        className="w-full h-[110px] rounded-lg border-hairline bg-surface touch-none"
      />
      <p className="text-[11px] text-muted-foreground">Ask the customer to sign in the box above.</p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={clear}
          className="h-10 flex-1 rounded-lg border-hairline text-sm font-medium inline-flex items-center justify-center gap-1.5 hover:bg-surface-hover"
        >
          <Eraser className="w-4 h-4" /> Clear
        </button>
        <button
          type="button"
          disabled={!dirty}
          onClick={() => {
            const c = canvasRef.current;
            if (c) onSave(c.toDataURL("image/png"));
          }}
          className="h-10 flex-1 rounded-lg bg-primary text-primary-foreground text-sm font-medium inline-flex items-center justify-center gap-1.5 disabled:opacity-40"
        >
          <Check className="w-4 h-4" /> Save signature
        </button>
      </div>
    </div>
  );
}
