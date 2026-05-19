import { useRef, useState } from "react";
import {
  Heading as HeadingIcon,
  Type,
  MousePointerClick,
  Image as ImageIcon,
  Minus,
  MoveVertical,
  Columns2,
  GripVertical,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

export type BlockType =
  | "heading"
  | "text"
  | "button"
  | "image"
  | "divider"
  | "spacer"
  | "columns";

export interface EmailBlock {
  id: string;
  type: BlockType;
  // shared / per-type props
  text?: string;
  level?: 1 | 2 | 3;
  align?: "left" | "center" | "right";
  url?: string;
  label?: string;
  src?: string;
  alt?: string;
  height?: number;
  leftText?: string;
  rightText?: string;
  bgColor?: string;
  color?: string;
}

const uid = () => Math.random().toString(36).slice(2, 9);

const PALETTE: { type: BlockType; label: string; icon: typeof Type }[] = [
  { type: "heading", label: "Heading", icon: HeadingIcon },
  { type: "text", label: "Text", icon: Type },
  { type: "button", label: "Button", icon: MousePointerClick },
  { type: "image", label: "Image", icon: ImageIcon },
  { type: "divider", label: "Divider", icon: Minus },
  { type: "spacer", label: "Spacer", icon: MoveVertical },
  { type: "columns", label: "2 Columns", icon: Columns2 },
];

export function createBlock(type: BlockType): EmailBlock {
  const base: EmailBlock = { id: uid(), type };
  switch (type) {
    case "heading":
      return { ...base, text: "Your headline here", level: 2, align: "left" };
    case "text":
      return {
        ...base,
        text: "Write a short paragraph. Use this space to introduce your offer, share an update, or explain what to do next.",
        align: "left",
      };
    case "button":
      return {
        ...base,
        label: "Book now",
        url: "https://",
        align: "center",
        bgColor: "#111111",
        color: "#ffffff",
      };
    case "image":
      return { ...base, src: "", alt: "Image", align: "center" };
    case "divider":
      return { ...base };
    case "spacer":
      return { ...base, height: 24 };
    case "columns":
      return {
        ...base,
        leftText: "Left column copy.",
        rightText: "Right column copy.",
      };
  }
}

// ----- preview rendering -----

function renderVars(text: string, vars: Record<string, string>) {
  let out = text ?? "";
  Object.entries(vars).forEach(([k, v]) => {
    out = out.split(`{{${k}}}`).join(v);
  });
  return out;
}

function inlineMd(text: string) {
  const esc = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return esc
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" style="color:#2563eb;text-decoration:underline">$1</a>')
    .replace(/\n/g, "<br/>");
}

export function renderBlocksToHtml(blocks: EmailBlock[], vars: Record<string, string> = {}) {
  const parts = blocks.map((b) => {
    const a = b.align ?? "left";
    switch (b.type) {
      case "heading": {
        const size = b.level === 1 ? 28 : b.level === 3 ? 18 : 22;
        return `<div style="text-align:${a};font-size:${size}px;font-weight:600;line-height:1.25;margin:0 0 12px">${inlineMd(renderVars(b.text ?? "", vars))}</div>`;
      }
      case "text":
        return `<div style="text-align:${a};font-size:14px;line-height:1.55;margin:0 0 12px;color:#222">${inlineMd(renderVars(b.text ?? "", vars))}</div>`;
      case "button": {
        const bg = b.bgColor ?? "#111111";
        const fg = b.color ?? "#ffffff";
        return `<div style="text-align:${a};margin:8px 0 16px"><a href="${b.url ?? "#"}" style="display:inline-block;background:${bg};color:${fg};padding:10px 18px;border-radius:6px;font-size:14px;font-weight:500;text-decoration:none">${renderVars(b.label ?? "Button", vars)}</a></div>`;
      }
      case "image":
        if (!b.src) {
          return `<div style="text-align:${a};margin:0 0 12px"><div style="display:inline-block;width:100%;max-width:480px;aspect-ratio:16/9;background:#f1f1f1;border:1px dashed #d4d4d4;color:#888;font-size:12px;display:flex;align-items:center;justify-content:center">Image placeholder</div></div>`;
        }
        return `<div style="text-align:${a};margin:0 0 12px"><img src="${b.src}" alt="${b.alt ?? ""}" style="max-width:100%;height:auto;border-radius:4px"/></div>`;
      case "divider":
        return `<hr style="border:none;border-top:1px solid #e5e5e5;margin:16px 0"/>`;
      case "spacer":
        return `<div style="height:${b.height ?? 24}px"></div>`;
      case "columns":
        return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 12px"><tr><td valign="top" style="width:50%;padding-right:8px;font-size:14px;line-height:1.55;color:#222">${inlineMd(renderVars(b.leftText ?? "", vars))}</td><td valign="top" style="width:50%;padding-left:8px;font-size:14px;line-height:1.55;color:#222">${inlineMd(renderVars(b.rightText ?? "", vars))}</td></tr></table>`;
    }
  });
  return parts.join("");
}

// ----- editor -----

export function EmailDesigner({
  blocks,
  onChange,
  vars,
}: {
  blocks: EmailBlock[];
  onChange: (next: EmailBlock[]) => void;
  vars: Record<string, string>;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(blocks[0]?.id ?? null);
  const dragData = useRef<{ kind: "new"; type: BlockType } | { kind: "move"; id: string } | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const selected = blocks.find((b) => b.id === selectedId) ?? null;

  const update = (id: string, patch: Partial<EmailBlock>) =>
    onChange(blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)));

  const remove = (id: string) => {
    onChange(blocks.filter((b) => b.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const duplicate = (id: string) => {
    const idx = blocks.findIndex((b) => b.id === id);
    if (idx === -1) return;
    const copy = { ...blocks[idx], id: uid() };
    const next = [...blocks];
    next.splice(idx + 1, 0, copy);
    onChange(next);
    setSelectedId(copy.id);
  };

  const move = (id: string, dir: -1 | 1) => {
    const idx = blocks.findIndex((b) => b.id === id);
    const next = [...blocks];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  };

  const insertAt = (idx: number, block: EmailBlock) => {
    const next = [...blocks];
    next.splice(idx, 0, block);
    onChange(next);
    setSelectedId(block.id);
  };

  const moveTo = (fromId: string, idx: number) => {
    const fromIdx = blocks.findIndex((b) => b.id === fromId);
    if (fromIdx === -1) return;
    const next = [...blocks];
    const [item] = next.splice(fromIdx, 1);
    const adjusted = fromIdx < idx ? idx - 1 : idx;
    next.splice(adjusted, 0, item);
    onChange(next);
  };

  const handleDrop = (idx: number) => {
    const d = dragData.current;
    setDragOverIdx(null);
    if (!d) return;
    if (d.kind === "new") {
      insertAt(idx, createBlock(d.type));
    } else {
      moveTo(d.id, idx);
    }
    dragData.current = null;
  };

  return (
    <div className="grid grid-cols-[180px_1fr_220px] gap-3 min-h-[420px]">
      {/* Palette */}
      <div className="border-hairline rounded-md bg-surface/40 p-2">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium px-1.5 mb-1.5">
          Blocks
        </div>
        <div className="space-y-1">
          {PALETTE.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.type}
                draggable
                onDragStart={() => {
                  dragData.current = { kind: "new", type: p.type };
                }}
                onDragEnd={() => {
                  dragData.current = null;
                  setDragOverIdx(null);
                }}
                onClick={() => insertAt(blocks.length, createBlock(p.type))}
                className="flex items-center gap-2 px-2 py-1.5 rounded text-xs bg-background border-hairline hover:border-primary/40 hover:bg-surface-hover cursor-grab active:cursor-grabbing transition-colors"
                title="Drag into canvas or click to append"
              >
                <Icon className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.75} />
                <span>{p.label}</span>
              </div>
            );
          })}
        </div>
        <div className="text-[10px] text-muted-foreground px-1.5 mt-3 leading-snug">
          Drag blocks into the canvas, or click to append. Drag handle to reorder.
        </div>
      </div>

      {/* Canvas */}
      <div className="border-hairline rounded-md bg-surface/30 p-4 overflow-y-auto max-h-[560px]">
        <div className="mx-auto max-w-[560px] bg-white rounded-md shadow-sm border border-border/60 p-6 min-h-[360px]">
          {blocks.length === 0 ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverIdx(0);
              }}
              onDrop={() => handleDrop(0)}
              className={`border-2 border-dashed rounded-md p-10 text-center text-xs text-muted-foreground ${
                dragOverIdx === 0 ? "border-primary bg-primary/5" : "border-border"
              }`}
            >
              Drag a block here to start
            </div>
          ) : (
            <>
              <DropZone
                active={dragOverIdx === 0}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverIdx(0);
                }}
                onDragLeave={() => setDragOverIdx((v) => (v === 0 ? null : v))}
                onDrop={() => handleDrop(0)}
              />
              {blocks.map((b, i) => (
                <div key={b.id}>
                  <BlockShell
                    block={b}
                    selected={selectedId === b.id}
                    onSelect={() => setSelectedId(b.id)}
                    onDelete={() => remove(b.id)}
                    onDuplicate={() => duplicate(b.id)}
                    onMoveUp={() => move(b.id, -1)}
                    onMoveDown={() => move(b.id, 1)}
                    canUp={i > 0}
                    canDown={i < blocks.length - 1}
                    onDragStart={() => {
                      dragData.current = { kind: "move", id: b.id };
                    }}
                    onDragEnd={() => {
                      dragData.current = null;
                      setDragOverIdx(null);
                    }}
                    vars={vars}
                  />
                  <DropZone
                    active={dragOverIdx === i + 1}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverIdx(i + 1);
                    }}
                    onDragLeave={() => setDragOverIdx((v) => (v === i + 1 ? null : v))}
                    onDrop={() => handleDrop(i + 1)}
                  />
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Inspector */}
      <div className="border-hairline rounded-md bg-surface/40 p-3">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium mb-2">
          {selected ? `${selected.type} block` : "Inspector"}
        </div>
        {!selected ? (
          <div className="text-xs text-muted-foreground">Select a block to edit its properties.</div>
        ) : (
          <Inspector block={selected} onChange={(patch) => update(selected.id, patch)} />
        )}
      </div>
    </div>
  );
}

