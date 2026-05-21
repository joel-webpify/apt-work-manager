import { useRef, useState } from "react";
import {
  Heading as HeadingIcon,
  Type,
  MousePointerClick,
  Image as ImageIcon,
  Minus,
  MoveVertical,
  Columns2,
  Columns3,
  GripVertical,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Star,
  Quote,
  List as ListIcon,
  Share2,
  PanelBottom,
  PanelTop,
  Video,
} from "lucide-react";

export type BlockType =
  | "heading"
  | "text"
  | "button"
  | "image"
  | "divider"
  | "spacer"
  | "columns"
  | "columns3"
  | "hero"
  | "logo"
  | "list"
  | "quote"
  | "video"
  | "social"
  | "footer";

export interface EmailBlock {
  id: string;
  type: BlockType;
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
  midText?: string;
  bgColor?: string;
  color?: string;
  heroImage?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heroCtaLabel?: string;
  heroCtaUrl?: string;
  items?: string[];
  socials?: { name: string; url: string }[];
  company?: string;
  address?: string;
  unsubLabel?: string;
}

const uid = () => Math.random().toString(36).slice(2, 9);

type PaletteGroup = "Basic" | "Layout" | "Content" | "Brand";
type PaletteItem = { type: BlockType; label: string; icon: typeof Type; group: PaletteGroup };

