import { createContext, useContext, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Braces, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { mergeFieldGroups, availableMergeGroups, unavailableGroupReason, type MergeGroup } from '@/lib/emailMergeFields';
export { mergeFieldGroups } from '@/lib/emailMergeFields';
const FallbackContext = createContext<{ target: TextTarget | null; refresh: () => void }>({ target: null, refresh: () => {} });
type TextTarget = HTMLInputElement | HTMLTextAreaElement;
const MergeContext = createContext<(target?: TextTarget | null) => void>(() => {});
const isTextTarget = (target: EventTarget | null): target is TextTarget => target instanceof HTMLTextAreaElement || (target instanceof HTMLInputElement && ["text", "search", "email", "url"].includes(target.type));

export function MergeFieldsProvider({ children, trigger = "broadcast" }: { children: ReactNode; trigger?: string }) {
  const lastTarget = useRef<TextTarget | null>(null);
  const [activeTarget, setActiveTarget] = useState<TextTarget | null>(null);
  const [, redraw] = useState(0);
  const refresh = () => redraw(v => v + 1);
  const available = availableMergeGroups(trigger);
  const caret = useRef({ start: 0, end: 0 });
  const [anchor, setAnchor] = useState<{ left: number; top: number } | null>(null);
  const [search, setSearch] = useState("");
  const open = (target?: TextTarget | null) => {
    const field = target ?? lastTarget.current;
    if (!field || field.disabled) return;
    setActiveTarget(field);
    lastTarget.current = field;
    caret.current = { start: field.selectionStart ?? field.value.length, end: field.selectionEnd ?? field.value.length };
    const rect = field.getBoundingClientRect();
    setAnchor({ left: Math.max(8, Math.min(rect.left, window.innerWidth - 312)), top: Math.max(8, Math.min(rect.bottom + 5, window.innerHeight - 430)) });
    setSearch("");
  };
  const insert = (key: string) => {
    const field = lastTarget.current;
    if (!field) return;
    let { start, end } = caret.current;
    if (field.value.slice(0, start).endsWith("{{")) start -= 2;
    const token = `{{${key}}}`;
    const next = field.value.slice(0, start) + token + field.value.slice(end);
    const setter = Object.getOwnPropertyDescriptor(field instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype, "value")?.set;
    setter?.call(field, next);
    field.dispatchEvent(new Event("input", { bubbles: true }));
    setAnchor(null);
    requestAnimationFrame(() => { field.focus(); field.setSelectionRange(start + token.length, start + token.length); });
  };
  const matches = Object.entries(mergeFieldGroups).map(([group, fields]) => ({ group, fields: fields.filter((key) => key.includes(search.toLowerCase().replace(/ /g, "_"))) })).filter((item) => item.fields.length);
  return <FallbackContext.Provider value={{ target: activeTarget, refresh }}><MergeContext.Provider value={open}>
    <div className="contents" onFocusCapture={(e) => { if (isTextTarget(e.target) && !e.target.closest("[data-merge-fallbacks]")) { lastTarget.current = e.target; setActiveTarget(e.target); } }} onInputCapture={(e) => {
      if (isTextTarget(e.target) && !e.target.closest("[data-merge-fallbacks]")) requestAnimationFrame(refresh);
      if (isTextTarget(e.target) && !e.target.closest("[data-merge-fallbacks]") && e.target.value.slice(0, e.target.selectionStart ?? 0).endsWith("{{")) open(e.target);
    }}>{children}</div>
    {anchor && createPortal(<>
      <div className="fixed inset-0 z-[85]" onClick={() => setAnchor(null)} />
      <div role="dialog" aria-label="Insert field" style={anchor} className="fixed z-[90] w-[304px] rounded-md border-hairline bg-popover p-3 shadow-md">
        <div className="flex items-center gap-2 mb-3"><Search className="h-4 w-4 text-muted-foreground" /><Input autoFocus aria-label="Search fields" placeholder="Search fields…" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => { if (e.key === "Escape") setAnchor(null); if (e.key === "Enter") { const first = matches.find(m => available.includes(m.group as MergeGroup))?.fields[0]; if (first) insert(first); } }} /><Button variant="ghost" size="icon" className="h-7 w-7" title="Close" aria-label="Close fields" onClick={() => setAnchor(null)}><X /></Button></div>
        <div className="max-h-80 overflow-auto">{matches.map(({ group, fields }) => <div key={group} className="mb-3" title={available.includes(group as MergeGroup) ? undefined : unavailableGroupReason(group as MergeGroup)}><div className="px-2 py-1 text-xs font-medium text-muted-foreground">{group}</div>{fields.map((key) => <Button key={key} disabled={!available.includes(group as MergeGroup)} variant="ghost" size="sm" className="w-full justify-start font-mono text-xs" onClick={() => insert(key)}>{`{{${key}}}`}</Button>)}</div>)}{!matches.length && <p className="p-2 text-xs text-muted-foreground">No fields found</p>}</div>
      </div>
    </>, document.body)}
  </MergeContext.Provider></FallbackContext.Provider>;
}

export function InsertFieldButton({ inputId, textBlock = false }: { inputId?: string; textBlock?: boolean }) {
  const open = useContext(MergeContext);
  return <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" aria-label="Insert field" title="Insert field" onMouseDown={(e) => e.preventDefault()} onClick={(e) => {
    const target = inputId ? document.getElementById(inputId) : textBlock ? document.querySelector('[data-email-properties] textarea') : e.currentTarget.parentElement?.querySelector('textarea, input[type="text"], input:not([type])');
    open(isTextTarget(target) ? target : undefined);
  }}><Braces className="h-4 w-4" /></Button>;
}
export function FieldFallbacks() {
  const { target, refresh } = useContext(FallbackContext);
  if (!target?.isConnected) return null;
  const matches = [...new Map(Array.from(target.value.matchAll(/\{\{([a-z_]+)(?:\|([^{}]*))?\}\}/g), m => [m[1], m[2] || ''])).entries()];
  if (!matches.length) return null;
  return <div data-merge-fallbacks className="space-y-2 border-t-hairline pt-3"><h3 className="text-xs font-medium">Field fallbacks</h3>{matches.map(([key, value]) => <label key={key} className="block space-y-1 text-xs text-muted-foreground">{key}<Input aria-label={`Fallback for ${key}`} value={value} placeholder="Leave empty" onChange={e => {
    const fallback = e.target.value.replace(/[{}]/g, '');
    const next = target.value.replace(new RegExp(`\\{\\{${key}(?:\\|[^{}]*)?\\}\\}`, 'g'), () => `{{${key}${fallback ? `|${fallback}` : ''}}}`);
    const setter = Object.getOwnPropertyDescriptor(target instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype, 'value')?.set;
    setter?.call(target,next); target.dispatchEvent(new Event('input',{ bubbles:true })); refresh();
  }} /></label>)}</div>;
}
