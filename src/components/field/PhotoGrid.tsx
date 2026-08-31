import { useRef, useState } from "react";
import { Camera, Trash2, X } from "lucide-react";
import {
  addPhoto,
  autoPhotoLabel,
  fileToDataUrl,
  removePhoto,
  updatePhoto,
  type FieldPhoto,
  type FieldStatus,
  type PhotoLabel,
} from "@/lib/fieldStore";
import { useToast } from "@/hooks/use-toast";

const labels: { id: PhotoLabel; label: string }[] = [
  { id: "before", label: "Before" },
  { id: "during", label: "During" },
  { id: "after", label: "After" },
];

export default function PhotoGrid({
  jobId,
  employeeId,
  photos,
  status,
  readOnly,
}: {
  jobId: string;
  employeeId: string;
  photos: FieldPhoto[];
  status: FieldStatus;
  readOnly?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [viewing, setViewing] = useState<FieldPhoto | null>(null);
  const { toast } = useToast();

  // Where you are in the visit decides the label — no dropdown to remember.
  const autoLabel = autoPhotoLabel(status);

  const pick = async (files: FileList | null) => {
    if (!files) return;
    for (const file of Array.from(files)) {
      try {
        const dataUrl = await fileToDataUrl(file);
        addPhoto(jobId, employeeId, { dataUrl, caption: "", label: autoLabel });
      } catch {
        toast({ title: "Could not add that photo", description: file.name });
      }
    }
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-3">
      {!readOnly && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            className="hidden"
            onChange={(e) => pick(e.target.files)}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-full h-12 rounded-lg bg-primary text-primary-foreground text-sm font-medium inline-flex items-center justify-center gap-2"
          >
            <Camera className="w-4 h-4" /> Take a photo
          </button>
          <p className="text-[11px] text-muted-foreground">
            Saved as a <span className="font-medium capitalize">{autoLabel}</span> photo and time-stamped
            automatically. You can change the label below if it's wrong.
          </p>
        </>
      )}

      {photos.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No photos yet. Before and after shots help with sign-off and reviews.
        </p>
      ) : (
        <div className="space-y-2">
          {photos.map((p) => (
            <div key={p.id} className="flex gap-2.5 items-start">
              <button
                type="button"
                onClick={() => setViewing(p)}
                className="w-20 h-20 rounded-md overflow-hidden border-hairline shrink-0 bg-surface relative"
              >
                <img src={p.dataUrl} alt={p.caption || `${p.label} photo`} className="w-full h-full object-cover" />
                <span className="absolute bottom-0.5 left-0.5 h-4 px-1 rounded bg-background/85 text-[10px] capitalize">
                  {p.label}
                </span>
              </button>
              <div className="flex-1 min-w-0 space-y-1.5">
                <select
                  value={p.label}
                  disabled={readOnly}
                  onChange={(e) => updatePhoto(jobId, employeeId, p.id, { label: e.target.value as PhotoLabel })}
                  className="h-8 w-full rounded-md border-hairline bg-background px-2 text-xs"
                >
                  {labels.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.label}
                    </option>
                  ))}
                </select>
                <input
                  value={p.caption}
                  readOnly={readOnly}
                  onChange={(e) => updatePhoto(jobId, employeeId, p.id, { caption: e.target.value })}
                  placeholder="Add a note about this photo…"
                  className="h-8 w-full rounded-md border-hairline bg-background px-2 text-xs"
                />
                <div className="text-[10px] text-muted-foreground">
                  {new Date(p.at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => removePhoto(jobId, employeeId, p.id)}
                  aria-label="Delete photo"
                  className="w-8 h-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-surface-hover shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {viewing && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setViewing(null)}
        >
          <img src={viewing.dataUrl} alt={viewing.caption || "Job photo"} className="max-h-full max-w-full rounded-lg" />
          <button
            type="button"
            aria-label="Close photo"
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-background/90 flex items-center justify-center"
            onClick={() => setViewing(null)}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
