import { useMemo, useState } from "react";
import { PageHeader, PageBody, Btn, Pill } from "@/components/layout/PageShell";
import { Search, X, Filter, Plus, Upload } from "lucide-react";
import { contacts as mockContacts, type Contact, jobs } from "@/data/mockData";
import { ImportContactsDialog } from "@/components/contacts/ImportContactsDialog";
import { useImportedContacts, mergeWithMock } from "@/lib/contactsStore";

export default function Contacts() {
  const [selected, setSelected] = useState<Contact | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"All" | "Lead" | "Customer" | "Lapsed">("All");

  const filtered = contacts.filter(
    (c) =>
      (filter === "All" || c.lifecycle === filter) &&
      (c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.email.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <>
      <PageHeader
        title="Contacts & leads"
        description="Every customer and lead in one place"
        actions={<Btn variant="primary"><Plus className="w-3.5 h-3.5" /> New contact</Btn>}
      />
      <PageBody>
        <div className="flex items-center gap-2 mb-4">
          <div className="flex-1 relative max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or email…"
              className="w-full h-8 pl-8 pr-3 border-hairline rounded-md bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/40"
            />
          </div>
          <div className="flex border-hairline rounded-md overflow-hidden">
            {["All", "Lead", "Customer", "Lapsed"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`h-8 px-3 text-sm transition-colors ${
                  filter === f ? "bg-surface text-foreground font-medium" : "text-muted-foreground hover:bg-surface-hover"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <Btn><Filter className="w-3.5 h-3.5" /> Service type</Btn>
        </div>

        <div className="border-hairline rounded-lg bg-card overflow-hidden">
          <div className="grid grid-cols-[2fr_1fr_1.2fr_1.5fr_1fr_1fr_1fr_0.8fr] px-4 h-9 items-center text-xs text-muted-foreground font-medium border-b-hairline bg-surface/50">
            <div>Name</div><div>Type</div><div>Phone</div><div>Email</div><div>Source</div><div>Lifecycle</div><div>Last job</div><div className="text-right">Total spend</div>
          </div>
          {filtered.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelected(c)}
              className="w-full text-left grid grid-cols-[2fr_1fr_1.2fr_1.5fr_1fr_1fr_1fr_0.8fr] px-4 h-10 items-center text-sm border-b-hairline last:border-b-0 hover:bg-surface-hover transition-colors"
            >
              <div className="font-medium truncate">{c.name}</div>
              <div className="text-muted-foreground">{c.type}</div>
              <div className="text-muted-foreground tabular-nums">{c.phone}</div>
              <div className="text-muted-foreground truncate">{c.email}</div>
              <div className="text-muted-foreground truncate">{c.source}</div>
              <div>
                <Pill tone={c.lifecycle === "Customer" ? "success" : c.lifecycle === "Lead" ? "info" : "neutral"}>
                  {c.lifecycle}
                </Pill>
              </div>
              <div className="text-muted-foreground">{c.lastJob}</div>
              <div className="text-right font-medium tabular-nums">£{c.totalSpend.toLocaleString()}</div>
            </button>
          ))}
        </div>
      </PageBody>

      {selected && <ContactPanel contact={selected} onClose={() => setSelected(null)} />}
    </>
  );
}

function ContactPanel({ contact, onClose }: { contact: Contact; onClose: () => void }) {
  const history = jobs.filter((j) => j.contactId === contact.id);
  return (
    <>
      <div className="fixed inset-0 bg-black/25 z-40 animate-fade-in" onClick={onClose} />
      <aside className="fixed top-0 right-0 h-screen w-[460px] bg-background border-l-hairline z-50 flex flex-col animate-slide-in-right">
        <header className="h-14 px-5 flex items-center justify-between border-b-hairline">
          <span className="text-sm font-medium">Contact</span>
          <button onClick={onClose} className="w-7 h-7 rounded-md hover:bg-surface-hover flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div>
            <h2 className="text-lg font-medium">{contact.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Pill tone={contact.lifecycle === "Customer" ? "success" : contact.lifecycle === "Lead" ? "info" : "neutral"}>{contact.lifecycle}</Pill>
              <span className="text-xs text-muted-foreground">{contact.type}</span>
            </div>
          </div>

          <div className="space-y-1.5 text-sm">
            <Row label="Phone" value={contact.phone} />
            <Row label="Email" value={contact.email} />
            <Row label="Postcode" value={contact.postcode} />
            <Row label="Lead source" value={contact.source} />
            <Row label="Total spend" value={`£${contact.totalSpend.toLocaleString()}`} />
          </div>

          <div>
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Job history</div>
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground">No jobs yet.</p>
            ) : (
              <div className="space-y-1.5">
                {history.map((j) => (
                  <div key={j.id} className="flex items-center justify-between text-sm border-hairline rounded-md px-3 h-9">
                    <span className="truncate">{j.service}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">{j.stage}</span>
                      <span className="font-medium tabular-nums">£{j.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Notes</div>
            <textarea
              defaultValue={contact.notes}
              placeholder="Add a note…"
              className="w-full min-h-[80px] border-hairline rounded-md p-2.5 text-sm bg-background resize-none focus:outline-none focus:border-primary/40"
            />
          </div>
        </div>
      </aside>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}
