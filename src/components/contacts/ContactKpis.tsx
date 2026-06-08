import type { Contact } from "@/data/mockData";

export function ContactKpis({ contacts }: { contacts: Contact[] }) {
  const total = contacts.length;
  const leads = contacts.filter((c) => c.lifecycle === "Lead").length;
  const customers = contacts.filter((c) => c.lifecycle === "Customer").length;
  const lapsed = contacts.filter((c) => c.lifecycle === "Lapsed").length;
  const ltv = contacts.reduce((s, c) => s + (c.totalSpend || 0), 0);

  const items = [
    { label: "Total contacts", value: total.toLocaleString() },
    { label: "Leads", value: leads.toLocaleString() },
    { label: "Customers", value: customers.toLocaleString() },
    { label: "Lapsed", value: lapsed.toLocaleString() },
    { label: "Lifetime value", value: `£${ltv.toLocaleString()}`, accent: true },
  ];

  return (
    <div className="grid grid-cols-5 gap-3 mb-5">
      {items.map((it) => (
        <div
          key={it.label}
          className={`border-hairline rounded-lg px-4 py-3 ${
            it.accent ? "bg-primary/5 border-primary/20" : "bg-card"
          }`}
        >
          <div className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">
            {it.label}
          </div>
          <div
            className={`mt-1 text-xl font-semibold tabular-nums ${
              it.accent ? "text-primary" : "text-foreground"
            }`}
          >
            {it.value}
          </div>
        </div>
      ))}
    </div>
  );
}
