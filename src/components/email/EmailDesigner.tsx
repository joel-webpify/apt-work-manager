import { useEffect, useRef, useState } from "react";
import { readBusinessSettings, useBusinessSettings } from "@/lib/businessSettings";
import { ensureEmailFooter, canDeleteEmailBlock, decorateMergePills } from "@/lib/emailEditor";
import { InsertFieldButton, FieldFallbacks } from "./MergeFields";
import { mergeText } from "@/lib/emailMergeFields";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { EmailAppearanceSettings, defaultEmailAppearance } from "./EmailAppearanceSettings";
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
  Plus,
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
  /** Column rows: blocks inside each column. Legacy rows fall back to leftText/midText/rightText. */
  cells?: EmailBlock[][];
}

const COLUMN_CHILD_TYPES: BlockType[] = ["heading", "text", "button", "image", "list", "quote", "divider", "spacer", "video", "social", "logo"];

export function columnCells(b: EmailBlock): EmailBlock[][] {
  const count = b.type === "columns3" ? 3 : 2;
  const legacy = count === 3 ? [b.leftText, b.midText, b.rightText] : [b.leftText, b.rightText];
  const base = b.cells ?? legacy.map((text, i) => (text ? [{ id: `${b.id}-c${i}`, type: "text" as BlockType, text, align: "left" as const }] : []));
  const out = base.slice(0, count).map((c) => [...c]);
  while (out.length < count) out.push([]);
  if (base.length > count) out[count - 1].push(...base.slice(count).flat());
  return out;
}

const uid = () => Math.random().toString(36).slice(2, 9);

type PaletteGroup = "Basic" | "Content" | "Brand";
type PaletteItem = { type: BlockType; label: string; icon: typeof Type; group: PaletteGroup };

const PALETTE: PaletteItem[] = [
  { type: "heading", label: "Heading", icon: HeadingIcon, group: "Basic" },
  { type: "text", label: "Text", icon: Type, group: "Basic" },
  { type: "button", label: "Button", icon: MousePointerClick, group: "Basic" },
  { type: "image", label: "Image", icon: ImageIcon, group: "Basic" },
  { type: "divider", label: "Divider", icon: Minus, group: "Basic" },
  { type: "spacer", label: "Spacer", icon: MoveVertical, group: "Basic" },
  { type: "columns", label: "2 columns", icon: Columns2, group: "Content" },
  { type: "columns3", label: "3 columns", icon: Columns3, group: "Content" },
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
        company: "{{business_name}}",
        address: "{{business_address}}",
        unsubLabel: "Unsubscribe",
        url: "{{unsubscribe_link}}",
        align: "center",
      };
  }
}

// ----- preview rendering -----

