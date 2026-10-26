import { useWhatsApp } from "@/lib/whatsappStore";

const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : "–");

export function Results() {
  const { campaigns, conversations } = useWhatsApp();
  const sent = campaigns.filter((c) => c.status === "Sent");
  const sum = (k: "recipients" | "delivered" | "read" | "failed" | "skipped") => sent.reduce((n, c) => n + c[k], 0);
  const replied = conversations.filter((c) => c.messages.some((m) => m.dir === "in")).length;
  const kpis = [["Sent", sum("recipients")], ["Delivered", sum("delivered")], ["Read", sum("read")], ["Replied", replied], ["Failed", sum("failed")], ["Skipped", sum("skipped")]] as const;
  const skipped = sum("skipped");
  const reasons = [["No WhatsApp marketing consent", 0.55], ["No mobile number", 0.3], ["Opted out of WhatsApp", 0.15]] as const;
  const byTemplate = Object.values(sent.reduce<Record<string, { name: string; sent: number; read: number }>>((a, c) => { const r = a[c.template] ??= { name: c.template, sent: 0, read: 0 }; r.sent += c.recipients; r.read += c.read; return a; }, {}));
  return <div className="space-y-5">
    <div className="grid grid-cols-3 md:grid-cols-6 gap-2">{kpis.map(([l, v]) => <div key={l} className="rounded-lg border-hairline bg-card p-3"><div className="text-xs text-muted-foreground">{l}</div><div className="text-xl font-medium mt-1">{v}</div></div>)}</div>
    <div className="grid md:grid-cols-2 gap-4">
      <div className="rounded-lg border-hairline bg-card p-4"><h3 className="text-sm font-medium mb-3">Per campaign</h3>
        <table className="w-full text-sm"><thead className="text-xs text-muted-foreground"><tr><th className="text-left font-normal pb-2">Campaign</th><th className="text-right font-normal">Delivered</th><th className="text-right font-normal">Read</th></tr></thead>
          <tbody>{sent.map((c) => <tr key={c.id} className="border-t-hairline"><td className="py-2">{c.name}</td><td className="text-right">{pct(c.delivered, c.recipients)}</td><td className="text-right">{pct(c.read, c.delivered)}</td></tr>)}</tbody></table>
      </div>
      <div className="rounded-lg border-hairline bg-card p-4"><h3 className="text-sm font-medium mb-3">Per template</h3>
        {byTemplate.map((t) => <div key={t.name} className="flex justify-between text-sm py-1.5 border-t-hairline first:border-0"><span className="font-mono">{t.name}</span><span>{t.sent} sent · {pct(t.read, t.sent)} read</span></div>)}
      </div>
      <div className="rounded-lg border-hairline bg-card p-4 md:col-span-2"><h3 className="text-sm font-medium mb-3">Why people were skipped</h3>
        {reasons.map(([r, s]) => { const n = Math.round(skipped * s); return <div key={r} className="mb-2"><div className="flex justify-between text-xs mb-1"><span>{r}</span><span>{n}</span></div><div className="h-1.5 rounded-full bg-surface"><div className="h-full rounded-full bg-primary" style={{ width: `${s * 100}%` }} /></div></div>; })}
        <p className="text-[11px] text-muted-foreground mt-2">Sample figures for the demo.</p>
      </div>
    </div>
  </div>;
}