function DropZone({
  active,
  onDragOver,
  onDragLeave,
  onDrop,
}: {
  active: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: () => void;
}) {
  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`transition-all rounded ${
        active ? "h-8 my-1 bg-primary/10 border border-dashed border-primary" : "h-2"
      }`}
    />
  );
}

function BlockShell({
  block,
  selected,
  onSelect,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  canUp,
  canDown,
  onDragStart,
  onDragEnd,
  vars,
}: {
  block: EmailBlock;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canUp: boolean;
  canDown: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  vars: Record<string, string>;
}) {
  const html = renderBlocksToHtml([block], vars);
  return (
    <div
      onClick={onSelect}
      className={`group relative rounded border transition-colors ${
        selected ? "border-primary" : "border-transparent hover:border-border"
      }`}
    >
      <div
        draggable
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        className={`absolute -left-7 top-1/2 -translate-y-1/2 w-6 h-6 rounded items-center justify-center text-muted-foreground bg-background border-hairline cursor-grab active:cursor-grabbing transition-opacity ${
          selected ? "flex" : "hidden group-hover:flex"
        }`}
        title="Drag to reorder"
      >
        <GripVertical className="w-3 h-3" />
      </div>
      <div
        className={`absolute -right-1 -top-3 z-10 items-center gap-0.5 bg-background border-hairline rounded shadow-sm px-0.5 py-0.5 ${
          selected ? "flex" : "hidden group-hover:flex"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <IconBtn onClick={onMoveUp} disabled={!canUp} title="Move up">
          <ChevronUp className="w-3 h-3" />
        </IconBtn>
        <IconBtn onClick={onMoveDown} disabled={!canDown} title="Move down">
          <ChevronDown className="w-3 h-3" />
        </IconBtn>
        <IconBtn onClick={onDuplicate} title="Duplicate">
          <Copy className="w-3 h-3" />
        </IconBtn>
        <IconBtn onClick={onDelete} title="Delete" danger>
          <Trash2 className="w-3 h-3" />
        </IconBtn>
      </div>
      <div className="px-1 py-0.5" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}

function IconBtn({
  onClick,
  children,
  title,
  disabled,
  danger,
}: {
  onClick: () => void;
  children: React.ReactNode;
  title: string;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`h-5 w-5 inline-flex items-center justify-center rounded hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed ${
        danger ? "text-destructive" : "text-muted-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function Inspector({
  block,
  onChange,
}: {
  block: EmailBlock;
  onChange: (patch: Partial<EmailBlock>) => void;
}) {
  return (
    <div className="space-y-2.5">
      {block.type === "heading" && (
        <>
          <Field label="Text">
            <textarea
              value={block.text ?? ""}
              onChange={(e) => onChange({ text: e.target.value })}
              rows={2}
              className="w-full text-xs px-2 py-1.5 rounded border-hairline bg-background"
            />
          </Field>
          <Field label="Level">
            <select
              value={block.level ?? 2}
              onChange={(e) => onChange({ level: Number(e.target.value) as 1 | 2 | 3 })}
              className="w-full h-7 text-xs px-2 rounded border-hairline bg-background"
            >
              <option value={1}>H1 — Large</option>
              <option value={2}>H2 — Medium</option>
              <option value={3}>H3 — Small</option>
            </select>
          </Field>
          <AlignField value={block.align} onChange={(align) => onChange({ align })} />
        </>
      )}
      {block.type === "text" && (
        <>
          <Field label="Text">
            <textarea
              value={block.text ?? ""}
              onChange={(e) => onChange({ text: e.target.value })}
              rows={6}
              className="w-full text-xs px-2 py-1.5 rounded border-hairline bg-background font-mono"
            />
          </Field>
          <div className="text-[10px] text-muted-foreground leading-snug">
            Markdown: **bold**, *italic*, [link](url). Variables: {"{{first_name}}"}.
          </div>
          <AlignField value={block.align} onChange={(align) => onChange({ align })} />
        </>
      )}
      {block.type === "button" && (
        <>
          <Field label="Label">
            <input
              value={block.label ?? ""}
              onChange={(e) => onChange({ label: e.target.value })}
              className="w-full h-7 text-xs px-2 rounded border-hairline bg-background"
            />
          </Field>
          <Field label="URL">
            <input
              value={block.url ?? ""}
              onChange={(e) => onChange({ url: e.target.value })}
              placeholder="https://"
              className="w-full h-7 text-xs px-2 rounded border-hairline bg-background"
            />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Background">
              <input
                type="color"
                value={block.bgColor ?? "#111111"}
                onChange={(e) => onChange({ bgColor: e.target.value })}
                className="w-full h-7 rounded border-hairline bg-background"
              />
            </Field>
            <Field label="Text color">
              <input
                type="color"
                value={block.color ?? "#ffffff"}
                onChange={(e) => onChange({ color: e.target.value })}
                className="w-full h-7 rounded border-hairline bg-background"
              />
            </Field>
          </div>
          <AlignField value={block.align} onChange={(align) => onChange({ align })} />
        </>
      )}
      {block.type === "image" && (
        <>
          <Field label="Image URL">
            <input
              value={block.src ?? ""}
              onChange={(e) => onChange({ src: e.target.value })}
              placeholder="https://…"
              className="w-full h-7 text-xs px-2 rounded border-hairline bg-background"
            />
          </Field>
          <Field label="Alt text">
            <input
              value={block.alt ?? ""}
              onChange={(e) => onChange({ alt: e.target.value })}
              className="w-full h-7 text-xs px-2 rounded border-hairline bg-background"
            />
          </Field>
          <AlignField value={block.align} onChange={(align) => onChange({ align })} />
        </>
      )}
      {block.type === "spacer" && (
        <Field label={`Height — ${block.height ?? 24}px`}>
          <input
            type="range"
            min={8}
            max={96}
            step={4}
            value={block.height ?? 24}
            onChange={(e) => onChange({ height: Number(e.target.value) })}
            className="w-full"
          />
        </Field>
      )}
      {block.type === "divider" && (
        <div className="text-xs text-muted-foreground">No options. Adds a thin horizontal rule.</div>
      )}
      {block.type === "columns" && (
        <>
          <Field label="Left column">
            <textarea
              value={block.leftText ?? ""}
              onChange={(e) => onChange({ leftText: e.target.value })}
              rows={4}
              className="w-full text-xs px-2 py-1.5 rounded border-hairline bg-background font-mono"
            />
          </Field>
          <Field label="Right column">
            <textarea
              value={block.rightText ?? ""}
              onChange={(e) => onChange({ rightText: e.target.value })}
              rows={4}
              className="w-full text-xs px-2 py-1.5 rounded border-hairline bg-background font-mono"
            />
          </Field>
        </>
      )}
    </div>
  );
}

function AlignField({
  value,
  onChange,
}: {
  value: EmailBlock["align"];
  onChange: (a: "left" | "center" | "right") => void;
}) {
  return (
    <Field label="Alignment">
      <div className="flex items-center gap-1 border-hairline rounded p-0.5 w-fit">
        {(["left", "center", "right"] as const).map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => onChange(a)}
            className={`h-6 px-2 rounded text-[11px] capitalize transition-colors ${
              (value ?? "left") === a
                ? "bg-surface text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {a}
          </button>
        ))}
      </div>
    </Field>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] font-medium text-muted-foreground mb-1 block uppercase tracking-wide">
        {label}
      </label>
      {children}
    </div>
  );
}