function renderVars(text: string, vars: Record<string, string>) {
  return mergeText(text ?? "", vars, Object.keys(vars).length === 0);
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
  const business = readBusinessSettings();
  const parts = blocks.map((original) => {
    let b = original;
    for (const key of ["url", "src", "alt", "heroImage", "heroCtaUrl"] as const) if (b[key]) b = { ...b, [key]: renderVars(b[key] ?? "", vars).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;") };
    if (b.type === "logo") b = { ...b, src: b.src || business.logo };
    if (b.type === "footer") b = { ...b, company: business.name || "{{business_name}}", address: business.address || "{{business_address}}", url: "{{unsubscribe_link}}", unsubLabel: b.unsubLabel?.trim() || "Unsubscribe" };
    const a = b.align ?? "left";
    switch (b.type) {
      case "heading": {
        const size = b.level === 1 ? 28 : b.level === 3 ? 18 : 22;
        return `<div style="text-align:${a};font-size:${size}px;font-weight:600;line-height:1.25;margin:0 0 12px">${inlineMd(renderVars(b.text ?? "", vars))}</div>`;
      }
      case "text":
        return `<div style="text-align:${a};font-size:14px;line-height:1.55;margin:0 0 12px;color:#222">${inlineMd(renderVars(b.text ?? "", vars))}</div>`;
      case "button": {
        const bg = b.bgColor ?? business.brandColour;
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
      case "columns3": {
        const cells = columnCells(original);
        const w = Math.floor(100 / cells.length);
        return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 12px;table-layout:fixed"><tr>${cells.map((c, i) => `<td valign="top" style="width:${w}%;padding:0 ${i === cells.length - 1 ? 0 : 6}px 0 ${i === 0 ? 0 : 6}px;font-size:14px;line-height:1.55;color:#222">${renderBlocksToHtml(c, vars)}</td>`).join("")}</tr></table>`;
      }
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
        return `<div style="text-align:${a};margin:16px 0 0;padding:16px;border-top:1px solid #e5e5e5;font-size:11px;line-height:1.5;color:${b.color ?? "#888"};background:${b.bgColor ?? "transparent"}"><div style="font-weight:600">${inlineMd(renderVars(b.company ?? "", vars))}</div><div>${inlineMd(renderVars(b.address ?? "", vars))}</div><div style="margin-top:6px"><a href="${renderVars("{{unsubscribe_link}}", vars).replace(/"/g, "&quot;")}" style="color:inherit;text-decoration:underline">${inlineMd(renderVars(b.unsubLabel ?? "Unsubscribe", vars))}</a></div></div>`;
    }
  });
  return parts.join("");
}

// ----- editor -----

export function EmailDesigner({
  blocks,
  onChange,
  vars,
  fullScreen = false,
  device = "desktop",
  paletteExtra,
}: {
  blocks: EmailBlock[];
  onChange: (next: EmailBlock[]) => void;
  vars: Record<string, string>;
  fullScreen?: boolean;
  device?: "desktop" | "mobile";
  paletteExtra?: React.ReactNode;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const business = useBusinessSettings();
  const [appearance, setAppearance] = useState(() => ({ ...defaultEmailAppearance, brand: business.brandColour }));
  useEffect(() => { const next = ensureEmailFooter(blocks); if (next !== blocks) onChange(next); }, [blocks, onChange]);
  const dragData = useRef<{ kind: "new"; type: BlockType } | { kind: "move"; id: string } | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const selected = blocks.find((b) => b.id === selectedId) ?? null;

  const update = (id: string, patch: Partial<EmailBlock>) =>
    onChange(blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)));

  const remove = (id: string) => {
    const block = blocks.find((item) => item.id === id);
    if (!block || !canDeleteEmailBlock(block)) return;
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
    if (block.type === "footer" && blocks.some((item) => item.type === "footer")) { setSelectedId(blocks.find((item) => item.type === "footer")?.id ?? null); return; }
    if (block.type === "button") block = { ...block, bgColor: appearance.brand };
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

  const groups: PaletteGroup[] = ["Basic", "Content", "Brand"];

  return (
    <div className={fullScreen ? "grid h-full min-h-0 grid-cols-[240px_minmax(420px,1fr)_320px]" : "grid grid-cols-[200px_1fr_240px] gap-3 min-h-[480px]"}>
      {/* Palette */}
      <div className={fullScreen ? "border-r-hairline bg-background p-4 overflow-y-auto" : "border-hairline rounded-lg bg-surface/40 p-2.5 overflow-y-auto max-h-[640px]"}>
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold px-1 mb-2">
          Blocks
        </div>
        {groups.map((g) => (
          <div key={g} className="mb-3 last:mb-0">
            <div className="text-[10px] font-medium text-muted-foreground/80 px-1 mb-1.5">{g}</div>
            <div className="grid grid-cols-2 gap-1.5">
              {PALETTE.filter((p) => p.group === g).map((p) => {
                const Icon = p.icon;
                return (
                  <Button
                    variant="outline"
                    key={p.type}
                    draggable
                    onDragStart={() => {
                      dragData.current = { kind: "new", type: p.type };
                    }}
                    onDragEnd={() => {
                      dragData.current = null;
                      setDragOverIdx(null);
                    }}
                    onClick={() => insertAt(blocks.length, { ...createBlock(p.type), ...(p.type === "button" ? { bgColor: appearance.brand } : {}) })}
                    className="h-auto flex flex-col items-center justify-center gap-2 px-2 py-3 text-xs font-normal cursor-grab active:cursor-grabbing text-center"
                    title="Drag into canvas or click to append"
                  >
                    <Icon className="w-4 h-4 text-foreground/70" strokeWidth={1.75} />
                    <span className="leading-tight">{p.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>
        ))}
        {paletteExtra}
      </div>

      {/* Canvas */}
      <div onClick={() => setSelectedId(null)} style={{ backgroundColor: appearance.background }} className={fullScreen ? "p-6 overflow-auto" : "border-hairline rounded-lg p-6 overflow-y-auto max-h-[640px]"}>
        <div aria-label="Email canvas" style={{ backgroundColor: appearance.contentBackground, fontFamily: appearance.fontFamily, width: device === "mobile" ? 375 : appearance.contentWidth, maxWidth: device === "mobile" ? undefined : "100%" }} className="mx-auto email-editor-paper border-hairline p-6 min-h-[420px]">

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
                onInsert={(type) => insertAt(0, createBlock(type))}
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
                    brand={appearance.brand}
                    onAdd={() => insertAt(i + 1, createBlock("text"))}
                    onLayout={(type) => update(b.id, { type, cells: columnCells({ ...b, type }) })}
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
                    onInsert={(type) => insertAt(i + 1, createBlock(type))}
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
      <div data-email-properties className={fullScreen ? "border-l-hairline bg-background p-5 overflow-y-auto" : "border-hairline rounded-md bg-surface/40 p-3"}>
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium mb-2">
          {selected ? `${selected.type} block` : ""}
        </div>
        {!selected ? (
          <EmailAppearanceSettings value={appearance} onChange={(patch) => setAppearance((current) => ({ ...current, ...patch }))} />
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
  onInsert,
}: {
  active: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: () => void;
  onInsert: (type: BlockType) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={(e) => e.stopPropagation()}
      className={`group/insertion relative h-0 z-20 ${active ? "bg-primary/10" : ""}`}
    >
      <div className={`absolute inset-x-0 -top-2 flex h-4 items-center justify-center ${active || open ? "opacity-100" : "opacity-0 hover:opacity-100 focus-within:opacity-100"}`}>
        <span className="absolute inset-x-0 h-px bg-primary" />
        <Button variant="outline" size="icon" title="Add block here" aria-label="Add block here" onClick={() => setOpen(!open)} className="relative h-5 w-5 rounded-full text-primary"><Plus className="h-3 w-3" /></Button>
      </div>
      {open && <div className="absolute left-1/2 top-3 z-30 w-64 -translate-x-1/2 rounded-md border-hairline bg-popover p-2 shadow-md grid grid-cols-2 gap-1">{PALETTE.map((item) => <Button variant="ghost" size="sm" key={item.type} onClick={() => { onInsert(item.type); setOpen(false); }} className="justify-start text-xs"><item.icon className="h-3 w-3" />{item.label}</Button>)}</div>}
    </div>
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
  brand,
  onAdd,
  onLayout,
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
  brand: string;
  onAdd: () => void;
  onLayout: (type: "columns" | "columns3") => void;
}) {
  const html = decorateMergePills(block.type === "divider" ? '<hr style="border:none;border-top:1px solid #e5e5e5;margin:0"/>' : renderBlocksToHtml([block], vars));
  return (
    <div
      data-email-row={block.type}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      style={selected ? { outline: `2px solid ${brand}` } : undefined}
      className="group relative outline-offset-0"
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
        aria-label="Row controls"
        className={`absolute right-0 -top-7 z-10 items-center gap-0.5 bg-background border-hairline rounded shadow-sm p-1 ${
          selected ? "flex" : "hidden group-hover:flex group-focus-within:flex"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {["text", "heading", "quote", "columns", "columns3", "hero", "list"].includes(block.type) && <InsertFieldButton textBlock />}
        {(block.type === "columns" || block.type === "columns3") && <select aria-label="Column layout" title="Column layout" value={block.type} onChange={(e) => onLayout(e.target.value as "columns" | "columns3")} className="h-5 text-xs bg-background"><option value="columns">2 columns</option><option value="columns3">3 columns</option></select>}
        <IconBtn onClick={onAdd} title="Add row"><Plus className="w-3 h-3" /></IconBtn>
        <IconBtn onClick={onMoveUp} disabled={!canUp} title="Move up">
          <ChevronUp className="w-3 h-3" />
        </IconBtn>
        <IconBtn onClick={onMoveDown} disabled={!canDown} title="Move down">
          <ChevronDown className="w-3 h-3" />
        </IconBtn>
        <IconBtn onClick={onDuplicate} title="Duplicate">
          <Copy className="w-3 h-3" />
        </IconBtn>
        <IconBtn onClick={onDelete} disabled={!canDeleteEmailBlock(block)} title={canDeleteEmailBlock(block) ? "Delete" : "Required footer"} danger>
          <Trash2 className="w-3 h-3" />
        </IconBtn>
      </div>
      <div onClick={(e) => { if ((e.target as HTMLElement).closest("a")) e.preventDefault(); }} className={block.type === "spacer" || block.type === "divider" ? "" : "px-1 py-0.5"} dangerouslySetInnerHTML={{ __html: html }} />
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
    <Button variant="ghost"
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`h-5 w-5 inline-flex items-center justify-center rounded hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed ${
        danger ? "text-destructive" : "text-muted-foreground"
      }`}
    >
      {children}
    </Button>
  );
}

function ColumnsEditor({ block, onChange }: { block: EmailBlock; onChange: (patch: Partial<EmailBlock>) => void }) {
  const cells = columnCells(block);
  const [open, setOpen] = useState<string | null>(null);
  const names = cells.length === 3 ? ["Left", "Middle", "Right"] : ["Left", "Right"];
  const setCell = (i: number, next: EmailBlock[]) => onChange({ cells: cells.map((c, j) => (j === i ? next : c)) });
  return (
    <div className="space-y-3">
      {cells.map((cell, i) => (
        <div key={i} className="rounded border-hairline p-2 space-y-1.5">
          <div className="text-[11px] font-medium">{names[i]} column</div>
          {cell.length === 0 && <div className="text-[11px] text-muted-foreground">Empty column</div>}
          {cell.map((child, k) => {
            const label = PALETTE.find((p) => p.type === child.type)?.label ?? child.type;
            const swap = (d: -1 | 1) => { const n = [...cell]; [n[k], n[k + d]] = [n[k + d], n[k]]; setCell(i, n); };
            return (
              <div key={child.id} className="rounded bg-surface/40">
                <div className="flex items-center gap-0.5 px-1.5 py-1">
                  <button type="button" className="flex-1 text-left text-xs" onClick={() => setOpen(open === child.id ? null : child.id)}>{label}</button>
                  <IconBtn onClick={() => swap(-1)} disabled={k === 0} title="Move up"><ChevronUp className="w-3 h-3" /></IconBtn>
                  <IconBtn onClick={() => swap(1)} disabled={k === cell.length - 1} title="Move down"><ChevronDown className="w-3 h-3" /></IconBtn>
                  <IconBtn onClick={() => setCell(i, cell.filter((x) => x.id !== child.id))} title="Delete" danger><Trash2 className="w-3 h-3" /></IconBtn>
                </div>
                {open === child.id && <div className="border-t-hairline p-2"><Inspector block={child} onChange={(patch) => setCell(i, cell.map((x) => (x.id === child.id ? { ...x, ...patch } : x)))} /></div>}
              </div>
            );
          })}
          <select aria-label={`Add block to ${names[i].toLowerCase()} column`} value="" onChange={(e) => { if (!e.target.value) return; const nb = createBlock(e.target.value as BlockType); setCell(i, [...cell, nb]); setOpen(nb.id); }} className="w-full h-7 text-xs px-2 rounded border-hairline bg-background">
            <option value="">+ Add block…</option>
            {COLUMN_CHILD_TYPES.map((t) => <option key={t} value={t}>{PALETTE.find((p) => p.type === t)?.label ?? t}</option>)}
          </select>
        </div>
      ))}
    </div>
  );
}

function Inspector({
  block,
  onChange,
}: {
  block: EmailBlock;
  onChange: (patch: Partial<EmailBlock>) => void;
}) {
  const business = useBusinessSettings();
  const [logoOverride, setLogoOverride] = useState(Boolean(block.src));
  useEffect(() => { setLogoOverride(Boolean(block.src)); }, [block.id]);
  return (
    <div className="space-y-2.5">
      <FieldFallbacks />
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
            <div className="relative"><input id="email-button-url"
              value={block.url ?? ""}
              onChange={(e) => onChange({ url: e.target.value })}
              placeholder="https://"
              className="w-full h-7 text-xs pl-2 pr-9 rounded border-hairline bg-background"
            /><div className="absolute right-0 top-0"><InsertFieldButton inputId="email-button-url" /></div></div>
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
      {(block.type === "columns" || block.type === "columns3") && <ColumnsEditor block={block} onChange={onChange} />}
      {block.type === "hero" && (
        <>
          <Field label="Background image URL"><input value={block.heroImage ?? ""} onChange={(e) => onChange({ heroImage: e.target.value })} placeholder="https://…" className="w-full h-7 text-xs px-2 rounded border-hairline bg-background" /></Field>
          <Field label="Title"><textarea value={block.heroTitle ?? ""} onChange={(e) => onChange({ heroTitle: e.target.value })} rows={2} className="w-full text-xs px-2 py-1.5 rounded border-hairline bg-background" /></Field>
          <Field label="Subtitle"><textarea value={block.heroSubtitle ?? ""} onChange={(e) => onChange({ heroSubtitle: e.target.value })} rows={2} className="w-full text-xs px-2 py-1.5 rounded border-hairline bg-background" /></Field>
          <Field label="CTA label"><input value={block.heroCtaLabel ?? ""} onChange={(e) => onChange({ heroCtaLabel: e.target.value })} className="w-full h-7 text-xs px-2 rounded border-hairline bg-background" /></Field>
          <Field label="CTA URL"><input value={block.heroCtaUrl ?? ""} onChange={(e) => onChange({ heroCtaUrl: e.target.value })} className="w-full h-7 text-xs px-2 rounded border-hairline bg-background" /></Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Background"><input type="color" value={block.bgColor ?? "#0f172a"} onChange={(e) => onChange({ bgColor: e.target.value })} className="w-full h-7 rounded border-hairline bg-background" /></Field>
            <Field label="Text color"><input type="color" value={block.color ?? "#ffffff"} onChange={(e) => onChange({ color: e.target.value })} className="w-full h-7 rounded border-hairline bg-background" /></Field>
          </div>
          <AlignField value={block.align} onChange={(align) => onChange({ align })} />
        </>
      )}
      {block.type === "logo" && (
        <>
          <label className="flex items-center gap-2 text-xs"><Checkbox checked={logoOverride} onCheckedChange={(checked) => { setLogoOverride(checked === true); if (!checked) onChange({ src: "" }); }} />Override for this email</label>
          {logoOverride ? <Field label="Logo URL"><input value={block.src ?? ""} onChange={(e) => onChange({ src: e.target.value })} placeholder="https://…" className="w-full h-7 text-xs px-2 rounded border-hairline bg-background" /></Field> : <div className="text-xs text-muted-foreground">{business.logo ? "Business logo" : "No business logo set"}</div>}
          <Field label={`Height — ${block.height ?? 40}px`}><input type="range" min={20} max={120} step={4} value={block.height ?? 40} onChange={(e) => onChange({ height: Number(e.target.value) })} className="w-full" /></Field>
          <AlignField value={block.align} onChange={(align) => onChange({ align })} />
        </>
      )}
      {block.type === "list" && (
        <>
          <Field label="Items (one per line)">
            <textarea value={(block.items ?? []).join("\n")} onChange={(e) => onChange({ items: e.target.value.split("\n").filter((l) => l.length > 0) })} rows={5} className="w-full text-xs px-2 py-1.5 rounded border-hairline bg-background font-mono" />
          </Field>
          <AlignField value={block.align} onChange={(align) => onChange({ align })} />
        </>
      )}
      {block.type === "quote" && (
        <>
          <Field label="Quote"><textarea value={block.text ?? ""} onChange={(e) => onChange({ text: e.target.value })} rows={3} className="w-full text-xs px-2 py-1.5 rounded border-hairline bg-background" /></Field>
          <Field label="Attribution"><input value={block.label ?? ""} onChange={(e) => onChange({ label: e.target.value })} className="w-full h-7 text-xs px-2 rounded border-hairline bg-background" /></Field>
        </>
      )}
      {block.type === "video" && (
        <>
          <Field label="Thumbnail URL"><input value={block.src ?? ""} onChange={(e) => onChange({ src: e.target.value })} placeholder="https://…" className="w-full h-7 text-xs px-2 rounded border-hairline bg-background" /></Field>
          <Field label="Click-through URL"><input value={block.url ?? ""} onChange={(e) => onChange({ url: e.target.value })} placeholder="https://youtube.com/…" className="w-full h-7 text-xs px-2 rounded border-hairline bg-background" /></Field>
          <AlignField value={block.align} onChange={(align) => onChange({ align })} />
        </>
      )}
      {block.type === "social" && (
        <>
          <Field label="Networks (name | url per line)">
            <textarea
              value={(block.socials ?? []).map((s) => `${s.name} | ${s.url}`).join("\n")}
              onChange={(e) => onChange({ socials: e.target.value.split("\n").map((l) => l.split("|").map((p) => p.trim())).filter((p) => p[0]).map(([name, url]) => ({ name: name ?? "", url: url ?? "" })) })}
              rows={4}
              className="w-full text-xs px-2 py-1.5 rounded border-hairline bg-background font-mono"
            />
          </Field>
          <AlignField value={block.align} onChange={(align) => onChange({ align })} />
        </>
      )}
      {block.type === "footer" && (
        <>
          <div className="text-xs space-y-1"><div>{business.name || "Business name not set"}</div><div className="text-muted-foreground">{business.address || "Business address not set"}</div><div className="text-muted-foreground">Unsubscribe · Required</div></div>
          <Field label="Unsubscribe label"><input value={block.unsubLabel ?? "Unsubscribe"} onChange={(e) => onChange({ unsubLabel: e.target.value })} className="w-full h-7 text-xs px-2 rounded border-hairline bg-background" /></Field>
          <div className="grid grid-cols-2 gap-2"><Field label="Background"><input type="color" value={block.bgColor ?? "#ffffff"} onChange={(e) => onChange({ bgColor: e.target.value })} className="w-full h-7 rounded border-hairline bg-background" /></Field><Field label="Text colour"><input type="color" value={block.color ?? "#888888"} onChange={(e) => onChange({ color: e.target.value })} className="w-full h-7 rounded border-hairline bg-background" /></Field></div>
          <AlignField value={block.align} onChange={(align) => onChange({ align })} />
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
          <Button variant="ghost"
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
          </Button>
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
