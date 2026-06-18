import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Btn, Pill } from "@/components/layout/PageShell";
import { ArrowRight, Check, Mail, Phone, MapPin, Calendar } from "lucide-react";
import type { FormSubmission } from "@/data/mockData";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submission: FormSubmission | null;
  formName?: string;
  converted?: boolean;
  onCreateJob?: (s: FormSubmission) => void;
}

export default function SubmissionPreviewDialog({
  open,
  onOpenChange,
  submission,
  formName,
  converted,
  onCreateJob,
}: Props) {
  if (!submission) return null;
  const s = submission;
  const entries = Object.entries(s.values);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-5 py-4 border-b-hairline">
          <DialogTitle className="text-base font-medium flex items-center gap-2">
            {s.contact}
            <Pill tone="success">Submission</Pill>
          </DialogTitle>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
            <span>{formName ?? s.formId}</span>
            <span>·</span>
            <span className="inline-flex items-center gap-1 tabular-nums">
              <Calendar className="w-3 h-3" /> {s.date}
            </span>
            <span>·</span>
            <span className="inline-flex items-center gap-1 tabular-nums">
              <MapPin className="w-3 h-3" /> {s.postcode}
            </span>
          </div>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto px-5 py-4">
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            {entries.map(([label, value]) => {
              const isLong = typeof value === "string" && value.length > 60;
              const icon =
                /email/i.test(label) ? <Mail className="w-3 h-3" /> :
                /phone/i.test(label) ? <Phone className="w-3 h-3" /> :
                /address|postcode/i.test(label) ? <MapPin className="w-3 h-3" /> :
                null;
              return (
                <div
                  key={label}
                  className={`${isLong ? "col-span-2" : ""} border-hairline rounded-md p-3 bg-surface/40`}
                >
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground inline-flex items-center gap-1">
                    {icon}
                    {label}
                  </div>
                  <div className="text-sm mt-1 break-words whitespace-pre-wrap">
                    {String(value) || <span className="text-muted-foreground italic">empty</span>}
                  </div>
                </div>
              );
            })}
            {entries.length === 0 && (
              <div className="col-span-2 text-sm text-muted-foreground text-center py-8">
                No field values captured.
              </div>
            )}
          </div>
        </div>

        <div className="px-5 py-3 border-t-hairline flex items-center justify-between bg-surface/40">
          <div className="text-xs text-muted-foreground">
            {entries.length} field{entries.length === 1 ? "" : "s"} captured
          </div>
          <div className="flex items-center gap-2">
            <Btn onClick={() => onOpenChange(false)}>Close</Btn>
            {converted ? (
              <Btn disabled>
                <Check className="w-3 h-3" /> Created
              </Btn>
            ) : (
              onCreateJob && (
                <Btn variant="primary" onClick={() => { onCreateJob(s); onOpenChange(false); }}>
                  Create job <ArrowRight className="w-3 h-3" />
                </Btn>
              )
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
