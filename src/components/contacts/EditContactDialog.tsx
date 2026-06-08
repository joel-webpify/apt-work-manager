import { useEffect, useState } from "react";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Btn } from "@/components/layout/PageShell";
import type { Contact, ContactType, LifecycleState } from "@/data/mockData";
import { updateContact, createContact } from "@/lib/contactsStore";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Invalid email").max(255),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  type: z.enum(["Residential", "Commercial"]),
  lifecycle: z.enum(["Lead", "Customer", "Lapsed"]),
  source: z.string().trim().max(80).optional().or(z.literal("")),
  postcode: z.string().trim().max(20).optional().or(z.literal("")),
  totalSpend: z.coerce.number().min(0).max(10_000_000),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

const blankContact: Contact = {
  id: "",
  name: "",
  type: "Residential",
  phone: "",
  email: "",
  source: "",
  lifecycle: "Lead",
  lastJob: "—",
  totalSpend: 0,
  postcode: "",
  notes: "",
};

export function EditContactDialog({
  contact,
  open,
  onOpenChange,
  mode = "edit",
}: {
  contact: Contact | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mode?: "edit" | "create";
}) {
  const [form, setForm] = useState<Contact | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setForm(mode === "create" ? { ...blankContact } : contact);
    setErrors({});
  }, [contact, open, mode]);

  if (!form) return null;

  function set<K extends keyof Contact>(k: K, v: Contact[K]) {
    setForm((f) => (f ? { ...f, [k]: v } : f));
  }

  function save() {
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const e: Record<string, string> = {};
      parsed.error.issues.forEach((i) => (e[i.path.join(".")] = i.message));
      setErrors(e);
      return;
    }
    if (mode === "create") {
      createContact(parsed.data as Partial<Contact>);
    } else {
      updateContact(form!.id, parsed.data as Partial<Contact>);
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "New contact" : "Edit contact"}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <Field label="Name" error={errors.name} className="col-span-2">
            <input className={input} value={form.name} maxLength={100} onChange={(e) => set("name", e.target.value)} />
          </Field>
          <Field label="Email" error={errors.email}>
            <input className={input} value={form.email} maxLength={255} onChange={(e) => set("email", e.target.value)} />
          </Field>
          <Field label="Phone" error={errors.phone}>
            <input className={input} value={form.phone} maxLength={40} onChange={(e) => set("phone", e.target.value)} />
          </Field>
          <Field label="Type">
            <select className={input} value={form.type} onChange={(e) => set("type", e.target.value as ContactType)}>
              <option>Residential</option>
              <option>Commercial</option>
            </select>
          </Field>
          <Field label="Lifecycle">
            <select className={input} value={form.lifecycle} onChange={(e) => set("lifecycle", e.target.value as LifecycleState)}>
              <option>Lead</option>
              <option>Customer</option>
              <option>Lapsed</option>
            </select>
          </Field>
          <Field label="Lead source" error={errors.source}>
            <input className={input} value={form.source} maxLength={80} onChange={(e) => set("source", e.target.value)} />
          </Field>
          <Field label="Postcode" error={errors.postcode}>
            <input className={input} value={form.postcode} maxLength={20} onChange={(e) => set("postcode", e.target.value)} />
          </Field>
          <Field label="Total spend (£)" error={errors.totalSpend} className="col-span-2">
            <input
              className={input}
              type="number"
              min={0}
              value={form.totalSpend}
              onChange={(e) => set("totalSpend", Number(e.target.value) as Contact["totalSpend"])}
            />
          </Field>
          <Field label="Notes" error={errors.notes} className="col-span-2">
            <textarea
              className={`${input} min-h-[80px] resize-none`}
              value={form.notes ?? ""}
              maxLength={2000}
              onChange={(e) => set("notes", e.target.value)}
            />
          </Field>
        </div>

        <DialogFooter>
          <Btn onClick={() => onOpenChange(false)}>Cancel</Btn>
          <Btn variant="primary" onClick={save}>
            {mode === "create" ? "Create contact" : "Save changes"}
          </Btn>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const input =
  "w-full h-9 px-2.5 border-hairline rounded-md bg-background text-sm focus:outline-none focus:border-primary/40";

function Field({
  label, error, children, className,
}: {
  label: string; error?: string; children: React.ReactNode; className?: string;
}) {
  return (
    <label className={`flex flex-col gap-1 ${className ?? ""}`}>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
      {error && <span className="text-xs text-[hsl(var(--destructive))]">{error}</span>}
    </label>
  );
}
