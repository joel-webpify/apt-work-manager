import { useMemo, useRef, useState } from "react";
import { Upload, FileText, X, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import type { Contact } from "@/data/mockData";
import {
  parseCSV,
  autoMap,
  rowsToContacts,
  mergeImportedContacts,
} from "@/lib/contactsStore";

const FIELDS: { key: keyof Contact; label: string; required?: boolean }[] = [
  { key: "email", label: "Email", required: true },
  { key: "name", label: "Name" },
  { key: "phone", label: "Phone" },
  { key: "type", label: "Type" },
  { key: "source", label: "Lead source" },
  { key: "lifecycle", label: "Lifecycle" },
  { key: "postcode", label: "Postcode" },
  { key: "totalSpend", label: "Total spend" },
  { key: "lastJob", label: "Last job" },
  { key: "notes", label: "Notes" },
];

export function ImportContactsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string>("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Partial<Record<keyof Contact, string>>>({});

  const reset = () => {
    setFileName("");
    setHeaders([]);
    setRows([]);
    setMapping({});
  };

  const handleFile = async (file: File) => {
    const text = await file.text();
    const { headers, rows } = parseCSV(text);
    if (!headers.length || !rows.length) {
      toast({ title: "Empty file", description: "No rows found in the CSV." });
      return;
    }
    setFileName(file.name);
    setHeaders(headers);
    setRows(rows);
    setMapping(autoMap(headers));
  };

  const preview = useMemo(() => rowsToContacts(rows.slice(0, 5), mapping), [rows, mapping]);
  const total = useMemo(() => rowsToContacts(rows, mapping), [rows, mapping]);

  const canImport = !!mapping.email && total.length > 0;

  const handleImport = () => {
    mergeImportedContacts(total);
    toast({
      title: "Contacts imported",
      description: `${total.length} contacts merged by email.`,
    });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import contacts</DialogTitle>
          <DialogDescription>
            Upload a CSV. Existing contacts with matching emails will be updated; new ones added.
          </DialogDescription>
        </DialogHeader>

        {!rows.length ? (
          <div
            className="border-2 border-dashed rounded-lg p-10 text-center cursor-pointer hover:bg-muted/50"
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0];
              if (f) handleFile(f);
            }}
          >
            <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm font-medium">Click or drop a .csv file</p>
            <p className="text-xs text-muted-foreground mt-1">
              Headers like Name, Email, Phone, Postcode, Total spend are auto-detected.
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span className="font-medium">{fileName}</span>
                <span className="text-muted-foreground">· {rows.length} rows</span>
              </div>
              <Button variant="ghost" size="sm" onClick={reset}>
                <X className="w-3.5 h-3.5" /> Change file
              </Button>
            </div>

            <div>
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                Map columns
              </Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {FIELDS.map((f) => (
                  <div key={f.key} className="flex items-center gap-2">
                    <Label className="w-28 text-sm">
                      {f.label}
                      {f.required && <span className="text-destructive"> *</span>}
                    </Label>
                    <Select
                      value={mapping[f.key] ?? "__none"}
                      onValueChange={(v) =>
                        setMapping((m) => ({
                          ...m,
                          [f.key]: v === "__none" ? undefined : v,
                        }))
                      }
                    >
                      <SelectTrigger className="h-8 flex-1">
                        <SelectValue placeholder="—" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none">— Skip —</SelectItem>
                        {headers.map((h) => (
                          <SelectItem key={h} value={h}>
                            {h}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                Preview (first {preview.length} of {total.length})
              </Label>
              <div className="border rounded-md mt-2 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Lifecycle</TableHead>
                      <TableHead>Postcode</TableHead>
                      <TableHead className="text-right">Spend</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell>{c.email}</TableCell>
                        <TableCell>{c.phone}</TableCell>
                        <TableCell>{c.type}</TableCell>
                        <TableCell>{c.lifecycle}</TableCell>
                        <TableCell>{c.postcode}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          £{c.totalSpend.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {!mapping.email && (
                <p className="text-xs text-destructive mt-2">
                  Email column is required for merging.
                </p>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!canImport} onClick={handleImport}>
            <Check className="w-3.5 h-3.5" /> Import {total.length || ""} contacts
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
