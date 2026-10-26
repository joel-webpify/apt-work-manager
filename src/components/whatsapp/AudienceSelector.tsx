import { employees } from "@/data/mockData";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Btn } from "@/components/layout/PageShell";
import { audienceSegments, emptyAudienceFilters, type AudienceFilters } from "@/lib/whatsappAudience";

const selectClass = "mt-1 h-9 w-full rounded-md border-hairline bg-background px-2.5 text-sm";

export function AudienceSelector({ segment, onSegment, value, onChange, sources, tags, matched, receive, skipped }: {
  segment: string; onSegment: (v: string) => void; value: AudienceFilters; onChange: (v: AudienceFilters) => void;
  sources: string[]; tags: string[]; matched: number; receive: number; skipped: number;
}) {
  const update = (key: keyof AudienceFilters, v: string) => onChange({ ...value, [key]: v });
  const select = (label: string, key: keyof AudienceFilters, options: [string, string][]) => <label className="block text-xs font-medium">{label}
    <select aria-label={label} className={selectClass} value={String(value[key])} onChange={(e) => update(key, e.target.value)}>
      <option value="any">Any</option>{options.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
    </select></label>;
  return <div className="space-y-4">
    <label className="block text-xs font-medium">Segment<select aria-label="Segment" className={selectClass} value={segment} onChange={(e) => onSegment(e.target.value)}>
      {[...new Set(audienceSegments.map((s) => s.group))].map((group) => <optgroup key={group} label={group}>{audienceSegments.filter((s) => s.group === group).map((s) => <option key={s.name}>{s.name}</option>)}</optgroup>)}
    </select></label>
    <div className="flex items-center justify-between border-t-hairline pt-3"><h3 className="text-sm font-medium">Refine audience</h3><Btn variant="ghost" onClick={() => onChange({ ...emptyAudienceFilters, tags: [] })}>Reset filters</Btn></div>
    <div className="grid gap-3 sm:grid-cols-2">
      {select("Customer status", "lifecycle", ["Lead", "Customer", "Lapsed"].map((s) => [s, s]))}
      {select("Customer type", "type", ["Residential", "Commercial"].map((s) => [s, s]))}
      {select("Lead source", "source", sources.map((s) => [s, s]))}
      {select("Contact owner", "owner", [["unassigned", "Unassigned"], ...employees.map((e): [string, string] => [e.id, e.name])])}
      {select("Last job", "lastJob", [["within:30", "Within 30 days"], ["within:90", "Within 90 days"], ["over:180", "Over 6 months ago"], ["over:365", "Over 12 months ago"], ["over:730", "Over 24 months ago"], ["never", "Never booked"]])}
      {select("WhatsApp consent", "consent", [["all", "Marketing + booking updates"], ["utility", "Booking updates only"], ["not_set", "Not recorded"], ["opted_out", "Opted out"]])}
      <label className="block text-xs font-medium">Postcode prefixes<Input aria-label="Postcode prefixes" className="mt-1" placeholder="BS, BA, GL" value={value.postcode} onChange={(e) => update("postcode", e.target.value)} /></label>
      <div className="grid grid-cols-2 gap-2">{(["minSpend", "maxSpend"] as const).map((key, i) => <label key={key} className="block text-xs font-medium">{i ? "Maximum spend" : "Minimum spend"}<Input aria-label={i ? "Maximum spend" : "Minimum spend"} className="mt-1" type="number" min="0" placeholder="Any" value={value[key]} onChange={(e) => update(key, e.target.value)} /></label>)}</div>
    </div>
    <fieldset><legend className="text-xs font-medium mb-2">Tags — match any selected</legend><div className="flex flex-wrap gap-x-4 gap-y-2">{tags.length ? tags.map((tag) => <label key={tag} className="flex items-center gap-2 text-sm"><Checkbox checked={value.tags.includes(tag)} onCheckedChange={(checked) => onChange({ ...value, tags: checked ? [...value.tags, tag] : value.tags.filter((t) => t !== tag) })} />{tag}</label>) : <span className="text-xs text-muted-foreground">No tagged contacts</span>}</div></fieldset>
    <div className="flex flex-wrap gap-x-5 gap-y-1 border-t-hairline pt-3 text-sm" aria-live="polite"><span><b>{matched}</b> matching contacts</span><span className="text-primary"><b>{receive}</b> eligible</span><span className="text-muted-foreground"><b>{skipped}</b> skipped</span></div>
  </div>;
}