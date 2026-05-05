import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Btn } from "@/components/layout/PageShell";
import { contacts, stages, type Job, type PipelineStage, type Trade } from "@/data/mockData";

const trades: Trade[] = ["Plumbing", "Electrical", "Window cleaning", "Landscaping", "General"];

export default function NewJobDialog({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreate: (job: Job) => void;
}) {
  const [contactId, setContactId] = useState<string>("");
  const [customCustomer, setCustomCustomer] = useState("");
  const [service, setService] = useState("");
  const [trade, setTrade] = useState<Trade>("General");
  const [value, setValue] = useState<string>("");
  const [estimatedHours, setEstimatedHours] = useState<string>("2");
  const [stage, setStage] = useState<PipelineStage>("New enquiry");
  const [address, setAddress] = useState("");
  const [postcode, setPostcode] = useState("");
  const [notes, setNotes] = useState("");

  const reset = () => {
    setContactId(""); setCustomCustomer(""); setService(""); setTrade("General");
    setValue(""); setEstimatedHours("2"); setStage("New enquiry");
    setAddress(""); setPostcode(""); setNotes("");
  };

  const submit = () => {
    const contact = contacts.find((c) => c.id === contactId);
    const customer = contact?.name || customCustomer.trim();
    if (!customer || !service.trim()) return;
    const numericValue = Number(value) || 0;
    const job: Job = {
      id: `j-${Date.now()}`,
      contactId: contact?.id ?? "manual",
      customer,
      service: service.trim(),
      trade,
      value: numericValue,
      stage,
      daysInStage: 0,
      address: address.trim() || contact?.postcode || "—",
      postcode: postcode.trim() || (contact?.postcode?.split(" ")[0] ?? ""),
      notes: notes.trim(),
      quoteValue: numericValue,
      estimatedHours: Number(estimatedHours) || 1,
      assignments: [],
      timeline: [{ type: "note", text: "Job created manually", date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) }],
    };
    onCreate(job);
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New job</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Field label="Contact">
            <select
              value={contactId}
              onChange={(e) => setContactId(e.target.value)}
              className="w-full h-9 rounded-md border-hairline bg-background px-2 text-sm"
            >
              <option value="">— New / one-off customer —</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>

          {!contactId && (
            <Field label="Customer name">
              <Input value={customCustomer} onChange={setCustomCustomer} placeholder="e.g. John Smith" />
            </Field>
          )}

          <Field label="Service">
            <Input value={service} onChange={setService} placeholder="e.g. Boiler service" />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Trade">
              <select
                value={trade}
                onChange={(e) => setTrade(e.target.value as Trade)}
                className="w-full h-9 rounded-md border-hairline bg-background px-2 text-sm"
              >
                {trades.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Stage">
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value as PipelineStage)}
                className="w-full h-9 rounded-md border-hairline bg-background px-2 text-sm"
              >
                {stages.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Value (£)">
              <Input value={value} onChange={setValue} placeholder="0" type="number" />
            </Field>
            <Field label="Estimated hours">
              <Input value={estimatedHours} onChange={setEstimatedHours} placeholder="2" type="number" />
            </Field>
          </div>

          <Field label="Address">
            <Input value={address} onChange={setAddress} placeholder="Street, city" />
          </Field>
          <Field label="Postcode area">
            <Input value={postcode} onChange={setPostcode} placeholder="e.g. BS8" />
          </Field>
          <Field label="Notes">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-md border-hairline bg-background px-2 py-1.5 text-sm resize-none"
              placeholder="Anything important about this job…"
            />
          </Field>
        </div>
        <DialogFooter>
          <Btn variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Btn>
          <Btn variant="primary" onClick={submit}>Create job</Btn>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-xs font-medium text-muted-foreground mb-1">{label}</div>
      {children}
    </label>
  );
}

function Input({
  value, onChange, placeholder, type = "text",
}: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full h-9 rounded-md border-hairline bg-background px-2 text-sm"
    />
  );
}
