import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { readBusinessSettings, saveBusinessSettings, type BusinessSettings } from "@/lib/businessSettings";
import { toast } from "@/hooks/use-toast";

export function BusinessSettingsTab() {
  const [draft, setDraft] = useState(readBusinessSettings);
  return <div className="max-w-xl space-y-5">
    <h2 className="text-lg font-medium">Business details</h2>
    {([['name', 'Business name'], ['phone', 'Business phone'], ['address', 'Business address'], ['logo', 'Logo URL'], ['bookingLink', 'Booking link'], ['email', 'Business email'], ['website', 'Business website'], ['orgNumber', 'Organisation number'], ['senderName', 'Sender name'], ['locale', 'Locale'], ['timezone', 'Timezone'], ['currency', 'Currency']] as [keyof BusinessSettings, string][]).map(([key, label]) => <div key={key} className="space-y-2"><Label htmlFor={`business-${key}`}>{label}</Label><Input id={`business-${key}`} value={draft[key] ?? ""} onChange={(e) => setDraft({ ...draft, [key]: e.target.value })} /></div>)}
    <div className="flex items-center gap-4"><Label htmlFor="business-brand">Brand colour</Label><input id="business-brand" type="color" value={draft.brandColour} onChange={(e) => setDraft({ ...draft, brandColour: e.target.value })} className="w-12 h-9 border-hairline bg-background rounded p-1" /></div>
    {draft.logo && <img src={draft.logo} alt="Business logo" className="h-12 max-w-48 object-contain" />}
    <Button onClick={() => { saveBusinessSettings(draft); toast({ title: "Business settings saved" }); }}>Save</Button>
  </div>;
}