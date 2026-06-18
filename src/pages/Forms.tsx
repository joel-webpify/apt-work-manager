import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader, PageBody, Btn, Pill } from "@/components/layout/PageShell";
import { Plus, FileText, ArrowRight, Pencil, Code2, Check, Wand2, Eye } from "lucide-react";
import SubmissionPreviewDialog from "@/components/forms/SubmissionPreviewDialog";
import {
  forms as seedForms,
  formSubmissions,
  contacts,
  type Job,
  type FormSubmission,
} from "@/data/mockData";
import { addJob } from "@/lib/jobsStore";
import { useToast } from "@/hooks/use-toast";
import { FormBuilderDialog, BuilderForm } from "@/components/forms/FormBuilderDialog";
import { EmbedDialog, TrackingConfig, defaultTracking } from "@/components/forms/EmbedDialog";
import FieldMappingDialog from "@/components/forms/FieldMappingDialog";
import { applyMapping, useFormMappingOverrides, guessTarget, type MappingTarget } from "@/lib/formFieldMapping";
import { useJobFieldSchema } from "@/lib/jobFields";

type ListedForm = BuilderForm & { submissions: number; conversionRate: number; tracking: TrackingConfig };

const initialForms: ListedForm[] = seedForms.map((f) => ({
  id: f.id,
  name: f.name,
  trade: f.trade,
  fields: [],
  submissions: f.submissions,
  conversionRate: f.conversionRate,
  tracking: defaultTracking,
}));

