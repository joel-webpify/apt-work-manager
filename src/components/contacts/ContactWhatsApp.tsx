import { useWhatsApp, setConsent, type WaConsent } from "@/lib/whatsappStore";

export function ContactWhatsApp({ contactId }: { contactId: string }) {
  const { consents, messages } = useWhatsApp();
  const last = messages.find((m) => m.contactId === contactId);
  return <section>
    <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">WhatsApp</div>
    <select aria-label="WhatsApp consent" value={consents[contactId] ?? "not_set"} onChange={(e) => setConsent(contactId, e.target.value as WaConsent)} className="h-9 w-full rounded-md border-hairline bg-background px-2.5 text-sm focus:outline-none focus:border-primary/40">
      <option value="not_set">Not set</option>
      <option value="utility">Booking updates only</option>
      <option value="all">Booking updates + marketing</option>
      <option value="opted_out">Opted out</option>
    </select>
    <p className="mt-1.5 text-xs text-muted-foreground">{last ? `Last message: ${last.template} · ${new Date(last.at).toLocaleDateString()}` : "No WhatsApp messages sent yet."}</p>
  </section>;
}
