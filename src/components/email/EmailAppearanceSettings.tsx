import { FieldFallbacks } from "./MergeFields";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export interface EmailAppearance {
  background: string;
  contentBackground: string;
  brand: string;
  fontFamily: string;
  contentWidth: number;
}

export const defaultEmailAppearance: EmailAppearance = {
  background: "#eef1f4", contentBackground: "#ffffff", brand: "#347ba8",
  fontFamily: "Arial, sans-serif", contentWidth: 600,
};

export function EmailAppearanceSettings({ value, onChange }: {
  value: EmailAppearance;
  onChange: (patch: Partial<EmailAppearance>) => void;
}) {
  return <div className="space-y-5">
    <FieldFallbacks />
    <h2 className="text-sm font-medium">Email settings</h2>
    {([['background', 'Background colour'], ['contentBackground', 'Content background'], ['brand', 'Brand / button colour']] as const).map(([key, label]) => <div key={key} className="flex items-center justify-between gap-3">
      <Label htmlFor={`email-${key}`} className="text-xs">{label}</Label>
      <input id={`email-${key}`} type="color" value={value[key]} onChange={(e) => onChange({ [key]: e.target.value })} className="h-8 w-10 cursor-pointer rounded border-hairline bg-background p-1" />
    </div>)}
    <div className="space-y-2"><Label htmlFor="email-font" className="text-xs">Font family</Label><select id="email-font" value={value.fontFamily} onChange={(e) => onChange({ fontFamily: e.target.value })} className="h-9 w-full rounded-md border-hairline bg-background px-2 text-sm"><option value="Arial, sans-serif">Arial</option><option value="Verdana, sans-serif">Verdana</option><option value="Tahoma, sans-serif">Tahoma</option><option value="'Trebuchet MS', sans-serif">Trebuchet MS</option></select></div>
    <div className="space-y-2"><Label htmlFor="email-width" className="text-xs">Content width</Label><div className="flex items-center gap-2"><Input id="email-width" type="number" min={320} max={600} step={10} value={value.contentWidth} onChange={(e) => { const width = Number(e.target.value); if (width >= 320 && width <= 600) onChange({ contentWidth: width }); }} /><span className="text-xs text-muted-foreground">px</span></div></div>
    <p className="text-xs text-muted-foreground">Appearance preview for this session only.</p>
  </div>;
}