const PALETTE: PaletteItem[] = [
  { type: "heading", label: "Heading", icon: HeadingIcon, group: "Basic" },
  { type: "text", label: "Text", icon: Type, group: "Basic" },
  { type: "button", label: "Button", icon: MousePointerClick, group: "Basic" },
  { type: "image", label: "Image", icon: ImageIcon, group: "Basic" },
  { type: "divider", label: "Divider", icon: Minus, group: "Basic" },
  { type: "spacer", label: "Spacer", icon: MoveVertical, group: "Basic" },
  { type: "columns", label: "2 columns", icon: Columns2, group: "Layout" },
  { type: "columns3", label: "3 columns", icon: Columns3, group: "Layout" },
  { type: "hero", label: "Hero", icon: PanelTop, group: "Content" },
  { type: "list", label: "Bulleted list", icon: ListIcon, group: "Content" },
  { type: "quote", label: "Quote", icon: Quote, group: "Content" },
  { type: "video", label: "Video", icon: Video, group: "Content" },
  { type: "logo", label: "Logo", icon: Star, group: "Brand" },
  { type: "social", label: "Social icons", icon: Share2, group: "Brand" },
  { type: "footer", label: "Footer", icon: PanelBottom, group: "Brand" },
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
      return { ...base, label: "Book now", url: "https://", align: "center", bgColor: "#111111", color: "#ffffff" };
    case "image":
      return { ...base, src: "", alt: "Image", align: "center" };
    case "divider":
      return { ...base };
    case "spacer":
      return { ...base, height: 24 };
    case "columns":
      return { ...base, leftText: "Left column copy.", rightText: "Right column copy." };
    case "columns3":
      return { ...base, leftText: "Column one.", midText: "Column two.", rightText: "Column three." };
    case "hero":
      return {
        ...base,
        heroImage: "",
        heroTitle: "A bold headline that grabs attention",
        heroSubtitle: "One short sentence to support the headline and set the tone.",
        heroCtaLabel: "Get started",
        heroCtaUrl: "https://",
        bgColor: "#0f172a",
        color: "#ffffff",
        align: "center",
      };
    case "logo":
      return { ...base, src: "", alt: "Logo", align: "center", height: 40 };
    case "list":
      return {
        ...base,
        items: ["First benefit or feature", "Second point worth noting", "Third reason to act today"],
        align: "left",
      };
    case "quote":
      return { ...base, text: "“This service completely changed how we manage our home — couldn’t recommend more.”", label: "— Sarah W., Bristol" };
    case "video":
      return { ...base, src: "", url: "https://", alt: "Video thumbnail", align: "center" };
    case "social":
      return {
        ...base,
        align: "center",
        socials: [
          { name: "Facebook", url: "https://facebook.com/" },
          { name: "Instagram", url: "https://instagram.com/" },
          { name: "LinkedIn", url: "https://linkedin.com/" },
        ],
      };
    case "footer":
      return {
        ...base,
        company: "Your company",
        address: "123 Example Street, Bristol BS1 1AA",
        unsubLabel: "Unsubscribe",
        url: "https://",
        align: "center",
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
      case "columns3":
        return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 12px"><tr><td valign="top" style="width:33%;padding-right:6px;font-size:14px;line-height:1.55;color:#222">${inlineMd(renderVars(b.leftText ?? "", vars))}</td><td valign="top" style="width:34%;padding:0 6px;font-size:14px;line-height:1.55;color:#222">${inlineMd(renderVars(b.midText ?? "", vars))}</td><td valign="top" style="width:33%;padding-left:6px;font-size:14px;line-height:1.55;color:#222">${inlineMd(renderVars(b.rightText ?? "", vars))}</td></tr></table>`;
      case "hero": {
        const bg = b.bgColor ?? "#0f172a";
        const fg = b.color ?? "#ffffff";
        const img = b.heroImage
          ? `<div><img src="${b.heroImage}" alt="" style="display:block;width:100%;height:auto"/></div>`
          : "";
        const cta = b.heroCtaLabel
          ? `<div style="margin-top:14px"><a href="${b.heroCtaUrl ?? "#"}" style="display:inline-block;background:${fg};color:${bg};padding:10px 20px;border-radius:6px;font-size:14px;font-weight:600;text-decoration:none">${renderVars(b.heroCtaLabel, vars)}</a></div>`
          : "";
        return `<div style="margin:0 0 16px;background:${bg};color:${fg};border-radius:8px;overflow:hidden">${img}<div style="padding:28px 24px;text-align:${a}"><div style="font-size:24px;font-weight:700;line-height:1.2;margin:0 0 8px">${inlineMd(renderVars(b.heroTitle ?? "", vars))}</div><div style="font-size:14px;line-height:1.5;opacity:.85">${inlineMd(renderVars(b.heroSubtitle ?? "", vars))}</div>${cta}</div></div>`;
      }
      case "logo": {
        if (!b.src) {
          return `<div style="text-align:${a};margin:0 0 16px"><div style="display:inline-block;height:${b.height ?? 40}px;min-width:120px;background:#f1f1f1;border:1px dashed #d4d4d4;color:#888;font-size:11px;line-height:${b.height ?? 40}px;padding:0 12px">Your logo</div></div>`;
        }
        return `<div style="text-align:${a};margin:0 0 16px"><img src="${b.src}" alt="${b.alt ?? ""}" style="height:${b.height ?? 40}px;width:auto"/></div>`;
      }
      case "list": {
        const items = (b.items ?? []).map((it) => `<li style="margin:0 0 6px">${inlineMd(renderVars(it, vars))}</li>`).join("");
        return `<ul style="text-align:${a};font-size:14px;line-height:1.55;color:#222;margin:0 0 12px;padding-left:20px">${items}</ul>`;
      }
      case "quote":
        return `<blockquote style="margin:0 0 16px;padding:12px 16px;border-left:3px solid #111;background:#fafafa;font-size:15px;line-height:1.5;color:#333;font-style:italic">${inlineMd(renderVars(b.text ?? "", vars))}<div style="margin-top:6px;font-size:12px;color:#666;font-style:normal">${renderVars(b.label ?? "", vars)}</div></blockquote>`;
      case "video": {
        const thumb = b.src
          ? `<img src="${b.src}" alt="${b.alt ?? ""}" style="display:block;max-width:100%;height:auto;border-radius:6px"/>`
          : `<div style="width:100%;max-width:480px;aspect-ratio:16/9;background:#0d0d0d;color:#fff;display:flex;align-items:center;justify-content:center;border-radius:6px;font-size:24px">▶</div>`;
        return `<div style="text-align:${a};margin:0 0 16px"><a href="${b.url ?? "#"}" style="display:inline-block;position:relative;text-decoration:none">${thumb}</a></div>`;
      }
      case "social": {
        const items = (b.socials ?? [])
          .map(
            (s) =>
              `<a href="${s.url}" style="display:inline-block;margin:0 6px;padding:8px 12px;background:#f3f4f6;border-radius:999px;color:#111;font-size:12px;text-decoration:none">${s.name}</a>`,
          )
          .join("");
        return `<div style="text-align:${a};margin:8px 0 12px">${items}</div>`;
      }
      case "footer":
        return `<div style="text-align:${a};margin:16px 0 0;padding-top:16px;border-top:1px solid #e5e5e5;font-size:11px;line-height:1.5;color:#888"><div style="font-weight:600;color:#666">${renderVars(b.company ?? "", vars)}</div><div>${renderVars(b.address ?? "", vars)}</div><div style="margin-top:6px"><a href="${b.url ?? "#"}" style="color:#888;text-decoration:underline">${renderVars(b.unsubLabel ?? "Unsubscribe", vars)}</a></div></div>`;
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

  const groups: PaletteGroup[] = ["Basic", "Layout", "Content", "Brand"];

  return (
    <div className="grid grid-cols-[200px_1fr_240px] gap-3 min-h-[480px]">
      {/* Palette */}
      <div className="border-hairline rounded-lg bg-surface/40 p-2.5 overflow-y-auto max-h-[640px]">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold px-1 mb-2">
          Drag blocks
        </div>
        {groups.map((g) => (
          <div key={g} className="mb-3 last:mb-0">
            <div className="text-[10px] font-medium text-muted-foreground/80 px-1 mb-1.5">{g}</div>
            <div className="grid grid-cols-2 gap-1.5">
              {PALETTE.filter((p) => p.group === g).map((p) => {
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
                    className="flex flex-col items-center justify-center gap-1 px-2 py-2.5 rounded-md text-[11px] bg-background border-hairline hover:border-primary/50 hover:bg-primary/5 hover:shadow-sm cursor-grab active:cursor-grabbing transition-all text-center"
                    title="Drag into canvas or click to append"
                  >
                    <Icon className="w-4 h-4 text-foreground/70" strokeWidth={1.75} />
                    <span className="leading-tight">{p.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        <div className="text-[10px] text-muted-foreground px-1 mt-2 leading-snug">
          Drag into the canvas or click to append. Use the side handle to reorder.
        </div>
      </div>

      {/* Canvas */}
      <div className="border-hairline rounded-lg bg-gradient-to-b from-surface/40 to-surface/10 p-6 overflow-y-auto max-h-[640px]">
        <div className="mx-auto max-w-[600px] bg-white rounded-lg shadow-md border border-border/60 p-6 min-h-[420px]">

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
