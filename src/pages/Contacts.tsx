import { useMemo, useState } from "react";
import { PageHeader, PageBody, Btn, Pill } from "@/components/layout/PageShell";
import { Search, Filter, Plus, Upload, Phone, Mail, ArrowUpDown, Users } from "lucide-react";
import { contacts as mockContacts, type Contact } from "@/data/mockData";
import { ImportContactsDialog } from "@/components/contacts/ImportContactsDialog";
import { useImportedContacts, mergeWithMock, useContactExtras, applyExtrasTo } from "@/lib/contactsStore";
import { ContactKpis } from "@/components/contacts/ContactKpis";
import { BulkActionsBar } from "@/components/contacts/BulkActionsBar";
import { ContactPanel } from "@/components/contacts/ContactPanel";
import { EditContactDialog } from "@/components/contacts/EditContactDialog";
import { initials, avatarColor } from "@/lib/avatar";

type SortKey = "name" | "lastJob" | "totalSpend";
type SortDir = "asc" | "desc";

export default function Contacts() {
  const [selected, setSelected] = useState<Contact | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"All" | "Lead" | "Customer" | "Lapsed">("All");
  const [importOpen, setImportOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const imported = useImportedContacts();
  const extras = useContactExtras();
  const contacts = useMemo(
    () => applyExtrasTo(mergeWithMock(mockContacts, imported), extras),
    [imported, extras],
  );

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    const list = contacts.filter(
      (c) =>
        (filter === "All" || c.lifecycle === filter) &&
        (c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)),
    );
    list.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortKey === "totalSpend") return ((a.totalSpend || 0) - (b.totalSpend || 0)) * dir;
      const av = String(a[sortKey] ?? "").toLowerCase();
      const bv = String(b[sortKey] ?? "").toLowerCase();
      return av.localeCompare(bv) * dir;
    });
    return list;
  }, [contacts, query, filter, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function toggleAll(on: boolean) {
    setChecked(on ? new Set(filtered.map((c) => c.id)) : new Set());
  }
  function toggleOne(id: string) {
    const n = new Set(checked);
    n.has(id) ? n.delete(id) : n.add(id);
    setChecked(n);
  }

  function exportSelected() {
    const rows = contacts.filter((c) => checked.has(c.id));
    const headers = ["name", "type", "phone", "email", "source", "lifecycle", "lastJob", "totalSpend", "postcode"];
    const csv = [
      headers.join(","),
      ...rows.map((r) =>
        headers.map((h) => `"${String((r as any)[h] ?? "").replace(/"/g, '""')}"`).join(","),
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contacts-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const allOnPage = filtered.length > 0 && filtered.every((c) => checked.has(c.id));

  return (
    <>
      <PageHeader
        title="Contacts & leads"
        description="Every customer and lead in one place"
        actions={
          <>
            <Btn onClick={() => setImportOpen(true)}><Upload className="w-3.5 h-3.5" /> Import CSV</Btn>
            <Btn variant="primary"><Plus className="w-3.5 h-3.5" /> New contact</Btn>
          </>
        }
      />
      <PageBody>
        <ContactKpis contacts={contacts} />

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

        {filtered.length === 0 ? (
          <EmptyState onImport={() => setImportOpen(true)} />
        ) : (
          <div className="border-hairline rounded-lg bg-card overflow-hidden">
            <div className="grid grid-cols-[36px_2.4fr_1fr_1.6fr_1.4fr_1fr_120px] px-4 h-10 items-center text-xs text-muted-foreground font-medium border-b-hairline bg-surface/50">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={allOnPage}
                  onChange={(e) => toggleAll(e.target.checked)}
                  className="rounded border-input"
                />
              </div>
              <SortHeader label="Name" active={sortKey === "name"} dir={sortDir} onClick={() => toggleSort("name")} />
              <div>Lifecycle</div>
              <div>Tags</div>
              <SortHeader label="Last activity" active={sortKey === "lastJob"} dir={sortDir} onClick={() => toggleSort("lastJob")} />
              <SortHeader label="Total spend" active={sortKey === "totalSpend"} dir={sortDir} onClick={() => toggleSort("totalSpend")} align="right" />
              <div></div>
            </div>
            {filtered.map((c) => {
              const isChecked = checked.has(c.id);
              const av = avatarColor(c.email || c.name);
              return (
                <div
                  key={c.id}
                  className={`group grid grid-cols-[36px_2.4fr_1fr_1.6fr_1.4fr_1fr_120px] px-4 h-14 items-center text-sm border-b-hairline last:border-b-0 transition-colors relative ${
                    isChecked ? "bg-primary/5" : "hover:bg-surface-hover"
                  }`}
                >
                  {isChecked && <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary" />}
                  <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleOne(c.id)}
                      className="rounded border-input"
                    />
                  </div>
                  <button onClick={() => setSelected(c)} className="text-left flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${av.bg} ${av.fg}`}>
                      {initials(c.name)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium truncate">{c.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{c.email}</div>
                    </div>
                  </button>
                  <div>
                    <Pill tone={c.lifecycle === "Customer" ? "success" : c.lifecycle === "Lead" ? "info" : "neutral"}>
                      {c.lifecycle}
                    </Pill>
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    <Chip>{c.type}</Chip>
                    {c.source && <Chip>{c.source}</Chip>}
                    {(extras[c.id]?.tags ?? []).map((t) => (
                      <span key={t} className="inline-flex items-center h-5 px-1.5 rounded bg-primary/10 text-primary text-[11px] font-medium">
                        {t}
                      </span>
                    ))}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    <div>{c.lastJob || <span className="text-muted-foreground/60">No activity</span>}</div>
                    {c.phone && <div className="tabular-nums">{c.phone}</div>}
                  </div>
                  <div className="text-right font-medium tabular-nums">£{c.totalSpend.toLocaleString()}</div>
                  <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {c.phone && (
                      <a href={`tel:${c.phone}`} className="w-7 h-7 rounded-md border-hairline bg-background hover:bg-surface-hover flex items-center justify-center" aria-label="Call">
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {c.email && (
                      <a href={`mailto:${c.email}`} className="w-7 h-7 rounded-md border-hairline bg-background hover:bg-surface-hover flex items-center justify-center" aria-label="Email">
                        <Mail className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button className="w-7 h-7 rounded-md border-hairline bg-background hover:bg-surface-hover flex items-center justify-center" aria-label="New job">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </PageBody>

      <BulkActionsBar
        count={checked.size}
        onClear={() => setChecked(new Set())}
        onTag={() => alert("Tagging is coming soon")}
        onExport={exportSelected}
        onDelete={() => setChecked(new Set())}
      />

      {selected && <ContactPanel contact={selected} onClose={() => setSelected(null)} />}
      <ImportContactsDialog open={importOpen} onOpenChange={setImportOpen} />
    </>
  );
}

function SortHeader({
  label, active, dir, onClick, align,
}: {
  label: string; active: boolean; dir: SortDir; onClick: () => void; align?: "right";
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 hover:text-foreground transition-colors ${
        align === "right" ? "justify-end" : ""
      } ${active ? "text-foreground" : ""}`}
    >
      {label}
      <ArrowUpDown className={`w-3 h-3 ${active ? "opacity-100" : "opacity-40"}`} />
      {active && <span className="text-[10px]">{dir === "asc" ? "↑" : "↓"}</span>}
    </button>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center h-5 px-1.5 rounded bg-surface text-[11px] text-muted-foreground">
      {children}
    </span>
  );
}

function EmptyState({ onImport }: { onImport: () => void }) {
  return (
    <div className="border-hairline rounded-lg bg-card py-16 flex flex-col items-center text-center px-6">
      <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center mb-4">
        <Users className="w-5 h-5 text-muted-foreground" />
      </div>
      <h3 className="text-base font-medium mb-1">No contacts match</h3>
      <p className="text-sm text-muted-foreground mb-5 max-w-sm">
        Try clearing your search or filters, or import your existing customer list to get started.
      </p>
      <div className="flex gap-2">
        <Btn onClick={onImport}><Upload className="w-3.5 h-3.5" /> Import CSV</Btn>
        <Btn variant="primary"><Plus className="w-3.5 h-3.5" /> New contact</Btn>
      </div>
    </div>
  );
}
