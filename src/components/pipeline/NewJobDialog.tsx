import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Btn } from "@/components/layout/PageShell";
import { contacts, type Job, type PipelineStage, type Trade } from "@/data/mockData";
import { useStages } from "@/lib/stagesStore";
import { useJobFieldSchema } from "@/lib/jobFields";
import JobFieldInput from "./JobFieldInput";
import type { VisitType } from "@/lib/visitTypes";

const trades: Trade[] = ["Plumbing", "Electrical", "Window cleaning", "Landscaping", "General"];

export default function NewJobDialog({
  open,
  onOpenChange,
  defaultPipelineId = "sales",
  onCreate,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  defaultPipelineId?: string;
  onCreate: (job: Job) => void;
}) {
  const { pipelines } = useStages();
  const [pipelineId, setPipelineId] = useState<string>(defaultPipelineId);
  const pipelineStages = pipelines.find((p) => p.id === pipelineId)?.stages ?? [];
  const [contactId, setContactId] = useState<string>("");
  const [customCustomer, setCustomCustomer] = useState("");
  const [service, setService] = useState("");
  const [trade, setTrade] = useState<Trade>("General");
  const [value, setValue] = useState<string>("");
  const [estimatedHours, setEstimatedHours] = useState<string>("2");
  const [stage, setStage] = useState<PipelineStage>("New enquiry");
  const [visitType, setVisitType] = useState<VisitType>(defaultPipelineId === "sales" ? "survey" : "work");

  // Keep pipeline/stage in step with the board you opened this from.
  useEffect(() => {
    if (!open) return;
    setPipelineId(defaultPipelineId);
    setVisitType(defaultPipelineId === "sales" ? "survey" : "work");
    const first = pipelines.find((p) => p.id === defaultPipelineId)?.stages[0]?.name;
    if (first) setStage(first as PipelineStage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultPipelineId]);
  const [address, setAddress] = useState("");
  const [postcode, setPostcode] = useState("");
  const [notes, setNotes] = useState("");
  const [schema] = useJobFieldSchema();
  const [customValues, setCustomValues] = useState<Record<string, string | number | boolean>>({});

  const reset = () => {
    setContactId(""); setCustomCustomer(""); setService(""); setTrade("General");
    setValue(""); setEstimatedHours("2");
    setAddress(""); setPostcode(""); setNotes("");
    setCustomValues({});
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
      pipelineId,
      daysInStage: 0,
      address: address.trim() || contact?.postcode || "—",
      postcode: postcode.trim() || (contact?.postcode?.split(" ")[0] ?? ""),
      notes: notes.trim(),
      quoteValue: numericValue,
      estimatedHours: Number(estimatedHours) || 1,
      assignments: [],
      timeline: [{ type: "note", text: "Job created manually", date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) }],
      customFields: Object.keys(customValues).length ? customValues : undefined,
    };
    onCreate(job);
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
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

          <Field label="Pipeline">
            <select
              value={pipelineId}
              onChange={(e) => {
                const id = e.target.value;
                setPipelineId(id);
                setVisitType(id === "sales" ? "survey" : "work");
                const first = pipelines.find((p) => p.id === id)?.stages[0]?.name;
                if (first) setStage(first as PipelineStage);
              }}
              className="w-full h-9 rounded-md border-hairline bg-background px-2 text-sm"
            >
              {pipelines.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>

          <Field label="What happens on site">
            <select
              value={visitType}
              onChange={(e) => setVisitType(e.target.value as VisitType)}
              className="w-full h-9 rounded-md border-hairline bg-background px-2 text-sm"
            >
              <option value="survey">Survey visit — look at it and price it up</option>
              <option value="work">Work — do the job</option>
            </select>
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
                {pipelineStages.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
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

          {schema.length > 0 && (
            <div className="pt-2 mt-2 border-t-hairline space-y-3">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Additional details</div>
              {schema.map((f) => (
                <Field key={f.id} label={f.label + (f.required ? " *" : "")}>
                  <JobFieldInput
                    field={f}
                    value={customValues[f.id]}
                    onChange={(v) => setCustomValues((p) => ({ ...p, [f.id]: v as string | number | boolean }))}
                  />
                </Field>
              ))}
            </div>
          )}
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