export default function Forms() {
  const [forms, setForms] = useState<ListedForm[]>(initialForms);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BuilderForm | undefined>();
  const [embedFor, setEmbedFor] = useState<ListedForm | null>(null);
  const [mappingFor, setMappingFor] = useState<ListedForm | null>(null);
  const [previewFor, setPreviewFor] = useState<FormSubmission | null>(null);
  const [convertedIds, setConvertedIds] = useState<Set<string>>(new Set());
  const navigate = useNavigate();
  const { toast } = useToast();
  const [schema] = useJobFieldSchema();
  const { overrides, setFormMapping } = useFormMappingOverrides();

  const handleCreateJob = (s: FormSubmission) => {
    if (convertedIds.has(s.id)) return;
    const contact = contacts.find((c) => c.name === s.contact);
    const mapped = applyMapping(s.values, schema, overrides[s.formId]);
    const matched = Object.entries(s.values).filter(([label]) => {
      const t = overrides[s.formId]?.[label] ?? guessTarget(label, schema);
      return t !== "ignore";
    }).length;

    const quoteTotal = typeof mapped.core.quoteTotal === "number" ? mapped.core.quoteTotal : undefined;
    const value = quoteTotal ?? (typeof mapped.core.value === "number" ? mapped.core.value : 0);
    const slot = mapped.core.bookingSlot ? String(mapped.core.bookingSlot) : "";
    const products = mapped.core.products ? String(mapped.core.products) : "";

    const job: Job = {
      id: `j-fs-${s.id}-${Date.now()}`,
      contactId: contact?.id ?? "manual",
      customer: String(mapped.core.customer ?? s.contact),
      service: String(mapped.core.service ?? s.service),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      trade: ((mapped.core.trade as any) ?? "General"),
      value,
      stage: "New enquiry",
      daysInStage: 0,
      address: String(mapped.core.address ?? contact?.postcode ?? s.postcode),
      postcode: String(mapped.core.postcode ?? s.postcode).split(" ")[0],
      notes: [
        String(mapped.core.notes ?? `Created from form submission on ${s.date}.`),
        products ? `Products: ${products}` : "",
        slot ? `Preferred slot: ${slot}` : "",
      ].filter(Boolean).join(" · "),
      quoteValue: value,
      estimatedHours: 1,
      assignments: [],
      customFields: mapped.customFields,
      timeline: [
        { type: "note", text: `Form submission converted to job (${s.service})${slot ? ` — slot ${slot}` : ""}`, date: s.date.split(" ")[0] + " " + s.date.split(" ")[1] },
      ],
    };
    addJob(job);
    setConvertedIds((prev) => new Set(prev).add(s.id));
    toast({
      title: "Job created",
      description: `${job.customer} — ${matched} field${matched === 1 ? "" : "s"} mapped from submission.`,
      action: (
        <button
          onClick={() => navigate("/pipeline")}
          className="text-xs font-medium underline underline-offset-2"
        >
          View
        </button>
      ),
    });
  };

  const handleSave = (form: BuilderForm) => {
    setForms((prev) => {
      const idx = prev.findIndex((f) => f.id === form.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], ...form };
        return next;
      }
      return [{ ...form, submissions: 0, conversionRate: 0, tracking: defaultTracking }, ...prev];
    });
  };

  return (
    <>
      <PageHeader
        title="Forms"
        description="Embed forms on your website and capture leads"
        actions={
          <Btn variant="primary" onClick={() => { setEditing(undefined); setOpen(true); }}>
            <Plus className="w-3.5 h-3.5" /> New form
          </Btn>
        }
      />
      <PageBody>
        <div className="grid grid-cols-3 gap-3 mb-6">
          {forms.map((f) => (
            <div
              key={f.id}
              className="border-hairline rounded-lg bg-card p-4 hover:bg-surface-hover transition-colors group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-8 h-8 rounded-md bg-surface flex items-center justify-center">
                  <FileText className="w-4 h-4 text-muted-foreground" strokeWidth={1.75} />
                </div>
                <div className="flex items-center gap-1.5">
                  <Pill tone="success">Live</Pill>
                  <button
                    onClick={() => setMappingFor(f)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-surface"
                    title="Field mapping"
                  >
                    <Wand2 className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => setEmbedFor(f)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-surface"
                    title="Get embed code"
                  >
                    <Code2 className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => { setEditing(f); setOpen(true); }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-surface"
                    title="Edit form"
                  >
                    <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </div>
              </div>
              <div className="text-sm font-medium">{f.name}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{f.trade}</div>
              <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t-hairline">
                <div>
                  <div className="text-xs text-muted-foreground">Submissions</div>
                  <div className="text-base font-medium tabular-nums mt-0.5">{f.submissions}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Conversion</div>
                  <div className="text-base font-medium tabular-nums mt-0.5">{f.conversionRate}%</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3">
                <button
                  onClick={() => setMappingFor(f)}
                  className="flex items-center justify-center gap-1.5 h-8 rounded-md border-hairline text-xs font-medium hover:bg-surface-hover transition-colors"
                >
                  <Wand2 className="w-3 h-3" /> Mapping
                </button>
                <button
                  onClick={() => setEmbedFor(f)}
                  className="flex items-center justify-center gap-1.5 h-8 rounded-md border-hairline text-xs font-medium hover:bg-surface-hover transition-colors"
                >
                  <Code2 className="w-3 h-3" /> Embed
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="border-hairline rounded-lg bg-card">
          <div className="px-4 h-11 flex items-center justify-between border-b-hairline">
            <span className="text-sm font-medium">Recent submissions</span>
            <span className="text-xs text-muted-foreground">{formSubmissions.length} this week</span>
          </div>
          <div className="grid grid-cols-[2fr_1.5fr_1fr_1.2fr_auto] px-4 h-9 items-center text-xs text-muted-foreground font-medium border-b-hairline bg-surface/50">
            <div>Contact</div>
            <div>Service</div>
            <div>Postcode</div>
            <div>Date</div>
            <div></div>
          </div>
          {formSubmissions.map((s) => (
            <div
              key={s.id}
              role="button"
              tabIndex={0}
              onClick={() => setPreviewFor(s)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setPreviewFor(s); } }}
              className="grid grid-cols-[2fr_1.5fr_1fr_1.2fr_auto] px-4 h-11 items-center text-sm border-b-hairline last:border-b-0 hover:bg-surface-hover transition-colors cursor-pointer"
            >
              <div className="font-medium">{s.contact}</div>
              <div className="text-muted-foreground">{s.service}</div>
              <div className="text-muted-foreground tabular-nums">{s.postcode}</div>
              <div className="text-muted-foreground tabular-nums">{s.date}</div>
              <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setPreviewFor(s)}
                  className="h-7 w-7 inline-flex items-center justify-center rounded-md border-hairline hover:bg-surface-hover transition-colors"
                  title="Preview submission"
                >
                  <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
                {convertedIds.has(s.id) ? (
                  <Btn className="h-7" disabled>
                    <Check className="w-3 h-3" /> Created
                  </Btn>
                ) : (
                  <Btn className="h-7" onClick={() => handleCreateJob(s)}>
                    Create job <ArrowRight className="w-3 h-3" />
                  </Btn>
                )}
              </div>
            </div>
          ))}
        </div>
      </PageBody>

      <FormBuilderDialog
        open={open}
        onOpenChange={setOpen}
        initial={editing}
        onSave={handleSave}
      />

      {embedFor && (
        <EmbedDialog
          open={!!embedFor}
          onOpenChange={(o) => !o && setEmbedFor(null)}
          formId={embedFor.id}
          formName={embedFor.name}
          tracking={embedFor.tracking}
          onTrackingChange={(cfg) => {
            setForms((prev) => prev.map((f) => (f.id === embedFor.id ? { ...f, tracking: cfg } : f)));
            setEmbedFor((prev) => (prev ? { ...prev, tracking: cfg } : prev));
          }}
        />
      )}

      {mappingFor && (
        <FieldMappingDialog
          open={!!mappingFor}
          onOpenChange={(o) => !o && setMappingFor(null)}
          form={mappingFor}
          sampleLabels={Array.from(
            new Set(
              formSubmissions
                .filter((s) => s.formId === mappingFor.id)
                .flatMap((s) => Object.keys(s.values)),
            ),
          )}
          initial={overrides[mappingFor.id]}
          onSave={(formId, mapping) => {
            setFormMapping(formId, mapping);
            toast({ title: "Mapping saved", description: `Updated field mapping for ${mappingFor.name}.` });
          }}
        />
      )}
      <SubmissionPreviewDialog
        open={!!previewFor}
        onOpenChange={(o) => !o && setPreviewFor(null)}
        submission={previewFor}
        formName={previewFor ? forms.find((f) => f.id === previewFor.formId)?.name : undefined}
        converted={previewFor ? convertedIds.has(previewFor.id) : false}
        onCreateJob={handleCreateJob}
      />
    </>
  );
}
