import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader, PageBody, Btn, Pill } from "@/components/layout/PageShell";
import { Plus, FileText, ArrowRight, Pencil, Code2, Check } from "lucide-react";
import { forms as seedForms, formSubmissions, contacts, type Job } from "@/data/mockData";
import { addJob } from "@/lib/jobsStore";
import { useToast } from "@/hooks/use-toast";
import { FormBuilderDialog, BuilderForm } from "@/components/forms/FormBuilderDialog";
import { EmbedDialog, TrackingConfig, defaultTracking } from "@/components/forms/EmbedDialog";

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
        title="Forms & quote requests"
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
              <button
                onClick={() => setEmbedFor(f)}
                className="mt-3 w-full flex items-center justify-center gap-1.5 h-8 rounded-md border-hairline text-xs font-medium hover:bg-surface-hover transition-colors"
              >
                <Code2 className="w-3 h-3" /> Embed snippet
              </button>
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
              className="grid grid-cols-[2fr_1.5fr_1fr_1.2fr_auto] px-4 h-11 items-center text-sm border-b-hairline last:border-b-0 hover:bg-surface-hover transition-colors"
            >
              <div className="font-medium">{s.contact}</div>
              <div className="text-muted-foreground">{s.service}</div>
              <div className="text-muted-foreground tabular-nums">{s.postcode}</div>
              <div className="text-muted-foreground tabular-nums">{s.date}</div>
              <Btn className="h-7">
                Create job <ArrowRight className="w-3 h-3" />
              </Btn>
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
    </>
  );
}
